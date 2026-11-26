// Builds the store's Knowledge Base (#/wiki, later 1laser.com/wiki) from the public wiki export that OneLaser Work OS uses
// (GitHub Hydrax91129/onelaser-support-center: a snapshot of wiki.1laser.com, 236 public guides, no internal records).
//   node scripts/build-wiki.mjs <path to a checkout of onelaser-support-center>
// Writes:
//   src/data/wiki.json            the guide list (title, family, topic, slug, summary) bundled with the page
//   public/wiki-data/<id>.json    one file per guide (cleaned HTML + table of contents), loaded when the guide is opened
//   public/wiki-data/search.json  plain text of every guide, loaded on the first search
// Slugs follow the wiki.1laser.com paths without the "en/" prefix, so 1laser.com/wiki/<slug> can serve the same addresses.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = process.argv[2];
if (!src || !fs.existsSync(path.join(src, "data/library.json"))) {
  console.error("Usage: node scripts/build-wiki.mjs <onelaser-support-center checkout>");
  process.exit(1);
}
const read = (f) => JSON.parse(fs.readFileSync(path.join(src, f), "utf8"));
const manifest = read("export-manifest.json");
if (manifest.private_operations_included !== false) throw new Error("Export must be public-only.");
const library = read("data/library.json");
const FAMILIES = library.families.map((f) => f.id);
const ORIGIN = "https://wiki.1laser.com";

