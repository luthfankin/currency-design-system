// Reads the DTCG token source and derives everything the docs pages show:
// resolved values, alias chains, and the exact name on each platform.
// Naming mirrors the Style Dictionary build (build.mjs) so what you copy here matches the generated files.
import primitives from '../tokens/primitives.tokens.json';
import semantic from '../tokens/semantic.tokens.json';
import contrastReport from '../tokens/contrast-report.json';

export type Token = {
  path: string[];
  type: string;
  raw: unknown;
  description?: string;
  layer: 'primitive' | 'semantic';
};

type Node = { [k: string]: Node | unknown };

function walk(node: Node, layer: Token['layer'], path: string[] = [], out: Token[] = []): Token[] {
  if ('$value' in node) {
    out.push({ path, type: node.$type as string, raw: node.$value, description: node.$description as string | undefined, layer });
    return out;
  }
  for (const [k, v] of Object.entries(node)) if (!k.startsWith('$')) walk(v as Node, layer, [...path, k], out);
  return out;
}

export const tokens: Token[] = [...walk(primitives as Node, 'primitive'), ...walk(semantic as Node, 'semantic')];
const byPath = new Map(tokens.map((t) => [t.path.join('.'), t]));

export const get = (path: string) => {
  const t = byPath.get(path.replace(/\//g, '.'));
  if (!t) throw new Error(`Unknown token ${path}`);
  return t;
};

const refOf = (v: unknown) => (typeof v === 'string' && /^\{.+\}$/.test(v) ? v.slice(1, -1) : null);

/** Follows aliases until a literal value. */
export function resolve(t: Token): unknown {
  const ref = refOf(t.raw);
  return ref ? resolve(get(ref)) : t.raw;
}

/** The token this one points to, e.g. color.bg.brand → color.red.600. */
export const aliasOf = (t: Token) => refOf(t.raw);

// ---- names per platform (same transforms as Style Dictionary's css / ios-swift / android groups)
const words = (path: string[]) => path.flatMap((p) => p.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(/[\s\-_]+/)).map((w) => w.toLowerCase());
export const cssName = (path: string[]) => `--${words(path).join('-')}`;
export const cssVar = (path: string[]) => `var(${cssName(path)})`;
export const iosName = (path: string[]) => `CurrencyTokens.${words(path).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1) : w)).join('')}`;
export const androidName = (t: Token) => {
  const n = words(t.path).join('_');
  if (t.type === 'color') return `@color/${n}`;
  if (t.type === 'dimension' && !t.path.includes('letterSpacing')) return `@dimen/${n}`;
  return `${n} (code only, no XML resource)`;
};

export const figmaName = (path: string[]) => path.join('/');

// ---- helpers for the pages
export const under = (prefix: string) => tokens.filter((t) => t.path.join('.').startsWith(prefix + '.'));

export function hex(t: Token) {
  return String(resolve(t)).toUpperCase();
}

function lum(h: string) {
  const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export { contrastReport };
