"""Pack the drain character frames (the drop from the manhole to the platform) into
assets/character/drain.webp.

Sources, painted on a flat dark backdrop (assets/character/src/drain/):
  drop-start.png  looks down the manhole, steps off, starts to fall   (6 frames)
  drop-fall.png   the falling loop                                    (8 frames)
  drop-land.png   legs down, lands, crouches, rises, fixes his glasses, grins (6 frames)

    python tools/pack_drain_sprite.py

Same cell as the street sheet (tools/pack_street_sprite.py). Standing frames have their feet on the cell
bottom; airborne frames are hung from the head (the centre of his glasses, listed per frame below) so it
stays put while his limbs flail. Frame order must match SETS.drain in js/sprite.js.
"""
import numpy as np
from PIL import Image
from scipy import ndimage as nd
from pack_street_sprite import ROOT, CW, CH, STAND, disk, key, pack

SRC = ROOT / "assets/character/src/drain"
K = STAND / 455          # he stands 455 px tall in these sheets
HEAD_Y = 130             # airborne frames: where the glasses sit in the cell
# centre of his glasses in every frame, source px, reading order
HEADS = {
    "drop-start.png": [(286, 124), (775, 132), (1265, 142), (277, 630), (762, 630), (1268, 632)],
    "drop-fall.png": [(215, 157), (590, 187), (943, 187), (1343, 190), (215, 652), (597, 655), (945, 672), (1335, 655)],
    "drop-land.png": [(310, 140), (767, 237), (1242, 302), (290, 648), (752, 607), (1250, 603)],
}
GROUNDED = {"drop-start.png": [0, 1], "drop-land.png": [1, 2, 3, 4, 5]}


def frames(name):
    a = np.array(Image.open(SRC / name).convert("RGB"))
    # a fine brush gets between his fingers; around the head a fat one, with no haze pass, keeps the dark
    # hair (the haze pass bites into it where it is warm-lit, the fine brush where it has no rim light)
    fg, fg0 = key(a, 2, haze=(28, 0, 4)), key(a, 6)
    for hx, hy in HEADS[name]:
        box = (slice(max(0, hy - 115), hy + 35), slice(max(0, hx - 85), hx + 85))
        fg[box] = fg0[box]
    bgc = np.median(np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3)]), 0)
    dark = np.abs(a.astype(int) - bgc).max(-1) < 10       # the backdrop's own colour
    lab, n = nd.label(fg)
    size = nd.sum(fg, lab, range(1, n + 1))
    out = []
    for hx, hy in HEADS[name]:
        l = lab[hy, hx]                                   # the figure this head belongs to (specks of dust are left out)
        assert l and size[l - 1] > 15000, (name, hx, hy)
        ys, xs = np.nonzero(lab == l)
        t, b, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        m = lab[t:b, x0:x1] == l
        grounded = len(out) in GROUNDED.get(name, [])
        if grounded or name == "drop-land.png":           # frames painted with dust on the ground
            h = b - t
            # backdrop showing between his legs (closed off by the dust at his feet)
            gap = dark[t:b, x0:x1] & m & grounded
            gap[: int(h * 0.5)] = False
            gl, gn = nd.label(gap)
            gs = nd.sum(gap, gl, range(1, gn + 1))
            m &= ~nd.binary_dilation(np.isin(gl, [i + 1 for i in range(gn) if gs[i] > 150]), iterations=2)
            # the dust painted on the ground: a brown patch and thin specks along his soles
            low = np.zeros_like(m)
            low[int(h * 0.9):] = True
            c = a[t:b, x0:x1].astype(int)
            m &= ~(low & (c[..., 0] - c[..., 2] > 30) & (c @ np.array([0.299, 0.587, 0.114]) < 125))
            core = nd.binary_opening(m, structure=disk(5))
            m &= nd.binary_dilation(core, iterations=3, mask=m) | ~low
            m[np.nonzero(core.any(1))[0].max() + 2:] = False                    # nothing hangs below his soles
            thin = nd.binary_erosion(m, iterations=3)                           # drop clumps of dust hanging on by a thread
            ml, mn = nd.label(thin)
            m &= nd.binary_dilation(ml == 1 + int(np.argmax(nd.sum(thin, ml, range(1, mn + 1)))), iterations=5, mask=m)
        alpha = nd.gaussian_filter(nd.binary_erosion(m).astype(float), 0.7)     # trim the darkest edge pixel, then feather
        f = Image.fromarray(np.dstack([a[t:b, x0:x1], np.clip(alpha * 255, 0, 255)]).astype(np.uint8))
        f = f.resize((round(f.width * K), round(f.height * K)), Image.LANCZOS)
        if grounded:                                      # feet on the cell bottom, centred on them
            ys, xs = np.nonzero(m)
            f = f.crop((0, 0, f.width, round((ys.max() + 1) * K)))
            feet = np.nonzero(m[int(m.shape[0] * 0.9):])[1]
            out.append((f, round((feet.min() + feet.max()) / 2 * K)))
        else:                                             # hung from the head
            y = round(HEAD_Y - (hy - t) * K)
            out.append((f, round((hx - x0) * K), min(max(y, 0), CH - f.height)))
    return out


if __name__ == "__main__":
    pack(frames("drop-start.png") + frames("drop-fall.png") + frames("drop-land.png"), ROOT / "assets/character/drain.webp")
