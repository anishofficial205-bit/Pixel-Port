"""Make the high-definition (2x) copy of every picture the ride shows.

    python tools/build_hd.py            (after the scene builders)
    SCALE=2 python tools/pack_character.py   (the character sheets pack themselves at 2x from their sources)

Each <name>.webp / .png listed below gets a <name>-2x.webp beside it: twice the pixels, resampled with
Lanczos and lightly sharpened, which is crisper on high-density screens than letting the browser stretch
the 1x file. The page picks the 2x file only on large high-density screens (srcset in index.html).

This cannot add detail the paintings don't have. For true high resolution, replace the sources with
larger exports (or run them through an AI upscaler) and rebuild: nothing else needs to change.
"""
from pathlib import Path
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
Image.MAX_IMAGE_PIXELS = None
FILES = [
    "scenes/street.webp", "scenes/drain.webp", "scenes/subway.webp", "scenes/stairwell.webp", "scenes/cinema-front.webp",
    "scenes/backstairs.webp", "scenes/gallery.webp", "scenes/rooftop.webp",
    "street/leaves.png", "street/train.png", "street/posts.png", "subway/rails.png", "backstairs/rails.png",
    "cinema/seat-row.webp", "preloader/arcade.webp", "rooftop/train.png", "rooftop/front.png",
]
SHARPEN = ImageFilter.UnsharpMask(radius=1.6, percent=90, threshold=2)


def hd(im):
    big = im.resize((im.width * 2, im.height * 2), Image.LANCZOS)
    if big.mode == "RGBA":                         # sharpen the colour, keep the resampled edge
        rgb = big.convert("RGB").filter(SHARPEN)
        rgb.putalpha(big.getchannel("A"))
        return rgb
    return big.convert("RGB").filter(SHARPEN)


if __name__ == "__main__":
    for f in FILES:
        src = ROOT / "assets" / f
        im = Image.open(src)
        im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
        out = src.with_name(src.stem + "-2x.webp")
        hd(im).save(out, quality=80, method=4)
        print(f"{f}: {im.width}x{im.height} -> {out.name} {out.stat().st_size // 1024} KB")
