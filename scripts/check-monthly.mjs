// Fails the build when a page works out a monthly payment by itself (e.g. price / 24). Every "/mo" figure must come from
// perMonth / monthlyText in src/lib.js, so the cart, product cards, finder and payment popup always show the same number.
// Fix: import { monthlyText } from "../lib.js" and use monthlyText(amount).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === "locales" ? [] : walk(path.join(d, e.name))) : /\.(jsx?|mjs)$/.test(e.name) ? [path.join(d, e.name)] : []));
const bad = [];
for (const f of walk(path.join(root, "src"))) {
  if (f.endsWith(path.join("src", "lib.js")) || f.endsWith(path.join("pages", "Finance.jsx"))) continue; // lib defines it; the financing calculator has its own APR / term inputs
  fs.readFileSync(f, "utf8").replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, " ")).replace(/(^|[^:"'`])\/\/.*$/gm, "$1").split("\n").forEach((l, n) => { if (/\/\s*(24|36|12|60|FINANCE_MONTHS)\b(?!\s*\))?/.test(l) && /price|amount|subtotal|total/i.test(l) && !/\/\//.test(l.split(/\/\s*(24|36|12|60)/)[0].slice(-3))) bad.push(`${path.relative(root, f)}:${n + 1}`); });
}
if (bad.length) { console.error("[monthly] Monthly payment worked out in the page. Use monthlyText(amount) from src/lib.js:\n  " + bad.join("\n  ")); process.exit(1); }
console.log("monthly: every monthly figure comes from lib.js.");
