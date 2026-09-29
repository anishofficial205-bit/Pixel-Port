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

  /* ---- stairwell (subway -> cinema lobby) tunables ---- */
  const STAIR_ZONE = 0.25;             // handoff zone: this fraction of the viewport width on each side of the seam
  const SUBWAY_TOP_CROP = 40;          // art px cropped off the subway's top: exactly the ceiling rows build_subway.py duplicates
  const STAIR_VIGNETTE = 0.6;          // peak opacity of the stairwell vignette
  const FILL_DARK = "#120A1E";         // what the stairwell fillers fade to
  const FALLBACK_SUBWAY_TOP = "#1A2432";    // used if edge-colour sampling fails
  const FALLBACK_LOBBY_BOTTOM = "#161C2A";

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
      door: 105, exit: 1575, floor: 692,  // left door he enters by, right door he leaves by; the floor between
      stand: 235,                         // where he stops beside the stage to watch
    },
  };

  // assets/scenes/gallery.webp (tools/build_gallery.py): entrance, window wall, exit door + the rooftop outside
  const GALLERY = {
    w: 6496, h: 941,
    floor: 770,                 // his feet on the wooden floor
    artScale: 1.4,              // this art is drawn ~1.4x bigger than the other scenes, so it's shown smaller
    enter: 140, exit: 3930,     // double doors he comes in by; the door out to the roof
    frames: [[1063, 270, 438, 191], [2064, 263, 152, 197], [2436, 272, 424, 188], [3351, 277, 323, 178]],
    plaques: [[1240, 508, 78, 20], [2107, 505, 70, 19], [2608, 505, 76, 20], [3475, 500, 75, 19]],
    // rooftop at dawn (the footer): he steps out at `out`, walks to the bench under the string lights
    bulbs: [[5749, 382], [5803, 402], [5873, 418], [5939, 424], [6005, 424], [6055, 418], [6104, 409], [6152, 397], [6201, 380]],   // rooftop rows are remapped by build_gallery.py
    roof: { x: 4100, floor: 781, out: 4300, seat: 5869, seatFloor: 692, sky: [5000, 60, 1000] },
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
    // subway top is cropped (see SUBWAY_TOP_CROP); its bounding box starts below the crop
    const subCrop = Math.round(SUBWAY_TOP_CROP * ss);
    $("#subway .bg-img").style.clipPath = `inset(${subCrop}px 0 0 0)`;
    L.subBox = { left: subway.x, top: subway.y + subCrop, right: subway.x + subway.w, bottom: subway.y + subway.h };
    L.sy = subway.y + Math.round(SUBWAY.floor * ss);                                   // platform feet line
    L.subCamY = Math.min(Math.max(L.subBox.top, L.sy - vh * 0.8), L.subBox.bottom - vh);   // clamped to the subway's box
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
    L.lobbyBox = { left: cinema.x, top: cinema.y, right: cinema.x + cinema.w, bottom: cinema.y + cinema.h };
    // stairwell fillers: soft gradients in the two empty regions the stair camera can reveal
    setBox($(".fill-above-subway"), L.subBox.left, L.subBox.top - vh, subway.w, vh);
    setBox($(".fill-below-lobby"), L.lobbyBox.left, L.lobbyBox.bottom, cinema.w, vh);
    const row = L.ty - L.gy;
    // the auditorium is only reached through a cut, so leave a screen of space around it
    const fs = Math.max(vw / C.w, Math.min(vh / C.h, vw / 760));   // phones: fit the screen, not the room
    const fw = Math.round(C.w * fs), fh = Math.round(C.h * fs);
    const front = { x: cinema.x + cinema.w + vw, y: cinema.y, w: Math.max(fw, vw), h: Math.max(fh, vh), s: fs };
    front.ox = Math.round((front.w - fw) / 2); front.oy = Math.round((front.h - fh) / 2);
    // 5. exhibition + 6. rooftop: one strip of art; the rooftop is its right end
    const G = GALLERY;
    // shown at the other scenes' scale so he's the same size relative to the room; the art sits at the
    // bottom of the screen and its top edge (ceiling, night sky) is stretched up to fill the rest
    const gs = Math.max(vw / 1672, vh / G.h) / G.artScale;
    const artH = Math.round(G.h * gs);
    const exhibition = { x: front.x + front.w + vw, y: row, w: Math.round(G.w * gs), h: Math.max(vh, artH), s: gs };
    exhibition.oy = exhibition.h - artH;                                   // art top, inside the section
    L.gty = exhibition.y + exhibition.oy + Math.round(G.floor * gs);
    const rooftop = { x: exhibition.x + Math.round(G.roof.x * gs), y: exhibition.y, w: Math.round((G.w - G.roof.x) * gs), h: exhibition.h };
    const gimg = $("#exhibition .bg-img");
    gimg.style.top = exhibition.oy + "px"; gimg.style.height = artH + "px";
    setBox($(".gal-top"), 0, 0, exhibition.w, exhibition.oy + 2);
    const frames = G.frames.map(([x, y, w, h]) => ({ x: Math.round(x * gs), y: exhibition.oy + Math.round(y * gs), w: Math.round(w * gs), h: Math.round(h * gs) }));

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
    setBox($(".gallery-title"), Math.round(560 * gs), exhibition.oy + Math.round(300 * gs));
    $$(".photo").forEach((el, i) => {
      const f = frames[i]; el.hidden = !f;
      if (!f) return;
      setBox(el, f.x, f.y, f.w, f.h);
      const [px, py, pw, phh] = G.plaques[i];
      setBox($(".plaque", el), Math.round(px * gs) - f.x, exhibition.oy + Math.round(py * gs) - f.y, Math.round(pw * gs), Math.round(phh * gs));
    });
    // string lights over the bench twinkle
    const bulbs = $(".bulbs");
    if (!bulbs.children.length) bulbs.innerHTML = G.bulbs.map((_, i) => `<i style="animation-delay:${(i * 0.37) % 2.2}s"></i>`).join("");
    [...bulbs.children].forEach((b, i) => setBox(b, Math.round((G.bulbs[i][0] - G.roof.x) * gs), exhibition.oy + Math.round(G.bulbs[i][1] * gs)));
    // end credits in the dawn sky, kept inside the final view
    const endX = Math.min(Math.max(G.roof.seat * gs - vw * 0.5, 0), exhibition.w - vw);   // final view: the bench
    const [kx, ky, kw] = G.roof.sky;   // credits float in the dawn sky
    const cl = Math.max(kx * gs, endX + 16);
    setBox($(".credits"), Math.round(cl - G.roof.x * gs), Math.round(Math.max(76, exhibition.oy - 40, ky * gs + exhibition.oy - 200)), Math.round(Math.min(kw * gs, endX + vw - cl - 16)));

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
    // Stair camera. Each image clamps the view to its own bounding box:
    //  - subway: follow him, but the view's top never rises above the (cropped) subway top
    //  - lobby:  frame the lobby floor; the view's bottom never drops below the lobby bottom,
    //            and its left edge stays inside the lobby
    // Around the seam the two targets are blended by his horizontal progress (smoothstep), so the
    // camera tilts up as he climbs and back down as he descends, with no snap either way.
    const SB = L.subBox, LB = L.lobbyBox, seam = LB.left;
    const zoneL = Math.max(s0[0], seam - vw * STAIR_ZONE), zoneR = Math.min(l1[0], seam + vw * STAIR_ZONE);
    const zoneK = (x) => { const u = Math.min(1, Math.max(0, (x - zoneL) / (zoneR - zoneL))); return u * u * (3 - 2 * u); };
    const subY = (p) => Math.min(Math.max(p.y - vh * 0.8, SB.top), SB.bottom - vh);
    const lobbyY = Math.min(Math.max(ty - vh * 0.8, LB.top), LB.bottom - vh);
    const stairCam = (t, p) => {
      const k = zoneK(p.x), x = p.x - vw * 0.4;
      return { x: lerp(x, Math.max(x, LB.left), k), y: lerp(subY(p), lobbyY, k) };
    };
    add({ loc: "subway", loc2: "cinema", pose: "walk", a: s0, b: l0, len: (l0[0] - s0[0]) * 1.2, zoneK, cam: stairCam });
    add({ loc: "cinema", pose: "walk", a: l0, b: l1, len: (l1[0] - l0[0]) * 1.2, zoneK, cam: stairCam });
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
    const fx = (x) => front.x + front.ox + x * fs, fy = front.y + front.oy + F.floor * fs;
    // he stops beside the stage, left of the screen and controls (on phones: the left edge of the view)
    const leftArt = (frontCam.x - front.x - front.ox) / fs;
    const enter = [fx(F.door), fy], spot = [fx(Math.max(F.stand, leftArt + 70)), fy], exit = [fx(F.exit), fy];
    add({ loc: "cinema", pose: "walk", a: door, b: enter, len: 260, ease: "cut",
      cut: tri, cam: (t) => (t < 0.5 ? doorCam : frontCam) });
    add({ loc: "cinema", pose: "walk", a: enter, b: spot, len: Math.max(160, spot[0] - enter[0]),
      bubble: ["Housefull!", 0.2, 0.9], cam: () => frontCam });
    // turns to the screen and watches (profile, looking up)
    add({ id: "sit", loc: "cinema", pose: "watch", face: 1, a: spot, b: spot, len: vh * 1.1, cam: () => frontCam });
    // across the front of the stage and out the right door, then a velvet cut to the gallery
    add({ loc: "cinema", pose: "walk", a: spot, b: exit, len: exit[0] - spot[0], cam: () => frontCam });
    // --- gallery: in through the double doors, slowly past the photos, out onto the roof ---
    const G = GALLERY, gs = exhibition.s, gty = L.gty, gx = (x) => exhibition.x + x * gs;
    const gIn = [gx(G.enter), gty], gOut = [gx(G.exit), gty];
    const gCam = (x) => ({ x: Math.min(Math.max(x - vw * 0.4, exhibition.x), exhibition.x + exhibition.w - vw), y: exhibition.y });
    add({ loc: "cinema", loc2: "exhibition", pose: "walk", a: exit, b: gIn, len: 260, ease: "cut",
      cut: tri, cam: (t) => (t < 0.5 ? frontCam : gCam(gIn[0])) });
    add({ id: "gallery", loc: "exhibition", pose: "walk", a: gIn, b: gOut, len: (gOut[0] - gIn[0]) / 0.7, cam: (t, p) => gCam(p.x) });
    // through the door and out into the dawn
    const endCam = { x: exhibition.x + Math.min(Math.max(G.roof.seat * gs - vw * 0.5, 0), exhibition.w - vw), y: exhibition.y };
    const out = [gx(G.roof.out), exhibition.y + exhibition.oy + G.roof.floor * gs];
    const seat = [gx(G.roof.seat), exhibition.y + exhibition.oy + G.roof.seatFloor * gs];
    add({ loc: "exhibition", loc2: "rooftop", pose: "walk", a: gOut, b: out, len: 260, ease: "cut",
      cut: (t) => tri(t) * 0.85, cam: (t) => gCam(t < 0.5 ? gOut[0] : out[0]) });
    // along the roof to the bench, the camera settling on the final view
    add({ loc: "rooftop", pose: "walk", a: out, b: seat, len: Math.max(200, (seat[0] - out[0]) * 0.8), cam: (t, p) => ({ x: Math.min(gCam(p.x).x, endCam.x), y: exhibition.y }) });
    add({ loc: "rooftop", pose: "sit", prop: "chai", a: seat, b: seat, len: 260, bubble: ["Chai break?", 0.3, 1.01],
      cam: () => endCam });

    const find = (id) => segs.find((s) => s.id === id);
    stops = {
      street: 0,
      drain: find("crouch").start - 60,
      subway: find("subwalk").start + 2,
      cinema: find("sit").start + 20,
      exhibition: find("gallery").start + Math.max(0, GALLERY.frames[0][0] * exhibition.s - vw * 0.2) / 0.7,
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
  let lastCut = -1, lastVig = -1;
  const vigEl = $(".stair-vignette");
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
    const scale = (cutSide ? s.scale2 : s.scale) || 1;   // cuts can change his scale on the far side
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
    // stairwell vignette: peaks mid-zone, gone outside it
    const vk = s.zoneK ? s.zoneK(p.x) : 0, vig = vk > 0 && vk < 1 ? STAIR_VIGNETTE * Math.min(1, 4 * vk * (1 - vk) * 1.4) : 0;
    if (Math.abs(vig - lastVig) > 0.01) { lastVig = vig; vigEl.style.opacity = vig.toFixed(2); }

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

  // the gallery's top row, stretched upward by CSS to fill the space above the art
  function galleryTop() {
    const img = $("#exhibition .bg-img"), c = $(".gal-top");
    const draw = () => { c.width = img.naturalWidth; c.height = 1; c.getContext("2d").drawImage(img, 0, 0, img.naturalWidth, 1, 0, 0, img.naturalWidth, 1); };
    if (img.complete && img.naturalWidth) draw(); else img.addEventListener("load", draw, { once: true });
  }

  // Stairwell fillers. Each continues its image's edge row outward (a 1px slice stretched by CSS, so
  // every column keeps its own colour), then a shade fades it through the edge's average colour to
  // FILL_DARK, so the gap reads as the wall disappearing into shadow. The average is sampled once from
  // a thin strip; if sampling fails (e.g. CORS) the fixed fallback colours are used.
  function stairFillers() {
    const avg = (img, sy) => {
      const w = Math.min(img.naturalWidth, 2000), c = document.createElement("canvas"); c.width = w; c.height = 4;
      const x = c.getContext("2d"); x.drawImage(img, img.naturalWidth - w, sy, w, 4, 0, 0, w, 4);
      const d = x.getImageData(0, 0, w, 4).data; let r = 0, g = 0, b = 0;
      for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
      const n = d.length / 4; return `${(r / n) | 0}, ${(g / n) | 0}, ${(b / n) | 0}`;
    };
    const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ");
    const setup = (el, img, fallback, row, dir) => {
      const edge = $(".edge", el), shade = $(".shade", el);
      const shadeWith = (rgb) => (shade.style.background =
        `linear-gradient(${dir}, rgba(${rgb}, 0) 0, rgba(${rgb}, 0.85) 22%, ${FILL_DARK} 60%)`);
      shadeWith(hexRgb(fallback));
      const go = () => {
        const y = row(img);
        edge.width = img.naturalWidth; edge.height = 1;
        edge.getContext("2d").drawImage(img, 0, y, img.naturalWidth, 1, 0, 0, img.naturalWidth, 1);
        try { shadeWith(avg(img, Math.min(y, img.naturalHeight - 4))); } catch (e) { shadeWith(hexRgb(fallback)); }
      };
      if (img.complete && img.naturalWidth) go(); else img.addEventListener("load", go, { once: true });
    };
    setup($(".fill-above-subway"), $("#subway .bg-img"), FALLBACK_SUBWAY_TOP, () => SUBWAY_TOP_CROP, "to top");
    setup($(".fill-below-lobby"), $("#cinema .bg-img"), FALLBACK_LOBBY_BOTTOM, (img) => img.naturalHeight - 1, "to bottom");
  }

  /* ================= BOOT ================= */
  fillContent();
  makeRain();
  galleryTop();
  stairFillers();
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
