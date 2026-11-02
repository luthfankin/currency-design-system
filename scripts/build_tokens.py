"""Build Currency token source (DTCG JSON) + a compact payload for the Figma script.
usage: build_tokens.py palette.json out_dir payload.json"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from palette import contrast

pal = json.load(open(sys.argv[1]))['ramps']
OUT = sys.argv[2]; PAYLOAD = sys.argv[3]
os.makedirs(OUT, exist_ok=True)

# ---------- 1. Primitives ----------
prim_color = {'base/white': '#FFFFFF', 'base/black': '#000000'}
for hue, ramp in pal.items():
    for step, hexv in ramp.items():
        prim_color[f'{hue}/{step}'] = hexv
prim_alpha = {'alpha/black-60': ('#000000', 0.60), 'alpha/black-8': ('#000000', 0.08), 'alpha/white-16': ('#FFFFFF', 0.16)}

DIM = [0, 1, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80]
prim_dim = {f'dimension/{d}': d for d in DIM}
prim_dim['dimension/full'] = 9999

# ---------- 2. Semantic color (Light) ----------
C = {
  # background
  'bg/canvas': 'neutral/50', 'bg/surface': 'base/white', 'bg/subtle': 'neutral/50',
  'bg/muted': 'neutral/100', 'bg/disabled': 'neutral/100', 'bg/inverse': 'neutral/900',
  'bg/brand': 'red/600', 'bg/brand-pressed': 'red/700', 'bg/brand-subtle': 'red/50',
  'bg/success': 'success/600', 'bg/success-subtle': 'success/50',
  'bg/warning': 'warning/400', 'bg/warning-subtle': 'warning/50',
  'bg/error': 'error/600', 'bg/error-subtle': 'error/50',
  'bg/info': 'info/600', 'bg/info-subtle': 'info/50',
  'bg/overlay': 'alpha/black-60', 'bg/pressed': 'alpha/black-8',
  # text
  'text/primary': 'neutral/900', 'text/secondary': 'neutral/700', 'text/tertiary': 'neutral/600',
  'text/disabled': 'neutral/400', 'text/inverse': 'base/white', 'text/on-brand': 'base/white',
  'text/brand': 'red/600', 'text/link': 'blue/700',
  'text/success': 'success/700', 'text/warning': 'warning/700', 'text/error': 'error/700', 'text/info': 'info/700',
  # icon
  'icon/primary': 'neutral/900', 'icon/secondary': 'neutral/700', 'icon/tertiary': 'neutral/500',
  'icon/disabled': 'neutral/300', 'icon/inverse': 'base/white', 'icon/on-brand': 'base/white',
  'icon/brand': 'red/500', 'icon/success': 'success/600', 'icon/warning': 'warning/500',
  'icon/error': 'error/600', 'icon/info': 'info/600',
  # border
  'border/default': 'neutral/200', 'border/subtle': 'neutral/100', 'border/strong': 'neutral/300',
  'border/disabled': 'neutral/100', 'border/focus': 'blue/600', 'border/brand': 'red/500',
  'border/success': 'success/500', 'border/warning': 'warning/400', 'border/error': 'error/600',
  # accent (categories, illustrations, badges) — the non-status hues of the new palette
  'accent/blue/bg': 'blue/50', 'accent/blue/fg': 'blue/700',
  'accent/cyan/bg': 'cyan/50', 'accent/cyan/fg': 'cyan/800',
  'accent/turquoise/bg': 'turquoise/50', 'accent/turquoise/fg': 'turquoise/800',
  'accent/green/bg': 'green/50', 'accent/green/fg': 'green/800',
  'accent/orange/bg': 'orange/50', 'accent/orange/fg': 'orange/700',
  'accent/lime/bg': 'lime/50', 'accent/lime/fg': 'lime/800',
}
SCOPE = {'bg': ['FRAME_FILL', 'SHAPE_FILL'], 'text': ['TEXT_FILL'], 'icon': ['SHAPE_FILL', 'STROKE_COLOR'],
         'border': ['STROKE_COLOR'], 'accent': ['FRAME_FILL', 'SHAPE_FILL', 'TEXT_FILL']}

# contrast guardrails: (text token, background token, minimum ratio)
def resolve(tok):
    p = C.get(tok, tok)
    return prim_color.get(p) or prim_alpha[p][0]
CHECKS = [('text/primary', 'bg/surface', 4.5), ('text/secondary', 'bg/surface', 4.5), ('text/tertiary', 'bg/surface', 4.5),
          ('text/secondary', 'bg/canvas', 4.5), ('text/tertiary', 'bg/canvas', 4.5), ('text/secondary', 'bg/muted', 4.5),
          ('text/brand', 'bg/surface', 4.5), ('text/brand', 'bg/canvas', 4.5), ('text/link', 'bg/surface', 4.5), ('text/link', 'bg/canvas', 4.5),
          ('text/success', 'bg/success-subtle', 4.5), ('text/warning', 'bg/warning-subtle', 4.5),
          ('text/error', 'bg/error-subtle', 4.5), ('text/info', 'bg/info-subtle', 4.5),
          ('text/on-brand', 'bg/brand', 4.5), ('text/on-brand', 'bg/brand-pressed', 4.5),
          ('text/inverse', 'bg/success', 4.5), ('text/inverse', 'bg/info', 4.5), ('text/inverse', 'bg/error', 4.5),
          ('text/primary', 'bg/warning', 4.5), ('text/inverse', 'bg/inverse', 4.5),
          ('accent/blue/fg', 'accent/blue/bg', 4.5), ('accent/cyan/fg', 'accent/cyan/bg', 4.5),
          ('accent/turquoise/fg', 'accent/turquoise/bg', 4.5), ('accent/green/fg', 'accent/green/bg', 4.5),
          ('accent/orange/fg', 'accent/orange/bg', 4.5), ('accent/lime/fg', 'accent/lime/bg', 4.5),
          ('icon/secondary', 'bg/surface', 3), ('icon/tertiary', 'bg/surface', 3), ('icon/brand', 'bg/surface', 3),
          ('icon/success', 'bg/surface', 3), ('icon/warning', 'bg/surface', 3), ('icon/error', 'bg/surface', 3),
          ('border/focus', 'bg/surface', 3), ('border/strong', 'bg/surface', 1.4)]
report = []
for fg, bg, m in CHECKS:
    r = contrast(resolve(fg), resolve(bg))
    report.append({'fg': fg, 'bg': bg, 'ratio': round(r, 2), 'min': m, 'pass': r >= m})

# ---------- 3. Spacing / shape ----------
SPACING = {'spacing/none': 0, 'spacing/3xs': 2, 'spacing/2xs': 4, 'spacing/xs': 8, 'spacing/sm': 12,
           'spacing/md': 16, 'spacing/lg': 20, 'spacing/xl': 24, 'spacing/2xl': 32, 'spacing/3xl': 40,
           'spacing/4xl': 48, 'spacing/5xl': 64,
           'layout/screen-margin': 16, 'layout/section-gap': 24, 'layout/card-padding': 16, 'layout/list-item-gap': 12}
RADIUS = {'radius/none': 0, 'radius/xs': 4, 'radius/sm': 8, 'radius/md': 12, 'radius/lg': 16, 'radius/xl': 24, 'radius/full': 'full'}
BORDER = {'border-width/none': 0, 'border-width/thin': 1, 'border-width/thick': 2}

# ---------- 4. Typography ----------
WEIGHT = {'regular': ('Regular', 400), 'medium': ('Medium', 500), 'semibold': ('Semi Bold', 600), 'bold': ('Bold', 700)}
SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36]
LH = [14, 16, 20, 24, 28, 32, 36, 40, 44]
TEXT = [  # name, size, line-height, weight, letter-spacing(%), usage
  ('display/lg', 36, 44, 'bold', -1, 'Balance hero, big amounts'),
  ('display/md', 32, 40, 'bold', -1, 'Amount input, success amount'),
  ('display/sm', 28, 36, 'bold', -1, 'Secondary amounts, onboarding titles'),
  ('heading/lg', 24, 32, 'semibold', 0, 'Page titles in content'),
  ('heading/md', 20, 28, 'semibold', 0, 'Section titles, bottom sheet titles'),
  ('heading/sm', 18, 24, 'semibold', 0, 'Card titles'),
  ('heading/xs', 16, 24, 'semibold', 0, 'Top bar title, list group titles'),
]
for size, lh, key in [(16, 20, 'lg'), (14, 20, 'md'), (12, 16, 'sm')]:
    for w in ['regular', 'medium', 'semibold', 'bold']:
        TEXT.append((f'body/{key}/{w}', size, lh, w, 0, {'lg': 'Long-form, input values', 'md': 'Default body text, list rows', 'sm': 'Helper text, meta info'}[key]))
for size, lh, key in [(16, 20, 'lg'), (14, 20, 'md'), (12, 16, 'sm')]:
    TEXT.append((f'label/{key}', size, lh, 'semibold', 0, 'Buttons, tabs, chips, form labels'))
TEXT += [('caption/regular', 10, 14, 'regular', 0, 'Badges, legal, timestamps'),
         ('caption/semibold', 10, 14, 'semibold', 0, 'Badge labels, tiny emphasis')]

ELEVATION = {  # list of shadow layers (x, y, blur, spread, hex, alpha)
  'elevation/1': ([(0, 1, 2, 0, '#1C1C1D', 0.06), (0, 1, 3, 0, '#1C1C1D', 0.10)], 'Cards, list containers resting on canvas'),
  'elevation/2': ([(0, 2, 4, -2, '#1C1C1D', 0.06), (0, 4, 8, -2, '#1C1C1D', 0.10)], 'Dropdowns, popovers, sticky headers when scrolled'),
  'elevation/3': ([(0, 4, 6, -2, '#1C1C1D', 0.04), (0, 12, 16, -4, '#1C1C1D', 0.10)], 'Toasts, floating action buttons'),
  'elevation/4': ([(0, 8, 8, -4, '#1C1C1D', 0.04), (0, 20, 24, -4, '#1C1C1D', 0.12)], 'Dialogs / modals'),
  'elevation/sheet': ([(0, -2, 4, -2, '#1C1C1D', 0.06), (0, -8, 16, -4, '#1C1C1D', 0.10)], 'Bottom sheets, bottom navigation, sticky footers (casts upward)'),
}

# ---------- DTCG output ----------
def kebab(path): return path.replace('/', '-')
def ref(path): return '{' + path.replace('/', '.') + '}'
def nest(d, path, val):
    parts = path.split('/'); cur = d
    for p in parts[:-1]: cur = cur.setdefault(p, {})
    cur[parts[-1]] = val

prim = {}
for k, v in prim_color.items(): nest(prim, 'color/' + k, {'$type': 'color', '$value': v})
for k, (h, a) in prim_alpha.items():
    nest(prim, 'color/' + k, {'$type': 'color', '$value': h + f'{round(a*255):02X}'})
for k, v in prim_dim.items(): nest(prim, k, {'$type': 'dimension', '$value': f'{v}px'})
nest(prim, 'font/family/base', {'$type': 'fontFamily', '$value': ['Inter', 'system-ui', 'sans-serif']})
for k, (_, n) in WEIGHT.items(): nest(prim, f'font/weight/{k}', {'$type': 'fontWeight', '$value': n})
for s in SIZES: nest(prim, f'font/size/{s}', {'$type': 'dimension', '$value': f'{s}px'})
for l in LH: nest(prim, f'font/line-height/{l}', {'$type': 'dimension', '$value': f'{l}px'})

sem = {}
for k, p in C.items(): nest(sem, 'color/' + k, {'$type': 'color', '$value': ref('color/' + p)})
for k, v in SPACING.items(): nest(sem, k, {'$type': 'dimension', '$value': ref(f'dimension/{v}')})
for k, v in RADIUS.items(): nest(sem, k, {'$type': 'dimension', '$value': ref(f'dimension/{v}')})
for k, v in BORDER.items(): nest(sem, k, {'$type': 'dimension', '$value': ref(f'dimension/{v}')})
for name, size, lh, w, ls, use in TEXT:
    nest(sem, 'typography/' + name, {'$type': 'typography', '$description': use, '$value': {
        'fontFamily': '{font.family.base}', 'fontWeight': ref(f'font/weight/{w}'),
        'fontSize': ref(f'font/size/{size}'), 'lineHeight': ref(f'font/line-height/{lh}'),
        'letterSpacing': f'{ls/100}em' if ls else '0em'}})
for k, (layers, use) in ELEVATION.items():
    nest(sem, k, {'$type': 'shadow', '$description': use, '$value': [
        {'offsetX': f'{x}px', 'offsetY': f'{y}px', 'blur': f'{b}px', 'spread': f'{s}px', 'color': h + f'{round(a*255):02X}'}
        for x, y, b, s, h, a in layers]})

json.dump(prim, open(os.path.join(OUT, 'primitives.tokens.json'), 'w'), indent=2)
json.dump(sem, open(os.path.join(OUT, 'semantic.tokens.json'), 'w'), indent=2)
json.dump(report, open(os.path.join(OUT, 'contrast-report.json'), 'w'), indent=2)

# ---------- compact Figma payload ----------
json.dump({'primColor': prim_color, 'primAlpha': prim_alpha, 'primDim': prim_dim, 'color': C, 'scope': SCOPE,
           'spacing': SPACING, 'radius': RADIUS, 'border': BORDER, 'weights': {k: v[0] for k, v in WEIGHT.items()},
           'sizes': SIZES, 'lh': LH, 'text': TEXT, 'elevation': {k: v[0] for k, v in ELEVATION.items()},
           'elevationDesc': {k: v[1] for k, v in ELEVATION.items()}},
          open(PAYLOAD, 'w'), separators=(',', ':'))

fails = [r for r in report if not r['pass']]
print(f'primitives: {len(prim_color)+len(prim_alpha)} colors, {len(prim_dim)} dims | semantic colors: {len(C)} | text styles: {len(TEXT)}')
print('contrast checks:', len(report), 'fails:', fails)
for r in report: print(f"  {r['fg']:>18} on {r['bg']:<20} {r['ratio']}")
