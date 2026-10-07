"""Link-preview pictures for the project pages: each public project's cover as a 1200 x 630 JPEG in assets/og/<id>.jpg
(JPEG because some link unfurlers still don't read WebP). Run before tools/build-meta.mjs when a cover changes:
    python tools/build_og.py
"""
import io, json, subprocess, urllib.request
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
projects = json.loads(subprocess.run(
    ["node", "-e", 'const w={};new Function("window",require("fs").readFileSync("js/data.js","utf8"))(w);'
                   'console.log(JSON.stringify(w.SITE.projects.filter(p=>!p.nda).map(p=>({id:p.id,cover:p.hero||p.cover,pos:p.pos}))))'],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout)
for p in projects:
    src = p["cover"]
    raw = urllib.request.urlopen(src).read() if src.startswith("http") else (ROOT / src).read_bytes()
    im = Image.open(io.BytesIO(raw)); im.seek(0)
    im = ImageOps.fit(im.convert("RGB"), (W, H), Image.LANCZOS, centering=(0.5, 0.5))
    out = ROOT / "assets/og" / f"{p['id']}.jpg"
    im.save(out, "JPEG", quality=82, optimize=True, progressive=True)
    print(out.relative_to(ROOT), out.stat().st_size // 1024, "KB")
