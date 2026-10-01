"""Pack the subway-to-tickets character frames into assets/character/stairs.webp.

Sources, painted on a flat dark backdrop (assets/character/src/stairs/):
  step-on.png  a walking stride, then his foot coming up onto the first steps   (4 frames)
  climb.png    the stair-climbing cycle                                         (8 frames)
  arrive.png   the last step, a stride onto the lobby floor, then he spots the cinema:
               a gasp, a delighted look back, a grin with his hands in his pockets (5 frames)

    python tools/pack_stairs_sprite.py

Same cell as the street sheet (tools/pack_street_sprite.py), lowest foot on the cell bottom. Frame order
must match SETS.stairs in js/sprite.js.
"""
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from pack_street_sprite import ROOT, STAND, key, pack

SRC = ROOT / "assets/character/src/stairs"
# name: (rows, his walking/standing height in the sheet, frames anchored on the feet instead of the head)
SHEETS = {"step-on.png": (1, 590, []), "climb.png": (2, 463, []), "arrive.png": (1, 605, [2, 3, 4])}


def frames(name):
    rows, tall, feet = SHEETS[name]
    a = np.array(Image.open(SRC / name).convert("RGB"))
    fg = key(a, 4)                       # a fat brush: his hair is the backdrop's own colour
    lab, n = nd.label(fg)
    size = nd.sum(fg, lab, range(1, n + 1))
    objs = nd.find_objects(lab)
    H = a.shape[0]
    figs = sorted((i for i in range(n) if size[i] > 15000),
                  key=lambda i: ((objs[i][0].start + objs[i][0].stop) // 2 * rows // H, objs[i][1].start))
    k = STAND / tall
    out = []
    for f, i in enumerate(figs):
        ys, xs = objs[i]
        # small marks drawn beside him (the "!" dashes) belong to the frame too
        near = [j for j in range(n) if 60 < size[j] <= 15000
                and objs[j][1].start > xs.start - 40 and objs[j][1].stop < xs.stop + 40
                and objs[j][0].start > ys.start - 40 and objs[j][0].stop < ys.stop + 40]
        labs = [i + 1] + [j + 1 for j in near]
        t = min([ys.start] + [objs[j][0].start for j in near]); b = max([ys.stop] + [objs[j][0].stop for j in near])
        l = min([xs.start] + [objs[j][1].start for j in near]); r = max([xs.stop] + [objs[j][1].stop for j in near])
        m = np.isin(lab[t:b, l:r], labs)
        body = lab[t:b, l:r] == i + 1
        h = b - t
        part = body[int(h * 0.6):] if f in feet else body[: int(h * 0.22)]
        ax = int(np.median(np.nonzero(part)[1]))
        alpha = nd.gaussian_filter(nd.binary_erosion(m).astype(float), 0.7)     # trim the darkest edge pixel, then feather
        img = Image.fromarray(np.dstack([a[t:b, l:r], np.clip(alpha * 255, 0, 255)]).astype(np.uint8))
        out.append((img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS), round(ax * k)))
    return out


if __name__ == "__main__":
    pack(frames("step-on.png") + frames("climb.png") + frames("arrive.png"), ROOT / "assets/character/stairs.webp")
