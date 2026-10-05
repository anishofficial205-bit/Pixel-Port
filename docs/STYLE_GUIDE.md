# Visual Style Guide (v2: The Journey)

Read this before building or changing any UI. The whole site is one continuous 16-bit video game level set in a modern Indian city at night. The visitor scrolls, and the pixel character travels through six locations. Every location must feel like a different room of the **same game**: same pixel rules, same palette family, same UI language, different lighting mood.

---

## 1. The journey at a glance

| # | Location | Site section | Character action | Mood / key light |
|---|---|---|---|---|
| 1 | **The Street** | Hero: name, title, intro | Idle, then starts walking on scroll | Purple night, magenta + cyan neon, orange sodium lamps |
| 2 | **The Drain** | Transition | Lifts manhole cover, drops down, falls | Darkness, dripping water, teal-green glow |
| 3 | **The Subway** | Projects (billboards) | Lands on platform, walks past billboards | Cool fluorescent cyan-white, yellow safety line |
| 4 | **The Cinema Hall** | Reels / video | Buys a ticket, walks in, sits down | Deep red velvet, gold, projector beam |
| 5 | **The Exhibition** | Photography | Walks slowly along the gallery wall | Warm gallery spotlights on dark walls |
| 6 | **The Rooftop / End Credits** | Footer: contact, socials | Jumps up/into the footer, sits with chai | First light of dawn, pink-orange horizon |

The story arc is **one night in the city**: it starts at late-night neon and ends at dawn. Lighting gets gradually warmer and brighter toward the footer. This gives the whole site a sense of progression.

---

## 2. Core pillars (apply everywhere)

1. **Hard pixels, always.** No blur, no soft gradients, no anti-aliasing on world art or UI chrome. Edges are stepped.
2. **The world is pixel art. The work is not.** Project images, reel videos, and photographs are shown at full native quality, never pixelated. They sit inside pixel-art frames (billboard frames, cinema screen, gallery frames). This contrast makes the work stand out. This is the most important rule on the site.
3. **Lit by the location.** Each location has its own dominant light source. UI elements inside a location pick up that light (tinted borders, glows, shadows).
4. **Real Indian texture.** Details come from real Indian urban life: chai, autos, hand-painted signs in Hindi and English, Mumbai local / metro stations, old single-screen cinemas, Kala Ghoda-style galleries, rooftop water tanks. Not generic Tokyo cyberpunk.
5. **Breathing room.** The work (billboards, screen, photos) is the focal point in every location. Props are atmosphere, never clutter.
6. **A game you can walk through, but a website you can use.** Game language for style and delight; plain, accessible links and controls for function.

---

## 3. Master palette

All locations draw from this one palette. Each location leans on a different subset (see section 7).

### Base
| Token | Hex | Use |
|---|---|---|
| `--night-deep` | `#120A26` | Deepest background, shadows |
| `--night` | `#1E1440` | Panels, sections |
| `--night-mid` | `#2E2060` | Raised surfaces |
| `--dusk` | `#4A2A6E` | Borders, dividers |
| `--dusk-pink` | `#8C3A6E` | Horizon glow |
| `--outline` | `#1A0E1F` | Pixel outlines, text shadow (never pure black) |
| `--paper` | `#F4E6D0` | Body text on dark (never pure white) |

### Light sources
| Token | Hex | Use |
|---|---|---|
| `--neon-magenta` | `#FF3D9A` | Primary accent, links, hover |
| `--neon-cyan` | `#3DF2FF` | Secondary accent, focus rings, LED borders |
| `--saffron` | `#FF9933` | Headings, key calls to action |
| `--sodium` | `#FFB84D` | Lamp light, warm highlights |
| `--marigold` | `#FFC21A` | Coins, stars, bulbs, sparkles |

