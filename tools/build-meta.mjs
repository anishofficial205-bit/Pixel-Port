// Stamps link-preview tags (Open Graph, Twitter) into the pages' heads. Run: node tools/build-meta.mjs
// Link previews need absolute URLs, so the site's address lives here and nowhere else: change BASE_URL when the
// domain changes, run this again and commit the result.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
export const BASE_URL = "https://portfolio2026-sable-pi.vercel.app";
export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
export const HOME_IMAGE = { path: "assets/og/home.jpg", w: 1200, h: 630 };
/** the block of tags for one page */
export const metaBlock = ({ title, description, path, image = HOME_IMAGE, type = "website" }) => `  <!-- meta:start (written by tools/build-meta.mjs; edit there) -->
  <meta property="og:type" content="${type}" />
  <meta property="og:site_name" content="Anish Shah" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(description)}" />
  <meta property="og:url" content="${BASE_URL}/${path}" />
  <meta property="og:image" content="${BASE_URL}/${image.path}" />${image.w ? `
  <meta property="og:image:width" content="${image.w}" />
  <meta property="og:image:height" content="${image.h}" />` : ""}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${esc(title)}" />
  <meta name="twitter:description" content="${esc(description)}" />
  <meta name="twitter:image" content="${BASE_URL}/${image.path}" />
  <!-- meta:end -->
`;
/** put the block into a page's head (replacing an earlier one), just before the first stylesheet or preconnect link */
export const stamp = (html, block) => {
  html = html.replace(/ {2}<!-- meta:start[\s\S]*?<!-- meta:end -->\n/, "");
  const at = html.indexOf('  <link rel="icon"');
  if (at < 0) throw new Error("no place for the meta block");
  return html.slice(0, at) + block + html.slice(at);
};
const PAGES = [
  { file: "index.html", path: "", title: "Anish Shah · Design Portfolio", description: "Design portfolio of Anish Shah: an illustrated ride through one night in the city." },
  { file: "projects.html", path: "projects.html", title: "All projects · Anish Shah", description: "Every project by Anish Shah: branding, packaging, UI/UX and editorial design." },
  { file: "project.html", path: "project.html", title: "Projects · Anish Shah", description: "Case studies by Anish Shah: branding, packaging, publication, UI/UX and production design." },
];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const p of PAGES) { writeFileSync(ROOT + p.file, stamp(readFileSync(ROOT + p.file, "utf8"), metaBlock(p))); console.log("meta ->", p.file); }
}
