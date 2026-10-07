# Portfolio Audit — Anish Shah

Oct 8, 2026 · @Anish

Round 2 of the audit of portfolio2026-sable-pi.vercel.app, re-checked after your changes and written as a task list Claude Code can work through. 12 things improved since round 1; 21 code tasks remain (4 blocking), plus 9 decisions only you can make.

## Fixed since round 1

The biggest risks from round 1 are gone: no more stock photos, the reels are real, and the homepage is roughly 5× faster. Claude Code should leave these alone.

| Area | Round 1 (7 Oct) | Now (8 Oct) |
| --- | --- | --- |
| Photos | 4 picsum.photos stock images with fake captions | 4 real albums (Jodhpur, Street Portraits, Friends, Second Chance), self-hosted |
| Reels | 3 placeholders, all "coming soon" | 3 real reels (Fort, Marine Drive, Udaipur), self-hosted mp4 |
| Homepage weight, desktop | about 11 MB, 70 requests | about 5.9 MB, 60 requests |
| Homepage weight, phone | not tested | about 1.5 MB (phones now get 1x art) |
| Full load | 22.5 s | 4.1 s |
| Layout shift (CLS) | 0.66 | 0.00 |
| Navigation | 9px metro-dot labels | Top text nav, 11px, with All projects link |
| Gallery | Character covered the photo | Character stands clear of the frame |
| Home project cards | Long briefs | Short one-liners for Krumble, Parde Ke Peeche, Haven |
| About | Paragraph only | Adds Based in, Right now and Résumé |
| All projects | 6 projects | 8, including 2 NDA projects with a clear "details on request" page |
| Console | Canvas warning | Clean (one minor iframe warning, see P2) |

Still open from round 1: the email address, the demo font, favicon and link previews, copy fixes, Framer-hosted images, alt text, tap targets, Bali credits and case-study outcomes.

## How to use this with Claude Code

Export this doc as Markdown, save it in the repo root as `AUDIT.md`, open Claude Code in the repo and paste the prompt below.

```
Read AUDIT.md. It is an audit of this portfolio site with numbered tasks (P0-x, P1-x, P2-x).

Work through the tasks in order: all P0, then P1, then P2.
For each task:
1. Find the code using the "Find" hints (grep the strings given; file names are guesses, the strings are reliable).
2. Make only the change described. Do not redesign the ride, the illustrations or the layout.
3. Run the "Done when" check and confirm it passes.
4. Make one git commit per task, with the task ID in the message.

Rules:
- Skip everything under "Needs you". Never invent copy, outcomes, roles, credits or facts about my projects.
  Where a task needs my content, add the structure with a clearly marked TODO and tell me.
- Keep the Ride and Simple views in sync: most content exists in both.
- Keep UK spelling in all visible copy (colour, realise, practise as a verb).
- After all tasks, run the Final verification checklist and report results as a table.
- If a task's instructions don't match what you find in the code, stop and ask me instead of guessing.
```

