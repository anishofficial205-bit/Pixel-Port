"""Append the stair-climb frames to assets/character/sheet.webp.

usage: python3 tools/pack_climb.py   (run after tools/pack_sprite.py)
needs: pip install pillow numpy scipy

assets/character/climb-source.webp is 8 x 2 cells: row 1 climbs up facing right,
row 2 comes down facing left. Each figure is scaled to the main sheet's height,
anchored like pack_sprite.py (head/torso centred on x, lowest foot on the cell
bottom) and written to sheet rows 6-7 (frames 60-67 up, 70-77 down).
"""
import numpy as np
from PIL import Image
from scipy import ndimage as nd

CW, CH, COLS = 208, 179, 10
TARGET_H = 169                      # walk frames in the main sheet are 169px tall
src = np.array(Image.open("assets/character/climb-source.webp").convert("RGBA"))
sheet = np.array(Image.open("assets/character/sheet.webp").convert("RGBA"))
rows_needed = 8
if sheet.shape[0] < rows_needed * CH:
    sheet = np.concatenate([sheet, np.zeros((rows_needed * CH - sheet.shape[0], sheet.shape[1], 4), np.uint8)])
sheet[6 * CH:8 * CH] = 0

sw, sh = src.shape[1] // 8, src.shape[0] // 2
for row in range(2):
    for col in range(8):
        cell = src[row * sh:(row + 1) * sh, col * sw:(col + 1) * sw]
        solid = cell[..., 3] > 100
        L, n = nd.label(solid)
        keep = L == (np.argmax(nd.sum(solid, L, range(1, n + 1))) + 1)
        ys, xs = np.nonzero(keep)
        fig = cell[ys.min():ys.max() + 1, xs.min():xs.max() + 1].copy()
        fig[..., 3] = np.where(keep[ys.min():ys.max() + 1, xs.min():xs.max() + 1], fig[..., 3], 0)
        k = TARGET_H / fig.shape[0]
        im = Image.fromarray(fig).resize((max(1, round(fig.shape[1] * k)), TARGET_H), Image.LANCZOS)
        f = np.array(im)
        f[..., 3] = np.where(f[..., 3] > 110, 255, 0)            # hard pixel-art edges
        top = f[: int(TARGET_H * 0.45), :, 3] > 0
        ax = int(np.median(np.nonzero(top)[1])) if top.any() else f.shape[1] // 2
        idx = 60 + row * 10 + col
        ox = (idx % COLS) * CW + CW // 2 - ax
        oy = (idx // COLS) * CH + CH - f.shape[0]
        x0, x1 = max(ox, (idx % COLS) * CW), min(ox + f.shape[1], (idx % COLS + 1) * CW)
        region = sheet[oy:oy + f.shape[0], x0:x1]
        part = f[:, x0 - ox:x1 - ox]
        m = part[..., 3] > 0
        region[m] = part[m]
Image.fromarray(sheet).save("assets/character/sheet.webp", lossless=True, method=6)
print("sheet", sheet.shape[1], "x", sheet.shape[0])
