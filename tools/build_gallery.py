"""Build assets/scenes/gallery.webp from the three gallery images.

usage: python3 tools/build_gallery.py
needs: pip install pillow numpy scipy

Order: entry (doors), wall (windows), exit (door onto the rooftop).
Seams overlap 64px with an ordered-dither blend. The magenta picture
areas are keyed out so photos can sit behind them; their boxes are
printed for GALLERY in js/main.js.
"""
import numpy as np
from PIL import Image
from scipy import ndimage as nd

SRC = "assets/gallery/src/"
W, H, OV = 1672, 941, 64
parts = [np.array(Image.open(SRC + n).convert("RGBA")) for n in ("entry.webp", "wall.webp", "exit.webp")]
out = np.zeros((H, W * 3 - OV * 2, 4), np.uint8)
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
r, g, b = (out[..., i].astype(int) for i in range(3))
key = (r > 200) & (b > 200) & (g < 60)          # pure magenta only: the sunset sky is pink too
L, n = nd.label(key)
boxes = []
for i, sl in enumerate(nd.find_objects(L)):
    if (L[sl] == i + 1).sum() < 5000:
        continue
    boxes.append([sl[1].start, sl[0].start, sl[1].stop - sl[1].start, sl[0].stop - sl[0].start])
key = nd.binary_dilation(key, iterations=2)
out[..., 3] = np.where(key, 0, 255)
Image.fromarray(out).save("assets/scenes/gallery.webp", quality=90, alpha_quality=100, method=6)
print("gallery strip", out.shape[1], "x", out.shape[0], "offsets", [i * (W - OV) for i in range(3)])
print("frames", sorted(boxes))
