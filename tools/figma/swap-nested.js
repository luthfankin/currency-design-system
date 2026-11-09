// Points nested Mobile Currency library parts at the new LOCAL Currency 2.0 components (define PAGES before this code).
// Matching: old name -> new name (MAP); the remote set must have the same number of variants as the local set, and
// variants map by index (the migration engine created local variants in the library's order). Overrides are kept.
// Also updates instance-swap property defaults that still point at library parts.
const MAP = {
  'button': 'Button', 'Avatar': 'Avatar', 'Badge': 'Badge', 'Checkbox': 'Checkbox', 'Collateral Message': 'Collateral Message',
  'Body Content': 'Body Content', '_section-content': '_Section Content', 'Denom': 'Denomination', '.denom-atom': '_Denomination Item',
  'Input Form': 'Input Field', 'Input Area': 'Text Area', 'PIN input': 'PIN Input', 'Password input': 'Password Input',
  '_master_pin-password-input': '_PIN Dot', 'flag': '_Flag', 'Select Form': 'Select Field', 'Dropdown List': 'Dropdown List',
  '_list-option': '_List Option', 'Toast': 'Toast', 'Toggle': 'Toggle', 'Keyboard Number': 'Number Keypad',
  'Base Bottom Sheet': 'Base Bottom Sheet', 'Bottom Sheet': 'Bottom Sheet', 'Bottom Sheet With Overlay': 'Bottom Sheet With Overlay',
  'slotComponent': '_Slot', '_Modal Action': '_Modal Action', 'Radio Button': 'Radio Button', '_master_checkbox': '_Radio Control',
  'Biller Menu': 'Biller Menu', 'switch': 'Pill Switch', '_pill': 'Pill', '_filter-pill': 'Filter Pill', 'Info Promo': 'Info Promo',
  'Carousel Indicator': 'Carousel Indicator', 'Filter': 'Filter', 'Stepper Horizontal': 'Stepper', 'Pill Tabs': 'Pill Tabs',
  'Topbar': 'Top Bar', 'Alert': 'Alert', 'Popover': 'Popover',
};
// index of local Currency 2.0 components across all pages (read-only load)
const LOCALS = {};
for (const p of figma.root.children) {
  if (p.name.startsWith('---') || ['Cover', 'Color', 'Typography', 'Spacing', 'Radius & Border', 'Elevation', 'Iconography', 'Migration map'].includes(p.name)) continue;
  await p.loadAsync();
  for (const n of p.children) if ((n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && !n.remote) LOCALS[n.name] = n;
}
const report = { swapped: 0, propDefaults: 0, mismatched: {}, byName: {} };
function localFor(mc) {
  const set = mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : null;
  const oldName = set ? set.name : mc.name;
  const target = MAP[oldName] && LOCALS[MAP[oldName]];
  if (!target) return null;
  if (set) {
    if (target.type !== 'COMPONENT_SET' || target.children.length !== set.children.length) { report.mismatched[oldName] = `${set.children.length} vs ${target.children ? target.children.length : 1}`; return null; }
    return target.children[set.children.indexOf(mc)];
  }
  return target.type === 'COMPONENT' ? target : null;
}
async function visit(node) {
  if (node.type === 'INSTANCE') {
    const mc = await node.getMainComponentAsync();
    if (mc && mc.remote) {
      const t = localFor(mc);
      if (t) { node.swapComponent(t); report.swapped++; const k = MAP[(mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc).name]; report.byName[k] = (report.byName[k] || 0) + 1; }
    }
  }
  if ('children' in node) for (const c of [...node.children]) await visit(c);
}
for (const pageName of PAGES) {
  const page = figma.root.children.find((p) => p.name === pageName);
  await figma.setCurrentPageAsync(page);
  for (const n of [...page.children]) {
    if (n.type === 'COMPONENT_SET' || (n.type === 'COMPONENT' && n.parent.type !== 'COMPONENT_SET')) {
      for (const [k, d] of Object.entries(n.componentPropertyDefinitions)) {
        if (d.type !== 'INSTANCE_SWAP') continue;
        const cur = await figma.getNodeByIdAsync(d.defaultValue);
        if (cur && cur.remote && cur.type === 'COMPONENT') { const t = localFor(cur); if (t) { n.editComponentProperty(k, { defaultValue: t.id }); report.propDefaults++; } }
      }
    }
    await visit(n);
  }
}
return report;
