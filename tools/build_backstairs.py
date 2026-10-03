"""Build the staircase between the cinema and the gallery (assets/backstairs/src/stairs.webp).

    python tools/build_backstairs.py

Writes
  assets/scenes/backstairs.webp  the painting, as is
  assets/backstairs/rails.png    everything that stands between him and the viewer once he is on the
                                 stairs: both flights' handrails and balusters, the landings' balustrades
                                 and the newel posts
and prints the blank frames' boxes for js/main.js.
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
metal = (r > 125) & (r - b > 60)                      # brass, lit warm
box = lambda x0, y0, x1, y1: (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)

# handrails: y of the rail's top edge along each flight, and of the steps' noses below it
RAIL1 = lambda x: 360 + 0.67 * (x - 550)              # lower flight (it climbs to the left), x 550..1050
NOSE1 = lambda x: 462 + 0.746 * (x - 550)
RAIL2 = lambda x: 405 - 0.443 * (x - 705)             # upper flight, x 705..1057
NOSE2 = lambda x: 495 - 0.43 * (x - 745)

mask = np.zeros((H, W), bool)
# lower flight: the handrail and everything brass between it and the steps (balusters, the fan panels)
f1 = (xx >= 552) & (xx <= 1050)
mask |= f1 & metal & (yy >= RAIL1(xx) - 8) & (yy < NOSE1(xx) - 16)
mask &= ~box(736, 538, 808, 652)                      # ...but not the cat sitting on the steps
# upper flight
f2 = (xx >= 706) & (xx <= 1058)
mask |= f2 & metal & (yy >= RAIL2(xx) - 8) & (yy < NOSE2(xx) - 6)
# middle landing balustrade, top landing balustrade (the door behind it is lit warm too: there only the rails count)
# (below the handrail only brass counts, so the red door and the plant pots behind stay behind)
brass = metal & (g > 95)
mask |= box(206, 346, 528, 362) & metal | box(206, 362, 528, 462) & brass
top = box(1096, 244, 1590, 260) & metal | box(1096, 260, 1590, 364) & brass
top &= ~box(1322, 260, 1458, 364) | box(0, 272, W, 280) | box(0, 352, W, 364)
mask |= top
mask = nd.binary_closing(mask, iterations=1)
lab, n = nd.label(mask)                               # drop specks (lamp glow on the wall)
size = nd.sum(mask, lab, range(1, n + 1))
mask = np.isin(lab, [i + 1 for i in range(n) if size[i] >= 30])
# newel posts are solid: bottom of the lower flight (with the coffee cup), its top (with the cap),
# the foot of the upper flight, its top, and the middle landing's far end
for x0, y0, x1, y1 in ((1046, 640, 1094, 818), (526, 318, 556, 470), (676, 372, 708, 512), (1056, 213, 1096, 364), (180, 300, 208, 468)):
    mask |= box(x0, y0, x1, y1)
mask |= box(508, 318, 568, 352) & (r + g + b > 60)    # the cap's peak

alpha = nd.gaussian_filter(mask.astype(float), 0.6).clip(0, 1)
ys, xs = np.nonzero(alpha > 0)
BOX = (int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1)
rails = np.dstack([np.where(alpha[..., None] > 0, a, 0), alpha * 255]).astype(np.uint8)
Image.fromarray(rails).crop(BOX).save(ROOT / "assets/backstairs/rails.png", optimize=True)
Image.fromarray(a).save(ROOT / "assets/scenes/backstairs.webp", quality=90, method=6)

cream = nd.binary_opening((r > 232) & (g > 215) & (b > 150), iterations=4)
lab, n = nd.label(cream)
frames = []
for i, sl in enumerate(nd.find_objects(lab)):
    w, h = sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
    if w * h > 2000 and (lab[sl] == i + 1).mean() > 0.9 and 300 < sl[1].start < 1200:
        frames.append([sl[1].start - 1, sl[0].start - 1, w + 2, h + 2])
print("blank frames: x, y, w, h =", sorted(frames))
print("rails box: x, y, w, h =", [BOX[0], BOX[1], BOX[2] - BOX[0], BOX[3] - BOX[1]])
