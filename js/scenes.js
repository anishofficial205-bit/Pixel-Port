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

  /* ---------------- 2. THE DRAIN ---------------- */
  function drain(W, H, o) {
    const r = rng(13), cx = o.cx, sw = 24;
    R(0, 0, W, H, "#0B0818");
    for (let y = 0; y < H; y += 4) for (let x = (y / 4) % 2 ? 0 : 5; x < W; x += 10) if (r() < 0.5) R(x, y, 9, 3, "#120E24");
    // shaft interior: dark, with subway light rising from below
    const cols = ["#08121A", "#08121A", "#0A161C", "#0C1C20", "#0E2426", "#123030", T.drainTeal, "#3E8F8A", "#8FC7C4", T.fluoro];
    const bh = H / cols.length;
    cols.forEach((c, i) => R(cx - sw, i * bh, sw * 2, bh + 1, c));
    // light from the street above
    R(cx - 10, 0, 20, 10, T.sodium, 0.35); R(cx - 6, 10, 12, 8, T.sodium, 0.2);
    // brick walls
    for (let y = 0; y < H; y += 3) {
      const off = (y / 3) % 2 ? 0 : 3;
      for (let x = -6 + off; x < 12; x += 6) {
        R(cx - sw - 12 + x, y, 5, 2, "#1D3A3A"); R(cx + sw + x, y, 5, 2, "#1D3A3A");
      }
    }
    R(cx - sw - 1, 0, 1, H, T.outline); R(cx + sw, 0, 1, H, T.outline);
    // ladder
    R(cx - sw + 2, 0, 1, H * 0.85, "#5E4A3A"); R(cx - sw + 9, 0, 1, H * 0.85, "#5E4A3A");
    for (let y = 2; y < H * 0.85; y += 6) R(cx - sw + 2, y, 8, 1, "#7A5E48");
    // pipes with drips
    for (let i = 1; i < 5; i++) {
      const y = Math.round((H * i) / 5.5), left = i % 2 === 0;
      const x0 = left ? cx - sw - 12 : cx + sw - 16;
      R(x0, y, 28, 4, "#7A4A2E"); R(x0, y, 28, 1, "#A0673A"); R(left ? x0 + 26 : x0, y - 1, 2, 6, "#5A341E");
      R(left ? x0 + 27 : x0 - 1, y + 4, 1, 2, T.slime);
    }
    // slime puddles and glow patches
    for (let i = 0; i < 16; i++) {
      const side = r() < 0.5 ? cx - sw - 8 + r() * 6 : cx + sw + 2 + r() * 6;
      R(side, r() * H, 2 + r() * 3, 1, T.slime, 0.8);
    }
    // rat on a ledge
    const ry = Math.round(H * 0.45);
    R(cx + sw - 6, ry + 3, 6, 1, "#1D3A3A");
    R(cx + sw - 5, ry, 4, 3, "#6A6A7A"); R(cx + sw - 6, ry + 1, 1, 1, T.magenta); R(cx + sw - 1, ry + 2, 3, 1, "#8A7A8A");
  }

  /* ---------------- 3. THE SUBWAY ---------------- */
  function subway(W, H, o) {
    const g = Math.round(H * 0.8), ceil = Math.round(H * 0.1), r = rng(17);
    R(0, 0, W, ceil, "#2A3440"); R(0, ceil - 1, W, 1, T.outline);
    // tiled wall
    R(0, ceil, W, g - ceil, T.tile);
    for (let y = ceil; y < g; y += 5) R(0, y, W, 1, "#B4D2D2");
    for (let y = ceil; y < g; y += 5) for (let x = (y / 5) % 2 ? 0 : 4; x < W; x += 8) R(x, y, 1, 5, "#B4D2D2");
    R(0, ceil, W, 4, "#A8C6C8"); // shadow under ceiling
    R(0, Math.round(H * 0.66), W, 3, T.cyan); R(0, Math.round(H * 0.66) + 3, W, 1, T.tileShadow);
    R(0, Math.round(H * 0.69), W, g - Math.round(H * 0.69), "#9FBFC0"); // lower dado
    // tube lights
    for (let x = 10; x < W; x += 48) { R(x, ceil - 3, 18, 2, T.fluoro); R(x - 1, ceil - 1, 20, 1, T.fluoro, 0.4); cone(x + 9, ceil, 18, 36, 18, T.fluoro, 0.12); }
    // pillars
    o.pillars.forEach((x) => {
      R(x - 7, ceil, 14, g - ceil, T.tileShadow); R(x - 7, ceil, 2, g - ceil, "#8FA7B8"); R(x + 5, ceil, 2, g - ceil, "#3E5460");
      R(x - 8, ceil, 16, 3, "#3E5460");
    });
    // benches
    o.benches.forEach((x) => {
      R(x, g - 8, 26, 2, "#8C5A3A"); R(x, g - 13, 26, 2, "#8C5A3A"); R(x + 2, g - 6, 2, 6, "#3E5460"); R(x + 22, g - 6, 2, 6, "#3E5460");
    });
    // chai vending machine
    const vx = o.vending;
    R(vx, g - 34, 18, 34, T.velvet); R(vx + 2, g - 30, 14, 12, "#1A1238"); R(vx + 4, g - 28, 10, 2, T.saffron);
    R(vx + 4, g - 14, 4, 3, T.cyan); R(vx + 10, g - 14, 4, 3, T.marigold); R(vx, g - 34, 18, 1, "#A83050");
    // platform + safety line + track
    R(0, g, W, 10, "#6E7F8C"); R(0, g, W, 1, "#9AAAB4");
    for (let x = 0; x < W; x += 12) R(x + (r() * 6) | 0, g + 3 + ((r() * 4) | 0), 2, 1, "#5E6E7A");
    R(0, g + 8, W, 2, T.safety);
    for (let x = 0; x < W; x += 8) R(x, g + 8, 4, 2, "#C9A020");
    R(0, g + 10, W, H - g - 10, "#101620");
    for (let x = 0; x < W; x += 10) R(x, H - 10, 6, 3, "#2A2420");
    R(0, H - 12, W, 1, "#8C96A0"); R(0, H - 5, W, 1, "#8C96A0");
    // exit stairs at the far end
    const sx = W - o.stairsW;
    for (let i = 0; i < 10; i++) R(sx + i * 6, g - i * 6, W - sx - i * 6, 6, i % 2 ? "#6E7F8C" : "#7A8C98");
    R(sx + 6, g - 70, 1, 70, "#3E5460");
  }

  /* ---------------- 4. THE CINEMA ---------------- */
  function cinema(W, H, o) {
    const g = Math.round(H * 0.8), L = o.lobbyW;
    // --- lobby: street-level facade at night
    bands(L, 0, H * 0.3, [T.nightDeep, T.night, "#26185A"]);
    R(0, H * 0.1, L, g - H * 0.1, "#4A2440"); R(0, H * 0.1, L, 2, T.brass);
    for (let x = 6; x < L; x += 24) R(x, H * 0.1 + 2, 2, g - H * 0.1 - 2, "#5A2E4E"); // deco fluting
    R(0, H * 0.24, L, 10, T.brass); R(0, H * 0.24 + 10, L, 2, "#8C6A2A"); // canopy
    // poster frames
    [0.18, 0.62].forEach((f, i) => {
      const px = L * f, py = H * 0.32;
      R(px - 2, py - 2, 34, 48, T.brass); R(px, py, 30, 44, i ? T.velvetDeep : "#1E3A5A");
      R(px + 4, py + 6, 22, 16, i ? T.saffron : T.magenta, 0.8); R(px + 6, py + 26, 18, 3, T.paper); R(px + 8, py + 32, 14, 2, T.paper, 0.6);
    });
    // ticket window
    const tw = L * 0.4;
    R(tw, g - 40, 36, 40, "#3D0818"); R(tw + 4, g - 34, 28, 14, "#FFE3B0", 0.8); R(tw + 4, g - 34, 28, 1, T.brass);
    for (let x = tw + 6; x < tw + 32; x += 4) R(x, g - 34, 1, 14, "#8C6A2A");
    R(tw - 2, g - 18, 40, 3, T.brass);
    R(0, g, L, H - g, "#2E2238"); R(0, g, L, 1, "#4A3A58");
    // --- hall
    R(L, 0, W - L, H, T.velvetDeep);
    for (let x = L; x < W; x += 16) R(x, 0, 8, g, "#45091C");
    R(L, 0, 4, H, T.brass);
    // sconces
    for (let x = L + 20; x < W; x += 80) { R(x, H * 0.3, 4, 6, T.brass); cone(x + 2, H * 0.3 - 10, 2, 8, 10, T.sodium, 0.25); }
    // proscenium + curtains around the screen
    const s = o.screen;
    R(s.x - 10, s.y - 10, s.w + 20, s.h + 20, T.brass);
    R(s.x - 8, s.y - 8, s.w + 16, s.h + 16, "#8C6A2A");
    R(s.x - 6, s.y - 6, s.w + 12, s.h + 12, T.outline);
    for (let i = 0; i < 14; i++) {
      R(s.x - 30 + i * 2, s.y - 16, 2, s.h + 40, i % 2 ? T.velvet : "#5A0E24");
      R(s.x + s.w + 4 + i * 2, s.y - 16, 2, s.h + 40, i % 2 ? T.velvet : "#5A0E24");
    }
    for (let x = s.x - 30; x < s.x + s.w + 32; x += 6) R(x, s.y - 20, 5, 8, T.velvet); // valance
    R(s.x - 32, s.y - 21, s.w + 66, 2, T.brass);
    // projector beam from the back wall
    const bx = W - 20, by = H * 0.14;
    R(bx - 2, by - 3, 10, 6, "#2A2A30"); R(bx - 3, by - 1, 2, 2, T.spotlight);
    ctx.globalAlpha = 0.07; ctx.fillStyle = T.spotlight;
    ctx.beginPath(); ctx.moveTo(bx - 2, by - 1); ctx.lineTo(s.x + s.w, s.y + 4); ctx.lineTo(s.x + s.w, s.y + s.h - 4); ctx.lineTo(bx - 2, by + 1);
    ctx.fill(); ctx.globalAlpha = 1;
    // exit sign
    R(W - 40, H * 0.08, 18, 7, T.autoGreen); R(W - 38, H * 0.08 + 2, 14, 3, "#8FE3A0");
    // floor + seats
    R(L, g, W - L, H - g, "#2A0612");
    for (let x = L + 8; x < W - 8; x += 14) {
      if (Math.abs(x + 6 - o.seatX) < o.seatGap) continue; // the sprite brings its own seat
      R(x, g - 12, 12, 10, T.velvet); R(x, g - 12, 12, 1, "#A83050"); R(x + 1, g - 2, 10, 3, "#5A0E24");
    }
    for (let x = L + 2; x < W; x += 14) { R(x, g + 8, 12, 12, "#5A0E24"); R(x, g + 8, 12, 1, "#8A1E3C"); }
  }

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

  const DRAW = { drain, subway, cinema, exhibition, rooftop };

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
