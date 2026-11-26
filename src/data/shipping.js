/* Where an order can ship and how, from the 1laser.com Shipping Policy (src/data/policies.json, read 2026-11-25):
   - Lower 48 states: fixed-rate shipping, pre-calculated from the item's size, weight and location; delivery on average
     3–14 business days after the order ships; orders are processed in 3–5 business days.
   - Alaska and Hawaii: rate is not fixed, collected before dispatch; about 14 business days.
   - U.S. territories (Puerto Rico, Guam, U.S. Virgin Islands, American Samoa…): no direct shipping; the team can arrange
     third-party shipping.
   - No P.O. Boxes or APO/FPO addresses.
   The fixed dollar rates per item are set in the Shopify store and are not published, so the draft shows the rule, not a
   price. When the team sends the rates, put them in RATES (item handle → USD) and the cart and checkout show them. */
export const RATES = {};

/* First three ZIP digits → state (USPS ranges). Military APO/FPO/DPO prefixes are "military". */
const RANGES = [
  [5, 5, "NY"], [6, 7, "PR"], [8, 8, "VI"], [9, 9, "PR"], [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"],
  [50, 59, "VT"], [60, 69, "CT"], [70, 89, "NJ"], [90, 99, "military"], [100, 149, "NY"], [150, 196, "PA"], [197, 199, "DE"],
  [200, 200, "DC"], [201, 201, "VA"], [202, 205, "DC"], [206, 219, "MD"], [220, 246, "VA"], [247, 268, "WV"], [270, 289, "NC"],
  [290, 299, "SC"], [300, 319, "GA"], [320, 339, "FL"], [340, 340, "military"], [341, 349, "FL"], [350, 369, "AL"],
  [370, 385, "TN"], [386, 397, "MS"], [398, 399, "GA"], [400, 427, "KY"], [430, 459, "OH"], [460, 479, "IN"], [480, 499, "MI"],
  [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"], [569, 569, "DC"], [570, 577, "SD"], [580, 588, "ND"], [590, 599, "MT"],
  [600, 629, "IL"], [630, 658, "MO"], [660, 679, "KS"], [680, 693, "NE"], [700, 714, "LA"], [716, 729, "AR"], [730, 749, "OK"],
  [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"], [832, 838, "ID"], [840, 847, "UT"], [850, 865, "AZ"], [870, 884, "NM"],
  [885, 885, "TX"], [889, 898, "NV"], [900, 961, "CA"], [962, 966, "military"], [967, 968, "HI"], [969, 969, "GU"],
  [970, 979, "OR"], [980, 994, "WA"], [995, 999, "AK"],
];
const TERRITORY = ["PR", "VI", "GU"];

/** Shipping region for a 5-digit ZIP: "lower48" | "akhi" | "territory" | "military" | null (not a known U.S. ZIP). */
export function shipRegion(zip) {
  const m = /^(\d{5})(-\d{4})?$/.exec(String(zip || "").trim());
  if (!m) return null;
  const p = Number(m[1].slice(0, 3));
  const st = RANGES.find(([a, b]) => p >= a && p <= b)?.[2];
  if (m[1] === "96799") return "territory"; // American Samoa uses a Hawaii prefix
  if (!st) return null;
  if (st === "military") return "military";
  if (TERRITORY.includes(st)) return "territory";
  if (st === "AK" || st === "HI") return "akhi";
  return "lower48";
}

/** What the buyer sees for a region: [headline, detail]. */
export const SHIP_TEXT = {
  lower48: ["Fixed-rate shipping", "Orders are processed in 3–5 business days, then arrive in about 3–14 business days."],
  akhi: ["Custom shipping quote for Alaska and Hawaii", "We'll email you the shipping rate to confirm before your order ships. Delivery takes about 14 business days."],
  territory: ["No direct shipping to U.S. territories", "Email cs@1laser.com and we'll help set up third-party shipping."],
  military: ["We can't ship to APO/FPO addresses or P.O. Boxes", "Please enter a street address in the 50 states."],
};
/** A P.O. Box in the street line (the policy does not ship there). */
export const isPoBox = (s) => /\bp\.?\s*o\.?\s*box|\bpost\s+office\s+box/i.test(String(s || ""));
