"""Pack the hero (street) character frames into assets/character/street.webp.

Sources are painted on a flat dark backdrop (assets/character/src/street/): walk-right.png and
walk-left.png (8 frames each), wave.png (6 frames: standing, then the wave) and reference.png (the
character sheet; only its jump pose is used, for the drop into the manhole).

    python tools/pack_street_sprite.py

The cell is the pixel sheet's 208 x 179 cell at 2.5x, feet on the cell bottom, so the engine can
draw either sheet into the same box. Frame order here must match SETS.street in js/sprite.js.
"""
from pathlib import Path
import numpy as np
from PIL import Image
from scipy import ndimage as nd

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets/character/src/street"
K = 2.5
CW, CH, COLS = 520, 448, 8          # 208 x 179 at K
STAND = round(171 * K)              # standing height, as in the pixel sheet


def disk(r):
    y, x = np.ogrid[-r:r + 1, -r:r + 1]
    return x * x + y * y <= r * r


def key(a, r, haze=None, T=14):
    """Foreground mask. His hair is the backdrop's own colour, so the backdrop is flooded in from the
    border with a brush too fat (radius r) to slip through the gaps in the hair's rim light."""
    a = a.astype(int)
    border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    dv = a - np.median(border, 0)
    d = np.abs(dv).max(-1)
    solid = d >= T
    lab, _ = nd.label(~nd.binary_dilation(solid, structure=disk(r)))
    edge = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    out = nd.binary_dilation(np.isin(lab, edge[edge > 0]), structure=disk(r + 1)) & ~solid
    if haze:   # a faint warm glow painted beside him (haze = how strong, how deep), and the dark pockets it closes off
        soft, pocket = haze
        glow = ~out & (d < soft) & (dv[..., 0] >= 4) & (dv[..., 0] >= dv[..., 2])
        eaten = nd.binary_dilation(out, iterations=0, mask=out | glow) & ~out
        dark = ~out & ~eaten & (d < T)
        out |= eaten
        if pocket: out |= nd.binary_dilation(eaten, iterations=pocket, mask=eaten | dark)
    return ~out


def cut(a, fg, box, anchor, head=None, fg0=None):
    """One frame: (rgba crop, anchor x inside the crop). `head` = (rows, half width) as fractions of his
    height: inside that box the haze-free mask fg0 is used, because the haze pass bites into warm-lit hair."""
    x0, y0, x1, y1 = box
    m = fg[y0:y1, x0:x1]
    if head:
        m0 = fg0[y0:y1, x0:x1]
        ys, xs = np.nonzero(m0)
        h = ys.max() + 1 - ys.min()
        cx = int(np.median(np.nonzero(m0[ys.min(): ys.min() + int(h * 0.12)])[1]))
        hb = (slice(0, ys.min() + int(h * head[0])), slice(max(0, cx - int(h * head[1])), cx + int(h * head[1])))
        m = m.copy()
        m[hb] = m0[hb]
    lab, n = nd.label(m)
    size = nd.sum(m, lab, range(1, n + 1))
    m = np.isin(lab, [i + 1 for i in range(n) if size[i] > 200])
    ys, xs = np.nonzero(m)
    t, b, l, r = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    m = m[t:b, l:r]
    h = b - t
    part = m[: int(h * 0.22)] if anchor == "head" else m[int(h * 0.6):]
    ax = int(np.median(np.nonzero(part)[1]))
    # trim the darkest edge pixel, then feather
    alpha = nd.gaussian_filter(nd.binary_erosion(m).astype(float), 0.7)
    rgba = np.dstack([a[y0:y1, x0:x1][t:b, l:r], np.clip(alpha * 255, 0, 255)]).astype(np.uint8)
    return Image.fromarray(rgba), ax


def grid(name, cols, rows, r, anchor, haze=None, head=None):
    a = np.array(Image.open(SRC / name).convert("RGB"))
    fg, fg0 = key(a, r, haze), key(a, r)
    H, W = a.shape[:2]
    frames = [cut(a, fg, (i * W // cols, j * H // rows, (i + 1) * W // cols, (j + 1) * H // rows), anchor, head, fg0)
              for j in range(rows) for i in range(cols)]
    k = STAND / max(f.height for f, _ in frames)
    return [(f.resize((round(f.width * k), round(f.height * k)), Image.LANCZOS), round(ax * k)) for f, ax in frames]


frames = []
frames += grid("walk-right.png", 4, 2, 4, "head")               # 0-7
frames += grid("walk-left.png", 4, 2, 4, "head", haze=(50, 6))   # 8-15
frames += grid("wave.png", 3, 2, 2, "feet", haze=(28, 0), head=(0.27, 0.19))   # 16-21: stand, then the wave

# 22: the jump pose from the reference sheet (he drops into the manhole in it)
ref = np.array(Image.open(SRC / "reference.png").convert("RGB"))
JUMP = (870, 596, 1110, 883)       # stops above the dust painted on the ground
f, ax = cut(ref, key(ref, 3, haze=(28, 0)), JUMP, "head", (0.42, 0.17), key(ref, 3))
k = STAND * 0.97 / f.height
frames.append((f.resize((round(f.width * k), round(f.height * k)), Image.LANCZOS), round(f.width * k / 2)))

rows = -(-len(frames) // COLS)
sheet = Image.new("RGBA", (COLS * CW, rows * CH))
for i, (f, ax) in enumerate(frames):
    assert f.height <= CH and ax <= CW // 2 and f.width - ax <= CW // 2, (i, f.size, ax)
    sheet.alpha_composite(f, ((i % COLS) * CW + CW // 2 - ax, (i // COLS) * CH + CH - f.height))
sheet.save(ROOT / "assets/character/street.webp", quality=90, method=6)
print(len(frames), "frames,", sheet.size, "cell", CW, "x", CH)
