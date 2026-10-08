/* ------------------------------------------------------------------
   ANISH SHAH PORTFOLIO — scroll-driven journey
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
    approach: 800,                     // he walks along the platform past the foot of the stairs to here, then turns to them
    stairBottom: [690, 612],           // the stairs climb to the left: the middle of the steps, bottom and top
    stairTop: [362, 350],
    lobbyStart: [480, 355],            // short eased blend from the top step onto the lobby floor
    lobby: 355,                        // feet on the lobby's chequered floor
    scale: 0.86,                       // his size up there (the lobby is drawn smaller than the platform)
    ticket: 610,                       // where he stops, at the ticket booth, and takes the cinema in
    door: [1500, 1590],                // red double doors: walking into them cuts to the theater
    posters: { poster1: [777, 160, 90, 129], poster2: [899, 160, 95, 129] },   // blank posters: x, y, w, h
    rails: [362, 240, 1310, 376],      // assets/subway/rails.png: the railings drawn in front of him
  };

  /* Stairs are driven by scroll, one stride at a time, so his feet land on the steps:
     reach (front foot in the air) -> plant (it lands a stride on) -> rise (he shifts onto it, the back
     foot leaves its step) -> push (the back leg trails). His height holds through reach and plant and
     changes through rise and push; he moves forward mostly in the second half.
     Frames are cells of assets/character/stairs.webp (0-7 climbing, 8-15 coming down); `first` is the
     flight's first stride and `last` replaces the final stride's last frames (stepping off). */
  const CLIMB = {
    strides: 7, px: 110,                         // strides in the flight, scroll px per stride
    up: { first: [0, 0, 1, 2], even: [7, 4, 5, 6], odd: [7, 0, 2, 3], last: [null, null, 6, 7] },
    down: { first: [1, 0, 2, 3], even: [4, 0, 2, 3], odd: [5, 0, 1, 3], last: [null, null, 6, 7] },
    forward: 0.3,                                // share of a stride's forward travel made during reach + plant
    rise: [[0.375, 0], [0.625, 0.55], [0.875, 1]],   // [phase, share of the stride's rise or drop]
  };
  // The logo opens large in the middle of the hero and travels to its navbar corner as he sets off:
  // its width there (share of the screen, capped in px), where its centre sits (share of the screen
  // height), and how much of his first walk the trip takes
  const LOGO_HERO = { width: 0.36, max: 470, y: 0.45, over: 0.75 };
  // Into the manhole: where he stops (art px left of its centre) and how high he steps off (x his height)
  const DROP = { stand: 225, arc: 0.14 };
  // Hero focus: STREET_DIM black over the street except soft windows at each billboard and a spotlight
  // that follows the character. The windows are mask holes, so nothing is drawn twice.
  const STREET_DIM = 0.3;               // strength of the shade
  const STREET_FOCUS_PAD = 1.35;        // billboard windows, relative to the board's size (takes in frames + lamps)

  // About me, pinned beside the drain shaft for the whole fall: portrait left, text right
  const ABOUT_SHAFT = [595, 1052];      // shaft brick walls in drain art px (the panels stay outside them)
  const ABOUT_MIN_SIDE = 220;           // narrower than this beside the shaft -> portrait + text stacked over it
  const ABOUT_PORTRAIT_W = 210;         // max portrait width (css px)
  const ABOUT_TEXT_W = 380;             // max text box width (css px)
  const ABOUT_SCROLL = 4.5;             // viewport heights of scroll for the fall (reading time)
  const ABOUT_FRAME_STEP = 0.3;         // viewport heights of scroll per portrait frame
  const ABOUT_TEXT_START = 0.03;        // after the panel appears, this much of the fall before words light up
  const ABOUT_HOLD = 0.03;              // fully lit for this much of the fall before fading
  const ABOUT_FADE = 0.06;              // fade-out length; it ends exactly as his feet reach the subway grate

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };

  /* ================= CONTENT ================= */
  // the subway's boards are wide: a project whose cover is tall shows its wide ad picture there instead
  const srcsetAttr = (id) => { const v = SITE.srcset(id); return v ? ` srcset="${v}"` : ""; };   // (only pictures that come in several widths have one)
  const boardImg = (p) => p.hero || p.cover;   // the picture on a subway card: the project's wide main image, which fills the card
  // a photo's second line: where and when, or for an album how many pictures it holds
  const photoSub = (p, sep = " · ") => (p.album ? `Album${sep}${p.album.length} ${p.note ? "pictures" : "photographs"}` : `${p.place}${sep}${p.year}`);
  function fillContent() {
    $("#site-name").textContent = `${S.name[0]}${S.name.slice(1).toLowerCase()} Shah, ${S.role}`;
    $("#site-intro").textContent = S.intro;
    const mailto = "mailto:" + S.email + (S.mailSubject ? "?subject=" + encodeURIComponent(S.mailSubject) : "");
    $("#mail-link").href = mailto;
    $("#cr-kicker").textContent = S.footer.kicker;
    $("#credits-title").innerHTML = `${S.footer.title[0]} <em>${S.footer.title[1]}</em>`;
    $("#cr-line").textContent = S.footer.line;
    // the date and time, ticking, as on the Framer site ("October 06 - 11:08:30 AM")
    const clock = () => { const d = new Date(); $("#cr-clock").textContent = d.toLocaleDateString("en-US", { month: "long", day: "2-digit" }) + " - " + d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }); };
    clock(); setInterval(clock, 1000);
    $("#mail-link").textContent = S.email;
    $("#copyright").textContent = `© ${S.year} ${S.name[0]}${S.name.slice(1).toLowerCase()} Shah. All rights reserved.`;

    // each board is an ad for one project: the picture, then its line, title, blurb and a way in
    $("#billboards").innerHTML = S.featured().map((p, i) => `
      <a class="billboard" id="project-${p.id}" data-i="${i}" href="project.html?p=${p.id}" style="--band:${p.band}">
        <span class="bb-pic"><span class="bill-bg" style="background-image:url(${SITE.img(p.cover, 32)})"></span><img class="work-media" src="${SITE.img(boardImg(p), 1280)}"${srcsetAttr(boardImg(p))} sizes="(max-width: 700px) 70vw, 40vw" alt="${p.title} cover" decoding="async" /></span>
        <span class="bb-info">
          <span class="bb-line">${p.meta.category || p.line}</span>
          <span class="bb-title">${p.title}</span>
          <span class="bb-blurb">${p.blurb}</span>
          <span class="bb-go">View project <b aria-hidden="true">→</b></span>
        </span>
      </a>`).join("");

    $("#reel-posters").innerHTML = S.reels.map((r, i) => `
      <li><button class="reel-poster" type="button" data-i="${i}" aria-pressed="${i === 0}">
        <img class="work-media" src="${r.poster}" alt="" loading="lazy" decoding="async" />
        <span><b>${r.title}</b><small>${r.length}</small></span>
      </button></li>`).join("");

    $("#photos").innerHTML = S.photos.map((p, i) => `
      <figure class="photo" style="--ar:${p.w / p.h}">
        <button class="photo-frame${p.album ? " is-album" : ""}" type="button" data-i="${i}" aria-label="Open ${p.album ? "album" : "photo"}: ${p.title}, ${photoSub(p, ", ")}">
          <img class="work-media" data-src="${p.cover || p.src}" alt="${p.title}${p.album ? " album cover" : ""}" decoding="async"${p.pos ? ` style="object-position:${p.pos}"` : ""} />
          ${p.album ? `<span class="album-tag" aria-hidden="true">${p.album.length} photos</span>` : ""}
        </button>
        <figcaption class="plaque"><b>${p.title}</b><span>${photoSub(p)}</span></figcaption>
      </figure>`).join("");

    $(".hoardings").innerHTML = ROOFTOP.hoardings.map((_, i) => `<i class="hoarding" style="background-image:url(${S.img(S.projects[i % S.projects.length].cover, 256)})"></i>`).join("");
    $$(".back-photo").forEach((el, i) => { const ph = S.photos[i % S.photos.length]; $("img", el).dataset.src = ph.src; });
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

    boardEls = $$(".billboard"); photoEls = $$("#photos .photo");
    streetLife();
    renderPlain();
    adBoards();

    $("#socials").innerHTML = S.socials.map((s) => `
      <li><a href="${s.url}" target="_blank" rel="noopener">${s.label}</a></li>`).join("");
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
    // the metro on the overpass (tools/build_street.py): the stretch of track between the buildings
    // (x, y, w, h), the train's length, where its nose rests when it isn't moving, the lamp posts in front
    train: { track: [608, 342, 572, 40], len: 962, rest: 501, posts: [656, 341, 317, 42] },
    steam: [1464, 566, 52, 58],    // above the chai kettle
  };

  // assets/scenes/drain.webp: three painted frames stitched by tools/build_drain.py (which prints these).
  // It hangs straight under the street: the street's road runs down to the drain's pavement.
  const DRAIN = {
    w: 1672, h: 2049,
    top: 60,       // rows of its road tucked under the street's bottom edge, which fades out over them
    hole: 835,     // centre of the open manhole and of the clear drop down the shaft
    stand: 106,    // the pavement beside the manhole: his feet line before he hops in
    surface: 186,  // where the pavement and road bed end and the soil begins
    grate: 1977,   // top of the grate into the subway
  };

  // assets/scenes/subway.webp: landing, billboard wall x2; built by tools/build_subway.py (which prints the boards)
  const SUBWAY = {
    w: 5016, h: 941,
    cut: 150,            // top rows (its own grate) hidden under the drain's grate
    floor: 655,          // his feet on the platform
    sign: [[985, 162], [1165, 162], [1165, 224], [985, 224]],   // station sign, hung in the dark of the ceiling
    // blank billboards on the tiled wall: x, y, w, h
    boards: [[1935, 346, 473, 190], [2609, 346, 506, 190], [3607, 346, 473, 190], [4281, 346, 506, 190]],
    dim: [1500, 5016], dimBy: 0.5,   // the shaded stretch (x from, to) and how dark
    reach: 345,                      // a board lights up when he is within this of its centre
  };

  // assets/scenes/cinema-front.webp (1672 x 941): the auditorium's front view
  const CINEMA = {
    w: 1672, h: 941,
    front: {
      screen: [501, 191, 668, 308],      // the screen, cut out of the art; the reel plays behind it
      stage: [372, 540, 928, 54],        // the stage front: the reel posters stand here
      rowTop: 618,                       // seats from the first row down (assets/cinema/seat-row.webp) are drawn in front of him
      door: 128, exit: 1545, floor: 618, // left door he enters by, right door he leaves by; his feet, just behind the first row
      stand: 330,                        // where he stops, left of the stage, to watch
    },
  };

  // assets/scenes/backstairs.webp (tools/build_backstairs.py): the staircase from the cinema up to the gallery
  const BACKSTAIRS = {
    w: 1672, h: 941,
    door: 400, floor: 830,                       // in by the open door under the landing; his feet on the floor
    pass: 1125,                                  // along the floor past the newel post to here, then he turns to the stairs
    flight1: [[1012, 806], [552, 462]],          // up the first flight, right to left (the middle of the steps)
    flight2: [[745, 490], [1040, 368]],          // behind its balustrade to the second flight, then up it, left to right
    exit: 1390, top: 364,                        // along the top landing to the door
    strides: [8, 3],                             // strides per flight (see CLIMB)
    scale: 1.15,                                 // the room is drawn a little larger than the others
    poster: [353, 113, 139, 214],                // big blank frame on the wall: x, y, w, h
    frames: [[806, 261, 46, 64], [887, 219, 45, 63], [967, 179, 46, 66], [1048, 133, 50, 73]],   // small ones up the stairs
    rails: [178, 211, 1384, 609],                // assets/backstairs/rails.png: the railings drawn in front of him
    // mood: lamps that glow (x, y, glow size) and the warm light they throw (x, y, w, h)
    lamps: [[92, 205, 230], [640, 243, 220], [1180, 135, 220], [1645, 215, 230], [222, 575, 210], [480, 585, 210], [1183, 540, 220],
      [770, 150, 130], [810, 165, 150], [852, 150, 130], [422, 62, 170], [1397, 66, 170]],
    pools: [[250, 760, 420, 150], [560, 800, 720, 140], [330, 90, 190, 250], [1310, 90, 180, 280], [700, 190, 240, 230], [1040, 600, 300, 260]],
  };

  // assets/scenes/gallery.webp: three paintings side by side (tools/build_gallery.py prints these numbers)
  const GALLERY = {
    w: 5016, h: 941,
    floor: 835, tall: 330,      // his feet on the wooden floor; how tall he stands in this room
    enter: [215, 775], exit: [4850, 770],   // on the carpet at the door in, and at the door out to the roof
    sign: [506, 242, 212, 150], // the "On display" plaque, under the wall lamp beside the first frame: x, y, w, h
    reach: 520,                 // a photo's picture light comes up when he is within this of its centre
    frames: [[758, 262, 632, 259], [2132, 274, 203, 240], [2471, 276, 479, 235], [3581, 262, 585, 256]],
    plaques: [[1030, 543, 83, 19], [2204, 535, 63, 17], [2676, 535, 67, 17], [3839, 541, 73, 19]],
  };
  // assets/scenes/rooftop.webp: the rooftop at night (the footer)
  const ROOFTOP = {
    w: 1672, h: 941,
    door: [95, 738], spot: [985, 728], tall: 250,   // out of the door, over to the bench he sits on; his height here
    sky: [150, 70, 640],        // the credits column: x, (unused), width
    bulbs: [[904, 417], [975, 435], [1058, 446], [1150, 445], [1235, 433], [1290, 417]],
    // the metro on the far bridge (tools/build_gallery.py): its track, its length, where it rests, what it passes behind
    train: { track: [750, 486, 346, 21], len: 182, rest: 182, front: [853, 484, 187, 25] },
    // life: the pool of light on the floor, the door lamp, stars, water, a beacon (the fairy lights are images)
    pool: [700, 640, 760, 230], lamp: [90, 386],
    stars: [[703, 110, 44], [868, 200, 32], [503, 232, 36], [1272, 130, 36]],
    dots: [[455, 97], [498, 130], [331, 176], [748, 149], [912, 87], [940, 233], [793, 271], [1240, 238], [1360, 170]],
    water: [860, 532, 205, 56], beacon: [1031, 441],
    hoardings: [[503, 404, 52, 33], [621, 445, 42, 29], [1206, 471, 45, 28], [1390, 448, 49, 33], [1481, 349, 60, 44]],
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

  /* ================= STREET LIFE =================
     Small things that move on the street, and things that answer a click. Positions are in street art px.
     Everything is built here and placed by layout() from its data-art box (x, y, w, h). */
  const LIFE = {
    moon: [1044, 67, 148, 148],
    stars: [[651, 74, 46], [900, 148, 34], [661, 238, 42], [1350, 94, 36]],                    // x, y, size: the painted four-point stars
    dots: [[525, 71], [737, 54], [951, 65], [585, 125], [780, 183], [962, 176], [1011, 244], [1257, 139], [1301, 74]],
    windows: [[268, 234, 33, 65], [314, 390, 36, 36], [420, 408, 48, 70], [450, 328, 26, 44], [526, 385, 26, 42], [1222, 306, 20, 38], [1222, 414, 20, 50], [1600, 150, 48, 76]],
    lamps: [[657, 310], [970, 312], [1160, 306]],             // the overpass lamps
    water: [742, 626, 296, 54],
    beacons: [[940, 530], [1017, 521]],                       // the sea link's towers
    sign: [163, 503, 178, 38],                                // GENERAL STORE
    zzz: [1548, 692, 70, 56],
    spots: {                                                  // clickable: box, what it says (in turn), a label
      moon: { box: [1044, 67, 148, 148], says: ["Make a wish!", "Full moon tonight."], label: "The moon" },
    },
    him: ["Hi!", "That tickles!", "Scroll, yaar!", "Chalo, chalo!"],   // what he says when clicked
  };
  let poke = { until: 0, text: "" };                          // he was just clicked: cheer and say this
  function streetLife() {
    const street = $("#street"), deco = $("#street .deco");
    const box = (cls, a, inner = "") => `<i class="${cls}" data-art="${a.join(",")}">${inner}</i>`;
    const at = ([x, y], s) => [x - s / 2, y - s / 2, s, s];
    deco.insertAdjacentHTML("beforeend",
      LIFE.dots.map((d, i) => box("sky-dot", at(d, 12)).replace("<i ", `<i style="animation-delay:${-(i * 0.73) % 3}s" `)).join("")
      + LIFE.stars.map(([x, y, z], i) => box("sky-star", at([x, y], z)).replace("<i ", `<i style="animation-delay:${-i * 0.9}s" `)).join("")
      + box("shoot", [1200, 40, 150, 3])
      + LIFE.windows.map((w) => box("win-off", w)).join("")
      + LIFE.lamps.map((l, i) => box("lamp-glow" + (i === 1 ? " flick" : ""), at(l, 46))).join("")
      + box("water", LIFE.water)
      + LIFE.beacons.map((b, i) => box("beacon", at(b, 8)).replace("<i ", `<i style="animation-delay:${-i * 0.6}s" `)).join("")
      + box("store-sign", LIFE.sign)
      + box("zzz", LIFE.zzz, "<b>z</b><b>z</b><b>Z</b>"));
    street.insertAdjacentHTML("beforeend", Object.entries(LIFE.spots).map(([k, v]) =>
      `<button class="content hot hot-${k}" type="button" tabindex="-1" data-k="${k}" data-art="${v.box.join(",")}" aria-label="${v.label}"><span class="hs-say"></span></button>`).join(""));

    const say = (btn, text) => {
      const b = $(".hs-say", btn);
      b.textContent = text; btn.classList.add("say");
      clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove("say"), 1700);
    };
    const shoot = () => {
      const el = $(".shoot");
      el.style.setProperty("--x", Math.round((700 + Math.random() * 760) * L.street.s) + "px");
      el.style.setProperty("--y", Math.round((30 + Math.random() * 120) * L.street.s) + "px");
      el.classList.remove("go"); void el.offsetWidth; el.classList.add("go");
    };
    const once = (el, cls, ms) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); setTimeout(() => el.classList.remove(cls), ms); };
    const turn = {};
    $$("#street .hot").forEach((btn) => btn.addEventListener("click", () => {
      const k = btn.dataset.k, lines = LIFE.spots[k].says;
      turn[k] = (turn[k] || 0) + 1;
      say(btn, lines[(turn[k] - 1) % lines.length]);
      if (k === "moon") shoot();
    }));
    // click him: he cheers and says something
    let pokes = 0;
    $(".char-hit").addEventListener("click", () => { poke = { until: performance.now() + 1300, text: LIFE.him[pokes++ % LIFE.him.length] }; });

    if (reduceMotion) return;
    // now and then a window goes dark or lights up again, and a star falls
    const wins = $$("#street .win-off");
    setInterval(() => {
      if (lastLoc !== "street" || document.hidden) return;
      const off = wins.filter((w) => w.classList.contains("off"));
      const pick = off.length >= 3 || (off.length && Math.random() < 0.45) ? off[Math.floor(Math.random() * off.length)] : wins[Math.floor(Math.random() * wins.length)];
      pick.classList.toggle("off");
    }, 2600);
    (function next() { setTimeout(() => { if (lastLoc === "street" && !document.hidden && body.classList.contains("ride")) shoot(); next(); }, 7000 + Math.random() * 8000); })();
  }

  /* ================= STREET BILLBOARDS: rotating project ads =================
     Every blank board on the street shows project images in turn (the boards are staggered so they never
     change together), with a small caption; the board links to whatever it's showing. Images come from
     each project's `ads` list if it has one, else its cover (use GIF ids there for animated ads). */
  /* Scene art arrives as the ride reaches it. Every picture after the street carries data-src (see index.html):
     a place's pictures are fetched when he enters the place before it, and after the page has loaded the rest
     follow one at a time, in the order of the journey. The Simple view fetches none of them. */
  const lazyArt = () => $$(".viewport img[data-src]");
  const artPlace = (img) => img.dataset.art || img.closest("[data-location]")?.dataset.location;
  const fetchArt = (img) => new Promise((done) => {
    if (!img.dataset.src) return done();
    img.addEventListener("load", done, { once: true }); img.addEventListener("error", done, { once: true });
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    delete img.dataset.src; delete img.dataset.srcset;
  });
  const needArt = (place) => { if (place) lazyArt().filter((img) => artPlace(img) === place).forEach(fetchArt); };
  // (on the opening screen the next place waits until the page has loaded, so the street's own pictures and billboards come first)
  const artAround = (loc) => { const o = stops.order || []; needArt(loc); if (loc !== "street" || document.readyState === "complete") needArt(o[o.indexOf(loc) + 1]); };
  let artRunning = false, drainArt = false;
  async function restOfArt() {
    if (artRunning) return;
    artRunning = true;
    for (const img of lazyArt()) { if (!body.classList.contains("ride")) break; await fetchArt(img); }
    artRunning = false;
  }
  const adRefresh = [];
  const ADS = { every: 4200, stagger: 1400 };   // ms per ad, delay between boards
  function adBoards() {
    const list = S.home().length ? S.home() : S.projects;
    $$(".bb-show").forEach((board) => {
      const tall = board.dataset.quad === "led", strip = board.dataset.quad === "mid";
      const shape = tall ? "tall" : "wide";
      const pics = list.flatMap((p) => ((p.ads && p.ads[shape]) || [p.cover]).map((img) => ({ p, img })));
      // every ad fills its board edge to edge;
      // the tall board is laid out like a poster (title, picture, category) and the thin overpass
      // banner as a strip (picture, then title and category beside it)
      board.innerHTML = pics.map(({ p, img }, i) => {
        const bg = `<span class="bill-bg" style="background-image:url(${S.img(p.cover, 32)})"></span>`;
        // (no src yet: a board fetches the ad it is showing and the one after it, so the first ads arrive at once instead of queueing behind forty others)
        const pic = `<img class="work-media bill-img" data-src="${S.img(img, 640)}" data-srcset="${S.srcset(img)}" sizes="${tall ? "12vw" : "22vw"}" alt="${p.title} cover" decoding="async" />`;
        return tall
          ? `<span class="bill bill-poster" data-i="${i}">${bg}<span class="bill-title">${p.title}</span><span class="bill-frame">${pic}</span><span class="bill-cat">${p.meta.category || ""}</span></span>`
          : strip
          ? `<span class="bill bill-strip" data-i="${i}">${bg}<span class="bill-frame">${pic}</span><span class="bill-text"><span class="bill-title">${p.title}</span><span class="bill-cat">${p.meta.category || ""}</span></span></span>`
          : `<span class="bill" data-i="${i}">${bg}${pic}<span class="bill-cap"><b>${p.title}</b> ${p.meta.category || ""}</span></span>`;
      }).join("");
      let i = (+board.dataset.start || 0) % pics.length;
      const fetchAd = (k) => { const im = board.querySelectorAll(".bill-img")[k % pics.length]; if (im && !im.src) { if (k === i) im.fetchPriority = "high"; if (im.dataset.srcset) im.srcset = im.dataset.srcset; im.src = im.dataset.src; } };
      const show = (first) => {
        if (!board.getClientRects().length) return;        // the other view's boards: nothing to fetch or turn
        const ads = board.querySelectorAll(".bill");
        fetchAd(i); fetchAd(i + 1);
        ads.forEach((a, k) => a.classList.toggle("on", k === i));
        if (!first) { ads[i].classList.add("enter"); setTimeout(() => ads[i].classList.remove("enter"), 700); }
        board.href = `project.html?p=${pics[i].p.id}`;
        board.setAttribute("aria-label", `Featured project: ${pics[i].p.title}`);
      };
      show(true);
      adRefresh.push(() => show(true));                    // (again when the view changes: see setMode)
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
    // a section's name, as the ride's signs give it: in Hindi, small, over the English
    const head = (label, hindi, note = "") => `
      <header class="q-head" data-rv><div><p class="hi">${hindi}</p><h2>${label}</h2></div>${note ? `<p class="q-note">${note}</p>` : ""}</header>`;
    $("#plain").innerHTML = `
      <!-- The Simple view is the ride as still frames: the same paintings, with the work set into them. -->
      <section class="q-hero" id="plain-street" data-loc="street" aria-label="Home">
        <!-- the street, as painted, its billboards carrying the projects (see fitPlainArt) -->
        <div class="plain-hero-bg" aria-hidden="true"><div class="plain-art">
          <img src="assets/scenes/street.webp" srcset="assets/scenes/street.webp 1672w, assets/scenes/street-2x.webp 3344w" sizes="100vw" alt="" width="1672" height="941" />
          <a class="bb-map bb-show bb-left" data-quad="left" data-start="0" tabindex="-1"></a>
          <a class="bb-map bb-show bb-led" data-quad="led" data-start="1" tabindex="-1"></a>
          <a class="bb-map bb-show bb-mid" data-quad="mid" data-start="2" tabindex="-1"></a>
        </div></div>
        <div class="q-mark">
          <h1 class="q-logo"><img src="assets/brand/logo-source.png" alt="${first} Shah" /></h1>
          <b class="ht-port q-port" aria-hidden="true">Portfolio <small>'${String(S.year).slice(2)}</small></b>
          <b class="ht-badge q-badge" aria-hidden="true">
            <svg viewBox="0 0 120 120"><defs><path id="q-ring" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" /></defs>
              <circle cx="60" cy="60" r="58" /><text textLength="266" lengthAdjust="spacing"><textPath href="#q-ring" textLength="266" lengthAdjust="spacing">DESIGN PORTFOLIO &#9733; ANISH SHAH &#9733; ${S.year} &#9733;</textPath></text></svg>
            <i class="hi">नमस्ते</i></b>
          <b class="ht-hey q-hey"><i></i>Looking for a grad project</b>
        </div>
        <button class="z-him z-guide take-ride" type="button" aria-label="Take the ride: travel through the portfolio as a scrolling journey"></button>
        <div class="q-hero-foot">
          <p class="q-intro">I design things for screens and streets: brands, packaging, interfaces and print.</p>
          <button class="q-link take-ride" type="button">Take the ride <i aria-hidden="true">→</i></button>
        </div>
      </section>

      <section class="q-sec q-about" id="plain-drain" data-loc="drain" aria-labelledby="plain-about-h">
        <div class="q-wrap">
          <figure class="q-facefig" data-rv>
            <button class="q-face" type="button" aria-label="Portrait of ${first}. Click for another expression"><span class="q-face-img"></span></button>
            <figcaption>Tap for another face</figcaption>
          </figure>
          <div class="q-about-main">
            ${head(`<span id="plain-about-h">${A.title}</span>`, "मेरे बारे में")}
            <div class="q-about-copy" data-rv>${A.text.map((t) => `<p>${t.text}</p>`).join("")}</div>
            <dl class="q-facts" data-rv>
              <div><dt>Disciplines</dt><dd>${A.tags.join(", ")}</dd></div>
              <div><dt>Right now</dt><dd>Looking for a grad project</dd></div>
              <div><dt>On paper</dt><dd><a class="q-link" href="${S.resume}" target="_blank" rel="noopener">Resume <i aria-hidden="true">↗</i></a></dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section class="q-sec q-work" id="plain-subway" data-loc="subway" aria-label="Projects">
        <!-- the platform, as painted: the train standing at it -->
        <div class="q-plate" aria-hidden="true"><img src="assets/scenes/subway-platform.webp" alt="" width="1806" height="941" loading="lazy" decoding="async" /></div>
        <div class="q-wrap">
          ${head("Selected work", "प्रोजेक्ट्स", `${S.home().length} projects across branding, packaging, publication, UI/UX and production design.`)}
          <ol class="q-projects">${S.home().map((p, i) => `
            <li class="q-proj" id="card-${p.id}" data-rv>
              <a href="project.html?p=${p.id}">
                <span class="q-pic"><img class="work-media" src="${S.img(boardImg(p), 1280)}"${srcsetAttr(boardImg(p))} sizes="(max-width: 800px) 92vw, 58vw" alt="${p.title} cover" loading="lazy" decoding="async" /></span>
                <span class="q-proj-text">
                  <span class="q-label"><b>${String(i + 1).padStart(2, "0")}</b>${[p.meta.category, p.meta.year].filter(Boolean).join(" · ")}</span>
                  <span class="q-proj-title">${p.title}</span>
                  <span class="q-proj-blurb">${p.blurb}</span>
                  <span class="q-link">View project <i aria-hidden="true">→</i></span>
                </span>
              </a>
            </li>`).join("")}
          </ol>
          <p class="q-all" data-rv><a class="q-link big" href="projects.html">All projects <i aria-hidden="true">→</i></a></p>
        </div>
      </section>

      <section class="q-sec q-reels" id="plain-cinema" data-loc="cinema" aria-label="Reels">
        <div class="q-wrap">
          ${head("Reels", "रील्स", "i make content, i just forget to post it.")}
          <!-- the cinema, as painted: the reel plays on its screen -->
          <div class="q-cinema" data-rv>
            <div class="q-hall">
              <span class="q-screen" id="plain-screen"></span>
              <img src="assets/scenes/cinema-front.webp" srcset="assets/scenes/cinema-front.webp 1672w, assets/scenes/cinema-front-2x.webp 3344w" sizes="(max-width: 1400px) 150vw, 2000px" alt="" width="1672" height="941" loading="lazy" decoding="async" />
            </div>
          </div>
          <ul class="q-reel-list" data-rv>${S.reels.map((r, i) => `
            <li><button class="q-reel" type="button" data-i="${i}" aria-pressed="${i === 0}">
              <b>${String(i + 1).padStart(2, "0")}</b><span>${r.title}</span><small>${r.length}${r.src ? "" : " · coming soon"}</small>
            </button></li>`).join("")}
          </ul>
          <!-- phones: no choosing, the reels one under the other, each in its own player -->
          <ol class="q-stack">${S.reels.filter((r) => r.src).map((r, i) => `
            <li data-rv>
              <span class="q-stack-screen"><video class="work-media" src="${r.src}" poster="${r.poster}" controls playsinline preload="none" aria-label="${r.title} reel"></video></span>
              <p class="q-stack-cap"><b>${String(i + 1).padStart(2, "0")}</b><span>${r.title}</span><small>${r.length}</small></p>
            </li>`).join("")}
          </ol>
        </div>
      </section>

      <section class="q-sec q-photos" id="plain-exhibition" data-loc="exhibition" aria-label="Photos">
        <div class="q-wrap">
          ${head("Photos", "प्रदर्शनी", "Four albums. Open one to walk through it.")}
          <ul class="q-albums">${S.photos.map((p, i) => `
            <li data-rv>
              <button class="photo-frame q-album" type="button" data-i="${i}" aria-label="Open ${p.album ? "album" : "photo"}: ${p.title}, ${photoSub(p, ", ")}">
                <span class="q-album-pic"><img class="work-media" src="${p.cover || p.src}" alt="${p.title}${p.album ? " album cover" : ""}" loading="lazy" decoding="async"${p.pos ? ` style="object-position:${p.pos}"` : ""} /></span>
                <span class="q-album-cap"><span class="q-album-title">${p.title}</span><span class="q-label">${photoSub(p, " · ")}</span></span>
              </button>
            </li>`).join("")}
          </ul>
        </div>
      </section>

      <section class="q-sec q-contact" id="plain-rooftop" data-loc="rooftop" aria-label="Contact">
        <!-- the rooftop, as painted, and him on it with his chai -->
        <div class="q-roof" aria-hidden="true"><div class="q-roof-art">
          <img src="assets/scenes/rooftop.webp" srcset="assets/scenes/rooftop.webp 1672w, assets/scenes/rooftop-2x.webp 3344w" sizes="100vw" alt="" width="1672" height="941" loading="lazy" decoding="async" />
          ${ROOFTOP.hoardings.map(([x, y, w, h], i) => `<i class="q-hoard" style="left:${(x / 16.72).toFixed(2)}%;top:${(y / 9.41).toFixed(2)}%;width:${(w / 16.72).toFixed(2)}%;height:${(h / 9.41).toFixed(2)}%;background-image:url(${S.img(S.projects[i % S.projects.length].cover, 256)})"></i>`).join("")}
          <span class="z-him z-sitter"></span>
        </div></div>
        <div class="q-wrap">
          <div class="q-contact-main">
            <p class="q-label" data-rv>${S.footer.kicker}</p>
            <h2 class="q-big" data-rv>${S.footer.title[0]} <em>${S.footer.title.slice(1).join(" ")}</em></h2>
            <p class="q-line" data-rv>${S.footer.line}</p>
            <p data-rv><a class="q-mail" href="mailto:${S.email}${S.mailSubject ? "?subject=" + encodeURIComponent(S.mailSubject) : ""}">${S.email}</a></p>
            <p class="q-socials" data-rv>${S.socials.map((x) => `<a class="q-link" href="${x.url}" target="_blank" rel="noopener">${x.label} <i aria-hidden="true">↗</i></a>`).join("")}</p>
          </div>
        </div>
        <div class="q-foot"><div class="q-wrap">
          <p>© ${S.year} ${first} Shah</p>
          <p><a class="q-link" href="#plain-street" data-stop="street">Back to top <i aria-hidden="true">↑</i></a><button class="q-link take-ride" type="button">Take the ride <i aria-hidden="true">→</i></button></p>
        </div></div>
      </section>`;
  }

  // Plain hero: the street art at its own pixel size, scaled to cover the hero, so its billboards can
  // be filled with the same perspective mapping the ride uses.
  function fitPlainArt() {
    const hero = $(".plain-hero-bg"), art = $(".plain-art");   // the framed plate the street sits in
    if (!hero || !art) return;
    $$(".plain-art [data-quad]").forEach((el) => mapToQuad(el, STREET.quads[el.dataset.quad], 1));
    const W = hero.clientWidth, H = hero.clientHeight, k = Math.max(W / STREET.w, H / STREET.h);
    // wide screens: the street centred. Phones see only a slice of it, so the slice is the one with the rooftop billboard (as the ride frames it)
    const tx = W < 700 ? Math.min(0, Math.max(W - STREET.w * k, W / 2 - 374 * k)) : (W - STREET.w * k) / 2;
    art.style.transform = `translate(${tx}px, ${(H - STREET.h * k) * 0.3}px) scale(${k})`;
  }

  /* The Simple view's behaviour: the navbar follows the section in view, things pop in as they arrive,
     and a few things answer the visitor: he waves and "Press start" begins the ride, the portrait
     changes face when tapped, the reel buttons change what's on the screen, and the photo viewer steps
     through the photos. With reduced motion everything is simply shown. */
  function watchPlain() {
    const plain = $("#plain");
    const secs = $$("#plain [data-loc]");
    const io = new IntersectionObserver(() => {
      if (body.classList.contains("ride")) return;
      const best = secs.map((el) => [el, el.getBoundingClientRect()])
        .filter(([, r]) => r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.3).pop();
      if (!best) return;
      const loc = best[0].dataset.loc;
      if (loc !== lastLoc) {
        lastLoc = loc; body.dataset.location = loc; markSection(loc);
        const ord = stops.order || [];                    // the line fills up to the section in view
        body.style.setProperty("--route", (Math.max(0, ord.indexOf(loc)) / Math.max(1, ord.length - 1)).toFixed(4));
      }
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
    secs.forEach((el) => io.observe(el));
    addEventListener("resize", fitPlainArt);
    addEventListener("load", fitPlainArt);

    // him, cut out of the same sheet the ride draws him from
    $$(".z-him").forEach((el) => (el.style.backgroundImage = `url(${Sprite.sheet("main")})`));
    // the portrait: tap for another face
    const P = S.about.portrait, face = $(".q-face-img");
    let f = 0;
    face.style.backgroundImage = `url(${P.src})`;
    face.style.backgroundSize = `${P.frames * 100}% 100%`;
    $(".q-face").addEventListener("click", () => { f = (f + 1) % P.frames; face.style.backgroundPosition = `${(f / (P.frames - 1)) * 100}% 0`; });

    // reels: the buttons pick what's on the screen
    const screen = $("#plain-screen");
    const showReel = (i) => {
      const r = S.reels[i];
      screen.innerHTML = r.src
        ? `<video class="work-media" src="${r.src}" poster="${r.poster}" controls playsinline preload="none"></video>`
        : `<img class="work-media" src="${r.poster}" alt="${r.title} poster" />`;
      $$(".q-reel").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
    };
    // one reel at a time, and none once the reels are off screen
    const plainVideos = () => $$("#plain-cinema video");
    pausePlain = () => plainVideos().forEach((v) => v.pause());
    $("#plain-cinema").addEventListener("play", (e) => plainVideos().forEach((v) => { if (v !== e.target) v.pause(); }), true);
    new IntersectionObserver(([e]) => { if (!e.isIntersecting) pausePlain(); }).observe($("#plain-cinema"));
    $$(".q-reel").forEach((b) => b.addEventListener("click", () => showReel(+b.dataset.i)));
    showReel(0);

    if (reduceMotion) return;
    // scroll transitions, cut like a film. Between two sections sits a "cut" (.n-cut): as you scroll into it two
    // black shutters close over the section you are leaving, like a letterbox closing; in the dark the next
    // section's name runs across the screen as a title card; then the shutters open on the next section. Each cut
    // overlaps the sections on both sides by a screen, so it adds little extra scrolling. --a is how far the
    // shutters are open (1 = fully), --q how far through the cut we are. Pictures also drift a little inside their
    // mounts as a section passes (--v). See "Night print" in styles.css.
    const zsecs = $$("#plain > section"), names = { drain: S.about.title, subway: "Selected work", cinema: "Reels", exhibition: "Photos", rooftop: "Say hello" };
    const cuts = zsecs.slice(1).map((sec, k) => {
      const c = document.createElement("div"); c.className = "n-cut"; c.setAttribute("aria-hidden", "true");
      const name = names[sec.dataset.loc] || "", n = String(k + 1).padStart(2, "0");
      c.innerHTML = `<div class="n-stage"><i class="n-rule"></i><b class="n-word">${name}<em>${name}</em></b><span class="n-meta"><b>${n}</b> / ${String(zsecs.length - 1).padStart(2, "0")}</span><span class="n-next">Next <i></i> ${name}</span></div>`;
      sec.before(c); return c;
    });
    let tick = 0, warm = false;
    const cl = (x) => Math.min(1, Math.max(0, x)), CLOSE = 0.3, OPEN = 0.78;
    const wipe = () => {
      tick = 0;
      if (body.classList.contains("ride")) return;
      // the project pictures are fetched as soon as this view is in use, not when each card nears the screen (the film cuts would show them arriving)
      if (!warm) { warm = true; $$(".q-proj img").forEach((im) => { im.loading = "eager"; }); }
      const vh = innerHeight;
      cuts.forEach((c) => {
        const r = c.getBoundingClientRect();
        if (r.bottom < -vh * 0.2 || r.top > vh * 1.2) return;
        const q = cl(-r.top / (r.height - vh));
        c.style.setProperty("--q", q.toFixed(4));
        c.style.setProperty("--a", (q < CLOSE ? 1 - q / CLOSE : q > OPEN ? (q - OPEN) / (1 - OPEN) : 0).toFixed(4));
      });
      zsecs.forEach((el, k) => {
        const r = el.getBoundingClientRect();
        if (r.bottom < -vh || r.top > vh * 2) return;
        if (!k) el.style.setProperty("--out", cl(scrollY / vh).toFixed(3));
        el.style.setProperty("--v", ((r.top + Math.min(r.height, vh) / 2 - vh / 2) / vh).toFixed(3));
      });
    };
    plain.classList.add("wipe-on");
    addEventListener("scroll", () => { if (!tick) tick = requestAnimationFrame(wipe); }, { passive: true });
    addEventListener("resize", wipe); addEventListener("load", wipe); plainSize = wipe; wipe();
    // things pop in as they arrive
    plain.classList.add("rv-on");
    const rv = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("rv-in"); rv.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    $$("#plain [data-rv]").forEach((el) => rv.observe(el));
  }

  /* ================= LAYOUT ================= */
  const L = {}; // layout numbers
  let segs = [], total = 0, stops = {};
  let inHall = false;
  const scrollSign = $(".ride-scroll");
  let pausePlain = () => {};            // the Simple view's players: set in watchPlain
  let pauseReel = () => {};             // set once the cinema's player exists
  let logoRefresh = () => {};           // redraws the logo canvas (set by glitchLogo)
  const logoEl = $(".hud-logo"), heroTags = $(".hero-tags"), streetEl = $("#street");
  let plainSize = () => {};             // re-measures the Simple view (set by watchPlain)

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
    L.ck = Math.max(1, Math.round(((vh * 0.2) / Sprite.STAND) * dpr)); // device px per sheet px: he stands 20% of the screen tall
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
    $("#street .bg-img").style.setProperty("--fade", Math.round(DRAIN.top * ss) + "px");

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
      w: Math.round(SUBWAY.w * ss), h: Math.round(SUBWAY.h * ss), s: ss,
    };
    L.sy = subway.y + Math.round(SUBWAY.floor * ss);                                   // platform feet line
    L.subCamY = Math.min(Math.max(subway.y, L.sy - vh * 0.8), subway.y + subway.h - vh);
    const boards = S.featured().slice(0, SUBWAY.boards.length).map((p, i) => {
      const [x, y, w, h] = SUBWAY.boards[i];
      return { x: Math.round(x * ss), y: Math.round(y * ss), iw: Math.round(w * ss), ih: Math.round(h * ss) };
    });
    // how far the board he stands at grows: as much as the screen has room for (see .billboard.lit)
    L.boardK = SUBWAY.boards.map(([, , w]) => +Math.min(vw > 1100 ? 1.55 : 1.4, (vw - 72) / (w * ss)).toFixed(3));
    $$(".billboard").forEach((el, i) => el.style.setProperty("--k", L.boardK[i] || 1));
    // 4. stairwell: the subway's last frame (the stairs and the cinema lobby above the platform)
    const SA = STAIRWELL;
    const stairwell = { x: subway.x + subway.w, y: subway.y, w: Math.round(SA.w * ss), h: Math.round(SA.h * ss), s: ss };
    {
      const [x, y, w, h] = SA.rails;
      setBox($(".stair-rails"), stairwell.x + Math.round(x * ss), stairwell.y + Math.round(y * ss), Math.round(w * ss), Math.round(h * ss));
    }
    stairwell.px = (x, y) => [stairwell.x + x * ss, stairwell.y + y * ss];
    L.ty = stairwell.px(0, SA.lobby)[1];                   // lobby floor; later scenes share it
    const C = CINEMA;
    // the auditorium is only reached through a cut, so leave a screen of space around it
    const fs = Math.max(vw / C.w, Math.min(vh / C.h, vw / 760));   // phones: fit the screen, not the room
    const fw = Math.round(C.w * fs), fh = Math.round(C.h * fs);
    const front = { x: stairwell.x + stairwell.w + vw, y: stairwell.y, w: Math.max(fw, vw), h: Math.max(fh, vh), s: fs };
    front.ox = Math.round((front.w - fw) / 2); front.oy = Math.round((front.h - fh) / 2);
    const G = GALLERY, R = ROOFTOP;
    // 5b. back stairs: one painting covering the screen, reached by a cut
    const B = BACKSTAIRS, bs = Math.max(vw / B.w, vh / B.h);
    const backstairs = { x: front.x + front.w + vw, y: front.y, w: Math.round(B.w * bs), h: Math.round(B.h * bs), s: bs };
    {
      const [x, y, w, h] = B.rails, [px, py, pw, ph] = B.poster;
      setBox($(".back-rails"), backstairs.x + Math.round(x * bs), backstairs.y + Math.round(y * bs), Math.round(w * bs), Math.round(h * bs));
      const quad = (el, [x, y, w, h]) => mapToQuad(el, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], bs);
      quad($(".back-sign"), B.poster);
      $$(".back-photo").forEach((el, i) => quad(el, B.frames[i]));
      const mood = $(".back-mood");
      if (mood.children.length < 2) mood.insertAdjacentHTML("beforeend",
        B.pools.map((_, i) => `<i class="bm-pool" style="--i:${i}"></i>`).join("") + B.lamps.map((_, i) => `<i class="bm-lamp" style="--i:${i}"></i>`).join(""));
      $$(".bm-pool").forEach((el, i) => { const [x, y, w, h] = B.pools[i]; setBox(el, Math.round(x * bs), Math.round(y * bs), Math.round(w * bs), Math.round(h * bs)); });
      $$(".bm-lamp").forEach((el, i) => { const [x, y, z] = B.lamps[i]; setBox(el, Math.round((x - z / 2) * bs), Math.round((y - z / 2) * bs), Math.round(z * bs), Math.round(z * bs)); });
    }
    // 6. exhibition: a long strip, as tall as the screen
    const gs = vh / G.h;
    const exhibition = { x: backstairs.x + backstairs.w + vw, y: front.y, w: Math.round(G.w * gs), h: vh, s: gs };
    L.gty = exhibition.y + Math.round(G.floor * gs);
    const frames = G.frames.map(([x, y, w, h]) => ({ x: Math.round(x * gs), y: Math.round(y * gs), w: Math.round(w * gs), h: Math.round(h * gs) }));
    // 7. rooftop: one painting covering the screen (wide screens lose some sky, tall ones pan across)
    const rs = Math.max(vw / R.w, vh / R.h);
    const rooftop = { x: exhibition.x + exhibition.w + vw, y: front.y, w: Math.round(R.w * rs), h: Math.round(R.h * rs), s: rs };
    // the final view: the bench in the middle, the roof floor at the bottom of the screen
    L.endCam = { x: rooftop.x + Math.min(Math.max((R.spot[0] + 30) * rs - vw / 2, 0), rooftop.w - vw), y: rooftop.y + rooftop.h - vh };

    {   // the logo at rest (navbar corner), and the scale and shift that put it in the middle of the hero
      logoEl.style.transform = "";
      const r = logoEl.getBoundingClientRect(), w = r.height * (623 / 435);       // its width follows from its height (the art's shape)
      const k = Math.max(1, Math.min((vw * (vw <= 700 ? 0.62 : LOGO_HERO.width)) / w, LOGO_HERO.max / w, (vh * 0.42) / r.height));
      L.logo = { k, x: vw / 2 - (w * k) / 2 - r.left, y: vh * LOGO_HERO.y - (r.height * k) / 2 - r.top };
      // the tags around it: each sits at its data-at spot, kept on screen and clear of the navbar
      const lw = w * k, lh = r.height * k, top = vw <= 700 ? 64 : 84, bottom = vw <= 700 ? 84 : 16;
      $$(".hero-tags .ht").forEach((el) => {
        const [ax, ay] = ((vw <= 700 && el.dataset.atM) || el.dataset.at).split(",").map(Number), tw = el.offsetWidth, th = el.offsetHeight;
        const x = Math.min(vw - tw - 10, Math.max(10, vw / 2 + ax * lw - tw / 2)), y = Math.min(vh - th - bottom, Math.max(top, vh * LOGO_HERO.y + ay * lh - th / 2));
        el.style.left = Math.round(x) + "px"; el.style.top = Math.round(y) + "px";
        el.style.setProperty("--dx", Math.round(ax * 60) + "px"); el.style.setProperty("--dy", Math.round(ay * 60) + "px");   // they drift outward as they leave
      });
      logoAt = -1; dimEls = null;
      logoRefresh();
    }
    Object.assign(L, { street, mh, camStart, camEnd, drain, subway, stairwell, front, backstairs, exhibition, rooftop, boards, frames });

    // place scenes
    for (const [id, s] of Object.entries({ street, drain, subway, stairwell, "cinema-front": front, backstairs, exhibition, rooftop })) {
      setBox($("#" + id), s.x, s.y, s.w, s.h);
    }
    // place content inside scenes
    const art = (el, [x, y, w, h]) => setBox(el, Math.round(x * ss), Math.round(y * ss), Math.round(w * ss), Math.round(h * ss));
    art($("#street .bb-leaves"), STREET.leaves);
    $("#street").style.setProperty("--ss", ss.toFixed(4));    // lets the street's small details scale with the art
    $$("#street [data-art]").forEach((el) => art(el, el.dataset.art.split(",").map(Number)));
    art($("#street .train-track"), STREET.train.track);
    art($("#street .train-posts"), STREET.train.posts);
    $("#street .train-track").style.setProperty("--len", Math.round(STREET.train.len * ss) + "px");
    $("#street .train-track").style.setProperty("--rest", Math.round((STREET.train.rest - STREET.train.len) * ss) + "px");
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
    // station sign: beside the light beam, pulled left on narrow screens so it's in view when he lands
    const signW = SUBWAY.sign[1][0] - SUBWAY.sign[0][0], signX = Math.min(SUBWAY.sign[0][0], (camEnd.x + vw) / ss - signW - 14);
    const sign = SUBWAY.sign.map(([x, y]) => [x - SUBWAY.sign[0][0] + signX, y]);
    mapToQuad($(".station-board"), sign, ss);
    // the wall, platform and tracks are shaded along the stretch with the boards, so the projects stand out
    setBox($(".sub-dim"), Math.round(SUBWAY.dim[0] * ss), 0, Math.round((SUBWAY.dim[1] - SUBWAY.dim[0]) * ss), subway.h);
    $(".sub-dim").style.opacity = SUBWAY.dimBy;
    // "View all projects" plate hangs under the station sign
    {
      const [[x0], [x1], [, y1]] = sign, y = y1 + 9;
      mapToQuad($(".all-projects-sign"), [[x0, y], [x1, y], [x1, y + 26], [x0, y + 26]], ss);
    }
    $$(".billboard").forEach((el, i) => {
      const b = boards[i];
      el.hidden = !b;
      if (b) setBox(el, b.x, b.y, b.iw, b.ih);
      // a dark pane stays on the wall behind it, so the painted blank board never shows when the card comes forward
      let slot = el.previousElementSibling;
      if (!slot || !slot.classList.contains("bb-slot")) { slot = document.createElement("span"); slot.className = "bb-slot"; slot.setAttribute("aria-hidden", "true"); el.before(slot); }
      slot.hidden = !b;
      if (b) setBox(slot, b.x, b.y, b.iw, b.ih);
    });
    // reel posters on the lobby's blank boards
    $$("#stairwell [data-quad]").forEach((el) => {
      const [x, y, w, h] = SA.posters[el.dataset.quad];
      mapToQuad(el, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], ss);
    });
    const F = C.front, fbox = (el, [x, y, w, h]) => setBox(el, Math.round(x * fs), Math.round(y * fs), Math.round(w * fs), Math.round(h * fs));
    setBox($(".front-art"), front.ox, front.oy, fw, fh);
    $(".front-art").style.setProperty("--u", fs.toFixed(3));   // the player's type scales with the hall
    fbox($(".cinema-content"), F.screen);
    fbox($(".screen-glow"), F.screen);
    // the posters stand on the stage front; on tall narrow screens there's room below the hall instead
    const visLeft = Math.min(Math.max(front.ox + 836 * fs - vw / 2, 0), front.w - vw) - front.ox;   // camera's left edge, in art-box px
    if (front.h - front.oy - fh > 140) setBox($(".reel-bar"), visLeft + 12, fh + 10, vw - 24, front.h - front.oy - fh - 20);
    else fbox($(".reel-bar"), F.stage);
    // the seat row sits in front of him, clipped to the bottom of the room
    const rowY = front.y + front.oy + Math.round(F.rowTop * fs);
    setBox($(".front-row"), front.x + front.ox, rowY, fw, front.y + front.oy + fh - rowY);
    $(".front-row img").style.width = fw + "px";
    { const [x, y, w, h] = G.sign; mapToQuad($(".gallery-sign"), [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], gs); }
    $$(".photo").forEach((el, i) => {
      const f = frames[i]; el.hidden = !f;
      if (!f) return;
      setBox(el, f.x, f.y, f.w, f.h);
      const [px, py, pw, phh] = G.plaques[i];
      setBox($(".plaque", el), Math.round(px * gs) - f.x, Math.round(py * gs) - f.y, Math.round(pw * gs), Math.round(phh * gs));
    });
    // rooftop: hoardings on the skyline carry the projects; lights, stars and the far metro are placed from R
    const far = $(".roof-far"), lights = $(".roof-lights"), bulbs = $(".bulbs");
    if (!bulbs.children.length) {
      const box = (cls, a, style = "") => `<i class="${cls}" data-art="${a.join(",")}" style="${style}"></i>`;
      const at = ([x, y], z) => [x - z / 2, y - z / 2, z, z];
      bulbs.innerHTML = R.bulbs.map((b, i) => `<i class="bulb" data-art="${at(b, 30).join(",")}" style="--i:${i}"><b></b></i>`).join("");
      far.insertAdjacentHTML("beforeend",
        R.dots.map((d, i) => box("sky-dot", at(d, 12), `animation-delay:${-(i * 0.73) % 3}s`)).join("")
        + R.stars.map(([x, y, z], i) => box("sky-star", at([x, y], z), `animation-delay:${-i * 0.9}s`)).join("")
        + box("water", R.water) + box("beacon", at(R.beacon, 8)));
      lights.insertAdjacentHTML("beforeend",
        box("roof-pool", R.pool) + box("lamp-glow flick", at(R.lamp, 70)));
    }
    const rart = (el, [x, y, w, h]) => setBox(el, Math.round(x * rs), Math.round(y * rs), Math.round(w * rs), Math.round(h * rs));
    $("#rooftop").style.setProperty("--ss", rs.toFixed(4));
    $$("#rooftop [data-art]").forEach((el) => rart(el, el.dataset.art.split(",").map(Number)));
    rart($(".roof-train"), R.train.track); rart($(".roof-front"), R.train.front);
    $(".roof-train").style.setProperty("--len", Math.round(R.train.len * rs) + "px");
    $(".roof-train").style.setProperty("--rest", "0px");
    $$(".hoarding").forEach((el, i) => { const [x, y, w, h] = R.hoardings[i]; setBox(el, Math.round(x * rs), Math.round(y * rs), Math.round(w * rs), Math.round(h * rs)); });
    // end credits: a column down the left of the final view, clear of the navbar
    {
      const [kx, ky, kw] = R.sky, ex = L.endCam.x - rooftop.x, ey = L.endCam.y - rooftop.y;
      const cl = Math.max(kx * rs, ex + 16);
      setBox($(".credits"), Math.round(cl), Math.round(ey + (vw <= 700 ? 78 : 104)), Math.round(Math.min(Math.max(kw * rs, 520), ex + vw - cl - 16)));
    }

    sprite.width = Sprite.W * L.ck * L.cq; sprite.height = Sprite.H * L.ck * L.cq;
    charEl.style.setProperty("--w", Math.round(Sprite.W * L.cs) + "px");
    charEl.style.setProperty("--h", Math.round(Sprite.H * L.cs) + "px");
    lastKey = "";

    buildPath();
  }

  /* ================= PATH ================= */
  function buildPath() {
    const { vw, vh, gy, sgy, my, street, mh, camStart, camEnd, drain, subway, stairwell, front, backstairs, exhibition, rooftop, subCamY } = L;
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
    add({ id: "open", loc: "street", pose: "open", scale: hs, a: [stand, my], b: [stand, my], len: 130,
      cam: () => ({ x: openX, y: dropCam.y }) });
    add({ id: "hop", loc: "street", pose: "hop", scale: (t) => lerp(hs, 1, ease(t)), a: [stand, my], b: [mh, my], len: 150,
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
    add({ loc: "subway", pose: "land", a: [mh, sy], b: [mh, sy], len: 280, bubble: ["Next stop: Projects!", 0.8, 1],
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
    add({ id: "subwalk", loc: "subway", pose: "walk", railsBehind: true, a: [mh, sy], b: [leave, sy], len: leave - mh, cam: walkCam });
    // past the foot of the stairs, back across the platform to the first step, then up them (they climb
    // to the left) between the railings, a little smaller with every step (the lobby is drawn further away)
    add({ loc: "subway", pose: "walk", railsBehind: true, a: [leave, sy], b: bottom, len: Math.hypot(bottom[0] - leave, bottom[1] - sy), cam: walkCam });
    add({ id: "stairs", loc: "subway", loc2: "cinema", pose: "walk", stairs: true, a: bottom, b: top, scale: (t) => lerp(1, up, t),
      len: CLIMB.strides * CLIMB.px, cam: walkCam });
    // he turns at the top and steps onto the lobby floor: feet ease down the last few px so they don't pop
    add({ loc: "cinema", pose: "walk", ease: "smooth", scale: up, a: top, b: onto, len: Math.max(40, onto[0] - top[0]), cam: walkCam });
    // at the ticket booth he stops and takes the cinema in: a gasp, a delighted look, a grin
    const door = T.px((P.door[0] + P.door[1]) / 2, P.lobby), tkt = T.px(P.ticket, P.lobby);
    const lobbyCam = (p) => clampT({ x: p.x - vw * 0.4, y: lobbyCamY });
    add({ loc: "cinema", pose: "walk", scale: up, a: onto, b: tkt, len: Math.max(40, tkt[0] - onto[0]), cam: walkCam });
    add({ id: "tickets", loc: "cinema", pose: "react", scale: up, a: tkt, b: tkt, len: 320,
      bubble: ["Ek ticket, please!", 0.62, 1], cam: (t, p) => lobbyCam(p) });
    // ...then on past the posters and the popcorn to the red doors
    add({ id: "lobby", loc: "cinema", pose: "walk", scale: up, a: tkt, b: door, len: door[0] - tkt[0],
      cam: (t, p) => lobbyCam(p) });
    L.stairwellPath = [[leave, sy], bottom, top, onto, tkt, door];       // for debug mode
    const tri = (t) => 1 - Math.abs(2 * t - 1);                  // 0 -> 1 -> 0: a cut at the midpoint
    // through the lobby doors: velvet cut into the auditorium, entering by its side door
    const doorCam = lobbyCam({ x: door[0] });
    const fx = (x) => front.x + front.ox + x * fs, fy = front.y + front.oy + F.floor * fs;
    // he stops beside the stage, left of the screen and controls (on phones: the left edge of the view)
    const leftArt = (frontCam.x - front.x - front.ox) / fs;
    const enter = [fx(F.door), fy], spot = [fx(Math.max(F.stand, leftArt + 70)), fy], exit = [fx(F.exit), fy];
    add({ loc: "cinema", pose: "walk", scale: up, a: door, b: enter, len: 260, ease: "cut",
      cut: tri, cam: (t) => (t < 0.5 ? doorCam : frontCam) });
    add({ loc: "cinema", hall: true, pose: "walk", a: enter, b: spot, len: Math.max(160, spot[0] - enter[0]),
      bubble: ["Housefull!", 0.2, 0.9], cam: () => frontCam });
    // turns to the screen and watches (profile, looking up)
    add({ id: "sit", loc: "cinema", hall: true, pose: "watch", face: 1, a: spot, b: spot, len: vh * 1.1, cam: () => frontCam });
    // across the front of the stage and out the right door, then a velvet cut to the gallery
    add({ loc: "cinema", hall: true, pose: "walk", a: spot, b: exit, len: exit[0] - spot[0], cam: () => frontCam });
    // --- gallery (reached from the back stairs, below) ---
    const G = GALLERY, gs = exhibition.s, gty = L.gty, gx = (x) => exhibition.x + x * gs, gk = (G.tall * gs) / (Sprite.STAND * L.cs);
    const gIn = [gx(G.enter[0]), exhibition.y + G.enter[1] * gs], gOut = [gx(G.exit[0]), exhibition.y + G.exit[1] * gs];
    // the gallery's camera follows him, but each frame draws it in: as he nears one, the view eases over until
    // the frame sits in the middle of the screen, and lets go as he walks on (it never loses sight of him)
    const gMid = G.frames.map(([fx, , fw]) => exhibition.x + (fx + fw / 2) * gs), gPull = G.reach * gs;
    const gCam = (x) => {
      let cx = x - vw * 0.4;
      const k = gMid.reduce((b, m, i) => (Math.abs(x - m) < Math.abs(x - gMid[b]) ? i : b), 0), d = Math.abs(x - gMid[k]);
      if (d < gPull) {
        const u = 1 - d / gPull, w = u * u * (3 - 2 * u);
        const want = Math.min(Math.max(gMid[k] - vw / 2, x - vw * 0.86), x - vw * 0.14);
        cx += (want - cx) * w;
      }
      return { x: Math.min(Math.max(cx, exhibition.x), exhibition.x + exhibition.w - vw), y: exhibition.y };
    };
    // --- back stairs, between the hall and the gallery: in by the door under the landing, along the floor
    // past the staircase to its foot, up the first flight (right to left), behind the balustrade to the
    // second flight, up it and along the top landing to the door ---
    {
      const B = BACKSTAIRS, K = backstairs, bs = K.s, at = (x, y) => [K.x + x * bs, K.y + y * bs], k = B.scale;
      const clamp = (v, a, b) => Math.min(Math.max(v, a), Math.max(a, b));
      const bCam = (p) => ({ x: clamp(p.x - vw / 2, K.x, K.x + K.w - vw), y: clamp(p.y - vh * 0.62, K.y, K.y + K.h - vh) });
      const bIn = at(B.door, B.floor), pass = at(B.pass, B.floor), foot = at(...B.flight1[0]), mid = at(...B.flight1[1]);
      const turn = at(...B.flight2[0]), up2 = at(...B.flight2[1]), bOut = at(B.exit, B.top);
      const leg = (a, b, more) => add({ loc: "cinema", pose: "walk", scale: k, a, b, len: Math.max(40, Math.hypot(b[0] - a[0], b[1] - a[1])), cam: (t, p) => bCam(p), ...more });
      add({ loc: "cinema", pose: "walk", railsBehind: true, scale2: k, a: exit, b: bIn, len: 260, ease: "cut",
        cut: tri, cam: (t) => (t < 0.5 ? frontCam : bCam({ x: bIn[0], y: bIn[1] })) });
      leg(bIn, pass, { id: "backstairs", railsBehind: true, bubble: ["Gallery's upstairs!", 0.25, 0.6] });
      leg(pass, foot, { railsBehind: true });
      leg(foot, mid, { stairs: true, strides: B.strides[0], len: B.strides[0] * CLIMB.px });
      leg(mid, turn);
      leg(turn, up2, { stairs: true, strides: B.strides[1], len: B.strides[1] * CLIMB.px });
      leg(up2, bOut);
      // through the door at the top: a cut into the gallery
      add({ loc: "cinema", loc2: "exhibition", pose: "walk", scale: k, scale2: gk, a: bOut, b: gIn, len: 260, ease: "cut",
        cut: tri, cam: (t) => (t < 0.5 ? bCam({ x: bOut[0], y: bOut[1] }) : gCam(gIn[0])) });
    }
    // off the carpet onto the floor, slowly past the photos, then up the carpet to the door out
    const gA = [gIn[0] + 190 * gs, gty], gB = [gOut[0] - 190 * gs, gty];
    add({ loc: "exhibition", pose: "walk", scale: gk, a: gIn, b: gA, len: 190 * gs, cam: (t, p) => gCam(p.x) });
    add({ id: "gallery", loc: "exhibition", pose: "walk", scale: gk, a: gA, b: gB, len: (gB[0] - gA[0]) / 0.7, cam: (t, p) => gCam(p.x) });
    add({ loc: "exhibition", pose: "walk", scale: gk, a: gB, b: gOut, len: 190 * gs, cam: (t, p) => gCam(p.x) });
    // --- rooftop: out of the door into the night, over to the bench under the string lights ---
    const R = ROOFTOP, rs = rooftop.s, rk = (R.tall * rs) / (Sprite.STAND * L.cs), endCam = L.endCam;
    const out = [rooftop.x + R.door[0] * rs, rooftop.y + R.door[1] * rs], bench = [rooftop.x + R.spot[0] * rs, rooftop.y + R.spot[1] * rs];
    const rCam = (p) => ({ x: Math.min(Math.max(p.x - vw * 0.4, rooftop.x), endCam.x), y: endCam.y });
    add({ loc: "exhibition", loc2: "rooftop", pose: "walk", scale: gk, scale2: rk, a: gOut, b: out, len: 260, ease: "cut",
      cut: tri, cam: (t) => (t < 0.5 ? gCam(gOut[0]) : rCam({ x: out[0] })) });
    add({ loc: "rooftop", pose: "walk", scale: rk, a: out, b: bench, len: Math.max(200, (bench[0] - out[0]) * 0.8), cam: (t, p) => rCam(p) });
    add({ loc: "rooftop", pose: "end", scale: rk, a: bench, b: bench, len: 260, bubble: ["Chai break?", 0, 0.1],
      cam: () => endCam });

    const find = (id) => segs.find((s) => s.id === id);
    stops = {
      street: 0,
      drain: find("fall").start + Math.round(find("fall").len * 0.06),
      subway: find("subwalk").start + 2,
      cinema: find("sit").start + 20,
      exhibition: find("gallery").start + Math.max(0, (GALLERY.frames[0][0] - GALLERY.enter[0] - 190) * exhibition.s - vw * 0.2) / 0.7,
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
  const cutEl = $(".cut"), backRails = $(".back-rails"), stairRails = $(".stair-rails");
  let litSince = 0, litBoard = -1, boardEls = [], litPhoto = -1, photoEls = [], finOn = false, logoAt = -1, dimEls = null, lastSl = "";
  const roofEl = $("#rooftop");
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
    let anim = "idle", n = 0, pos = p, mirror = false;     // pos: where he is drawn (the camera follows p)
    const cutSide = s.ease === "cut" && t >= 0.5;          // past the midpoint of a cut
    const poseNow = cutSide && s.pose2 ? s.pose2 : s.pose;
    const loc = s.loc2 && t > (s.ease === "cut" ? 0.5 : 0.55) ? s.loc2 : s.loc;
    const w = Sprite.W * L.cs, h = Sprite.H * L.cs;
    switch (poseNow) {
      case "walk":
        if (s.stairs) {
          // see CLIMB. Going up or coming back down, one stride at a time; the frames face right, so a
          // flight taken to the left is mirrored.
          const up = facing === Math.sign(s.b[0] - s.a[0]), A = up ? s.a : s.b, B = up ? s.b : s.a;
          const N = s.strides || CLIMB.strides, q = Math.min(N - 1e-4, Math.max(0, (up ? t : 1 - t) * N)), k = Math.floor(q), u = q - k, ph = Math.floor(u * 4);
          const F = up ? CLIMB.up : CLIMB.down;
          anim = up ? "climb" : "descend"; mirror = B[0] < A[0];
          n = (k === 0 ? F.first : k % 2 ? F.odd : F.even)[ph];
          if (k === N - 1 && F.last[ph] != null) n = F.last[ph];
          const f = CLIMB.forward, R = CLIMB.rise;
          const fx = u < 0.5 ? u * 2 * f : f + (u - 0.5) * 2 * (1 - f);
          let fy = u <= R[0][0] ? 0 : 1;
          for (let i = 1; i < R.length; i++) if (u > R[i - 1][0] && u <= R[i][0]) fy = R[i - 1][1] + (R[i][1] - R[i - 1][1]) * (u - R[i - 1][0]) / (R[i][0] - R[i - 1][0]);
          pos = { x: A[0] + (B[0] - A[0]) * (k + fx) / N, y: A[1] + (B[1] - A[1]) * (k + fy) / N };
        } else if (moving) {
          anim = running ? "run" : "walk";
          stepPhase += (dt / 1000) * Sprite.fps(anim);
          n = Math.floor(stepPhase);
        } else if (now < poke.until) anim = "cheer";           // he was just clicked
        else if (hoverLook && s.loc === "subway") anim = "wave";
        else if (s.loc === "exhibition") anim = tick(3200) % 4 === 3 ? "front34" : "back";   // looking at the photos
        else if (s.id === "intro" && !saying) anim = tick(700) % 3 === 0 ? "wave" : "front"; // a wave, then a pause
        else if (saying) anim = "front";
        break;
      case "react": anim = t < 0.3 ? "stand" : t < 0.62 ? "cheer" : "grin"; break;
      case "open": anim = "peer"; n = Math.min(2, Math.floor(t * 3)); break;
      case "hop":
        if (t < 0.35) { anim = "stepoff"; n = Math.floor((t / 0.35) * 3); }
        else { anim = "fallStart"; n = Math.min(5, Math.floor(((t - 0.35) / 0.65) * 6)); }
        break;
      case "fall": anim = t >= s.aboutEnter ? "fallEnd" : "fall"; n = tick(t >= s.aboutEnter ? 220 : 110); break;   // legs down once he's through the grate
      case "land":
        if (t < 0.45) { anim = "land"; n = Math.min(5, Math.floor((t / 0.45) * 6)); }
        else anim = t < 0.6 ? "smile" : t < 0.8 ? "glasses" : "grin";
        break;
      case "watch": anim = tick(3200) % 4 === 3 ? "front34" : "back"; break;   // eyes on the screen, now and then a look round
      case "end": anim = "sit"; break;                                          // on the bench with his chai
    }
    const flips = ["walk", "run", "idle"].includes(anim);   // side-on frames face the way he's going
    const grounded = !["fall", "fallStart", "fallEnd", "stepoff", "cheer", "sit"].includes(anim);

    // his other sheets load a scene ahead: the drain's as soon as he sets off down the street (or after a moment's
    // wait there), the stairs' once he is in the drain
    if (loc === "street" ? cur > 4 || now > 3500 : true) Sprite.need("drain");
    if (!drainArt && (loc !== "street" || cur > 4 || now > 3500)) { drainArt = true; needArt("drain"); }   // ...and the drain's painting with it
    if (loc !== "street") Sprite.need("stairs");
    // the scroll sign: from the moment the opening screen's own hint has gone until the ride's last stretch
    scrollSign.classList.toggle("on", cur > L.vh * 0.5 && cur < total - L.vh * 0.6);
    // the reel stops the moment he is out of the hall (hall: the three stretches in front of the screen), whichever door he leaves by
    if (inHall && !s.hall) pauseReel();
    inHall = !!s.hall;
    // location
    if (loc !== lastLoc) {
      artAround(loc);                                     // this place's pictures, and the next place's
      lastLoc = loc;
      body.dataset.location = loc;
      markSection(loc);
    }

    // draw sprite
    const key = anim + (n % Sprite.count(anim));
    if (key !== lastKey) {
      const src = Sprite.frame(anim, n);                   // a cell of his sheet, drawn straight to the canvas
      if (src) {
        lastKey = key;
        const c = sprite.getContext("2d");
        c.imageSmoothingEnabled = true; c.imageSmoothingQuality = "high";
        c.clearRect(0, 0, sprite.width, sprite.height);
        c.drawImage(src.img, src.x, src.y, src.w, src.h, 0, 0, sprite.width, sprite.height);
      }
    }
    if (loc === "street") {   // keep the hero spotlight on him (street coords = world coords)
      const dim = $(".street-dim");
      dim.style.setProperty("--hx", Math.round(p.x) + "px");
      dim.style.setProperty("--hy", Math.round(p.y - h * L.hs * 0.5) + "px");
    }
    const sc = cutSide ? s.scale2 : s.scale;               // cuts can change his scale on the far side
    const scale = (typeof sc === "function" ? sc(t) : sc) || 1;
    const bob = Sprite.bob(anim, n) * L.cs * scale;        // the walk's rise and fall
    charEl.style.transform = `translate3d(${Math.round(pos.x - w / 2)}px, ${Math.round(pos.y - h + bob)}px, 0)` + (scale !== 1 ? ` scale(${scale.toFixed(3)})` : "");
    charEl.style.setProperty("--face", mirror ? -1 : flips ? facing : 1);
    // the board he is standing at lights up and comes forward
    let lit = -1;
    if (loc === "subway" && !cutSide) {
      const ax = (p.x - L.subway.x) / L.subway.s;
      SUBWAY.boards.forEach(([bx, , bw], i) => { const d = Math.abs(ax - (bx + bw / 2)); if (d < SUBWAY.reach && (lit < 0 || d < Math.abs(ax - (SUBWAY.boards[lit][0] + SUBWAY.boards[lit][2] / 2)))) lit = i; });
    }
    // the lit board holds still in the middle of the screen while he walks on beneath it: it eases there from its
    // place on the wall once, then stays exactly put (the wall slides by behind it)
    if (lit !== litBoard) litSince = now;
    if (lit >= 0 && boardEls[lit]) {
      const [bx, , bw] = SUBWAY.boards[lit], at = L.subway.x + (bx + bw / 2) * L.subway.s - cam.x;
      const u = Math.min(1, (now - litSince) / 420), e = 1 - Math.pow(1 - u, 3);
      boardEls[lit].style.setProperty("--sx", ((L.vw / 2 - at) * e).toFixed(1) + "px");
    }
    if (lit !== litBoard) { litBoard = lit; boardEls.forEach((el, i) => el.classList.toggle("lit", i === lit)); $("#subway").classList.toggle("has-lit", lit >= 0); }   // ...and the station falls darker around it
    // ...and in the gallery, the photo he is standing at gets the brightest picture light
    let litP = -1;
    if (loc === "exhibition" && !cutSide) {
      const ax = p.x - L.exhibition.x, near = (i) => Math.abs(ax - (L.frames[i].x + L.frames[i].w / 2));
      L.frames.forEach((f, i) => { if (near(i) < GALLERY.reach * L.exhibition.s && (litP < 0 || near(i) < near(litP))) litP = i; });
    }
    if (litP !== litPhoto) { litPhoto = litP; photoEls.forEach((el, i) => el.classList.toggle("lit", i === litP)); $("#exhibition").classList.toggle("has-lit", litP >= 0); }   // ...and the room falls darker around it
    // the logo: large in the middle of the hero until he sets off, then it travels to its navbar corner
    {
      const g = segs[1], u = Math.min(1, Math.max(0, (cur - g.start) / (g.len * LOGO_HERO.over))), e = 1 - u * u * (3 - 2 * u);
      if (e !== logoAt) {
        logoAt = e;
        const k = 1 + (L.logo.k - 1) * e;
        logoEl.style.transform = e ? `translate(${(L.logo.x * e).toFixed(1)}px, ${(L.logo.y * e).toFixed(1)}px) scale(${k.toFixed(4)})` : "";
        const sl = (2.8 / Math.sqrt(k)).toFixed(1); if (sl !== lastSl) { lastSl = sl; logoEl.style.setProperty("--sl", sl + "px"); }   // scanline pitch: grows only gently with the logo
        logoEl.classList.toggle("hero", e > 0.5);
        heroTags.style.setProperty("--e", e.toFixed(3));
        if (!dimEls) dimEls = [...streetEl.querySelectorAll(".hero-dim, .street-lights, .bb-show, .win-off")];
        dimEls.forEach((el) => el.style.setProperty("--e", e.toFixed(3)));   // the street dims behind the title card (set only where it is used, so the whole street is not restyled every frame)
        heroTags.classList.toggle("off", e < 0.5);
      }
    }
    // the finale: once he sits, the roof goes dark and the lights come on (see .fin in styles.css)
    const fin = s.pose === "end" && t > 0.12;
    if (fin !== finOn) { finOn = fin; roofEl.classList.toggle("fin", fin); }
    backRails.classList.toggle("behind", !!s.railsBehind);   // on the floor he passes in front of the staircase
    stairRails.classList.toggle("behind", !!s.railsBehind);
    charEl.style.setProperty("--inv", (1 / scale).toFixed(3));   // the speech bubble keeps its own size

    charEl.classList.toggle("no-shadow", !grounded);

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
    if (now < poke.until) say = poke.text;
    if (bubble.textContent !== say) bubble.textContent = say;
    bubble.classList.toggle("show", !!say);


    // route progress: how far along the line between stops
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
      if (stop === "street" && instant) scrollTo(0, 0);                 // the very top, at once (a change of view)
      else if (el) {
        const top = el.getBoundingClientRect().top + scrollY;
        scrollTo({ top, behavior: instant || reduceMotion ? "auto" : "smooth" });
      }
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
    markView(ride);
    pauseReel(); pausePlain();
    requestAnimationFrame(() => adRefresh.forEach((f) => f()));
    if (ride) { artAround(lastLoc || "street"); restOfArt(); }
    store.set("view-mode", ride ? "ride" : "static");
    if (!ride) { logoEl.style.transform = ""; logoEl.classList.remove("hero"); logoAt = -1; }
    if (!ride) { world.style.transform = ""; body.dataset.location = "street"; requestAnimationFrame(() => { fitPlainArt(); plainSize(); }); }
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
      setMode(ride);
      // a change of view always starts over at the hero
      history.replaceState(null, "", location.pathname + location.search);
      lastLoc = null;                                                    // so the bar re-marks where he is (Home)
      requestAnimationFrame(() => { goTo("street", true); if (!ride) { body.dataset.location = "street"; markSection("street"); } });
    };
    $$(".view-switch button").forEach((b) => b.addEventListener("click", () => {
      if ((b.dataset.view === "ride") !== body.classList.contains("ride")) toggleRide();
    }));
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

    // reels: the screen is the player, the posters on the stage pick the reel
    const ICON = {
      play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
      pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
      sound: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/></svg>',
      muted: '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9zm18.5.9-1.4-1.4-2.6 2.6-2.6-2.6-1.4 1.4 2.6 2.6-2.6 2.6 1.4 1.4 2.6-2.6 2.6 2.6 1.4-1.4-2.6-2.6z"/></svg>',
      full: '<svg viewBox="0 0 24 24"><path d="M5 5h5v2H7v3H5zm9 0h5v5h-2V7h-3zM5 14h2v3h3v2H5zm12 0h2v5h-5v-2h3z"/></svg>',
    };
    let reel = 0, muted = false, wake;
    const media = $("#screen-media"), player = $(".player"), seek = $("#reel-seek");
    const video = () => $("video", media);
    const clock = (t) => (isFinite(t) ? `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}` : "0:00");
    // bring the controls in line with the video's state
    const sync = () => {
      const v = video(), r = S.reels[reel], playing = !!v && !v.paused && !v.ended;
      player.classList.toggle("playing", playing);
      player.classList.toggle("empty", !v);
      $("#reel-play").setAttribute("aria-label", v ? (playing ? "Pause" : "Play") + " " + r.title : r.title + ": coming soon");
      $(".player-big").innerHTML = playing ? ICON.pause : ICON.play;
      $("#reel-mute").innerHTML = muted ? ICON.muted : ICON.sound;
      $("#reel-mute").setAttribute("aria-label", muted ? "Turn sound on" : "Mute");
      const p = v && v.duration ? v.currentTime / v.duration : 0;
      seek.value = Math.round(p * 1000); seek.style.setProperty("--p", (p * 100).toFixed(1) + "%");
      $("#reel-time").textContent = v && v.duration ? `${clock(v.currentTime)} / ${clock(v.duration)}` : r.length;
    };
    const showReel = (i, play) => {
      reel = (i + S.reels.length) % S.reels.length;
      const r = S.reels[reel];
      media.innerHTML = r.src
        ? `<video class="work-media" src="${r.src}" poster="${r.poster}" playsinline preload="metadata"></video>`
        : `<img class="work-media" src="${r.poster}" alt="${r.title} (placeholder poster)" />`;
      $("#reel-title").textContent = r.title;
      $$(".reel-poster").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === reel)));
      const v = video();
      if (v) {
        v.muted = muted;
        ["play", "pause", "timeupdate", "loadedmetadata", "ended"].forEach((e) => v.addEventListener(e, sync));
        if (play) v.play().catch(() => {});
      }
      sync();
    };
    const toggleReel = () => {
      const v = video();
      if (!v) { media.classList.remove("flicker"); void media.offsetWidth; media.classList.add("flicker"); return; }
      v.paused || v.ended ? v.play().catch(() => {}) : v.pause();
    };
    pauseReel = () => video()?.pause();
    $("#reel-full").innerHTML = ICON.full;
    showReel(0);
    $$(".reel-poster").forEach((b) => b.addEventListener("click", () => showReel(+b.dataset.i, true)));   // pick a reel: it starts
    $("#reel-play").addEventListener("click", toggleReel);
    seek.addEventListener("input", () => { const v = video(); if (v && v.duration) { v.currentTime = (seek.value / 1000) * v.duration; sync(); } });
    $("#reel-mute").addEventListener("click", () => { muted = !muted; const v = video(); if (v) v.muted = muted; sync(); });
    $("#reel-full").addEventListener("click", () => {
      const v = video();
      if (v) (v.requestFullscreen || v.webkitRequestFullscreen || v.webkitEnterFullscreen)?.call(v);
    });
    document.addEventListener("fullscreenchange", () => { const v = video(); if (v) v.controls = document.fullscreenElement === v; });
    // while a reel plays the controls step back; any movement over the screen brings them forward
    const awake = () => { player.classList.add("awake"); clearTimeout(wake); wake = setTimeout(() => player.classList.remove("awake"), 2200); };
    ["pointermove", "pointerdown", "focusin"].forEach((e) => player.addEventListener(e, awake));

    // lightbox: one picture, large. It steps through a set: the gallery's frames (an album shows as its cover),
    // or, when opened from inside an album, that album's pictures.
    const lb = $("#lightbox"), al = $("#album");
    let li = 0, set = [], lastFocus = null, albumFocus = null, tx = null;
    const frames = S.photos.map((p, k) => ({ p, k, src: p.src }));
    function show(i) {
      li = (i + set.length) % set.length;
      const { p, src, n } = set[li];
      $("#lb-img").src = src; $("#lb-img").alt = n != null ? `${p.title}, ${n + 1} of ${set.length}` : p.title;
      $("#lb-cap").innerHTML = `<b>${p.title}</b><span>${n != null ? `${n + 1} / ${set.length}` : photoSub(p)}</span>`;
    }
    function enlarge(list, i) { lastFocus = document.activeElement; set = list; show(i); lb.hidden = false; body.classList.add("lb-open"); $(".lb-close").focus(); }
    function close() { lb.hidden = true; if (al.hidden) body.classList.remove("lb-open"); lastFocus?.focus(); }
    // a frame was clicked: an album opens as a grid, a single photo opens large
    function openLightbox(photo) { S.photos[photo].album ? openAlbum(photo) : enlarge(frames, photo); }
    function openAlbum(k) {
      const p = S.photos[k], list = p.album.map((src, n) => ({ p, k, src, n }));
      albumFocus = document.activeElement;
      $("#album-kick").textContent = `${p.note ? p.note + " · " : ""}Album · ${list.length} ${p.note ? "pictures" : "photographs"}`; $("#album-title").textContent = p.title;
      const cells = list.map((x, n) => `<button type="button" data-n="${n}" style="--i:${n}" aria-label="Enlarge picture ${n + 1} of ${list.length}"><img src="${x.src}" alt="" loading="${n < 6 ? "eager" : "lazy"}" decoding="async" draggable="false" /></button>`);
      // an album with a feature: its first picture stands large in a column of its own, the rest are the grid beside it
      $("#album-grid").classList.toggle("has-feature", !!p.feature);
      $("#album-grid").innerHTML = p.feature ? `<div class="album-feature">${cells[0]}</div><div class="album-rest">${cells.slice(1).join("")}</div>` : cells.join("");
      $$("#album-grid button").forEach((b) => b.addEventListener("click", () => enlarge(list, +b.dataset.n)));
      al.hidden = false; al.scrollTop = 0; body.classList.add("lb-open"); $(".album-close").focus();
    }
    function closeAlbum() { al.hidden = true; body.classList.remove("lb-open"); albumFocus?.focus(); }
    $(".album-close").addEventListener("click", closeAlbum);
    al.addEventListener("click", (e) => { if (e.target === al || e.target.id === "album-grid" || e.target.classList.contains("album-rest")) closeAlbum(); });
    $(".lb-close").addEventListener("click", close);
    $(".lb-prev").addEventListener("click", () => show(li - 1));
    $(".lb-next").addEventListener("click", () => show(li + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb || e.target.classList.contains("lb-frame")) close(); });
    addEventListener("keydown", (e) => {
      if (lb.hidden) { if (!al.hidden && e.key === "Escape") closeAlbum(); return; }
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
    const links = $$(".route a[data-stop]"), at = links.findIndex((a) => a.dataset.stop === loc || a.dataset.also === loc);   // Play covers the cinema and the gallery
    links.forEach((a, i) => {
      a.classList.toggle("here", i === at);
      i === at ? a.setAttribute("aria-current", "location") : a.removeAttribute("aria-current");
    });
  }
  // Ride | Simple switch
  function markView(ride) {
    $$(".view-switch button").forEach((b) => b.setAttribute("aria-pressed", String((b.dataset.view === "ride") === ride)));
  }

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
      // (dpr here includes the logo's largest size in the hero, so it stays sharp when enlarged)
      const dpr = (window.devicePixelRatio || 1) * ((L.logo && L.logo.k) || 1), h = link.clientHeight || 58, w = Math.round(h * img.width / img.height);
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); c.style.width = w + "px"; }
      return dpr;
    };
    const clean = () => { size(); const g = c.getContext("2d"); g.imageSmoothingQuality = "high"; g.clearRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height); };
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
    logoRefresh = () => img.complete && img.naturalWidth && !timer && clean();
    img.src = "assets/brand/logo-source.png";
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
      if (target.closest("a, button, input, .hud, .lightbox, .album")) return false;
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
      if (!body.classList.contains("scroll-cursor-on") || e.target.closest?.("a, button, input")) return;   // never on a real control
      e.preventDefault();
      if (body.classList.contains("ride")) scrollBy({ top: innerHeight * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
      else goTo("drain");                                                  // plain page: to About
      setTimeout(update, 50);
    });
  }

  /* ================= BOOT ================= */
  fillContent();
  scrollCursor();
  watchPlain();
  glitchLogo();
  bindUI();
  const saved = store.get("view-mode");
  const ride = saved ? saved === "ride" : !reduceMotion;
  body.classList.toggle("ride", ride);
  body.classList.toggle("static", !ride);
  markView(ride);
  if ("scrollRestoration" in history && location.hash) history.scrollRestoration = "manual";
  layout();
  adRefresh.forEach((f) => f());   // (the boards of the view in use, now that it is known)
  // the rest of the ride's pictures, in the order of the journey, from the moment the intro lifts (the opening
  // screen has what it needs by then) or the page has loaded, whichever is first
  const startArt = () => { if (body.classList.contains("ride")) restOfArt(); };
  if (document.readyState === "complete" || !body.classList.contains("preloading")) startArt();
  else { addEventListener("preloader:done", startArt, { once: true }); addEventListener("load", startArt, { once: true }); }

  let rt, lastW = innerWidth, lastH = innerHeight;
  const coarse = matchMedia("(pointer: coarse)").matches;
  addEventListener("resize", () => {
    clearTimeout(rt);
    // a phone's toolbar sliding away or back changes only the height, many times in one scroll: laying the ride
    // out again each time (and moving the page to match) made it jump, so on touch screens that is ignored
    if (coarse && innerWidth === lastW && Math.abs(innerHeight - lastH) < 160) return;
    lastW = innerWidth; lastH = innerHeight;
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
