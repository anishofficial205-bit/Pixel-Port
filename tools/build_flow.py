"""Build js/flow.js: each project page's flow, as laid out on anishah.framer.website.

Input: tools/framer/<slug>-1440.json, the geometry of each Framer project page at a 1440 px viewport
(every image and text block with its box; scraped by .claude/preview/scrape.mjs).
Output: window.FLOW = { <project id>: {hero: the main image's shape (w / h), items: [...]} }, in page order, from just under the main image to just
above "see also". Items:
  {t:"h", tx, big}            a heading (big: a section title)
  {t:"p", tx, narrow}         a paragraph (narrow: the indented, centred column)
  {t:"list", items:[[title, text]]}
  {t:"lead"}                  the big statement with the facts beside it
  {t:"rule"}                  a hairline between parts
  {t:"row", bleed, tight, imgs:[{id, l, w, ar, fit}]}   images side by side: l = space before it and
                              w = its width, in % of the column (or of the screen when bleed); ar = w / h;
                              tight: it sits flush under the row above; snug: only a hairline of space above
  {t:"video", src, ar}
  {t:"embed", src, ar, tight}  a film or a flip-book from another site, in a frame
  {t:"ticker", h, imgs:[{id, ar}]}    a strip of photos that slides sideways
  {t:"tiles", imgs:[id]}              a tilted wall of tiles that drifts
  {t:"table", head:[..]|null, rows:[[..]]}   {t:"quote", tx}   {t:"swatches", inks:[[name, hex, use]]}
  a row may carry cap: a caption under it; a list may be plain: bullets, not numbers
Any item may carry chapter: "Name": a chapter of the page starts there (see CHAPTERS below).
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = {"thrive": "thrive", "krumble": "krumble", "parde-ke-peeche": "parde-ke-peeche", "haven": "haven"}
COL_X, COL_W, VW = 84, 1272, 1440
FIX = {"Conclusison": "Conclusion", "Parede ke peeche": "Parde ke peeche"}     # typos on the Framer site (the audit's copy corrections, P1-1, are made in tools/framer/*.json)     # typos on the Framer site

def clean(tx):
    tx = " ".join(tx.split()).replace(" ,", ",").replace(" .", ".")
    for a, b in FIX.items(): tx = tx.replace(a, b)
    return tx

flow = {}
for slug, pid in PAGES.items():
    d = json.loads((ROOT / f"tools/framer/{slug}-1440.json").read_text())
    items = d["out"]
    end = min(o["r"][1] for o in items if o["t"] == "p" and o["tx"].strip().lower() == "see also")
    hero = next(o for o in items if o["t"] == "img" and o["r"][1] > 300)
    body = [o for o in items if hero["r"][1] + hero["r"][3] - 5 < o["r"][1] < end]
    out = []          # (y, item)
    tf = [o for o in body if o["t"] == "img" and o.get("tf", "none") != "none"]
    anim = [o for o in body if o["t"] == "img" and o.get("mv") == "anim" and o not in tf]
    still = [o for o in body if o["t"] == "img" and o not in tf and o not in anim]
    # images -> rows
    rows = []
    for o in sorted(still, key=lambda o: (o["r"][1], o["r"][0])):
        x, y, w, h = o["r"]
        for r in rows:
            ry0, ry1 = r["y0"], r["y1"]
            if min(y + h, ry1) - max(y, ry0) > 0.5 * min(h, ry1 - ry0): r["imgs"].append(o); r["y0"] = min(ry0, y); r["y1"] = max(ry1, y + h); break
        else: rows.append({"y0": y, "y1": y + h, "imgs": [o]})
    for r in rows:
        ims = sorted(r["imgs"], key=lambda o: o["r"][0])
        bleed = ims[0]["r"][0] < 40 or ims[-1]["r"][0] + ims[-1]["r"][2] > 1400
        x0, base = (0, VW) if bleed else (COL_X, COL_W)
        cur, cells = x0, []
        for o in ims:
            x, y, w, h = o["r"]
            xa, xb = max(x, x0), min(x + w, x0 + base)
            if not bleed and abs(xa - x0) < 6: xa = x0                       # snap to the column's edges
            if not bleed and abs(xb - (x0 + base)) < 6: xb = x0 + base
            gap = max(0, xa - cur)
            if gap < 4: gap = 0
            cells.append({"id": o["src"], "l": round(100 * gap / base, 2), "w": round(100 * (xb - xa) / base, 2), "ar": round(w / h, 3), "fit": o.get("fit") or "cover"})
            cur = xb
        out.append((r["y0"], {"t": "row", "bleed": bleed, "imgs": cells, "_y1": r["y1"]}))
    for o in body:
        x, y, w, h = o["r"]
        if o["t"] == "video": out.append((y, {"t": "video", "src": o["src"], "ar": round(w / h, 3)}))
        if o["t"] in ("img", "video"): continue
        tx = clean(o["tx"])
        if o.get("mv") == "sticky": continue                                  # the facts beside the lead
        if tx == "00": out.append((y, {"t": "rule"})); continue
        if o["t"] == "h1": out.append((y, {"t": "lead"})); continue
        if o["t"].startswith("h"): out.append((y, {"t": "h", "tx": tx, "big": o["fs"] > 36})); continue
        out.append((y, {"t": "p", "tx": tx, "narrow": x > 180, "_li": 100 < x < 130}))
    if anim:                                                                   # a sideways strip: each photo once, left to right
        seen, ims = set(), []
        for o in sorted(anim, key=lambda o: o["r"][0]):
            if o["src"] not in seen and o["r"][0] >= 0: seen.add(o["src"]); ims.append({"id": o["src"], "ar": round(o["r"][2] / o["r"][3], 3)})
        out.append((min(o["r"][1] for o in anim), {"t": "ticker", "h": round(100 * anim[0]["r"][3] / COL_W, 2), "imgs": ims}))
    if tf:                                                                     # the tilted wall: it sits just above the next rule
        ids = list(dict.fromkeys(o["src"] for o in tf))
        y = min(y for y, it in out if it["t"] == "rule" and y > min(o["r"][1] for o in tf)) - 1
        out.append((y, {"t": "tiles", "imgs": ids}))
    out.sort(key=lambda p: p[0])
    seq, prev_bottom = [], None
    for y, it in out:
        if it["t"] == "row":
            it["tight"] = bool(seq and seq[-1]["t"] == "row" and prev_bottom is not None and y - prev_bottom < 12)
            prev_bottom = it.pop("_y1")
        if it["t"] == "p" and it.pop("_li"):                                   # a list: a title line, then its text
            if not (seq and seq[-1]["t"] == "list"): seq.append({"t": "list", "items": []})
            seq[-1]["items"].append([it["tx"], ""]); continue
        if it["t"] == "p" and seq and seq[-1]["t"] == "list" and seq[-1]["items"][-1][1] == "": seq[-1]["items"][-1][1] = it["tx"]; continue
        it.pop("_li", None)
        if it["t"] == "rule" and seq and seq[-1]["t"] == "rule": continue
        seq.append(it)
    while seq and seq[0]["t"] == "rule": seq.pop(0)
    flow[pid] = {"hero": round(hero["r"][2] / hero["r"][3], 3), "items": seq}
    print(pid, len(seq), " ".join(i["t"] + (str(len(i["imgs"])) if i["t"] == "row" else "") + ("*" if i.get("bleed") else "") + ("^" if i.get("tight") else "") for i in seq))

# Bali (the film made from the script Bhayanaka) is not on the Framer site. Its words and pictures come from the boards on its Behance page
# (behance.net/gallery/248967119): the text is typed out here, and the photos are cut from the boards by
# tools/build_bhayanaka.py, which also writes their shapes. The film opens the page (heroEmbed in js/data.js).
SH = json.loads((ROOT / "tools/framer/bhayanaka-shapes.json").read_text())
PIC = "assets/projects/bhayanaka/"
# ...plus what the user sent on 2026-10-06: a photo of the team on the set (team.webp) and seven short clips of
# the build, turned into silent looping pictures (clip-1..7.webp, animated WebP, 640 px wide, 15 frames a second)
SH.update({"team": 1.333, **{f"clip-{i}": 1.778 for i in range(1, 8)}})
def photo_rows(names, gap=1.0, fill=4.3):
    """rows of photos of equal height that fill the column, a small gap between them"""
    rows, row = [], []
    for n in names:
        if row and sum(SH[x] for x in row) + SH[n] > fill * 1.22: rows.append(row); row = []      # it would overfill: start the next row
        row.append(n)
        if sum(SH[x] for x in row) >= fill: rows.append(row); row = []
    if row: rows.append(row) if sum(SH[x] for x in row) > fill * 0.55 or not rows else rows[-1].extend(row)
    out = []
    for k, r in enumerate(rows):
        total, free = sum(SH[x] for x in r), 100 - gap * (len(r) - 1)
        out.append({"t": "row", "bleed": False, "tight": False, "snug": k > 0, "photos": len(r) > 3,
                    "imgs": [{"id": PIC + x + ".webp", "l": gap if i else 0, "w": round(free * SH[x] / total, 2), "ar": SH[x], "fit": "cover"} for i, x in enumerate(r)]})
    return out
# the BTS wall: photos and clips shuffled together (always the same shuffle), the clips spread through it so
# that no two sit side by side
import random
_rng = random.Random(7)
_photos, _clips = [f"bts-{i:02d}" for i in range(1, 24)], [f"clip-{i}" for i in range(1, 8)]
_rng.shuffle(_photos); _rng.shuffle(_clips)
BTS_MIX, _step = [], len(_photos) / len(_clips)
for k, c in enumerate(_clips):
    chunk = _photos[round(k * _step):round((k + 1) * _step)]
    at = 1 + _rng.randrange(max(1, len(chunk) - 1))                 # somewhere inside its share of the photos, never first
    BTS_MIX += chunk[:at] + [c] + chunk[at:]
embed = lambda src, w, h: {"t": "embed", "src": src, "ar": round(w / h, 3)}
H = lambda tx: {"t": "h", "tx": tx, "big": False}
P = lambda tx, narrow=True: {"t": "p", "tx": tx, "narrow": narrow}
flow["bali"] = {"hero": 1.778, "items": [
    {"t": "lead"},
    {"t": "rule"},
    H("Moodboards"),
    embed("https://heyzine.com/flip-book/15f25d6fbc.html#page/2", 831, 464),
    P("The moodboards establish the film's visual language through ritualistic imagery like havan kunds, kumkum, and Kali iconography, with genre and cinematography references drawn from Indian and Western horror emphasizing deep shadow and practical light sources. A palette of cobalt blue, muted violet, teal, blood red, and ochre ties it into a cohesive, brooding identity."),
    {"t": "rule"},
    H("Layouting the Scene"),
    *photo_rows(["plan-3d", "plan-sketch", "plan-reference"], gap=1.5, fill=2.5),
    P("A hand-sketched top view, a 3D render and an AI-generated reference were made to plan and visualize the space. All three show a room built around a central havan kund, with the kund as the focal point of the layout. Key set elements include a stool, a rope/jute coil, and a constructed wall, each placed with intention to guide the camera and build the ritual atmosphere of the space."),
    {"t": "rule"},
    H("Storyboarding"),
    embed("https://heyzine.com/flip-book/1c703810ea.html#page/2", 831, 551),
    P("21 frames across 3 pages, rendered in the 3D model. The shots reveal the set through close-up details rather than wide establishing shots, building dread slowly. Moving from the jute coil and bloodied machete, through the havan kund, hand prints, ritual lines, and finally the Kali painting before cutting to blackout. Every frame stays intimate with the space, letting the props tell the story."),
    {"t": "rule"},
    H("Set Construction & BTS"),
    P("Us trying to structure the chaos that we are :)", narrow=False),
    *photo_rows(["team"], fill=1.0),
    *photo_rows(BTS_MIX),
    embed("https://player.vimeo.com/video/1191321738?title=0&byline=0&portrait=0&badge=0&controls=1&color=ffffff", 16, 9),
]}

# The "Making of" page: written in tools/making.py, pictures and their shapes from tools/build_making.py
import sys
sys.path.insert(0, str(ROOT / "tools"))
import making
MSH, MPIC = json.loads((ROOT / "tools/framer/making-shapes.json").read_text()), "assets/projects/making/"
def making_row(it):
    names, total = it["pics"], sum(MSH[n] for n in it["pics"])
    gap = 1.0; free = 100 - gap * (len(names) - 1)
    row = {"t": "row", "bleed": False, "tight": False, "photos": False, "imgs": [{"id": MPIC + n + ".webp", "l": gap if i else 0, "w": round(free * MSH[n] / total, 2), "ar": MSH[n], "fit": "cover"} for i, n in enumerate(names)]}
    if it["cap"]: row["cap"] = it["cap"]
    return row
flow["making"] = {"hero": 1.778, "items": [making_row(it) if "pics" in it else it for it in making.ITEMS]}

# Chapters: the names in each page's small index (the list that stays at the left while the page scrolls).
# Headings name themselves; where a page has few or none, a chapter starts at the item named here: "lead",
# the start of an image's file name, or the start of a paragraph.
CHAPTERS = {
    "thrive": [("lead", "Overview"), ("ZXVw8Izx", "Values"), ("The logo process", "Logo"), ("The colour palette", "Colour"), ("g8DTqGfD", "Sketches"), ("To explore how Thrive", "Products"), ("Ivsfxoqc", "In the world")],
    "krumble": [("lead", "Overview"), ("KC3d3gJ7", "Existing packs"), ("oBjMqgJS", "Sketches"), ("ZjxXNCTb", "Palette"), ("a5bqlwAD", "Dieline"), ("Fcppa449", "Final box")],
    "parde-ke-peeche": [("lead", "Overview"), ("JOKsFJWZ", "The magazine"), ("Most of the magazine", "Grid"), ("C6Hu12Ur", "Spreads")],
    "haven": [("lead", "Overview")],
    "bali": [("lead", "Overview")],
    "making": [("lead", "Overview")],
}
def starts(it, key):
    if key == "lead": return it["t"] == "lead"
    if it["t"] == "row": return any(c["id"].split("/")[-1].startswith(key) for c in it["imgs"])
    return it["t"] == "p" and it["tx"].startswith(key)
for pid, marks in CHAPTERS.items():
    items = flow[pid]["items"]
    for key, name in marks:
        k = next(i for i, it in enumerate(items) if starts(it, key))
        items[k]["chapter"] = name

(ROOT / "js/flow.js").write_text("/* Each project page's flow, as laid out on anishah.framer.website. Built by tools/build_flow.py; see it for the item types. */\nwindow.FLOW = " + json.dumps(flow, ensure_ascii=False, separators=(",", ":")) + ";\n")
