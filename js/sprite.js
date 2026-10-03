/* ------------------------------------------------------------------
   CHARACTER SPRITE
   Painted sheets packed by tools/pack_character.py: uniform cells in which he stands STAND units tall
   with his feet on the cell bottom (airborne frames are centred on their centre of mass). Frames face
   right; the engine mirrors them when he walks or climbs the other way.
------------------------------------------------------------------- */
(function () {
  const W = 208, H = 179, STAND = 150;   // the box he is drawn in, and his standing height in it

  const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
  const SETS = {
    // the walk and the character sheet's poses. The 14 painted walk frames (cells 0-13) are mostly the
    // same wide stride, so played in order the legs never close and the walk just shimmers. The cycle
    // below picks the frames that make two readable steps: stride, back leg lifting, legs passing,
    // reaching out again; then the same with the other arm forward.
    main: {
      src: "assets/character/main.webp?v=1791026800", cols: 8,
      anims: {
        idle: [0], walk: [3, 6, 1, 2, 8, 9, 13, 10],
        front: [14], front34: [15], back: [16], relaxed: [17], stride: [18], wave: [19], cheer: [20], sit: [21],
      },
    },
    // the drop down the drain: looks down the manhole, steps off, falls, lands, fixes his glasses, grins
    drain: {
      src: "assets/character/drain.webp?v=1791026800", cols: 8,
      anims: {
        peer: [0, 1, 2], stepoff: [3, 4, 5], fallStart: range(6, 11), fall: range(12, 23), fallEnd: [24, 25],
        land: range(26, 31), smile: [32], glasses: [33], stand: [34], grin: [35],
      },
    },
    // stairs: climbing (0-7) and coming down (8-15); picked by cell, see CLIMB in js/main.js
    stairs: { src: "assets/character/stairs.webp?v=1791026800", cols: 8, anims: { climb: range(0, 7), descend: range(8, 15) } },
  };
  const FPS = { walk: 9, run: 13 };      // walk-cycle frames per second (run = scrolling fast)
  // he rises a little as his legs pass under him: lift per cycle frame, in box units (negative = up)
  const BOB = { walk: [0, -1.5, -3.5, -1.5, 0, -1.5, -3.5, -1.5] };
  const ALIAS = { run: "walk" };

  const where = {};                      // anim -> its set
  Object.values(SETS).forEach((S) => {
    Object.keys(S.anims).forEach((a) => (where[a] = S));
    S.img = new Image();
    S.img.onload = () => { S.ready = true; S.cw = S.img.naturalWidth / S.cols; S.ch = (S.cw * H) / W; };
    S.img.src = S.src;
  });
  const lookup = (anim) => { const a = ALIAS[anim] || anim; return where[a] ? a : "idle"; };

  const cache = new Map();
  // one frame of an animation as a canvas (null until its sheet has loaded)
  function frame(anim, n) {
    const a = lookup(anim), S = where[a], list = S.anims[a];
    const idx = list[((n % list.length) + list.length) % list.length];
    const key = a + "|" + idx;
    if (cache.has(key)) return cache.get(key);
    if (!S.ready) return null;
    const c = document.createElement("canvas");
    c.width = S.cw; c.height = S.ch;
    c.getContext("2d").drawImage(S.img, (idx % S.cols) * S.cw, Math.floor(idx / S.cols) * S.ch, S.cw, S.ch, 0, 0, S.cw, S.ch);
    cache.set(key, c);
    return c;
  }

  window.Sprite = {
    W, H, STAND, frame,
    count: (anim) => { const a = lookup(anim); return where[a].anims[a].length; },
    fps: (anim) => FPS[anim] || FPS.walk,
    bob: (anim, n) => { const b = BOB[lookup(anim)]; return b ? b[((n % b.length) + b.length) % b.length] : 0; },
  };
})();
