/* ------------------------------------------------------------------
   CHARACTER SPRITE
   Packed sheets of uniform cells, feet on the cell bottom, head/torso centred on x. The pixel sheet
   (tools/pack_sprite.py) gets its back edge tinted with each location's key light; painted sheets
   (one per section, see SETS) carry their own light.
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
    climbUp: [60, 61, 62, 63, 64, 65, 66, 67],     // stairs, going up (faces right)
    climbDown: [70, 71, 72, 73, 74, 75, 76, 77],   // stairs, coming down (drawn facing left)
  };

  // vertical bob per cycle frame, in sheet px (negative = up): passing/flight frames rise
  const BOB = { walk: [0, -3, 0, -3], run: [1, -7, 1, -7] };

  /* Sheets. Every section can have its own, painted for that section's light; where a section (or a
     pose) has none, the pixel sheet is used. All sheets share the pixel sheet's 208 x 179 cell, at
     whatever resolution they were packed in (cw x ch), with the feet on the cell bottom.
       left:  poses that have their own left-facing frames (painted light can't be mirrored)
       alias: poses that borrow another pose's frames
       fps:   walk/run cadence, if it differs from the default */
  const SETS = {
    pixel: { src: "assets/character/sheet.webp?v=1790886999", cw: CW, ch: CH, cols: COLS, anims: ANIMS, bob: BOB, pixel: true },
    // hero street (tools/pack_street_sprite.py): walk right 0-7, walk left 8-15, stand 16, wave 17-21, jump 22
    street: {
      src: "assets/character/street.webp?v=1790886999", cw: 520, ch: 448, cols: 8,
      anims: {
        walk: [0, 1, 2, 3, 4, 5, 6, 7], walkL: [8, 9, 10, 11, 12, 13, 14, 15],
        idle: [16], wave: [17, 18, 19, 20, 21, 20], fall: [22],
      },
      left: { walk: "walkL" }, alias: { run: "walk", talk: "wave", point: "wave" }, fps: { walk: 12, run: 18 },
    },
    // the drop down the drain (tools/pack_drain_sprite.py): looks down the manhole, steps off, falls, lands
    drain: {
      src: "assets/character/drain.webp?v=1790886999", cw: 520, ch: 448, cols: 8,
      anims: {
        peer: [0], stepoff: [1], fallStart: [2, 3, 4, 5], fall: [6, 7, 8, 9, 10, 11, 12, 13], fallEnd: [14],
        land: [15, 16, 17], glasses: [18], smile: [19], idle: [19],
      },
    },
  };
  const FPS = { walk: 8, run: 12 };

  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const cache = new Map();
  Object.values(SETS).forEach((S) => {
    S.img = new Image();
    S.img.onload = () => { S.ready = true; };
    S.img.src = S.src;
  });

  // which set and pose to draw: falls back to the pixel sheet when the set doesn't have the pose
  function resolve(set, anim, facing) {
    const S = SETS[set];
    if (!S || S.pixel) return { set: "pixel", anim, flip: true };
    const a = (S.alias && S.alias[anim]) || anim;
    if (!S.anims[a]) return { set: "pixel", anim, flip: true };
    return { set, anim: (facing < 0 && S.left && S.left[a]) || a, flip: false };
  }

  function frame(anim, n, rim, set) {
    const S = SETS[set] || SETS.pixel;
    const list = S.anims[anim] || S.anims.idle;
    const idx = list[((n % list.length) + list.length) % list.length];
    if (!S.pixel) rim = "";                       // painted sheets carry their own light
    const key = (set || "pixel") + "|" + idx + "|" + rim;
    if (cache.has(key)) return cache.get(key);
    if (!S.ready) return null;

    const c = document.createElement("canvas");
    c.width = S.cw; c.height = S.ch;
    const ctx = c.getContext("2d");
    ctx.drawImage(S.img, (idx % S.cols) * S.cw, Math.floor(idx / S.cols) * S.ch, S.cw, S.ch, 0, 0, S.cw, S.ch);

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

  const anims = (set) => (SETS[set] || SETS.pixel).anims;
  window.Sprite = {
    W: CW, H: CH, STAND: 171, ANIMS, frame, resolve,   // STAND = his standing height in a cell
    painted: (set) => !(SETS[set] || SETS.pixel).pixel,
    has: (set, anim) => !!anims(set)[anim],
    fps: (set, anim) => ((SETS[set] || SETS.pixel).fps || FPS)[anim] || FPS[anim],
    bob: (anim, n, set) => { const b = ((SETS[set] || SETS.pixel).bob || {})[anim]; return b ? b[((n % b.length) + b.length) % b.length] : 0; },
    count: (anim, set) => (anims(set)[anim] || anims(set).idle).length,
  };
})();
