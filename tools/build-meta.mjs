// Stamps link-preview tags (Open Graph, Twitter) into the pages' heads, writes a page for each public project
// (thrive.html and so on) and writes robots.txt and sitemap.xml.
// Run: node tools/build-meta.mjs
// Link previews need absolute URLs, so the site's address lives here and nowhere else: change BASE_URL when the
// domain changes, run this again and commit the result.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
export const BASE_URL = "https://portfolio2026-sable-pi.vercel.app";
export const ROOT = fileURLToPath(new URL("..", import.meta.url));
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
export const HOME_IMAGE = { path: "assets/og/home.jpg", w: 1200, h: 630 };
/** the block of tags for one page */
export const metaBlock = ({ title, description, path, image = HOME_IMAGE, type = "website", extra = "" }) => `  <!-- meta:start (written by tools/build-meta.mjs; edit there) -->
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
  <meta name="twitter:image" content="${BASE_URL}/${image.path}" />${extra}
  <!-- meta:end -->
`;
/** put the block into a page's head (replacing an earlier one), just before the first stylesheet or preconnect link */
export const stamp = (html, block) => {
  html = html.replace(/ {2}<!-- meta:start[\s\S]*?<!-- meta:end -->\n/, "");
  const at = html.indexOf('  <link rel="icon"');
  if (at < 0) throw new Error("no place for the meta block");
  return html.slice(0, at) + block + html.slice(at);
};
/** the site's content (js/data.js is a browser script that fills window.SITE) */
export const loadSite = () => { const w = {}; new Function("window", readFileSync(ROOT + "js/data.js", "utf8"))(w); return w.SITE; };
/** the projects anyone may see: everything not under NDA */
export const publicProjects = (site = loadSite()) => site.projects.filter((p) => !p.nda);
/** a project's address, relative to the site root */
export const projectPath = (p) => `${p.id}.html`;
/** robots.txt and sitemap.xml (audit P2-1): the home page, All projects and each public project */
export const writeCrawlFiles = () => {
  const paths = ["", "projects.html", ...publicProjects().map(projectPath)];
  writeFileSync(ROOT + "robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${BASE_URL}/sitemap.xml\n`);
  writeFileSync(ROOT + "sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((x) => `  <url><loc>${esc(`${BASE_URL}/${x}`)}</loc></url>`).join("\n")}\n</urlset>\n`);
  console.log("robots.txt, sitemap.xml ->", paths.length, "addresses");
};
/** A page of its own for each public project (audit P2-3): a copy of project.html with the project's title,
    description and picture written into the head, because link unfurlers and crawlers don't run the script that
    fills them in. project.html?p=<id> keeps working; it shows the same thing and moves the address bar to the
    project's own page, so a link copied from there previews properly. The pages are committed (no build on Vercel):
    run this again after editing project.html or a project's title, blurb or cover. */
export const writeProjectPages = () => {
  const list = publicProjects();
  // project.html learns which projects have a page of their own
  const pages = `\n  <meta name="project-pages" content="${list.map((p) => p.id).join(" ")}" />`;
  const base = { file: "project.html", path: "project.html", title: "Projects · Anish Shah", description: "Case studies by Anish Shah: branding, packaging, publication, UI/UX and production design." };
  const shell = stamp(readFileSync(ROOT + "project.html", "utf8"), metaBlock({ ...base, extra: pages }));
  writeFileSync(ROOT + "project.html", shell);
  for (const p of list) {
    const title = `${p.title} · Anish Shah`, description = p.intro || p.blurb, path = projectPath(p);
    const og = `assets/og/${p.id}.jpg`;                                  // made by tools/build_og.py from the cover
    const image = existsSync(ROOT + og) ? { path: og, w: 1200, h: 630 } : { path: p.cover };
    const extra = `\n  <meta name="project" content="${p.id}" />\n  <link rel="canonical" href="${BASE_URL}/${path}" />`;
    let html = stamp(shell, metaBlock({ title, description, path, image, type: "article", extra }));
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`).replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`);
    writeFileSync(ROOT + path, html.replace("<!doctype html>\n", "<!doctype html>\n<!-- written by tools/build-meta.mjs from project.html: edit that file, not this one -->\n"));
    console.log("page ->", path);
  }
};
const PAGES = [
  { file: "index.html", path: "", title: "Anish Shah · Design Portfolio", description: "Design portfolio of Anish Shah: an illustrated ride through one night in the city." },
  { file: "projects.html", path: "projects.html", title: "All projects · Anish Shah", description: "Every project by Anish Shah: branding, packaging, UI/UX and editorial design." },
];
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const p of PAGES) { writeFileSync(ROOT + p.file, stamp(readFileSync(ROOT + p.file, "utf8"), metaBlock(p))); console.log("meta ->", p.file); }
  writeProjectPages();
  writeCrawlFiles();
}
