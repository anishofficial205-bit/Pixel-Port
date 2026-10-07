"""Covers for projects under NDA -> assets/projects/nda/<id>.webp

usage: build_nda.py <id> <source image>
The picture is blurred and stamped with a round NDA seal (drawn here: two rings, NON-DISCLOSURE AGREEMENT
running round, NDA across the middle at an angle, five stars), in cream so it reads on any cover.
Only the result is kept in the project: the clean source is never copied in.
"""
import sys, math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = Path(__file__).resolve().parent.parent
pid, src = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W = 2000; im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS); H = im.height
out = im.filter(ImageFilter.GaussianBlur(16)).convert("RGBA")           # soft enough that nothing can be read

INK = (252, 236, 187)
F = "/System/Library/Fonts/Supplemental/"
def seal(D=1400):
    """the seal, drawn large (it is scaled down afterwards for clean edges)"""
    s = Image.new("RGBA", (D, D), (0, 0, 0, 0)); d = ImageDraw.Draw(s); c = D / 2
    ring = lambda r, w: d.ellipse((c - r, c - r, c + r, c + r), outline=INK + (255,), width=w)
    ring(c - 8, 16); ring(c - 44, 6); ring(c * 0.56, 6)
    # the words, running clockwise round the top; five stars along the bottom
    f = ImageFont.truetype(F + "Arial Bold.ttf", 104)
    text, R = "NON-DISCLOSURE AGREEMENT", c * 0.76
    span = math.radians(248); a0 = -math.pi / 2 - span / 2
    for k, ch in enumerate(text):
        a = a0 + span * k / (len(text) - 1)
        g = Image.new("RGBA", (160, 160), (0, 0, 0, 0)); ImageDraw.Draw(g).text((80, 80), ch, font=f, fill=INK + (255,), anchor="mm")
        g = g.rotate(-math.degrees(a) - 90, resample=Image.BICUBIC)
        s.alpha_composite(g, (round(c + R * math.cos(a) - 80), round(c + R * math.sin(a) - 80)))
    for k in range(5):
        a = math.pi / 2 + math.radians((k - 2) * 13); x, y = c + R * math.cos(a), c + R * math.sin(a)
        pts = [(x + (34 if i % 2 == 0 else 14) * math.cos(math.radians(i * 36 - 90) + a - math.pi / 2), y + (34 if i % 2 == 0 else 14) * math.sin(math.radians(i * 36 - 90) + a - math.pi / 2)) for i in range(10)]
        d.polygon(pts, fill=INK + (255,))
    # NDA across the middle
    n = Image.new("RGBA", (D, D), (0, 0, 0, 0))
    ImageDraw.Draw(n).text((c, c), "NDA", font=ImageFont.truetype(F + "Arial Black.ttf", 250), fill=INK + (255,), anchor="mm")
    s.alpha_composite(n)
    return s.rotate(14, resample=Image.BICUBIC)

st = seal(); size = round(H * 0.5); st = st.resize((size, size), Image.LANCZOS)
st.putalpha(st.split()[3].point(lambda v: int(v * 0.92)))
shadow = Image.new("RGBA", st.size, (0, 0, 0, 0)); shadow.paste((10, 6, 20, 90), mask=st.split()[3]); shadow = shadow.filter(ImageFilter.GaussianBlur(6))
x, y = (W - size) // 2, (H - size) // 2 - round(H * 0.04)
out.alpha_composite(shadow, (x + 4, y + 6)); out.alpha_composite(st, (x, y))
(ROOT / "assets/projects/nda").mkdir(parents=True, exist_ok=True)
out.convert("RGB").save(ROOT / f"assets/projects/nda/{pid}.webp", quality=86, method=6)
print(pid, out.size)
