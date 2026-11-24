// Fails the build when an interface string has no translation, so Chinese (or any other) pages never show stray English.
// Strings come from src/locales/_keys.json plus every t("...") literal in src. Brand names and units that read the same
// in every language may be listed in scripts/i18n-same.json. Gaps that existed when this check was added are recorded
// in scripts/i18n-debt.json: that list may only shrink. Fix: add the missing key to each src/locales/<lang>.js.
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const langs = ["zh", "ja", "es", "fr", "de"];
const keys = new Set(JSON.parse(fs.readFileSync(path.join(root, "src/locales/_keys.json"), "utf8")));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "locales" ? [] : walk(path.join(d, e.name))) : /\.(jsx?|mjs)$/.test(e.name) ? [path.join(d, e.name)] : []));
for (const f of walk(path.join(root, "src"))) {
  const s = fs.readFileSync(f, "utf8");
  const code = s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1"); // skip comments
  for (const m of code.matchAll(/\bt[fx]?\("((?:[^"\\]|\\.)+)"/g)) keys.add(JSON.parse(`"${m[1]}"`));
  for (const m of code.matchAll(/\bt[fx]?\('((?:[^'\\]|\\.)+)'/g)) keys.add(m[1].replace(/\\'/g, "'"));
}
const sameFile = JSON.parse(fs.readFileSync(path.join(root, "scripts/i18n-same.json"), "utf8"));
const same = new Set([...sameFile.text, ...(sameFile.ids || [])]);
// Read the code structure too: strings in t(a ? "x" : "y"), text kept in data and shown through t(variable),
// and English written straight into the markup (which never gets translated).
const { scan } = await import(pathToFileURL(path.join(root, "scripts/i18n-scan.mjs")).href);
const sources = ["src/pages", "src/components"].flatMap((d) => fs.readdirSync(path.join(root, d)).filter((f) => /\.jsx?$/.test(f)).map((f) => path.join(root, d, f))).concat([path.join(root, "src/App.jsx")]);
const found = scan(sources);
found.needed.forEach((k) => keys.add(k));
// site.js data the pages show through t(variable). Exports not listed here are either not shown or quoted
// word for word (reviews, video titles); add an export here when a page starts showing it.
const { scanExports } = await import(pathToFileURL(path.join(root, "scripts/i18n-scan.mjs")).href);
const SHOWN = ["promo", "nav", "footer", "benefits", "heroSlides", "homeTabs", "shortSlogans", "homeProof", "homeProofSources", "homeFaq", "homeStandard", "faq"];
scanExports(path.join(root, "src/data/site.js"), SHOWN).forEach((k) => keys.add(k));
// Text the code builds at runtime and shows through t(variable), which the scan above cannot follow:
// the assistant's "Based on" source labels (src: [...]) and the machine finder's reasons (add(score, "reason")).
const lits = (str) => [...str.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => JSON.parse(`"${m[1]}"`)).filter((x) => /[A-Za-z]{2}/.test(x) && / /.test(x));
for (const m of fs.readFileSync(path.join(root, "src/components/Assistant.jsx"), "utf8").matchAll(/\bsrc: \[([^\]]*)\]/g)) lits(m[1]).forEach((k) => keys.add(k));
for (const line of fs.readFileSync(path.join(root, "src/components/finderRules.js"), "utf8").split("\n")) if (/\badd\(/.test(line)) lits(line.slice(line.indexOf("add("))).forEach((k) => keys.add(k));
const loose = found.hardcoded.filter((h) => !sameFile.markup.includes(h.text));
if (loose.length) {
  console.error("\n[i18n] English written straight into the page, so it never gets translated. Wrap it in t(\"...\") and add translations (or, for a brand name, list it under \"markup\" in scripts/i18n-same.json):\n  " + loose.map((h) => `${path.relative(root, h.file)}: ${JSON.stringify(h.text)}`).join("\n  "));
  process.exit(1);
}
const debtFile = path.join(root, "scripts/i18n-debt.json");
const debt = fs.existsSync(debtFile) ? JSON.parse(fs.readFileSync(debtFile, "utf8")) : {};
const missing = {};
for (const l of langs) {
  const dict = (await import(pathToFileURL(path.join(root, `src/locales/${l}.js`)).href)).default;
  missing[l] = [...keys].filter((k) => !(k in dict) && !same.has(k) && /[A-Za-z]{2}/.test(k)).sort();
}
// A translation must keep every {slot} of its English key, or tf/tx would drop the price, link or number it stands for.
const slotErrors = [];
for (const l of langs) {
  const dict = (await import(pathToFileURL(path.join(root, `src/locales/${l}.js`)).href)).default;
  for (const [k, v] of Object.entries(dict)) {
    const want = (k.match(/\{\w+\}/g) || []).sort().join(" ");
    const got = (String(v).match(/\{\w+\}/g) || []).sort().join(" ");
    if (want !== got) slotErrors.push(`${l}: ${JSON.stringify(k)} -> ${JSON.stringify(v)} (needs ${want || "no slots"})`);
  }
}
if (slotErrors.length) {
  console.error("\n[i18n] Translations that lose or add a {slot}. Keep the same {name} slots as the English key:\n  " + slotErrors.join("\n  "));
  process.exit(1);
}

if (process.argv.includes("--write-debt")) {
  // Only shrinks the recorded debt: entries that are translated now are dropped, new gaps are never added.
  const next = Object.fromEntries(langs.map((l) => [l, debt[l] ? missing[l].filter((k) => debt[l].includes(k)) : missing[l]]));
  if (!Object.keys(debt).length) console.log("No debt file yet: recording current gaps as the starting debt.");
  fs.writeFileSync(debtFile, JSON.stringify(next, null, 1) + "\n");
  Object.assign(missing, next);
  console.log("i18n debt recorded:", Object.fromEntries(langs.map((l) => [l, missing[l].length])));
  process.exit(0);
}
// One name for the finder, in the visitor's own voice: "Find my machine", "My match …", "See my match". The header button,
// the home card, the popup and the assistant must not drift back to "Find your machine" / "Find my laser" / "Your match".
const offVoice = [...keys].filter((k) => /^(Find your (machine|laser)|Find my laser|Your (best )?match\b)/.test(k));
if (offVoice.length) {
  console.error("\n[i18n] Finder labels use “my”, as in the header button. Rename (and its translations):\n  " + offVoice.map((k) => JSON.stringify(k)).join("\n  ") + "\n  e.g. \"Find your machine\" → \"Find my machine\", \"Your match is ready\" → \"My match is ready\"");
  process.exit(1);
}
let bad = 0;
for (const l of langs) {
  const allowed = new Set(debt[l] || []);
  const fresh = missing[l].filter((k) => !allowed.has(k));
  const paid = [...allowed].filter((k) => !missing[l].includes(k));
  if (fresh.length) { bad++; console.error(`\n[i18n] ${l}: ${fresh.length} string(s) without a translation. Add them to src/locales/${l}.js:\n  ` + fresh.map((k) => JSON.stringify(k)).join("\n  ")); }
  if (paid.length) { bad++; console.error(`\n[i18n] ${l}: ${paid.length} string(s) are translated now. Remove them from scripts/i18n-debt.json (run: node scripts/check-i18n.mjs --write-debt):\n  ` + paid.map((k) => JSON.stringify(k)).join("\n  ")); }
}
if (bad) process.exit(1);
console.log("i18n: every interface string is translated (or recorded as existing debt).");
