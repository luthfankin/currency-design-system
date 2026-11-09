"""Generates the Figma scripts for the Phosphor (Regular) icon library.

Reads SVGs from tools/figma/.cache/package (npm pack @phosphor-icons/core@2.1.1) and writes:
  out/icons-build-N.js  — creates the Iconography page (first chunk) and the icon components
  out/icons-swap.js     — replaces old UI icons inside components with the Phosphor ones
usage: python3 make_icon_scripts.py
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, '.cache/package/assets/regular')
OUT = os.path.join(HERE, 'out')
os.makedirs(OUT, exist_ok=True)

# old icon (component or component-set name in the Mobile Currency library) -> Phosphor icon
MAP = {
    '_icon/add': 'plus', 'ads_click': 'cursor-click', 'verified': 'seal-check', 'hourglass_bottom': 'hourglass',
    'chevron-right': 'caret-right', 'chevron_right': 'caret-right', 'arrow_forward_ios': 'caret-right', 'tungsten': 'lightbulb',
    'bi:info-circle-fill': 'info', 'info': 'info', 'Icon/Font Awesome Free/Solid/I/info-circle': 'info',
    'mail': 'envelope-simple', 'email': 'envelope-simple', 'check-circle-fill': 'check-circle',
    'Icon/Font Awesome Free/Solid/C/check-circle': 'check-circle', 'fingerprint': 'fingerprint',
    'arrow_drop_down': 'caret-down', 'expand_more': 'caret-down', 'select': 'caret-down', 'highlight_off': 'x-circle',
    'Icon/Font Awesome Free/Solid/T/times-circle': 'x-circle', 'contact': 'address-book', 'calendar_today': 'calendar-blank',
    'Icon/Font Awesome Free/Brands/S/sistrix': 'magnifying-glass', 'Icon/Font Awesome Free/Solid/E/exclamation-circle': 'warning-circle',
    'Icon/Font Awesome Free/Solid/Q/question-circle': 'question', 'bi:arrow-right-circle': 'arrow-circle-right',
    'phone_enabled': 'phone', 'whatsapp': 'whatsapp-logo', 'copy': 'copy', 'credit_card': 'credit-card', 'pan_tool': 'hand',
    'payment': 'money', 'more_vert': 'dots-three-vertical', 'account_circle': 'user-circle', 'star_border_purple500': 'star',
    'remove_red_eye': 'eye', 'arrow_back': 'arrow-left', 'notifications': 'bell', 'priority_high': 'exclamation-mark',
    'arrow_forward': 'arrow-right', 'link': 'link', 'color_lens': 'palette', 'wallet icon': 'wallet',
    'accessibility': 'person-arms-spread', '_keyboard-icon/operation/backspace': 'backspace', '_keyboard-icon/operation/divide': 'divide',
}
CORE = '''house house-line squares-four list qr-code scan barcode arrows-left-right arrow-up-right arrow-down-left paper-plane-tilt
receipt bank coins currency-circle-dollar piggy-bank hand-coins gift ticket tag percent shopping-cart storefront device-mobile
wifi-high lightning drop gear sliders-horizontal funnel x check plus-circle minus minus-circle arrow-up arrow-down caret-up caret-left
caret-double-right arrow-clockwise arrows-clockwise share-network download-simple upload-simple export trash pencil-simple lock lock-open
shield-check key eye-slash user users user-plus identification-card sign-out sign-in headset chat-circle chat-circle-dots bell-ringing clock
clock-counter-clockwise calendar-check map-pin globe translate camera image file-text clipboard-text note bookmark-simple heart thumbs-up
megaphone smiley warning spinner dots-three arrow-square-out link-simple envelope phone-call at password wallet money credit-card'''.split()

names = sorted(set(MAP.values()) | set(CORE))
missing = [n for n in names if not os.path.exists(os.path.join(ASSETS, n + '.svg'))]
assert not missing, missing
icons = [[n, re.findall(r'<path d="([^"]+)"', open(os.path.join(ASSETS, n + '.svg')).read())] for n in names]

BUILD = r'''// Phosphor (Regular) icon components on the "Iconography" page — chunk CHUNK_NO. Idempotent per icon name.
const ICONS = ICON_DATA;
const START = START_INDEX;
let page = figma.root.children.find((p) => p.name === 'Iconography');
if (!page) { // create it right after the Elevation page, inside Foundations
  page = figma.createPage(); page.name = 'Iconography';
  const elev = figma.root.children.findIndex((p) => p.name === 'Elevation');
  figma.root.insertChild(elev + 1, page);
}
await figma.setCurrentPageAsync(page);
const iconVar = (await figma.variables.getLocalVariablesAsync()).find((v) => v.name === 'color/icon/primary');
const titleCase = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
const pascal = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join('');
const camel = (s) => { const p = pascal(s); return p[0].toLowerCase() + p.slice(1); };
const COLS = 14, CELL = 72, OX = 80, OY = 320;
const made = [];
let i = START;
for (const [id, paths] of ICONS) {
  const name = 'Icon/' + titleCase(id);
  const existing = page.findOne((n) => n.type === 'COMPONENT' && n.name === name);
  if (existing) existing.remove();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 256 256">${paths.map((d) => `<path d="${d}"/>`).join('')}</svg>`;
  const frame = figma.createNodeFromSvg(svg);
  const comp = figma.createComponent();
  comp.resize(24, 24); comp.fills = []; comp.clipsContent = false;
  const vector = paths.length === 1 ? frame.children[0] : figma.flatten(frame.children, frame);
  comp.appendChild(vector);
  vector.name = 'Vector'; // keeps Phosphor's own position/size inside the 24×24 box (its built-in padding)
  vector.constraints = { horizontal: 'SCALE', vertical: 'SCALE' };
  vector.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', iconVar)];
  frame.remove();
  comp.name = name;
  comp.description = `Phosphor "${id}" (Regular). iOS: Ph.${camel(id)}.regular · Android: PhosphorIcons.Regular.${pascal(id)} · Web: <${pascal(id)} weight="regular" />`;
  page.appendChild(comp);
  comp.x = OX + (i % COLS) * CELL; comp.y = OY + Math.floor(i / COLS) * CELL;
  made.push(comp.id); i++;
}
return { chunk: CHUNK_NO, made: made.length, next: i, pageId: page.id };
'''
size, start = 60, 0
for n, ch in enumerate([icons[i:i + size] for i in range(0, len(icons), size)], 1):
    code = BUILD.replace('ICON_DATA', json.dumps(ch, separators=(',', ':'))).replace('START_INDEX', str(start)).replace('CHUNK_NO', str(n))
    open(os.path.join(OUT, f'icons-build-{n}.js'), 'w').write(code)
    start += len(ch)
    print(f'icons-build-{n}.js', len(ch), 'icons', len(code), 'bytes')

SWAP = r'''// Replaces old UI icons with Phosphor icon components on the pages in PAGES (define PAGES before this code).
// Keeps each instance's size and its (tokenized) color. Logos, flags, illustrations and DOKU product icons are not in MAP, so they stay.
const MAP = MAP_JSON;
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
'''
open(os.path.join(OUT, 'icons-swap.js'), 'w').write(SWAP.replace('MAP_JSON', json.dumps(MAP, separators=(',', ':'), ensure_ascii=False)))
print('icons:', len(names), '| mapped from old components:', len(set(MAP.values())))
