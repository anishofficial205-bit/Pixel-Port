"""Build the cinema hall from its painting (assets/cinema/src/hall.webp).

    python tools/build_cinema.py

Writes
  assets/scenes/cinema-front.webp  the hall with its blank screen cut out (the reel plays behind it)
  assets/cinema/seat-row.webp      the seats from the first row down, drawn in front of the character
and prints the screen's box for js/main.js (CINEMA.front.screen).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
ROW_TOP = 622        # the first row's seat backs start here; he walks just behind them
FEATHER = 4

a = np.array(Image.open(ROOT / "assets/cinema/src/hall.webp").convert("RGB"))
r, g, b = [a[..., i].astype(int) for i in range(3)]
H, W = a.shape[:2]

# the screen: the big cream block between the curtains
cream = (r > 232) & (g > 215) & (b > 150)
lab, n = nd.label(nd.binary_opening(cream, iterations=3))
screen = nd.binary_fill_holes(lab == 1 + int(np.argmax(nd.sum(cream, lab, range(1, n + 1)))))
ys, xs = np.nonzero(screen)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
hole = nd.binary_dilation(screen, iterations=2) | (nd.binary_dilation(screen, iterations=6) & (r > 200) & (g > 170) & (b > 110))
alpha = 1 - nd.gaussian_filter(hole.astype(float), 0.7)
rgb = np.where(hole[..., None], np.array([20, 6, 14]), a)          # no cream left to fringe the edge
Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8)).save(ROOT / "assets/scenes/cinema-front.webp", quality=90, method=6)

rows = a[ROW_TOP - FEATHER:]
fade = np.clip(np.arange(rows.shape[0]) / FEATHER, 0, 1)[:, None] * np.ones((1, W))
Image.fromarray(np.dstack([rows, fade * 255]).astype(np.uint8)).save(ROOT / "assets/cinema/seat-row.webp", quality=90, method=6)
print("screen: x, y, w, h =", [int(x0) - 2, int(y0) - 2, int(x1 - x0) + 4, int(y1 - y0) + 4], "| seat rows from", ROW_TOP - FEATHER)

# --- more hall above and below, for tall screens (phones), where the painting does not reach the edges ---
# Above: the ceiling's rays carried on upward. Each new point takes its colour from the same ray in the
# painting's top rows (so rays stay straight and keep fanning out), then the ceiling falls into the dark.
# Below: the nearest seat backs carried on downward, falling into the dark too.
EXT, REF = 460, 24                       # rows added each way; how many of the painting's top rows feed the ceiling
CX, CY = 836, 112                        # where the rays meet (the fan above the screen)
DARK = np.array([13, 7, 29.0])           # the hall's surround (#070410) before the hall's dimming filter
rng = np.random.default_rng(3)
src = a.astype(float)
yy, xx = np.mgrid[-EXT:0, 0:W].astype(float)
sy = np.clip(-yy * (REF / EXT), 0, REF)                      # mirrored into the top rows: seamless at the join
k = (sy - CY) / (yy - CY)
sx = np.clip(CX + (xx - CX) * k, 0, W - 1)
top = np.dstack([nd.map_coordinates(src[..., c], [sy, sx], order=1, mode="nearest") for c in range(3)])
t = np.clip(-yy / EXT, 0, 1)[..., None]                      # 0 at the join, 1 at the far edge
top = top * (1 - t ** 0.8) + DARK * t ** 0.8 + rng.normal(0, 5, top.shape) * (1 - t)
Image.fromarray(np.clip(top, 0, 255).astype(np.uint8)).save(ROOT / "assets/cinema/hall-top.webp", quality=86, method=6)

last = nd.gaussian_filter1d(src[-6:].mean(axis=0), 1.2, axis=0)          # the painting's last rows, averaged
u = (np.arange(EXT) / EXT)[:, None, None]
bottom = last[None] * (1 - u ** 0.6) + DARK * u ** 0.6 + rng.normal(0, 5, (EXT, W, 3)) * (1 - u)
Image.fromarray(np.clip(bottom, 0, 255).astype(np.uint8)).save(ROOT / "assets/cinema/hall-bottom.webp", quality=86, method=6)
print("hall-top / hall-bottom:", EXT, "rows each")
