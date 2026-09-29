/* ------------------------------------------------------------------
   PLACEHOLDER CHARACTER SPRITE
   Drawn in code so the mock works without art files. Replace with a
   real sprite sheet later (see docs/NEON_BHARAT_STYLE.md §6).
   Canvas is 24 x 36 art pixels, feet on the bottom row, facing right.
------------------------------------------------------------------- */
(function () {
  const W = 24, H = 36, OX = 2, OY = 4;

  const PAL = {
    H: "#241A2E", h: "#3E2C50",            // hair
    S: "#9A6440", s: "#6E4430",            // skin, stubble/shade
    G: "#1A0E1F", g: "#6FA8B8",            // glasses frame, lens glint
    W: "#F4E6D0",                          // white tee
    C: "#6B3E22", c: "#9C6236",            // checked overshirt
    P: "#D2BE92", p: "#A8946C",            // cargo pants
    K: "#ECE2D4", k: "#8C8296",            // sneakers, soles
    E: "#D8DEE6",                          // silver earring / bracelets
    R: "#C8323C", Y: "#FFC21A",            // popcorn box, popcorn
    T: "#B87A3C",                          // chai
  };

  // Head + torso, 20 cols wide, drawn at (OX, OY + dy)
  const BODY = [
    "......HhHH.H........",
    ".....HHHHHHHH.......",
    "....HHHhHHHhHH......",
    "....HHHHHHHHHHH.....",
    "....HHHHSSSSHSSH....",
    "....HHHSSSSSSSSS....",
    "....HHSGGGGGGGGG....",
    "....HSSGgsGSGgsG....",
    "....HESGGGGSGGGG....",
    ".....SSSSSSSSSSSS...",
    ".....SSSsSSSSsSS....",
    "......sSssssssS.....",
    "........SSSS........",
    ".....CcCWWWWCcC.....",
    "....CcCCWWWWCCcC....",
    "....CCcCWWWWCcCC....",
    "....CcCCWWWWCCcC....",
    "....CCcCWWWWCcCC....",
    "....CcCCWWWWCCcC....",
    "....CCcCCCCCCcCC....",
  ];

  let ctx;
  const px = (x, y, c) => { ctx.fillStyle = PAL[c] || c; ctx.fillRect(OX + x, OY + y, 1, 1); };
  const rect = (x, y, w, h, c) => { ctx.fillStyle = PAL[c] || c; ctx.fillRect(OX + x, OY + y, w, h); };

  function body(dy) {
    BODY.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) if (row[x] !== ".") px(x, y + dy, row[x]);
    });
  }

  // one standing/walking leg; x = left col, off = stride offset, lift = raise foot
  function leg(x, off, lift, back) {
    const pc = back ? "p" : "P";
    const up = Math.round(off / 2);
    rect(x + up, 21, 4, 4 - Math.min(lift, 1), pc);
    rect(x + off, 25 - lift, 4, 3, pc);
    if (!back) px(x + up + 1, 22, "p"); // cargo pocket
    rect(x + off, 28 - lift, 5, 1, "K");
    rect(x + off, 29 - lift, 5, 1, "k");
  }

  // arm hanging from shoulder; swing moves the hand forward/back
  function arm(x, swing, back, dy) {
    rect(x, 14 + dy, 2, 3, back ? "c" : "C");
    rect(x + swing, 17 + dy, 2, 3, back ? "c" : "C");
    rect(x + swing, 20 + dy, 2, 1, "E");
    rect(x + swing, 21 + dy, 2, 1, "S");
  }

  function armUp(x, back) {
    rect(x, -3, 2, 1, "S");
    rect(x, -2, 2, 1, "E");
    rect(x, -1, 2, 15, back ? "c" : "C");
  }

  function waist(dy) { rect(5, 20 + dy, 10, 1, "G"); }

  const POSES = {
    idle(f) {
      const dy = f % 2;
      arm(3, 0, true, dy);
      leg(5, 0, 0, true); leg(10, 0, 0, false);
      waist(0); body(dy);
      arm(15, 0, false, dy);
    },
    walk(f) {
      const L = [[-2, 0, 2, 0], [0, 0, 0, 2], [2, 0, -2, 0], [0, 2, 0, 0]][f % 4];
      const dy = f % 2 === 0 ? 1 : 0;
      const sw = [1, 0, -1, 0][f % 4];
      arm(3, sw, true, dy);
      leg(5, L[0], L[1], true); leg(10, L[2], L[3], false);
      waist(dy); body(dy);
      arm(15, -sw, false, dy);
    },
    crouch() {
      const dy = 7;
      rect(3, 20, 2, 7, "c");
      rect(5, 27, 12, 2, "P");              // thighs
      rect(6, 29, 3, 1, "p"); rect(13, 29, 3, 1, "P");
      rect(6, 30, 5, 1, "K"); rect(13, 30, 5, 1, "K");
      rect(6, 31, 5, 1, "k"); rect(13, 31, 5, 1, "k");
      body(dy);
      rect(15, 21, 2, 5, "C"); rect(16, 26, 3, 1, "E"); rect(16, 27, 3, 2, "S"); // reaching for cover
    },
    fall(f) {
      armUp(2 - (f % 2), true);
      leg(5, -2, 0, true); leg(10, 3, 2, false);
      waist(0); body(0);
      armUp(16 + (f % 2), false);
      // hair flying
      px(5 + (f % 2), -1, "H"); px(8, -2, "H"); px(11 - (f % 2), -1, "h");
    },
    land() {
      arm(2, 0, true, 3);
      leg(4, -1, 0, true); leg(11, 1, 0, false);
      waist(3); body(3);
      arm(16, 0, false, 3);
    },
    jump() {
      armUp(2, true);
      leg(5, -1, 3, true); leg(10, 2, 3, false);
      waist(0); body(0);
      rect(15, 14, 2, 3, "C"); rect(17, 12, 2, 3, "C"); rect(18, 10, 2, 2, "S");
    },
    look() {
      arm(3, 0, true, 0);
      leg(5, 0, 0, true); leg(10, 0, 0, false);
      waist(0); body(0);
      rect(15, 14, 2, 2, "C"); rect(16, 11, 2, 3, "C"); rect(17, 9, 2, 2, "E"); rect(17, 7, 2, 2, "S");
    },
    sit(f, prop) {
      const dy = 7;
      arm(3, 0, true, dy);
      rect(5, 27, 12, 2, "P");              // thighs forward
      rect(14, 29, 3, 1, "P");              // shins down
      rect(14, 30, 5, 1, "K"); rect(14, 31, 5, 1, "k");
      body(dy);
      rect(15, 21, 2, 3, "C"); rect(16, 24, 3, 1, "E"); rect(17, 23, 2, 1, "S");
      if (prop === "chai") {
        const lift = f % 4 === 0 ? 2 : 0;
        rect(18, 21 - lift, 3, 3, "K"); rect(18, 21 - lift, 3, 1, "T");
        if (f % 4 === 1) { px(19, 19, "#CFC0AA"); }
        if (f % 4 === 2) { px(20, 18, "#CFC0AA"); }
      } else if (prop === "popcorn") {
        rect(18, 21, 3, 4, "R"); rect(18, 20, 3, 1, "Y"); px(19 + (f % 2), 19, "Y");
      }
    },
  };

  // Dark outline around the sprite + rim light on the back edge
  function finish(c, rim) {
    const img = ctx.getImageData(0, 0, W, H);
    const d = img.data, solid = new Uint8Array(W * H);
    for (let i = 0; i < W * H; i++) solid[i] = d[i * 4 + 3] > 0 ? 1 : 0;
    const at = (x, y) => x >= 0 && y >= 0 && x < W && y < H && solid[y * W + x];
    const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const o = hex("#1A0E1F"), r = rim ? hex(rim) : null;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (!solid[y * W + x]) {
        if (at(x - 1, y) || at(x + 1, y) || at(x, y - 1) || at(x, y + 1)) {
          d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255;
        }
      } else if (r && !at(x - 1, y)) {
        d[i] = (d[i] + r[0]) >> 1; d[i + 1] = (d[i + 1] + r[1]) >> 1; d[i + 2] = (d[i + 2] + r[2]) >> 1;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  const cache = new Map();
  function frame(pose, f, rim, prop) {
    const key = pose + f + rim + prop;
    if (cache.has(key)) return cache.get(key);
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    ctx = c.getContext("2d");
    (POSES[pose] || POSES.idle)(f, prop);
    finish(c, rim);
    cache.set(key, c);
    return c;
  }

  window.Sprite = { W, H, frame };
})();
