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
    // The sheet's walk/run frames are all mid-stride, so the cycles alternate
    // a stride frame with a legs-together "passing" frame (40 = side stand).
    walk: [4, 40, 12, 40],
    run: [18, 16, 14, 13],
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

  // vertical bob per cycle frame, in sheet px (negative = up): passing/flight frames rise
  const BOB = { walk: [0, -3, 0, -3], run: [1, -7, 1, -7] };

  // sheet-pixel measurements used to line the scene up with the art
  const HOLE = { dx: 35, w: 64, h: 16 }; // manhole centre offset from the anchor, in the crouch frames

  const img = new Image();
  img.src = "assets/character/sheet.webp?v=1790706319";
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
      // rim light: tint the single outermost pixel on the left (back) edge
      const d = ctx.getImageData(0, 0, CW, CH);
      const px = d.data, r = hex(rim), A = (x, y) => px[(y * CW + x) * 4 + 3] > 100;
      for (let y = 0; y < CH; y++) {
        for (let x = 0; x < CW; x++) {
          if (!A(x, y)) continue;
          if (x > 0 && A(x - 1, y)) continue;
          const i = (y * CW + x) * 4;
          px[i] = (px[i] * 0.6 + r[0] * 0.4) | 0;
          px[i + 1] = (px[i + 1] * 0.6 + r[1] * 0.4) | 0;
          px[i + 2] = (px[i + 2] * 0.6 + r[2] * 0.4) | 0;
        }
      }
      ctx.putImageData(d, 0, 0);
    }
    cache.set(key, c);
    return c;
  }

  window.Sprite = {
    W: CW, H: CH, ANIMS, HOLE, frame,
    bob: (anim, n) => { const b = BOB[anim]; return b ? b[((n % b.length) + b.length) % b.length] : 0; },
    count: (anim) => (ANIMS[anim] || ANIMS.idle).length,
    whenReady: (f) => (ready ? f() : onReady.push(f)),
  };
})();
