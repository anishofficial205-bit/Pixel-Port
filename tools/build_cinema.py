"""Build the cinema hall from its painting (assets/cinema/src/hall.webp).

    python tools/build_cinema.py

Writes
  assets/scenes/cinema-front.webp  the hall with its magenta screen cut out (the reel plays behind it)
  assets/cinema/seat-row.webp      the seats from the first row down, drawn in front of the character
and prints the screen's box for js/main.js (CINEMA.front.screen).
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
ROW_TOP = 600        # the first row's seat backs start here; he walks just behind them
FEATHER = 4

a = np.array(Image.open(ROOT / "assets/cinema/src/hall.webp").convert("RGB"))
r, g, b = [a[..., i].astype(int) for i in range(3)]
H, W = a.shape[:2]

# the screen: the big magenta block, plus the pink-tinged pixels on its edge
mag = (r > 200) & (g < 90) & (b > 200)
lab, n = nd.label(mag)
screen = lab == 1 + int(np.argmax(nd.sum(mag, lab, range(1, n + 1))))
ys, xs = np.nonzero(screen)
x0, y0, x1, y1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
hole = nd.binary_dilation(screen, iterations=2) | (nd.binary_dilation(screen, iterations=5) & (r > 120) & (b > 120) & (g < 110))
alpha = 1 - nd.gaussian_filter(hole.astype(float), 0.7)
rgb = np.where(hole[..., None], np.array([14, 9, 30]), a)          # no magenta left to fringe the edge
Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8)).save(ROOT / "assets/scenes/cinema-front.webp", quality=90, method=6)

rows = a[ROW_TOP - FEATHER:]
fade = np.clip(np.arange(rows.shape[0]) / FEATHER, 0, 1)[:, None] * np.ones((1, W))
Image.fromarray(np.dstack([rows, fade * 255]).astype(np.uint8)).save(ROOT / "assets/cinema/seat-row.webp", quality=90, method=6)
print("screen: x, y, w, h =", [int(x0) - 2, int(y0) - 2, int(x1 - x0) + 4, int(y1 - y0) + 4], "| seat rows from", ROW_TOP - FEATHER)
