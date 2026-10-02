"""Build the staircase between the cinema and the gallery (assets/backstairs/src/stairs.webp).

    python tools/build_backstairs.py

Writes
  assets/scenes/backstairs.webp  the painting, as is
  assets/backstairs/rails.png    everything that stands between him and the viewer once he is on the
                                 stairs: both flights' handrails and balusters, the two landings'
                                 balustrades and their newel posts
and prints the blank poster's box for js/main.js.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
a = np.array(Image.open(ROOT / "assets/backstairs/src/stairs.webp").convert("RGB"))
H, W = a.shape[:2]
r, g, b = [a[..., i].astype(int) for i in range(3)]
yy, xx = np.mgrid[0:H, 0:W]
metal = (r - b > 50) & (r > 115)                      # the orange-lit metalwork (and anything else orange)
box = lambda x0, y0, x1, y1: (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)

# handrails: y of the rail's top edge along each flight, and of the steps' noses below it
RAIL1 = lambda x: 396 + 0.612 * (x - 565)             # lower flight, x 565..1148
NOSE1 = lambda x: 505 + 0.585 * (x - 585)
RAIL2 = lambda x: 385 - 0.585 * (x - 560)             # upper flight, x 560..890
NOSE2 = lambda x: 496 - 0.54 * (x - 480)


def thin_cols(m, width=6):
    """Pixels of m in vertical strokes at most `width` px wide (balusters, not step treads)."""
    lab, n = nd.label(m, structure=[[0, 0, 0], [1, 1, 1], [0, 0, 0]])         # horizontal runs
    runs = nd.sum(m, lab, range(1, n + 1))
    return m & np.isin(lab, [i + 1 for i in range(n) if runs[i] <= width])


mask = np.zeros((H, W), bool)
# lower flight: the handrail, the thin rail under it, and the balusters down to the steps
f1 = (xx >= 566) & (xx <= 1150)
mask |= f1 & metal & (yy >= RAIL1(xx) - 7) & (yy <= RAIL1(xx) + 12)
mask |= f1 & thin_cols(metal & (yy > RAIL1(xx) + 12) & (yy < NOSE1(xx) - 3), 7)
mask |= box(1128, 742, 1152, 842) & metal                                   # the rail's curl and end post
# upper flight: handrail and the thin rail under it
f2 = (xx >= 572) & (xx <= 880)
mask |= f2 & metal & (yy >= RAIL2(xx) - 7) & (yy <= RAIL2(xx) + 12)
mask |= f2 & metal & (yy >= RAIL2(xx) + 30) & (yy <= RAIL2(xx) + 50) & (yy < NOSE2(xx) - 3)
# middle landing: balustrade (the wall behind it is dark) and its newel posts
mask |= box(186, 400, 532, 481) & metal
mask |= box(150, 384, 187, 500) | box(520, 371, 573, 393) | box(531, 393, 567, 505)
# top landing: balustrade and newel. The door behind it is orange too, so in front of the door only the rails count
top = box(928, 196, 1520, 289) & metal
top &= ~box(1284, 196, 1394, 289) | box(0, 197, W, 211) | box(0, 230, W, 238) | box(0, 245, W, 252)
mask |= top
mask |= box(870, 171, 931, 196) | box(880, 196, 926, 300)

mask = nd.binary_closing(mask, iterations=1)
lab, n = nd.label(mask)                                                     # drop specks (lamp glow)
size = nd.sum(mask, lab, range(1, n + 1))
mask = np.isin(lab, [i + 1 for i in range(n) if size[i] >= 40])
alpha = nd.gaussian_filter(mask.astype(float), 0.6).clip(0, 1)
ys, xs = np.nonzero(alpha > 0)
BOX = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
rails = np.dstack([np.where(alpha[..., None] > 0, a, 0), alpha * 255]).astype(np.uint8)
Image.fromarray(rails).crop(BOX).save(ROOT / "assets/backstairs/rails.png", optimize=True)
Image.fromarray(a).save(ROOT / "assets/scenes/backstairs.webp", quality=90, method=6)

bright = a[100:300, 340:490].astype(int).sum(-1) > 560                    # the blank poster on the wall
ys, xs = np.nonzero(bright.mean(1) > 0.5)[0], np.nonzero(bright.mean(0) > 0.5)[0]
print("poster: x, y, w, h =", [340 + int(xs.min()), 100 + int(ys.min()), int(xs.max() - xs.min()) + 1, int(ys.max() - ys.min()) + 1])
print("rails box: x, y, w, h =", [BOX[0], BOX[1], BOX[2] - BOX[0], BOX[3] - BOX[1]])
