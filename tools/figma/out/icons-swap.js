// Replaces old UI icons with Phosphor icon components on the pages in PAGES (define PAGES before this code).
// Keeps each instance's size and its (tokenized) color. Logos, flags, illustrations and DOKU product icons are not in MAP, so they stay.
const MAP = {"_icon/add":"plus","ads_click":"cursor-click","verified":"seal-check","hourglass_bottom":"hourglass","chevron-right":"caret-right","chevron_right":"caret-right","arrow_forward_ios":"caret-right","tungsten":"lightbulb","bi:info-circle-fill":"info","info":"info","Icon/Font Awesome Free/Solid/I/info-circle":"info","mail":"envelope-simple","email":"envelope-simple","check-circle-fill":"check-circle","Icon/Font Awesome Free/Solid/C/check-circle":"check-circle","fingerprint":"fingerprint","arrow_drop_down":"caret-down","expand_more":"caret-down","select":"caret-down","highlight_off":"x-circle","Icon/Font Awesome Free/Solid/T/times-circle":"x-circle","contact":"address-book","calendar_today":"calendar-blank","Icon/Font Awesome Free/Brands/S/sistrix":"magnifying-glass","Icon/Font Awesome Free/Solid/E/exclamation-circle":"warning-circle","Icon/Font Awesome Free/Solid/Q/question-circle":"question","bi:arrow-right-circle":"arrow-circle-right","phone_enabled":"phone","whatsapp":"whatsapp-logo","copy":"copy","credit_card":"credit-card","pan_tool":"hand","payment":"money","more_vert":"dots-three-vertical","account_circle":"user-circle","star_border_purple500":"star","remove_red_eye":"eye","arrow_back":"arrow-left","notifications":"bell","priority_high":"exclamation-mark","arrow_forward":"arrow-right","link":"link","color_lens":"palette","wallet icon":"wallet","accessibility":"person-arms-spread","_keyboard-icon/operation/backspace":"backspace","_keyboard-icon/operation/divide":"divide"};
const titleCase = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const iconsPage = figma.root.children.find((p) => p.name === 'Iconography');
await iconsPage.loadAsync();
const ICON = Object.fromEntries(iconsPage.findAllWithCriteria({ types: ['COMPONENT'] }).map((c) => [c.name, c]));
const target = (oldName) => MAP[oldName] && ICON['Icon/' + titleCase(MAP[oldName])];
const report = { swapped: 0, propDefaults: 0, unmapped: {} };
const ICONISH = /icon|^ic[_ -]|_icon|arrow|chevron|caret|close|info|check|star|bell|copy|phone|mail|calendar|search|eye|more|plus|add/i;
async function ownerName(inst) {
  const mc = await inst.getMainComponentAsync();
  if (!mc) return null;
  return mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent.name : mc.name;
}
async function visit(node) {
  if (node.type === 'INSTANCE') {
    const name = await ownerName(node);
    const t = name && target(name);
    if (t) {
      const old = node.findOne((n) => 'fills' in n && Array.isArray(n.fills) && n.fills.some((f) => f.type === 'SOLID' && f.visible !== false) && n.type !== 'FRAME');
      const paint = old ? old.fills.find((f) => f.type === 'SOLID' && f.visible !== false) : null;
      const w = node.width, h = node.height;
      node.swapComponent(t);
      const s = Math.min(w, h); node.resize(s, s);
      const vec = node.findOne((n) => n.name === 'Vector');
      if (vec && paint) vec.fills = [paint];
      report.swapped++;
      return;
    }
    if (name && ICONISH.test(name) && Math.max(node.width, node.height) <= 40) report.unmapped[name] = (report.unmapped[name] || 0) + 1;
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
        const nm = cur && (cur.parent && cur.parent.type === 'COMPONENT_SET' ? cur.parent.name : cur.name);
        const t = nm && target(nm);
        if (t) { n.editComponentProperty(k, { defaultValue: t.id }); report.propDefaults++; }
      }
    }
    await visit(n);
  }
}
return report;
