# Neon Bharat: Pixel Portfolio

A design portfolio built as one continuous 16-bit game level. As you scroll, the character walks through one night in the city:

**Street** (hero) → **Drain** (transition) → **Subway** (project billboards) → **Cinema** (reels) → **Exhibition** (photography) → **Rooftop at dawn** (contact / footer)

The visual rules live in [`docs/NEON_BHARAT_STYLE.md`](docs/NEON_BHARAT_STYLE.md).

> **Status:** all six locations use real art. Text, projects, reels and photos in `js/data.js` are still placeholders.

## Run it locally

It's plain HTML/CSS/JS with no build step. Serve the folder with any static server:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080.

## Where things live

| File | What it does |
|---|---|
| `js/data.js` | **All content**: name, intro, projects, reels, photos, socials. Edit this first. |
| `js/main.js` | Scroll engine: lays out the world, builds the path, and moves the camera and character |
| `assets/scenes/street.webp` | Street art. Billboard corners, road line and manhole spot are measured in `STREET` in `js/main.js` |
| `assets/scenes/drain.webp` | Drain shaft: three frames stitched top to bottom (manhole, shaft, grate into the subway). Alignment lives in `DRAIN` in `js/main.js` |
| `assets/scenes/subway.webp` | Subway platform, built from `assets/subway/src/` by `tools/build_subway.py`. Billboard spots, floor and stairs live in `SUBWAY` in `js/main.js` |
| `assets/subway/frame-*.png` | Billboard frames (wide metal, tall LED). Project images show through their windows |
| `assets/scenes/stairwell.webp` | Subway platform, stairs and cinema lobby in one image. Scale is solved from two shared lines with the subway; path, doors and signage live in the `STAIRWELL_*` constants at the top of `js/main.js`. Press **D** (or add `?debug`) to see bounds, path and camera |
| `assets/scenes/cinema-front.webp` | Theater front view (screen keyed out); `assets/cinema/seat-row.webp` is the foreground row. Positions in `CINEMA` in `js/main.js` |
| `assets/scenes/gallery.webp` | Gallery (entrance, window wall, exit) plus the dawn rooftop footer (`assets/gallery/src/rooftop.webp`), built by `tools/build_gallery.py`. Frames, plaques and the roof live in `GALLERY` in `js/main.js` |
| `js/sprite.js` | Character animations: frame lists per pose, plus the rim-light tint per location |
| `assets/character/` | `source-sheet.webp` and `climb-source.webp` (original art); `sheet.webp` is packed by `tools/pack_sprite.py`, then `tools/pack_climb.py` appends the stair frames |
| `styles.css` | Tokens from the style guide plus all UI components |
| `project.html` / `project.css` | Project detail page ("arriving at the station") |
| `projects.html` | All projects: every entry in `SITE.projects`, filterable by category. Projects with `featured: true` also get a subway billboard (first 4) |

## How the scroll works

Scroll distance is mapped onto a path of segments (walk, crouch, fall, land, sit, jump). Each segment knows the character's pose, the location's lighting, and where the camera looks. The page never hijacks scroll speed: the character follows the user's scroll.

- **Skip the ride** (top right) switches to plain stacked sections. This is also the default for `prefers-reduced-motion`.
- The route map in the HUD shows progress. Click any stop to jump there.
- Billboards are real links. The **Back to platform** link on a project page returns you to that billboard.
