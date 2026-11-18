// Editable store content: promo, navigation, homepage sections.
// Copy and offers follow www.1laser.com as of 2026-11-16.
export const promo = {
  label: "Black Friday deals · Ends Cyber Monday, Nov 30",
  headline: "Save up to $3,000",
  image: "https://www.1laser.com/cdn/shop/files/exec-051cb678-d9c0-4c36-b080-528914f5f413.png?v=1794186467",
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

// Top navigation: labels, order and grouping follow www.1laser.com (read 2026-11-18). Shop links point to this store's pages;
// service links go to the official site.
const SITE = "https://www.1laser.com";
export const nav = [
  {
    label: "Laser Machines", to: "/collections/machines",
    columns: [
      { title: "X Series", links: [["XRF Performance Desktop Laser Engraver (38W RF)", "/products/onelaser-xrf-desktop-laser-machine"]] },
      { title: "Cobra Series", links: [["Cobra 8", "/products/cobra-8-90w-co2-laser-engraver-cutter"], ["Cobra 10", "/products/cobra-10-100w-co2-laser-engraver-cutter"], ["Cobra 14", "/products/cobra-14-130w-co2-laser-engraver-cutter"]] },
      { title: "Hydra Series", links: [["Hydra 7 Gen2", "/products/hydra-7-gen-2-70w-rf-co2-dual-laser-machine"], ["Hydra 9 Gen2", "/products/hydra-9-gen-2-70w-rf-co2-dual-laser-machine"], ["Hydra 13 Gen2", "/products/hydra-13-gen-2-70w-rf-co2-dual-laser-machine"], ["Hydra 16 Gen2", "/products/hydra-16-gen-2-70w-rf-co2-dual-laser-machine"]] },
      { title: "VertiGo", links: [["VertiGo", "/products/vertigo-vertical-laser-engraver"], ["Explore all machines", "/collections/machines"], ["Compare machines", "/compare"]] },
    ],
  },
  { label: "Accessories", to: "/collections/accessories" },
  { label: "Material", to: "/collections/materials" },
  { label: "Black Friday", to: "/collections/deals", hot: true },
  {
    label: "Support", href: `${SITE}/pages/sales-consultation`,
    columns: [
      { title: "Support", links: [["Submit a Ticket", "https://zohodesk.1laser.com/portal/en/newticket"], ["Get a Quote", `${SITE}/products/sales-consultation-call`], ["1-on-1 Training", `${SITE}/products/engineer-1-on-1-training-support`]] },
      { title: "Resources", links: [["Policy", `${SITE}/pages/shipping-policy`], ["Financing", `${SITE}/pages/financing`], ["Blogs", `${SITE}/blogs/topic`], ["Product Knowledge Base", "https://wiki.1laser.com"]] },
    ],
  },
  {
    label: "Community", href: `${SITE}/pages/laser-engraving-community`,
    columns: [
      { title: "Community", links: [["Become Affiliate", "https://af.uppromote.com/OneLaser/register"], ["Purchase Rewards", `${SITE}/pages/onelaser-rewards`], ["Join Community", `${SITE}/pages/laser-engraving-community`], ["Testimonials", `${SITE}/pages/testimonials`]] },
    ],
  },
  { label: "Contact", href: `${SITE}/pages/contact-us` },
];
export const contact = { phone: "626 800 4130", tel: "+16268004130", call: `${SITE}/pages/sales-consultation` };

// Footer: columns, links, contact lines and social accounts as on www.1laser.com (read 2026-11-18).
export const footer = {
  groups: [
    ["Community", [["Purchase Rewards", `${SITE}/pages/onelaser-rewards`], ["Become Affiliate", "https://af.uppromote.com/OneLaser/register"], ["Join Community", `${SITE}/pages/laser-engraving-community`], ["Testimonials", `${SITE}/pages/testimonials`]]],
    ["Machines", [["OneLaser Machines", "/collections/machines"], ["X Series", "/collections/xrf-series"], ["Cobra Series", "/collections/cobra-series"], ["Hydra Gen2 Series", "/collections/hydra-gen2"], ["Hydra Series", "/collections/previous-generation"], ["VertiGo", "/products/vertigo-vertical-laser-engraver"], ["Laser Accessories", "/collections/accessories"]]],
    ["Support", [["About Us", `${SITE}/pages/about-us`], ["Contact Us", `${SITE}/pages/contact-us`], ["Financing", `${SITE}/pages/financing`], ["Blog Center", `${SITE}/blogs/topic`], ["Payment Methods", `${SITE}/pages/payment-methods`], ["Common FAQ", `${SITE}/pages/faq`], ["Laser Engraving & Cutting Chart", `${SITE}/pages/laser-cutter-engraving-settings-for-different-materials`]]],
    ["Policy", [["Shipping Policy", `${SITE}/pages/shipping-policy`], ["Privacy Policy", `${SITE}/pages/privacy-policy`], ["Refund Policy", `${SITE}/pages/refund-policy`], ["Terms of Service", `${SITE}/pages/terms-of-service`], ["Warranty Policy", `${SITE}/pages/warranty-policy`], ["Pre & Backorder Policy", `${SITE}/pages/pre-order-backorder-policy`], ["Giveaway General Terms & Conditions", `${SITE}/pages/onelaser-giveaway-general-terms-conditions`]]],
  ],
  contact: [["Phone", "626-800-4130", "tel:+16268004130"], ["Tech Support", "ts@1laser.com", "mailto:ts@1laser.com"], ["Customer Support", "cs@1laser.com", "mailto:cs@1laser.com"], ["Sales Consultation", "sales@1laser.com", "mailto:sales@1laser.com"]],
  address: "20472 Crescent Bay Dr, STE 104, Lake Forest, CA 92630",
  social: [["Facebook", "https://www.facebook.com/onelaser.official"], ["Instagram", "https://www.instagram.com/onelaser.official/"], ["YouTube", "https://www.youtube.com/@OneLaser.Official"], ["TikTok", "https://www.tiktok.com/@onelaser.official"], ["X (Twitter)", "https://x.com/OneLaserHQ"]],
  legal: [["Privacy Policy", `${SITE}/policies/privacy-policy`], ["Terms of Service", `${SITE}/policies/terms-of-service`]],
};

// Home "The OneLaser Standard" block with the headquarters photo, copied from www.1laser.com (read 2026-11-18).
export const homeStandard = {
  image: `${SITE}/cdn/shop/files/onelaser-us-headquarters.webp?v=1788363337`,
  kicker: "The OneLaser Standard", title: "Make better with one.",
  text: "Ownership is backed by a U.S. company, local guidance, training, official policy coverage, and technical support after delivery.",
  points: [
    ["U.S. company and local team", "An accountable OneLaser team for sales, service, and product guidance in the U.S."],
    ["Training that gets work moving", "One-on-one training and knowledge resources help teams move from setup to real jobs."],
    ["Warranty and easy returns", "Official warranty coverage and a 30-day return policy provide a clearer ownership path."],
    ["Technical support after delivery", "Support continues through real technicians, service resources, and available parts."],
  ],
  cta: ["Explore OneLaser support", `${SITE}/products/sales-consultation-call`],
};

export const heroSlides = [
  { eyebrow: "Black Friday · Ends Nov 30", title: "XRF 38W", text: "All-in-one RF desktop laser — $1,000 off", image: "home-hero-xrf.jpg", to: "/products/onelaser-xrf-desktop-laser-machine", dark: true, countdown: true },
  { eyebrow: "Industrial RF", title: "Hydra Gen2", text: "RF and hybrid dual-laser systems.", image: "home-product-hydra-gen2-scene.webp", to: "/collections/hydra-gen2", dark: true },
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

// One flagship per machine line, so the home page does not repeat the same machines module after module.
export const hot = [
  "onelaser-xrf-desktop-laser-machine", "hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "cobra-8-90w-co2-laser-engraver-cutter",
  "vertigo-vertical-laser-engraver",
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


/* ---------- Home, Insta360-style (2026-11-17) ---------- */
// Tabs of the product block. Each tab shows up to six cards; "all" is the View all link.
export const homeTabs = [
  { label: "Most Popular", all: "/collections/machines", picks: ["onelaser-xrf-desktop-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "cobra-10-100w-co2-laser-engraver-cutter", "vertigo-vertical-laser-engraver", "hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "cobra-8-90w-co2-laser-engraver-cutter"] },
  { label: "Desktop Lasers", all: "/collections/machines", picks: ["onelaser-xrf-desktop-laser-machine", "vertigo-vertical-laser-engraver"] },
  { label: "Cobra Series", all: "/collections/cobra-series", picks: ["cobra-8-90w-co2-laser-engraver-cutter", "cobra-10-100w-co2-laser-engraver-cutter", "cobra-14-130w-co2-laser-engraver-cutter"] },
  { label: "Hydra Gen2", all: "/collections/hydra-gen2", picks: ["hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", "hydra-16-gen-2-70w-rf-co2-dual-laser-machine"] },
  { label: "Materials", all: "/collections/materials", collection: "materials" },
  { label: "Rotary Attachments", all: "/collections/rotary", collection: "rotary" },
  { label: "Fume Extractors", all: "/collections/fume", collection: "fume" },
  { label: "Chillers", all: "/collections/cooling", collection: "cooling" },
  { label: "Lens & Optics", all: "/collections/optics", collection: "optics" },
];
export const newHandles = ["onelaser-xrf-desktop-laser-machine", "vertigo-vertical-laser-engraver"];
export const homeFeature = { title: "Hydra 9 Gen2", text: ["70W RF + CO₂ dual laser.", "Save up to $3,000 this Black Friday."], image: "promo-hydra9.jpg", to: "/products/hydra-9-gen-2-70w-rf-co2-dual-laser-machine" };
export const interests = [
  ["Wood décor", "home-project-walnut-mountain-wall.webp", "/collections/hydra-gen2"],
  ["Leather goods", "home-project-batch-leather-gifts.webp", "/collections/xrf-series"],
  ["Acrylic signs", "home-project-large-acrylic-sign.webp", "/collections/cobra-series"],
  ["Drinkware", "home-project-vertigo-corporate-tumbler-batch.webp", "/collections/vertigo"],
  ["Weddings & events", "home-project-etsy-wedding-welcome-suite.webp", "/collections/machines"],
  ["Acrylic sheets", "material-acrylic.webp", "/collections/acrylic"],
  ["Leatherette", "material-leather.webp", "/collections/leatherette"],
];
// TODO(team): replace with real customer stories and links once marketing supplies them.
export const homeStories = [
  ["XRF 38W: an RF laser for the desktop", "Air-cooled RF, true 3G acceleration and a 0.07 mm laser spot.", "hot-xrf.jpg", "/products/onelaser-xrf-desktop-laser-machine"],
  ["Hydra Gen2: RF precision at industrial scale", "70W RF Pro or 38W RF + glass-tube Hybrid configurations.", "hot-hydra7.jpg", "/collections/hydra-gen2"],
  ["Cobra Series: workshop cutting power", "90W to 130W glass CO₂ for wood, acrylic and leather.", "hot-cobra8.jpg", "/collections/cobra-series"],
  ["VertiGo: built for drinkware", "Built-in vertical rotary. No setup, no alignment.", "hot-vertigo.jpg", "/products/vertigo-vertical-laser-engraver"],
  ["PiBurn OMNI: rotary engraving", "Roller and chuck modes with two drive systems and two motors.", "hot-piburn.jpg", "/products/piburn-omni-for-onelaser"],
];

// One-line card slogans (Insta360 cards carry a single short line). Facts come from the product names and specs.
export const shortSlogans = {
  "onelaser-xrf-desktop-laser-machine": "38W RF desktop laser.",
  "vertigo-vertical-laser-engraver": "Vertical laser for drinkware.",
  "cobra-8-90w-co2-laser-engraver-cutter": "90W CO₂ workshop laser.",
  "cobra-10-100w-co2-laser-engraver-cutter": "100W CO₂ laser cutter.",
  "cobra-14-130w-co2-laser-engraver-cutter": "130W large-format CO₂ laser.",
  "hydra-7-gen-2-70w-rf-co2-dual-laser-machine": "Compact RF dual-laser system.",
  "hydra-9-gen-2-70w-rf-co2-dual-laser-machine": "RF + CO₂ dual-laser system.",
  "hydra-13-gen-2-70w-rf-co2-dual-laser-machine": "Large-format dual-laser system.",
  "hydra-16-gen-2-70w-rf-co2-dual-laser-machine": "Our largest dual-laser system.",
};

// Home video module. Lists supplied by the team on 2026-11-18; titles and channels read from YouTube. [id, title, channel]
export const homeVideos = [
  { label: "OneLaser", items: [
    ["seseyuxIZt4", "OneLaser Laser Engravers As Seen on FOX & Discovery | Product Showcase", "OneLaser"],
    ["_dv0xXmHSiA", "Engineered in the USA: What Makes OneLaser Different", "OneLaser"],
    ["KAtO7_wkmMk", "OneLaser at APA Show | International Personalization Expo 2025 Recap", "OneLaser"],
    ["waBw5gDMPIM", "I Tested the New OneLaser Machines at the Next Level Maker Conference...", "OneLaser"],
  ] },
  { label: "XRF", items: [
    ["8tn7O69iCnQ", "Fox News Introduces ONELASER As Best Holiday DIY Gift!", "OneLaser"],
    ["RxgWwJg5kAk", "Behind The Maker Ep. 001 | Holly Whiteside", "OneLaser"],
    ["jNaj50MkKiE", "I Was Wrong About the One Laser X Desktop Laser", "Make or Break Shop"],
    ["zHtW_nGm19U", "Pro Desktop Laser at a Budget Price - OneLaser X Series Review", "Make or Break Shop"],
    ["r5m8As2oOJ4", "Hobby Laser vs. OneLaser XRF: Does Speed Actually Matter?", "OneLaser"],
    ["j0WL-yfH3wE", "OneLaser XRF Overview | The Best Budget Friendly Desktop RF Laser", "ESENTL LASERHYDE"],
  ] },
  { label: "Hydra", items: [
    ["y0YUu-4rx7A", "Should You Get an Industrial Size Laser?", "Make or Break Shop"],
    ["HhpgAgg2ZCs", "My Biggest Regret After a Year With the OneLaser Hydra...", "OneLaser"],
    ["HdP62cQVzs0", "The Machine Behind His Best-Selling Maps | OneLaser Hydra 16 Testimonial", "OneLaser"],
    ["Fqtlsk_NsKM", "Is the OneLaser Hydra 13 Worth It? A Pottery Owner's Honest Review", "OneLaser"],
    ["mUyYcwdeC1g", "Year review ONELaser Hydra 9", "Ash&Ember Woodshop"],
    ["vf5KO_kGgmU", "How We Built The Fast & Furious Supra Interior (And How We Do It Now)", "OneLaser"],
    ["sJx0-QZcXWo", "Onelaser Hydra 9 | Ultimate Setup Guide", "Rise N Grind Workshop"],
  ] },
  { label: "VertiGo", items: [
    ["CwMCGw1aPTA", "Vertigo is the World's BEST Tumbler Machine", "LensDigital"],
    ["G9fXsZAbUXs", "If You Sell Tumblers, Buy This Laser", "Make or Break Shop"],
  ] },
  { label: "Cobra", items: [
    ["fdmr7l_crhI", "Perfecting Leatherette Hat Patches with the OneLaser Cobra 10 & XRF RF Tube", "ESENTL LASERHYDE"],
    ["F1ZJvoeANgk", "Meet the COBRA™: Official Product Tour & Launch Announcement", "OneLaser"],
    ["UxN-bVOpAKg", "I Spent 10 Years Evaluating Lasers—Here's Why I Chose the Cobra", "OneLaser"],
  ] },
];

// Home "Why OneLaser" proof points (after the Build quality + Support blocks on thunderlaserusa.com).
// Every figure is taken from the official product pages on 1laser.com (see src/data/stories.json). [figure, title, text]
export const homeProof = [
  ["30,000 h", "RF tube life, air-cooled", "XRF and Hydra Gen2 run sealed RF metal tubes rated for up to 30,000 hours. No water chiller for the RF source."],
  ["2,000 mm/s", "Production speed", "Hydra Gen2 engraves at up to 2,000 mm/s with 4G acceleration, so a full bed finishes sooner."],
  ["0.07 mm", "Laser dot for fine detail", "Up to 2,000 DPI with ≤ 0.01 mm repeat positioning for small text, photos and logos."],
  ["12 MP", "Camera and autofocus", "A top-cover camera and XFocus™ autofocus show where the job will land before you press start."],
  ["3-2-1", "Warranty", "3-year mechanical, 2-year electrical and 1-year optics coverage on XRF and Hydra machines."],
  ["5+ yrs", "U.S.-based engineers", "Call OneLaser and you talk to a U.S.-based engineer with more than five years of laser experience on average."],
];

// Home buying FAQ (after "Questions? Answers." on thunderlaserusa.com). Answers restate the policies and pages on 1laser.com.
export const homeFaq = [
  ["Which machine is right for me?", "Answer the four questions in “Find your machine” above, compare every model side by side, or schedule a call with a OneLaser engineer."],
  ["What warranty is included?", "The 3-2-1 warranty covers XRF and Hydra machines: 3-year mechanical, 2-year electrical and 1-year optics. Other products follow the official warranty policy."],
  ["Can I return a machine?", "OneLaser offers 30-day easy returns. See the Refund Policy on 1laser.com for conditions."],
  ["Is financing available?", "Yes. OneLaser works with Shop Pay Installments, Affirm and ClickLease. Rates and terms depend on the lender's approval."],
  ["Which software does it work with?", "OneLaser machines work with LightBurn, MakerBoost AI and RDWorks on Windows and macOS."],
  ["How does support work after I buy?", "You talk to U.S.-based engineers who have built, tuned and repaired these machines. Contact them from the Support page."],
  ["How much is shipping?", "The shipping rate and delivery estimate are shown at checkout once you enter your address. See the Shipping Policy for details."],
];

// Home owner reviews. Real reviews copied word for word (shortened only with "…") from the Judge.me widget on
// https://www.1laser.com/products/onelaser-xrf-desktop-laser-machine on 2026-11-18. verified = Judge.me "verified buyer" flag.
export const homeReviews = {
  average: "4.94", count: 49, product: "XRF 38W", url: "https://www.1laser.com/products/onelaser-xrf-desktop-laser-machine#Reviews",
  items: [
    { name: "Thomas M Eichhorn", date: "May 2026", verified: true, text: "I absolutely love this laser. And for the record, I have four other lasers, none of which are OneLasers. If I had the funds, I would replace several of the other lasers I have with OneLasers. Tech support is fantastic and quick to respond, material quality is great." },
    { name: "Chantal Dowling", date: "May 2026", verified: false, text: "My husband and I own a tumbler engraving business. We decided to give OneLaser XRF a try. A tumbler that took 2 hours to engrave with the Xtool only took 43 minutes with the XRF. It has been a learning curve but support has been patient and wonderful." },
    { name: "James Kirk", date: "Jun 2026", verified: true, text: "I started out with a Full Spectrum K40 style, upgraded to a GlowForge, dabbled with some blue diode lasers, but the XRF is amazing. Smooth, solid, relatively quiet, accurate. I love it! Puts the joy back into creating." },
    { name: "Jeff Kerns", date: "Nov 2026", verified: true, text: "It is a beast! It has done everything promised. The XRF has been very reliable for me. Set up took some time with the shipping getting it out of alignment. But once dialed in it has been easy to use." },
    { name: "Brent Schaffer", date: "Jun 2025", verified: true, text: "After considering several Lasers, I settled on 1/One Laser. I picked this for the power, speed, features, and cost. Being a beginner in CO2 Lasers, I will say the customer support was prompt and helpful. … The riser was easy to assemble and the machine worked right out of the box." },
    { name: "Tyler Reed", date: "Apr 2025", verified: false, text: "Was able to knock out a few signs for some of my friends today … So far this thing amazes me at the intricate cutting ability and incredible detailed edges of engraving." },
  ],
};
