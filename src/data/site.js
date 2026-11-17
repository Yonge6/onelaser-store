// Editable store content: promo, navigation, homepage sections.
// Copy and offers follow www.1laser.com as of 2026-11-16.
export const promo = {
  label: "Black Friday deals · Ends Cyber Monday, Nov 30",
  headline: "Save up to $3,000",
  endsAt: "2026-12-01T07:59:59Z", // Nov 30, 11:59 PM PT
  link: "/collections/deals",
};

export const collections = {
  machines: { title: "Laser Machines", intro: "Engraving, cutting and marking machines for makers, workshops and production floors.", filter: (p) => p.kind === "machine" },
  "xrf-series": { title: "XRF Series", intro: "All-in-one RF desktop lasers.", filter: (p) => p.series === "xrf" },
  "cobra-series": { title: "Cobra Series", intro: "Workshop-essential glass CO₂ engravers and cutters.", filter: (p) => p.series === "cobra" },
  "hydra-gen2": { title: "Hydra Gen2", intro: "Industrial RF and hybrid dual-laser systems.", filter: (p) => p.series === "hydra" },
  vertigo: { title: "VertiGo", intro: "Vertical rotary laser built for drinkware.", filter: (p) => p.series === "vertigo" },
  "previous-generation": { title: "Previous Generation", intro: "Proven performance. Exceptional value. Very limited inventory.", filter: (p) => p.series === "legacy" },
  accessories: { title: "Laser Accessories", intro: "Rotaries, fume extraction, optics, cooling and expansion for your OneLaser.", filter: (p) => p.kind === "accessory" },
  rotary: { title: "Rotary Attachments", intro: "Engrave tumblers, mugs, bottles and more.", filter: (p) => p.category === "rotary" },
  fume: { title: "Fume Extractors", intro: "FiltraBox filtration systems and replacement filters.", filter: (p) => p.category === "fume" },
  optics: { title: "Lens, Mirrors & Tubes", intro: "Focus lenses, mirrors, beam optics and laser tubes.", filter: (p) => p.category === "optics" },
  cooling: { title: "Chillers", intro: "Water chillers for glass-tube systems.", filter: (p) => p.category === "cooling" },
  expansion: { title: "Expansion", intro: "Riser bases, conveyor feeders and air assist.", filter: (p) => p.category === "expansion" || p.category === "air" },
  software: { title: "Software & Training", intro: "LightBurn licenses and 1-on-1 engineer training.", filter: (p) => p.category === "software" },
  materials: { title: "Materials", intro: "Laser-ready acrylic and leatherette sheets from MakerDepot.", filter: (p) => p.kind === "material" },
  acrylic: { title: "Acrylic Sheets", intro: "Frosted, translucent, glitter and mirror acrylic.", filter: (p) => p.category === "acrylic" },
  leatherette: { title: "Leatherette", intro: "Heat-activated adhesive leatherette sheets.", filter: (p) => p.category === "leatherette" },
  deals: { title: "Black Friday Deals", intro: "Every product currently on sale.", filter: (p) => p.compareAt },
};

export const nav = [
  {
    label: "Laser Machines", to: "/collections/machines",
    columns: [
      { title: "Desktop", links: [["XRF 38W", "/products/onelaser-xrf-desktop-laser-machine"], ["VertiGo", "/products/vertigo-vertical-laser-engraver"]] },
      { title: "Workshop", links: [["Cobra 8", "/products/cobra-8-90w-co2-laser-engraver-cutter"], ["Cobra 10", "/products/cobra-10-100w-co2-laser-engraver-cutter"], ["Cobra 14", "/products/cobra-14-130w-co2-laser-engraver-cutter"]] },
      { title: "Industrial", links: [["Hydra 7 Gen2", "/products/hydra-7-gen-2-70w-rf-co2-dual-laser-machine"], ["Hydra 9 Gen2", "/products/hydra-9-gen-2-70w-rf-co2-dual-laser-machine"], ["Hydra 13 Gen2", "/products/hydra-13-gen-2-70w-rf-co2-dual-laser-machine"], ["Hydra 16 Gen2", "/products/hydra-16-gen-2-70w-rf-co2-dual-laser-machine"]] },
      { title: "Shop", links: [["All machines", "/collections/machines"], ["Compare machines", "/compare"], ["Previous generation", "/collections/previous-generation"]] },
    ],
  },
  {
    label: "Accessories", to: "/collections/accessories",
    columns: [
      { title: "By type", links: [["Rotary Attachments", "/collections/rotary"], ["Fume Extractors", "/collections/fume"], ["Lens, Mirrors & Tubes", "/collections/optics"], ["Chillers", "/collections/cooling"], ["Expansion", "/collections/expansion"], ["Software & Training", "/collections/software"]] },
      { title: "Shop", links: [["All accessories", "/collections/accessories"]] },
    ],
  },
  {
    label: "Materials", to: "/collections/materials",
    columns: [{ title: "Materials", links: [["Acrylic Sheets", "/collections/acrylic"], ["Leatherette", "/collections/leatherette"], ["All materials", "/collections/materials"]] }],
  },
  { label: "Black Friday", to: "/collections/deals", hot: true },
  { label: "Support", href: "https://www.1laser.com/pages/sales-consultation" },
];

