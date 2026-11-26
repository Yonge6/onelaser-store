// Refresh a public Wiki.js export. With --cache, the entire run is offline.
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const ORIGIN = "https://wiki.1laser.com";
const MARKER = ".onelaser-wiki-sync"; // written into every output and cache folder this tool creates
const PAGE_QUERY = "{ pages { list(limit: 2000) { id path locale title updatedAt isPublished } } }";
const USER_AGENT = "OneLaser-store-wiki-sync";
const CONCURRENCY = 4;
const ARTICLE_FILE = /^(en-\d+)\.json$/;
const UNSAFE_HTML = /<script|<iframe|\son\w+\s*=|javascript:/i;
const REDIRECTS = new Set([301, 302, 303, 307, 308]);

const writeJson = (file, data) => fs.writeFileSync(file, JSON.stringify(data) + "\n");

function readJson(file) {
  const contents = fs.readFileSync(file, "utf8");
  try {
    return JSON.parse(contents);
  } catch (error) {
    throw new Error(`${file}: ${error.message}`);
  }
}

async function wikiResponse(url, options, signal) {
  for (let redirects = 0; ; redirects++) {
    if (url.origin !== ORIGIN || url.username || url.password) {
      throw new Error(`Refusing to request a URL outside ${ORIGIN}: ${url.href}`);
    }
    const response = await fetch(url, {
      ...options,
      headers: { ...options.headers, "User-Agent": USER_AGENT },
      redirect: "manual",
      signal,
    });
    if (!REDIRECTS.has(response.status)) return response;

    const location = response.headers.get("location");
    await response.body?.cancel();
    if (!location || redirects === 5) throw new Error(`Invalid redirect from ${url.href}`);
    if (options.method === "POST" && ![307, 308].includes(response.status)) {
      throw new Error(`Unexpected HTTP ${response.status} redirect for GraphQL POST`);
    }
    url = new URL(location, url);
  }
}

async function fetchWiki(route, options = {}) {
  const url = new URL(route, ORIGIN);
  for (let attempt = 0; ; attempt++) {
    let failure;
    let retryable = true;
    try {
      const response = await wikiResponse(url, options, AbortSignal.timeout(20_000));
      if (response.ok) return await response.text();
      failure = new Error(`HTTP ${response.status}`);
      retryable = response.status === 408 || response.status === 429 || response.status >= 500;
      await response.body?.cancel();
    } catch (error) {
      failure = error;
    }
    if (attempt === 3 || !retryable) {
      throw new Error(`${options.method ?? "GET"} ${url.href}: ${failure.message}`);
    }
    await delay(500 * 2 ** attempt);
  }
}

