// Phosphor (Regular) icon components on the "Iconography" page — chunk 3. Idempotent per icon name.
const ICONS = [["warning",["M236.8,188.09,149.35,36.22h0a24.76,24.76,0,0,0-42.7,0L19.2,188.09a23.51,23.51,0,0,0,0,23.72A24.35,24.35,0,0,0,40.55,224h174.9a24.35,24.35,0,0,0,21.33-12.19A23.51,23.51,0,0,0,236.8,188.09ZM222.93,203.8a8.5,8.5,0,0,1-7.48,4.2H40.55a8.5,8.5,0,0,1-7.48-4.2,7.59,7.59,0,0,1,0-7.72L120.52,44.21a8.75,8.75,0,0,1,15,0l87.45,151.87A7.59,7.59,0,0,1,222.93,203.8ZM120,144V104a8,8,0,0,1,16,0v40a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,180Z"]],["warning-circle",["M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z"]],["whatsapp-logo",["M187.58,144.84l-32-16a8,8,0,0,0-8,.5l-14.69,9.8a40.55,40.55,0,0,1-16-16l9.8-14.69a8,8,0,0,0,.5-8l-16-32A8,8,0,0,0,104,64a40,40,0,0,0-40,40,88.1,88.1,0,0,0,88,88,40,40,0,0,0,40-40A8,8,0,0,0,187.58,144.84ZM152,176a72.08,72.08,0,0,1-72-72A24,24,0,0,1,99.29,80.46l11.48,23L101,118a8,8,0,0,0-.73,7.51,56.47,56.47,0,0,0,30.15,30.15A8,8,0,0,0,138,155l14.61-9.74,23,11.48A24,24,0,0,1,152,176ZM128,24A104,104,0,0,0,36.18,176.88L24.83,210.93a16,16,0,0,0,20.24,20.24l34.05-11.35A104,104,0,1,0,128,24Zm0,192a87.87,87.87,0,0,1-44.06-11.81,8,8,0,0,0-6.54-.67L40,216,52.47,178.6a8,8,0,0,0-.66-6.54A88,88,0,1,1,128,216Z"]],["wifi-high",["M140,204a12,12,0,1,1-12-12A12,12,0,0,1,140,204ZM237.08,87A172,172,0,0,0,18.92,87,8,8,0,0,0,29.08,99.37a156,156,0,0,1,197.84,0A8,8,0,0,0,237.08,87ZM205,122.77a124,124,0,0,0-153.94,0A8,8,0,0,0,61,135.31a108,108,0,0,1,134.06,0,8,8,0,0,0,11.24-1.3A8,8,0,0,0,205,122.77Zm-32.26,35.76a76.05,76.05,0,0,0-89.42,0,8,8,0,0,0,9.42,12.94,60,60,0,0,1,70.58,0,8,8,0,1,0,9.42-12.94Z"]],["x",["M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"]],["x-circle",["M165.66,101.66,139.31,128l26.35,26.34a8,8,0,0,1-11.32,11.32L128,139.31l-26.34,26.35a8,8,0,0,1-11.32-11.32L116.69,128,90.34,101.66a8,8,0,0,1,11.32-11.32L128,116.69l26.34-26.35a8,8,0,0,1,11.32,11.32ZM232,128A104,104,0,1,1,128,24,104.11,104.11,0,0,1,232,128Zm-16,0a88,88,0,1,0-88,88A88.1,88.1,0,0,0,216,128Z"]]];
const START = 120;
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
return { chunk: 3, made: made.length, next: i, pageId: page.id };
