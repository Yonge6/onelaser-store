// Fails the build when the shipping quote rules change by mistake. Cases come from the live store's own cart rates
// (see src/data/shipping.js). Fix: correct shipQuote / RATES, or update a case here only when the store's rates changed.
import { shipQuote, shipRegion, zipMatchesState, isPoBox } from "../src/data/shipping.js";
const L = (h, qty = 1) => ({ product: { handle: h }, qty });
const XRF = "onelaser-xrf-desktop-laser-machine", VG = "vertigo-vertical-laser-engraver", LB = "lightburn-software-pro-license-key";
const cases = [
  ["XRF to CA is free", shipQuote([L(XRF)], "92630"), { fee: 0, days: [5, 8], partial: false }],
  ["XRF to AK", shipQuote([L(XRF)], "99501"), { fee: 900, days: [10, 15], partial: false }],
  ["XRF to HI", shipQuote([L(XRF)], "96813"), { fee: 800, days: [10, 15], partial: false }],
  ["two XRF + VertiGo to AK: once per product", shipQuote([L(XRF, 2), L(VG)], "99501"), { fee: 1800, days: [10, 15], partial: false }],
  ["XRF + item without a rate keeps the known fee", shipQuote([L(XRF), L(LB)], "99501"), { fee: 900, days: null, partial: true }],
  ["two versions of one machine: second left to checkout", shipQuote([L(XRF), L(XRF)], "99501"), { fee: 900, days: null, partial: true }],
  ["only unknown items: no quote", shipQuote([L(LB)], "92630"), null],
  ["territory: no quote", shipQuote([L(XRF)], "00901"), null],
  ["American Samoa is a territory", shipRegion("96799"), "territory"],
  ["CA ZIP with Alaska chosen", zipMatchesState("94103", "Alaska"), false],
  ["CA ZIP with California", zipMatchesState("94103", "California"), true],
  // Fishers Island NY (06390) looks like Connecticut by prefix: checkout only reminds, never blocks (Checkout.jsx)
  ["prefix-only check flags 06390 / New York (reminder only)", zipMatchesState("06390", "New York"), false],
  ["PO BOX123", isPoBox("PO BOX123"), true],
  ["Boxwood Rd is not a P.O. Box", isPoBox("12 Boxwood Rd"), false],
];
const bad = cases.filter(([, got, want]) => JSON.stringify(got) !== JSON.stringify(want));
if (bad.length) { console.error("[shipping] Wrong results:\n  " + bad.map(([n, g, w]) => `${n}: got ${JSON.stringify(g)}, want ${JSON.stringify(w)}`).join("\n  ")); process.exit(1); }
console.log(`shipping: ${cases.length} cases match the store's rates and rules.`);
