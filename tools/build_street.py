"""Build the hero street from the illustrated source (assets/street/src/street-source.webp).

The metro on the overpass is lifted out as its own image so it can move (see step 2).
The source has a manhole painted in the middle of the road, but the manhole he drops into belongs to
the drain art's pavement (tools/build_drain.py), so it is painted out of the road here. The leaves that
overlap the tall billboard are cut out (assets/street/leaves.png) so they stay in front of the project ads.

    python tools/build_street.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/street/src/street-source.webp"
MANHOLE = dict(cx=877, cy=865, rx=119, ry=22)   # the painted manhole, source px
LEAVES = (1398, 360, 1442, 434)                 # box around the leaves on the tall board's corner
CREAM = np.array([247, 232, 200.0])

im = Image.open(SRC).convert("RGB")
a = np.array(im).astype(float)
H, W = a.shape[:2]
yy, xx = np.mgrid[0:H, 0:W]
M = MANHOLE
ell = lambda grow: ((xx - M["cx"]) / (M["rx"] + grow)) ** 2 + ((yy - M["cy"]) / (M["ry"] + grow)) ** 2

# 1. paint the road back over the manhole: every pixel takes a grain from the road just above or below, in its
#    own column, so the vertical reflections carry straight through
rng = np.random.default_rng(3)
mask = ell(5) < 1
out = a.copy()
for x in np.unique(xx[mask]):
    ys = np.nonzero(mask[:, x])[0]
    top, bot = ys[0], ys[-1]
    for y in ys:
        t = (y - top + 0.5) / (bot - top + 1)
        sy = top - 1 - rng.integers(0, 9) if rng.random() > t else bot + 1 + rng.integers(0, 9)
        sx = min(W - 1, max(0, x + rng.integers(-1, 2)))
        out[y, x] = a[min(H - 1, sy), sx]

# 2. the metro on the overpass moves, so it is lifted out of the painting:
#    - assets/street/train.png: a three-car train built from the painted front car (tail = the front car
#      mirrored, middle = its body without the nose)
#    - the sky and the overpass railing are painted in where it stood
#    - assets/street/posts.png: the two lamp posts that stand in front of it
from scipy import ndimage as nd
TX0, TX1, TY0, TY1 = 608, 1111, 342, 382     # the painted train: from the building's edge to its nose; roof to floor
CAR = (768, 1110)                            # the front car, starting at the gap between cars
BODY = 278                                   # ...and how much of it is plain body (before the nose)
POSTS = (665, 966)                           # lamp posts in front of the train (x of each pole)
RAIL = (1114, 1144, 364)                     # one period of the railing right of the nose (x from, to; top row)

car = a[TY0:TY1, CAR[0]:CAR[1]].copy()
px = POSTS[1] - CAR[0]                       # the post (and its box) crossing the front car: plain body over it,
plain = a[TY0:TY1, 1010:1021]                # taken from between two windows further along
car[:, px - 10:px + 12] = np.concatenate([plain, plain[:, ::-1]], 1)
r, g, b = car[..., 0], car[..., 1], car[..., 2]
lab, _ = nd.label((b > 130) & (g > 82) & (r < 70))                      # sky, reached from the crop's top right corner
alpha = (lab != lab[0, -1]).astype(float)
alpha[:, -8:] *= (r[:, -8:] > 150)                                       # a sliver of railing beside the nose
alpha = nd.gaussian_filter(alpha, 0.6)
front = np.dstack([car, alpha * 255])
train = np.concatenate([front[:, ::-1], front[:, :BODY], front], 1)
Image.fromarray(np.clip(train, 0, 255).astype(np.uint8)).save(ROOT / "assets/street/train.png", optimize=True)

# sky where the train stood: grain from clear sky higher up, block by block, tinted to the sky just above
tint = np.median(a[333:340, :], 0)
tint[:TX0 + 36] = tint[TX0 + 36]                                        # (not the building's dark edge)
tint = nd.uniform_filter1d(tint, 60, axis=0)
for y in range(TY0 - 2, TY1, 10):
    for x in range(TX0, TX1, 10):
        h, w = min(10, TY1 - y), min(10, TX1 - x)
        sx, sy = rng.integers(700, 930), rng.integers(268, 290)
        blk = a[sy:sy + h, sx:sx + w]
        out[y:y + h, x:x + w] = (blk - blk.mean((0, 1))) * 0.3 + tint[x:x + w].mean(0)   # the sky is smoother down here
rx0, rx1, ry = RAIL                                                      # the railing carries on behind it
tile = a[ry:TY1, rx0:rx1]
for x in range(rx0 - (rx1 - rx0), TX0 - (rx1 - rx0), -(rx1 - rx0)):
    x0 = max(x, TX0)
    out[ry:TY1, x0:x + (rx1 - rx0)] = tile[:, x0 - x:]
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(ROOT / "assets/scenes/street.webp", quality=93, method=6)

# the lamp posts, continued down from their cross-section just above the train
PX0, PX1 = POSTS[0] - 9, POSTS[1] + 7
posts = np.zeros((TY1 + 1 - (TY0 - 1), PX1 - PX0, 4))
for cx in POSTS:
    sec = a[326:338, cx - 5:cx + 6].mean(0)
    sky = np.median(a[326:338, cx - 12:cx - 6].reshape(-1, 3), 0)
    al = np.clip((sky.sum() - sec.sum(-1)) / (sky.sum() - 40), 0, 1)
    posts[:, cx - 5 - PX0:cx + 6 - PX0, :3] = [14, 10, 24]
    posts[:, cx - 5 - PX0:cx + 6 - PX0, 3] = np.clip(al * 1.4, 0, 1) * 255
bx = POSTS[0] - PX0                                                      # the left post's junction box
posts[357 - TY0 + 1:374 - TY0 + 1, bx - 5:bx + 4] = [14, 10, 24, 255]
Image.fromarray(posts.astype(np.uint8)).save(ROOT / "assets/street/posts.png", optimize=True)
print("train", train.shape[1], "x", train.shape[0], "| track x", TX0, "y", TY0, "| posts box", [PX0, TY0 - 1, PX1 - PX0, posts.shape[0]])

# the lights that stay on when the opening screen dims the street (assets/street/lights.png): whole lit
# windows, the overpass lamps, the chai stall's bulbs, the stars and the moon. Nothing partial: a window
# counts only if it is a clean rectangle, and the lamp cones, the trees and the shop fronts are left out.
o = np.clip(out, 0, 255)
r, g, b = o[..., 0], o[..., 1], o[..., 2]
keep = np.zeros(o.shape[:2], bool)
yellow = (r > 205) & (g > 150) & (b < 200) & (r - b > 45)
lab, n = nd.label(nd.binary_opening(yellow, structure=np.ones((5, 5))))
for i, sl in enumerate(nd.find_objects(lab)):
    y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
    h, w = y1 - y0, x1 - x0
    fill = (lab[sl] == i + 1).mean()
    upstairs = y1 < 490 and not (60 < x0 < 300 and y0 > 255 and x0 < 250) and not (x0 > 1440 and y0 > 320)   # above the shops; not in a lamp's cone
    if upstairs and 9 <= w <= 64 and 14 <= h <= 95 and fill > 0.8:
        keep[y0:y1, x0:x1] = True                                   # the whole pane, frame bars and all
round_lights = np.zeros_like(keep)
round_lights[296:332, 640:1180] = True                              # the overpass lamps
round_lights[556:622, 1430:1575] = True                             # the chai stall's bulbs
sky = np.zeros_like(keep)
sky[:335, 500:1310] = True                                          # the open sky between the rooftops
sky[60:128, 1318:1384] = True                                       # ...and the star above the right-hand hoarding
pale = (r > 200) & (g > 185) & (b > 100)
glow = nd.binary_opening(pale, iterations=1)
lab, n = nd.label(glow & (sky | round_lights))
size = nd.sum(glow & (sky | round_lights), lab, range(1, n + 1))
keep |= nd.binary_dilation(np.isin(lab, [i + 1 for i in range(n) if size[i] >= 12]), iterations=2)
al = nd.gaussian_filter(keep.astype(float), 0.8)
Image.fromarray(np.dstack([o, np.clip(al * 255, 0, 255)]).astype(np.uint8)).save(ROOT / "assets/street/lights.png", optimize=True)
Image.open(ROOT / "assets/street/lights.png").save(ROOT / "assets/street/lights.webp", quality=88, method=6)   # what 1x screens load

# 3. leaves in front of the tall billboard: everything darker than the board, un-mixed from its cream
bx0, by0, bx1, by1 = LEAVES
reg = a[by0:by1, bx0:bx1]
lum = reg @ np.array([0.299, 0.587, 0.114])
al = np.clip((185 - lum) / 90, 0, 1)
col = np.where(al[..., None] > 0.02, (reg - (1 - al[..., None]) * CREAM) / np.maximum(al[..., None], 0.02), 0)
leaves = np.dstack([np.clip(col, 0, 255), al * 255]).astype(np.uint8)
Image.fromarray(leaves).save(ROOT / "assets/street/leaves.png")
print("street", im.size, "leaves", leaves.shape[1::-1])
