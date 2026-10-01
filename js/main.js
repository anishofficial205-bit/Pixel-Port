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

  /* ---- stairwell: the stairs up from the platform and the cinema lobby (assets/scenes/stairwell.webp,
     the subway's last frame; tools/build_subway.py). Art px. ---- */
  const STAIRWELL = {
    w: 1672, h: 941,
    approach: 40,                      // x where he leaves the platform's feet line and heads for the first step
    stairBottom: [200, 592],           // the middle of the steps, bottom and top
    stairTop: [528, 318],
    lobbyStart: [575, 316],            // short eased blend from the top step onto the lobby floor
    lobby: 316,                        // feet on the lobby's chequered floor
    scale: 0.86,                       // his size up there (the lobby is drawn smaller than the platform)
    ticket: 668,                       // where he stops, just past the ticket booth, and takes the cinema in
    door: [1462, 1622],                // red double doors: walking into them cuts to the theater
    posters: { poster1: [700, 118, 100, 153], poster2: [836, 118, 100, 153] },   // blank posters: x, y, w, h
    rails: [292, 219, 1380, 359],      // assets/subway/rails.png: the railings drawn in front of him
  };

  /* Climbing the stairs is driven by scroll, one stride at a time, so his feet land on the steps:
     reach (front foot in the air) -> plant (it lands a stride up) -> rise (he pushes up on it, the back
     foot leaves its step) -> push (he's up; the back leg trails). His height holds through reach and
     plant and comes up through rise and push; he moves forward mostly as he rises.
     Frames are cells of assets/character/stairs.webp; `last` replaces the final stride's plant and push
     (the last step, then the stride onto the lobby floor). */
  const CLIMB = {
    strides: 7, px: 110,                         // strides in the flight, scroll px per stride
    first: [1, 3, 2, 5], even: [7, 6, 4, 5], odd: [11, 10, 8, 9], last: [null, 12, null, 13],
    forward: 0.3,                                // share of a stride's forward travel made during reach + plant
    rise: [[0.375, 0], [0.625, 0.55], [0.875, 1]],   // [phase, share of the stride's rise]
  };
  // Character sheet per location (js/sprite.js SETS); locations without one use the pixel sheet
  const SPRITE_SET = { street: "street", drain: "drain", subway: "street" };
  // Into the manhole: where he stops (art px left of its centre) and how high he steps off (x his height)
  const DROP = { stand: 225, arc: 0.14 };
  // Hero focus: STREET_DIM black over the street except soft windows at each billboard and a spotlight
  // that follows the character. The windows are mask holes, so nothing is drawn twice.
  const STREET_DIM = 0.3;               // strength of the shade
  const STREET_FOCUS_PAD = 1.35;        // billboard windows, relative to the board's size (takes in frames + lamps)

  // About me, pinned beside the drain shaft for the whole fall: portrait left, text right
  const ABOUT_SHAFT = [597, 1050];      // shaft brick walls in drain art px (the panels stay outside them)
  const ABOUT_MIN_SIDE = 220;           // narrower than this beside the shaft -> portrait + text stacked over it
  const ABOUT_PORTRAIT_W = 210;         // max portrait width (css px)
  const ABOUT_TEXT_W = 380;             // max text box width (css px)
  const ABOUT_SCROLL = 4.5;             // viewport heights of scroll for the fall (reading time)
  const ABOUT_FRAME_STEP = 0.3;         // viewport heights of scroll per portrait frame
  const ABOUT_TEXT_START = 0.03;        // after the panel appears, this much of the fall before words light up
  const ABOUT_HOLD = 0.03;              // fully lit for this much of the fall before fading
  const ABOUT_FADE = 0.06;              // fade-out length; it ends exactly as his feet reach the subway grate

  const RIM = {
    street: "#FF3D9A", drain: "#6BE3A8", subway: "#E8FBFF",
    cinema: "#D9A441", exhibition: "#FFE3B0", rooftop: "#FFB26B",
  };

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  /* ================= CONTENT ================= */
  // the subway's boards are wide: a project whose cover is tall shows its wide ad picture there instead
  const boardImg = (p) => (p.shape === "tall" && p.ads && p.ads.wide && p.ads.wide[0]) || p.cover;
  function fillContent() {
    $("#site-name").textContent = `${S.name[0]}${S.name.slice(1).toLowerCase()} Shah, ${S.role}`;
    $("#site-intro").textContent = S.intro;
    $("#mail-link").href = "mailto:" + S.email;
    $("#mail-link").textContent = S.email;
    $("#copyright").textContent = `© ${S.year} ${S.name} · NEON BHARAT GAMES`;

    $("#billboards").innerHTML = S.featured().map((p, i) => `
      <a class="billboard" id="project-${p.id}" data-i="${i}" href="project.html?p=${p.id}">
        <span class="bb-window"><span class="ad-bg" style="background-image:url(${SITE.img(p.cover, 32)})"></span><img class="work-media" src="${SITE.img(boardImg(p), 1024)}" alt="${p.title}: ${p.blurb}" decoding="async" /></span>
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

    const A = S.about;
    $("#about-title").textContent = A.title;
    $("#about-tags").innerHTML = A.tags.map((t) => `<li>${t}</li>`).join("");
    const words = (str, cls) => str.split(/\s+/).map((w) => `<span class="w${cls ? " " + cls : ""}">${w}</span>`).join(" ");
    $("#about-copy").innerHTML = A.text.map((t) => `<p>${t.label ? words(t.label, "lbl") + " " : ""}${words(t.text)}</p>`).join("");
    aboutWords = $$("#about-copy .w");
    const P = A.portrait, face = $(".about-portrait");
    face.style.backgroundImage = `url(${P.src})`;
    face.style.setProperty("--ar", P.w / P.h);
    face.style.backgroundSize = `${P.frames * 100}% 100%`;

    renderPlain();
    adBoards();

    $("#socials").innerHTML = S.socials.map((s) => `
      <li><a class="social" href="${s.url}" aria-label="${s.label}"><span class="s-icon">${s.short}</span><span>${s.label}</span></a></li>`).join("");
  }

  /* ================= STREET ART ================= */
  // Measured on assets/scenes/street.webp (1672 x 941 art px), built by tools/build_street.py
  const STREET = {
    w: 1672, h: 941,
    road: 870,           // feet line on the wet road, in front of the striped kerbs
    tall: 300,           // how tall he stands on that line, in proportion to the buildings and the stall
    start: 200,          // where he waits during the intro, outside the general store
    quads: {             // blank billboards: TL, TR, BR, BL
      left: [[254, 42], [494, 134], [494, 247], [253, 168]],      // rooftop hoarding
      led: [[1316, 189], [1434, 133], [1433, 428], [1315, 452]],  // tall board on the right
      mid: [[777, 405], [970, 405], [970, 450], [777, 450]],      // banner on the metro overpass
    },
    leaves: [1398, 360, 44, 74],   // tree leaves in front of the tall board: x, y, w, h
    steam: [1464, 566, 52, 58],    // above the chai kettle
  };

  // assets/scenes/drain.webp: three painted frames stitched by tools/build_drain.py (which prints these).
  // It hangs straight under the street: the street's road runs down to the drain's pavement.
  const DRAIN = {
    w: 1672, h: 2095,
    top: 4,        // rows tucked under the street's bottom edge
    hole: 835,     // centre of the open manhole and of the clear drop down the shaft
    stand: 52,     // the pavement beside the manhole: his feet line before he hops in
    surface: 107,  // where the pavement and road bed end and the soil begins
    grate: 2023,   // top of the grate into the subway
  };

  // assets/scenes/subway.webp: landing, billboard wall x2; built by tools/build_subway.py (which prints the boards)
  const SUBWAY = {
    w: 5016, h: 941,
    cut: 125,            // top rows (its own grate) hidden under the drain's grate
    floor: 668,          // his feet on the platform
    sign: [[1032, 138], [1218, 138], [1218, 200], [1032, 200]],   // station sign, hung in the dark of the ceiling
    // blank billboards on the tiled wall: x, y, w, h
    boards: [[1872, 311, 492, 205], [2655, 311, 493, 205], [3544, 311, 492, 205], [4327, 311, 493, 205]],
  };

  // assets/scenes/cinema-front.webp (1672 x 941): the auditorium's front view
  const CINEMA = {
    w: 1672, h: 941,
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

  let aboutWords = [], aboutLit = 0, aboutFrame = -1;

  /* ================= STREET BILLBOARDS: rotating project ads =================
     Every blank board on the street shows project images in turn (the boards are staggered so they never
     change together), with a small caption; the board links to whatever it's showing. Images come from
     each project's `ads` list if it has one, else its cover (use GIF ids there for animated ads). */
  const ADS = { every: 4200, stagger: 1400 };   // ms per ad, delay between boards
  function adBoards() {
    const list = S.featured().length ? S.featured() : S.projects;
    $$(".bb-ad").forEach((board) => {
      const tall = board.dataset.quad === "led", strip = board.dataset.quad === "mid";
      const shape = tall ? "tall" : "wide";
      const pics = list.flatMap((p) => ((p.ads && p.ads[shape]) || [p.cover]).map((img) => ({ p, img })));
      // every ad fits whole (no cropping) over a pixelated, dimmed copy of the project's cover;
      // the tall board is laid out like a poster (title, picture, category) and the thin overpass
      // banner as a strip (picture, then title and category beside it)
      board.innerHTML = pics.map(({ p, img }, i) => {
        const bg = `<span class="ad-bg" style="background-image:url(${S.img(p.cover, 32)})"></span>`;
        const pic = `<img class="work-media ad-img" src="${S.img(img, tall ? 768 : 1024)}" alt="" decoding="async" />`;
        return tall
          ? `<span class="ad ad-poster" data-i="${i}">${bg}<span class="ad-title">${p.title}</span><span class="ad-frame">${pic}</span><span class="ad-cat">${p.meta.category || ""}</span></span>`
          : strip
          ? `<span class="ad ad-strip" data-i="${i}">${bg}<span class="ad-frame">${pic}</span><span class="ad-text"><span class="ad-title">${p.title}</span><span class="ad-cat">${p.meta.category || ""}</span></span></span>`
          : `<span class="ad" data-i="${i}">${bg}${pic}<span class="ad-cap"><b>${p.title}</b> ${p.meta.category || ""}</span></span>`;
      }).join("");
      let i = (+board.dataset.start || 0) % pics.length;
      const show = (first) => {
        const ads = board.querySelectorAll(".ad");
        ads.forEach((a, k) => a.classList.toggle("on", k === i));
        if (!first) { ads[i].classList.add("enter"); setTimeout(() => ads[i].classList.remove("enter"), 700); }
        board.href = `project.html?p=${pics[i].p.id}`;
        board.setAttribute("aria-label", `Featured project: ${pics[i].p.title}`);
      };
      show(true);
      if (reduceMotion || pics.length < 2) return;
      setTimeout(() => setInterval(() => { i = (i + 1) % pics.length; show(false); }, ADS.every),
        (+board.dataset.start || 0) * ADS.stagger);
    });
  }

  /* ================= SKIP THE RIDE =================
     The same content as a clean, conventional page. Section ids are "plain-" + the ride's stop names,
     so the navbar works the same in both modes. */
  function renderPlain() {
    const A = S.about, first = S.name[0] + S.name.slice(1).toLowerCase();
    const head = (n, label, hindi, extra = "") => `
      <header class="plain-head"><div><p class="plain-kicker">${n} · <span class="hi">${hindi}</span></p><h2>${label}</h2></div>${extra}</header>`;
    const card = (p) => `
      <li class="project-card" id="card-${p.id}" style="--band:${p.band}">
        <a href="project.html?p=${p.id}">
          <span class="card-frame"><img class="work-media" src="${S.img(p.cover, 1024)}" alt="${p.title}: ${p.blurb}" loading="lazy" decoding="async" /></span>
          <span class="card-body">
            <span class="card-meta"><span class="bb-line">${p.line}</span>${p.meta.category || ""} · ${p.meta.year || ""}</span>
            <span class="card-title">${p.title}</span>
            <span class="card-blurb">${p.blurb}</span>
          </span>
        </a>
      </li>`;
    $("#plain").innerHTML = `
      <section class="plain-hero" id="plain-street" data-loc="street" aria-label="Home">
        <div class="plain-hero-bg" aria-hidden="true">
          <div class="plain-art">
            <img src="assets/scenes/street.webp" alt="" />
            <a class="bb-map bb-ad bb-left" data-quad="left" data-start="0" tabindex="-1"></a>
            <a class="bb-map bb-ad bb-led" data-quad="led" data-start="1" tabindex="-1"></a>
            <a class="bb-map bb-ad bb-mid" data-quad="mid" data-start="2" tabindex="-1"></a>
            <img class="bb-leaves" src="assets/street/leaves.png" alt="" style="left:${STREET.leaves[0]}px;top:${STREET.leaves[1]}px;width:${STREET.leaves[2]}px;height:${STREET.leaves[3]}px" />
          </div>
        </div>
        <div class="plain-wrap plain-hero-in">
          <p class="plain-kicker">Hello! · <span class="hi">नमस्ते</span></p>
          <h1 class="game-title">${S.name} SHAH</h1>
          <p class="plain-role">${S.role} · ${S.location}</p>
          <p class="plain-intro">${S.intro}</p>
          <div class="plain-cta"><a class="pbtn" href="#plain-subway" data-stop="subway">See the work</a><button class="pbtn ghost take-ride" type="button">Take the ride &gt;</button></div>
        </div>
      </section>
      <section class="plain-sec" id="plain-drain" data-loc="drain" aria-labelledby="plain-about-h">
        <div class="plain-wrap">
          ${head("01", `<span id="plain-about-h">${A.title}</span>`, "मेरे बारे में")}
          <div class="plain-about">
            <figure class="plain-portrait"><img src="assets/about/portrait.gif" alt="Portrait of ${first}" loading="lazy" /></figure>
            <div>
              <ul class="about-tags">${A.tags.map((t) => `<li>${t}</li>`).join("")}</ul>
              ${A.text.map((t) => `<p>${t.label ? `<b>${t.label}</b> ` : ""}${t.text}</p>`).join("")}
            </div>
          </div>
        </div>
      </section>
      <section class="plain-sec" id="plain-subway" data-loc="subway" aria-label="Projects">
        <div class="plain-wrap">
          ${head("02", "Projects", "प्रोजेक्ट्स", `<a class="plain-link" href="projects.html">View all projects &gt;</a>`)}
          <ul class="project-grid">${S.featured().map(card).join("")}</ul>
        </div>
      </section>
      <section class="plain-sec" id="plain-cinema" data-loc="cinema" aria-label="Reels">
        <div class="plain-wrap">
          ${head("03", "Reels", "रील्स")}
          <div class="reel-grid">${S.reels.map((r) => `
            <figure class="reel-card">
              <span class="reel-screen">${r.src
                ? `<video class="work-media" src="${r.src}" poster="${r.poster}" controls muted playsinline preload="none"></video>`
                : `<img class="work-media" src="${r.poster}" alt="${r.title} poster" loading="lazy" />`}</span>
              <figcaption><b>${r.title}</b><span>${r.length}${r.src ? "" : ' <span class="reel-soon">· coming soon</span>'}</span></figcaption>
            </figure>`).join("")}
          </div>
        </div>
      </section>
      <section class="plain-sec" id="plain-exhibition" data-loc="exhibition" aria-label="Photos">
        <div class="plain-wrap">
          ${head("04", "Photos", "प्रदर्शनी")}
          <div class="plain-photos">${S.photos.map((p, i) => `
            <figure class="plain-photo">
              <button class="photo-frame" type="button" data-i="${i}" aria-label="Open photo: ${p.title}, ${p.place}"><img class="work-media" src="${p.src}" alt="${p.title}, ${p.place}" loading="lazy" /></button>
              <figcaption><b>${p.title}</b><span>${p.place} · ${p.year}</span></figcaption>
            </figure>`).join("")}
          </div>
        </div>
      </section>
      <section class="plain-sec plain-contact" id="plain-rooftop" data-loc="rooftop" aria-label="Contact">
        <div class="plain-wrap">
          ${head("05", "Let's talk", "संपर्क")}
          <p class="credits-line">Got a project, a job, or just want to share chai? Say hi.</p>
          <div class="credits-actions"><a class="pbtn" href="mailto:${S.email}">${S.email}</a></div>
          <ul class="socials">${S.socials.map((x) => `<li><a class="social" href="${x.url}" aria-label="${x.label}"><span class="s-icon">${x.short}</span><span>${x.label}</span></a></li>`).join("")}</ul>
          <p class="copyright">© ${S.year} ${S.name} SHAH · NEON BHARAT GAMES</p>
        </div>
      </section>`;
  }

  // Plain hero: the street art at its own pixel size, scaled to cover the hero, so its billboards can
  // be filled with the same perspective mapping the ride uses.
  function fitPlainArt() {
    const hero = $(".plain-hero"), art = $(".plain-art");
    if (!hero || !art) return;
    $$(".plain-art [data-quad]").forEach((el) => mapToQuad(el, STREET.quads[el.dataset.quad], 1));
    const W = hero.clientWidth, H = hero.clientHeight, k = Math.max(W / STREET.w, H / STREET.h);
    art.style.transform = `translate(${(W - STREET.w * k) / 2}px, ${(H - STREET.h * k) * 0.3}px) scale(${k})`;
  }

  // In Skip-the-ride mode the navbar follows the section in view, and the progress line follows the page
  function watchPlain() {
    fitPlainArt();
    addEventListener("resize", fitPlainArt);
    const secs = $$("#plain [data-loc]");
    const io = new IntersectionObserver((entries) => {
      if (body.classList.contains("ride")) return;
      const best = secs.map((el) => [el, el.getBoundingClientRect()])
        .filter(([, r]) => r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.3).pop();
      if (!best) return;
      const loc = best[0].dataset.loc;
      if (loc !== lastLoc) { lastLoc = loc; body.dataset.location = loc; markSection(loc); }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    secs.forEach((el) => io.observe(el));
    addEventListener("scroll", () => {
      if (body.classList.contains("ride")) return;
      const max = document.documentElement.scrollHeight - innerHeight;
      body.style.setProperty("--route", max > 0 ? (scrollY / max).toFixed(4) : 0);
    }, { passive: true });
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
    fitPlainArt();
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
    // on the street he is sized to the art, not the screen (elsewhere he is 20% of the screen height)
    L.hs = (STREET.tall * ss) / (Sprite.STAND * L.cs);
    L.cq = Math.min(3, Math.ceil(L.hs - 0.05));             // extra canvas resolution so he stays sharp scaled up
    const mh = Math.round(DRAIN.hole * ss);                 // manhole centre (the drain sits flush under the street)
    L.sgy = Math.round(STREET.road * ss);                   // where his feet meet the road
    const camEnd = { x: Math.min(Math.max(0, mh - vw * 0.4), street.w - vw), y: street.h - vh };
    const nameX = (STREET.quads.left[0][0] + STREET.quads.left[1][0]) / 2 * ss;   // centre of the name billboard
    const camStart = { x: Math.min(Math.max(0, nameX - vw / 2), camEnd.x), y: 0 };
    L.x0 = Math.max(STREET.start * ss, camStart.x + vw * 0.14);                    // he starts in the opening frame
    // 2. drain: the cross-section hangs under the street; its pavement and open manhole come first
    const drain = {
      x: 0, y: Math.round(street.h - DRAIN.top * ss),
      w: Math.round(DRAIN.w * ss), h: Math.round(DRAIN.h * ss),
    };
    L.my = drain.y + Math.round(DRAIN.stand * ss);          // his feet line on that pavement

    // About panel: during the fall the camera sits at camEnd.x, so the room beside the shaft is known.
    // Screen coords: portrait in the gap left of the shaft, text in the gap right of it.
    {
      const pin = $(".about-pin");
      if (body.classList.contains("ride")) { if (pin.parentElement !== $("main")) $("main").append(pin); }
      else if (pin.parentElement !== $("#drain")) $("#drain").append(pin);
      const off = drain.x - camEnd.x, pad = 20, top = 76;                          // drain px -> screen px
      const wallL = off + ABOUT_SHAFT[0] * ss, wallR = off + ABOUT_SHAFT[1] * ss;
      const left = [Math.max(0, off) + pad, wallL - pad], right = [wallR + pad, Math.min(vw, off + drain.w) - pad];
      const stacked = Math.min(left[1] - left[0], right[1] - right[0]) < ABOUT_MIN_SIDE;
      body.classList.toggle("about-stack", stacked);
      const face = $(".about-portrait"), copy = $(".about-text");
      if (stacked) {   // phones: portrait top-right beside him, text in the lower half below him
        const fw = Math.round(Math.min(vw * 0.3, 140)), ty = Math.round(vh * 0.52);
        setBox(face, vw - pad - fw, top, fw, 0);
        setBox(copy, pad, ty, vw - 2 * pad, vh - ty - pad - (vw <= 700 ? 60 : 0));   // clear of the bottom nav
      } else {
        // both centred on one line (the middle of the screen below the HUD), each in the middle of its side
        const fw = Math.min(left[1] - left[0], ABOUT_PORTRAIT_W), cw = Math.min(right[1] - right[0], ABOUT_TEXT_W), cy = Math.round((top - pad + vh) / 2);
        setBox(face, Math.round((left[0] + left[1]) / 2), cy, Math.round(fw), 0);
        setBox(copy, Math.round((right[0] + right[1]) / 2), cy, Math.round(cw), vh - top - pad);
      }
    }

    // 3. subway: flush under the drain, whose grate covers the subway's own
    const subway = {
      x: drain.x, y: Math.round(drain.y + drain.h - SUBWAY.cut * ss),
      w: Math.round(SUBWAY.w * ss), h: Math.round(SUBWAY.h * ss),
    };
    L.sy = subway.y + Math.round(SUBWAY.floor * ss);                                   // platform feet line
    L.subCamY = Math.min(Math.max(subway.y, L.sy - vh * 0.8), subway.y + subway.h - vh);
    const boards = S.featured().slice(0, SUBWAY.boards.length).map((p, i) => {
      const [x, y, w, h] = SUBWAY.boards[i];
      return { x: Math.round(x * ss), y: Math.round(y * ss), iw: Math.round(w * ss), ih: Math.round(h * ss) };
    });
    // 4. stairwell: the subway's last frame (the stairs and the cinema lobby above the platform)
    const SA = STAIRWELL;
    const stairwell = { x: subway.x + subway.w, y: subway.y, w: Math.round(SA.w * ss), h: Math.round(SA.h * ss), s: ss };
    {
      const [x, y, w, h] = SA.rails;
      setBox($(".stair-rails"), stairwell.x + Math.round(x * ss), stairwell.y + Math.round(y * ss), Math.round(w * ss), Math.round(h * ss));
    }
    stairwell.px = (x, y) => [stairwell.x + x * ss, stairwell.y + y * ss];
    L.ty = stairwell.px(0, SA.lobby)[1];                   // lobby floor; later scenes share it
    const row = L.ty - L.gy;
    const C = CINEMA;
    // the auditorium is only reached through a cut, so leave a screen of space around it
    const fs = Math.max(vw / C.w, Math.min(vh / C.h, vw / 760));   // phones: fit the screen, not the room
    const fw = Math.round(C.w * fs), fh = Math.round(C.h * fs);
    const front = { x: stairwell.x + stairwell.w + vw, y: stairwell.y, w: Math.max(fw, vw), h: Math.max(fh, vh), s: fs };
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

    Object.assign(L, { street, mh, camStart, camEnd, drain, subway, stairwell, front, exhibition, rooftop, boards, frames });

    // place scenes
    for (const [id, s] of Object.entries({ street, drain, subway, stairwell, "cinema-front": front, exhibition, rooftop })) {
      setBox($("#" + id), s.x, s.y, s.w, s.h);
    }
    // place content inside scenes
    const art = (el, [x, y, w, h]) => setBox(el, Math.round(x * ss), Math.round(y * ss), Math.round(w * ss), Math.round(h * ss));
    art($("#street .bb-leaves"), STREET.leaves);
    art($(".steam"), STREET.steam);
    // focus windows: one soft ellipse per billboard, plus the character's (its position is a CSS var)
    {
      const dim = $(".street-dim"), holes = Object.values(STREET.quads).map((q) => {
        const xs = q.map((p) => p[0] * ss), ys = q.map((p) => p[1] * ss);
        const w = (Math.max(...xs) - Math.min(...xs)) * STREET_FOCUS_PAD, h = (Math.max(...ys) - Math.min(...ys)) * STREET_FOCUS_PAD;
        const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2 - h * 0.06;
        return `radial-gradient(${Math.round(w / 2 + 30)}px ${Math.round(h / 2 + 30)}px at ${Math.round(cx)}px ${Math.round(cy)}px, transparent 72%, #000 100%)`;
      });
      const cw = Math.round(Sprite.W * L.cs * L.hs * 0.75), ch = Math.round(Sprite.H * L.cs * L.hs * 0.9);
      holes.push(`radial-gradient(${cw}px ${ch}px at var(--hx, -999px) var(--hy, -999px), transparent 55%, #000 100%)`);
      holes.push("linear-gradient(#000 80%, transparent)");   // the shade lifts toward the pavement below
      dim.style.setProperty("--holes", holes.join(","));
      dim.style.background = `rgba(0, 0, 0, ${STREET_DIM})`;
    }
    $$("#street .bb-map").forEach((el) => mapToQuad(el, STREET.quads[el.dataset.quad], ss));
    mapToQuad($(".station-board"), SUBWAY.sign, ss);
    // "View all projects" plate hangs under the station sign
    {
      const [[x0], [x1], [, y1]] = SUBWAY.sign, y = y1 + 9;
      mapToQuad($(".all-projects-sign"), [[x0, y], [x1, y], [x1, y + 26], [x0, y + 26]], ss);
    }
    $$(".billboard").forEach((el, i) => {
      const b = boards[i];
      el.hidden = !b;
      if (b) setBox(el, b.x, b.y, b.iw, b.ih);
    });
    // reel posters on the lobby's blank boards
    $$("#stairwell [data-quad]").forEach((el) => {
      const [x, y, w, h] = SA.posters[el.dataset.quad];
      mapToQuad(el, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], ss);
    });
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

    sprite.width = Sprite.W * L.ck * L.cq; sprite.height = Sprite.H * L.ck * L.cq;
    charEl.style.setProperty("--w", Math.round(Sprite.W * L.cs) + "px");
    charEl.style.setProperty("--h", Math.round(Sprite.H * L.cs) + "px");
    lastKey = "";

    buildPath();
  }

  /* ================= PATH ================= */
  function buildPath() {
    const { vw, vh, gy, sgy, my, street, mh, camStart, camEnd, drain, subway, stairwell, front, exhibition, rooftop, subCamY } = L;
    const sy = L.sy, ty = L.ty, ss = street.s;
    const follow = (x, y) => ({ x: x - vw * 0.4, y: y - gy });
    segs = [];
    const add = (s) => { s.start = total; total += Math.max(1, Math.round(s.len)); s.len = Math.max(1, Math.round(s.len)); segs.push(s); };
    total = 0;

    const x0 = Math.round(L.x0), hs = L.hs, stand = mh - DROP.stand * ss;
    const lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t);
    // narrow screens: while he waits beside the manhole the camera sits a little left, so he isn't cut off
    const openX = Math.max(0, Math.min(camEnd.x, stand - Math.min(vw * 0.25, 100)));
    // ...and low enough that his head and the hop stay clear of the navbar
    const dropView = Math.min(0.75, Math.max(0.4, (STREET.tall * ss * (1 + DROP.arc)) / vh + 0.12));
    const dropCam = { x: camEnd.x, y: Math.min(Math.max(my - vh * dropView, camEnd.y), subCamY) };
    // intro: he waits on the road while the camera tilts from the billboards down to the street
    add({ id: "intro", loc: "street", pose: "walk", scale: hs, a: [x0, sgy], b: [x0, sgy], len: Math.max(160, camEnd.y),
      bubble: ["Hi! I'm " + S.name[0] + S.name.slice(1).toLowerCase() + ".", 0.7, 1],
      cam: (t) => ({ x: camStart.x, y: camEnd.y * ease(t) }) });
    // along the road, then down across it to the pavement and the open manhole (the camera follows him down)
    const xa = lerp(x0, stand, 0.45), camX = (p) => lerp(camStart.x, openX, (p.x - x0) / Math.max(1, stand - x0));
    add({ loc: "street", pose: "walk", scale: hs, a: [x0, sgy], b: [xa, sgy], len: Math.max(60, xa - x0),
      bubble: ["Chalo, let's go!", 0, 0.7],
      cam: (t, p) => ({ x: camX(p), y: camEnd.y }) });
    add({ loc: "street", pose: "walk", scale: hs, a: [xa, sgy], b: [stand, my], len: Math.max(80, Math.hypot(stand - xa, my - sgy)),
      cam: (t, p) => ({ x: camX(p), y: lerp(camEnd.y, dropCam.y, ease(t)) }) });
    // he looks down the hole, then steps off, back down to his usual size as he goes
    add({ id: "open", loc: "street", set: "drain", pose: "open", scale: hs, a: [stand, my], b: [stand, my], len: 130,
      cam: () => ({ x: openX, y: dropCam.y }) });
    add({ id: "hop", loc: "street", set: "drain", pose: "hop", scale: (t) => lerp(hs, 1, ease(t)), a: [stand, my], b: [mh, my], len: 150,
      ease: "arc", arc: Sprite.H * L.cs * hs * DROP.arc, cam: (t) => ({ x: lerp(openX, camEnd.x, t), y: dropCam.y }) });
    // fall past the About panel: steady speed, camera keeps him ~40% down the screen.
    // About is gone the moment his feet reach the grate into the subway (the fall is linear in y)...
    const aboutEnter = Math.min(1, Math.max(0, (drain.y + DRAIN.grate * ss - my) / (sy - my)));
    // ...and appears once the pavement has scrolled up to the top ~20% of the screen
    const aboutStart = Math.min(0.5, Math.max(0, (drain.y + DRAIN.surface * ss + vh * 0.2 - my) / (sy - my)));
    add({ id: "fall", loc: "drain", pose: "fall", a: [mh, my], b: [mh, sy], aboutEnter, aboutStart,
      len: vh * ABOUT_SCROLL,
      bubble: ["Shortcut!", 0.01, 0.07],
      // the camera eases from the drop framing to keeping him ~40% down the screen before About appears
      cam: (t, p) => {
        const u = Math.min(1, t / Math.max(aboutStart, 0.02)), view = 0.4 + (dropView - 0.4) * (1 - ease(u));
        return { x: camEnd.x, y: Math.min(Math.max(p.y - vh * view, camEnd.y), subCamY) };
      } });
    // lands in a crouch, rises, fixes his glasses, grins (still the drain's sheet)
    add({ loc: "subway", set: "drain", pose: "land", a: [mh, sy], b: [mh, sy], len: 280, bubble: ["Next stop: Projects!", 0.72, 1],
      cam: () => ({ x: camEnd.x, y: subCamY }) });
    // --- platform, stairs and lobby ---
    const T = stairwell, P = STAIRWELL, smooth = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
    const clampT = (c) => ({ x: Math.min(c.x, T.x + T.w - vw), y: Math.min(Math.max(c.y, T.y), T.y + T.h - vh) });
    const leave = T.px(P.approach, 0)[0], bottom = T.px(...P.stairBottom), top = T.px(...P.stairTop), onto = T.px(...P.lobbyStart);
    const ly = L.ty, up = P.scale;
    // camera Y locks: platform = same framing as the subway; lobby = floor where it sits in the theater
    const C = CINEMA, fs = front.s, F = C.front;
    const frontCam = {
      x: Math.min(Math.max(front.x + front.ox + 836 * fs - vw / 2, front.x), front.x + front.w - vw),
      y: front.y + (front.h - vh) / 2,
    };
    const theaterFeetOnScreen = front.y + front.oy + F.floor * fs - frontCam.y;
    const platCamY = subCamY;
    const lobbyCamY = Math.min(Math.max(ly - theaterFeetOnScreen, T.y), T.y + T.h - vh);
    // The camera follows him (after handing over from the drain framing) until the art runs out on the
    // right; its height follows his, eased from the platform lock to the lobby lock as he climbs.
    const off = camEnd.x - (mh - vw * 0.4);
    const walkCam = (t, p) => clampT({
      x: p.x - vw * 0.4 + off * Math.max(0, 1 - (p.x - mh) / (vw * 0.4)),
      y: lerp(platCamY, lobbyCamY, smooth((sy - p.y) / (sy - ly))),
    });
    add({ id: "subwalk", loc: "subway", pose: "walk", a: [mh, sy], b: [leave, sy], len: leave - mh, cam: walkCam });
    // across the platform to the foot of the stairs, then up them between the railings, a little smaller
    // with every step (the lobby is drawn further away)
    add({ loc: "subway", pose: "walk", a: [leave, sy], b: bottom, len: Math.hypot(bottom[0] - leave, bottom[1] - sy), cam: walkCam });
    add({ id: "stairs", loc: "subway", loc2: "cinema", set: "street", pose: "walk", stairs: true, a: bottom, b: top, scale: (t) => lerp(1, up, t),
      len: CLIMB.strides * CLIMB.px, cam: walkCam });
    // top step onto the lobby floor: feet ease down/up the last few px so they don't pop
    add({ loc: "cinema", set: "street", pose: "walk", ease: "smooth", scale: up, a: top, b: onto, len: Math.max(40, onto[0] - top[0]), cam: walkCam });
    // a few steps past the ticket booth he stops and takes the cinema in: a gasp, a delighted look, a grin
    const door = T.px((P.door[0] + P.door[1]) / 2, P.lobby), tkt = T.px(P.ticket, P.lobby);
    const lobbyCam = (p) => clampT({ x: p.x - vw * 0.4, y: lobbyCamY });
    add({ loc: "cinema", set: "street", pose: "walk", scale: up, a: onto, b: tkt, len: Math.max(40, tkt[0] - onto[0]), cam: walkCam });
    add({ id: "tickets", loc: "cinema", set: "stairs", pose: "react", scale: up, a: tkt, b: tkt, len: 320,
      bubble: ["Ek ticket, please!", 0.62, 1], cam: (t, p) => lobbyCam(p) });
    // ...then on past the posters and the popcorn to the red doors
    add({ id: "lobby", loc: "cinema", set: "street", pose: "walk", scale: up, a: tkt, b: door, len: door[0] - tkt[0],
      cam: (t, p) => lobbyCam(p) });
    L.stairwellPath = [[leave, sy], bottom, top, onto, tkt, door];       // for debug mode
    const tri = (t) => 1 - Math.abs(2 * t - 1);                  // 0 -> 1 -> 0: a cut at the midpoint
    // through the lobby doors: velvet cut into the auditorium, entering by its side door
    const doorCam = lobbyCam({ x: door[0] });
    const fx = (x) => front.x + front.ox + x * fs, fy = front.y + front.oy + F.floor * fs;
    // he stops beside the stage, left of the screen and controls (on phones: the left edge of the view)
    const leftArt = (frontCam.x - front.x - front.ox) / fs;
    const enter = [fx(F.door), fy], spot = [fx(Math.max(F.stand, leftArt + 70)), fy], exit = [fx(F.exit), fy];
    add({ loc: "cinema", set: "street", pose: "walk", scale: up, a: door, b: enter, len: 260, ease: "cut",
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
      drain: find("fall").start + Math.round(find("fall").len * 0.06),
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
    let ky = k;
    if (s.ease === "smooth") ky = t * t * (3 - 2 * t);          // x moves evenly, y eases (top step -> lobby floor)
    let x = s.a[0] + (s.b[0] - s.a[0]) * k;
    let y = s.a[1] + (s.b[1] - s.a[1]) * ky;
    if (s.ease === "arc") y -= s.arc * 4 * t * (1 - t);
    const p = { x, y };
    const cam = s.cam ? s.cam(t, p) : { x: x - L.vw * 0.4, y: y - L.gy };
    return { s, t, p, cam, cut: s.cut ? s.cut(t) : 0 };
  }

  /* ================= RENDER LOOP ================= */
  let target = 0, cur = 0, lastX = null, facing = 1, lastMove = 0, lastLoc = "", hoverLook = false;
  let lastCut = -1;
  const aboutPin = $(".about-pin"), aboutFace = $(".about-portrait");
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
    let anim = "idle", n = tick(260), pos = p;             // pos: where he is drawn (the camera follows p)
    const cutSide = s.ease === "cut" && t >= 0.5;          // past the midpoint of a cut
    const poseNow = cutSide && s.pose2 ? s.pose2 : s.pose;
    const loc = s.loc2 && t > (s.ease === "cut" ? 0.5 : 0.55) ? s.loc2 : s.loc;
    const w = Sprite.W * L.cs, h = Sprite.H * L.cs;
    // his sheet: the segment's or the location's own, if any (a cut leaves the segment's sheet behind)
    let set = (!cutSide && s.set) || SPRITE_SET[loc] || "pixel";
    switch (poseNow) {
      case "walk":
        if (s.stairs && facing > 0) {
          // going up: see CLIMB. (Coming back down he just walks: there are no frames for that.)
          const N = CLIMB.strides, q = Math.min(N - 1e-4, t * N), k = Math.floor(q), u = q - k, ph = Math.floor(u * 4);
          set = "stairs"; anim = "climb";
          n = (k === 0 ? CLIMB.first : k % 2 ? CLIMB.odd : CLIMB.even)[ph];
          if (k === N - 1 && CLIMB.last[ph] != null) n = CLIMB.last[ph];
          const f = CLIMB.forward, R = CLIMB.rise;
          const fx = u < 0.5 ? u * 2 * f : f + (u - 0.5) * 2 * (1 - f);
          let fy = u <= R[0][0] ? 0 : 1;
          for (let i = 1; i < R.length; i++) if (u > R[i - 1][0] && u <= R[i][0]) fy = R[i - 1][1] + (R[i][1] - R[i - 1][1]) * (u - R[i - 1][0]) / (R[i][0] - R[i - 1][0]);
          pos = { x: s.a[0] + (s.b[0] - s.a[0]) * (k + fx) / N, y: s.a[1] + (s.b[1] - s.a[1]) * (k + fy) / N };
        } else if (moving) {
          // steady game cadence (8 fps walk, 12 fps run), like the style guide's steps() timing
          anim = running ? "run" : "walk";
          stepPhase += (dt / 1000) * Sprite.fps(set, anim);
          n = Math.floor(stepPhase);
        } else if (hoverLook && s.loc === "subway") anim = "point";
        else if (s.loc === "exhibition") { anim = tick(2400) % 2 ? "gaze" : "look"; n = tick(900); }
        else if (s.id === "intro" && !saying) {   // a wave, then a pause
          const wn = Sprite.count(Sprite.resolve(set, "wave", 1).anim, set), k = tick(170) % (wn * 3);
          anim = k < wn ? "wave" : "idle"; n = k < wn ? k : tick(260);
        }
        else if (saying) { anim = "talk"; n = tick(220); }
        break;
      case "react": anim = t < 0.3 ? "gasp" : t < 0.62 ? "happy" : "grin"; n = 0; break;
      case "open": anim = "peer"; n = 0; break;
      case "hop": anim = t < 0.22 ? "stepoff" : "fallStart"; n = t < 0.22 ? 0 : Math.min(3, Math.floor(((t - 0.22) / 0.78) * 4)); break;
      case "fall": anim = t >= s.aboutEnter ? "fallEnd" : "fall"; n = tick(150); break;   // legs down once he's through the grate
      case "land": anim = t < 0.45 ? "land" : t < 0.72 ? "glasses" : "smile"; n = t < 0.14 ? 0 : t < 0.32 ? 1 : 2; break;
      case "jump": anim = "jump"; n = Math.min(4, Math.floor(t * 5)); break;
      case "look": anim = "look"; n = tick(700); break;
      case "watch": anim = tick(3200) % 4 === 3 ? "look" : "gaze"; n = tick(900); facing = s.face || -1; break;
      case "sit": anim = s.prop === "chai" ? "chai" : "cinema"; n = tick(s.prop === "chai" ? 650 : 500); break;
    }
    let flips = ["walk", "run", "idle", "talk", "point", "look", "gaze"].includes(anim);   // climb frames are drawn facing their direction
    const grounded = ["walk", "run", "idle", "talk", "point", "look", "gaze", "wave", "climbUp", "climbDown", "peer", "land", "glasses", "smile", "climb", "gasp", "happy", "grin"].includes(anim);
    // painted sheets have their own left-facing frames instead of being mirrored
    const use = Sprite.resolve(set, anim, facing);
    set = use.set; anim = use.anim; flips = flips && use.flip;
    const painted = Sprite.painted(set);

    // location
    if (loc !== lastLoc) {
      lastLoc = loc;
      body.dataset.location = loc;
      markSection(loc);
    }

    // draw sprite (frames are cached per location tint)
    const key = set + anim + (n % Sprite.count(anim, set)) + loc;
    if (key !== lastKey) {
      const src = Sprite.frame(anim, n, RIM[loc], set);
      if (src) {
        lastKey = key;
        const c = sprite.getContext("2d");
        c.imageSmoothingEnabled = painted; c.imageSmoothingQuality = "high";   // pixel art stays crisp
        c.clearRect(0, 0, sprite.width, sprite.height);
        c.drawImage(src, 0, 0, sprite.width, sprite.height);
      }
    }
    if (loc === "street") {   // keep the hero spotlight on him (street coords = world coords)
      const dim = $(".street-dim");
      dim.style.setProperty("--hx", Math.round(p.x) + "px");
      dim.style.setProperty("--hy", Math.round(p.y - h * L.hs * 0.5) + "px");
    }
    const sc = cutSide ? s.scale2 : s.scale;               // cuts can change his scale on the far side
    const scale = (typeof sc === "function" ? sc(t) : sc) || 1;
    const bob = Sprite.bob(anim, n, set) * L.cs;
    charEl.style.transform = `translate3d(${Math.round(pos.x - w / 2)}px, ${Math.round(pos.y - h + bob)}px, 0)` + (scale !== 1 ? ` scale(${scale.toFixed(3)})` : "");
    charEl.style.setProperty("--face", flips ? facing : 1);
    charEl.style.setProperty("--inv", (1 / scale).toFixed(3));   // the speech bubble keeps its own size

    charEl.classList.toggle("no-shadow", !grounded);
    charEl.classList.toggle("painted", painted);

    const z = cam.z || 1;
    world.style.transform = z === 1
      ? `translate3d(${-Math.round(cam.x)}px, ${-Math.round(cam.y)}px, 0)`
      : `translate(${L.vw / 2}px, ${L.vh / 2}px) scale(${z.toFixed(4)}) translate(${-(cam.x + L.vw / 2)}px, ${-(cam.y + L.vh / 2)}px)`;
    // cuts between cinema views: a stepped velvet fade
    // About panel: visible only during the fall; frame steps and words light up with scroll
    const fallSeg = s.id === "fall";
    // fade in as the fall starts; fade out so it's gone right as he enters the subway
    const aboutOn = fallSeg ? Math.max(0, Math.min(1, (t - s.aboutStart) / 0.04, (s.aboutEnter - t) / ABOUT_FADE)) : 0;
    aboutPin.style.opacity = aboutOn.toFixed(2);
    aboutPin.style.visibility = aboutOn > 0 ? "visible" : "hidden";
    if (fallSeg) {
      const P = S.about.portrait, fr = Math.floor((cur - s.start) / (L.vh * ABOUT_FRAME_STEP)) % P.frames;
      if (fr !== aboutFrame) { aboutFrame = fr; aboutFace.style.backgroundPosition = `${(fr / (P.frames - 1)) * 100}% 0`; }
      // words finish lighting up, hold briefly, then the panel fades before the grate
      const a0 = s.aboutStart + ABOUT_TEXT_START, a1 = s.aboutEnter - ABOUT_FADE - ABOUT_HOLD;
      const u = Math.min(1, Math.max(0, (t - a0) / (a1 - a0)));
      const lit = Math.round(u * aboutWords.length);
      if (lit !== aboutLit) {
        for (let i = Math.min(lit, aboutLit); i < Math.max(lit, aboutLit); i++) aboutWords[i].classList.toggle("on", i < lit);
        aboutWords.forEach((w, i) => w.classList.toggle("now", i === lit - 1));
        aboutLit = lit;
        // if the text is taller than its box, keep the newest lit word in view
        const box = aboutWords[0].closest(".about-text"), now = aboutWords[Math.max(0, lit - 1)];
        if (box.scrollHeight > box.clientHeight) box.scrollTop = Math.max(0, now.offsetTop - box.clientHeight * 0.45);
      }
    }

    drawDebug(cam, p);

    const cutV = Math.round(ev.cut * 6) / 6;
    if (cutV !== lastCut) { lastCut = cutV; cutEl.style.opacity = cutV; }

    // speech bubble
    let say = "";
    if (s.bubble && t >= s.bubble[1] && t <= s.bubble[2]) say = s.bubble[0];
    if (anim === "point") say = "Let's check this out!";
    if (bubble.textContent !== say) bubble.textContent = say;
    bubble.classList.toggle("show", !!say);


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
      const el = typeof stop === "string" ? document.getElementById("plain-" + stop) : null;
      if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function projectStop(id) {
    const i = S.featured().findIndex((p) => p.id === id);
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
      } else document.getElementById("card-" + h.slice(8))?.scrollIntoView({ block: "center" });
    } else if (stops[h] != null) goTo(h, instant);
  }

  function setMode(ride) {
    body.classList.toggle("ride", ride);
    body.classList.toggle("static", !ride);
    $(".skip-ride").setAttribute("aria-pressed", String(!ride));
    $(".skip-ride").textContent = ride ? "Skip the ride" : "Take the ride";
    store.set("nb-mode", ride ? "ride" : "static");
    if (!ride) { world.style.transform = ""; body.dataset.location = "street"; requestAnimationFrame(fitPlainArt); }
    layout();
  }

  /* ================= INTERACTIONS ================= */
  function bindUI() {
    $$("[data-stop]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      goTo(a.dataset.stop);
      history.replaceState(null, "", "#" + a.dataset.stop);
    }));

    const toggleRide = () => {
      const ride = !body.classList.contains("ride");
      const at = lastLoc || "street";
      setMode(ride);
      requestAnimationFrame(() => goTo(at, true));
    };
    $(".skip-ride").addEventListener("click", toggleRide);
    $$(".take-ride").forEach((b) => b.addEventListener("click", toggleRide));

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

  // the gallery's top row, stretched upward by CSS to fill the space above the art
  function galleryTop() {
    const img = $("#exhibition .bg-img"), c = $(".gal-top");
    const draw = () => { c.width = img.naturalWidth; c.height = 1; c.getContext("2d").drawImage(img, 0, 0, img.naturalWidth, 1, 0, 0, img.naturalWidth, 1); };
    if (img.complete && img.naturalWidth) draw(); else img.addEventListener("load", draw, { once: true });
  }

  /* ================= DEBUG =================
     D key or ?debug: scene bounds, the stairwell walking path and a minimap of the camera viewport. */
  let debug = /[?&]debug\b/.test(location.search);
  const dbg = document.createElement("canvas");
  dbg.className = "debug-layer";
  document.body.appendChild(dbg);
  addEventListener("keydown", (e) => {
    if ((e.key === "d" || e.key === "D") && !/input|textarea/i.test(e.target.tagName) && $("#lightbox").hidden) {
      debug = !debug; if (!debug) dbg.getContext("2d").clearRect(0, 0, dbg.width, dbg.height);
    }
  });
  function drawDebug(cam, p) {
    if (!debug || !L.stairwell) return;
    if (dbg.width !== L.vw || dbg.height !== L.vh) { dbg.width = L.vw; dbg.height = L.vh; }
    const g = dbg.getContext("2d"), z = cam.z || 1;
    const sx = (x) => (x - cam.x - L.vw / 2) * z + L.vw / 2, sy2 = (y) => (y - cam.y - L.vh / 2) * z + L.vh / 2;
    g.clearRect(0, 0, dbg.width, dbg.height);
    g.lineWidth = 2; g.font = "12px monospace";
    const scenes = { street: L.street, drain: L.drain, subway: L.subway, stairwell: L.stairwell, theater: L.front, gallery: L.exhibition };
    Object.entries(scenes).forEach(([name, r], i) => {
      g.strokeStyle = ["#ff3d9a", "#6be3a8", "#3df2ff", "#ffc21a", "#d9a441", "#ffe3b0"][i];
      g.strokeRect(sx(r.x), sy2(r.y), r.w * z, r.h * z);
      g.fillStyle = g.strokeStyle; g.fillText(name, sx(r.x) + 6, sy2(r.y) + 16);
    });
    g.strokeStyle = "#ff0"; g.beginPath();
    L.stairwellPath.forEach(([x, y], i) => (i ? g.lineTo(sx(x), sy2(y)) : g.moveTo(sx(x), sy2(y))));
    g.stroke();
    L.stairwellPath.forEach(([x, y]) => { g.fillStyle = "#ff0"; g.fillRect(sx(x) - 4, sy2(y) - 4, 8, 8); });
    // minimap: the stairwell image, the path and the viewport rectangle
    const T = L.stairwell, mw = 260, k = mw / T.w, mh = T.h * k, ox = L.vw - mw - 12, oy = 64;
    const mx = (x) => ox + (x - T.x) * k, my = (y) => oy + (y - T.y) * k;
    g.fillStyle = "rgba(0,0,0,0.6)"; g.fillRect(ox - 4, oy - 18, mw + 8, mh + 22);
    g.strokeStyle = "#ffc21a"; g.strokeRect(ox, oy, mw, mh);
    g.strokeStyle = "#ff0"; g.beginPath();
    L.stairwellPath.forEach(([x, y], i) => (i ? g.lineTo(mx(x), my(y)) : g.moveTo(mx(x), my(y)))); g.stroke();
    g.strokeStyle = "#3df2ff"; g.strokeRect(mx(cam.x), my(cam.y), (L.vw / z) * k, (L.vh / z) * k);
    g.fillStyle = "#ff3d9a"; g.fillRect(mx(p.x) - 2, my(p.y) - 4, 4, 4);
    g.fillStyle = "#fff";
    g.fillText(`scale ${T.s.toFixed(3)} (${(T.h / L.vh).toFixed(2)} vh)  offsetY ${T.y}`, ox, oy - 6);
  }

  // Highlight the current section in the nav; the pill slides to it (hidden on the street / home)
  function markSection(loc) {
    let here = null;
    $$(".route a[data-stop]").forEach((a) => {
      const on = a.dataset.stop === loc;
      a.classList.toggle("here", on);
      on ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current");
      if (on) here = a;
    });
    const pill = $(".route-pill");
    pill.classList.toggle("on", !!here);
    if (here) { pill.style.setProperty("--pill-x", here.offsetLeft + 5 + "px"); pill.style.setProperty("--pill-w", here.offsetWidth + "px"); }
  }
  addEventListener("resize", () => markSection(lastLoc));
  document.fonts?.ready.then(() => markSection(lastLoc));

  // Nav logo glitch. Hovering (or focusing) plays glitch bursts: red/cyan copies split apart, random
  // horizontal slices tear sideways, the whole mark jitters and now and then flickers. Leaving snaps
  // it back to clean.
  const GLITCH = { frameMs: 55, burst: 7, rest: [4, 12], split: 5, slices: [2, 5], tear: 14 };   // css px / frames
  function glitchLogo() {
    const link = $(".hud-logo"), c = $(".logo-canvas"), img = new Image();
    const tint = (col) => { const t = document.createElement("canvas"); t.width = img.width; t.height = img.height;
      const g = t.getContext("2d"); g.drawImage(img, 0, 0); g.globalCompositeOperation = "source-in"; g.fillStyle = col; g.fillRect(0, 0, t.width, t.height); return t; };
    let red, cyan, timer = null, frame = 0, rest = 0;
    const size = () => {
      const dpr = window.devicePixelRatio || 1, h = link.clientHeight || 58, w = Math.round(h * img.width / img.height);
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + "px"; }
      return dpr;
    };
    const clean = () => { size(); const g = c.getContext("2d"); g.clearRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); };
    const rnd = (a, b) => a + Math.random() * (b - a);
    const glitch = () => {
      const dpr = size(), g = c.getContext("2d"), W = c.width, H = c.height, G = GLITCH;
      g.clearRect(0, 0, W, H);
      if (Math.random() < 0.12) return;                                   // flicker: a blank frame
      const d = rnd(1.5, G.split) * dpr, jx = rnd(-2, 2) * dpr, jy = rnd(-1, 1) * dpr;
      g.globalAlpha = 0.9;
      g.drawImage(cyan, -d + jx, jy, W, H);
      g.drawImage(red, d + jx, -jy, W, H);
      g.globalAlpha = 1;
      g.drawImage(img, jx, 0, W, H);
      // tear a few horizontal slices sideways
      const n = Math.floor(rnd(G.slices[0], G.slices[1] + 1));
      for (let i = 0; i < n; i++) {
        const y = rnd(0, H * 0.9), h = rnd(H * 0.04, H * 0.16), dx = rnd(-G.tear, G.tear) * dpr;
        const band = g.getImageData(0, y, W, h);
        g.clearRect(0, y, W, h);
        g.putImageData(band, dx, y);
      }
    };
    const tick = () => {
      if (rest > 0) { rest--; if (rest === 0) frame = 0; clean(); return; }
      glitch();
      if (++frame >= GLITCH.burst) { rest = Math.floor(rnd(GLITCH.rest[0], GLITCH.rest[1])); clean(); }
    };
    const start = () => { if (reduceMotion || timer) return; frame = 0; rest = 0; timer = setInterval(tick, GLITCH.frameMs); tick(); };
    const stop = () => { clearInterval(timer); timer = null; clean(); };
    link.addEventListener("mouseenter", start);
    link.addEventListener("mouseleave", stop);
    link.addEventListener("focus", start);
    link.addEventListener("blur", stop);
    img.onload = () => { red = tint("#FF2A4A"); cyan = tint("#3DF2FF"); clean(); };
    img.src = "assets/brand/logo.png";
    addEventListener("resize", () => img.complete && !timer && clean());
  }

  // "Scroll" cursor over the opening city screen: replaces the pointer on the street (until he drops
  // into the drain) and on the Skip-the-ride hero, but never over links, buttons or the navbar.
  // A click scrolls onward. Mouse / trackpad only.
  function scrollCursor() {
    if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const el = $(".scroll-cursor");
    let x = -200, y = -200, tx = x, ty = y, target = null, raf = 0;
    const onCity = () => {
      if (!target || !$("#lightbox").hidden || body.classList.contains("preloading")) return false;
      if (target.closest("a, button, input, .hud, .lightbox")) return false;
      if (body.classList.contains("ride")) return lastLoc === "street" || lastLoc === "";
      return !!target.closest(".plain-hero");
    };
    const update = () => body.classList.toggle("scroll-cursor-on", onCity());
    const follow = () => {
      x += (tx - x) * 0.35; y += (ty - y) * 0.35;
      el.style.setProperty("--cx", x.toFixed(1) + "px"); el.style.setProperty("--cy", y.toFixed(1) + "px");
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.3 ? requestAnimationFrame(follow) : 0;
    };
    addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY; target = e.target;
      if (!body.classList.contains("scroll-cursor-on")) { x = tx; y = ty; }   // appear right under the pointer
      update();
      if (!raf) raf = requestAnimationFrame(follow);
    }, { passive: true });
    addEventListener("scroll", update, { passive: true });
    addEventListener("preloader:done", update);
    document.addEventListener("mouseleave", () => body.classList.remove("scroll-cursor-on"));
    addEventListener("pointerdown", () => body.classList.contains("scroll-cursor-on") && body.classList.add("cursor-press"));
    addEventListener("pointerup", () => body.classList.remove("cursor-press"));
    addEventListener("click", (e) => {
      if (!body.classList.contains("scroll-cursor-on")) return;
      e.preventDefault();
      if (body.classList.contains("ride")) scrollBy({ top: innerHeight * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
      else goTo("drain");                                                  // plain page: to About
      setTimeout(update, 50);
    });
  }

  /* ================= BOOT ================= */
  fillContent();
  galleryTop();
  scrollCursor();
  watchPlain();
  glitchLogo();
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
