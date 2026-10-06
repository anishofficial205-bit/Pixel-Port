"""Cut the photos out of the Bhayanaka boards (behance.net/gallery/248967119) into assets/projects/bhayanaka/.

usage: build_bhayanaka.py <folder holding b2.png and b3.png>
  b2.png, b3.png = the second and third boards at source size (5912 px wide):
  https://mir-s3-cdn-cf.behance.net/project_modules/source/3ec7fd248967119.6a026536c3a97.png and .../bd7cc8248967119.6a026536c264e.png
Boxes below are in a 1182 px wide view of each board (x0, y0, x1, y1); a third value is the photo's tilt in
degrees, which is taken out before cropping. Each box is then tightened until no board colour shows at its edges.
Prints the shapes (w / h) that tools/build_flow.py needs.
"""
import sys, json
from pathlib import Path
import numpy as np
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = Path(sys.argv[1]), ROOT / "assets/projects/bhayanaka"
OUT.mkdir(parents=True, exist_ok=True)
K = 5912 / 1182
PLAN = [  # the three plans of the room (board 2): tilted, and two run off the board's edge
    ("plan-3d", "b2", (6, 470, 392, 876), -4.2), ("plan-sketch", "b2", (396, 444, 784, 850), 2.3), ("plan-reference", "b2", (786, 464, 1182, 886), -2.7),
]
BTS = [   # the collage (board 3), left to right, top to bottom
    ("b3", (300, 410, 553, 655), -1.2), ("b3", (564, 515, 777, 820), 0), ("b3", (784, 450, 972, 592), 1.0), ("b3", (784, 600, 1006, 733), 0),
    ("b3", (213, 673, 352, 922), 0), ("b3", (362, 668, 556, 920), -1.5), ("b3", (557, 833, 775, 1002), 0), ("b3", (786, 746, 987, 1022), 0.6),
    ("b3", (87, 937, 219, 1097), 0), ("b3", (232, 943, 493, 1090), -0.8), ("b3", (497, 1015, 772, 1221), 0), ("b3", (784, 1032, 1066, 1200), 0),
    ("b3", (100, 1110, 392, 1273), 0), ("b3", (121, 1281, 320, 1393), 0), ("b3", (405, 1233, 724, 1415), 0), ("b3", (739, 1203, 1039, 1372), 0),
    ("b3", (95, 1405, 311, 1537), 0), ("b3", (325, 1412, 503, 1610), 0), ("b3", (507, 1425, 724, 1610), 0), ("b3", (739, 1385, 1076, 1609), 0),
    ("b3", (94, 1549, 313, 1840), 0), ("b3", (324, 1633, 694, 1842), 0), ("b3", (708, 1625, 1094, 1842), 0),
]
boards = {n: Image.open(SRC / f"{n}.png").convert("RGB") for n in ("b2", "b3")}
BG = {"b2": None, "b3": np.array([236, 239, 242])}

def cut(board, box, tilt):
    im = boards[board]
    x0, y0, x1, y1 = [round(v * K) for v in box]
    pad = 120 if tilt else 0
    c = im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
    if tilt:
        c = c.rotate(tilt, resample=Image.BICUBIC, expand=False)
        w, h = c.size
        # the largest upright box inside the tilted photo
        t = abs(np.radians(tilt)); pw, ph = x1 - x0, y1 - y0
        iw, ih = pw * np.cos(t) - ph * np.sin(t) * 0.9, ph * np.cos(t) - pw * np.sin(t) * 0.9
        c = c.crop((round(w / 2 - iw / 2), round(h / 2 - ih / 2), round(w / 2 + iw / 2), round(h / 2 + ih / 2)))
    a = np.asarray(c).astype(int)
    bg = BG[board]
    if bg is not None:                      # tighten: drop edge rows / columns that still show the board
        near = (np.abs(a - bg).sum(axis=2) < 20)
        t, b, l, r = 0, a.shape[0], 0, a.shape[1]
        for _ in range(140):
            moved = False
            if near[t, l:r].mean() > 0.3: t += 1; moved = True
            if near[b - 1, l:r].mean() > 0.3: b -= 1; moved = True
            if near[t:b, l].mean() > 0.3: l += 1; moved = True
            if near[t:b, r - 1].mean() > 0.3: r -= 1; moved = True
            if not moved: break
        c = c.crop((l + 12, t + 12, r - 12, b - 12))
    else: c = c.crop((14, 14, c.width - 14, c.height - 14))
    if c.width > 1500: c = c.resize((1500, round(c.height * 1500 / c.width)), Image.LANCZOS)
    return c

shapes = {}
for name, board, box, tilt in PLAN:
    c = cut(board, box, tilt); c.save(OUT / f"{name}.webp", quality=88, method=6); shapes[name] = round(c.width / c.height, 3)
for i, (board, box, tilt) in enumerate(BTS):
    c = cut(board, box, tilt); name = f"bts-{i + 1:02d}"; c.save(OUT / f"{name}.webp", quality=86, method=6); shapes[name] = round(c.width / c.height, 3)
(ROOT / "tools/framer/bhayanaka-shapes.json").write_text(json.dumps(shapes))
print(shapes)
