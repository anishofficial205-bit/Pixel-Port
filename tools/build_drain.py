"""Stitch the drain cross-section (assets/scenes/drain.webp) from its three painted frames in
assets/drain/src/: top.webp (pavement, open manhole), shaft.webp, grate.webp (grate into the subway).

    python tools/build_drain.py

The frames are joined where their ladder rungs coincide (and before each fades to black at its foot), shifted sideways so the shaft walls line up.
Rows the site doesn't show are cropped: the wet road above the pavement (the hero street's own road
runs down to it) and the new-style subway ceiling under the grate (kept for when the subway is redone).
Printed at the end: the numbers js/main.js needs (DRAIN).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/drain/src"
TOP_CROP = 88            # top.webp: rows above the pavement (road reflections)
BOTTOM_CROP = 632        # grate.webp: first row below the slab the grate sits in
JOIN = [741, 810]        # row of the frame above where the next frame's row 0 goes (rungs coincide)
SHIFT = [0, 10, 8]       # px to the right, so each frame's shaft sits under the top frame's
FADE = [(8, 70), (22, 70)]   # rows of the lower frame over which it fades in

top, shaft, grate = [np.array(Image.open(SRC / n).convert("RGB")).astype(float) for n in ("top.webp", "shaft.webp", "grate.webp")]


def shift(a, dx):
    """Move a frame dx px to the right; the strip that opens up on the left is a mirror of the edge."""
    if not dx: return a
    out = np.empty_like(a)
    out[:, dx:] = a[:, :-dx]
    out[:, :dx] = a[:, :dx][:, ::-1]
    return out


# shaft.webp opens with a second beam of light, although the manhole's beam has already faded out in
# the frame above: paint the shaft's dark interior (from lower down) over it, sparing the wall bracket
rows, c0, c1, src = 330, 744, 948, 400
patch = shaft[src:src + rows, c0:c1].copy()
orig = shaft[:rows, c0:c1]
w = np.clip((rows - np.arange(rows)) / 100.0, 0, 1)[:, None]           # full strength, easing out over the last 100 rows
bracket = np.zeros((rows, c1 - c0), bool)
bracket[80:145, 905 - c0:] = (orig[80:145, 905 - c0:, 0] - orig[80:145, 905 - c0:, 2]) > 55
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
print("pavement line", y(0, 140), "| surface ends", y(0, 195), "| grate", y(2, 560), "-", y(2, 625))
