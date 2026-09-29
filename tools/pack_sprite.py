"""Re-pack the character sprite sheet into uniform cells.

usage: python3 tools/pack_sprite.py assets/character/source-sheet.webp assets/character/sheet.webp
needs: pip install pillow numpy scipy

Frames are found as separate blobs on the transparent sheet, read left to right, top to bottom.
If the layout of the source sheet changes, update `names` below and ANIMS in js/sprite.js.
"""
import sys, numpy as np, json
from PIL import Image
from scipy import ndimage as nd
im = np.array(Image.open(sys.argv[1]).convert('RGBA'))
fg = im[..., 3] > 100
L, n = nd.label(fg, structure=np.ones((3,3)))
sizes = nd.sum(fg, L, range(1, n+1)); objs = nd.find_objects(L)
big = [(i+1, objs[i]) for i in range(n) if sizes[i] > 1500]
big.sort(key=lambda t:(t[1][0].start//150, t[1][1].start))
# attach tiny specks (hair tips, dust) to the nearest big frame
frames = []
for lab, sl in big:
    frames.append({'lab': lab, 'y0': sl[0].start, 'x0': sl[1].start, 'y1': sl[0].stop, 'x1': sl[1].stop})
for i in range(n):
    if 20 < sizes[i] <= 1500:
        sl = objs[i]; cy = (sl[0].start+sl[0].stop)/2; cx = (sl[1].start+sl[1].stop)/2
        best = min(frames, key=lambda f: max(0, f['x0']-cx, cx-f['x1']) + max(0, f['y0']-cy, cy-f['y1']))
        best.setdefault('extra', []).append(i+1)
        best['x0']=min(best['x0'],sl[1].start); best['x1']=max(best['x1'],sl[1].stop)
        best['y0']=min(best['y0'],sl[0].start); best['y1']=max(best['y1'],sl[0].stop)
names = {}
def put(name, idxs): names[name] = idxs
put('idle',[0,1,2,3]); put('walk',list(range(4,13))); put('run',list(range(13,19)))
put('crouch',[19,20,21]); put('fall',[22,23,24,29]); put('land',[30,31,25])
put('look',[26,27]); put('point',[28]); put('jump',[32,33,34,35,36]); put('cinema',[37,38])
put('stroll',[39,40]); put('gaze',[41]); put('chai',[42,43,44,45]); put('wave',[46,47,48,49]); put('talk',[50,51,52])
crops = []
for f in frames:
    labs = [f['lab']] + f.get('extra', [])
    m = np.isin(L[f['y0']:f['y1'], f['x0']:f['x1']], labs)
    c = im[f['y0']:f['y1'], f['x0']:f['x1']].copy(); c[~m] = 0
    h, w = m.shape
    top = m[: max(1, int(h*0.45))]
    ys, xs = np.nonzero(top)
    ax = int(np.median(xs)) if len(xs) else w//2
    crops.append((c, ax))
# per-frame anchor overrides: frames where the head isn't over the feet use bbox centre
for i in names['crouch'] + names['cinema'] + names['chai']:
    c, ax = crops[i]; crops[i] = (c, c.shape[1]//2 if i in names['cinema'] else ax)
left = max(ax for c, ax in crops); right = max(c.shape[1]-ax for c, ax in crops)
CW = 2*max(left, right) + 4; CH = max(c.shape[0] for c, ax in crops) + 2
cols = 10; rows = (len(crops)+cols-1)//cols
out = np.zeros((rows*CH, cols*CW, 4), np.uint8)
for i, (c, ax) in enumerate(crops):
    r, k = divmod(i, cols)
    ox = k*CW + CW//2 - ax; oy = r*CH + CH - c.shape[0]
    out[oy:oy+c.shape[0], ox:ox+c.shape[1]] = c
Image.fromarray(out).save(sys.argv[2], lossless=True, method=6)
meta = {'cw': CW, 'ch': CH, 'cols': cols, 'anims': names}
print(meta['cw'], meta['ch'], out.shape)
print('cell', CW, 'x', CH, '-> update CW/CH in js/sprite.js if these change')
