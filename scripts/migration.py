"""Legacy Currency style -> new token mapping. usage: migration.py palette.json out.json"""
import json, sys, os, math
sys.path.insert(0, os.path.dirname(__file__))
from palette import rgb_to_oklch, hex_to_rgb

pal = json.load(open(sys.argv[1]))['ramps']
STATUS_HUES = {'success', 'warning', 'error', 'info'}
LEGACY = """Neutral/100|#171C23 Neutral/90|#212832 Neutral/80|#2C333C Neutral/70|#3F464F Neutral/60|#545B65 Neutral/50|#69707A Neutral/40|#818995 Neutral/30|#ABB4C0 Neutral/20|#E5E8EC Neutral/10|#F2F4F7 Neutral/5|#F9FAFB Neutral/0|#FFFFFF Neutral/bg|#F5F8FB Green/100|#003634 Green/90|#004947 Green/80|#00514E Green/70|#006B67 Green/60|#008681 Green/50|#00A19B Green/40|#2BB1AC Green/30|#80D0CD Green/20|#AAE0DE Green/10|#CCECEB Green/5|#E8F8F7 Blue/100|#041639 Blue/90|#032362 Blue/80|#0B3484 Blue/70|#1747A6 Blue/60|#265DC8 Blue/50|#3975EA Blue/40|#4B88FF Blue/30|#74A3FF Blue/20|#9CBEFF Blue/10|#C4D8FF Blue/5|#EDF3FF Cyan/100|#083841 Cyan/90|#0D5462 Cyan/80|#117083 Cyan/70|#158CA3 Cyan/60|#19A8C4 Cyan/50|#3FB6CE Cyan/40|#66C5D8 Cyan/30|#8CD3E1 Cyan/20|#B2E2EB Cyan/10|#D1EEF3 Cyan/5|#E8F6F9 Pink/100|#851651 Pink/90|#9E165F Pink/80|#C11574 Pink/70|#DD2590 Pink/60|#EE46BC Pink/50|#F670C7 Pink/40|#F98ED4 Pink/30|#FCB4E3 Pink/20|#FECDED Pink/10|#FEDBF2 Pink/5|#FDE9F6 Purple/100|#2C1072 Purple/90|#3B149F Purple/80|#4A16CF Purple/70|#5925DC Purple/60|#6938EF Purple/50|#7A5AF8 Purple/40|#9B8AFB Purple/30|#BDB4FE Purple/20|#D9D6FE Purple/10|#EBE9FE Purple/5|#F4F3FF Red/100|#4B0C09 Red/90|#71130E Red/80|#961912 Red/70|#BB1F17 Red/60|#CD1E15 Red/50|#E1251B Red/40|#E64941 Red/30|#EB6E67 Red/20|#F0928D Red/10|#F9D3D1 Red/5|#FFEFEE Yellow/100|#552F0E Yellow/90|#804716 Yellow/80|#AA5E1D Yellow/70|#D47624 Yellow/60|#FF8D2B Yellow/50|#FFA04E Yellow/40|#FFB372 Yellow/30|#FFC695 Yellow/20|#FFD9B8 Yellow/10|#FFE8D5 Yellow/5|#FFF4EC"""

def dE(a, b):  # deltaE OK (x100), a perceptual distance
    L1, C1, H1 = rgb_to_oklch(hex_to_rgb(a)); L2, C2, H2 = rgb_to_oklch(hex_to_rgb(b))
    a1, b1 = C1*math.cos(math.radians(H1)), C1*math.sin(math.radians(H1))
    a2, b2 = C2*math.cos(math.radians(H2)), C2*math.sin(math.radians(H2))
    return round(100*math.dist((L1, a1, b1), (L2, a2, b2)), 1)

SEMANTIC_HINT = {'Red/50': 'bg/brand (fill), icon/brand, border/brand', 'Red/60': 'bg/brand-pressed, text/brand', 'Red/5': 'bg/brand-subtle',
                 'Neutral/100': 'text/primary', 'Neutral/90': 'text/primary, bg/inverse', 'Neutral/80': 'text/primary',
                 'Neutral/60': 'text/secondary', 'Neutral/50': 'text/tertiary', 'Neutral/40': 'text/disabled',
                 'Neutral/30': 'icon/disabled, border/strong', 'Neutral/20': 'border/default', 'Neutral/10': 'bg/subtle',
                 'Neutral/5': 'bg/canvas', 'Neutral/bg': 'bg/canvas', 'Neutral/0': 'bg/surface, text/inverse',
                 'Green/60': 'bg/success (if status)', 'Green/5': 'bg/success-subtle (if status)', 'Blue/60': 'bg/info, text/link', 'Blue/5': 'bg/info-subtle',
                 'Yellow/50': 'bg/warning', 'Yellow/5': 'bg/warning-subtle'}
rows = []
# each legacy hue maps to the one new family that fits its whole ramp best (lowest total distance)
legacy_by_hue = {}
for item in LEGACY.split():
    n, hx = item.split('|'); legacy_by_hue.setdefault(n.split('/')[0], []).append(hx)
