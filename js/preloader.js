/* ------------------------------------------------------------------
   PRELOADER: an arcade cabinet; READY? SET... GO! on its screen as the camera pushes in on every beat,
   then the logo, then a radial pixel reveal of the street
   Runs straight after its markup at the top of <body>, so it covers the page from the first frame.
   Plays on every load and refresh; skipped when returning to a billboard from a project page
   (#project-…) or via the browser's back/forward buttons. Any click or key skips ahead. ?intro forces it, ?intro=3 = slow-mo.
------------------------------------------------------------------- */
(function () {
  const T = { ready: 250, set: 800, go: 1350, logo: 1900, minHold: 650, maxWait: 6000, dissolve: 700, block: 36, blockTime: 160 };
  // Arcade art (assets/preloader/arcade.webp, 1672 x 941): the CRT's centre and height, in art px
  const ART = { w: 1672, h: 941, cabinetW: 560, screen: { cx: 848, cy: 332, h: 222, w: 312 } };
  // camera per beat: [zoom, pull]. zoom 0 = the widest shot (the room, or on phones the whole cabinet),
  // 1 = closest (the CRT fills most of the view but never overflows it). pull = how far the CRT has moved
  // to the middle of the screen.
  const SHOTS = { start: [0, 0], ready: [0.18, 0.3], set: [0.34, 0.5], go: [0.5, 0.7], logo: [0.6, 0.85] };
  const el = document.getElementById("preloader");
  const body = document.body;
  const q = (s) => el.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // plays on every load and refresh; skipped when returning via the back button or a #link
  const nav = (performance.getEntriesByType && performance.getEntriesByType("navigation")[0]) || {};
  const returning = nav.type === "back_forward";
  const force = /[?&]intro\b/.test(location.search);
  // ?intro=3 plays the countdown three times slower (handy for reviewing it)
  const slow = +(new URLSearchParams(location.search).get("intro")) || 1;
  if (slow > 1) { ["ready", "set", "go", "logo", "minHold"].forEach((k) => (T[k] *= slow)); el.style.setProperty("--slow", slow); }

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    el.remove();
    body.classList.remove("preloading");
    window.dispatchEvent(new Event("preloader:done"));
  };

  // skip only when coming back to a billboard from a project page, or via back/forward;
  // a refresh always plays it, whatever section tag (#street, #drain…) the address carries
  const toBillboard = location.hash.startsWith("#project-");
  if (!force && nav.type !== "reload" && (returning || toBillboard)) { finish(); return; }

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  scrollTo(0, 0);

  // what the first screen needs before we reveal it
  const need = [
    new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = "assets/scenes/street.webp"; }),
    new Promise((r) => { const i = new Image(); i.onload = i.onerror = r; i.src = "assets/brand/logo.png"; }),
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ];
  let loaded = 0;
  need.forEach((p) => p.then(() => { loaded++; q(".pl-bar").style.setProperty("--p", loaded / need.length); }));
  const ready = Promise.race([Promise.all(need), new Promise((r) => setTimeout(r, T.maxWait))]);

  if (reduce) {   // no countdown or camera moves: the cabinet with the logo on its screen, then a fade
    const cover = Math.max(innerWidth / 1672, innerHeight / 941);
    q(".pl-scene").style.transform = `translate(${(innerWidth - 1672 * cover) / 2}px, ${(innerHeight - 941 * cover) / 2}px) scale(${cover})`;
    q(".pl-logo").style.opacity = 1;
    ready.then(() => { el.style.transition = "opacity 0.4s"; el.style.opacity = 0; setTimeout(finish, 450); });
    return;
  }

  // camera: the scene covers the viewport at zoom 1; each beat pushes in toward the CRT
  const scene = q(".pl-scene");
  let shot = "start";
  const camera = (name) => {
    shot = name || shot;
    const vw = innerWidth, vh = innerHeight, S = ART.screen;
    const cover = Math.max(vw / ART.w, vh / ART.h);
    const zMin = Math.min(1, (vw * 0.96) / (ART.cabinetW * cover));                     // phones: fit the cabinet
    const zMax = Math.max(zMin, Math.min((vh * 0.7) / (S.h * cover), (vw * 0.92) / (S.w * cover)));
    const [f, k] = SHOTS[shot];
    const s = cover * (zMin + (zMax - zMin) * f);
    const x0 = (vw - ART.w * cover) / 2 + S.cx * cover, y0 = (vh - ART.h * cover) / 2 + S.cy * cover;   // CRT centre at zoom 1
    const cx = x0 + (vw / 2 - x0) * k, cy = y0 + (vh / 2 - y0) * k;                                       // where it goes now
    scene.style.transform = `translate(${cx - S.cx * s}px, ${cy - S.cy * s}px) scale(${s})`;
  };
  scene.style.transition = "none"; camera("start"); void scene.offsetWidth; scene.style.transition = "";
  addEventListener("resize", () => camera());

  const timers = [];
  const at = (ms, f) => timers.push(setTimeout(f, ms));
  const lights = el.querySelectorAll(".pl-lights i");
  // each word replaces the last one outright, so they never overlap even if an animation runs late
  const word = (w) => el.querySelectorAll(".pl-word").forEach((x) => {
    const me = x.dataset.w === w;
    x.classList.toggle("show", me); x.classList.toggle("gone", !me && x.classList.contains("seen"));
    if (me) x.classList.add("seen");
  });

  at(T.ready, () => { camera("ready"); lights[0].classList.add("on"); word("ready"); });
  at(T.set, () => { camera("set"); lights[1].classList.add("on"); word("set"); });
  at(T.go, () => { camera("go"); lights[2].classList.add("on"); word("go"); el.classList.add("flash"); });
  at(T.logo, () => {
    camera("logo");
    q(".pl-lights").style.visibility = "hidden";
    el.querySelectorAll(".pl-word").forEach((x) => x.classList.add("gone"));
    q(".pl-logo").classList.add("show");
    let done = false;
    ready.then(() => (done = true));
    setTimeout(() => { if (!done) q(".pl-bar").classList.add("show"); }, 500);   // only if we're still waiting
    Promise.all([ready, new Promise((r) => setTimeout(r, T.minHold))]).then(reveal);
  });

  // Radial pixel transition: a grid of blocks covers the screen, then a ring grows from the centre.
  // Each block flashes amber, then red, as the ring reaches it and shrinks away in four steps,
  // so the street opens up from the middle behind a stepped circular edge.
  let revealing = false;
  function reveal() {
    if (revealing || finished) return;
    revealing = true;
    timers.forEach(clearTimeout);
    q(".pl-logo").classList.add("out");
    setTimeout(() => {
      const c = q(".pl-blocks"), g = c.getContext("2d");
      const W = (c.width = innerWidth), H = (c.height = innerHeight), B = T.block;
      const cols = Math.ceil(W / B), rows = Math.ceil(H / B);
      const mx = (cols - 1) / 2, my = (rows - 1) / 2, far = Math.hypot(mx, my) || 1;
      g.fillStyle = "#120A26"; g.fillRect(0, 0, W, H);                  // cover first, so nothing flashes through
      el.classList.add("dissolving");
      const sweep = T.dissolve - T.blockTime, t0 = performance.now();
      const frame = (now) => {
        const t = now - t0;
        g.clearRect(0, 0, W, H);
        let alive = 0;
        for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
          const p = (t - (Math.hypot(k - mx, r - my) / far) * sweep) / T.blockTime;   // this block's own progress
          if (p >= 1) continue;
          alive++;
          const step = p <= 0 ? 0 : Math.min(4, 1 + Math.floor(p * 4));     // 0 = whole, 1-4 = shrinking
          const size = B * (1 - step / 4.5), off = (B - size) / 2;
          g.fillStyle = step === 0 ? "#120A26" : step === 1 ? "#FFC24A" : step === 2 ? "#D8261C" : "#101A4A";
          g.fillRect(k * B + off, r * B + off, size, size);
        }
        if (alive) requestAnimationFrame(frame); else finish();
      };
      requestAnimationFrame(frame);
      setTimeout(finish, T.dissolve + 600);   // safety: background tabs pause animation frames
    }, 200);
  }

  // skip: jump straight to the reveal
  const skip = () => { if (finished) return; if (!revealing) { ready.then(reveal); q(".pl-logo").classList.add("show"); } };
  el.addEventListener("click", skip);
  addEventListener("keydown", skip, { once: true });
})();