export const heroSlides = [
  { eyebrow: "Black Friday · Ends Nov 30", title: "XRF 38W", text: "All-in-one RF desktop laser — $1,000 off", image: "home-banner-xrf-desktop.webp", to: "/products/onelaser-xrf-desktop-laser-machine", dark: true, countdown: true, masked: true },
  { eyebrow: "Industrial RF", title: "Hydra Gen2", text: "70W RF and hybrid dual-laser systems. Save up to $3,000.", image: "home-product-hydra-gen2-scene.webp", to: "/collections/hydra-gen2", dark: true },
  { eyebrow: "Workshop Essential", title: "Cobra Series", text: "Glass CO₂ cutting power from $3,999.", image: "home-product-cobra-scene.webp", to: "/collections/cobra-series", dark: true },
  { eyebrow: "Built for drinkware", title: "VertiGo", text: "Built-in vertical rotary. No setup, no alignment.", image: "home-product-vertigo-scene.webp", to: "/products/vertigo-vertical-laser-engraver", dark: true },
];

export const categoryRail = [
  ["XRF Series", "/collections/xrf-series", "onelaser-xrf-desktop-laser-machine"],
  ["Cobra Series", "/collections/cobra-series", "cobra-10-100w-co2-laser-engraver-cutter"],
  ["Hydra Gen2", "/collections/hydra-gen2", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine"],
  ["VertiGo", "/collections/vertigo", "vertigo-vertical-laser-engraver"],
  ["Rotary", "/collections/rotary", "piburn-omni-for-onelaser"],
  ["Fume Extractors", "/collections/fume", "filtrabox-compact-x"],
  ["Lens & Optics", "/collections/optics", "2-inch-focal-lens-laser-engraver"],
  ["Chillers", "/collections/cooling", "onelaser-industrial-chiller-for-hydra-laser-engraver"],
  ["Materials", "/collections/materials", "1-8-glitter-acrylic-sheets-12-12-4-pack-for-laser-engraving-cutting"],
];

export const hot = [
  "onelaser-xrf-desktop-laser-machine", "hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "cobra-8-90w-co2-laser-engraver-cutter",
  "vertigo-vertical-laser-engraver", "piburn-omni-for-onelaser", "onelaser-x-series-riser-base", "filtrabox-micro",
];

// Lifestyle backgrounds for the What's Hot tiles: generated with ChatGPT from the official 1laser.com renders (2026-11-16).
export const hotImages = {
  "onelaser-xrf-desktop-laser-machine": "hot-xrf.jpg", "hydra-7-gen-2-70w-rf-co2-dual-laser-machine": "hot-hydra7.jpg",
  "cobra-8-90w-co2-laser-engraver-cutter": "hot-cobra8.jpg", "vertigo-vertical-laser-engraver": "hot-vertigo.jpg",
  "piburn-omni-for-onelaser": "hot-piburn.jpg", "onelaser-x-series-riser-base": "hot-riser.jpg", "filtrabox-micro": "hot-filtrabox.jpg",
};

export const bestSellers = [
  "onelaser-xrf-desktop-laser-machine", "cobra-10-100w-co2-laser-engraver-cutter", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine",
  "vertigo-vertical-laser-engraver", "hydra-7-gen-2-70w-rf-co2-dual-laser-machine",
];

export const promoBanner = { kicker: "OneLaser Store Picks", title: "Black Friday: save up to $3,000", text: "Every machine and accessory currently on sale, in one place.", product: "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", image: "promo-hydra9.jpg", to: "/collections/deals" };

export const seriesBlocks = [
  { kicker: "Create anywhere", title: "Desktop", name: "XRF 38W", text: "Air-cooled RF, true 3G acceleration and a 0.07 mm laser spot in an all-in-one desktop machine.", image: "home-product-xrf-scene.webp", to: "/products/onelaser-xrf-desktop-laser-machine", view: "/collections/machines", viewLabel: "Explore Desktop Machines and Accessories",
    picks: ["onelaser-xrf-desktop-laser-machine", "vertigo-vertical-laser-engraver", "onelaser-x-series-riser-base", "onelaser-automatic-conveyor-feeder"] },
  { kicker: "For production", title: "Workshop", name: "Cobra Series", text: "90W to 130W glass CO₂ power with Smart Dual Air-Assist for wood, acrylic and leather.", image: "home-product-cobra-scene.webp", to: "/collections/cobra-series", view: "/collections/cobra-series", viewLabel: "Explore Cobra Machines and Accessories",
    picks: ["cobra-8-90w-co2-laser-engraver-cutter", "cobra-10-100w-co2-laser-engraver-cutter", "cobra-14-130w-co2-laser-engraver-cutter", "onelaser-industrial-chiller-for-hydra-laser-engraver"] },
  { kicker: "Scale up", title: "Industrial", name: "Hydra Gen2", text: "70W RF Pro or 38W RF + glass-tube Hybrid configurations for precision, speed and scale.", image: "home-product-hydra-gen2-scene.webp", to: "/collections/hydra-gen2", view: "/collections/hydra-gen2", viewLabel: "Explore Hydra Gen2 Machines and Accessories",
    picks: ["hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", "hydra-16-gen-2-70w-rf-co2-dual-laser-machine"] },
  { kicker: "Complete your setup", title: "Accessories & Materials", name: "Built for OneLaser", text: "Rotaries, fume extraction, optics and laser-ready materials tested for OneLaser machines.", image: "home-product-vertigo-scene.webp", to: "/collections/accessories", view: "/collections/accessories", viewLabel: "Explore Accessories and Materials",
    picks: ["piburn-omni-for-onelaser", "filtrabox-micro", "1-8-glitter-acrylic-sheets-12-12-4-pack-for-laser-engraving-cutting", "makerdepot-1-0mm-no-foam-leatherette-sheets-12-20-5-pack-for-laser-engraving-cutting"] },
];

// TODO(team): confirm each promise with the boss before launch.
export const benefits = [
  ["30-Day Easy Returns", "Shop with confidence."],
  ["3-2-1 Warranty", "3-year mechanical, 2-year electrical, 1-year optics on XRF and Hydra."],
  ["U.S.-Based Support", "Talk to real laser engineers."],
  ["Official Accessories", "Tested for OneLaser machines."],
  ["Secure Payment", "Encrypted checkout."],
];

export const faq = [
  ["What is the return policy?", "OneLaser offers 30-day easy returns. See the Refund Policy on 1laser.com for conditions."],
  ["What warranty is included?", "The 3-2-1 warranty covers XRF and Hydra machines: 3-year mechanical, 2-year electrical and 1-year optics. Other products follow the official warranty policy."],
  ["Where can I get help choosing?", "Book a free sales consultation call or contact U.S.-based support from the Support page."],
];

// Product-page "Don't Miss Top Accessories", by machine family. TODO(team): confirm compatibility per model.
const common = ["lightburn-software-pro-license-key", "engineer-1-on-1-training-support"];
export const addOns = {
  xrf: ["onelaser-x-series-riser-base", "onelaser-automatic-conveyor-feeder", "multi-function-rotary-axis-57-motor", "filtrabox-micro", ...common],
  vertigo: ["filtrabox-micro", ...common],
  cobra: ["onelaser-industrial-chiller-for-hydra-laser-engraver", "multi-function-rotary-axis-57-motor", "piburn-omni-for-onelaser", "filtrabox-compact-x", ...common],
  hydra: ["multi-function-rotary-axis-57-motor", "piburn-omni-for-onelaser", "filtrabox-compact-x", "2-inch-focal-lens-laser-engraver", ...common],
};
