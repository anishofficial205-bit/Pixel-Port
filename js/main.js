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

  // billboard frame art (assets/subway/frame-*.png): size and the window the project shows through
  const FRAMES = {
    wide: { w: 1108, h: 626, win: [76, 113, 958, 470] },
    tall: { w: 445, h: 845, win: [38, 96, 369, 689] },
  };
  const frameVars = (shape) => {
    const f = FRAMES[shape === "tall" ? "tall" : "wide"], [x, y, w, h] = f.win;
    const pc = (v, t) => (v / t * 100).toFixed(3) + "%";
    return `--ar:${f.w / f.h};--wx:${pc(x, f.w)};--wy:${pc(y, f.h)};--ww:${pc(w, f.w)};--wh:${pc(h, f.h)}`;
  };

  /* ================= CONTENT ================= */
  function fillContent() {
    $("#site-name").textContent = S.name;
    $("#site-role").textContent = S.role;
    $("#site-intro").textContent = S.intro;
    $(".hud-logo").textContent = S.name;
    $("#mail-link").href = "mailto:" + S.email;
    $("#mail-link").textContent = S.email;
    $("#copyright").textContent = `© ${S.year} ${S.name} · NEON BHARAT GAMES`;

    $("#billboards").innerHTML = S.projects.map((p, i) => `
      <a class="billboard shape-${p.shape}" id="project-${p.id}" data-i="${i}" href="project.html?p=${p.id}" style="${frameVars(p.shape)}">
        <span class="bb-window"><img class="work-media" src="${p.image}" alt="${p.title}: ${p.blurb}" decoding="async" /></span>
        <img class="bb-frame pixel-art" src="assets/subway/frame-${p.shape === "tall" ? "tall" : "wide"}.png" alt="" />
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

    $$(".cin-poster").forEach((el, i) => {
      const r = S.reels[i % S.reels.length];
      $("img", el).src = r.poster; $("span", el).textContent = r.title;
    });

    $("#socials").innerHTML = S.socials.map((s) => `
      <li><a class="social" href="${s.url}" aria-label="${s.label}"><span class="s-icon">${s.short}</span><span>${s.label}</span></a></li>`).join("");
  }

  /* ================= STREET ART ================= */
  // Measured on assets/scenes/street.webp (1672 x 941 art px)
  const STREET = {
    w: 1672, h: 941,
    road: 845,           // feet line on the wet road, just behind the divider
    start: 150,          // where he waits during the intro, outside the general store
    manhole: 790,        // in the gap between the two road dividers
    quads: {             // blank billboards: TL, TR, BR, BL
      left: [[400, 128], [705, 180], [705, 303], [400, 245]],
      led: [[1294, 210], [1416, 182], [1417, 446], [1293, 470]],
      mid: [[969, 488], [1176, 484], [1177, 554], [969, 563]],
    },
    medical: [356, 402, 70, 110],  // MEDICAL STORE neon: x, y, w, h
    steam: [1103, 640, 62, 72],    // above the chai pot
  };

  // assets/scenes/drain.webp: three stitched frames (manhole from below, shaft, grate into the subway)
  const DRAIN = {
    w: 1672, h: 2526,
    hole: 792,   // centre of the manhole opening, lines up with STREET.manhole
    top: 95,     // soil starts here; everything above sits behind the street's road
  };

  // assets/scenes/subway.webp: entry, platform x2, stairs; built by tools/build_subway.py
  const SUBWAY = {
    w: 6544, h: 941,
    grate: 830,          // ceiling grate + water stream; sits under the drain's grate
    drainGrate: 800,     // grate centre in the drain art
    cut: 150,            // top rows hidden under the drain's bottom edge
    floor: 680,          // his feet on the platform
    sign: [[936, 331], [1204, 331], [1204, 409], [936, 409]],   // blank station sign in the entry
    // billboards on the tiled wall: left, top, frame height (art px)
    boards: [
      { x: 2172, y: 215, h: 330 },
      { x: 3160, y: 190, h: 420 },
      { x: 3796, y: 215, h: 330 },
      { x: 5328, y: 215, h: 330 },
    ],
    stairs: [[5880, 680], [6540, 330]],   // bottom and top of the climb to the cinema
  };

  // assets/scenes/cinema-*.webp (1672 x 941 each): lobby and the auditorium's front view
  const CINEMA = {
    w: 1672, h: 941,
    lobby: {
      stairs: [[30, 875], [470, 662]],   // continues the subway stairs up into the lobby
      floor: 678, ticket: 660, door: 1515,
      quads: {
        marquee: [[320, 122], [1262, 122], [1262, 198], [320, 198]],
        sign: [[572, 288], [748, 288], [748, 322], [572, 322]],
        poster1: [[340, 296], [455, 296], [455, 466], [340, 466]],
        poster2: [[1022, 296], [1138, 296], [1138, 466], [1022, 466]],
      },
    },
    front: {
      screen: [476, 246, 720, 342],      // magenta area, keyed out; the reel plays behind it
      stage: [380, 640, 920, 64],        // front of the stage: reel controls live here
      rowTop: 700, rowH: 319,             // foreground seat row (assets/cinema/seat-row.webp)
      door: 105, doorH: 270, floor: 692,  // left exit door he enters and leaves by; the floor in front of it
      stand: 235,                         // where he stops beside the stage to watch
    },
  };

  // Map an element (sized to its quad's bounding box) onto a quad with a projective transform
  function mapToQuad(el, q, s) {
    const P = q.map(([x, y]) => [x * s, y * s]);
    // lay content out at the board's true face size (average edge lengths, not the slanted bounding box)
    const len = (i, j) => Math.hypot(q[i][0] - q[j][0], q[i][1] - q[j][1]);
    const bw = (len(0, 1) + len(3, 2)) / 2, bh = (len(0, 3) + len(1, 2)) / 2;
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = P;
    const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
    const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
    const den = dx1 * dy2 - dx2 * dy1;
    const g = (dx3 * dy2 - dx2 * dy3) / den, k = (dx1 * dy3 - dx3 * dy1) / den;
    const a = x1 - x0 + g * x1, b = x3 - x0 + k * x3, d = y1 - y0 + g * y1, e = y3 - y0 + k * y3;
    el.style.width = bw + "px"; el.style.height = bh + "px";
    el.style.setProperty("--quad",
      `matrix3d(${a / bw},${d / bw},0,${g / bw},${b / bh},${e / bh},0,${k / bh},0,0,1,0,${x0},${y0},0,1)`);
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
    // character scale: a whole number of device pixels per sheet pixel keeps him sharp
    const dpr = window.devicePixelRatio || 1;
    L.ck = Math.max(1, Math.round(((vh * 0.2) / 170) * dpr)); // device px per sheet px
    L.cs = L.ck / dpr;                                         // css px per sheet px

    // 1. street: the art covers the screen (wide screens tilt down it, tall ones pan across)
    const ss = Math.max(vw / STREET.w, vh / STREET.h);     // art px -> css px (cover)
    const street = { x: 0, y: 0, w: Math.round(STREET.w * ss), h: Math.round(STREET.h * ss), s: ss };
    const mh = Math.round(STREET.manhole * ss);             // manhole centre
    L.sgy = Math.round(STREET.road * ss);                   // where his feet meet the road
    const camEnd = { x: Math.min(Math.max(0, mh - vw * 0.4), street.w - vw), y: street.h - vh };
    const nameX = (STREET.quads.left[0][0] + STREET.quads.left[1][0]) / 2 * ss;   // centre of the name billboard
    const camStart = { x: Math.min(Math.max(0, nameX - vw / 2), camEnd.x), y: 0 };
    L.x0 = Math.max(STREET.start * ss, camStart.x + vw * 0.2);                    // he starts in the opening frame
    // 2. drain: the shaft art hangs under the street, its manhole under the street's manhole
    const drain = {
      x: Math.round(mh - DRAIN.hole * ss), y: Math.round(street.h - DRAIN.top * ss),
      w: Math.round(DRAIN.w * ss), h: Math.round(DRAIN.h * ss),
    };
    // 3. subway: its grate sits right under the drain's grate; the drain covers its top rows
    const subway = {
      x: Math.round(drain.x + (SUBWAY.drainGrate - SUBWAY.grate) * ss), y: Math.round(drain.y + drain.h - SUBWAY.cut * ss),
      w: Math.round(SUBWAY.w * ss), h: Math.round(SUBWAY.h * ss),
    };
    L.sy = subway.y + Math.round(SUBWAY.floor * ss);                                   // platform feet line
    L.subCamY = Math.min(Math.max(subway.y, L.sy - vh * 0.8), subway.y + subway.h - vh);
    const boards = S.projects.slice(0, SUBWAY.boards.length).map((p, i) => {
      const f = FRAMES[p.shape === "tall" ? "tall" : "wide"], b = SUBWAY.boards[i];
      return { x: Math.round(b.x * ss), y: Math.round(b.y * ss), iw: Math.round(b.h * f.w / f.h * ss), ih: Math.round(b.h * ss) };
    });
    // 4. cinema: the lobby's stairs pick up where the subway stairs leave the screen
    const C = CINEMA, cs = ss;
    const cinema = {
      x: subway.x + subway.w, y: Math.round(subway.y + (SUBWAY.stairs[1][1] - C.lobby.stairs[0][1]) * cs),
      w: Math.round(C.w * cs), h: Math.round(C.h * cs),
    };
    L.ty = cinema.y + Math.round(C.lobby.floor * cs);                 // lobby floor; later scenes share it
    const row = L.ty - L.gy;
    // the auditorium is only reached through a cut, so leave a screen of space around it
    const fs = Math.max(vw / C.w, Math.min(vh / C.h, vw / 760));   // phones: fit the screen, not the room
    const fw = Math.round(C.w * fs), fh = Math.round(C.h * fs);
    const front = { x: cinema.x + cinema.w + vw, y: cinema.y, w: Math.max(fw, vw), h: Math.max(fh, vh), s: fs };
    front.ox = Math.round((front.w - fw) / 2); front.oy = Math.round((front.h - fh) / 2);
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
    const exhibition = { x: front.x + front.w + vw, y: row, h: vh, w: snap(pc + vw * 0.35) };
    // 6. rooftop
    const rooftop = { x: exhibition.x + exhibition.w, y: row, w: vw, h: vh };

    Object.assign(L, { street, mh, camStart, camEnd, drain, subway, cinema, front, exhibition, rooftop, boards, frames });

    // place scenes
    for (const [id, s] of Object.entries({ street, drain, subway, cinema, "cinema-front": front, exhibition, rooftop })) {
      setBox($("#" + id), s.x, s.y, s.w, s.h);
    }
    // place content inside scenes
    const H = Sprite.HOLE, hw = Math.round(H.w * L.cs), hh = Math.round(H.h * L.cs);
    setBox($(".manhole"), mh - hw / 2, L.sgy - hh + 4, hw, hh);
    setBox($(".manhole-cover"), mh - hw / 2, L.sgy - hh + 4, hw, hh);
    const art = (el, [x, y, w, h]) => setBox(el, Math.round(x * ss), Math.round(y * ss), Math.round(w * ss), Math.round(h * ss));
    art($(".neon-flicker"), STREET.medical);
    art($(".steam"), STREET.steam);
    $$(".bb-map").forEach((el) => mapToQuad(el, STREET.quads[el.dataset.quad], ss));
    mapToQuad($(".station-board"), SUBWAY.sign, ss);
    $$(".billboard").forEach((el, i) => {
      const b = boards[i];
      el.hidden = !b;
      if (b) setBox(el, b.x, b.y, b.iw, b.ih);
    });
    $$("#cinema [data-quad]").forEach((el) => mapToQuad(el, C.lobby.quads[el.dataset.quad], cs));
    const F = C.front, fbox = (el, [x, y, w, h]) => setBox(el, Math.round(x * fs), Math.round(y * fs), Math.round(w * fs), Math.round(h * fs));
    setBox($(".front-art"), front.ox, front.oy, fw, fh);
    fbox($(".cinema-content"), F.screen);
    // controls sit on the stage front; on tall narrow screens there's room below the room instead
    const visLeft = Math.min(Math.max(front.ox + 836 * fs - vw / 2, 0), front.w - vw) - front.ox;   // camera's left edge, in art-box px
    if (front.h - front.oy - fh > 140) setBox($(".reel-bar"), visLeft + 12, fh + 20, vw - 24, front.h - front.oy - fh - 40);
    else fbox($(".reel-bar"), F.stage);
    // the seat row sits in front of him, clipped to the bottom of the room
    const rowY = front.y + front.oy + Math.round(F.rowTop * fs);
    setBox($(".front-row"), front.x + front.ox, rowY, fw, front.y + front.oy + fh - rowY);
    $(".front-row img").style.width = fw + "px";
    setBox($(".gallery-title"), snap(vw * 0.22), snap(vh * 0.24));
    $$(".photo").forEach((el, i) => setBox(el, frames[i].x, frames[i].y, frames[i].w, frames[i].h));
    setBox($(".credits"), snap(vw * 0.45), snap(vh * 0.12), snap(vw * 0.5));

    // paint backgrounds
    const paint = (id, opts) => {
      const s = L[id];
      Scenes.paint($("#" + id + " .bg"), id, s.w, s.h, P, opts);
    };
    paint("exhibition", {
      lights, windows, bench: (frames[1] ? frames[1].x - pgap / 2 - 18 * P : vw) / P,
      plant: (vw * 0.12) / P, rope: (exhibition.w - vw * 0.3) / P,
    });
    paint("rooftop", {});

    sprite.width = Sprite.W * L.ck; sprite.height = Sprite.H * L.ck;
    charEl.style.setProperty("--w", Math.round(Sprite.W * L.cs) + "px");
    charEl.style.setProperty("--h", Math.round(Sprite.H * L.cs) + "px");
    lastKey = "";

    buildPath();
  }

  /* ================= PATH ================= */
  function buildPath() {
    const { vw, vh, gy, sgy, street, mh, camStart, camEnd, drain, subway, cinema, front, exhibition, rooftop, subCamY } = L;
    const sy = L.sy, ty = L.ty, ss = street.s;
    const follow = (x, y) => ({ x: x - vw * 0.4, y: y - gy });
    segs = [];
    const add = (s) => { s.start = total; total += Math.max(1, Math.round(s.len)); s.len = Math.max(1, Math.round(s.len)); segs.push(s); };
    total = 0;

    const x0 = Math.round(L.x0), stand = mh - Sprite.HOLE.dx * L.cs;
    const lerp = (a, b, t) => a + (b - a) * t;
    // intro: he waits on the road while the camera tilts from the billboards down to the street
    add({ id: "intro", loc: "street", pose: "walk", a: [x0, sgy], b: [x0, sgy], len: Math.max(160, camEnd.y),
      bubble: ["Hi! I'm " + S.name[0] + S.name.slice(1).toLowerCase() + ".", 0.7, 1],
      cam: (t) => ({ x: camStart.x, y: camEnd.y * (t * t * (3 - 2 * t)) }) });
    add({ loc: "street", pose: "walk", a: [x0, sgy], b: [stand, sgy], len: Math.max(120, stand - x0),
      bubble: ["Chalo, let's go!", 0, 0.3],
      cam: (t) => ({ x: lerp(camStart.x, camEnd.x, t), y: camEnd.y }) });
    add({ id: "crouch", loc: "street", pose: "crouch", a: [stand, sgy], b: [stand, sgy], len: 220,
      cam: () => camEnd });
    // fall: the camera eases with him, so he stays on screen the whole way down
    add({ loc: "drain", pose: "fall", a: [mh, sgy], b: [mh, sy], len: vh * 1.6, ease: "in",
      bubble: ["Shortcut!", 0.12, 0.55],
      cam: (t) => ({ x: camEnd.x, y: lerp(camEnd.y, subCamY, t * t) }) });
    add({ loc: "subway", pose: "land", a: [mh, sy], b: [mh, sy], len: 160, bubble: ["Next stop: Projects!", 0, 1],
      cam: () => ({ x: camEnd.x, y: subCamY }) });
    // hand the camera from the drain framing back to "follow" over his first steps
    const off = camEnd.x - (mh - vw * 0.4);
    const [s0, s1] = SUBWAY.stairs.map(([x, y]) => [subway.x + x * ss, subway.y + y * ss]);
    add({ id: "subwalk", loc: "subway", pose: "walk", a: [mh, sy], b: [s0[0], sy], len: s0[0] - mh,
      cam: (t, p) => ({ x: p.x - vw * 0.4 + off * Math.max(0, 1 - (p.x - mh) / (vw * 0.4)), y: subCamY }) });
    // --- cinema ---
    const C = CINEMA, fs = front.s;
    const at = (sc, [x, y]) => [sc.x + x * ss, sc.y + y * ss];
    const clampX = (sc, x) => Math.min(Math.max(x, sc.x), sc.x + sc.w - vw);
    const camIn = (sc, p) => ({ x: clampX(sc, p.x - vw * 0.4), y: Math.min(Math.max(p.y - vh * 0.8, sc.y), sc.y + sc.h - vh) });
    const tri = (t) => 1 - Math.abs(2 * t - 1);                  // 0 -> 1 -> 0: a cut at the midpoint
    const l0 = at(cinema, C.lobby.stairs[0]), l1 = at(cinema, C.lobby.stairs[1]);
    const lobbyCam = camIn(cinema, { x: l0[0], y: ty });
    // up the subway stairs; the camera rises to the lobby
    add({ loc: "subway", loc2: "cinema", pose: "walk", a: s0, b: l0, len: (l0[0] - s0[0]) * 1.2,
      cam: (t, p) => ({ x: p.x - vw * 0.4, y: lerp(subCamY, lobbyCam.y, t) }) });
    add({ loc: "cinema", pose: "walk", a: l0, b: l1, len: (l1[0] - l0[0]) * 1.2, cam: (t, p) => camIn(cinema, { x: p.x, y: ty }) });
    const door = at(cinema, [C.lobby.door, C.lobby.floor]);
    const tk = (C.lobby.ticket * ss + cinema.x - l1[0]) / (door[0] - l1[0]);
    add({ loc: "cinema", pose: "walk", a: [l1[0], ty], b: door, len: door[0] - l1[0],
      bubble: ["Ek ticket, please!", tk - 0.07, tk + 0.07], cam: (t, p) => camIn(cinema, p) });
    // through the lobby doors: velvet cut into the auditorium, entering by its side door
    const F = C.front;
    const frontCam = {
      x: Math.min(Math.max(front.x + front.ox + 836 * fs - vw / 2, front.x), front.x + front.w - vw),
      y: front.y + (front.h - vh) / 2,
    };
    const doorCam = camIn(cinema, { x: door[0], y: door[1] });
    // standing near the screen he's further away than the seat row, so sized to the side door
    const k = Math.max(1, Math.round((F.doorH * fs * 0.8) / (170 * L.cs) * 2) / 2);
    const fx = (x) => front.x + front.ox + x * fs, fy = front.y + front.oy + F.floor * fs;
    // he stops beside the stage, left of the screen and controls (on phones: the left edge of the view)
    const leftArt = (frontCam.x - front.x - front.ox) / fs;
    const enter = [fx(F.door), fy], spot = [fx(Math.max(F.stand, leftArt + 70)), fy];
    add({ loc: "cinema", pose: "walk", a: door, b: enter, len: 260, ease: "cut", scale: k,
      cut: tri, cam: (t) => (t < 0.5 ? doorCam : frontCam) });
    add({ loc: "cinema", pose: "walk", a: enter, b: spot, len: Math.max(160, spot[0] - enter[0]), scale: k,
      bubble: ["Housefull!", 0.2, 0.9], cam: () => frontCam });
    // turns to the screen and watches (profile, looking up)
    add({ id: "sit", loc: "cinema", pose: "watch", face: 1, a: spot, b: spot, len: vh * 1.1, scale: k, cam: () => frontCam });
    // back out the same door, then a velvet cut to the gallery
    add({ loc: "cinema", pose: "walk", a: spot, b: enter, len: Math.max(160, spot[0] - enter[0]), scale: k, cam: () => frontCam });
    const g0 = [exhibition.x, ty];
    add({ loc: "cinema", loc2: "exhibition", pose: "walk", a: enter, b: g0, len: 260, ease: "cut", scale: k,
      cut: tri, cam: (t) => (t < 0.5 ? frontCam : { x: exhibition.x, y: ty - gy }) });
    const jx = exhibition.x + exhibition.w - vw * 0.15;
    add({ id: "gallery", loc: "exhibition", pose: "walk", a: [exhibition.x, ty], b: [jx, ty], len: (jx - exhibition.x) / 0.7 });
    const rx = rooftop.x + vw * 0.28, ry = rooftop.y + snap(vh * 0.78);
    add({ loc: "exhibition", loc2: "rooftop", pose: "jump", a: [jx, ty], b: [rx, ry], len: 380, ease: "arc", arc: vh * 0.3,
      cam: (t) => { const f = follow(jx, ty); return { x: f.x + (rooftop.x - f.x) * t, y: f.y + (rooftop.y - f.y) * t }; } });
    add({ loc: "rooftop", pose: "sit", prop: "chai", a: [rx, ry], b: [rx, ry], len: 220, bubble: ["Chai break?", 0.3, 1.01],
      cam: () => ({ x: rooftop.x, y: rooftop.y }) });

    const find = (id) => segs.find((s) => s.id === id);
    stops = {
      street: 0,
      drain: find("crouch").start - 60,
      subway: find("subwalk").start + 2,
      cinema: find("sit").start + 20,
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
    if (s.ease === "cut") k = t < 0.5 ? 0 : 1;
    let x = s.a[0] + (s.b[0] - s.a[0]) * k;
    let y = s.a[1] + (s.b[1] - s.a[1]) * k;
    if (s.ease === "arc") y -= s.arc * 4 * t * (1 - t);
    const p = { x, y };
    const cam = s.cam ? s.cam(t, p) : { x: x - L.vw * 0.4, y: y - L.gy };
    return { s, t, p, cam, cut: s.cut ? s.cut(t) : 0 };
  }

  /* ================= RENDER LOOP ================= */
  let target = 0, cur = 0, lastX = null, facing = 1, lastMove = 0, lastLoc = "", hoverLook = false;
  let lastCut = -1;
  const cutEl = $(".cut");
  let lastKey = "", lastNow = 0, speed = 0, running = false, stepPhase = 0;

  function frame(now) {
    requestAnimationFrame(frame);
    if (!body.classList.contains("ride")) return;
    target = scrollY;
    const diff = target - cur;
    cur = Math.abs(diff) < 0.5 ? target : cur + diff * 0.2;

    const ev = evalPath(cur), { s, t, p, cam } = ev;

    // movement bookkeeping: speed in px/ms, smoothed so wheel ticks don't flicker the pose
    const dt = Math.min(64, Math.max(1, now - (lastNow || now - 16)));
    lastNow = now;
    const dx = lastX === null ? 0 : p.x - lastX;
    if (Math.abs(dx) > 0.05) { facing = dx >= 0 ? 1 : -1; lastMove = now; }
    lastX = p.x;
    speed += (Math.abs(dx) / dt - speed) * 0.15;
    if (!running && speed > 1.4) running = true;       // hysteresis: harder to start running
    else if (running && speed < 0.7) running = false;  // than to keep running

    // pose -> animation + frame number
    const moving = now - lastMove < 160;
    const tick = (ms) => Math.floor(now / ms);
    const saying = s.bubble && t >= s.bubble[1] && t <= s.bubble[2];
    let anim = "idle", n = tick(260);
    const cutSide = s.ease === "cut" && t >= 0.5;          // past the midpoint of a cut
    const poseNow = cutSide && s.pose2 ? s.pose2 : s.pose;
    switch (poseNow) {
      case "walk":
        if (moving) {
          // steady game cadence (8 fps walk, 12 fps run), like the style guide's steps() timing
          anim = running ? "run" : "walk";
          stepPhase += (dt / 1000) * (running ? 12 : 8);
          n = Math.floor(stepPhase);
        } else if (hoverLook && s.loc === "subway") anim = "point";
        else if (s.loc === "exhibition") { anim = tick(2400) % 2 ? "gaze" : "look"; n = tick(900); }
        else if (s.id === "intro" && !saying) { const w = tick(170) % 12; anim = w < 4 ? "wave" : "idle"; n = w < 4 ? w : tick(260); }
        else if (saying) { anim = "talk"; n = tick(220); }
        break;
      case "crouch": anim = t < 0.1 ? "idle" : "crouch"; n = t < 0.4 ? 0 : t < 0.7 ? 1 : 2; break;
      case "fall": anim = "fall"; n = tick(110); break;
      case "land": anim = t < 0.6 ? "land" : "talk"; n = t < 0.25 ? 0 : t < 0.45 ? 1 : t < 0.6 ? 2 : tick(220); break;
      case "jump": anim = "jump"; n = Math.min(4, Math.floor(t * 5)); break;
      case "look": anim = "look"; n = tick(700); break;
      case "watch": anim = tick(3200) % 4 === 3 ? "look" : "gaze"; n = tick(900); facing = s.face || -1; break;
      case "sit": anim = s.prop === "chai" ? "chai" : "cinema"; n = tick(s.prop === "chai" ? 650 : 500); break;
    }
    const flips = ["walk", "run", "idle", "talk", "point", "look", "gaze"].includes(anim);

    // location
    const loc = s.loc2 && t > (s.ease === "cut" ? 0.5 : 0.55) ? s.loc2 : s.loc;
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
        c.imageSmoothingEnabled = false;
        c.clearRect(0, 0, sprite.width, sprite.height);
        c.drawImage(src, 0, 0, sprite.width, sprite.height);
      }
    }
    const w = Sprite.W * L.cs, h = Sprite.H * L.cs;
    const scale = s.scale && !(cutSide && s.loc2) ? s.scale : 1;
    const bob = Sprite.bob(anim, n) * L.cs;
    charEl.style.transform = `translate3d(${Math.round(p.x - w / 2)}px, ${Math.round(p.y - h + bob)}px, 0)` + (scale !== 1 ? ` scale(${scale})` : "");
    charEl.style.setProperty("--face", flips ? facing : 1);

    // dropping into the manhole: hide the part of him that's below the street surface
    const top = p.y - h, A = L.sgy + 2 - top, B = L.street.h - top;
    sprite.style.webkitMaskImage = sprite.style.maskImage =
      s.pose === "fall" && A < h && B > 0 ? `linear-gradient(#000 0 ${A}px, transparent ${A}px ${B}px, #000 ${B}px)` : "";
    charEl.classList.toggle("no-shadow", !["walk", "run", "idle", "talk", "point", "look", "gaze", "wave"].includes(anim));

    const z = cam.z || 1;
    world.style.transform = z === 1
      ? `translate3d(${-Math.round(cam.x)}px, ${-Math.round(cam.y)}px, 0)`
      : `translate(${L.vw / 2}px, ${L.vh / 2}px) scale(${z.toFixed(4)}) translate(${-(cam.x + L.vw / 2)}px, ${-(cam.y + L.vh / 2)}px)`;
    // cuts between cinema views: a stepped velvet fade
    const cutV = Math.round(ev.cut * 6) / 6;
    if (cutV !== lastCut) { lastCut = cutV; cutEl.style.opacity = cutV; }

    // speech bubble
    let say = "";
    if (s.bubble && t >= s.bubble[1] && t <= s.bubble[2]) say = s.bubble[0];
    if (anim === "point") say = "Let's check this out!";
    if (bubble.textContent !== say) bubble.textContent = say;
    bubble.classList.toggle("show", !!say);

    // the crouch frames draw their own cover, so hide ours once he grabs it
    const cr = segs.find((x) => x.id === "crouch");
    $(".manhole-cover").hidden = cur > cr.start + cr.len * 0.1;


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
      const el = typeof stop === "string" ? document.getElementById(stop === "cinema" ? "cinema-front" : stop) : null;
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function projectStop(id) {
    const i = S.projects.findIndex((p) => p.id === id);
    if (i < 0) return null;
    const b = L.boards[i], walk = segs.find((x) => x.id === "subwalk");
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

  // pixel rain: one small tile of slanted streaks, scrolled by CSS
  function makeRain() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    for (let i = 0; i < 70; i++) {
      const px = Math.random() * 256, py = Math.random() * 256, len = 6 + Math.random() * 10;
      x.fillStyle = `rgba(207, 232, 255, ${0.25 + Math.random() * 0.35})`;
      for (let k = 0; k < len; k += 2) x.fillRect(Math.round(px - k * 0.19), Math.round(py + k), 1, 2);
    }
    body.style.setProperty("--rain", `url(${c.toDataURL()})`);
  }

  /* ================= BOOT ================= */
  fillContent();
  makeRain();
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
  // the browser's own jump to #project-… lands after load and would undo ours
  addEventListener("load", () => requestAnimationFrame(() => handleHash(true)));
  handleHash(true);
  cur = scrollY;
  requestAnimationFrame(frame);
})();
