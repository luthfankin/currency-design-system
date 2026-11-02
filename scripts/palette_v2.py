"""Currency palette v2: the "New Color" ramps from the Figma source (DOKU by Antom, node 3717:9342),
plus generated Success / Warning / Error / Info ramps anchored on the source's single status swatches.
usage: palette_v2.py out.json"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from palette import rgb_to_oklch, hex_to_rgb, oklch_to_hex, contrast, STEPS, L_TARGET, C_FACTOR

# Figma step names 05,10..100 -> token steps 50,100..950
SRC_STEPS = ['05', '10', '20', '30', '40', '50', '60', '70', '80', '90', '100']
SOURCE = {
 'red':       ['#FFF2F3','#FFE0E1','#FFCCCE','#FF999E','#FF4D57','#FF000E','#CC000B','#B2000A','#990008','#660006','#3D100D'],
 'blue':      ['#F0F6FF','#DCEBFF','#B3D2FE','#88B9FE','#5B9EFF','#3885FC','#0066FF','#0052D6','#003CB3','#022B82','#021B54'],
 'cyan':      ['#EBF9F9','#CCFCFB','#A9FEFD','#7DFFFF','#65DDDD','#4DBCBD','#349D9D','#1A7E7E','#076060','#004343','#002828'],
 'turquoise': ['#EDFBF8','#DDF7F2','#A8EBDE','#6ADFC9','#05C6A1','#14A989','#058D72','#04725C','#055847','#014032','#00291F'],
 'green':     ['#EEFAF4','#D9F9EA','#66EBAF','#00DF82','#17C272','#09A660','#0A8B50','#057140','#045831','#004022','#012A14'],
 'orange':    ['#FFFAF0','#FFF3D9','#FFD27A','#FFAB2C','#E09417','#C17D0C','#A1690B','#845405','#664104','#4B2E00','#311D01'],
 'lime':      ['#FBFDF2','#F8FFD9','#EFFFA0','#E7FE55','#C7DC3D','#A8BA22','#8A9A0A','#6D7A09','#525C01','#383F00','#202500'],
 'neutral':   ['#F6F6F7','#E9E9EA','#D5D5D6','#BCBCBD','#A0A0A1','#858586','#6D6D6E','#555556','#404041','#29292A','#1C1C1D'],
}
STATUS = {'success': '#16A34A', 'warning': '#F59E0B', 'error': '#DC2626', 'info': '#2563EB'}

ramps = {h: dict(zip(STEPS, v)) for h, v in SOURCE.items()}
anchor = {}
for name, hexv in STATUS.items():
    L0, C0, H0 = rgb_to_oklch(hex_to_rgb(hexv))
    a = min(range(len(STEPS)), key=lambda i: abs(L_TARGET[i] - L0))  # step whose target lightness is closest
    anchor[name] = STEPS[a]
    d = L0 - L_TARGET[a]
    r = {}
    for i, s in enumerate(STEPS):
        if i == a: r[s] = hexv.upper(); continue
        w = 0 if i in (0, 10) else max(0, 1 - abs(i - a) / 4)
        r[s] = oklch_to_hex(L_TARGET[i] + d * w, C0 * C_FACTOR[i] / C_FACTOR[a], H0)
    ramps[name] = r

json.dump({'ramps': ramps, 'anchor': anchor, 'source': {'figma': 'O2WUsHK7QHYkNtsPA50yTG node 3717:9342', 'status': STATUS}},
          open(sys.argv[1], 'w'), indent=2)
for n in STATUS:
    print(n.ljust(8), 'anchor', anchor[n], ' '.join(f'{s}:{h}' for s, h in ramps[n].items()))
    print(' ' * 8, 'white-text OK from:', next(s for s, h in ramps[n].items() if contrast(h, '#FFFFFF') >= 4.5))
