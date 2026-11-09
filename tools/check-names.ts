// Verifies every token name shown in Storybook exists in the generated CSS, Swift and Android files.
// Run: node_modules/.bin/esbuild tools/check-names.ts --bundle --platform=node --format=esm --outfile=/tmp/check.mjs && node /tmp/check.mjs
import { tokens, cssName, iosName, androidName } from '../storybook/tokens';
import { readFileSync } from 'fs';
const root = process.cwd() + '/'; // run from the project root
const css = readFileSync(root + 'build/css/variables.css', 'utf8');
const swift = readFileSync(root + 'build/ios/CurrencyTokens.swift', 'utf8');
const xml = ['colors', 'dimens', 'elevation'].map((f) => readFileSync(root + `build/android/currency_${f}.xml`, 'utf8')).join('');
const miss: string[] = [];
const props = ['fontFamily', 'fontWeight', 'fontSize', 'lineHeight', 'letterSpacing'];
const expanded = tokens.flatMap((t) => (t.type === 'typography' ? props.map((k) => ({ ...t, path: [...t.path, k], type: ['fontSize', 'lineHeight', 'letterSpacing'].includes(k) ? 'dimension' : k })) : [t]));
for (const t of expanded) {
  if (!css.includes(cssName(t.path) + ':')) miss.push('css ' + cssName(t.path));
  if (t.type !== 'shadow' && !swift.includes('static let ' + iosName(t.path).replace('CurrencyTokens.', '') + ' ')) miss.push('ios ' + iosName(t.path));
  const a = androidName(t);
  if (a.startsWith('@') && !xml.includes('name="' + a.split('/')[1] + '"')) miss.push('android ' + a);
}
console.log('checked', expanded.length, 'tokens; missing:', miss.length ? miss : 'none');
if (miss.length) process.exit(1);
