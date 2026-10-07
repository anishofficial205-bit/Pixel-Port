"""Image dimensions (audit P2-4): every <img> carries its file's width and height, so the browser knows each
picture's shape before it loads.

  * pictures written straight into the pages (index.html, projects.html, project.html, 404.html) get the two
    attributes stamped into their tags here;
  * pictures the scripts add (project pictures, covers, photos, posters) get them from js/dims.js, a table of
    every such file's size written here and applied by the few lines at the bottom of that file.

Run after adding or replacing pictures, then `node tools/build-meta.mjs` (the project pages are copies of project.html):
    python tools/build_dims.py
"""
import io, json, re, subprocess, urllib.request
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PAGES = ["index.html", "projects.html", "project.html", "404.html"]
SCRIPTED = ["assets/projects", "assets/photos", "assets/reels", "assets/brand", "assets/about"]   # folders the scripts draw from


def size(path):
    with Image.open(path) as im:
        return im.size


# 1. the tags in the pages
for page in PAGES:
    html = (ROOT / page).read_text()

    def stamp(m):
        tag = m.group(0)
        src = re.search(r'\ssrc="([^"${}]+)"', tag)
        if not src: return tag                                         # no file yet (a script fills it in) or a template
        f = ROOT / src.group(1).lstrip("/").split("?")[0]
        if not f.exists(): return tag
        w, h = size(f)
        tag = re.sub(r'\s(width|height)="\d+"', "", tag)
        return re.sub(r"\s*/?>$", f' width="{w}" height="{h}" />', tag)

    out = re.sub(r"<img\b[^>]*>", stamp, html)
    if out != html: (ROOT / page).write_text(out)
    print(page, len(re.findall(r"<img\b[^>]*\swidth=", out)), "of", len(re.findall(r"<img\b", out)), "tags sized")

# 2. the table for pictures the scripts add (keys are paths under assets/; remote covers are keyed by their address)
dims = {}
for folder in SCRIPTED:
    for f in sorted((ROOT / folder).rglob("*")):
        if f.suffix.lower() in (".webp", ".png", ".jpg", ".jpeg", ".gif"):
            dims[str(f.relative_to(ROOT / "assets"))] = list(size(f))
remote = json.loads(subprocess.run(
    ["node", "-e", 'const w={};new Function("window",require("fs").readFileSync("js/data.js","utf8"))(w);'
                   'console.log(JSON.stringify(w.SITE.projects.flatMap(p=>[p.cover,p.hero]).filter(s=>/^https?:/.test(s||""))))'],
    cwd=ROOT, capture_output=True, text=True, check=True).stdout)
for url in remote:
    dims[url] = list(Image.open(io.BytesIO(urllib.request.urlopen(url).read())).size)

(ROOT / "js/dims.js").write_text("""/* Written by tools/build_dims.py: the width and height of every picture the scripts put on a page, and the few
   lines that write them onto the <img> tags (audit P2-4). Don't edit the table by hand; run the script. */
window.DIMS = """ + json.dumps(dims, separators=(",", ":")) + """;
(function () {
  const size = (img) => {
    const src = img.getAttribute("src"); if (!src) return;
    const d = window.DIMS[src] || window.DIMS[src.split("?")[0].replace(/^\\/?assets\\//, "")];
    if (d && img.getAttribute("width") != d[0]) { img.setAttribute("width", d[0]); img.setAttribute("height", d[1]); }
  };
  const all = (root) => { if (root.tagName === "IMG") size(root); else if (root.querySelectorAll) root.querySelectorAll("img").forEach(size); };
  // pictures arrive as the scripts build each section, and some change file (the reel poster, the photo viewer): size them as they do
  new MutationObserver((list) => list.forEach((m) => { if (m.type === "attributes") size(m.target); else m.addedNodes.forEach(all); }))
    .observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
  all(document);
})();
""")
print("js/dims.js", len(dims), "pictures,", (ROOT / "js/dims.js").stat().st_size // 1024, "KB")
