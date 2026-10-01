"""Build the subway from its three painted frames (assets/subway/src/):

  landing.webp  under the drain's grate: the train, turnstiles, the pool of light he lands in
  boards.webp   the tiled wall with two blank billboards and the clock
  lobby.webp    the stairs up to the cinema lobby (ticket booth, posters, popcorn, red doors)

    python tools/build_subway.py

Writes
  assets/scenes/subway.webp     landing + boards + boards again (four billboards for the four featured
                                projects; the second copy has the train's nose painted out of its left edge)
  assets/scenes/stairwell.webp  the lobby frame, as is
  assets/subway/rails.png       the railings that stand in front of him (the staircase's near handrail and
                                balusters, the rail along the lobby's edge), drawn over the character
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
NOSE = (0, 128, 296, 588)          # x0, x1, y0, y1 of the train's nose and its tail light
WALL = 1500                        # the same rows of bare wall are copied from here
x0, x1, y0, y1 = NOSE
patch = again[y0:y1, WALL:WALL + (x1 - x0)].copy()
k = np.ones((y1 - y0, x1 - x0))
k[:, -16:] *= np.linspace(1, 0, 16)                   # feather into the wall on the right
k[:14] *= np.linspace(0, 1, 14)[:, None]              # ...and under the lamp above
k[-10:] *= np.linspace(1, 0, 10)[:, None]
again[y0:y1, x0:x1] = again[y0:y1, x0:x1] * (1 - k[..., None]) + patch * k[..., None]
# its reflection on the wet floor: mirror the floor just to the right
fx0, fx1, fy0, fy1 = 0, 128, 588, 690
again[fy0:fy1, fx0:fx1] = again[fy0:fy1, fx1:fx1 + (fx1 - fx0)][:, ::-1]

# ---- joins: the frames were painted separately, so each side of a join is eased toward the other's mirror
# image over a few px (floor reflections and ceiling beams then meet instead of stopping dead) ----
full = np.concatenate([landing, boards, again, lobby], 1).astype(float)
BLEND = 36
for j in (W, 2 * W, 3 * W):
    left, right = full[:, j - BLEND:j].copy(), full[:, j:j + BLEND].copy()
    k = (np.linspace(0, 0.5, BLEND) ** 1)[None, :, None]             # 0 away from the join, 0.5 on it
    full[:, j - BLEND:j] = left * (1 - k) + right[:, ::-1] * k
    full[:, j:j + BLEND] = right * (1 - k[:, ::-1]) + left[:, ::-1] * k[:, ::-1]
full = np.clip(full, 0, 255).astype(np.uint8)
strip, lobby = full[:, :3 * W], full[:, 3 * W:]
Image.fromarray(strip).save(ROOT / "assets/scenes/subway.webp", quality=88, method=6)
Image.fromarray(lobby).save(ROOT / "assets/scenes/stairwell.webp", quality=90, method=6)


# ---- blank panels (cream): billboards on the wall, posters in the lobby ----
def panels(a, min_area):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    cream = nd.binary_opening((r > 235) & (g > 215) & (b > 150), iterations=4)
    lab, n = nd.label(cream)
    out = []
    for i, sl in enumerate(nd.find_objects(lab)):
        w, h = sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
        if w * h >= min_area and (lab[sl] == i + 1).mean() > 0.9:
            out.append([sl[1].start, sl[0].start, w, h])
    return sorted(out)


print("billboards (subway art px):", panels(strip, 60000))
print("posters (stairwell art px):", panels(lobby, 9000))

# ---- railings in front of him ----
a = lobby.astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
yy, xx = np.mgrid[0:H, 0:W]
metal = (r - b > 45) & (r > 105) & ~((g > 200) & (b > 150))          # the rails' orange-lit metal, not the cream posters
mask = np.zeros((H, W), bool)
# staircase, near side: the handrail runs along y = RAIL(x); its balusters stand on the stringer below
RAIL = lambda x: 681.7 - 0.718 * x
STRINGER = lambda x: 598 - 0.8375 * (x - 300)
on_stairs = (xx >= 312) & (xx <= 640)
mask |= on_stairs & (yy >= RAIL(xx) - 2) & (yy <= RAIL(xx) + 11) & metal
between = on_stairs & (yy > RAIL(xx) + 11) & (yy < STRINGER(xx) - 2)
share = (metal & between).sum(0) / np.maximum(between.sum(0), 1)       # balusters: columns that are metal top to bottom
far = np.minimum(np.roll(share, 6), np.roll(share, -6))                 # ...and thin (the wall behind is warm in places)
cols = nd.binary_dilation((share > 0.55) & (far < 0.35), iterations=1)
mask |= between & cols[None, :] & metal
mask |= (xx >= 294) & (xx <= 316) & (yy >= 462) & (yy <= 602) & metal   # the newel post at the foot
# lobby edge: one rail along it, a post every so often
LOBBY_RAIL = (236, 244)
POSTS = [640, 783, 977, 1143, 1253, 1405, 1620]
mask |= (xx >= 628) & (yy >= LOBBY_RAIL[0]) & (yy <= LOBBY_RAIL[1]) & ~((g > 200) & (b > 150))
for px in POSTS:
    mask |= (np.abs(xx - px) <= 3) & (yy > LOBBY_RAIL[1]) & (yy <= 324) & metal
mask = nd.binary_closing(mask, iterations=1)
alpha = nd.gaussian_filter(mask.astype(float), 0.6).clip(0, 1)
rails = np.dstack([np.where(alpha[..., None] > 0, lobby, 0), alpha * 255]).astype(np.uint8)
ys, xs = np.nonzero(alpha)
BOX = (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
Image.fromarray(rails).crop(BOX).save(ROOT / "assets/subway/rails.png", optimize=True)
print("rails box (stairwell art px): x, y, w, h =", [int(BOX[0]), int(BOX[1]), int(BOX[2] - BOX[0]), int(BOX[3] - BOX[1])])
print("strip", strip.shape[1], "x", strip.shape[0], "| rails", int(mask.sum()), "px")
