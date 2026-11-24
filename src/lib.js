import { useEffect, useState } from "react";
import catalog from "./data/catalog.json";

import { saleOn } from "./data/site.js";

/* After Black Friday every item goes back to its regular (compare-at) price, so no page can show an expired discount. */
const regular = (v) => (v.compareAt > v.price ? { ...v, price: v.compareAt, compareAt: null } : v);
export const products = saleOn ? catalog.products : catalog.products.map((p) => {
  const variants = p.variants.map(regular);
  const prices = variants.map((v) => v.price);
  return { ...p, variants, price: Math.min(...prices), compareAt: null, priceVaries: new Set(prices).size > 1 };
});
export const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
export const machines = products.filter((p) => p.kind === "machine");
export const accessories = products.filter((p) => p.kind === "accessory");
export const materials = products.filter((p) => p.kind === "material");

export const asset = (name) => `${import.meta.env.BASE_URL}assets/${name}`;
/** Shopify CDN image at a given width. */
export const img = (src, width = 800) => (src ? `${src}${src.includes("?") ? "&" : "?"}width=${width}` : "");
/* Straight front views of each series, from the 1laser.com home page product row (transparent PNGs).
   One photo per series: the Cobra shot shows a Cobra 8, the Hydra shot a Hydra 7 Gen2. */
const FRONT = {
  xrf: "https://www.1laser.com/cdn/shop/files/home-product-xrf.png",
  cobra: "https://www.1laser.com/cdn/shop/files/home-product-cobra.png",
  hydra: "https://www.1laser.com/cdn/shop/files/home-product-hydra-gen2_d4d95d1f-482d-48b9-bbe2-82d96bd9ac39.png",
  vertigo: "https://www.1laser.com/cdn/shop/files/home-product-vertigo.png",
};
/* One straight front render per model for Cobra and Hydra Gen2, from the team's image library
   (yonge6.github.io/onelaser-product-images, "… 正面渲染"), cropped to the machine with 3% margin and saved as WebP. */
