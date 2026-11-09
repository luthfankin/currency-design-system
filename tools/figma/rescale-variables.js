// Renames palette primitives to the Figma scale (05…100, neutral 00…100). Variable IDs are kept, so every binding stays.
// Ascending order avoids name collisions: 50→05 first … 500→50 (free by then) … 950→100 (free after 100→10).
const STEPS = [['50', '05'], ['100', '10'], ['200', '20'], ['300', '30'], ['400', '40'], ['500', '50'], ['600', '60'], ['700', '70'], ['800', '80'], ['900', '90'], ['950', '100']];
const HUES = ['red', 'blue', 'cyan', 'turquoise', 'green', 'orange', 'lime', 'neutral', 'success', 'warning', 'error', 'info'];
const kebab = (s) => s.replace(/\//g, '-'), snake = (s) => s.replace(/[\/-]/g, '_'), camel = (s) => s.split(/[\/-]/).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('');
const syntax = (v) => { v.setVariableCodeSyntax('WEB', `var(--${kebab(v.name)})`); v.setVariableCodeSyntax('ANDROID', snake(v.name)); v.setVariableCodeSyntax('iOS', camel(v.name)); };
const vars = await figma.variables.getLocalVariablesAsync();
const prim = (await figma.variables.getLocalVariableCollectionsAsync()).find((c) => c.name === 'Primitives');
const inPrim = vars.filter((v) => v.variableCollectionId === prim.id);
const byName = (n) => inPrim.find((v) => v.name === n);
if (byName('color/red/05')) return { skipped: 'already rescaled' };
const done = [];
for (const [from, to] of STEPS) for (const h of HUES) {
  const v = byName(`color/${h}/${from}`);
  if (!v) continue;
  v.name = `color/${h}/${to}`; syntax(v); done.push(v.name);
}
// white becomes neutral/00 (keeps its ID, so semantic tokens that point to it are untouched)
const white = byName('color/base/white');
if (white) { white.name = 'color/neutral/00'; syntax(white); done.push(white.name); }
// base/black: delete only if nothing aliases it
const black = byName('color/base/black');
let blackRemoved = false;
if (black) {
  const used = vars.some((v) => Object.values(v.valuesByMode).some((x) => x && x.type === 'VARIABLE_ALIAS' && x.id === black.id));
  if (!used) { black.remove(); blackRemoved = true; }
}
const after = (await figma.variables.getLocalVariablesAsync()).filter((v) => v.variableCollectionId === prim.id && v.name.startsWith('color/'));
return { renamed: done.length, blackRemoved, primitiveColors: after.length, neutral: after.filter((v) => v.name.startsWith('color/neutral/')).map((v) => v.name.split('/')[2]), red: after.filter((v) => v.name.startsWith('color/red/')).map((v) => v.name.split('/')[2]) };