// ---- slugs ----
const pathOf = (url) => decodeURIComponent(url.replace(/^https?:\/\/wiki\.1laser\.com\/?/i, "").replace(/[?#].*$/, "")).replace(/^\/+|\/+$/g, "").replace(/^en\//i, "").replace(/^en$/i, "");
const slugOf = (url) => {
  let s = pathOf(url).toLowerCase().replace(/[^a-z0-9/._-]+/g, "-");
  if (!s) return "welcome";
  if (FAMILIES.includes(s)) s += "/overview"; // the old section landing pages; /wiki/<family> is the family page
  return s;
};
const bySlug = new Map();
const idToSlug = new Map();
for (const a of library.articles) {
  const slug = slugOf(a.source_url);
  if (bySlug.has(slug)) throw new Error(`Duplicate slug ${slug}`);
  bySlug.set(slug, a.id);
  idToSlug.set(a.id, slug);
}
const pathToSlug = new Map(library.articles.map((a) => [pathOf(a.source_url).toLowerCase(), idToSlug.get(a.id)]));

// ---- HTML clean-up (the export is already hardened; this is a second, strict allowlist because the page inserts the HTML) ----
const TAGS = new Set("p br hr h2 h3 h4 h5 h6 strong b em i u s sub sup code pre blockquote ul ol li a img figure figcaption table thead tbody tfoot tr th td span div".split(" "));
const DROP = /<(script|style|iframe|object|embed|noscript|template|svg|math|form|textarea|select|button)\b[\s\S]*?<\/\1\s*>/gi;
const ATTRS = { a: ["href"], img: ["src", "alt"], td: ["colspan", "rowspan"], th: ["colspan", "rowspan"], ol: ["start"] };
const esc = (v) => v.replace(/&(?!(?:[a-z]+|#\d+|#x[0-9a-f]+);)/gi, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attrsOf = (s) => Object.fromEntries([...s.matchAll(/([a-z-]+)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi)].map((m) => [m[1].toLowerCase(), m[3] ?? m[4] ?? m[5] ?? ""]));
const decode = (v) => v.replace(/&amp;/g, "&").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d));

let unresolved = 0;
let placeholders = 0;
function link(href, selfSlug) {
  href = decode(href.trim());
  if (/^(javascript|data|vbscript):/i.test(href.replace(/\s/g, ""))) return null;
  if (/YOUR_[A-Z0-9_]+/.test(href)) { placeholders++; return null; } // unfinished links in the source (e.g. ".../YOUR_CHILLER_URL"): show the text without a link
  const art = /^\/?#\/article\/(en-\d+)/.exec(href);
  if (art) { const s = idToSlug.get(art[1]); if (s) return { to: s }; unresolved++; return null; }
  if (/^#[^/]/.test(href)) return { anchor: href.slice(1), to: selfSlug };
  let abs = href;
  if (href.startsWith("/") && !href.startsWith("//")) abs = ORIGIN + href;
  if (/^https?:\/\/wiki\.1laser\.com/i.test(abs)) {
    const hash = /#([^/].*)$/.exec(abs)?.[1];
    const s = pathToSlug.get(pathOf(abs).toLowerCase()) ?? (pathOf(abs) === "" ? "welcome" : null);
    if (s) return hash ? { to: s, anchor: hash } : { to: s };
  }
  if (/^(https?:|mailto:|tel:)/i.test(abs)) return { url: abs };
  return null;
}
function clean(html, selfSlug) {
  let out = html.replace(/<!--[\s\S]*?-->/g, "").replace(DROP, "");
  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g, (tag, name, rest) => {
    name = name.toLowerCase();
    if (!TAGS.has(name)) return "";
    if (tag.startsWith("</")) return `</${name}>`;
    const a = attrsOf(rest);
    const keep = [];
    if (/^h[2-6]$/.test(name) && a.id) keep.push(`id="${esc(a.id)}"`);
    for (const k of ATTRS[name] || []) {
      if (!(k in a)) continue;
      if (name === "a" && k === "href") {
        const l = link(a.href, selfSlug);
        if (!l) continue;
        if (l.url) keep.push(`href="${esc(l.url)}" target="_blank" rel="noopener noreferrer"`);
        else if (l.anchor && l.to === selfSlug) keep.push(`href="#/wiki/${esc(l.to)}"`, `data-anchor="${esc(l.anchor)}"`); // same page: the page scrolls, the hash router is left alone
        else keep.push(`href="#/wiki/${esc(l.to)}${l.anchor ? `?h=${esc(encodeURIComponent(l.anchor))}` : ""}"`);
      } else if (name === "img" && k === "src") {
        let s = decode(a.src.trim());
        if (s.startsWith("/") && !s.startsWith("//")) s = ORIGIN + s;
        if (!/^https:\/\//i.test(s)) return "";
        keep.push(`src="${esc(s)}"`, `loading="lazy"`, `decoding="async"`, `referrerpolicy="no-referrer"`);
      } else if (/^(colspan|rowspan|start)$/.test(k)) {
        if (/^\d{1,3}$/.test(a[k])) keep.push(`${k}="${a[k]}"`);
      } else keep.push(`${k}="${esc(decode(a[k]))}"`);
    }
    if (name === "img" && !keep.some((x) => x.startsWith("src="))) return "";
    if (name === "img" && !("alt" in a)) keep.push('alt=""');
    return `<${name}${keep.length ? " " + keep.join(" ") : ""}>`;
  });
  return out.replace(/<p>\s*<\/p>/g, "").trim();
}
const STOP = new Set("a an the to of for and in on with how your you is my".split(" "));
const text = (html) => decode(html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ")).replace(/\s+/g, " ").trim();

// ---- titles: drop SEO tails ("X Series Wiki | Setup, …"), tell repeated titles apart ----
const tidy = (t) => t.replace(/\s+\|\s+.*$/, "").replace(/\bOnelaser\b/g, "OneLaser").replace(/\s+/g, " ").trim();
const titles = new Map(library.articles.map((a) => [a.id, tidy(a.title)]));
const count = {};
for (const v of titles.values()) count[v] = (count[v] || 0) + 1;
for (const a of library.articles) {
  const v = titles.get(a.id);
  if (count[v] > 1) { const last = idToSlug.get(a.id).split("/").pop(); titles.set(a.id, `${v} (${/^\d+w$/.test(last) ? last.toUpperCase() : last.replace(/-/g, " ")})`); }
}

// ---- write ----
// Everything is written to a temporary folder and swapped in only after the whole build succeeded and passed the checks below,
// so a failed run never leaves the store with half the guides.
const outDir = path.join(root, "public/wiki-data");
const tmpDir = path.join(root, "public/.wiki-data-tmp");
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir, { recursive: true });
const list = [];
const search = {};
for (const a of library.articles) {
  const art = read(`data/articles/${a.id}.json`);
  const slug = idToSlug.get(a.id);
  let html = clean(art.body_html, slug);
  // The body opens with the page title as a heading; the store page shows the title itself.
  // Only when that heading repeats the title (most of its words are in the title); a first section such as "Step 1" stays.
  const words = (x) => new Set(x.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w && !STOP.has(w)));
  const first = /^(<div>)?\s*<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html);
  if (first) {
    const h = words(text(first[2])), ti = words(`${a.title} ${titles.get(a.id)}`);
    const shared = [...h].filter((w) => ti.has(w)).length;
    if (h.size && shared / Math.min(h.size, words(titles.get(a.id)).size || 1) >= 0.6) html = html.replace(first[0], first[1] || "");
  }
  const toc = [...html.matchAll(/<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)].map((m) => ({ id: decode(m[2]), level: +m[1], text: text(m[3]) })).filter((h) => h.text);
  fs.writeFileSync(path.join(tmpDir, `${a.id}.json`), JSON.stringify({ html, toc }));
  const body = text(html);
  search[a.id] = body.toLowerCase(); // whole guide, so words near the end are found too
  const full = tidy(a.excerpt && tidy(a.excerpt) !== titles.get(a.id) ? a.excerpt : body);
  // Whole words only (the export's own summaries stop at 180 characters, often mid-word).
  const cut = full.length > 180 || (full.length >= 170 && !/[.!?…)"”]$/.test(full));
  const excerpt = cut ? `${full.slice(0, 180).replace(/[\s,;:.(–—-]+\S*$/, "")}…` : full;
  list.push({ id: a.id, slug, title: titles.get(a.id), family: a.family, topic: a.topic, excerpt, min: a.read_minutes || 1, updated: (a.source_updated_at || "").slice(0, 10) });
}
fs.writeFileSync(path.join(tmpDir, "search.json"), JSON.stringify(search));
// Checks before anything is replaced: every guide has a page with text, slugs are unique, no unsafe markup survived.
const problems = [];
if (list.length !== library.articles.length || list.length === 0) problems.push(`expected ${library.articles.length} guides, built ${list.length}`);
if (new Set(list.map((a) => a.slug)).size !== list.length) problems.push("duplicate slugs");
for (const a of list) {
  const page = JSON.parse(fs.readFileSync(path.join(tmpDir, `${a.id}.json`), "utf8"));
  if (!page.html || !text(page.html)) problems.push(`${a.id}: empty guide`);
  if (/<(script|iframe|object|embed|style)\b|\son[a-z]+\s*=|javascript:/i.test(page.html)) problems.push(`${a.id}: unsafe markup`);
  if (/href="[^"]*YOUR_[A-Z0-9_]+/.test(page.html)) problems.push(`${a.id}: placeholder link`);
}
if (problems.length) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
  console.error("[wiki] build stopped, nothing replaced:\n  " + problems.join("\n  "));
  process.exit(1);
}
// Swap the guide files and the guide list (src/data/wiki.json) as one version: if any step fails, the previous set is put back.
const listFile = path.join(root, "src/data/wiki.json");
const listTmp = `${listFile}.tmp`;
const oldDir = path.join(root, "public/.wiki-data-old");
const oldList = `${listFile}.old`;
fs.writeFileSync(listTmp, JSON.stringify({ snapshot: manifest.source_snapshot_date, families: FAMILIES, articles: list }, null, 0) + "\n");
fs.rmSync(oldDir, { recursive: true, force: true });
fs.rmSync(oldList, { force: true });
// Each step is recorded once it succeeded, and a rollback undoes only those steps (never deletes the old guides still in place).
const done = { oldDir: false, oldList: false, newDir: false, newList: false };
try {
  if (fs.existsSync(outDir)) { fs.renameSync(outDir, oldDir); done.oldDir = true; }
  if (fs.existsSync(listFile)) { fs.renameSync(listFile, oldList); done.oldList = true; }
  fs.renameSync(tmpDir, outDir); done.newDir = true;
  fs.renameSync(listTmp, listFile); done.newList = true;
} catch (err) {
  if (done.newList) fs.rmSync(listFile, { force: true });
  if (done.newDir) fs.rmSync(outDir, { recursive: true, force: true });
  if (done.oldDir) fs.renameSync(oldDir, outDir);
  if (done.oldList) fs.renameSync(oldList, listFile);
  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.rmSync(listTmp, { force: true });
  console.error("[wiki] could not replace the data, previous version kept:", err.message);
  process.exit(1);
}
fs.rmSync(oldDir, { recursive: true, force: true });
fs.rmSync(oldList, { force: true });
console.log(`wiki: ${list.length} guides, ${FAMILIES.length} families, ${unresolved} dead internal links and ${placeholders} placeholder links dropped`);
