/* ------------------------------------------------------------------
   PRELOADER: READY? SET... GO! -> logo -> pixel dissolve into the street
   Runs straight after its markup at the top of <body>, so it covers the page from the first frame.
   Plays once per browser session (add ?intro to the URL to see it again), is skipped when arriving
   on a #link (e.g. back from a project page), and any click or key skips ahead.
------------------------------------------------------------------- */
(function () {
  const T = { ready: 350, set: 1150, go: 1950, logo: 2750, minHold: 900, maxWait: 6000, dissolve: 800, block: 28 };
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

  // pixel dissolve: the screen breaks into blocks that flash and vanish in random order
  let revealing = false;
  function reveal() {
    if (revealing || finished) return;
    revealing = true;
    timers.forEach(clearTimeout);
    q(".pl-logo").classList.add("out");
    setTimeout(() => {
      const c = q(".pl-blocks"), g = c.getContext("2d");
      const W = (c.width = innerWidth), H = (c.height = innerHeight), B = T.block;
      const cols = Math.ceil(W / B), rows = Math.ceil(H / B), n = cols * rows;
      g.fillStyle = "#120A26"; g.fillRect(0, 0, W, H);
      el.classList.add("dissolving");
      const order = [...Array(n).keys()];
      for (let i = n - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [order[i], order[j]] = [order[j], order[i]]; }
      const hot = ["#FF9933", "#FF3D9A", "#FFC21A", "#3DF2FF"];
      let lit = [], idx = 0, t0 = performance.now();
      const frame = (now) => {
        lit.forEach((k) => g.clearRect((k % cols) * B, ((k / cols) | 0) * B, B, B));   // last frame's hot blocks go
        const target = Math.min(n, Math.ceil(((now - t0) / T.dissolve) * n));
        lit = order.slice(idx, target); idx = target;
        lit.forEach((k) => { g.fillStyle = hot[k % hot.length]; g.fillRect((k % cols) * B, ((k / cols) | 0) * B, B, B); });
        if (idx < n || lit.length) requestAnimationFrame(frame); else finish();
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
