"""Build the hero street from the illustrated source (assets/street/src/street-source.webp).

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
Image.fromarray(out.astype(np.uint8)).save(ROOT / "assets/scenes/street.webp", quality=93, method=6)

# 2. leaves in front of the tall billboard: everything darker than the board, un-mixed from its cream
bx0, by0, bx1, by1 = LEAVES
reg = a[by0:by1, bx0:bx1]
lum = reg @ np.array([0.299, 0.587, 0.114])
al = np.clip((185 - lum) / 90, 0, 1)
col = np.where(al[..., None] > 0.02, (reg - (1 - al[..., None]) * CREAM) / np.maximum(al[..., None], 0.02), 0)
leaves = np.dstack([np.clip(col, 0, 255), al * 255]).astype(np.uint8)
Image.fromarray(leaves).save(ROOT / "assets/street/leaves.png")
print("street", im.size, "leaves", leaves.shape[1::-1])