// Wiki.js supplies rendered HTML. Scan whole tags so quotes and comments
// cannot be mistaken for heading, div, or template boundaries.
const TAG = /<!--[\s\S]*?(?:-->|$)|<![^>]*>|<(\/?)([a-z][\w:-]*)(?=[\s/>])((?:[^"'<>]|"[^"]*"|'[^']*')*)>/gi;
const RAW_TEXT = new Set(["script", "style", "title", "textarea", "xmp", "iframe", "noembed", "noframes"]);
const ATTR = /\s+([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

function* tagsIn(html) {
  const pattern = new RegExp(TAG);
  for (let match; (match = pattern.exec(html)); ) {
    if (!match[2]) continue;
    const [, slash, name, attributes] = match;
    const tag = {
      start: match.index, end: pattern.lastIndex, name: name.toLowerCase(), sourceName: name, closing: slash === "/", attributes,
    };
    yield tag;
    if (!tag.closing && RAW_TEXT.has(tag.name)) {
      const close = new RegExp(`</${tag.name}\\s*>`, "gi");
      close.lastIndex = tag.end;
      const end = close.exec(html);
      if (!end) return;
      pattern.lastIndex = end.index;
    }
  }
}

function attribute(attributes, name) {
  for (const match of attributes.matchAll(ATTR)) {
    if (match[1].toLowerCase() === name) return match[2] ?? match[3] ?? match[4] ?? "";
  }
  return "";
}

function contentsOf(html) {
  let opening;
  for (const tag of tagsIn(html)) {
    if (tag.name !== "template") continue;
    if (!opening) {
      if (!tag.closing && attribute(tag.attributes, "slot") === "contents") opening = tag;
    } else {
      if (!tag.closing) throw new Error("Nested <template> inside the contents template");
      return html.slice(opening.end, tag.start).trim();
    }
  }
  throw new Error(opening ? "Unclosed contents template" : 'Missing <template slot="contents">');
}

function stripTocAnchors(html) {
  let result = "";
  let copiedThrough = 0;
  let anchorStart;
  for (const tag of tagsIn(html)) {
    if (tag.name !== "a") continue;
    if (tag.closing && anchorStart !== undefined) {
      result += html.slice(copiedThrough, anchorStart);
      copiedThrough = tag.end;
      anchorStart = undefined;
    } else if (!tag.closing && attribute(tag.attributes, "class").split(/\s+/).includes("toc-anchor")) {
      anchorStart = tag.start;
    }
  }
  if (anchorStart !== undefined) throw new Error("Unclosed TOC anchor");
  return result + html.slice(copiedThrough);
}

const ENTITIES = new Map(Object.entries({
  amp: "&", apos: "'", gt: ">", lt: "<", nbsp: " ", quot: '"',
  ndash: "–", mdash: "—", lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  hellip: "…", deg: "°", times: "×", para: "¶",
}));

function decodeEntities(text) {
  return text.replace(/&(#x[\da-f]+|#\d+|[a-z][a-z\d]*);/gi, (entity, name) => {
    if (!name.startsWith("#")) return ENTITIES.get(name.toLowerCase()) ?? entity;
    const hex = name[1].toLowerCase() === "x";
    const point = Number.parseInt(name.slice(hex ? 2 : 1), hex ? 16 : 10);
    return point > 0 && point <= 0x10ffff && !(point >= 0xd800 && point <= 0xdfff)
      ? String.fromCodePoint(point)
      : "\uFFFD";
  });
}

const plainText = (html) => decodeEntities(html.replace(TAG, " ")).replace(/\s+/g, " ").trim();

function hasOuterDiv(html) {
  let depth = 0;
  for (const tag of tagsIn(html)) {
    if (depth === 0 && (tag.start !== 0 || tag.name !== "div" || tag.closing)) return false;
    if (tag.name !== "div") continue;
    depth += tag.closing ? -1 : 1;
    if (depth === 0) return tag.end === html.length;
  }
  return false;
}

function renderPage(html) {
  const body = stripTocAnchors(contentsOf(html)).trim();
  if (!body) throw new Error("Empty contents template");

  const headings = [];
  let excerpt = "";
  let paragraphStart;
  let firstParagraphRead = false;
  let heading;
  let normalized = "";
  let copiedThrough = 0;
  for (const tag of tagsIn(body)) {
    if (!firstParagraphRead && tag.name === "p") {
      if (!tag.closing) paragraphStart = tag.end;
      else if (paragraphStart !== undefined) {
        excerpt = Array.from(plainText(body.slice(paragraphStart, tag.start))).slice(0, 180).join("");
        firstParagraphRead = true;
      }
    }
    if (!/^h[1-6]$/.test(tag.name)) continue;
    const level = Number(tag.name[1]);
    if (!tag.closing && level <= 3) {
      heading = { level, id: decodeEntities(attribute(tag.attributes, "id")), start: tag.end };
    } else if (tag.closing && heading?.level === level) {
      headings.push({ level, id: heading.id, text: plainText(body.slice(heading.start, tag.start)) });
      heading = undefined;
    }
    const attributes = tag.attributes.replace(ATTR, (match, name) => name.toLowerCase() === "class" ? "" : match);
    const name = level === 1 ? tag.sourceName[0] + "2" : tag.sourceName;
    normalized += body.slice(copiedThrough, tag.start) + `<${tag.closing ? "/" : ""}${name}${attributes}>`;
    copiedThrough = tag.end;
  }
  normalized += body.slice(copiedThrough);

  const words = plainText(normalized).match(/\S+/g)?.length ?? 0;
  const bodyHtml = hasOuterDiv(normalized) ? normalized : `<div>${normalized}</div>`;
  return { bodyHtml, headings, excerpt, readMinutes: Math.max(1, Math.round(words / 200)) };
}

function familyFor(wikiPath) {
  if (/^x-series/.test(wikiPath)) return "x-series";
  if (/^hydra-(?:series|gen-2)/.test(wikiPath)) return "hydra-series";
  if (/^onelaser-cobra/.test(wikiPath)) return "cobra";
  if (/^vertigo/.test(wikiPath)) return "vertigo";
  if (/^(?:software-app|firmware-update)/.test(wikiPath)) return "software";
  if (/^accessories/.test(wikiPath)) return "accessories";
  if (/^(?:knowledge-base\/material-processing|material-library)/.test(wikiPath)) return "materials";
  if (/^knowledge-base(?:\/(?:maintenance|popularization|hardware|general)(?:\/.*)?)?$/.test(wikiPath)) return "basics";
  return "general";
}

function topicFor(wikiPath, title) {
  if (/manual|firmware-(?:upgrade|update)/.test(wikiPath)) return "downloads";
  if (wikiPath.includes("/troubleshooting/") || /\b(fix|fails?|failure|not|no|error|issue|won'?t|stops?|troubleshoot\w*|exceeds?)\b/i.test(title)) {
    return "troubleshooting";
  }
  if (/install|set-?up|unbox|first[- ]time|quick start/i.test(`${wikiPath}\n${title}`)) {
    return "getting-started";
  }
  return "guides";
}

function encodedPath(wikiPath) {
  return wikiPath.split("/").map((segment) => {
    if (segment === "." || segment === "..") throw new Error(`Invalid wiki path: ${wikiPath}`);
    return encodeURIComponent(segment);
  }).join("/");
}

function planPages(response, existing) {
  const pages = response?.data?.pages?.list;
  if (response?.errors?.length || !Array.isArray(pages)) {
    throw new Error(`GraphQL did not return pages.list: ${response?.errors?.map((error) => error.message).join("; ") || "invalid response"}`);
  }
  const jobs = [];
  const skipped = [];
  const seen = new Set();
  for (const page of pages) {
    if (!Number.isSafeInteger(page?.id) || page.id <= 0 || typeof page.path !== "string"
      || typeof page.title !== "string" || typeof page.isPublished !== "boolean") {
      throw new Error(`Invalid page in pages.list: ${JSON.stringify(page)}`);
    }
    const id = `en-${page.id}`;
    if (!page.isPublished) {
      skipped.push({ id, path: page.path, reason: "unpublished" });
      continue;
    }
    if (seen.has(id)) throw new Error(`Duplicate published page ID: ${id}`);
    seen.add(id);
    if (/^(?:\d+|test(?:[\s_-]*(?:page|\d+))?)?$/i.test(page.title.trim())) {
      skipped.push({ id, path: page.path, reason: "test title" });
      continue;
    }
    const previous = existing.get(id);
    const liveDate = Date.parse(page.updatedAt);
    const oldDate = previous ? Date.parse(previous.source_updated_at) : -Infinity;
    if (!Number.isFinite(liveDate) || Number.isNaN(oldDate)) throw new Error(`${id}: invalid update timestamp`);
    if (liveDate <= oldDate) continue;

    const route = page.path.replace(/^\/+|\/+$/g, "");
    const relativePath = route.replace(/^en(?:\/|$)/i, "");
    const classificationPath = relativePath.toLowerCase();
    jobs.push({
      page,
      id,
      added: !previous,
      family: previous?.family ?? familyFor(classificationPath),
      topic: previous?.topic ?? topicFor(classificationPath, page.title),
      route: `/${encodedPath(route)}`,
      sourceUrl: `${ORIGIN}/en/${encodedPath(relativePath)}`,
    });
  }
  return { jobs, skipped };
}

function articleFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.name.endsWith(".json"));
}

function indexArticles(library) {
  const articles = new Map();
  for (const entry of library.articles) {
    if (!ARTICLE_FILE.test(`${entry.id}.json`)) throw new Error(`Invalid library article ID: ${entry.id}`);
    if (articles.has(entry.id)) throw new Error(`Duplicate library article ID: ${entry.id}`);
    articles.set(entry.id, entry);
  }
  return articles;
}

function validateExport(articleDir, articles, expectedCount) {
  if (articles.size !== expectedCount) {
    throw new Error(`Expected ${expectedCount} library articles, found ${articles.size}`);
  }
  const unmatched = new Set(articles.keys());
  for (const entry of articleFiles(articleDir)) {
    const id = ARTICLE_FILE.exec(entry.name)?.[1];
    if (!entry.isFile() || !unmatched.delete(id)) throw new Error(`Unexpected article file: ${entry.name}`);
    const article = readJson(path.join(articleDir, entry.name));
    if (article.id !== id) throw new Error(`${entry.name}: article ID does not match filename`);
    if (typeof article.body_html !== "string" || !article.body_html.trim()) throw new Error(`${id}: empty body_html`);
    if (UNSAFE_HTML.test(article.body_html)) throw new Error(`${id}: unsafe body_html`);
  }
  if (unmatched.size) throw new Error(`Missing article files: ${[...unmatched].join(", ")}`);
}

function updateFamilyCounts(library) {
  const counts = new Map();
  for (const { family } of library.articles) counts.set(family, (counts.get(family) ?? 0) + 1);
  if (counts.has("basics") && !library.families.some((family) => family.id === "basics")) {
    library.families.push({ id: "basics", name: "Laser basics & care", count: 0 });
  }
  for (const family of library.families) family.count = counts.get(family.id) ?? 0;
}

function containsPath(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

function destinationFor(argument) {
  const absolute = path.resolve(argument);
  const name = path.basename(absolute);
  if (!name) throw new Error("The output directory cannot be a filesystem root");
  return path.join(fs.realpathSync.native(path.dirname(absolute)), name);
}

function publish(moves, staging) {
  const undo = [];
  try {
    for (const [candidate, destination] of moves) {
      const current = fs.lstatSync(destination, { throwIfNoEntry: false });
      if (current) {
        if (!current.isDirectory()) throw new Error(`Destination is not a directory: ${destination}`);
        const backup = path.join(staging, `previous-${undo.length}`);
        fs.renameSync(destination, backup);
        undo.push([backup, destination]);
      }
      fs.renameSync(candidate, destination);
      undo.push([destination, candidate]);
    }
  } catch (error) {
    try {
      for (const [from, to] of undo.reverse()) fs.renameSync(from, to);
    } catch (rollbackError) {
      const failure = new Error(`${error.message}; rollback failed: ${rollbackError.message}. Backups are in ${staging}`);
      failure.keepStaging = true;
      throw failure;
    }
    throw error;
  }
}

async function saveArticle(job, offlineCache, newCache, articleDir) {
  const { page, id, family, topic, route, sourceUrl } = job;
  try {
    const cacheFile = `html/${page.id}.html`;
    const html = offlineCache ? fs.readFileSync(path.join(offlineCache, cacheFile), "utf8") : await fetchWiki(route);
    const { bodyHtml, headings, excerpt, readMinutes } = renderPage(html);
    const fields = { id, title: page.title, family, topic, read_minutes: readMinutes, source_updated_at: page.updatedAt, source_url: sourceUrl };
    writeJson(path.join(articleDir, `${id}.json`), { ...fields, body_html: bodyHtml, headings, technical_version: "unknown" });
    if (newCache) fs.writeFileSync(path.join(newCache, cacheFile), html);
    const hash = createHash("sha256").update(bodyHtml).digest("hex");
    return { ...fields, excerpt, body_sha256: hash, render_sha256: hash };
  } catch (error) {
    throw new Error(`${id} (${page.path}): ${error.message}`);
  }
}

async function main(args) {
  if (![2, 4].includes(args.length) || (args.length === 4 && args[2] !== "--cache") || args.some((arg) => !arg)) {
    throw new Error("Usage: node scripts/fetch-live-wiki.mjs <export-dir> <out-dir> [--cache <dir>]");
  }
  const exportDir = fs.realpathSync.native(args[0]);
  const outDir = destinationFor(args[1]);
  const offlineCache = args[3] ? fs.realpathSync.native(args[3]) : undefined;
  const staging = `${outDir}.tmp`;
  const cacheDestination = `${outDir}.cache`;
  const destinations = (offlineCache ? [outDir, staging] : [outDir, staging, cacheDestination])
    .map((dir) => fs.existsSync(dir) ? fs.realpathSync.native(dir) : dir);
  // Only a new folder, or one this tool made earlier (it carries MARKER), may be replaced: a mistyped output such as "."
  // must never move a repository or home folder aside.
  for (const dir of offlineCache ? [outDir] : [outDir, cacheDestination]) {
    if (fs.existsSync(dir) && !fs.existsSync(path.join(dir, MARKER))) {
      throw new Error(`Refusing to replace ${dir}: it was not made by this tool (no ${MARKER}). Choose a new output folder.`);
    }
  }
  if (fs.existsSync(staging)) throw new Error(`${staging} exists (another run, or a failed one): remove it first.`);
  for (const input of [exportDir, offlineCache].filter(Boolean)) {
    if (destinations.some((dir) => containsPath(input, dir) || containsPath(dir, input))) {
      throw new Error(`Input directory overlaps the output or staging directory: ${input}`);
    }
  }

  const manifestFile = path.join(exportDir, "export-manifest.json");
  if (readJson(manifestFile).private_operations_included !== false) throw new Error("Export must be public-only");
  const library = readJson(path.join(exportDir, "data/library.json"));
  if (!Array.isArray(library.articles) || !Array.isArray(library.families)) throw new Error("Invalid export library");
  const articles = indexArticles(library);
  const originalCount = articles.size;

  // Creating the staging directory exclusively also prevents simultaneous runs
  // from replacing the same output. Keep backups here until publication succeeds.
  fs.mkdirSync(staging);
  let keepStaging = false;
  try {
    const stagedExport = path.join(staging, "export");
    const articleDir = path.join(stagedExport, "data/articles");
    fs.mkdirSync(articleDir, { recursive: true });
    fs.copyFileSync(manifestFile, path.join(stagedExport, "export-manifest.json"));
    const searchIndex = path.join(exportDir, "data/search-index.json");
    if (fs.existsSync(searchIndex)) fs.copyFileSync(searchIndex, path.join(stagedExport, "data/search-index.json"));
    const sourceArticles = path.join(exportDir, "data/articles");
    for (const entry of articleFiles(sourceArticles)) {
      if (!entry.isFile()) throw new Error(`Expected a regular export article file: ${entry.name}`);
      fs.copyFileSync(path.join(sourceArticles, entry.name), path.join(articleDir, entry.name));
    }

    const pagesJson = offlineCache
      ? fs.readFileSync(path.join(offlineCache, "pages.json"), "utf8")
      : await fetchWiki("/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: PAGE_QUERY }),
      });
    const response = JSON.parse(pagesJson);
    const all = response?.data?.pages?.list;
    if (!Array.isArray(all)) throw new Error("GraphQL did not return pages.list");
    // English pages only (article ids and /en/ addresses assume English); other locales are reported, not merged.
    const otherLocales = all.filter((page) => page?.locale && page.locale !== "en");
    response.data.pages.list = all.filter((page) => !page?.locale || page.locale === "en");
    // Guides taken down on the live wiki (unpublished or deleted) leave the merged export too.
    const live = new Set(response.data.pages.list.filter((page) => page?.isPublished === true).map((page) => `en-${page.id}`));
    const withdrawn = [...articles.keys()].filter((id) => !live.has(id));
    for (const id of withdrawn) { articles.delete(id); fs.rmSync(path.join(articleDir, `${id}.json`), { force: true }); }
    const { jobs, skipped } = planPages(response, articles);
    for (const page of otherLocales) skipped.push({ id: `${page.locale}-${page.id}`, path: page.path, reason: `locale ${page.locale}` });
    const newCache = offlineCache ? undefined : path.join(staging, "cache");
    if (newCache) {
      fs.mkdirSync(path.join(newCache, "html"), { recursive: true });
      fs.writeFileSync(path.join(newCache, "pages.json"), pagesJson);
    }

    for (let offset = 0; offset < jobs.length; offset += CONCURRENCY) {
      const batch = jobs.slice(offset, offset + CONCURRENCY);
      // Wait for every in-flight write before cleaning up staging after a failure.
      const results = await Promise.allSettled(batch.map((job) => saveArticle(job, offlineCache, newCache, articleDir)));
      for (const result of results) {
        if (result.status === "rejected") throw result.reason;
        articles.set(result.value.id, result.value);
      }
    }

    library.articles = [...articles.values()];
    updateFamilyCounts(library);
    writeJson(path.join(stagedExport, "data/library.json"), library);

    const added = jobs.filter((job) => job.added);
    const updated = jobs.filter((job) => !job.added);
    validateExport(articleDir, articles, originalCount - withdrawn.length + added.length);
    // The copied search index and manifest describe the old snapshot: drop the index (build-wiki makes its own) and date the manifest.
    fs.rmSync(path.join(stagedExport, "data/search-index.json"), { force: true });
    const manifest = readJson(path.join(stagedExport, "export-manifest.json"));
    writeJson(path.join(stagedExport, "export-manifest.json"), { ...manifest, unique_source_pages: articles.size, live_sync_date: new Date().toISOString().slice(0, 10) });
    fs.writeFileSync(path.join(stagedExport, MARKER), "Made by scripts/fetch-live-wiki.mjs; safe to replace with a new run.\n");
    if (newCache) fs.writeFileSync(path.join(newCache, MARKER), "Made by scripts/fetch-live-wiki.mjs; safe to replace with a new run.\n");
    const moves = newCache ? [[newCache, cacheDestination]] : [];
    moves.push([stagedExport, outDir]);
    publish(moves, staging);

    console.log(`[wiki] ${added.length} added, ${updated.length} updated, ${withdrawn.length} withdrawn, ${skipped.length} skipped (${articles.size} articles)`);
    for (const id of withdrawn) console.log(`  withdrawn ${id} (no longer published on the live wiki)`);
    for (const { id, page, family, topic } of added) console.log(`  added ${id} ${page.path} (${family}, ${topic})`);
    for (const { id, page } of updated) console.log(`  updated ${id} ${page.path}`);
    for (const item of skipped) console.log(`  skipped ${item.id} ${item.path} (${item.reason})`);
  } catch (error) {
    keepStaging = error.keepStaging;
    throw error;
  } finally {
    if (!keepStaging) fs.rmSync(staging, { recursive: true, force: true });
  }
}

try {
  await main(process.argv.slice(2));
} catch (error) {
  console.error(`[wiki] ${error.message}`);
  process.exitCode = 1;
}