### Location colors
| Token | Hex | Location |
|---|---|---|
| `--drain-teal` | `#1F6B63` | Drain glow, damp walls |
| `--drain-slime` | `#6BE3A8` | Drips, tiny highlights in the drain |
| `--tile` | `#CFE8E6` | Subway wall tiles (lit) |
| `--tile-shadow` | `#5E7C8A` | Subway tile shadow, concrete |
| `--fluoro` | `#E8FBFF` | Subway tube lights |
| `--safety-yellow` | `#F2C230` | Platform edge line, warnings |
| `--velvet` | `#7A1330` | Cinema seats, curtains |
| `--velvet-deep` | `#3D0818` | Cinema shadows |
| `--brass` | `#D9A441` | Cinema trim, marquee, gallery plaques |
| `--gallery-wall` | `#2A2233` | Exhibition walls (dark, warm-grey) |
| `--spotlight` | `#FFE3B0` | Gallery spotlight pools |
| `--dawn-pink` | `#FF8FA3` | Footer sky |
| `--dawn-orange` | `#FFB26B` | Footer horizon |
| `--auto-green` | `#2F8F3E` | Success states, auto-rickshaw |

### Color rules
- Never pure `#FFFFFF` or `#000000`.
- Shadows are cool (purple/blue), highlights warm (orange/pink). In the cinema, shadows go deep red.
- Neon is for light and emphasis, never large flat fills.
- Body text contrast at least WCAG AA (4.5:1) in every location.

---

## 4. Typography

- **Display / UI:** `"Press Start 2P"` (titles, buttons, HUD) with `"Silkscreen"` as a more readable fallback.
- **Body:** `"VT323"` at 20px+ or `"Pixelify Sans"`. Line length under ~70 characters.
- **Hindi / Devanagari flavor:** `"Noto Sans Devanagari"` bold with the same hard pixel text-shadow. Flavor only (signs, station names, "हाउसफुल"); always paired with English for anything functional.
- Pixel fonts at integer multiples of native size only (8, 16, 24, 32px for Press Start 2P).
- `-webkit-font-smoothing: none;` on pixel fonts.
- Titles: hard offset shadow `3px 3px 0 var(--outline)` + optional glow in the location's key light color.
- Each location can have its own "sign style" for section titles (see section 7), but the font family never changes.

---

## 5. Pixel rendering rules

- `image-rendering: pixelated;` on all world art and sprites (not on project images, reels, or photos).
- Scale pixel art by whole numbers only (2x, 3x, 4x). Nearest-neighbor resampling.
- `border-radius: 0` everywhere. Stepped corners via `clip-path` or layered `box-shadow`.
- No CSS blur on world elements. Glows only as tight halos around light sources.
- Base spacing unit `--px: 4px`; all spacing is a multiple.

---

## 6. The character

- Consistent sprite: messy dark wavy hair, black rectangular glasses, silver earring, light stubble, warm brown skin, silver bracelets, beige cargo pants, white chunky sneakers, brown checked overshirt over white tee (main outfit).
- Lit by each location's key light: rim light color changes per location (magenta/cyan on the street, teal in the drain, cyan-white in the subway, red-gold in the cinema, warm spotlight in the gallery, pink-orange at dawn). If possible, prepare tinted sprite variants or apply the tint with a CSS/canvas color overlay on the rim pixels.
- Always a small dark oval shadow under the feet (except while falling or jumping, where the shadow shrinks).

### Sprite sheet needed
| Animation | Frames | Used in |
|---|---|---|
| Idle (breathing, blinking) | 4 | Street hero, any pause |
| Walk | 6–8 | All locations |
| Lift manhole / crouch | 4 | Street → drain |
| Fall (arms up, hair flying) | 2–4 loop | Drain |
| Land (squash) | 2–3 | Subway arrival |
| Look up / point | 2–3 | At billboards, screen, photos |
| Sit (with popcorn) | 2 | Cinema |
| Jump | 4 | Exhibition → footer |
| Sit with chai | 2–4 loop | Footer |

Animation runs at 8–12 fps using `steps()` timing. Walking is driven by scroll: scroll progress advances position and the walk frames; when scrolling stops, the character returns to idle.

---

## 7. Locations in detail

### 7.1 The Street (hero)

