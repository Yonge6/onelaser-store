// Fails the build when a React component is defined inside another component, e.g.
//   function Page() { const Fact = ({ kind }) => <li>…</li>; … <Fact /> }
// React treats Fact as a new component on every render, so its buttons are thrown away and rebuilt:
// keyboard focus is lost and a dialog cannot hand focus back to the button that opened it.
// Fix: move the inner component to the top level of the file and pass what it needs as props.
// Existing cases are recorded in scripts/inner-components-debt.json; that list may only shrink.
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";
const require = createRequire(import.meta.url);
const esbuild = require("esbuild");
const { parseAst } = await import("rollup/parseAst");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const debtFile = path.join(root, "scripts/inner-components-debt.json");

const returnsJsx = (fn) => {
  let found = false;
  const walk = (n) => { if (!n || found || typeof n.type !== "string") return; if (n.type === "CallExpression" && n.callee.type === "MemberExpression" && n.callee.property.name === "createElement") { found = true; return; } for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === "string") walk(v); } };
  walk(fn.body);
  return found;
};
// memo(() => <x/>), React.memo(...), forwardRef(...): the function inside is still a component.
const wrapped = (init) => init && init.type === "CallExpression" && ["memo", "forwardRef"].includes(init.callee.name ?? init.callee.property?.name) && init.arguments[0] && /Function/.test(init.arguments[0].type) ? init.arguments[0] : null;
// Only names used as an element (<Name />, i.e. createElement(Name, …)) are components; Name() called as a plain
// function is not remounted and is fine.
const usedAsElement = (ast) => {
  const names = new Set();
  const walk = (n) => { if (!n || typeof n.type !== "string") return; if (n.type === "CallExpression" && n.callee.type === "MemberExpression" && n.callee.property.name === "createElement" && n.arguments[0]?.type === "Identifier") names.add(n.arguments[0].name); for (const k of Object.keys(n)) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === "string") walk(v); } };
  walk(ast);
  return names;
};
const found = [];
for (const dir of ["src/pages", "src/components"]) {
  for (const f of fs.readdirSync(path.join(root, dir)).filter((x) => /\.jsx$/.test(x))) {
    const rel = `${dir}/${f}`;
    const js = esbuild.transformSync(fs.readFileSync(path.join(root, rel), "utf8"), { loader: "jsx", jsx: "transform" }).code;
    const ast = parseAst(js);
    const asElement = usedAsElement(ast);
    const visit = (n, insideFn) => {
      if (!n || typeof n.type !== "string") return;
      const isFn = n.type === "FunctionDeclaration" || n.type === "FunctionExpression" || n.type === "ArrowFunctionExpression";
      if (insideFn && n.type === "VariableDeclarator" && n.id.type === "Identifier" && /^[A-Z]/.test(n.id.name) && asElement.has(n.id.name)) {
        const fn = n.init && (n.init.type === "ArrowFunctionExpression" || n.init.type === "FunctionExpression") ? n.init : wrapped(n.init);
        if (fn && returnsJsx(fn)) found.push(`${rel}: ${n.id.name}`);
      }
      if (insideFn && n.type === "FunctionDeclaration" && n.id && /^[A-Z]/.test(n.id.name) && asElement.has(n.id.name) && returnsJsx(n)) found.push(`${rel}: ${n.id.name}`);
      for (const k of Object.keys(n)) { if (k === "start" || k === "end") continue; const v = n[k]; if (Array.isArray(v)) v.forEach((c) => visit(c, insideFn || isFn)); else if (v && typeof v.type === "string") visit(v, insideFn || isFn); }
    };
    visit(ast, false);
  }
}
if (process.argv.includes("--write-debt")) {
  const old = fs.existsSync(debtFile) ? JSON.parse(fs.readFileSync(debtFile, "utf8")) : null;
  const next = old ? found.filter((x) => old.includes(x)) : found; // only ever shrinks
  fs.writeFileSync(debtFile, JSON.stringify(next, null, 1) + "\n");
  console.log("inner components recorded:", next.length);
  process.exit(0);
}
const debt = fs.existsSync(debtFile) ? JSON.parse(fs.readFileSync(debtFile, "utf8")) : [];
const fresh = found.filter((x) => !debt.includes(x));
const paid = debt.filter((x) => !found.includes(x));
if (fresh.length) console.error("\n[components] Component defined inside another component (rebuilt on every render, loses focus). Move it to the top level of the file and pass values as props:\n  " + fresh.join("\n  "));
if (paid.length) console.error("\n[components] Fixed, remove from scripts/inner-components-debt.json (node scripts/check-inner-components.mjs --write-debt):\n  " + paid.join("\n  "));
if (fresh.length || paid.length) process.exit(1);
console.log("components: none defined inside another (beyond recorded debt).");
