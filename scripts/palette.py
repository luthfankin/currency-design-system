"""Regenerate Currency color ramps in OKLCH, anchored on the legacy /50 swatch of each hue."""
import json, math, sys

def srgb_to_lin(c): return c/12.92 if c <= 0.04045 else ((c+0.055)/1.055)**2.4
def lin_to_srgb(c): return 12.92*c if c <= 0.0031308 else 1.055*c**(1/2.4)-0.055

def hex_to_rgb(h): h=h.lstrip('#'); return [int(h[i:i+2],16)/255 for i in (0,2,4)]
def rgb_to_hex(rgb): return '#'+''.join(f'{round(max(0,min(1,c))*255):02X}' for c in rgb)

def rgb_to_oklch(rgb):
    r,g,b=[srgb_to_lin(c) for c in rgb]
    l=0.4122214708*r+0.5363325363*g+0.0514459929*b
    m=0.2119034982*r+0.6806995451*g+0.1073969566*b
    s=0.0883024619*r+0.2817188376*g+0.6299787005*b
    l,m,s=[x**(1/3) for x in (l,m,s)]
    L=0.2104542553*l+0.7936177850*m-0.0040720468*s
    a=1.9779984951*l-2.4285922050*m+0.4505937099*s
    bb=0.0259040371*l+0.7827717662*m-0.8086757660*s
    return L, math.hypot(a,bb), math.degrees(math.atan2(bb,a))%360

def oklch_to_rgb_lin(L,C,H):
    a=C*math.cos(math.radians(H)); b=C*math.sin(math.radians(H))
    l=(L+0.3963377774*a+0.2158037573*b)**3
    m=(L-0.1055613458*a-0.0638541728*b)**3
    s=(L-0.0894841775*a-1.2914855480*b)**3
    return [4.0767416621*l-3.3077115913*m+0.2309699292*s,
            -1.2684380046*l+2.6097574011*m-0.3413193965*s,
            -0.0041960863*l-0.7034186147*m+1.7076147010*s]

def oklch_to_hex(L,C,H):
    # reduce chroma until in sRGB gamut
    while True:
        lin=oklch_to_rgb_lin(L,C,H)
        if all(-1e-4<=c<=1+1e-4 for c in lin) or C<=0: break
        C-=0.002
    return rgb_to_hex([lin_to_srgb(max(0,min(1,c))) for c in lin])

def lum(h):
    r,g,b=[srgb_to_lin(c) for c in hex_to_rgb(h)]
    return 0.2126*r+0.7152*g+0.0722*b
def contrast(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)

STEPS=[50,100,200,300,400,500,600,700,800,900,950]
L_TARGET=[0.977,0.945,0.890,0.815,0.725,0.635,0.550,0.470,0.395,0.325,0.255]
C_FACTOR=[0.10,0.22,0.42,0.68,0.88,1.00,0.96,0.86,0.74,0.62,0.50]
# how strongly each step follows the anchor's lightness offset (0 at the ends, 1 at 500)
W=[0.0,0.1,0.3,0.6,0.85,1.0,0.8,0.55,0.35,0.15,0.0]

# legacy /50 swatches (hue identity anchors). "Yellow" is renamed "orange" – its hue is ~55°.
ANCHORS={
  'red':'#E1251B','green':'#00A19B','blue':'#3975EA','orange':'#FFA04E',
  'cyan':'#3FB6CE','pink':'#F670C7','purple':'#7A5AF8','neutral':'#69707A'}

NEUTRAL_L=[0.984,0.962,0.920,0.815,0.670,None,0.470,0.400,0.335,0.275,0.220]
NEUTRAL_C=[0.003,0.005,0.008,0.014,0.018,None,0.019,0.018,0.017,0.016,0.014]
ANCHOR_STEP={}
out={}
for name,hexv in ANCHORS.items():
    L0,C0,H0=rgb_to_oklch(hex_to_rgb(hexv))
    if name=='neutral':
        ANCHOR_STEP[name]=500
        out[name]={s:(hexv.upper() if s==500 else oklch_to_hex(NEUTRAL_L[i],NEUTRAL_C[i],H0)) for i,s in enumerate(STEPS)}
        continue
    a=4 if L0>0.68 else 5           # light hues (orange/cyan/pink) anchor at 400
    ANCHOR_STEP[name]=STEPS[a]
    d=L0-L_TARGET[a]
    ramp={}
    for i,s in enumerate(STEPS):
        if i==a: ramp[s]=hexv.upper(); continue
        w=0 if i in (0,10) else max(0,1-abs(i-a)/4)
        L=L_TARGET[i]+d*w
        C=C0*C_FACTOR[i]/C_FACTOR[a]
        ramp[s]=oklch_to_hex(L,C,H0)
    out[name]=ramp

if __name__=='__main__':
    json.dump({'ramps':out,'anchor':ANCHOR_STEP},open(sys.argv[1],'w'),indent=2)
    for n,r in out.items():
        print(n.ljust(8),' '.join(f'{s}:{h}' for s,h in r.items()))
        print(' '*8,'on-white AA(4.5) from step:',next(s for s,h in r.items() if contrast(h,'#FFFFFF')>=4.5),
              '| white-on-500:',round(contrast(r[500],'#FFFFFF'),2),'| 600:',round(contrast(r[600],'#FFFFFF'),2))