Each task below has the same shape: **Problem** (what's wrong), **Find** (where to look), **Change** (what to do) and **Done when** (how to check it).

## P0 — fix before sharing the link

### P0-1 · Wrong contact email

- **Problem:** Every mailto link and visible email reads `anishofficial205@email.com`. Mail to it never reaches you. This is still the single most damaging bug on the site.
- **Find:** grep the repo for `@email.com`. It appears in the Ride contact (rooftop), the Simple view contact, and the "Get in touch" button on the NDA project pages (`project.html?p=please-see`, `?p=miso`), probably driven from one data/config file.
- **Change:** Replace with `anishofficial205@gmail.com` everywhere, in both the link `href` and the visible text. Keep the existing `?subject=` parameter.
- **Done when:** `grep -r "@email.com" .` (excluding `node_modules` and `AUDIT.md`) returns nothing, and every mailto on index.html, projects.html and both NDA pages shows the gmail address.

### P0-2 · No favicon

- **Problem:** `/favicon.ico` returns 404 and no page has an icon link, so the browser tab shows a blank icon.
- **Find:** `<head>` of `index.html`, `projects.html`, `project.html`; source art at `assets/brand/logo.png`.
- **Change:** From the logo, generate `favicon.ico` (32×32), `favicon.svg` or `favicon-32.png`, and `apple-touch-icon.png` (180×180, solid dark background matching the site). Put `favicon.ico` in the site root. Add `<link rel="icon">` and `<link rel="apple-touch-icon">` to all three HTML files, plus `<meta name="theme-color">` using the site's dark background colour.
- **Done when:** `/favicon.ico` returns 200 and each HTML file's head has the icon links.

### P0-3 · No link previews when shared

- **Problem:** No Open Graph or Twitter tags on any page, so a link pasted into LinkedIn, WhatsApp or email shows no image or card.
- **Find:** `<head>` of the three HTML files.
- **Change:**
  1. Create `assets/og/home.jpg`, 1200×630, cropped from `assets/scenes/street.webp` with the "anish shah" logo lettering in frame, under 300 KB.
  2. Add to `index.html`: `og:type=website`, `og:title`, `og:description` (reuse the meta description), `og:image` (absolute URL), `og:image:width/height`, `og:url`, `twitter:card=summary_large_image`.
  3. Add the same to `projects.html` with its own title and description.
  4. Add a sensible default set to `project.html` (title "Projects · Anish Shah", the home OG image). Per-project previews are P1-9.
  5. Use absolute URLs on the current domain; keep the domain in one place so it's easy to change later.
- **Done when:** All three pages have `og:title`, `og:description`, `og:image` and `twitter:card` in the raw HTML (view-source, not the rendered DOM).

### P0-4 · Unknown project links show Thrive

- **Problem:** `project.html?p=anything-wrong` renders the Thrive case study instead of an error, so a typo in a shared link shows the wrong project.
- **Find:** the script that reads the `p` query parameter in `project.html` and looks up the project data; look for a fallback to the first project.
- **Change:** If the slug doesn't match a project (or is missing), show a "Project not found" state in the page's own style: one line of text, a link to `projects.html` and a link back to the ride. Set the document title to "Project not found · Anish Shah". Don't render any project content.
- **Done when:** `project.html?p=nope` and `project.html` (no parameter) show the not-found state; all 8 real slugs (`thrive`, `krumble`, `parde-ke-peeche`, `haven`, `bali`, `making`, `please-see`, `miso`) still render correctly.

## P1 — this week

### P1-1 · Copy corrections

- **Problem:** Mixed US/UK spelling, missing hyphens and a few typos in case-study copy. All of these were confirmed on the live site today.
- **Find:** grep each "Now" string; the copy most likely lives in the project data file that feeds `project.html` and the home cards.
- **Change:** Replace exactly as below. Only change visible copy, never CSS property names (`color:` in CSS stays).

| Project | Now | Replace with |
| --- | --- | --- |
| Thrive | `The color palette for Thrive` | `The colour palette for Thrive` |
| Thrive | `the brand’s logo and colors` | `the brand’s logo and colours` |
| Krumble | `the packaging utilizes Rigid Chipboard` | `the packaging uses rigid chipboard` |
| Krumble | `plastic heavy formats` | `plastic-heavy formats` |
| Krumble | `gift worthy` (every occurrence) | `gift-worthy` |
| Parde Ke Peeche | `hidden craftsmanship of Bollywood like cinematography` | `hidden craft of Bollywood, such as cinematography` |
| Parde Ke Peeche | `the publication’s rhythm and tight enough` | `the publication’s rhythm: tight enough` |
| Haven | `practice boundaries` (every occurrence) | `practise boundaries` |
| Haven | `learn and practice consent` | `learn and practise consent` |
| Haven | `Indian adolescents aged 16–22` (every occurrence) | `young people aged 16–22 in India` |
| Bali | `bloodied machette` | `bloodied machete` |
| Bali | `A hand sketched top view` | `A hand-sketched top view` |
| Bali | `an AI generated reference` | `an AI-generated reference` |

In UK spelling "practise" is the verb and "practice" the noun. So also change verb forms like `a skill to be practiced` → `a skill to be practised` (Haven conclusion), but leave nouns such as "a lived practice" unchanged.

- **Done when:** none of the "Now" strings appear in the repo, and the Ride and Simple views show identical copy.

### P1-2 · Thrive still describes the assignment, not your work

- **Problem:** On the homepage (Simple view, Selected work) and at the top of the Thrive case study, Thrive's description is still the brief: "Design a brand for a company that makes stylish desk accessories. The brand should feel creative, eco-friendly, and perfect for modern workspaces." Every other project now has a short one-liner.
- **Find:** grep `Design a brand for a company`.
- **Change:** Home card: use the one-liner already on All projects, `Brand identity for eco-friendly desk accessories`. Case-study lead: `Brand identity for Thrive, a modular, eco-friendly desk-accessory brand that feels premium but stays affordable.`
- **Done when:** `grep -r "Design a brand for a company"` returns nothing.

### P1-3 · Project images are hotlinked from the old Framer site

- **Problem:** Most case-study and billboard images load from `framerusercontent.com` (17 on the homepage, 67 on Thrive, 14–17 on Krumble, Parde Ke Peeche and Haven, 4 on Bali). If the Framer site is unpublished or the plan lapses, they disappear. They're also fetched at 1024px for 110–332px slots.
- **Find:** grep `framerusercontent.com`.
- **Change:**
  1. Write a one-off script that collects every `framerusercontent.com` URL (images and the one `.mp4`), strips the `?scale-down-to=` query, downloads the original, and saves it as `assets/projects/<project-slug>/<nn>.webp` (convert to WebP at quality 80; keep video as mp4).
  2. Produce two widths where an image is shown in a small slot (billboards, cards): 640px and 1280px, wired with `srcset`/`sizes`.
  3. Rewrite every reference to the local path. Keep the tiny blurred background images (`scale-down-to=32`) as local 32px files too.
- **Done when:** `grep -r framerusercontent` returns nothing outside the download script, and every project page renders with no broken images (check the console for 404s).

### P1-4 · Character sprite sheets are still heavy

- **Problem:** The character art is now the biggest cost: on desktop `character/drain-2x.webp` is 2.3 MB, `main-2x.webp` 1.1 MB, `stairs-2x.webp` 0.8 MB; on phones `drain.webp` is 0.8 MB.
- **Find:** `assets/character/`.
- **Change:** Re-encode each sheet as WebP at quality 70–75 (try lossless-alpha off; keep alpha). Also check whether the frame grid has empty padding that can be trimmed without changing frame coordinates; if trimming would change coordinates, don't. Load `drain` and `stairs` sheets only when the rider is one scene away, not on page load.
- **Done when:** `drain-2x.webp` ≤ 900 KB, the other 2x sheets ≤ 500 KB, and a side-by-side screenshot of each scene at 2x shows no visible banding or edge artefacts. Report the before/after sizes.

### P1-5 · Homepage shows 4 of your 6 public projects

- **Problem:** The homepage says "4 projects across branding, packaging, publication and UI/UX". The Ride (your strongest UX case study, about this very site) and Bali are only on All projects.
- **Find:** the Selected work list in the Simple view (`#plain-subway`), the Ride subway section (`#subway`), and the project data that defines which projects are featured.
- **Change:** Add The Ride and Bali to the Simple view's Selected work as lines 05 and 06, using their existing All projects one-liners and years. Update the intro line to "6 projects across branding, packaging, publication, UI/UX and production design." In the Ride view, add The Ride to the rotating billboard set. Keep the NDA projects off the homepage.
- **Done when:** Both views link to `project.html?p=making` and `project.html?p=bali`, and the project count text matches.

### P1-6 · Case studies without structure

- **Problem:** Krumble and Parde Ke Peeche have no section headings; Thrive has only Problem and Solution. Haven, Bali and The Ride are well structured. Reviewers skim by headings.
- **Find:** the content blocks for these three projects in the project data.
- **Change:** Add H3 headings above the existing paragraphs, using only labels that describe what's already there. Don't rewrite or add paragraphs.
  - Thrive: Problem · Solution · The identity · Logo exploration · Colour · 3D and product studies
  - Krumble: The problem · Research and sketches · Colour system · Material
  - Parde Ke Peeche: Overview · Grid system

  Also add an optional "Outcome and learnings" block to the data schema for every project, rendered only when it has content. Leave it empty; the text comes from "Needs you".
- **Done when:** each of the three pages shows at least 2 H3s in reading order, and no empty heading appears anywhere.

### P1-7 · Missing alt text

- **Problem:** Thrive has 48 images with empty alt, the other case studies about 8 each, and the 4 album thumbnails in the Ride gallery have `alt=""` (the Simple view's copies are labelled).
- **Find:** project data image entries; the gallery thumbnail markup in the Ride view.
- **Change:** Open each case-study image and write a short, factual alt (under 120 characters) saying what the image shows, e.g. "Thrive wordmark in teal on a cream desk organiser". Use the album name for the 4 gallery thumbnails ("Jodhpur album cover"). Keep `alt=""` only for decorative scene art, sprites, background blurs and the logo when it's inside a labelled link.
- **Done when:** no project-work image has empty alt, and decorative images still do.

### P1-8 · Tap targets too small on phones

- **Problem:** Measured at 375px width: nav links 30px tall, Ride/Simple 26px, reel Mute and Full screen buttons 21×21px, LinkedIn and Résumé 19px, "View all projects" 22px, "Play again" 23px, the email link 28px. The minimum is 44×44px.
- **Find:** styles for the top nav, mode toggle, reel controls and contact links.
- **Change:** Under `@media (pointer: coarse)`, enlarge hit areas to at least 44×44px using padding or a transparent `::after` extending the hit area, without changing the visual size of icons or text where that would break the layout.
- **Done when:** at 375×812 with touch emulation, every visible `a` and `button` has a bounding box (or hit area) of at least 44×44px.

### P1-9 · Text below 11px

- **Problem:** Billboard captions and some card labels are 10px; category tags on cards ("BRANDING", "PACKAGING", "PUBLICATION DESIGN") are 8px.
- **Find:** grep the CSS for `font-size` values of 8px, 9px, 10px (or rem equivalents under 0.69rem).
- **Change:** Raise all visible text to at least 11px; uppercase tracked labels to 11–12px. Check that billboard captions still fit their frames.
- **Done when:** no visible text element computes below 11px on the homepage or All projects.

### P1-10 · "Scroll to start" on touch screens

- **Problem:** Phones show a mouse icon with "Scroll to start".
- **Find:** grep `Scroll to start`.
- **Change:** Under `(pointer: coarse)`, swap the mouse icon for a simple swipe-up icon and the text for "Swipe up to start".
- **Done when:** touch emulation shows the swipe version; desktop is unchanged.

## P2 — when you can

### P2-1 · robots.txt and sitemap.xml

- **Problem:** Both return 404.
- **Change:** Add `robots.txt` (allow all, point to the sitemap) and `sitemap.xml` listing `/`, `/projects.html` and the 6 public project URLs (skip the NDA pages). Use the same base-URL constant as P0-3.
- **Done when:** both files return 200 and the sitemap validates as XML.

### P2-2 · Styled 404 page

- **Problem:** Bad URLs show Vercel's default "NOT\_FOUND" page.
- **Change:** Add `404.html` in the site root (Vercel serves it automatically for static sites) in the site's night-city style: a single scene image or the character, the line "You've taken a wrong turn", and links to the ride and All projects. Reuse existing CSS and fonts; no new art.
- **Done when:** `/any-bad-path` returns status 404 with the custom page.

### P2-3 · Per-project link previews

- **Problem:** `project.html` sets its title in JavaScript and has no meta description, so a shared project link previews as generic. Crawlers and link unfurlers don't run JavaScript.
- **Change:** Add a small build script (Node, no framework) that writes a static copy of `project.html` per public project with the correct `<title>`, meta description, `og:*` tags and `og:image` (the project's cover image) baked into the head. Keep `project.html?p=<slug>` working exactly as now, so no existing links break. Run it as part of the Vercel build (`package.json` `build` script) or commit the generated files; tell me which you chose.
- **Done when:** fetching a project's static URL with `curl` shows its own title, description and image in the HTML.

### P2-4 · Image dimensions

- **Problem:** 62 of 63 homepage images have no `width`/`height`. Layout shift is already 0 thanks to fixed scene containers, so this is a safety net, not a fix.
- **Change:** Add intrinsic `width` and `height` attributes to every `<img>` (read them from the files), including project images after P1-3.
- **Done when:** every `<img>` on index.html, projects.html and project pages has both attributes.

### P2-5 · Self-host fonts

- **Problem:** Satoshi loads from api.fontshare.com and Hind from Google Fonts: two extra connections before text renders.
- **Change:** Download the used weights (Satoshi 400/500/700/900; Hind 500/700, Latin + Devanagari subsets) as `woff2` into `assets/fonts/`, declare them with `@font-face` and `font-display: swap`, preload the two most used files, and remove the external stylesheet links and preconnects. Don't touch the script face; see "Needs you".
- **Done when:** no requests go to fontshare.com or googleapis.com, and text looks the same.

### P2-6 · Embeds on Bali

- **Problem:** Two Vimeo players and two Heyzine flipbooks load on page open. The console also warns "Allow attribute will take precedence over 'allowfullscreen'".
- **Change:** Add `loading="lazy"` to all iframes; where `allow` already includes `fullscreen`, remove the redundant `allowfullscreen` attribute.
- **Done when:** the Bali page console shows no allowfullscreen warning and the embeds load only when scrolled near.

### P2-7 · Structured data

- **Change:** Add a `Person` JSON-LD block to `index.html`: name Anish Shah, jobTitle "Visual & Product Designer", address Mumbai, India, `sameAs` the LinkedIn URL already on the site, `url` the site URL.
- **Done when:** the block parses as valid JSON.

## Needs you (Claude Code: skip this section)

These are decisions or content only you can supply. Once you have them, give them to Claude Code as a follow-up task.

- [ ] **Confirm the email.** P0-1 assumes `anishofficial205@gmail.com`. If you'd rather use a different address, change it in P0-1 before running.
- [ ] **Script font licence.** The logo lettering loads `talina-demo.woff2`. Demo fonts are usually personal-use only. Buy the licence and swap in the full file, or pick another face. Don't publish widely until this is settled.
- [ ] **Your role on Bali.** It's a classroom team project with no credits. Write one line ("My role: production design lead, set dressing and storyboards" or whatever is true) and the team's names.
- [ ] **Your role on the NDA projects.** Please See and Miso.Inc pages say only "details on request". Add one line each that NDAs usually allow: your role, dates and the kind of work (e.g. "Design intern, Jun–Aug 2025, brand and social design").
- [ ] **Outcomes and learnings** for Thrive, Krumble, Parde Ke Peeche and Haven: 2–4 lines each covering feedback or grade, what you'd do next, and one thing you learned. P1-6 creates the empty slot.
- [ ] **Framer and Behance links.** Every case study ends with "View this project on my Framer site" (Bali: Behance). Once P1-3 is done the new pages are complete: decide whether to remove those links and unpublish anishah.framer.website.
- [ ] **Résumé as a PDF.** The résumé is a Google Drive viewer link, slow on phones. Drop a PDF into the repo and ask Claude Code to link `assets/resume/anish-shah-resume.pdf` instead.
- [ ] **Custom domain.** `portfolio2026-sable-pi.vercel.app` is hard to read on a résumé. If you buy one (e.g. your name), update the base-URL constant from P0-3.
- [ ] **"Looking for a grad project".** Still on the hero and in About. If you mean an internship or a graduation-project placement, say which and when (e.g. "Open to grad projects, 2027").

## Final verification

Claude Code runs these after all tasks (locally with `npx serve .` or on the Vercel preview) and reports each as pass/fail. Then do a 5-minute manual pass on your own phone.

- [ ] `grep -r "@email.com\|framerusercontent\|Design a brand for a company\|machette" .` returns nothing (excluding `AUDIT.md` and the P1-3 download script)
- [ ] `/favicon.ico`, `/robots.txt`, `/sitemap.xml` return 200; `/bad-path` returns the custom 404
- [ ] View-source of `index.html` and `projects.html` contains `og:image` and `twitter:card`
- [ ] `project.html?p=nope` shows "Project not found"; all 8 real slugs render
- [ ] Homepage console: no errors, no 404s, in both Ride and Simple modes
- [ ] Homepage transfer ≤ 4 MB on desktop and ≤ 1.5 MB on a 375px phone (DevTools Network, cache disabled); report the numbers
- [ ] At 375×812 with touch emulation: no horizontal scroll, every link/button hit area ≥ 44×44px, no text under 11px
- [ ] Every project-work image has non-empty alt
- [ ] Ride and Simple views show the same 6 public projects and the same copy
- [ ] Manual, on your phone: tap the email link and send yourself a test email; play one reel; open one photo album; open every project from the homepage