const MODEL_FRONT = {
  "cobra-8-90w-co2-laser-engraver-cutter": "cobra-8-front",
  "cobra-10-100w-co2-laser-engraver-cutter": "cobra-10-front",
  "cobra-14-130w-co2-laser-engraver-cutter": "cobra-14-front",
  "hydra-7-gen-2-70w-rf-co2-dual-laser-machine": "hydra-7-gen2-front",
  "hydra-9-gen-2-70w-rf-co2-dual-laser-machine": "hydra-9-gen2-front",
  "hydra-13-gen-2-70w-rf-co2-dual-laser-machine": "hydra-13-gen2-front",
  "hydra-16-gen-2-70w-rf-co2-dual-laser-machine": "hydra-16-gen2-front",
};
/** Front view of exactly this model when we have one, then the series front view, otherwise its first product photo. */
export const frontImg = (p) => (MODEL_FRONT[p?.handle] && asset(`front/${MODEL_FRONT[p.handle]}.webp`)) || (p?.kind === "machine" && FRONT[p.series]) || p?.images?.[0];
export const money = (n) =>
  `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
export const saving = (p) => (p.compareAt ? p.compareAt - p.price : 0);

/* ---------- tiny hash router: #/path?query ---------- */
const parse = () => {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path, query: new URLSearchParams(query) };
};
/* Scroll memory for the hash router.
   - A link click or go() is a new page: jump to the top at once (no smooth animation).
   - Back / forward and a page reload: return to where that page was left.
   - A link with data-keep-scroll (e.g. the model switcher on a product page) keeps the current position. */
const SCROLL_KEY = "onelaser-scroll-v1";
const readPos = () => { try { return JSON.parse(sessionStorage.getItem(SCROLL_KEY)) || {}; } catch { return {}; } };
const positions = readPos();
const savePos = () => { try { sessionStorage.setItem(SCROLL_KEY, JSON.stringify(positions)); } catch { /* private mode */ } };
let intent = null; // "new" | "keep" | null (null = back/forward)
let current = typeof window !== "undefined" ? window.location.hash : "";
const jump = (y) => window.scrollTo({ top: y, left: 0, behavior: "instant" });
/** Content (products, images) renders after the route changes and keeps growing while images load,
    so hold the target for up to 4 s (slow phone connections), and stop as soon as the visitor scrolls by hand. */
const restore = (y) => {
  const until = performance.now() + 4000;
  let user = false;
  let last = null; // where our own last jump left the page; any other movement is the visitor scrolling (scrollbar, keys, trackpad)
  const stop = () => { user = true; };
  const evs = ["wheel", "touchstart", "keydown", "mousedown", "pointerdown"];
  evs.forEach((e) => window.addEventListener(e, stop, { once: true, passive: true }));
  const step = () => {
    if (!user && last != null && Math.abs(window.scrollY - last) > 2 && Math.abs(window.scrollY - y) > 2) user = true;
    if (user) { evs.forEach((e) => window.removeEventListener(e, stop)); return; }
    if (Math.abs(window.scrollY - y) > 2) jump(y);
    last = window.scrollY;
    if (performance.now() < until) requestAnimationFrame(step);
    else evs.forEach((e) => window.removeEventListener(e, stop));
  };
  requestAnimationFrame(step);
};
if (typeof window !== "undefined") {
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  let t = 0;
  window.addEventListener("scroll", () => {
    positions[window.location.hash] = window.scrollY;
    clearTimeout(t);
    t = setTimeout(savePos, 150);
  }, { passive: true });
  window.addEventListener("pagehide", savePos);
  document.addEventListener("click", (e) => {
    const a = e.target.closest?.("a[href^='#']");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    intent = a.hasAttribute("data-keep-scroll") ? "keep" : "new";
    // a link to the page we are already on changes nothing: drop the flag so a later back / forward is not mistaken for a new page
    const was = window.location.hash;
    setTimeout(() => { if (window.location.hash === was) intent = null; }, 0);
  }, true);
}
export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    if (positions[window.location.hash]) restore(positions[window.location.hash]); // after a reload
    const on = () => {
      positions[current] = positions[current] ?? window.scrollY;
      current = window.location.hash;
      const how = intent;
      intent = null;
      setRoute(parse());
      if (how === "keep") { positions[current] = window.scrollY; savePos(); return; }
      if (how === "new" || !positions[current]) { delete positions[current]; jump(0); }
      else restore(positions[current]);
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}
export const go = (path) => {
  const same = window.location.hash.replace(/^#/, "") === path;
  intent = same ? null : "new"; // same page: no hashchange will consume the flag
  window.location.hash = path;
};

/** Freeze the page behind a dialog. overflow:hidden alone still lets iOS Safari scroll the page under a sheet, so the body is
    pinned with position:fixed at the current offset and put back exactly where it was on release. Nested dialogs share one lock. */
let locks = 0, lockedAt = 0, lockedRoute = "";
export function lockScroll() {
  if (typeof document === "undefined") return () => {};
  if (locks++ === 0) {
    lockedAt = window.scrollY;
    lockedRoute = location.hash;
    const b = document.body.style;
    Object.assign(b, { position: "fixed", top: `-${lockedAt}px`, left: "0", right: "0", width: "100%", overflow: "hidden" });
  }
  let done = false;
  return () => {
    if (done) return; done = true;
    if (--locks === 0) {
      const b = document.body.style;
      Object.assign(b, { position: "", top: "", left: "", right: "", width: "", overflow: "" });
      // Put the page back only if we are still on it. When a link inside the dialog moved to another page
      // (e.g. "Pick a time" to the booking page), the new page keeps its own scroll position.
      if (location.hash === lockedRoute) window.scrollTo({ top: lockedAt, left: 0, behavior: "instant" });
    }
  };
}

/** Keep keyboard focus inside an open dialog: focus moves in when it opens, Tab and Shift+Tab cycle inside it,
    and focus goes back to the control that opened it on close. Without this, Tab reaches the page behind the
    dialog, where Enter can submit a form the visitor cannot see. */
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, iframe, [tabindex]';
// Open dialogs, innermost last. Only the top one handles Tab and Escape, so a quote form opened from the finder
// dialog is not fought over by both.
const dialogs = [];
/** True when el is the dialog on top (or no trapped dialog is open). Use it to guard Escape handlers. */
export const isTopDialog = (el) => !dialogs.length || dialogs[dialogs.length - 1] === el;
/** True while any focus-trapped dialog is open. */
export const dialogOpen = () => dialogs.length > 0;

/** Make everything outside the TOP dialog unreachable (inert): siblings of it and of each of its ancestors up to <body>.
    Recomputed from scratch whenever a dialog opens or closes, so two dialogs can never lock each other out
    (for example the assistant turning into a phone sheet while another dialog is open). A dialog's own backdrop
    is marked data-dialog-backdrop and stays clickable. */
let inertApplied = [];
function refreshInert() {
  inertApplied.forEach((x) => { x.inert = false; });
  inertApplied = [];
  const top = dialogs[dialogs.length - 1];
  for (let node = top; node && node !== document.body; node = node.parentElement) {
    const parent = node.parentElement;
    if (!parent) break;
    for (const sib of parent.children) {
      if (sib === node || sib.inert || sib.hasAttribute("data-dialog-backdrop") || sib.hasAttribute("data-focus-sentinel") || ["SCRIPT", "STYLE", "LINK"].includes(sib.tagName)) continue;
      sib.inert = true; inertApplied.push(sib);
    }
  }
}
export function useFocusTrap(ref, on = true) {
  useEffect(() => {
    const el = ref.current;
    if (!on || !el) return undefined;
    const back = document.activeElement;
    dialogs.push(el);
    // The page behind can no longer be reached by Tab, click or a screen reader.
    refreshInert();
    // Sentinels at both ends: focus leaving an embedded player (a YouTube iframe swallows our Tab key)
    // lands on one of them and is sent back into the dialog.
    const mk = () => { const s = document.createElement("span"); s.tabIndex = 0; s.setAttribute("aria-hidden", "true"); s.dataset.focusSentinel = ""; s.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none"; return s; };
    const head = mk(), tail = mk();
    el.prepend(head); el.append(tail);
    const items = () => [...el.querySelectorAll(FOCUSABLE)].filter((x) => !("focusSentinel" in x.dataset) && x.tabIndex >= 0 && x.getClientRects().length > 0 && getComputedStyle(x).visibility !== "hidden");
    head.addEventListener("focus", () => { const l = items(); (l[l.length - 1] || el).focus({ preventScroll: true }); });
    tail.addEventListener("focus", () => { (items()[0] || el).focus({ preventScroll: true }); });
    if (!el.contains(document.activeElement)) {
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      (items()[0] || el).focus({ preventScroll: true });
    }
    const onKey = (e) => {
      if (e.key !== "Tab" || !isTopDialog(el)) return;
      const list = items();
      if (!list.length) { e.preventDefault(); el.focus({ preventScroll: true }); return; }
      const first = list[0], last = list[list.length - 1], cur = document.activeElement;
      if (e.shiftKey && (cur === first || cur === el || !el.contains(cur))) { e.preventDefault(); last.focus({ preventScroll: true }); }
      else if (!e.shiftKey && (cur === last || !el.contains(cur))) { e.preventDefault(); first.focus({ preventScroll: true }); }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      const at = dialogs.lastIndexOf(el); if (at >= 0) dialogs.splice(at, 1);
      head.remove(); tail.remove();
      refreshInert();
      if (back && typeof back.focus === "function" && document.contains(back)) back.focus({ preventScroll: true });
    };
  }, [ref, on]);
}
