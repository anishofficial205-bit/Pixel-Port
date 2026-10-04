"""Build the gallery and the rooftop from their paintings.

  assets/gallery/src/entrance.webp  the door in, one wide frame
  assets/gallery/src/windows.webp   two frames between the arched windows, the bench
  assets/gallery/src/exit.webp      one wide frame, the rope barrier, the door out to the roof
  assets/rooftop/src/rooftop.webp   the rooftop at night (the footer)

    python tools/build_gallery.py

Writes assets/scenes/gallery.webp (the three gallery frames side by side, the outer two resampled so the
picture rail, the wainscot and the floor line carry on across the joins) and assets/scenes/rooftop.webp,
and prints the numbers js/main.js needs: the blank frames and their plaques, the rooftop's blank
hoardings and its string-light bulbs.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
load = lambda p: np.array(Image.open(ROOT / p).convert("RGB")).astype(float)
g1, g2, g3 = [load(f"assets/gallery/src/{n}.webp") for n in ("entrance", "windows", "exit")]
H, W = g2.shape[:2]


def rows(a, pairs):
    """Resample rows: pairs of (row in the output, row in the painting)."""
    src = np.interp(np.arange(H), [o for o, _ in pairs], [s for _, s in pairs])
    lo = np.floor(src).astype(int)
    f = (src - lo)[:, None, None]
    return a[lo] * (1 - f) + a[np.minimum(lo + 1, H - 1)] * f


# picture rail, wainscot rail, floor line: where they sit in the middle frame <- in each outer frame
g1 = rows(g1, [(0, 0), (168, 160), (580, 576), (730, 725), (H - 1, H - 1)])
g3 = rows(g3, [(0, 0), (168, 155), (578, 563), (730, 710), (H - 1, H - 1)])
full = np.concatenate([g1, g2, g3], 1)
FLOOR = 590                         # below this (wainscot, floor) the joins are blended wide; above it, narrow
for j in (W, 2 * W):
    for rr, n in ((slice(0, FLOOR), 8), (slice(FLOOR, H), 40)):
        left, right = full[rr, j - n:j].copy(), full[rr, j:j + n].copy()
        k = np.linspace(0, 0.5, n)[None, :, None]                    # 0 away from the join, 0.5 on it
        full[rr, j - n:j] = left * (1 - k) + right[:, ::-1] * k
        full[rr, j:j + n] = right * (1 - k[:, ::-1]) + left[:, ::-1] * k[:, ::-1]
full = np.clip(full, 0, 255).astype(np.uint8)
Image.fromarray(full).save(ROOT / "assets/scenes/gallery.webp", quality=88, method=6)

# ---- rooftop: the metro on the far bridge moves, so it is lifted out of the painting ----
#   assets/rooftop/train.png  the train on its own
#   assets/rooftop/front.png  what it passes behind: the string-light pole and the bridge's pylon
src = load("assets/rooftop/src/rooftop.webp")
TX0, TX1, TY0, TY1 = 750, 932, 486, 507            # the painted train (its nose points right)
POLE, PYLON = (853, 877), (1022, 1040)             # x ranges of the pole and the pylon, in front of the track
TRACK_END = 1096                                   # the bridge runs behind buildings from here
tr = src[TY0:TY1, TX0:TX1].copy()
r, g, b = tr[..., 0], tr[..., 1], tr[..., 2]
body = np.zeros(tr.shape[:2], bool)
body[2:, 2:166] = True                             # the cars are a plain block...
nose = (np.minimum(np.minimum(r, g), b) > 95) & (b - r < 70)   # ...and the nose is whatever is pale
body[2:, 166:] = nose[2:, 166:]
p0, p1 = POLE[0] - TX0, POLE[1] - TX0              # the pole crosses the train: carry the car across it
tr[:, p0:p1] = tr[:, p0 - (p1 - p0):p0][:, ::-1]
alpha = nd.gaussian_filter(body.astype(float), 0.5)
Image.fromarray(np.dstack([tr, alpha * 255]).clip(0, 255).astype(np.uint8)).save(ROOT / "assets/rooftop/train.png", optimize=True)
roof = src.copy()
roof[TY0:TY1, TX0:TX1] = src[TY0 - (TY1 - TY0):TY0, TX0:TX1]          # the haze just above the bridge, where the train stood
fx0, fx1, fy0, fy1 = POLE[0], PYLON[1], TY0 - 2, TY1 + 2
front = np.zeros((fy1 - fy0, fx1 - fx0, 4))
front[..., :3] = roof[fy0:fy1, fx0:fx1]
front[:, :POLE[1] - fx0, 3] = 255
py = roof[fy0:fy1, PYLON[0]:PYLON[1]]
front[:, PYLON[0] - fx0:, 3] = ((py[..., 0] > 110) & (py[..., 0] - py[..., 2] > 40)) * 255
Image.fromarray(front.astype(np.uint8)).save(ROOT / "assets/rooftop/front.png", optimize=True)
print("rooftop train: track", [TX0, TY0, TRACK_END - TX0, TY1 - TY0], "len", TX1 - TX0, "front", [fx0, fy0, fx1 - fx0, fy1 - fy0])
roof = roof.astype(np.uint8)
Image.fromarray(roof).save(ROOT / "assets/scenes/rooftop.webp", quality=90, method=6)

# ---- the fairy lights: every little painted bulb gets a glow, split over three layers that twinkle out of step
#      (assets/rooftop/fairy-1..3.webp, drawn at twice the painting's size) ----
STRINGS = [(0, 318, 175, 398), (160, 455, 440, 605), (320, 580, 1672, 622), (852, 380, 880, 595), (1308, 380, 1336, 595), (1125, 640, 1225, 710)]
r, g, b = [roof[..., i].astype(int) for i in range(3)]
warm = (r > 215) & (g > 140) & (b < 150) & (r - b > 90)
zone = np.zeros(warm.shape, bool)
for x0, y0, x1, y1 in STRINGS:
    zone[y0:y1, x0:x1] = True
lab, n = nd.label(warm & zone)
size = nd.sum(warm & zone, lab, range(1, n + 1))
dots = [c for c, z in zip(nd.center_of_mass(warm & zone, lab, range(1, n + 1)), size) if z <= 40]
rng = np.random.default_rng(5)
layers = [np.zeros((H * 2, W * 2)) for _ in range(3)]
yy, xx = np.mgrid[-10:11, -10:11]
blob = np.exp(-(xx * xx + yy * yy) / (2 * 3.2 ** 2))
for cy, cx in dots:
    y, x = int(round(cy * 2)), int(round(cx * 2))
    if 10 <= y < H * 2 - 11 and 10 <= x < W * 2 - 11:
        L = layers[rng.integers(0, 3)]
        L[y - 10:y + 11, x - 10:x + 11] = np.maximum(L[y - 10:y + 11, x - 10:x + 11], blob)
for i, L in enumerate(layers):
    rgba = np.dstack([np.full(L.shape, 255), np.full(L.shape, 214), np.full(L.shape, 130), L * 255]).astype(np.uint8)
    Image.fromarray(rgba).save(ROOT / f"assets/rooftop/fairy-{i + 1}.webp", quality=80, method=4)
print("fairy lights:", len(dots))


def boxes(mask, keep):
    lab, n = nd.label(mask)
    out = []
    for i, sl in enumerate(nd.find_objects(lab)):
        x, y, w, h = sl[1].start, sl[0].start, sl[1].stop - sl[1].start, sl[0].stop - sl[0].start
        if keep(x, y, w, h) and (lab[sl] == i + 1).mean() > 0.8:
            out.append([x, y, w, h])
    return sorted(out)


def cream(a):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    return nd.binary_opening((r > 232) & (g > 215) & (b > 150), iterations=3)


r, g, b = [full[..., i].astype(int) for i in range(3)]
frames = boxes(cream(full), lambda x, y, w, h: w * h > 20000)
print("frames:", [[x - 1, y - 1, w + 2, h + 2] for x, y, w, h in frames])
brass = nd.binary_opening((r > 200) & (g > 130) & (g < 215) & (b < 110), iterations=2)
print("plaques:", boxes(brass, lambda x, y, w, h: 50 < w < 110 and 12 < h < 32 and 510 < y < 580))
print("rooftop hoardings:", [[x - 1, y - 1, w + 2, h + 2] for x, y, w, h in boxes(cream(roof), lambda x, y, w, h: w * h > 700 and y > 300)])
r, g, b = [roof[..., i].astype(int) for i in range(3)]
bulb = nd.binary_opening((r > 240) & (g > 190) & (b > 90) & (b < 200), iterations=2)
print("bulbs:", [[x + w // 2, y + h // 2] for x, y, w, h in boxes(bulb, lambda x, y, w, h: 14 < w < 40 and 14 < h < 40 and 380 < y < 460 and 860 < x < 1320)])
print("gallery", full.shape[1], "x", full.shape[0])