FAMILY = {}
for hue, hexes in legacy_by_hue.items():
    fams = [h for h in pal if h not in STATUS_HUES]
    FAMILY[hue] = min(fams, key=lambda f: sum(min(dE(x, y) for y in pal[f].values()) for x in hexes))
print('families:', FAMILY)
for item in LEGACY.split():
    name, old = item.split('|'); hue, step = name.split('/')
    if name == 'Neutral/0': new = 'base/white'; newhex = '#FFFFFF'
    else:
        fam = FAMILY[hue]
        new, newhex = min(((f'{fam}/{st}', hx) for st, hx in pal[fam].items()), key=lambda kv: dE(old, kv[1]))
    retired = hue in ('Pink', 'Purple')
    rows.append({'legacy': name, 'legacyHex': old, 'new': new, 'newHex': newhex, 'deltaE': dE(old, newhex),
                 'semantic': SEMANTIC_HINT.get(name, '') or ('hue retired — pick an accent' if retired else '')})

TEXT = [('Text/xl/regular', '20/26 Regular', 'heading/md', 'weight → Semi Bold; use body/lg if it is not a title'),
        ('Text/xl/medium', '20/26 Medium', 'heading/md', 'weight → Semi Bold'),
        ('Text/xl/semibold', '20/26 Semi Bold', 'heading/md', 'line height 26 → 28'),
        ('Text/xl/bold', '20/26 Bold', 'heading/md', 'weight → Semi Bold; use display/sm for amounts'),
        ('Text/lg/regular', '16/20 Regular', 'body/lg/regular', 'no change'),
        ('Text/lg/medium', '16/20 Medium', 'body/lg/medium', 'no change'),
        ('Text/lg/semibold', '16/20 Semi Bold', 'label/lg  or  heading/xs', 'label/lg for buttons (16/20); heading/xs for titles'),
        ('Text/lg/bold', '16/20 Bold', 'body/lg/bold', 'no change'),
        ('Text/md/regular', '14/20 Regular', 'body/md/regular', 'no change'),
        ('Text/md/medium', '14/20 Medium', 'body/md/medium', 'no change'),
        ('Text/md/semibold', '14/20 Semi Bold', 'body/md/semibold  or  label/md', 'label/md for buttons, tabs'),
        ('Text/md/bold', '14/20 Bold', 'body/md/bold', 'no change'),
        ('Text/sm/regular', '12/18 Regular', 'body/sm/regular', 'line height 18 → 16'),
        ('Text/sm/medium', '12/18 Medium', 'body/sm/medium', 'line height 18 → 16'),
        ('Text/sm/semibold', '12/18 Semi Bold', 'body/sm/semibold  or  label/sm', 'line height 18 → 16'),
        ('Text/sm/bold', '12/18 Bold', 'body/sm/bold', 'line height 18 → 16'),
        ('Text/xs/regular', '10/14 Regular', 'caption/regular', 'no change'),
        ('Text/xs/medium', '10/14 Medium', 'caption/regular', 'weight → Regular'),
        ('Text/xs/semibold', '10/14 Semi Bold', 'caption/semibold', 'no change'),
        ('Text/xs/bold', '10/14 Bold', 'caption/semibold', 'weight → Semi Bold'),
        ('Heading/h5', '20/auto Semi Bold', 'heading/md', 'fixed line height 28'),
        ('(unstyled 24/28/36/48 px)', 'raw values', 'heading/lg · display/sm · display/lg', '48 px is retired: use display/lg')]
SPACING = [('0', 'spacing/none'), ('1–2', 'spacing/3xs'), ('3–5', 'spacing/2xs'), ('6', 'spacing/2xs or xs (by context)'),
           ('8–9.5', 'spacing/xs'), ('10', 'spacing/xs (gaps) · spacing/sm (padding)'), ('12–13', 'spacing/sm'),
           ('14', 'spacing/md'), ('16–17', 'spacing/md'), ('20', 'spacing/lg'), ('23–28', 'spacing/xl'),
           ('31–34', 'spacing/2xl'), ('38–40', 'spacing/3xl'), ('47–56', 'spacing/4xl'), ('63–72', 'spacing/5xl')]
RADIUS = [('2–5', 'radius/xs'), ('6–10', 'radius/sm'), ('12', 'radius/md'), ('16', 'radius/lg'), ('20–24', 'radius/xl'),
          ('40, 56, 100, 162', 'radius/full')]
json.dump({'color': rows, 'text': TEXT, 'spacing': SPACING, 'radius': RADIUS}, open(sys.argv[2], 'w'), separators=(',', ':'))
big = [r for r in rows if r['deltaE'] > 5]
print('colors:', len(rows), 'median dE:', sorted(r['deltaE'] for r in rows)[len(rows)//2], 'dE>5:', [(r['legacy'], r['new'], r['deltaE']) for r in big])
print('unmatched new steps used twice:', [n for n in {r['new'] for r in rows} if sum(1 for r in rows if r['new'] == n) > 1])
