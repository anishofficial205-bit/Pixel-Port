/* ------------------------------------------------------------------
   NEON BHARAT — scroll-driven journey
   Scroll distance moves the character along a path of segments.
   The camera follows; each segment knows its pose and location.
------------------------------------------------------------------- */
(function () {
  const S = window.SITE;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const body = document.body;
  const world = $("#world");
  const charEl = $("#char");
  const sprite = $(".char-sprite");
  const bubble = $("#bubble");
  const spacer = $("#spacer");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const RIM = {
    street: "#FF3D9A", drain: "#6BE3A8", subway: "#E8FBFF",
    cinema: "#D9A441", exhibition: "#FFE3B0", rooftop: "#FFB26B",
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  /* ================= CONTENT ================= */
  function fillContent() {
    $("#site-name").textContent = S.name;
    $("#site-role").textContent = S.role + " · " + S.location;
    $("#site-intro").textContent = S.intro;
    $(".hud-logo").textContent = S.name;
    $("#mail-link").href = "mailto:" + S.email;
    $("#mail-link").textContent = S.email;
    $("#copyright").textContent = `© ${S.year} ${S.name} · NEON BHARAT GAMES`;

    $("#billboards").innerHTML = S.projects.map((p, i) => `
      <a class="billboard shape-${p.shape}" id="project-${p.id}" data-i="${i}" href="project.html?p=${p.id}" style="--ar:${{ wide: 16 / 9, std: 4 / 3, tall: 9 / 16 }[p.shape]}">
        <span class="bb-lamps" aria-hidden="true"><i></i><i></i><i></i></span>
        <span class="bb-frame"><img class="work-media" src="${p.image}" alt="${p.title}: ${p.blurb}" decoding="async" /></span>
        <span class="bb-sign" style="--band:${p.band}">
          <span class="bb-line">${p.line}</span>
          <span class="bb-title">${p.title}</span>
          <span class="bb-blurb">${p.blurb}</span>
        </span>
      </a>`).join("");

    $("#tickets").innerHTML = S.reels.map((r, i) => `
      <li><button class="ticket" type="button" data-i="${i}" aria-pressed="${i === 0}">
        <span class="t-no">No. ${String(i + 1).padStart(3, "0")}</span>
        <span class="t-title">${r.title}</span>
        <span class="t-len">${r.length}</span>
      </button></li>`).join("");

    $("#photos").innerHTML = S.photos.map((p, i) => `
      <figure class="photo" style="--ar:${p.w / p.h}">
        <button class="photo-frame" type="button" data-i="${i}" aria-label="Open photo: ${p.title}, ${p.place}">
          <img class="work-media" src="${p.src}" alt="${p.title}, ${p.place}" decoding="async" />
        </button>
        <figcaption class="plaque"><b>${p.title}</b><span>${p.place} · ${p.year}</span></figcaption>
      </figure>`).join("");

    $("#socials").innerHTML = S.socials.map((s) => `
      <li><a class="social" href="${s.url}" aria-label="${s.label}"><span class="s-icon">${s.short}</span><span>${s.label}</span></a></li>`).join("");
  }

  /* ================= LAYOUT ================= */
  const L = {}; // layout numbers
  let segs = [], total = 0, stops = {};

  const setBox = (el, x, y, w, h) => {
    el.style.setProperty("--x", x + "px"); el.style.setProperty("--y", y + "px");
    if (w != null) el.style.setProperty("--w", w + "px");
    if (h != null) el.style.setProperty("--h", h + "px");
  };
  const snap = (v) => Math.round(v / L.P) * L.P;

  function layout() {
    const vw = innerWidth, vh = innerHeight;
    const P = vw < 700 ? 3 : 4;
    Object.assign(L, { vw, vh, P });
    L.gy = snap(vh * 0.8);
    L.cs = Math.min(1.1, Math.max(0.55, (vh * 0.2) / 170)); // character scale (sheet px -> css px)

    // 1. street
    const street = { x: 0, y: 0, w: snap(vw + Math.max(vw * 0.8, 700)), h: vh };
    const mh = snap(street.w - vw * 0.6);
    // 2. drain
    const drain = { x: snap(mh - vw * 0.4), y: vh, w: vw, h: snap(vh * 1.3) };
    // 3. subway: billboards along the wall
    const subway = { x: drain.x, y: drain.y + drain.h, h: vh };
    const bh = Math.round(Math.min(Math.max(vh * 0.3, 140), 290));
    const gap = Math.round(Math.max(170, vw * 0.16));
    let cur = snap(vw * 0.95);
    const pillars = [], benches = [];
    const boards = S.projects.map((p, i) => {
      const ih = p.shape === "tall" ? Math.round(bh * 1.25) : bh;
      const iw = Math.round(p.shape === "wide" ? bh * 16 / 9 : p.shape === "std" ? bh * 4 / 3 : ih * 9 / 16);
      const b = { x: cur, y: snap(vh * 0.2 - (ih - bh) / 2), iw, ih };
      cur += iw + 24 + gap;
      pillars.push((cur - gap / 2) / P);
      if (i % 2 === 0) benches.push((cur - gap + 16) / P);
      return b;
    });
    subway.w = snap(cur + vw * 0.55);
    // 4. cinema
    const lobbyW = snap(Math.max(vw * 0.9, 640));
    const cinema = { x: subway.x + subway.w, y: subway.y, h: vh, w: snap(lobbyW + vw * 1.5) };
    const seatX = snap(lobbyW + vw * 0.45);
    const scrH = Math.round(Math.min(vh * 0.38, vw * 0.6 * 9 / 16));
    const scr = { w: Math.round(scrH * 16 / 9), h: scrH };
    scr.x = snap(lobbyW + vw * 0.64 - scr.w / 2); scr.y = snap(Math.max(vh * 0.15, 100));
    // 5. exhibition
    const ph = Math.round(Math.min(Math.max(vh * 0.3, 130), 280));
    const pgap = Math.round(Math.max(150, vw * 0.14));
    let pc = snap(vw * 0.75);
    const lights = [], windows = [];
    const frames = S.photos.map((p, i) => {
      const w = Math.round(ph * p.w / p.h), fr = { x: pc, y: snap(vh * 0.24), w, h: ph };
      lights.push({ x: (pc + w / 2) / P, w: (w + 48) / P, h: (vh * 0.24 + ph + 30) / P - vh * 0.08 / P - 10 });
      pc += w + 32 + pgap;
      if (i % 2 === 0 && i < S.photos.length - 1) windows.push((pc - pgap / 2 - 13 * P) / P);
      return fr;
    });
    const exhibition = { x: cinema.x + cinema.w, y: subway.y, h: vh, w: snap(pc + vw * 0.35) };
    // 6. rooftop
    const rooftop = { x: exhibition.x + exhibition.w, y: subway.y, w: vw, h: vh };

    Object.assign(L, { street, mh, drain, subway, cinema, exhibition, rooftop, boards, frames, lobbyW, seatX, scr });

    // place scenes
    for (const [id, s] of Object.entries({ street, drain, subway, cinema, exhibition, rooftop })) {
      setBox($("#" + id), s.x, s.y, s.w, s.h);
    }
    // place content inside scenes
    setBox($(".hero"), 0, 0, vw, vh);
    const H = Sprite.HOLE, hw = Math.round(H.w * L.cs), hh = Math.round(H.h * L.cs);
    setBox($(".manhole"), mh - hw / 2, L.gy - hh + 4, hw, hh);
    setBox($(".manhole-cover"), mh - hw / 2, L.gy - hh + 4, hw, hh);
    setBox($(".sign-chai"), snap(vw * 0.1 * 1), L.gy - 44 * P);
    setBox($(".sign-open"), snap(vw * 0.62), L.gy - 42 * P);
    setBox($(".sign-taxi"), snap(vw * 1.1), L.gy - 40 * P);
    setBox($(".street-board"), snap(vw * 1.12), snap(vh * 0.18));
    setBox($(".graffiti"), snap(vw * 0.4 + 30 * P), snap(drain.h * 0.3));
    $$(".drip").forEach((d, i) => setBox(d, snap(vw * 0.4 + [-16, 8, 18][i] * P), snap(drain.h * (0.2 + i * 0.22))));
    setBox($(".station-board"), snap(vw * 0.5), snap(vh * 0.2));
    setBox($(".platform-display"), snap(vw * 0.12), snap(vh * 0.13));
    setBox($(".exit-sign"), subway.w - snap(vw * 0.35), snap(vh * 0.2));
    $$(".billboard").forEach((el, i) => {
      const b = boards[i];
      setBox(el, b.x, b.y, b.iw, b.ih);
    });
    setBox($(".marquee"), snap(lobbyW * 0.08), snap(vh * 0.1 + 8), snap(lobbyW * 0.84), snap(vh * 0.14 - 8));
    setBox($(".housefull"), snap(lobbyW * 0.4), L.gy - 40 * P - 48);
    setBox($(".cinema-content"), scr.x, scr.y, scr.w, scr.h);
    setBox($(".gallery-title"), snap(vw * 0.22), snap(vh * 0.24));
    $$(".photo").forEach((el, i) => setBox(el, frames[i].x, frames[i].y, frames[i].w, frames[i].h));
    setBox($(".credits"), snap(vw * 0.45), snap(vh * 0.12), snap(vw * 0.5));

    // paint backgrounds
    const paint = (id, opts) => {
      const s = L[id];
      Scenes.paint($("#" + id + " .bg"), id, s.w, s.h, P, opts);
    };
    paint("street", { mx: mh / P, vwA: vw / P });
    paint("drain", { cx: (vw * 0.4) / P });
    paint("subway", { pillars, benches, vending: (vw * 0.14) / P, stairsW: 70 });
    paint("cinema", { lobbyW: lobbyW / P, seatX: seatX / P, seatGap: (70 * L.cs) / P, screen: { x: scr.x / P, y: scr.y / P, w: scr.w / P, h: scr.h / P } });
    paint("exhibition", {
      lights, windows, bench: (frames[1] ? frames[1].x - pgap / 2 - 18 * P : vw) / P,
      plant: (vw * 0.12) / P, rope: (exhibition.w - vw * 0.3) / P,
    });
    paint("rooftop", {});

    sprite.width = Sprite.W; sprite.height = Sprite.H;
    charEl.style.setProperty("--w", Math.round(Sprite.W * L.cs) + "px");
    charEl.style.setProperty("--h", Math.round(Sprite.H * L.cs) + "px");
    lastKey = "";

    buildPath();
  }

  /* ================= PATH ================= */
  function buildPath() {
    const { vw, vh, gy, street, mh, drain, subway, cinema, exhibition, rooftop, lobbyW, seatX } = L;
    const sy = subway.y + gy;
    const follow = (x, y) => ({ x: x - vw * 0.4, y: y - gy });
    segs = [];
    const add = (s) => { s.start = total; total += Math.max(1, Math.round(s.len)); s.len = Math.max(1, Math.round(s.len)); segs.push(s); };
    total = 0;

    const x0 = vw * 0.3, stand = mh - Sprite.HOLE.dx * L.cs;
    add({ loc: "street", pose: "walk", a: [x0, gy], b: [stand, gy], len: stand - x0,
      cam: (t) => ({ x: (mh - vw * 0.4) * t, y: 0 }) });
    add({ id: "crouch", loc: "street", pose: "crouch", a: [stand, gy], b: [stand, gy], len: 220,
      cam: () => follow(mh, gy) });
    add({ loc: "drain", pose: "fall", a: [mh, gy], b: [mh, sy], len: drain.h * 0.9 + vh * 0.2, ease: "in",
      bubble: ["Shortcut!", 0.12, 0.55],
      cam: (t, p) => ({ x: mh - vw * 0.4, y: Math.min(subway.y, Math.max(0, p.y - vh * (0.8 - 0.32 * Math.sin(Math.PI * t)))) }) });
    add({ loc: "subway", pose: "land", a: [mh, sy], b: [mh, sy], len: 160, bubble: ["Next stop: Projects!", 0, 1],
      cam: () => follow(mh, sy) });
    add({ loc: "subway", pose: "walk", a: [mh, sy], b: [subway.x + subway.w, sy], len: subway.x + subway.w - mh });
    const tkt = (lobbyW * 0.4 + 18 * L.P) / seatX;
    add({ loc: "cinema", pose: "walk", a: [cinema.x, sy], b: [cinema.x + seatX, sy], len: seatX,
      bubble: ["Ek ticket, please!", tkt - 0.08, tkt + 0.06] });
    add({ id: "sit", loc: "cinema", pose: "sit", prop: "popcorn", a: [cinema.x + seatX, sy], b: [cinema.x + seatX, sy], len: vh * 1.1,
      bubble: ["Housefull!", 0, 0.12], cam: () => follow(cinema.x + seatX, sy) });
    add({ loc: "cinema", pose: "walk", a: [cinema.x + seatX, sy], b: [cinema.x + cinema.w, sy], len: cinema.w - seatX });
    const jx = exhibition.x + exhibition.w - vw * 0.15;
    add({ id: "gallery", loc: "exhibition", pose: "walk", a: [exhibition.x, sy], b: [jx, sy], len: (jx - exhibition.x) / 0.7 });
    const rx = rooftop.x + vw * 0.28, ry = rooftop.y + snap(vh * 0.78);
    add({ loc: "exhibition", loc2: "rooftop", pose: "jump", a: [jx, sy], b: [rx, ry], len: 380, ease: "arc", arc: vh * 0.3,
      cam: (t) => { const f = follow(jx, sy); return { x: f.x + (rooftop.x - f.x) * t, y: f.y + (rooftop.y - f.y) * t }; } });
    add({ loc: "rooftop", pose: "sit", prop: "chai", a: [rx, ry], b: [rx, ry], len: 220, bubble: ["Chai break?", 0.3, 1.01],
      cam: () => ({ x: rooftop.x, y: rooftop.y }) });

    const find = (id) => segs.find((s) => s.id === id);
    stops = {
      street: 0,
      drain: find("crouch").start,
      subway: segs[4].start + 2,
      cinema: find("sit").start + 40,
      exhibition: find("gallery").start + (vw * 0.45) / 0.7,
      rooftop: total,
    };
    stops.order = ["street", "drain", "subway", "cinema", "exhibition", "rooftop"];

    spacer.style.height = body.classList.contains("ride") ? total + vh + "px" : "0px";
  }

  function evalPath(d) {
    let s = segs[segs.length - 1];
    for (const seg of segs) if (d < seg.start + seg.len) { s = seg; break; }
    const t = Math.min(1, Math.max(0, (d - s.start) / s.len));
    let k = t;
    if (s.ease === "in") k = t * t;
    let x = s.a[0] + (s.b[0] - s.a[0]) * k;
    let y = s.a[1] + (s.b[1] - s.a[1]) * k;
    if (s.ease === "arc") y -= s.arc * 4 * t * (1 - t);
    const p = { x, y };
    const cam = s.cam ? s.cam(t, p) : { x: x - L.vw * 0.4, y: y - L.gy };
    return { s, t, p, cam };
  }

  /* ================= RENDER LOOP ================= */
  let target = 0, cur = 0, lastX = null, walkDist = 0, facing = 1, lastMove = 0, lastLoc = "", hoverLook = false;
  let lastKey = "";

  function frame(now) {
    requestAnimationFrame(frame);
    if (!body.classList.contains("ride")) return;
    target = scrollY;
    const diff = target - cur;
    cur = Math.abs(diff) < 0.5 ? target : cur + diff * 0.2;

    const { s, t, p, cam } = evalPath(cur);

    // movement bookkeeping
    if (lastX !== null) {
      const dx = p.x - lastX;
      if (Math.abs(dx) > 0.05) { walkDist += Math.abs(dx); facing = dx >= 0 ? 1 : -1; lastMove = now; }
    }
    lastX = p.x;

    // pose -> animation + frame number
    const moving = now - lastMove < 160;
    const tick = (ms) => Math.floor(now / ms);
    const saying = s.bubble && t >= s.bubble[1] && t <= s.bubble[2];
    let anim = "idle", n = tick(260);
    switch (s.pose) {
      case "walk":
        if (moving) {
          const run = Math.abs(diff) > 60; // fast scrolling breaks into a run
          anim = run ? "run" : "walk";
          n = Math.floor(walkDist / (L.cs * (run ? 26 : 16)));
        } else if (hoverLook && s.loc === "subway") anim = "point";
        else if (s.loc === "exhibition") { anim = tick(2400) % 2 ? "gaze" : "look"; n = tick(900); }
        else if (cur < 40) { const w = tick(170) % 12; anim = w < 4 ? "wave" : "idle"; n = w < 4 ? w : tick(260); }
        else if (saying) { anim = "talk"; n = tick(220); }
        break;
      case "crouch": anim = t < 0.1 ? "idle" : "crouch"; n = t < 0.4 ? 0 : t < 0.7 ? 1 : 2; break;
      case "fall": anim = "fall"; n = tick(110); break;
      case "land": anim = t < 0.6 ? "land" : "talk"; n = t < 0.25 ? 0 : t < 0.45 ? 1 : t < 0.6 ? 2 : tick(220); break;
      case "jump": anim = "jump"; n = Math.min(4, Math.floor(t * 5)); break;
      case "sit": anim = s.prop === "chai" ? "chai" : "cinema"; n = tick(s.prop === "chai" ? 650 : 500); break;
    }
    const flips = ["walk", "run", "idle", "talk", "point", "look", "gaze"].includes(anim);

    // location
    const loc = s.loc2 && t > 0.55 ? s.loc2 : s.loc;
    if (loc !== lastLoc) {
      lastLoc = loc;
      body.dataset.location = loc;
      $$(".route a[data-stop]").forEach((a) => a.classList.toggle("here", a.dataset.stop === loc));
    }

    // draw sprite (frames are cached per location tint)
    const key = anim + (n % Sprite.count(anim)) + loc;
    if (key !== lastKey) {
      const src = Sprite.frame(anim, n, RIM[loc]);
      if (src) {
        lastKey = key;
        const c = sprite.getContext("2d");
        c.clearRect(0, 0, Sprite.W, Sprite.H);
        c.drawImage(src, 0, 0);
      }
    }
    const w = Sprite.W * L.cs, h = Sprite.H * L.cs;
    charEl.style.transform = `translate3d(${Math.round(p.x - w / 2)}px, ${Math.round(p.y - h)}px, 0)`;
    charEl.style.setProperty("--face", flips ? facing : 1);

    // dropping into the manhole: hide the part of him that's below the street surface
    const top = p.y - h, A = L.gy + 2 - top, B = L.vh - top;
    sprite.style.webkitMaskImage = sprite.style.maskImage =
      s.pose === "fall" && A < h && B > 0 ? `linear-gradient(#000 0 ${A}px, transparent ${A}px ${B}px, #000 ${B}px)` : "";
    charEl.classList.toggle("no-shadow", !["walk", "run", "idle", "talk", "point", "look", "gaze", "wave"].includes(anim));

    world.style.transform = `translate3d(${-Math.round(cam.x)}px, ${-Math.round(cam.y)}px, 0)`;

    // speech bubble
    let say = "";
    if (s.bubble && t >= s.bubble[1] && t <= s.bubble[2]) say = s.bubble[0];
    if (anim === "point") say = "Let's check this out!";
    if (bubble.textContent !== say) bubble.textContent = say;
    bubble.classList.toggle("show", !!say);

    // the crouch frames draw their own cover, so hide ours once he grabs it
    const cr = segs.find((x) => x.id === "crouch");
    $(".manhole-cover").hidden = cur > cr.start + cr.len * 0.1;

    // cinema curtains open as the character reaches the seat
    const sit = segs.find((x) => x.id === "sit");
    const near = Math.min(1, Math.max(0, 1 - (sit.start - cur) / (L.vw * 0.5)));
    body.style.setProperty("--curtain", (1 - near).toFixed(3));

    // route progress
    const ord = stops.order;
    let fi = 0;
    for (let i = 0; i < ord.length - 1; i++) {
      const a = stops[ord[i]], b = stops[ord[i + 1]];
      if (cur >= b) fi = i + 1;
      else if (cur >= a) { fi = i + (cur - a) / (b - a); break; }
    }
    body.style.setProperty("--route", (fi / (ord.length - 1)).toFixed(4));
  }

  /* ================= NAVIGATION ================= */
  function goTo(stop, instant) {
    if (body.classList.contains("ride")) {
      const top = typeof stop === "number" ? stop : stops[stop];
      scrollTo({ top, behavior: instant || reduceMotion ? "auto" : "smooth" });
      if (instant) { cur = top; }
    } else {
      const el = typeof stop === "string" ? document.getElementById(stop) : null;
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function projectStop(id) {
    const i = S.projects.findIndex((p) => p.id === id);
    if (i < 0) return null;
    const b = L.boards[i], walk = segs[4];
    const cx = L.subway.x + b.x + b.iw / 2 - L.vw * 0.1;
    return walk.start + Math.min(walk.len, Math.max(0, cx - walk.a[0]));
  }

  function handleHash(instant) {
    const h = location.hash.slice(1);
    if (!h) return;
    if (h.startsWith("project-")) {
      if (body.classList.contains("ride")) {
        const d = projectStop(h.slice(8));
        if (d != null) goTo(d, instant);
      } else document.getElementById(h)?.scrollIntoView();
    } else if (stops[h] != null) goTo(h, instant);
  }

  function setMode(ride) {
    body.classList.toggle("ride", ride);
    body.classList.toggle("static", !ride);
    $(".skip-ride").setAttribute("aria-pressed", String(!ride));
    $(".skip-ride").textContent = ride ? "Skip the ride" : "Take the ride";
    store.set("nb-mode", ride ? "ride" : "static");
    if (!ride) { world.style.transform = ""; body.dataset.location = "street"; }
    layout();
  }

  /* ================= INTERACTIONS ================= */
  function bindUI() {
    $$("[data-stop]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(a.dataset.stop);
      history.replaceState(null, "", "#" + a.dataset.stop);
    }));

    $(".skip-ride").addEventListener("click", () => {
      const ride = !body.classList.contains("ride");
      const at = lastLoc || "street";
      setMode(ride);
      requestAnimationFrame(() => goTo(at, true));
    });

    $(".play-again").addEventListener("click", () => goTo("street"));

    // billboards: look up on hover, train wipe on click
    $$(".billboard").forEach((a) => {
      a.addEventListener("mouseenter", () => (hoverLook = true));
      a.addEventListener("mouseleave", () => (hoverLook = false));
      a.addEventListener("focus", () => {
        hoverLook = true;
        if (body.classList.contains("ride")) { const d = projectStop(a.id.slice(8)); if (d != null) goTo(d); }
      });
      a.addEventListener("blur", () => (hoverLook = false));
      a.addEventListener("click", (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || reduceMotion) return;
        e.preventDefault();
        history.replaceState(null, "", "#" + a.id);
        $(".train-wipe").classList.add("go");
        setTimeout(() => (location.href = a.href), 750);
      });
    });

    // photos: keep the character walking to a focused frame
    $$(".photo-frame").forEach((b) => b.addEventListener("click", () => openLightbox(+b.dataset.i)));

    // reels
    let reel = 0, muted = true;
    const media = $("#screen-media");
    const showReel = (i) => {
      reel = (i + S.reels.length) % S.reels.length;
      const r = S.reels[reel];
      media.innerHTML = r.src
        ? `<video class="work-media" src="${r.src}" poster="${r.poster}" playsinline preload="none" ${muted ? "muted" : ""}></video>`
        : `<img class="work-media" src="${r.poster}" alt="${r.title} (placeholder poster)" /><span class="now-showing">NOW SHOWING<br><b>${r.title}</b><small>Placeholder: add a video file in js/data.js</small></span>`;
      $$(".ticket").forEach((t) => t.setAttribute("aria-pressed", String(+t.dataset.i === reel)));
      $("#reel-play").textContent = "Play reel";
    };
    showReel(0);
    $$(".ticket").forEach((t) => t.addEventListener("click", () => showReel(+t.dataset.i)));
    $("#reel-next").addEventListener("click", () => showReel(reel + 1));
    $("#reel-play").addEventListener("click", () => {
      const v = $("video", media);
      if (!v) { media.classList.remove("flicker"); void media.offsetWidth; media.classList.add("flicker"); return; }
      if (v.paused) { v.play(); $("#reel-play").textContent = "Pause"; } else { v.pause(); $("#reel-play").textContent = "Play reel"; }
    });
    $("#reel-mute").addEventListener("click", (e) => {
      muted = !muted;
      const v = $("video", media);
      if (v) v.muted = muted;
      e.currentTarget.setAttribute("aria-pressed", String(muted));
      e.currentTarget.textContent = muted ? "Muted" : "Sound on";
    });

    // lightbox
    const lb = $("#lightbox");
    let li = 0, lastFocus = null, tx = null;
    function show(i) {
      li = (i + S.photos.length) % S.photos.length;
      const p = S.photos[li];
      $("#lb-img").src = p.src; $("#lb-img").alt = `${p.title}, ${p.place}`;
      $("#lb-cap").innerHTML = `<b>${p.title}</b><span>${p.place} · ${p.year}</span>`;
    }
    function openLightbox(i) { lastFocus = document.activeElement; show(i); lb.hidden = false; body.classList.add("lb-open"); $(".lb-close").focus(); }
    function close() { lb.hidden = true; body.classList.remove("lb-open"); lastFocus?.focus(); }
    $(".lb-close").addEventListener("click", close);
    $(".lb-prev").addEventListener("click", () => show(li - 1));
    $(".lb-next").addEventListener("click", () => show(li + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) close(); });
    addEventListener("keydown", (e) => {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") show(li - 1);
      if (e.key === "ArrowRight") show(li + 1);
      if (e.key === "Tab") { // keep focus inside
        const f = $$("button", lb), i = f.indexOf(document.activeElement);
        e.preventDefault(); f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    lb.addEventListener("touchstart", (e) => (tx = e.touches[0].clientX), { passive: true });
    lb.addEventListener("touchend", (e) => {
      if (tx == null) return;
      const dx = e.changedTouches[0].clientX - tx;
      if (Math.abs(dx) > 40) show(li + (dx < 0 ? 1 : -1));
      tx = null;
    });
  }

  // older browsers: focusing a link inside a clipped scene can scroll it
  $$(".scene, .viewport").forEach((el) => el.addEventListener("scroll", () => { el.scrollLeft = 0; el.scrollTop = 0; }));

  /* ================= BOOT ================= */
  fillContent();
  bindUI();
  const saved = store.get("nb-mode");
  const ride = saved ? saved === "ride" : !reduceMotion;
  body.classList.toggle("ride", ride);
  body.classList.toggle("static", !ride);
  $(".skip-ride").setAttribute("aria-pressed", String(!ride));
  $(".skip-ride").textContent = ride ? "Skip the ride" : "Take the ride";
  if ("scrollRestoration" in history && location.hash) history.scrollRestoration = "manual";
  layout();

  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const frac = total ? cur / total : 0;
      layout();
      if (body.classList.contains("ride")) { scrollTo(0, frac * total); cur = frac * total; }
    }, 150);
  });

  document.fonts?.ready.then(() => handleHash(true));
  handleHash(true);
  cur = scrollY;
  requestAnimationFrame(frame);
})();
