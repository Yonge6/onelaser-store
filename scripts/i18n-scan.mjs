// Finds every interface string in the source by reading the code structure (esbuild turns JSX into calls, rollup parses it).
// Returns { needed: Set of strings that must be translated, hardcoded: [{file, text}] of English written straight into JSX }.
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const { parseAst } = await import("rollup/parseAst");

// Props whose string value is shown to people (or read aloud) and so must go through t().
const SHOWN_PROPS = new Set(["aria-label", "placeholder", "title", "alt"]);
// Props / object keys whose string value is code, not text.
const CODE_KEYS = new Set(["className", "href", "to", "id", "key", "type", "src", "image", "video", "youtube", "handle", "url", "link", "icon", "name", "art", "role", "rel", "target", "autoComplete", "inputMode", "loading", "decoding", "lang", "code", "tz", "value", "htmlFor", "kind", "series", "category", "filter", "all", "collection", "mobile", "img", "poster", "anchor", "pattern", "method", "aria-haspopup", "aria-live", "aria-controls", "aria-labelledby", "aria-describedby", "sizes", "srcSet", "fetchPriority", "dir", "k", "opt", "as", "preload", "crossOrigin"]);
// Calls whose string arguments are code or lookup keys, never shown as typed.
const CODE_CALLS = new Set(["querySelector", "querySelectorAll", "addEventListener", "removeEventListener", "getItem", "setItem", "removeItem", "matchMedia", "split", "join", "replace", "includes", "startsWith", "endsWith", "toLocaleString", "toLocaleDateString", "toLocaleTimeString", "DateTimeFormat", "NumberFormat", "require", "fetch", "go", "add", "setQty", "scrollTo", "postMessage", "open", "test", "match", "has", "faq", "indexOf", "get", "set", "getAttribute", "setAttribute", "closest", "dispatchEvent", "Event", "CustomEvent"]);
const looksLikeCode = (s) =>
  /^\s/.test(s) || // className fragments like " open"
  /^[Mm][\d.\s-]/.test(s) || // SVG paths
  (!/\s/.test(s) && (/^[\w-]{11}$/.test(s) && /\d/.test(s) || /^[a-z]+[A-Z]\w*$/.test(s) || /^[a-z]{2}-[A-Z]{2}$/.test(s) || /^[A-Z]{2,4}$/.test(s))) || // video ids, camelCase, locale tags, codes
  /^[.(]/.test(s) || /\d(px|ms|s)\b/.test(s) || /^(BEGIN|END|VERSION|PRODID|SUMMARY|DESCRIPTION):/.test(s) || s === "currentColor";
const looksLikeText = (s) => !looksLikeCode(s) && /[A-Za-z]{2}/.test(s) && !/^(https?:|mailto:|tel:|\/|#|\.\.?\/|data:)/.test(s) && !/^[a-z0-9_.:\/-]+$/.test(s) && !/[{}<>=`]|\$\{/.test(s) && !(/;/.test(s) && !/\w \w/.test(s)) && !/^[\w-]+\.(jpe?g|png|webp|svg|gif|mp4|js|jsx|css)(\?.*)?$/i.test(s) && !/^[A-Z][a-z]+\/[A-Z]/.test(s);

function walk(node, visit, parent, key) {
  if (!node || typeof node.type !== "string") return;
  visit(node, parent, key);
  for (const k of Object.keys(node)) {
    if (k === "start" || k === "end") continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach((c) => c && typeof c.type === "string" && walk(c, visit, node, k));
    else if (v && typeof v.type === "string") walk(v, visit, node, k);
  }
}
// String literals that t() can return: follows a ? b : c and a || b, but not comparisons (x === "up") or nested calls (t(faqText("key"))).
const strings = (node) => { const out = []; const visit = (n) => { if (!n) return; if (n.type === "ConditionalExpression") return visit(n.consequent), visit(n.alternate); if (n.type === "LogicalExpression") return visit(n.left), visit(n.right); if (n.type === "Literal" && typeof n.value === "string") out.push(n.value); if (n.type === "TemplateLiteral" && n.expressions.length === 0) out.push(n.quasis[0].value.cooked); }; visit(node); return out; };
const stringsDeep = (node) => { const out = []; walk(node, (n) => { if (n.type === "Literal" && typeof n.value === "string") out.push(n.value); if (n.type === "TemplateLiteral" && n.expressions.length === 0) out.push(n.quasis[0].value.cooked); }); return out; };
const isT = (n) => n.type === "CallExpression" && n.callee.type === "Identifier" && ["t", "tf", "tx", "txNodes"].includes(n.callee.name);
const isEl = (n) => n.type === "CallExpression" && n.callee.type === "MemberExpression" && n.callee.property.name === "createElement";

export function scan(files) {
  const needed = new Set(), hardcoded = [], childText = new Set();
  for (const f of files) {
    const js = esbuild.transformSync(fs.readFileSync(f, "utf8"), { loader: path.extname(f) === ".jsx" ? "jsx" : "js", jsx: "transform" }).code;
    const ast = parseAst(js);
    const inT = new Set(), inCode = new Set();
    walk(ast, (n) => {
      if (isT(n) && n.arguments[0]) walk(n.arguments[0], (m) => inT.add(m));
      // Keyword lists and lookup keys: has(s, ["worth it", ...]), faq("Can I return"), str.includes("x")
      // Anything inside className={...}, href={...} and the like is code, however it is built.
      if (n.type === "Property" && CODE_KEYS.has(n.key?.name ?? n.key?.value)) walk(n.value, (m) => inCode.add(m));
      if (n.type === "CallExpression" && !isT(n)) { const c = n.callee; const fn = c.name ?? c.property?.name; if (CODE_CALLS.has(fn)) n.arguments.forEach((a) => walk(a, (m) => inCode.add(m))); }
    });
    walk(ast, (n, parent, key) => {
      if (isT(n) && n.arguments[0]) strings(n.arguments[0]).filter((s) => /[A-Za-z]/.test(s)).forEach((s) => needed.add(s));
      if (isEl(n)) {
        // JSX text, including {cond ? "A" : "B"} and {cond && "A"} written straight into the markup.
        n.arguments.slice(2).forEach((c) => strings(c).forEach((v) => { if (/[A-Za-z]{2}/.test(v) && !looksLikeCode(v.trim())) { hardcoded.push({ file: f, text: v.trim() }); childText.add(v); } }));
        const props = n.arguments[1];
        if (props?.type === "ObjectExpression") for (const p of props.properties) {
          const name = p.key?.name ?? p.key?.value;
          if (name === "label" && p.value.type === "Literal" && typeof p.value.value === "string") { needed.add(p.value.value); continue; } // our components run t(label)
          if (SHOWN_PROPS.has(name) && p.value.type === "Literal" && typeof p.value.value === "string" && /[A-Za-z]{2}/.test(p.value.value)) hardcoded.push({ file: f, text: `${name}="${p.value.value}"` });
        }
      }
      // Text kept in data (arrays, objects, variables) and shown later through t(variable).
      // A label paired with text in the same array, like ["Small or large", "purchases"], is text even when it is one lowercase word.
      const pairedWithText = parent?.type === "ArrayExpression" && parent.elements.length === 2 && parent.elements.indexOf(n) === 1 && /^[a-z][a-z ]+$/.test(n.value) && parent.elements.some((e) => e !== n && e?.type === "Literal" && typeof e.value === "string" && /\s/.test(e.value) && looksLikeText(e.value));
      if (n.type === "Literal" && typeof n.value === "string" && !inT.has(n) && !childText.has(n.value) && (looksLikeText(n.value) || pairedWithText)) {
        if (parent?.type === "ImportDeclaration" || parent?.type === "ExportNamedDeclaration" || parent?.type === "ExportAllDeclaration") return;
        if (parent?.type === "Property" && key === "key") return;
        if (parent?.type === "Property" && key === "value") { const name = parent.key?.name ?? parent.key?.value; if (CODE_KEYS.has(name) || SHOWN_PROPS.has(name)) return; }
        if (parent && isEl(parent)) return; // element tag names and JSX text are handled above
        if (inCode.has(n)) return;
        if (parent?.type === "BinaryExpression" || parent?.type === "SwitchCase") return; // comparisons against codes
        needed.add(n.value);
      }
    });
  }
  return { needed, hardcoded };
}
