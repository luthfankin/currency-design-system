// Rebuilds the Color specimen page for the Figma scale: neutral 00–100, every other palette 05–100.
const page = figma.root.children.find((p) => p.name === 'Color');
await figma.setCurrentPageAsync(page);
const old = page.children.find((n) => n.name === 'Color — Currency Foundations'); if (old) old.remove();
for (const s of ['Regular', 'Medium', 'Semi Bold', 'Bold']) await figma.loadFontAsync({ family: 'Inter', style: s });
const vars = await figma.variables.getLocalVariablesAsync();
const V = (n) => { const v = vars.find((x) => x.name === n); if (!v) throw new Error('missing ' + n); return v; };
const TS = Object.fromEntries((await figma.getLocalTextStylesAsync()).map((s) => [s.name, s]));
const hex = (c) => '#' + [c.r, c.g, c.b].map((x) => Math.round(x * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
const resolve = (v) => { let val = Object.values(v.valuesByMode)[0]; while (val && val.type === 'VARIABLE_ALIAS') val = Object.values(vars.find((x) => x.id === val.id).valuesByMode)[0]; return val; };
const aliasName = (v) => { const val = Object.values(v.valuesByMode)[0]; return val.type === 'VARIABLE_ALIAS' ? vars.find((x) => x.id === val.id).name : ''; };
const fillVar = (node, vn) => { node.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }, 'color', V(vn))]; };
const strokeVar = (node, vn) => { node.strokes = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V(vn))]; node.strokeWeight = 1; };
const T = (str, style, colorVar = 'color/text/primary') => { const t = figma.createText(); t.textStyleId = TS[style].id; t.characters = str; fillVar(t, colorVar); return t; };
const AL = (dir, props = {}) => { const f = figma.createAutoLayout(dir, props); f.fills = []; return f; };
const wrap = (t, w) => { t.textAutoResize = 'HEIGHT'; t.resize(w, t.height); return t; };
const contrastWhite = (c) => { const l = (x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4); const L = 0.2126 * l(c.r) + 0.7152 * l(c.g) + 0.0722 * l(c.b); return 1.05 / (L + 0.05); };
const cap = (h) => h.charAt(0).toUpperCase() + h.slice(1);

const doc = AL('VERTICAL', { name: 'Color — Currency Foundations', itemSpacing: 64, paddingTop: 80, paddingBottom: 80, paddingLeft: 80, paddingRight: 80 });
fillVar(doc, 'color/bg/surface');
const head = AL('VERTICAL', { itemSpacing: 12 }); doc.appendChild(head);
head.appendChild(T('Color', 'display/lg'));
head.appendChild(wrap(T('Two tiers. Primitives are the raw palette (hidden from pickers). Semantic tokens describe intent and are what designers and engineers use. Never apply a primitive directly in a component. Scale: 05 (lightest) … 100 (darkest); neutral also has 00 (white). "Aa" marks steps where white text passes WCAG AA.', 'body/lg/regular', 'color/text/secondary'), 980));

const steps = (hue) => vars.filter((v) => v.name.startsWith(`color/${hue}/`)).sort((a, b) => parseFloat(a.name.split('/')[2]) - parseFloat(b.name.split('/')[2]));
function ramps(title, note, hues, star) {
  const s = AL('VERTICAL', { itemSpacing: 24 }); doc.appendChild(s);
  s.appendChild(T(title, 'heading/lg'));
  s.appendChild(wrap(T(note, 'body/md/regular', 'color/text/secondary'), 980));
  for (const h of hues) {
    const row = AL('HORIZONTAL', { itemSpacing: 8 }); s.appendChild(row);
    const lab = AL('VERTICAL', { itemSpacing: 4 }); row.appendChild(lab); lab.resize(96, lab.height); lab.layoutSizingHorizontal = 'FIXED';
    lab.appendChild(T(cap(h), 'label/md'));
    if (h !== 'neutral') { const spacer = figma.createFrame(); spacer.name = 'spacer (no 00)'; spacer.fills = []; spacer.resize(96, 10); row.appendChild(spacer); }
    for (const v of steps(h)) {
      const step = v.name.split('/')[2], c = resolve(v);
      const cell = AL('VERTICAL', { itemSpacing: 6 }); row.appendChild(cell);
      const sw = figma.createFrame(); sw.resize(96, 64); sw.cornerRadius = 8; fillVar(sw, v.name); strokeVar(sw, 'color/border/subtle');
      sw.layoutMode = 'VERTICAL'; sw.primaryAxisAlignItems = 'MAX'; sw.paddingLeft = 8; sw.paddingBottom = 6; sw.primaryAxisSizingMode = 'FIXED'; sw.counterAxisSizingMode = 'FIXED';
      if (contrastWhite(c) >= 4.5) sw.appendChild(T('Aa', 'caption/semibold', 'color/text/inverse'));
      cell.appendChild(sw);
      cell.appendChild(T(`${cap(h)}/${step}${star[h] === step ? ' ★' : ''}`, 'label/sm'));
      cell.appendChild(T(hex(c), 'body/sm/regular', 'color/text/secondary'));
    }
  }
}
ramps('Brand & extended palette', 'Exact values from "New Color — DOKU by Antom". Brand fills use Red/60 so white text passes AA (5.88:1); pure Red/50 ★ is for logo, icons, borders and decoration.',
  ['neutral', 'red', 'blue', 'cyan', 'turquoise', 'green', 'orange', 'lime'], { red: '50' });
ramps('Status palettes', 'Success, Warning, Error and Info, 05–100. Each ramp is generated in OKLCH around the source swatch (★, kept exact), so tints and shades step evenly.',
  ['success', 'warning', 'error', 'info'], { success: '50', warning: '40', error: '60', info: '60' });

const ss = AL('VERTICAL', { itemSpacing: 24 }); doc.appendChild(ss);
ss.appendChild(T('Semantic — Light', 'heading/lg'));
const grid = AL('HORIZONTAL', { itemSpacing: 40 }); ss.appendChild(grid);
for (const g of ['bg', 'text', 'icon', 'border', 'accent']) {
  const colm = AL('VERTICAL', { itemSpacing: 10 }); grid.appendChild(colm);
  colm.appendChild(T(g, 'heading/xs'));
  for (const v of vars.filter((x) => x.name.startsWith(`color/${g}/`))) {
    const r = AL('HORIZONTAL', { itemSpacing: 10, counterAxisAlignItems: 'CENTER' }); colm.appendChild(r);
    const sw = figma.createRectangle(); sw.resize(32, 32); sw.cornerRadius = 6; fillVar(sw, v.name); strokeVar(sw, 'color/border/default'); r.appendChild(sw);
    const tx = AL('VERTICAL', { itemSpacing: 0 }); r.appendChild(tx);
    tx.appendChild(T(v.name.replace('color/', ''), 'body/sm/semibold'));
    tx.appendChild(T(`→ ${aliasName(v).replace('color/', '')}`, 'caption/regular', 'color/text/tertiary'));
  }
}
// keep any reference frames already on the page (e.g. "Neutral"): place the doc to their left
const others = page.children.filter((n) => n !== doc);
doc.x = others.length ? Math.min(...others.map((n) => n.x)) - doc.width - 400 : 0; doc.y = 0;
return { id: doc.id, w: Math.round(doc.width), h: Math.round(doc.height) };
