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

roof = load("assets/rooftop/src/rooftop.webp").astype(np.uint8)
Image.fromarray(roof).save(ROOT / "assets/scenes/rooftop.webp", quality=90, method=6)


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
