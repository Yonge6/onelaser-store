import { useEffect, useState } from "react";
import catalog from "./data/catalog.json";

export const products = catalog.products;
export const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
export const machines = products.filter((p) => p.kind === "machine");
export const accessories = products.filter((p) => p.kind === "accessory");
export const materials = products.filter((p) => p.kind === "material");

export const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;
/** Shopify CDN image at a given width. */
export const img = (src, width = 800) => (src ? `${src}${src.includes("?") ? "&" : "?"}width=${width}` : "");
export const money = (n) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const saving = (p) => (p.compareAt ? p.compareAt - p.price : 0);

/* ---------- tiny hash router: #/path?query ---------- */
const parse = () => {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path, query: new URLSearchParams(query) };
};
export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => {
      setRoute(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
export const go = (path) => {
  window.location.hash = path;
};
