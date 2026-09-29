/* ------------------------------------------------------------------
   PLACEHOLDER SCENE ART
   Each location is painted procedurally into a low-res canvas that is
   scaled up with nearest-neighbour. All sizes below are art pixels.
   Replace each draw function with real pixel art (PNG) later.
------------------------------------------------------------------- */
(function () {
  const T = {
    nightDeep: "#120A26", night: "#1E1440", nightMid: "#2E2060", dusk: "#4A2A6E", duskPink: "#8C3A6E",
    outline: "#1A0E1F", paper: "#F4E6D0", magenta: "#FF3D9A", cyan: "#3DF2FF", saffron: "#FF9933",
    sodium: "#FFB84D", marigold: "#FFC21A", drainTeal: "#1F6B63", slime: "#6BE3A8", tile: "#CFE8E6",
    tileShadow: "#5E7C8A", fluoro: "#E8FBFF", safety: "#F2C230", velvet: "#7A1330", velvetDeep: "#3D0818",
    brass: "#D9A441", galleryWall: "#2A2233", spotlight: "#FFE3B0", dawnPink: "#FF8FA3", dawnOrange: "#FFB26B",
    autoGreen: "#2F8F3E",
  };

  let ctx;
  const R = (x, y, w, h, c, a) => {
    ctx.globalAlpha = a == null ? 1 : a;
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
    ctx.globalAlpha = 1;
  };
  const rng = (seed) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const line = (x0, y0, x1, y1, c) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) R(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, 1, 1, c);
  };
  const disc = (cx, cy, r, c) => {
    for (let y = -r; y <= r; y++) {
      const w = Math.round(Math.sqrt(r * r - y * y));
      R(cx - w, cy + y, w * 2 + 1, 1, c);
    }
  };
  // stepped light cone (flat alpha, hard edges)
  const cone = (x, y, topW, botW, h, c, a) => {
    const steps = 6;
    for (let i = 0; i < steps; i++) {
      const w = topW + ((botW - topW) * i) / (steps - 1);
      R(x - w / 2, y + (h * i) / steps, w, h / steps + 1, c, a);
    }
  };
  const bands = (W, y0, y1, colors) => {
    const h = (y1 - y0) / colors.length;
    colors.forEach((c, i) => {
      R(0, y0 + i * h, W, h + 1, c);
      if (i > 0) for (let x = 0; x < W; x += 2) R(x + (i % 2), y0 + i * h - 1, 1, 1, c); // dither seam
    });
  };

  function skyline(W, base, color, seed, minH, maxH, windows) {
    const r = rng(seed);
    let x = -4;
    while (x < W) {
      const w = 8 + Math.floor(r() * 16), h = minH + Math.floor(r() * (maxH - minH));
      R(x, base - h, w, h, color);
      if (r() < 0.25) R(x + w / 2, base - h - 6, 1, 6, color); // antenna
      if (windows) for (let wy = base - h + 3; wy < base - 3; wy += 4)
        for (let wx = x + 2; wx < x + w - 2; wx += 3)
          if (r() < windows.chance) R(wx, wy, 1, 2, windows.colors[Math.floor(r() * windows.colors.length)]);
      x += w + Math.floor(r() * 3);
    }
  }

  /* 1. THE STREET is real art now: assets/scenes/street.webp */

  /* 2. THE DRAIN is real art now: assets/scenes/drain.webp */

  /* 3. THE SUBWAY is real art now: assets/scenes/subway.webp */

  /* 4. THE CINEMA is real art now: assets/scenes/cinema-*.webp */

  /* ---------------- 5. THE EXHIBITION ---------------- */
  function exhibition(W, H, o) {
    const g = Math.round(H * 0.8), top = Math.round(H * 0.08), r = rng(23);
    R(0, 0, W, H, T.galleryWall);
    R(0, 0, W, top, "#1C1624"); R(0, top, W, 2, T.brass); R(0, top + 2, W, 1, "#8C6A2A");
    R(0, top + 6, W, 1, "#1A1420"); // track rail
    // arched windows with the night city
    o.windows.forEach((x) => {
      const wy = H * 0.2, ww = 26, wh = 60;
      R(x - 2, wy - 2, ww + 4, wh + 4, "#3A3040");
      R(x, wy + 8, ww, wh - 8, T.night); disc(x + ww / 2, wy + 10, ww / 2 - 1, T.night);
      R(x, wy + 10, ww, wh - 10, T.night);
      for (let i = 0; i < 10; i++) R(x + 2 + r() * (ww - 4), wy + 26 + r() * (wh - 30), 1, 1, r() < 0.5 ? T.sodium : T.magenta);
      R(x + ww / 2, wy, 1, wh, "#3A3040"); R(x, wy + 34, ww, 1, "#3A3040");
    });
    // spotlights over each photo
    o.lights.forEach((l) => {
      R(l.x - 2, top + 6, 4, 3, T.outline); R(l.x - 1, top + 9, 2, 1, T.spotlight);
      cone(l.x, top + 10, 4, l.w + 6, l.h, T.spotlight, 0.06);
    });
    // wainscot + floor
    R(0, g - 14, W, 14, "#241C2C"); R(0, g - 14, W, 1, T.brass);
    R(0, g, W, H - g, "#4A3020");
    for (let y = g; y < H; y += 4) { R(0, y, W, 1, "#3A2418"); for (let x = (y % 8) * 3; x < W; x += 30) R(x, y, 1, 4, "#3A2418"); }
    R(0, g, W, 1, "#6B4A30");
    // bench, plant, rope
    const b = o.bench;
    R(b, g - 9, 36, 3, "#6B4A30"); R(b + 2, g - 6, 2, 6, T.outline); R(b + 32, g - 6, 2, 6, T.outline);
    const p = o.plant;
    R(p, g - 10, 10, 10, "#8C5A3A"); for (let i = 0; i < 8; i++) R(p + 5 + Math.sin(i) * 6, g - 12 - i * 3, 3, 2, T.autoGreen);
    [o.rope, o.rope + 40].forEach((x) => { R(x, g - 16, 2, 16, T.brass); R(x - 1, g - 17, 4, 2, T.brass); });
    for (let i = 0; i < 38; i++) R(o.rope + 2 + i, g - 14 + Math.round(Math.sin((i / 38) * Math.PI) * 3), 1, 1, T.velvet);
  }

  /* ---------------- 6. THE ROOFTOP (dawn) ---------------- */
  function rooftop(W, H, o) {
    const g = Math.round(H * 0.78), hz = Math.round(H * 0.62);
    bands(W, 0, hz, [T.night, "#2A1A58", T.dusk, "#6A2E6A", T.duskPink, "#C8577E", T.dawnPink, T.dawnOrange]);
    const r = rng(31);
    for (let i = 0; i < 20; i++) R(r() * W, r() * hz * 0.3, 1, 1, T.paper, 0.5);
    disc(W * 0.7, hz + 2, 10, "#FFD08A");
    skyline(W, hz + 8, "#3A2248", 41, 10, 40, { chance: 0.05, colors: [T.sodium] });
    R(0, hz + 8, W, g - hz - 8, "#3A2248");
    // parapet / ledge
    R(0, g, W, H - g, "#6A4A5A"); R(0, g, W, 2, "#B07A80"); R(0, g + 2, W, 1, "#4A3040");
    for (let x = 0; x < W; x += 16) R(x, g + 6, 1, H - g - 6, "#5A3A4A");
    // water tanks
    [W * 0.08, W * 0.2].forEach((x, i) => {
      const h = 34 - i * 6;
      R(x, g - h, 24, h, "#241A2E"); R(x - 1, g - h - 2, 26, 3, "#241A2E"); R(x + 2, g - h, 2, h, "#3E2C50");
      for (let y = g - h + 6; y < g; y += 6) R(x, y, 24, 1, "#1A0E1F");
      R(x + 4, g - 4, 3, 4, "#1A0E1F"); R(x + 17, g - 4, 3, 4, "#1A0E1F");
    });
    // antenna + kite
    const ax = W * 0.36;
    R(ax, g - 70, 1, 70, "#2A1A38");
    for (let i = 0; i < 4; i++) R(ax - 8 + i * 2, g - 66 + i * 6, 16 - i * 4, 1, "#2A1A38");
    const kx = ax + 6, ky = g - 70;
    for (let i = 0; i < 6; i++) R(kx + 6 - i, ky + i, i * 2 + 1, 1, T.magenta);
    for (let i = 0; i < 6; i++) R(kx + i + 1, ky + 6 + i, 11 - i * 2, 1, T.magenta);
    line(kx + 6, ky + 12, kx + 2, ky + 24, T.paper);
    // clothesline
    const c0 = W * 0.48, c1 = W * 0.64;
    R(c0, g - 32, 1, 32, "#2A1A38"); R(c1, g - 32, 1, 32, "#2A1A38"); line(c0, g - 32, c1, g - 30, "#2A1A38");
    [[4, T.saffron], [16, T.cyan], [28, T.autoGreen], [40, T.dawnPink]].forEach(([dx, c]) => R(c0 + dx, g - 30, 8, 10, c));
    // plastic chair
    const px = W * 0.85;
    R(px, g - 10, 12, 2, "#E8DCC8"); R(px, g - 20, 2, 10, "#E8DCC8"); R(px, g - 8, 2, 8, "#D0C4B0"); R(px + 10, g - 8, 2, 8, "#D0C4B0");
  }

  const DRAW = { exhibition, rooftop };

  window.Scenes = {
    paint(canvas, name, cssW, cssH, P, opts) {
      const W = Math.ceil(cssW / P), H = Math.ceil(cssH / P);
      canvas.width = W; canvas.height = H;
      canvas.style.width = W * P + "px"; canvas.style.height = H * P + "px";
      ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = false;
      DRAW[name](W, H, opts || {});
    },
  };
})();
