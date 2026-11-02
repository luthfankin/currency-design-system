// Builds Currency tokens for every platform from the DTCG source in tokens/.
// Run: npm run build  → outputs to build/
//
// Source dimensions are authored in px (1px = 1pt = 1dp on mobile). Style Dictionary's
// built-in iOS/Android/JS groups assume rem input and would multiply by 16, so we swap
// their size transforms for px-aware ones below.
import StyleDictionary from 'style-dictionary';

const val = (token, options) => (options.usesDtcg ? token.$value : token.value);
// strips units and any wrapper a previous transitive pass added, e.g. "CGFloat(16.00)" -> 16
const px = (v) => parseFloat(String(v).replace(/[^0-9.\-]/g, ''));
// letterSpacing is authored in em; mobile APIs take em-relative numbers, so keep it unitless
const isEm = (t) => t.path.includes('letterSpacing');
const isDimension = (t) => (t.$type ?? t.type) === 'dimension';
// font sizes and line heights scale with the user's font setting on Android (sp)
const isFontSize = (t) => ['fontSize', 'lineHeight'].some((k) => t.path.includes(k)) || /^font\/(size|line-height)/.test(t.path.join('/'));
const isLineHeight = (t) => t.path.includes('lineHeight');

StyleDictionary.registerTransform({
  name: 'size/px-to-number', type: 'value', transitive: true, filter: isDimension,
  transform: (t, _c, o) => px(val(t, o)),
});
StyleDictionary.registerTransform({
  name: 'size/px-to-cgfloat', type: 'value', transitive: true, filter: isDimension,
  transform: (t, _c, o) => (isEm(t) ? px(val(t, o)) : `CGFloat(${px(val(t, o)).toFixed(2)})`),
});
StyleDictionary.registerTransform({
  name: 'size/px-to-dp-sp', type: 'value', transitive: true, filter: isDimension,
  transform: (t, _c, o) => (isEm(t) ? px(val(t, o)) : `${px(val(t, o)).toFixed(2)}${isFontSize(t) ? 'sp' : 'dp'}`),
});

// Swift needs a quoted string; native apps register the bundled family by name, so keep only the first entry.
StyleDictionary.registerTransform({
  name: 'font/swift-family', type: 'value', transitive: true, filter: (t) => (t.$type ?? t.type) === 'fontFamily',
  transform: (t, _c, o) => { const v = val(t, o); const name = Array.isArray(v) ? v[0] : String(v).split(',')[0]; return name.startsWith('"') ? name : `"${name}"`; },
});

// Elevation: native views draw one shadow cheaply, so each platform gets a single-layer equivalent.
// iOS uses the larger ambient layer (CALayer shadowRadius ≈ blur / 2); Android uses Material elevation.
const isShadow = (t) => (t.$type ?? t.type) === 'shadow';
const ANDROID_ELEVATION_DP = { 1: 2, 2: 4, 3: 8, 4: 16, sheet: 16 };
const level = (t) => t.path[t.path.length - 1];
const swiftLevel = (t) => (/^\d+$/.test(level(t)) ? `level${level(t)}` : level(t));
const header = '// Do not edit directly, this file was auto-generated from tokens/ by build.mjs.\n';

StyleDictionary.registerFormat({
  name: 'ios-swift/elevation',
  format: ({ dictionary }) => {
    const rows = dictionary.allTokens.filter(isShadow).map((t) => {
      const layers = t.original.$value;
      const l = layers[layers.length - 1];
      const hex = l.color.slice(1, 7), alpha = parseInt(l.color.slice(7, 9) || 'ff', 16) / 255;
      const [r, g, b] = [0, 2, 4].map((i) => (parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(3));
      return `    /// ${t.$description ?? ''}\n    static let ${swiftLevel(t)} = CurrencyShadow(color: UIColor(red: ${r}, green: ${g}, blue: ${b}, alpha: 1), opacity: ${alpha.toFixed(2)}, offset: CGSize(width: ${px(l.offsetX)}, height: ${px(l.offsetY)}), radius: ${(px(l.blur) / 2).toFixed(1)})`;
    });
    return `${header}\nimport UIKit\n\npublic struct CurrencyShadow {\n    public let color: UIColor\n    public let opacity: Float\n    public let offset: CGSize\n    public let radius: CGFloat\n}\n\npublic extension CurrencyShadow {\n${rows.join('\n')}\n}\n\npublic extension CALayer {\n    func applyCurrencyShadow(_ shadow: CurrencyShadow) {\n        shadowColor = shadow.color.cgColor\n        shadowOpacity = shadow.opacity\n        shadowOffset = shadow.offset\n        shadowRadius = shadow.radius\n        masksToBounds = false\n    }\n}\n`;
  },
});

StyleDictionary.registerFormat({
  name: 'android/elevation',
  format: ({ dictionary }) => {
    const rows = dictionary.allTokens.filter(isShadow).map((t) => `  <!-- ${t.$description ?? ''} -->\n  <dimen name="${t.name}">${ANDROID_ELEVATION_DP[level(t)]}.00dp</dimen>`);
    return `<?xml version="1.0" encoding="UTF-8"?>\n<!-- ${header.trim().slice(3)} -->\n<resources>\n${rows.join('\n')}\n</resources>\n`;
  },
});

const groups = StyleDictionary.hooks.transformGroups;
const swap = (group, replacement) => [
  ...groups[group].filter((name) => !name.startsWith('size/')),
  replacement,
];

const sd = new StyleDictionary({
  source: ['tokens/*.tokens.json'],
  usesDtcg: true,
  // Split each typography token into font-family / font-weight / font-size / line-height /
  // letter-spacing so every platform (and letterSpacing in CSS) gets all properties.
  expand: { include: ['typography'], typesMap: { typography: { lineHeight: 'dimension' } } },
  log: { verbosity: 'default', warnings: 'warn' },
  platforms: {
    // Web / Storybook (React DOM) — CSS custom properties
    css: {
      transformGroup: 'css',
      buildPath: 'build/css/',
      files: [{ destination: 'variables.css', format: 'css/variables', options: { outputReferences: true } }],
    },
    // React Native / JS Storybook — unitless numbers, colors as hex
    js: {
      transforms: swap('js', 'size/px-to-number'),
      buildPath: 'build/js/',
      files: [
        { destination: 'tokens.js', format: 'javascript/es6' },
        { destination: 'tokens.d.ts', format: 'typescript/es6-declarations' },
        { destination: 'tokens.json', format: 'json/nested' },
      ],
    },
    // iOS (Swift)
    ios: {
      transforms: ['font/swift-family', ...swap('ios-swift', 'size/px-to-cgfloat')],
      buildPath: 'build/ios/',
      files: [
        { destination: 'CurrencyTokens.swift', format: 'ios-swift/class.swift', options: { className: 'CurrencyTokens' }, filter: (t) => !isShadow(t) },
        { destination: 'CurrencyElevation.swift', format: 'ios-swift/elevation' },
      ],
    },
    // Android (XML resources)
    android: {
      transforms: swap('android', 'size/px-to-dp-sp'),
      buildPath: 'build/android/',
      files: [
        { destination: 'currency_colors.xml', format: 'android/colors', filter: (t) => (t.$type ?? t.type) === 'color' },
        { destination: 'currency_dimens.xml', format: 'android/dimens', filter: (t) => (isDimension(t) || isLineHeight(t)) && !isEm(t) },
        { destination: 'currency_elevation.xml', format: 'android/elevation' },
      ],
    },
  },
});

await sd.cleanAllPlatforms();
await sd.buildAllPlatforms();
