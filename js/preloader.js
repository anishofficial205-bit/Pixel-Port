/* ------------------------------------------------------------------
   PRELOADER: READY? SET... GO! -> logo -> pixel dissolve into the street
   Runs straight after its markup at the top of <body>, so it covers the page from the first frame.
   Plays once per browser session (add ?intro to the URL to see it again), is skipped when arriving
   on a #link (e.g. back from a project page), and any click or key skips ahead.
------------------------------------------------------------------- */
(function () {
  const T = { ready: 350, set: 1150, go: 1950, logo: 2750, minHold: 900, maxWait: 6000, dissolve: 850, block: 40, blockTime: 170 };
  const el = document.getElementById("preloader");
  const body = document.body;
  const q = (s) => el.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seen = (() => { try { return sessionStorage.getItem("nb-intro") === "1"; } catch (e) { return false; } })();
  const force = /[?&]intro\b/.test(location.search);

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    el.remove();
    body.classList.remove("preloading");
    try { sessionStorage.setItem("nb-intro", "1"); } catch (e) { /* ignore */ }
    window.dispatchEvent(new Event("preloader:done"));
  };

  if (!force && (seen || location.hash)) { finish(); return; }

  // raindrops on the glass: pixel beads that sit, then run down leaving a short trail
  (function rain() {
    if (reduce) return;
    const c = el.querySelector(".pl-rain"), g = c.getContext("2d"), P = 3;       // one "pixel" = 3 css px
    const size = () => { c.width = Math.ceil(innerWidth / P); c.height = Math.ceil(innerHeight / P); };
    size(); addEventListener("resize", size);
    const drops = Array.from({ length: 90 }, () => newDrop(true));
    function newDrop(anywhere) {
      return { x: Math.random() * c.width, y: anywhere ? Math.random() * c.height : -4, r: Math.random() < 0.25 ? 2 : 1,
               v: 0, wait: Math.random() * 120, fast: Math.random() < 0.35 };
    }
    const step = () => {
      if (!el.isConnected || el.classList.contains("dissolving")) return;
      g.clearRect(0, 0, c.width, c.height);
      for (const d of drops) {
        if (d.wait > 0) d.wait--; else d.v = Math.min(d.fast ? 2.2 : 0.9, d.v + 0.05);
        d.y += d.v;
        if (d.y > c.height + 4) Object.assign(d, newDrop(false));
        const trail = Math.min(18, d.v * 9) | 0;
        g.fillStyle = "rgba(210, 225, 255, 0.10)";
        g.fillRect(d.x | 0, (d.y - trail) | 0, 1, trail);                        // wet trail
        g.fillStyle = "rgba(225, 235, 255, 0.55)";
        g.fillRect(d.x | 0, d.y | 0, d.r, d.r + 1);                               // the bead
        g.fillStyle = "rgba(255, 255, 255, 0.8)";
        g.fillRect(d.x | 0, d.y | 0, 1, 1);                                       // its highlight
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  })();

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

  if (reduce) {   // no countdown: show the logo, then fade out
    q(".pl-logo").style.opacity = 1;
    ready.then(() => { el.style.transition = "opacity 0.4s"; el.style.opacity = 0; setTimeout(finish, 450); });
    return;
  }

  const timers = [];
  const at = (ms, f) => timers.push(setTimeout(f, ms));
  const lights = el.querySelectorAll(".pl-lights i");
  // each word replaces the last one outright, so they never overlap even if an animation runs late
  const word = (w) => el.querySelectorAll(".pl-word").forEach((x) => {
    const me = x.dataset.w === w;
    x.classList.toggle("show", me); x.classList.toggle("gone", !me && x.classList.contains("seen"));
    if (me) x.classList.add("seen");
  });

  at(T.ready, () => { lights[0].classList.add("on"); word("ready"); });
  at(T.set, () => { lights[1].classList.add("on"); word("set"); });
  at(T.go, () => { lights[2].classList.add("on"); word("go"); el.classList.add("flash"); });
  at(T.logo, () => {
    q(".pl-lights").style.visibility = "hidden";
    el.querySelectorAll(".pl-word").forEach((x) => x.classList.add("gone"));
    q(".pl-logo").classList.add("show");
    let done = false;
    ready.then(() => (done = true));
    setTimeout(() => { if (!done) q(".pl-bar").classList.add("show"); }, 500);   // only if we're still waiting
    Promise.all([ready, new Promise((r) => setTimeout(r, T.minHold))]).then(reveal);
  });

  // Organised pixel transition: a grid of blocks covers the screen, then a diagonal wave sweeps from the
  // top-left corner. Each block flashes saffron as the wave front reaches it and shrinks away in four
  // steps, so the street appears behind a neat, stepped diagonal edge.
  let revealing = false;
  function reveal() {
    if (revealing || finished) return;
    revealing = true;
    timers.forEach(clearTimeout);
    q(".pl-logo").classList.add("out");
    setTimeout(() => {
      const c = q(".pl-blocks"), g = c.getContext("2d");
      const W = (c.width = innerWidth), H = (c.height = innerHeight), B = T.block;
      const cols = Math.ceil(W / B), rows = Math.ceil(H / B), span = cols + rows - 2 || 1;
      g.fillStyle = "#120A26"; g.fillRect(0, 0, W, H);                  // cover first, so nothing flashes through
      el.classList.add("dissolving");
      const sweep = T.dissolve - T.blockTime, t0 = performance.now();
      const frame = (now) => {
        const t = now - t0;
        g.clearRect(0, 0, W, H);
        let alive = 0;
        for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
          const p = (t - ((k + r) / span) * sweep) / T.blockTime;          // this block's own progress
          if (p >= 1) continue;
          alive++;
          const step = p <= 0 ? 0 : Math.min(4, 1 + Math.floor(p * 4));     // 0 = whole, 1-4 = shrinking
          const size = B * (1 - step / 4.5), off = (B - size) / 2;
          g.fillStyle = step === 0 ? "#120A26" : step === 1 ? "#FF9933" : step === 2 ? "#FF3D9A" : "#2A0F3E";
          g.fillRect(k * B + off, r * B + off, size, size);
        }
        if (alive) requestAnimationFrame(frame); else finish();
      };
      requestAnimationFrame(frame);
      setTimeout(finish, T.dissolve + 600);   // safety: background tabs pause animation frames
    }, 280);
  }

  // skip: jump straight to the reveal
  const skip = () => { if (finished) return; if (!revealing) { ready.then(reveal); q(".pl-logo").classList.add("show"); } };
  el.addEventListener("click", skip);
  addEventListener("keydown", skip, { once: true });
})();