**Scene:** The existing street. Wet road with neon reflections, auto-rickshaw, black-and-yellow taxi, chai stall with steam, sleeping stray dog, metro train on the overpass, skyline with IT towers, cranes, sea link, full moon, purple sky. A **manhole cover** in the road in front of the character (this is where he'll go next, so make it slightly visible as a hint).

**Key light:** Magenta + cyan neon, orange sodium lamps.

**Content:** Name as the big title, styled like a game title logo (saffron-to-marigold fill, thick `--outline` stroke, hard shadow, soft neon glow). Below it, role/tagline in body font inside a small RPG dialog box, as if the character is saying it. A small blinking "Scroll to start ▼" prompt, like "Press Start".

**The existing street billboards** can show the name, a tagline, or a highlight (e.g. latest project), so the billboard idea is introduced right away.

**Title sign style:** Neon tube lettering or a hand-painted shop sign.

### 7.2 The Drain (transition)

**Scene:** The character crouches, slides the manhole cover aside, and drops in. The camera follows him down a vertical shaft: damp brick and concrete walls, dripping water, rusted pipes, a ladder, a few glowing teal-green puddles, maybe a rat peeking out, a little graffiti. The shaft gets darker, then light from below (the subway) starts to glow cyan-white.

**Key light:** Near-dark; teal-green glow from puddles and slime, the circle of neon street light shrinking above, subway fluorescent light growing below.

**Content:** No content, just the transition. Maybe one small funny line in a dialog bubble ("Shortcut!").

**Pacing:** Short. About one screen height of scroll. Must not feel like a chore.

**Reduced motion:** Replace with a quick fade to black and back.

### 7.3 The Subway (projects)

**Scene:** An underground Indian metro/local station platform, drawn as a long horizontal space. Tiled walls (`--tile`), tube lights on the ceiling, a yellow safety line along the platform edge, pillars, a bench, a tea vending machine, station name boards in Hindi and English (e.g. "प्रोजेक्ट्स / PROJECTS"), a train occasionally arriving and departing on the track, maybe a platform display showing "Next train: 2 min".

**Key light:** Cool fluorescent cyan-white from above, with warm pools from each billboard's lamps.

**Layout:** The section scrolls horizontally (vertical scroll converted to horizontal movement), and the character walks along the platform past the billboards. On mobile, switch to a vertical layout: the character rides down an escalator past stacked billboards, or the platform becomes a vertical list with the character pinned at the side.

**Billboards (project cards):** Mounted on the tiled wall, in the style of metro lightbox ads:
- Thick dark metal frame, brass or steel trim, 2–3 small lamps on top casting a warm light cone.
- Project image inside at full native quality, flat and front-facing.
- Below each billboard, a small station-style sign with the project name and one-line description (like a platform name board: white text on a colored band).
- Variation in size is welcome (one large hero billboard, some medium, one tall portrait LED screen with a cyan border), but keep a rhythm so it doesn't look random.
- **Hover/focus:** lamps brighten, the LED ones flicker once, the character stops and looks up at it, and a dialog bubble appears ("Let's check this out").
- **Click:** the train arrives with a "whoosh", doors open, and the page transitions to the project page (a short pixel wipe or the train sliding across the screen). The billboard is a real `<a>` link, keyboard focusable, with clear alt text.

**Project detail pages** continue the subway theme: they feel like being "inside the train" or on the platform of that project's "station". Keep a "Back to platform" button that returns to the same billboard position.

**Title sign style:** Metro station board: colored band, white pixel letters, Hindi line above.

### 7.4 The Cinema Hall (reels)

**Transition in:** The character takes the stairs up out of the subway and arrives at an old single-screen Indian cinema: a marquee with blinking bulbs (`--marigold`), a ticket window, a hand-painted poster frame, a "HOUSEFULL / हाउसफुल" sign. He buys a ticket and walks in. The lights dim.

**Scene inside:** Deep red velvet seats (`--velvet`), red curtains that open to reveal the screen, brass trim on walls and balcony, exit sign glowing, a projector beam cutting through dusty air from the back, an interval snack counter (samosa, popcorn) at the side.

**Key light:** Mostly dark. The screen is the brightest thing, plus brass reflections and the projector beam.

**Content:**
- The **screen** plays the reels at full quality, framed by the curtains and a pixel-art proscenium.
- Reel selection as a row of small **ticket stubs** or **film strip frames** below the screen; clicking one plays it.
- Portrait reels (9:16) display in the center of the screen with the curtains closed in partially at the sides, or as a row of vertical "posters" in the lobby that open on the big screen.
- Player controls are pixel buttons (play, pause, mute, next) styled like brass cinema buttons. Videos start muted, never autoplay with sound, and always have visible controls.
- The character's silhouette sits in a front-row seat, sometimes eating popcorn.

**Title sign style:** Marquee bulb lettering or a hand-painted movie poster title.

### 7.5 The Exhibition (photography)

**Transition in:** After the reels, the character walks out through a side door into a quiet art gallery, like an old heritage building converted into a gallery (think Kala Ghoda in Mumbai): high ceilings, arched windows with the night city outside, wooden floor.

**Scene:** Dark warm-grey walls (`--gallery-wall`), each photo lit by a spotlight pool (`--spotlight`) from a ceiling track light. Small brass plaques under each photo. A bench in the middle. Maybe a potted plant and a velvet rope.

**Key light:** Warm spotlights only. The calmest, most minimal location on the site, so the photos can breathe.

**Content:**
- Photos at full native quality, in simple pixel-art frames (thin dark or brass frame with a lighter mat). The frame is pixel, the photo is not.
- Layout: a horizontal gallery wall the character walks along, or a salon-style grid of mixed sizes on mobile.
- Plaque below each photo: title, location, year in small pixel font.
- **Click:** opens a lightbox view: the gallery dims and the photo is shown large, with prev/next pixel arrows, the plaque info, and a close button. Escape key and swipe work.
- The character walks slowly here and stops to look at photos with his hands in his pockets.

**Title sign style:** Gallery wall lettering: clean pixel letters directly on the wall, brass color.

### 7.6 The Rooftop / End Credits (footer)

**Transition in:** The character jumps (a big satisfying pixel jump with a little dust puff) and lands in the footer.

**Scene:** A rooftop terrace at the first light of dawn: water tanks, a TV antenna, a clothesline, a plastic chair, a kite tangled on the antenna, the city skyline in silhouette, the sky shifting from `--night` to `--dawn-pink` and `--dawn-orange` at the horizon. The neon signs from the street below are switching off one by one. The character sits on the ledge with a chai.

**Key light:** Soft pink-orange dawn light. The warmest, most relaxed palette on the site. Night is over; the journey is done.

**Content:**
- "End credits" feel: a short thank-you line, contact email, and social links, styled like a game's end screen ("Thanks for playing").
- Social links as pixel icons on little signs or stickers on the water tank.
- A "Play again" button that scrolls back to the top (and the character drops back to the street).
- Copyright line styled like the game logo's "©1996 PIXEL GAMES" but with the real year and name.

**Title sign style:** End-credits text scrolling gently, or hand-painted lettering on the water tank.

---

## 8. Transitions between locations

- Each transition is a small moment of story, not a hard section break. The camera follows the character.
- Use stepped motion (`steps()`) for sprite frames; camera/parallax movement can be smooth but slow.
- Use pixel-style wipes (a blocky dissolve, a vertical pixel curtain, or the train sliding across) when changing pages.
- Transition lengths: short (roughly one screen of scroll each). The locations with content (subway, cinema, exhibition) get the most scroll space.
- Lighting shifts gradually through each transition: the character's rim light and the UI accent color cross-fade to the next location's key light.

---

## 9. Shared UI components

These work the same in every location; only their tint changes with the location's key light.

- **Dialog box:** RPG-style, `--night` fill, 4px pixel border (`--paper` or location accent), inner border in `--dusk`, hard `--outline` shadow, stepped corners. Used for the character's lines and short text blocks.
- **Buttons:** chunky, pixel font label, saffron or magenta fill (brass in the cinema), hard 4px bottom shadow; pressed state moves down and drops the shadow. Visible cyan pixel focus ring.
- **Frames:** one frame family for all work (billboard, screen, gallery frame): dark outer border, lighter inner trim, lamps or spotlights on top. Changes material per location (metal in the subway, brass and velvet in the cinema, wood or brass in the gallery).
- **Progress HUD:** a small "Chai meter" bar or a mini route map in a corner showing the six locations as stops on a metro-style line, with the character's current position. Clicking a stop jumps there. Doubles as navigation.
- **Icons:** 16x16 / 32x32 pixel icons with dark outline: chai, ticket, film reel, camera, frame, billboard, metro, manhole, mail, social icons.

---

## 10. Navigation and accessibility

- Always provide a normal way to reach each section: the metro-map HUD, plus a simple menu (Home, Projects, Reels, Photography, Contact).
- A visible "Skip the ride" option that turns off the scroll animation and shows the content as regular sections.
- `prefers-reduced-motion`: no sprite walking, no parallax, no flicker, no rain; transitions become simple fades; the character appears in a static pose per section.
- All billboards, reel tiles, and photos are real links/buttons with focus states and alt text.
- Don't hijack scroll speed. Scroll-driven animation should follow the user's scroll, not force it.
- Performance: lazy-load images and videos per location, use sprite sheets, avoid huge background images (pixel art compresses well as small PNGs scaled up).

---

## 11. Voice and copy

- Friendly, playful, lightly Hinglish where natural ("Chalo, let's go", "Chai break?", "Housefull!"), always clear.
- Game and location metaphors in small doses: "Next stop: Projects", "Now showing", "On display", "Thanks for playing".
- Buttons say what they do: "View project", "Play reel", "Open photo", "Send message".

---

## 12. Do / Don't

**Do**
- Hard pixels, integer scaling, limited palette.
- Distinct lighting per location, one shared visual system.
- Full-quality work inside pixel frames.
- Real Indian urban details.
- A night-to-dawn progression.

**Don't**
- Pixelate project images, reels, or photos.
- Rounded corners, soft grey shadows, glassmorphism, decorative gradients.
- Pure white or pure black.
- Real brand logos, copyrighted characters or movie posters.
- Crowded scenes or HUD elements over content.
- Stereotype-heavy "India" imagery. Keep it modern and urban.
- Long, slow transitions that make the visitor wait for the content.

---

## 13. CSS starting tokens

```css
:root {
  /* base */
  --night-deep: #120A26;
  --night: #1E1440;
  --night-mid: #2E2060;
  --dusk: #4A2A6E;
  --dusk-pink: #8C3A6E;
  --outline: #1A0E1F;
  --paper: #F4E6D0;

  /* light */
  --neon-magenta: #FF3D9A;
  --neon-cyan: #3DF2FF;
  --saffron: #FF9933;
  --sodium: #FFB84D;
  --marigold: #FFC21A;

  /* locations */
  --drain-teal: #1F6B63;
  --drain-slime: #6BE3A8;
  --tile: #CFE8E6;
  --tile-shadow: #5E7C8A;
  --fluoro: #E8FBFF;
  --safety-yellow: #F2C230;
  --velvet: #7A1330;
  --velvet-deep: #3D0818;
  --brass: #D9A441;
  --gallery-wall: #2A2233;
  --spotlight: #FFE3B0;
  --dawn-pink: #FF8FA3;
  --dawn-orange: #FFB26B;
  --auto-green: #2F8F3E;

  /* type */
  --font-display: "Press Start 2P", "Silkscreen", monospace;
  --font-body: "VT323", "Pixelify Sans", monospace;
  --font-hindi: "Noto Sans Devanagari", sans-serif;

  /* system */
  --px: 4px;
  --shadow-hard: 4px 4px 0 var(--outline);
  --accent: var(--neon-magenta); /* overridden per location */
  --key-light: var(--sodium);    /* overridden per location */
}

/* per-location accent overrides */
[data-location="street"]     { --accent: var(--neon-magenta); --key-light: var(--sodium); }
[data-location="drain"]      { --accent: var(--drain-slime);  --key-light: var(--drain-teal); }
[data-location="subway"]     { --accent: var(--neon-cyan);    --key-light: var(--fluoro); }
[data-location="cinema"]     { --accent: var(--brass);        --key-light: var(--velvet); }
[data-location="exhibition"] { --accent: var(--brass);        --key-light: var(--spotlight); }
[data-location="rooftop"]    { --accent: var(--saffron);      --key-light: var(--dawn-orange); }

.pixel-art { image-rendering: pixelated; image-rendering: crisp-edges; }
.work-media { image-rendering: auto; } /* project images, reels, photos stay full quality */

* { border-radius: 0; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation: none !important; transition: none !important; }
}
```
