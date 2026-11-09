// ===== Currency migration engine (runs in the NEW file only) =====
// Imports a published "Mobile Currency" component (read-only), turns it into a LOCAL component with clean names,
// re-creates its component properties, and re-links every visual value (own layers AND layers inside nested
// instances, as overrides) to Currency 2.0 tokens. Never touches the old file or its library.
// Usage: `const JOB = { key, isSet, page, name, row?, props?, values?, desc?, via? };` then this file.
//   via = { key, isSet, name }  → migrate the unpublished part `name` found nested inside a published parent.

const vars = await figma.variables.getLocalVariablesAsync();
const V = Object.fromEntries(vars.map((v) => [v.name, v]));
const LOCAL = new Set(vars.map((v) => v.id));
const TS = Object.fromEntries((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
const MYSTYLES = new Set(Object.values(TS).map((s) => s.id));
const ES = Object.fromEntries((await figma.getLocalEffectStylesAsync()).map((s) => [s.name, s]));
for (const s of ['Regular', 'Medium', 'Semi Bold', 'Bold']) await figma.loadFontAsync({ family: 'Inter', style: s });

// ---------- color math (OKLab) ----------
const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
function lab({ r, g, b }) {
  [r, g, b] = [lin(r), lin(g), lin(b)];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
function resolveColor(v) { let val = Object.values(v.valuesByMode)[0]; while (val && val.type === 'VARIABLE_ALIAS') val = Object.values(vars.find((x) => x.id === val.id).valuesByMode)[0]; return val; }
const colorVars = vars.filter((v) => v.resolvedType === 'COLOR' && !v.name.startsWith('color/alpha')).map((v) => ({ v, lab: lab(resolveColor(v)) }));
const prims = colorVars.filter((x) => /^color\/(red|blue|cyan|turquoise|green|orange|lime|neutral|success|warning|error|info)\//.test(x.v.name));
const STATUS = /error|invalid|failed|wrong|salah|gagal/i, SUCC = /success|berhasil|sukses|verified/i, WARN = /warning|pending|process|proses|hourglass/i, INFO = /\binfo/i;

// Legacy Currency 1.x palette -> new primitive (same table as the Migration map page)
const LEGACY = LEGACY_JSON;
const LEGACY_LAB = Object.entries(LEGACY).map(([h, p]) => [lab({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 }), p]);
const aliasOf = (v) => { const x = Object.values(v.valuesByMode)[0]; return x && x.type === 'VARIABLE_ALIAS' ? x.id : null; };

// 1) new primitive: exact legacy swatch (tiny tolerance) or nearest primitive
// 2) prefer a semantic token of the right role that points to that primitive, or matches the original closely
// 3) otherwise bind the primitive itself
function tokenFor(color, role, ctx) {
  const L = lab(color);
  let P = null;
  for (const [ll, p] of LEGACY_LAB) if (dist(L, ll) < 0.012) { P = V['color/' + p]; break; }
  if (!P) { let bd = 1; for (const x of prims) { const d = dist(L, x.lab); if (d < bd) { bd = d; P = x.v; } } }
  let pool = colorVars.filter((x) => x.v.name.startsWith(`color/${role}/`) && !/pressed|overlay/.test(x.v.name));
  if (!/disabled/i.test(ctx)) pool = pool.filter((x) => !/disabled/.test(x.v.name));
  if (!STATUS.test(ctx)) pool = pool.filter((x) => !/error/.test(x.v.name));
  if (!SUCC.test(ctx)) pool = pool.filter((x) => !/success/.test(x.v.name));
  if (!WARN.test(ctx)) pool = pool.filter((x) => !/warning/.test(x.v.name));
  if (!INFO.test(ctx)) pool = pool.filter((x) => !/\/info/.test(x.v.name));
  let pick = pool.find((x) => /disabled/i.test(ctx) && /disabled/.test(x.v.name) && aliasOf(x.v) === P.id) || pool.find((x) => aliasOf(x.v) === P.id);
  if (!pick) { let bd = 0.035; for (const x of pool) { const d = dist(L, x.lab); if (d < bd) { bd = d; pick = x; } } }
  let out = pick ? pick.v : P;
  if (/pressed/i.test(ctx) && role === 'bg' && out.name === 'color/bg/brand') out = V['color/bg/brand-pressed'];
  return out;
}
// artwork keeps its own colors and corners: flags, logos, bank / e-money marks, illustrations, photos
const ART = /flag|logo|ilustrasi|illustration|emoney|e-money|bank\/|^cc\/|bitmap|image|photo|avatar|qris|minimarket|wallpaper/i;
function rebindPaints(paints, role, ctx) {
  if (!Array.isArray(paints)) return paints;
  return paints.map((p) => {
    if (p.type !== 'SOLID' || (p.boundVariables?.color && LOCAL.has(p.boundVariables.color.id))) return p;
    const dark = p.color.r + p.color.g + p.color.b < 0.15;
    if (role === 'bg' && dark && p.opacity < 0.2) return { ...figma.variables.setBoundVariableForPaint({ ...p }, 'color', V['color/bg/pressed']), opacity: 1 };
    if (role === 'bg' && dark && p.opacity < 0.95) return { ...figma.variables.setBoundVariableForPaint({ ...p }, 'color', V['color/bg/overlay']), opacity: 1 };
    return figma.variables.setBoundVariableForPaint({ ...p }, 'color', tokenFor(p.color, role, ctx));
  });
}

// ---------- type, spacing, radius, stroke, elevation ----------
const W = (style) => (/bold/i.test(style) && !/semi/i.test(style) ? 'bold' : /semi/i.test(style) ? 'semibold' : /medium/i.test(style) ? 'medium' : 'regular');
let LABEL_CTX = false;
function textStyleFor(size, weight) {
  const s = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36].reduce((a, b) => (Math.abs(b - size) < Math.abs(a - size) ? b : a));
  if (size >= 34) return 'display/lg';
  if (s >= 32) return 'display/md';
  if (s === 28) return 'display/sm';
  if (s === 24) return 'heading/lg';
  if (s === 20) return 'heading/md';
  if (s === 18) return 'heading/sm';
  if (s === 10) return weight === 'semibold' || weight === 'bold' ? 'caption/semibold' : 'caption/regular';
  const k = s === 16 ? 'lg' : s === 14 ? 'md' : 'sm';
  if ((weight === 'semibold' || weight === 'bold') && LABEL_CTX) return `label/${k}`;
  return `body/${k}/${weight}`;
}
const SPACE = [['spacing/none', 0], ['spacing/3xs', 2], ['spacing/2xs', 4], ['spacing/xs', 8], ['spacing/sm', 12], ['spacing/md', 16], ['spacing/lg', 20], ['spacing/xl', 24], ['spacing/2xl', 32], ['spacing/3xl', 40], ['spacing/4xl', 48], ['spacing/5xl', 64]];
const RADIUS = [['radius/none', 0], ['radius/xs', 4], ['radius/sm', 8], ['radius/md', 12], ['radius/lg', 16], ['radius/xl', 24]];
const nearest = (list, v) => list.reduce((a, b) => (Math.abs(b[1] - v) < Math.abs(a[1] - v) ? b : a));
function radiusVar(r, node) {
  if (r <= 0) return null;
  if (r >= 40 || r >= Math.min(node.width, node.height) / 2 - 0.5) return V['radius/full'];
  return V[nearest(RADIUS, r)[0]];
}
function elevationFor(effects) {
  const drops = effects.filter((e) => e.type === 'DROP_SHADOW' && e.visible !== false);
  if (!drops.length) return null;
  const big = drops.reduce((a, b) => (b.radius > a.radius ? b : a));
  if (big.offset.y < 0) return ES['elevation/sheet'];
  const score = (lvl) => { const l = ES[lvl].effects[1]; return Math.abs(l.offset.y - big.offset.y) + Math.abs(l.radius - big.radius); };
  return ES[['elevation/1', 'elevation/2', 'elevation/3', 'elevation/4'].reduce((a, b) => (score(b) < score(a) ? b : a))];
}

const stats = { fills: 0, strokes: 0, text: 0, spacing: 0, radius: 0, stroke: 0, effects: 0, art: 0 };
async function rebindOne(node, ctx) {
  const isText = node.type === 'TEXT';
  const isShape = ['VECTOR', 'BOOLEAN_OPERATION', 'STAR', 'POLYGON', 'LINE', 'ELLIPSE', 'RECTANGLE'].includes(node.type);
  const thin = Math.min(node.width, node.height) <= 2;
  const iconish = isShape && !thin && node.type !== 'RECTANGLE' && Math.max(node.width, node.height) <= 32;
  if ('fills' in node && node.fills !== figma.mixed && node.fills.length && !isText) {
    node.fills = rebindPaints(node.fills, thin ? 'border' : iconish ? 'icon' : 'bg', ctx); stats.fills++;
  }
  if ('strokes' in node && node.strokes.length) {
    node.strokes = rebindPaints(node.strokes, iconish ? 'icon' : 'border', ctx); stats.strokes++;
    if (!iconish && typeof node.strokeWeight === 'number' && node.strokeWeight > 0) {
      node.setBoundVariable('strokeWeight', V[node.strokeWeight >= 1.75 ? 'border-width/thick' : 'border-width/thin']); stats.stroke++;
    }
  }
  if (isText) {
    LABEL_CTX = /button|tab|chip|pill|label|badge/i.test(ctx);
    const segs = node.getStyledTextSegments(['fontName', 'fontSize', 'fills', 'textStyleId']);
    for (const f of new Set(segs.map((s) => JSON.stringify(s.fontName)))) await figma.loadFontAsync(JSON.parse(f));
    for (const s of segs) {
      if (!(s.textStyleId && MYSTYLES.has(s.textStyleId))) await node.setRangeTextStyleIdAsync(s.start, s.end, TS[textStyleFor(s.fontSize, W(s.fontName.style))].id);
      if (Array.isArray(s.fills) && s.fills.length) node.setRangeFills(s.start, s.end, rebindPaints(s.fills, 'text', ctx));
    }
    stats.text++;
  }
  if ('layoutMode' in node && node.layoutMode !== 'NONE') {
    for (const k of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft']) if (node[k] > 0 && node[k] <= 72) { node.setBoundVariable(k, V[nearest(SPACE, node[k])[0]]); stats.spacing++; }
    if (node.primaryAxisAlignItems !== 'SPACE_BETWEEN' && node.itemSpacing > 0 && node.itemSpacing <= 72) { node.setBoundVariable('itemSpacing', V[nearest(SPACE, node.itemSpacing)[0]]); stats.spacing++; }
  }
  if ('cornerRadius' in node && !isText) {
    const corners = ['topLeftRadius', 'topRightRadius', 'bottomRightRadius', 'bottomLeftRadius'];
    if (corners.every((c) => c in node)) for (const c of corners) { const rv = radiusVar(node[c], node); if (rv) { node.setBoundVariable(c, rv); stats.radius++; } }
  }
  if ('effects' in node && node.effects.length && !node.effectStyleId) {
    const es = elevationFor(node.effects);
    if (es) { await node.setEffectStyleIdAsync(es.id); stats.effects++; }
  }
}
const skipped = [];
async function rebind(node, ctx) {
  ctx = ctx + ' ' + node.name;
  if (node.type !== 'TEXT' && ART.test(node.name)) { stats.art++; return; } // text is never artwork (e.g. a "QRIS" label)
  try { await rebindOne(node, ctx); } catch (e) { skipped.push(node.name + ': ' + String(e).slice(0, 60)); }
  // descend into nested instances too (their layers take overrides), so nothing keeps old library values
  if ('children' in node) for (const c of node.children) await rebind(c, ctx);
}

// ---------- names ----------
const cleanWord = (s) => s.replace(/[✏↪🔷?]|️/gu, '').replace(/^[:\s_.]+/, '').trim();
const title = (s) => cleanWord(s).replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/\b\w/g, (c) => c.toUpperCase());
const propName = (k) => (JOB.props && JOB.props[k.split('#')[0]]) || title(k.split('#')[0]);
const valName = (v) => (JOB.values && JOB.values[v]) || title(v);

if (JOB.passOnly) { // re-link everything already on the listed pages (no import)
  const out = {};
  for (const name of JOB.pages) {
    const page = figma.root.children.find((p) => p.name === name);
    await figma.setCurrentPageAsync(page);
    for (const k of Object.keys(stats)) stats[k] = 0;
    for (const n of page.children) await rebind(n, n.name);
    out[name] = { ...stats };
  }
  return { pass: out, skipped: skipped.slice(0, 10), skippedCount: skipped.length };
}

// ---------- import + convert ----------
const page = figma.root.children.find((p) => p.name === JOB.page);
await figma.setCurrentPageAsync(page);
const old = page.findOne((n) => (n.type === 'COMPONENT_SET' || n.type === 'COMPONENT') && n.name === JOB.name && n.parent === page);
const oldPos = old ? { x: old.x, y: old.y } : null;
if (old) old.remove(); // idempotent re-run
async function findRemote() {
  if (!JOB.via) return JOB.isSet ? await figma.importComponentSetByKeyAsync(JOB.key) : await figma.importComponentByKeyAsync(JOB.key);
  const parent = JOB.via.isSet ? await figma.importComponentSetByKeyAsync(JOB.via.key) : await figma.importComponentByKeyAsync(JOB.via.key);
  const stack = [parent];
  while (stack.length) {
    const n = stack.pop();
    if (n.type === 'INSTANCE') {
      const mc = await n.getMainComponentAsync();
      const owner = mc && mc.parent && mc.parent.type === 'COMPONENT_SET' ? mc.parent : mc;
      if (owner && owner.name === JOB.via.name) return owner;
      if (mc) stack.push(mc);
    }
    if ('children' in n) stack.push(...n.children);
  }
  throw new Error('nested part not found: ' + JOB.via.name);
}
const remote = await findRemote();
JOB.isSet = remote.type === 'COMPONENT_SET';
const remoteVariants = JOB.isSet ? remote.children : [remote];
const defs = remote.componentPropertyDefinitions;
const refJobs = [];
function collectRefs(a, b) {
  if (a.componentPropertyReferences && Object.keys(a.componentPropertyReferences).length) refJobs.push([b, a.componentPropertyReferences]);
  if (a.type === 'INSTANCE' || !('children' in a)) return;
  a.children.forEach((c, i) => b.children[i] && collectRefs(c, b.children[i]));
}
const comps = [];
for (const rv of remoteVariants) {
  const frame = rv.createInstance().detachInstance();
  page.appendChild(frame);
  rv.children.forEach((c, i) => frame.children[i] && collectRefs(c, frame.children[i]));
  const comp = figma.createComponentFromNode(frame);
  comp.name = JOB.isSet ? Object.entries(rv.variantProperties).map(([k, v]) => `${propName(k)}=${valName(v)}`).join(', ') : JOB.name;
  comps.push(comp);
}
const root = JOB.isSet ? figma.combineAsVariants(comps, page) : comps[0];
root.name = JOB.name;
if (JOB.desc) root.description = JOB.desc;
const propMap = {};
for (const [k, d] of Object.entries(defs)) {
  if (d.type === 'VARIANT') continue;
  try { propMap[k] = root.addComponentProperty(propName(k), d.type, d.defaultValue); } catch (e) { propMap[k] = null; }
}
let refsSet = 0;
for (const [node, refs] of refJobs) {
  const m = {};
  for (const [field, k] of Object.entries(refs)) if (propMap[k]) m[field] = propMap[k];
  try { node.componentPropertyReferences = m; refsSet++; } catch (e) {}
}
await rebind(root, JOB.name);
if (JOB.isSet) { // one row per value of JOB.row (default: first property), columns = the rest
  const kids = [...root.children], gap = 32, vp = (k) => k.variantProperties, keys = Object.keys(vp(kids[0]));
  const rowKey = JOB.row && keys.includes(JOB.row) ? JOB.row : keys[0];
  const rows = [...new Set(kids.map((k) => vp(k)[rowKey]))];
  const colOf = (k) => keys.filter((x) => x !== rowKey).map((x) => vp(k)[x]).join('|');
  const cols = [...new Set(kids.map(colOf))];
  const cw = Math.max(...kids.map((k) => k.width)), ch = Math.max(...kids.map((k) => k.height));
  for (const k of kids) { k.x = gap + cols.indexOf(colOf(k)) * (cw + gap); k.y = gap + rows.indexOf(vp(k)[rowKey]) * (ch + gap); }
  root.resizeWithoutConstraints(gap + cols.length * (cw + gap), gap + rows.length * (ch + gap));
}
if (oldPos) { root.x = oldPos.x; root.y = oldPos.y; } else {
  const others = page.children.filter((n) => n !== root);
  root.x = 0; root.y = others.length ? Math.max(...others.map((n) => n.y + n.height)) + 160 : 0;
}
return { id: root.id, name: root.name, variants: JOB.isSet ? root.children.length : 1, props: Object.keys(root.componentPropertyDefinitions).map((k) => k.split('#')[0]), refs: `${refsSet}/${refJobs.length}`, stats, skipped: skipped.length };
