"""Pictures for the "Making of" project page -> assets/projects/making/ (and their shapes for tools/build_flow.py).

Sources, in tools/making-src/:
  pixel-*.webp   the site's first, pixel-art version (recovered from this repo's history)
  v1-*, raw-*, explore-*   the user's screenshots of version one, raw generations with magenta slots, and the
                 style, colour and character explorations (sent 2026-10-07)
  shot-*.webp    screenshots of the finished site (.claude/preview/shoot.mjs at 1440 x 810, 2x)
...and from the project itself: the final street painting, the character sheets, the arcade cabinet.
"""
import json
from pathlib import Path
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / "tools/making-src", ROOT / "assets/projects/making"
OUT.mkdir(parents=True, exist_ok=True)
shapes = {}
def put(name, im, width=1800, q=84, bg=None):
    im = im.convert("RGBA")
    if bg: base = Image.new("RGBA", im.size, bg); base.alpha_composite(im); im = base
    im = im.convert("RGB")
    if im.width > width: im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(OUT / f"{name}.webp", quality=q, method=6); shapes[name] = round(im.width / im.height, 3)

for f in sorted(SRC.glob("shot-*.webp")): put(f.stem, Image.open(f), 2000 if f.stem == "shot-hero" else 1600)
# the user's own screenshots of version one, the raw generations with their magenta slots, and the style explorations
for f in sorted(list(SRC.glob("v1-*.webp")) + list(SRC.glob("raw-*.webp")) + list(SRC.glob("explore-*.webp"))):
    im = Image.open(f)
    if f.stem == "v1-rooftop": im = im.crop((0, 805, im.width, im.height))      # the rooftop itself (the old credits above it are left out)
    put(f.stem, im, 2000 if f.stem.startswith("explore") else 1600)
for n in ("old-home", "shot-all", "phone-ride", "phone-subway", "phone-simple"):      # the old Framer site, the all-projects page, the site on a phone
    put(n, Image.open(SRC / f"{n}.webp"), 1600)
put("pixel-street", Image.open(SRC / "pixel-street.webp").crop((0, 250, 1254, 1254)))          # the lower part: the street itself
put("pixel-lobby", Image.open(SRC / "pixel-lobby.webp"))
put("pixel-subway", Image.open(SRC / "pixel-subway.webp").crop((0, 0, 2400, 941)), bg=(8, 6, 20, 255))
put("pixel-gallery", Image.open(SRC / "pixel-gallery.webp").crop((500, 0, 2900, 941)))
put("pixel-sheet", Image.open(SRC / "pixel-sheet.webp"), bg=(30, 32, 48, 255))
put("final-street", Image.open(ROOT / "assets/street/src/street-source.webp"))
put("final-gallery", Image.open(ROOT / "assets/scenes/gallery.webp").crop((500, 0, 2900, 941)))
put("final-subway", Image.open(ROOT / "assets/scenes/subway.webp").crop((1500, 0, 3900, 941)))
put("sheet-poses", Image.open(ROOT / "assets/character/src/v2/poses.png"), bg=(12, 6, 10, 255))
put("sheet-walk", Image.open(ROOT / "assets/character/src/v2/walking.png"), bg=(12, 6, 10, 255))
put("sheet-stairs", Image.open(ROOT / "assets/character/src/v2/stairs.png"), bg=(12, 6, 10, 255))
put("arcade", Image.open(ROOT / "assets/preloader/arcade-source.webp"))
(ROOT / "tools/framer/making-shapes.json").write_text(json.dumps(shapes))
print(len(shapes), "pictures"); print(shapes)
