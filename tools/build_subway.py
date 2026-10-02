"""Build the subway from its three painted frames (assets/subway/src/):

  landing.webp  under the drain's grate: the train, turnstiles, the pool of light he lands in
  boards.webp   the tiled wall with two blank billboards and the clock
  lobby.webp    the stairs up to the cinema lobby (ticket booth, posters, popcorn, red doors)

    python tools/build_subway.py

Writes
  assets/scenes/subway.webp     landing + boards + boards again (four billboards for the four featured
                                projects; the second copy has the train's nose painted out of its left edge)
  assets/scenes/stairwell.webp  the lobby frame, moved up and its tracks stretched so that its wall stripe,
                                platform, warning strip and rails carry on from the frame before it
  assets/subway/rails.png       what stands in front of him up there: the staircase's near handrail and
                                balusters, the rail along the lobby's edge, the rope barrier
and prints the billboard and poster panels for js/main.js.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/subway/src"
landing, boards, lobby = [np.array(Image.open(SRC / n).convert("RGB")) for n in ("landing.webp", "boards.webp", "lobby.webp")]
H, W = boards.shape[:2]

# ---- second copy of the billboard wall: plain wall where the train's nose was ----
again = boards.astype(float).copy()
NOSE = (0, 220, 344, 606)          # x0, x1, y0, y1 of the train's nose
x0, x1, y0, y1 = NOSE
wall = again[y0:y1, W - 100:]                                    # bare wall at the frame's right edge...
patch = np.concatenate([wall[:, ::-1], wall, wall[:, ::-1]], 1)[:, :x1 - x0]   # ...mirrored outwards from the join
k = np.ones((y1 - y0, x1 - x0))
k[:, -18:] *= np.linspace(1, 0, 18)                   # feather into the wall on the right
k[:14] *= np.linspace(0, 1, 14)[:, None]              # ...and under the lamp above
again[y0:y1, x0:x1] = again[y0:y1, x0:x1] * (1 - k[..., None]) + patch * k[..., None]

# ---- the lobby frame was painted a little lower and with its tracks squeezed: resample its rows so
# the lines the two frames share meet (row in the output <- row in the painting) ----
ROWS = [(0, 82), (516, 598), (608, 686), (688, 761), (701, 776), (728, 798), (762, 822), (824, 868), (896, 928), (940, 940)]
src_y = np.interp(np.arange(H), [o for o, _ in ROWS], [s for _, s in ROWS])
lo = np.floor(src_y).astype(int)
f = (src_y - lo)[:, None, None]
lob = lobby.astype(float)
lobby = lob[lo] * (1 - f) + lob[np.minimum(lo + 1, H - 1)] * f
UP = ROWS[0][1]                    # above the wall stripe the frame is simply this many rows higher

# ---- joins: the frames were painted separately, so each side of a join is eased toward the other's mirror
# image over a few px (floor reflections and ceiling beams then meet instead of stopping dead) ----
full = np.concatenate([landing, boards, again, lobby], 1).astype(float)
BLEND = 36
for j in (W, 2 * W, 3 * W):
    left, right = full[:, j - BLEND:j].copy(), full[:, j:j + BLEND].copy()
    k = np.linspace(0, 0.5, BLEND)[None, :, None]                    # 0 away from the join, 0.5 on it
    full[:, j - BLEND:j] = left * (1 - k) + right[:, ::-1] * k
    full[:, j:j + BLEND] = right * (1 - k[:, ::-1]) + left[:, ::-1] * k[:, ::-1]
full = np.clip(full, 0, 255).astype(np.uint8)
strip, lobby = full[:, :3 * W], full[:, 3 * W:]
Image.fromarray(strip).save(ROOT / "assets/scenes/subway.webp", quality=88, method=6)
Image.fromarray(lobby).save(ROOT / "assets/scenes/stairwell.webp", quality=90, method=6)


# ---- blank panels (cream): billboards on the wall, posters in the lobby ----
def panels(a, min_area):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    cream = nd.binary_opening((r > 232) & (g > 215) & (b > 150), iterations=4)
    lab, n = nd.label(cream)
    out = []
    for i, sl in enumerate(nd.find_objects(lab)):
        w, h = sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
        if w * h >= min_area and (lab[sl] == i + 1).mean() > 0.9:
            out.append([sl[1].start, sl[0].start, w, h])
    return sorted(out)


print("billboards (subway art px):", panels(strip, 60000))
print("posters (stairwell art px):", panels(lobby, 9000))

# ---- what stands in front of him ----
a = lobby.astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
yy, xx = np.mgrid[0:H, 0:W]
metal = (r > 120) & (r - b > 60)                                       # brass and red, lit warm
box = lambda x0, y0, x1, y1: (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1)
mask = np.zeros((H, W), bool)
# staircase (it climbs to the left): the near handrail runs along y = RAIL(x); balusters stand on the steps below
RAIL = lambda x: 337 - UP + 0.745 * (x - 365)
NOSE_LINE = lambda x: 378 - UP + 0.749 * (x - 290)
on_stairs = (xx >= 360) & (xx <= 726)
mask |= on_stairs & (yy >= RAIL(xx) - 3) & (yy <= RAIL(xx) + 9) & metal
between = on_stairs & (yy > RAIL(xx) + 9) & (yy < NOSE_LINE(xx) - 3)
dark = (r + g + b < 95)                                                 # the balusters are dark posts
posts = nd.binary_opening(dark & between, structure=np.ones((26, 1)))   # ...at least this tall (the wall's tile joints aren't)
mask |= nd.binary_dilation(posts, structure=np.ones((1, 3))) & between
mask |= box(712, 596 - UP, 730, 694 - UP) & (dark | metal)             # the post at the foot
# lobby edge: the rail and its posts, and the rope barrier in front of the ticket booth
RAIL_Y = (366 - UP, 375 - UP)
mask |= (xx >= 432) & (yy >= RAIL_Y[0]) & (yy < RAIL_Y[1])
for px in (805, 945, 1080, 1196, 1333, 1462, 1557):
    mask |= (np.abs(xx - px) <= 5) & (yy >= 340 - UP) & (yy <= 446 - UP) & (dark | metal) & (r + g + b < 260)
for px in (637, 976):                                                   # rope stanchions: a brass pole on a wide foot
    brass = (r > 110) & (g > 60) & (b < 120) & (r - b > 50)
    mask |= (np.abs(xx - px) <= 6) & (yy >= 324 - UP) & (yy < 432 - UP) & brass
    mask |= (np.abs(xx - px) <= 3) & (yy >= 336 - UP) & (yy < 432 - UP) & (dark | brass)
    mask |= (np.abs(xx - px) <= 17) & (yy >= 432 - UP) & (yy <= 447 - UP) & brass
mask |= box(650, 372 - UP, 965, 424 - UP) & (r > 150) & (g < 70) & (b < 70) & (yy > 380 - UP)   # the rope
mask = nd.binary_closing(mask, iterations=1)
alpha = nd.gaussian_filter(mask.astype(float), 0.6).clip(0, 1)
rails = np.dstack([np.where(alpha[..., None] > 0, lobby, 0), alpha * 255]).astype(np.uint8)
ys, xs = np.nonzero(alpha)
BOX = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
Image.fromarray(rails).crop(BOX).save(ROOT / "assets/subway/rails.png", optimize=True)
print("rails box (stairwell art px): x, y, w, h =", [int(BOX[0]), int(BOX[1]), int(BOX[2] - BOX[0]), int(BOX[3] - BOX[1])])
print("strip", strip.shape[1], "x", strip.shape[0], "| lobby rows are", UP, "higher than painted")
