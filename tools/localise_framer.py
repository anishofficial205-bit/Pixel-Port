"""One-off (audit P1-3): bring every image and video that was loaded from the old Framer site into the project.

  python tools/localise_framer.py
Collects every Framer id used by js/data.js and the scraped page layouts (tools/framer/*.json), downloads the
original from framerusercontent.com, and saves it under assets/projects/<project>/ as
  <nn>.webp (at most 2560 px wide), <nn>-1280.webp, <nn>-640.webp and <nn>-32.webp (the blurred backing)
(videos are kept as .mp4). Then rewrites those ids to the local paths in js/data.js and tools/framer/*.json and
writes the map to tools/framer/local-map.json. Run tools/build_flow.py afterwards.
"""
import json, re, subprocess, io, sys
from pathlib import Path
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parent.parent
HOST = "https://" + "framer" + "usercontent.com/"
ID = re.compile(r'"([A-Za-z0-9]{18,40}\.(?:png|jpe?g|gif|webp))"')
data = (ROOT / "js/data.js").read_text()
order, owner = [], {}
# ids in data.js, project by project
for m in re.finditer(r'"id": "([a-z0-9-]+)"', data):
    pass
chunks = re.split(r'(?="id": ")', data)
for ch in chunks:
    pm = re.match(r'"id": "([a-z0-9-]+)"', ch)
    if not pm: continue
    for i in ID.findall(ch):
        if i not in owner: owner[i] = pm.group(1); order.append(i)
# ids in the scraped layouts (the file is named after its project)
videos = {}
for f in sorted((ROOT / "tools/framer").glob("*-1440.json")):
    proj = f.name[:-10]
    for o in json.loads(f.read_text())["out"]:
        if o["t"] == "img" and re.fullmatch(r"[A-Za-z0-9]{18,40}\.(png|jpe?g|gif|webp)", o["src"]) and o["src"] not in owner:
            owner[o["src"]] = proj; order.append(o["src"])
        if o["t"] == "video" and "framerusercontent" in o["src"]: videos[o["src"]] = proj
count, local = {}, {}
def get(url):
    r = subprocess.run(["curl", "-sfL", "--max-time", "120", url], capture_output=True)
    if r.returncode: raise SystemExit("download failed: " + url)
    return r.stdout
for i in order:
    proj = owner[i]; count[proj] = count.get(proj, 0) + 1
    base = f"assets/projects/{proj}/{count[proj]:02d}"; (ROOT / base).parent.mkdir(parents=True, exist_ok=True)
    local[i] = base + ".webp"
    if (ROOT / (base + ".webp")).exists(): continue
    im = Image.open(io.BytesIO(get(HOST + "images/" + i)))
    im = im.convert("RGBA" if im.mode in ("RGBA", "LA", "P") else "RGB")
    for suffix, w in (("", 2560), ("-1280", 1280), ("-640", 640), ("-32", 32)):
        v = im if im.width <= w else im.resize((w, max(1, round(im.height * w / im.width))), Image.LANCZOS)
        v.save(ROOT / f"{base}{suffix}.webp", quality=80, method=5)
    print(i[:10], "->", base, im.size, flush=True)
for url, proj in videos.items():
    count[proj] = count.get(proj, 0) + 1
    path = f"assets/projects/{proj}/{count[proj]:02d}.mp4"; local[url] = path
    if not (ROOT / path).exists(): (ROOT / path).write_bytes(get(url)); print("video ->", path)
(ROOT / "tools/framer/local-map.json").write_text(json.dumps(local, indent=1))
# rewrite the references
for f in [ROOT / "js/data.js", *sorted((ROOT / "tools/framer").glob("*-1440.json"))]:
    s = f.read_text()
    for i, path in local.items(): s = s.replace('"' + i + '"', '"' + path + '"')
    f.write_text(s)
print(len(local), "files localised")
