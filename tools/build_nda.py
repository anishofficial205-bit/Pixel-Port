"""Covers for projects under NDA -> assets/projects/nda/<id>.webp

usage: build_nda.py <id> <source image>
The picture is pixelated (so nothing in it can be read) and stamped NDA. Only the result is kept in the
project: the unpixelated source is never copied in.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parent.parent
pid, src = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("RGB")
W = 2000; im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS); H = im.height
BLOCKS = 56                                                   # blocks across: shapes and colour survive, words do not
small = im.resize((BLOCKS, max(1, round(BLOCKS * H / W))), Image.BOX)
px = small.resize((W, H), Image.NEAREST)
out = Image.blend(im.resize((W // 6, H // 6)).resize((W, H), Image.BICUBIC), px, 0.82)      # a touch of the blurred picture softens the grid
# the stamp: a red plate with NDA cut out in cream, a rule inside its edge, set at an angle
font = ImageFont.truetype("/System/Library/Fonts/Supplemental/Impact.ttf", 330)
small_f = ImageFont.truetype("/System/Library/Fonts/Supplemental/Arial Black.ttf", 50)
pw, ph = 900, 520
plate = Image.new("RGBA", (pw, ph), (0, 0, 0, 0)); d = ImageDraw.Draw(plate)
RED, CREAM = (196, 22, 22, 255), (252, 236, 187, 255)
d.rounded_rectangle((0, 0, pw - 1, ph - 1), 34, fill=RED)
d.rounded_rectangle((22, 22, pw - 23, ph - 23), 20, outline=CREAM, width=8)
d.text((pw / 2, 215), "NDA", font=font, fill=CREAM, anchor="mm")
d.text((pw / 2, 428), "UNDER NON-DISCLOSURE", font=small_f, fill=CREAM, anchor="mm")
plate = plate.rotate(-9, resample=Image.BICUBIC, expand=True)
shadow = Image.new("RGBA", plate.size, (0, 0, 0, 0)); shadow.paste((10, 6, 20, 150), mask=plate.split()[3])
out = out.convert("RGBA")
x, y = (W - plate.width) // 2, (H - plate.height) // 2
out.alpha_composite(shadow, (x + 16, y + 18)); out.alpha_composite(plate, (x, y))
(ROOT / "assets/projects/nda").mkdir(parents=True, exist_ok=True)
out.convert("RGB").save(ROOT / f"assets/projects/nda/{pid}.webp", quality=86, method=6)
print(pid, out.size)
