"""Build assets/scenes/subway.webp from the three platform images.

usage: python3 tools/build_subway.py
needs: pip install pillow numpy

Order: entry, platform, platform, stairs. Each seam overlaps 48px and is
blended with an ordered (Bayer) dither so it stays hard-pixelled. The stairs
image sits 40px higher than the others, so it is shifted down to line up the
yellow platform edge. Positions in js/main.js (SUBWAY) are in this strip's px.
"""
import numpy as np
from PIL import Image

SRC = "assets/subway/src/"
W, H, OV = 1672, 941, 48
a = np.array(Image.open(SRC + "entry.webp").convert("RGB"))
b = np.array(Image.open(SRC + "platform.webp").convert("RGB"))
c0 = np.array(Image.open(SRC + "stairs.webp").convert("RGB"))
c = np.zeros_like(c0); c[40:] = c0[:-40]; c[:40] = c0[:40]
parts = [a, b, b, c]
out = np.zeros((H, W * len(parts) - OV * (len(parts) - 1), 3), np.uint8)
bayer = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0
x = 0
for i, p in enumerate(parts):
    if i == 0:
        out[:, :W] = p
    else:
        thr = np.tile(bayer, (H // 4 + 1, OV // 4 + 1))[:H, :OV]
        take = ((np.arange(OV) + 0.5) / OV)[None, :] > thr
        out[:, x:x + OV][take] = p[:, :OV][take]
        out[:, x + OV:x + W] = p[:, OV:]
    x += W - OV
Image.fromarray(out).save("assets/scenes/subway.webp", quality=88, method=6)
print("subway strip", out.shape[1], "x", out.shape[0])
