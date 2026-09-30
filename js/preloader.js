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

  // pixel starfield in the sky (two layers that twinkle out of step)
  const stars = (n) => Array.from({ length: n }, () => {
    const x = Math.round(Math.random() * innerWidth), y = Math.round(Math.random() * innerHeight * 0.5);
    return `${x}px ${y}px 0 ${Math.random() < 0.15 ? "#FFC21A" : "rgba(244,230,208,0.85)"}`;
  }).join(",");
  el.style.setProperty("--stars", stars(70)); el.style.setProperty("--stars2", stars(50));
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
