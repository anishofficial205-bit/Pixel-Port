"""Pack the character's sprite sheets from the painted sources in assets/character/src/v2/.

  walking.png     14 side-on frames (stand, a 12-frame walk cycle, stand); the row walking away isn't used
  poses.png       the character sheet: turnaround (front, 3/4, side, back 3/4, back) and poses
                  (relaxed, stride, wave, cheer, sitting with chai)
  stairs.png      climbing up (8 frames) and coming down (8 frames), painted on blue steps
  drop-start.png  looks down the manhole, steps off, starts to fall   (12 frames)
  drop-fall.png   the falling loop                                    (12 frames)
  drop-land.png   legs down, lands, crouches, rises, grins, fixes his glasses (12 frames)

    python tools/pack_character.py

Writes assets/character/{main,drain,stairs}.webp. Every sheet uses one cell (the engine's 208 x 179 box at
2x) in which he stands STAND px tall with his feet on the cell bottom; airborne frames are centred on
their centre of mass. Frame order must match SETS in js/sprite.js.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/character/src/v2"
CW, CH, COLS, STAND = 416, 358, 8, 300


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def key(a, r=3, T=18):
    """Foreground mask on the dark, grainy backdrop: the test runs on a median-smoothed copy (the grain is
    speckle), and the backdrop is flooded in from the border with a brush too fat to enter his dark hair."""
    sm = np.dstack([nd.median_filter(a[..., i], size=5) for i in range(3)]).astype(int)
    border = np.concatenate([sm[:8].reshape(-1, 3), sm[-8:].reshape(-1, 3), sm[:, :8].reshape(-1, 3), sm[:, -8:].reshape(-1, 3)])
    solid = nd.binary_opening(np.abs(sm - np.median(border, 0)).max(-1) >= T)
    lab, _ = nd.label(~nd.binary_dilation(solid, structure=disk(r)))
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    return ~(nd.binary_dilation(np.isin(lab, edge[edge > 0]), structure=disk(r + 1)) & ~solid)


def figures(fg, rows, min_area=9000):
    """Bounding slices of the figures, in reading order."""
    lab, n = nd.label(fg)
    size = nd.sum(fg, lab, range(1, n + 1))
    objs = nd.find_objects(lab)
    H = fg.shape[0]
    big = [i for i in range(n) if size[i] > min_area]
    big.sort(key=lambda i: ((objs[i][0].start + objs[i][0].stop) // 2 * rows // H, objs[i][1].start))
    return [(lab[objs[i]] == i + 1, objs[i]) for i in big]


def largest(m):
    lab, n = nd.label(m)
    return lab == 1 + int(np.argmax(nd.sum(m, lab, range(1, n + 1)))) if n else m


def tidy(m):
    """Drop the specks of backdrop grain that cling to his outline."""
    return nd.binary_dilation(largest(nd.binary_opening(m, iterations=2)), iterations=3, mask=m)


def no_dust(c, m, frac=0.12, pieces=False):
    """Remove the dust painted on the ground at his feet: warm, dull specks in the lowest rows.
    pieces: keep every sizeable piece (a shoe cut off from the leg when the steps were removed)."""
    r, g, b = [c[..., i].astype(int) for i in range(3)]
    low = np.zeros_like(m)
    low[int(m.shape[0] * (1 - frac)):] = True
    m = m & ~(low & (r - b > 30) & (r + g + b < 480))
    if pieces:
        lab, n = nd.label(nd.binary_opening(m, iterations=2))
        size = nd.sum(lab > 0, lab, range(1, n + 1))
        m = nd.binary_dilation(np.isin(lab, [i + 1 for i in range(n) if size[i] > 250]), iterations=3, mask=m)
    else:
        core = largest(nd.binary_erosion(m, iterations=3))
        m = tidy(nd.binary_dilation(core, iterations=5, mask=m))
    ys = np.nonzero(m.any(1))[0]
    return m, ys.max() + 1


def frame(c, m, k, anchor):
    """(image, anchor x, top y or None). anchor: 'head' / 'feet' (feet on the cell bottom) or 'air'."""
    alpha = nd.gaussian_filter(nd.binary_erosion(m).astype(float), 0.7)        # trim the dark edge pixel, then feather
    ys, xs = np.nonzero(m)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    img = Image.fromarray(np.dstack([c, np.clip(alpha * 255, 0, 255)]).astype(np.uint8)).crop((l, t, r, b))
    img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    mm = m[t:b, l:r]
    if anchor == "air":
        cy, cx = nd.center_of_mass(mm)
        top = round(CH * 0.52 - cy * k)
        return img, round(cx * k), min(max(top, 0), CH - img.height)
    h = b - t
    part = mm[: int(h * 0.2)] if anchor == "head" else mm[int(h * 0.75):]
    return img, int(np.median(np.nonzero(part)[1]) * k), None


def pack(frames, name):
    rows = -(-len(frames) // COLS)
    sheet = Image.new("RGBA", (COLS * CW, rows * CH))
    for i, (f, ax, top) in enumerate(frames):
        y = CH - f.height if top is None else top
        assert y >= 0 and ax <= CW // 2 and f.width - ax <= CW // 2, (name, i, f.size, ax, y)
        sheet.alpha_composite(f, ((i % COLS) * CW + CW // 2 - ax, (i // COLS) * CH + y))
    sheet.save(ROOT / f"assets/character/{name}.webp", quality=90, method=6)
    print(name, len(frames), "frames", sheet.size)


def load(name):
    return np.array(Image.open(SRC / name).convert("RGB"))


# ---- main: the walk and the poses ----
def main_sheet():
    out = []
    im = np.array(Image.open(SRC / "walking.png").convert("RGBA"))
    a, fg = im[..., :3], nd.binary_opening(im[..., 3] > 236, iterations=2)     # the figures are opaque; the glow around them isn't
    figs = figures(fg, 2)[:14]
    stand = figs[0][0].shape[0]
    for m, sl in figs:
        m, bottom = no_dust(a[sl], m, 0.06)
        out.append(frame(a[sl][:bottom], m[:bottom], STAND / stand, "head"))
    a = load("poses.png")
    fg, fat = key(a), key(a, r=9)                     # fat: a brush that can't get into his hair where it has no rim light
    fg[559:564] = False                               # the row of busts touches the poses under it
    figs = [(m, sl) for m, sl in figures(fg, 4, 20000) if sl[0].stop - sl[0].start > 230]
    top, low = [f for f in figs if f[1][0].stop < 420], [f for f in figs if f[1][0].start > 520]
    assert len(top) == 5 and len(low) == 5, (len(top), len(low))
    # front, 3/4, back (the side and back-3/4 views aren't used: their hair is the backdrop's colour);
    # then relaxed, stride, wave, cheer, sitting. The lower row is painted smaller.
    picks = [(top[0], 355, True), (top[1], 355, True), (top[4], 355, True),
             (low[0], 290, False), (low[1], 290, False), (low[2], 290, False), (low[3], 290, False), (low[4], 290, True)]
    for i, ((m, sl), stand, head) in enumerate(picks):
        c = a[sl]
        if head:
            n = int(m.shape[0] * 0.32)
            m = m.copy()
            m[:n] |= fat[sl][:n]
            m = largest(m)
        if i == 7:                                    # sitting: cut away the kerb he sits on, either side of him
            yy, xx = np.mgrid[sl[0], sl[1]]
            edge = np.where(yy < 828, 1262 - (yy - 775) * 0.68, 1203)           # the outside of his left leg and shoe
            m = largest(m & ~((yy > 764) & ((xx < edge) | (xx > 1428))))
        m, bottom = no_dust(c, m)
        out.append(frame(c[:bottom], m[:bottom], STAND / stand, "feet"))
    pack(out, "main")


# ---- drain: the drop ----
def drain_sheet():
    out = []
    AIR = {"drop-start.png": range(7, 12), "drop-fall.png": range(12), "drop-land.png": range(2)}
    STANDS = {"drop-start.png": 0, "drop-fall.png": None, "drop-land.png": 10}
    k = None
    for name in ("drop-start.png", "drop-land.png", "drop-fall.png"):
        a = load(name)
        figs = figures(key(a), 3)
        assert len(figs) == 12, (name, len(figs))
        if STANDS[name] is not None:
            k = STAND / (figs[STANDS[name]][0].shape[0] - 8)
        res = []
        for i, (m, sl) in enumerate(figs):
            c = a[sl]
            if i in AIR[name]:
                if name == "drop-start.png" and i == 7:          # one foot still on the ground, dust and all
                    m, _ = no_dust(c, m, 0.3)
                res.append(frame(c, tidy(m), k, "air"))
            else:
                m, bottom = no_dust(c, m)
                res.append(frame(c[:bottom], m[:bottom], k, "feet"))
        out.append(res)
    start, land, fall = out
    pack(start + fall + land, "drain")


# ---- stairs: up and down ----
def stairs_sheet():
    a = load("stairs.png")
    sm = np.dstack([nd.median_filter(a[..., i], size=7) for i in range(3)]).astype(int)
    r, g, b = sm[..., 0], sm[..., 1], sm[..., 2]
    blue = nd.binary_closing((b > r + 25) & (b > 55) & (r < 70) & (g > 18), iterations=3)
    lab, n = nd.label(nd.binary_opening(blue, structure=np.ones((15, 15))))            # the steps: big flat blue blocks
    size = nd.sum(lab > 0, lab, range(1, n + 1))
    steps = nd.binary_dilation(np.isin(lab, [i + 1 for i in range(n) if size[i] > 5000]), iterations=6, mask=blue)
    steps = nd.binary_dilation(steps, iterations=2)
    # the steps' shadowed sides are near-black: flood from the steps through dark pixels, sparing a thin
    # line along his trousers and shoes (so the shoes keep their dark soles)
    raw = a.astype(int)
    dark = raw.sum(-1) < 115
    shade = nd.binary_dilation(steps, iterations=60, mask=steps | dark) & dark
    bright = (raw[..., 0] > 190) & (raw[..., 1] > 160)
    steps |= shade & ~nd.binary_dilation(bright, iterations=3)
    fine, fat = key(a) & ~steps, key(a, r=9) & ~steps     # fat: a brush that can't get into his hair where it has no rim light
    H, W = fine.shape
    cut = []
    for j in range(2):
        for i in range(8):
            sl = (slice(j * H // 2, (j + 1) * H // 2), slice(i * W // 8, (i + 1) * W // 8))
            big = largest(fat[sl])
            ys = np.nonzero(big.any(1))[0]
            head = ys.min() + int((ys.max() - ys.min()) * 0.3)
            m = fine[sl].copy()
            m[:head] |= big[:head]
            m, bottom = no_dust(a[sl], m, 0.4, pieces=True)                     # his feet are on different steps
            cut.append((a[sl][:bottom], m[:bottom]))
    stand = np.nonzero(cut[7][1].any(1))[0]
    k = STAND / (stand.max() - stand.min() + 1)                                 # the last climbing frame is upright
    pack([frame(c, m, k, "head") for c, m in cut], "stairs")


if __name__ == "__main__":
    main_sheet()
    drain_sheet()
    stairs_sheet()
