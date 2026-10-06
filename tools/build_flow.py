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
                              tight: it sits flush under the row above
  {t:"video", src, ar}
  {t:"ticker", h, imgs:[{id, ar}]}    a strip of photos that slides sideways
  {t:"tiles", imgs:[id]}              a tilted wall of tiles that drifts
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAGES = {"thrive": "thrive", "krumble": "krumble", "parde-ke-peeche": "parde-ke-peeche", "haven": "haven"}
COL_X, COL_W, VW = 84, 1272, 1440
FIX = {"Conclusison": "Conclusion", "Parede ke peeche": "Parde ke peeche"}     # typos on the Framer site

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

(ROOT / "js/flow.js").write_text("/* Each project page's flow, as laid out on anishah.framer.website. Built by tools/build_flow.py; see it for the item types. */\nwindow.FLOW = " + json.dumps(flow, ensure_ascii=False, separators=(",", ":")) + ";\n")
