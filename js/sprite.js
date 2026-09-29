/* ------------------------------------------------------------------
   CHARACTER SPRITE
   assets/character/sheet.webp is a packed sheet (tools/pack_sprite.py):
   uniform cells, feet on the cell bottom, head/torso centred on x.
   Each location tints the sprite's back edge with its key light.
------------------------------------------------------------------- */
(function () {
  const CW = 208, CH = 179, COLS = 10;

  const ANIMS = {
    idle: [0, 1, 2, 3],
    walk: [4, 5, 6, 7, 8, 9, 10, 11, 12],
    run: [13, 14, 15, 16, 17, 18],
    crouch: [19, 20, 21],        // grab cover, lift it, look into the hole
    fall: [22, 23, 24, 29],
    land: [30, 31, 25],          // squash with dust, rise, stand
    look: [26, 27],              // look up, hands in pockets
    point: [28],
    jump: [32, 33, 34, 35, 36],
    cinema: [37, 38],            // in the seat with popcorn
    stroll: [39, 40],
    gaze: [41],                  // looking at a photo
    chai: [42, 43, 44, 45],
    wave: [46, 47, 48, 49],
    talk: [50, 51, 52],
  };

  // sheet-pixel measurements used to line the scene up with the art
  const HOLE = { dx: 35, w: 64, h: 16 }; // manhole centre offset from the anchor, in the crouch frames

  const img = new Image();
  img.src = "assets/character/sheet.webp";
  let ready = false;
  const onReady = [];
  img.onload = () => { ready = true; onReady.forEach((f) => f()); };

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const cache = new Map();

  function frame(anim, n, rim) {
    const list = ANIMS[anim] || ANIMS.idle;
    const idx = list[((n % list.length) + list.length) % list.length];
    const key = idx + "|" + rim;
    if (cache.has(key)) return cache.get(key);
    if (!ready) return null;

    const c = document.createElement("canvas");
    c.width = CW; c.height = CH;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, (idx % COLS) * CW, Math.floor(idx / COLS) * CH, CW, CH, 0, 0, CW, CH);

    if (rim) {
      // rim light: tint opaque pixels that sit within 3px of the left (back) edge
      const d = ctx.getImageData(0, 0, CW, CH);
      const px = d.data, r = hex(rim), A = (x, y) => px[(y * CW + x) * 4 + 3] > 100;
      for (let y = 0; y < CH; y++) {
        for (let x = 0; x < CW; x++) {
          if (!A(x, y)) continue;
          let edge = false;
          for (let k = 1; k <= 3 && !edge; k++) if (x - k < 0 || !A(x - k, y)) edge = true;
          if (!edge) continue;
          const i = (y * CW + x) * 4;
          px[i] = (px[i] * 0.45 + r[0] * 0.55) | 0;
          px[i + 1] = (px[i + 1] * 0.45 + r[1] * 0.55) | 0;
          px[i + 2] = (px[i + 2] * 0.45 + r[2] * 0.55) | 0;
        }
      }
      ctx.putImageData(d, 0, 0);
    }
    cache.set(key, c);
    return c;
  }

  window.Sprite = {
    W: CW, H: CH, ANIMS, HOLE, frame,
    count: (anim) => (ANIMS[anim] || ANIMS.idle).length,
    whenReady: (f) => (ready ? f() : onReady.push(f)),
  };
})();
