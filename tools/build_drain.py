"""Stitch the drain cross-section (assets/scenes/drain.webp) from its three painted frames in
assets/drain/src/: top.webp (pavement, open manhole), shaft.webp, grate.webp (grate into the subway).

    python tools/build_drain.py

The frames are joined where their ladder rungs coincide (and before each fades to black at its foot), shifted sideways so the shaft walls line up.
Rows the site doesn't show are cropped: some of the road above the pavement (the hero street's own road
runs down to it) and the subway glimpsed under the grate (the real subway hangs there instead).
Printed at the end: the numbers js/main.js needs (DRAIN).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/drain/src"
TOP_CROP = 14            # top.webp: rows of road cropped off its top (the hero street's road runs down to it)
BOTTOM_CROP = 602        # grate.webp: first row below the slab the grate sits in
JOIN = [690, 771]        # row of the frame above where the next frame's row 0 goes (rungs coincide)
SHIFT = [0, 0, 0]        # px to the right, so each frame's shaft sits under the top frame's
FADE = [(8, 70), (22, 70)]   # rows of the lower frame over which it fades in
POST = (1468, 0, 1580, 136)  # top.webp: a lamp post on the pavement; the street above has none there

top, shaft, grate = [np.array(Image.open(SRC / n).convert("RGB")).astype(float) for n in ("top.webp", "shaft.webp", "grate.webp")]


def shift(a, dx):
    """Move a frame dx px to the right; the strip that opens up on the left is a mirror of the edge."""
    if not dx: return a
    out = np.empty_like(a)
    out[:, dx:] = a[:, :-dx]
    out[:, :dx] = a[:, :dx][:, ::-1]
    return out


# the lamp post: paint the road and pavement beside it over it
x0, y0, x1, y1 = POST
top[y0:y1, x0:x1] = top[y0:y1, x0 - (x1 - x0):x0][:, ::-1]

# shaft.webp opens with a second beam of light, although the manhole's beam has already faded out in
# the frame above: paint the shaft's dark interior (from lower down) over it, sparing the wall bracket
rows, c0, c1, src = 330, 756, 946, 430
patch = shaft[src:src + rows, c0:c1].copy()
orig = shaft[:rows, c0:c1]
w = np.clip((rows - np.arange(rows)) / 100.0, 0, 1)[:, None]           # full strength, easing out over the last 100 rows
bracket = np.zeros((rows, c1 - c0), bool)
bracket[100:150, 905 - c0:] = (orig[100:150, 905 - c0:, 0] - orig[100:150, 905 - c0:, 2]) > 55
bracket = nd.binary_dilation(bracket, iterations=3)
w = np.where(bracket, 0, w)
w = nd.gaussian_filter(w, 2)
shaft[:rows, c0:c1] = orig * (1 - w[..., None]) + patch * w[..., None]

frames = [top, shift(shaft, SHIFT[1]), shift(grate, SHIFT[2])]
starts = [0, JOIN[0], JOIN[0] + JOIN[1]]
H = starts[2] + BOTTOM_CROP
out = np.zeros((H, top.shape[1], 3))
out[:top.shape[0]] = top
filled = top.shape[0]                                   # rows of `out` that already hold a frame
for f, y0, (a, b) in zip(frames[1:], starts[1:], FADE):
    n = min(f.shape[0], H - y0)
    k = np.clip((np.arange(n) - a) / (b - a), 0, 1)
    k = np.where(np.arange(y0, y0 + n) < filled, k * k * (3 - 2 * k), 1)[:, None, None]
    out[y0:y0 + n] = out[y0:y0 + n] * (1 - k) + f[:n] * k
    filled = y0 + n
out = out[TOP_CROP:]
Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)).save(ROOT / "assets/scenes/drain.webp", quality=88, method=6)
y = lambda frame, row: starts[frame] + row - TOP_CROP
print("size", out.shape[1], "x", out.shape[0])
print("pavement line", y(0, 120), "| surface ends", y(0, 200), "| grate", y(2, 530), "-", y(2, 600))
