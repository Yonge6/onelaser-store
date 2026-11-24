import { useMemo, useState } from "react";
import { t, tf } from "../i18n.js";
import { frontImg, img, money, products } from "../lib.js";
import { useCart } from "../cart.jsx";
import { collections, newHandles, saleOn } from "../data/site.js";
import { Icon, Link } from "../components/ui.jsx";
import { glanceRows } from "../components/Glance.jsx";
import { goToFinder } from "../components/Finder.jsx";

/* Machine filters in buyers' terms (what you'll make, how big, how much), worked out from the catalog specs. */
const area = (p) => { const n = (p.specs?.["Work area"] || "").match(/[\d.]+/g); return p.series === "vertigo" || !n ? null : [parseFloat(n[0]), parseFloat(n[1])]; };
const src = (p) => p.specs?.["Laser source"] || "";
const JOBS = [
  ["cut", "Cutting wood & acrylic", (p) => /Glass|70W RF/.test(src(p))],
  ["detail", "Fine engraving & photos", (p) => parseInt((p.specs?.["Max resolution"] || "").replace(/,/g, ""), 10) >= 2000],
  ["round", "Tumblers (built-in rotary)", (p) => p.series === "vertigo"],
  ["metal", "Coated & anodized metal", (p) => /RF/.test(src(p))],
];
// "Largest piece": machines whose bed holds a piece that size, either way round (same 0.6 in allowance as the finder)
const holds = ([w, h]) => (p) => { const a = area(p); return !!a && ((a[0] >= w - 0.6 && a[1] >= h - 0.6) || (a[0] >= h - 0.6 && a[1] >= w - 0.6)); };
const SIZES = [
  ["s", "Up to 12 × 12 in", holds([12, 12])],
  ["m", "Up to 24 × 12 in", holds([24, 12])],
  ["l", "Up to 36 × 24 in", holds([36, 24])],
  ["xl", "Up to 51 × 35 in", holds([51, 35])],
  ["xxl", "Up to 63 × 39 in", holds([63, 39])],
];
const BUDGETS = [
  ["low", "Under $5,000", (p) => p.price < 5000],
  ["mid", "$5,000 – $8,000", (p) => p.price >= 5000 && p.price <= 8000],
  ["high", "Over $8,000", (p) => p.price > 8000],
];

/* Layout, sizes and type follow the Insta360 Store listing page (store.insta360.com/accessory, measured 2026-11-17 at 1440):
   gray page #F8F9FC → sticky white category strip (124×148 tiles, 80px image) → 240px filter column (20/28 bold head, count badge,
   Reset, 16/22 bold groups with 16px checkboxes) + 3-column grid of white cards 316×395, radius 16, 191px image,
   18/24 title, 14px price and a 36px dark pill button. */

const SORTS = {
  Recommended: null,
  "Price: Low to High": (a, b) => a.price - b.price,
  "Price: High to Low": (a, b) => b.price - a.price,
  "Name: A–Z": (a, b) => a.name.localeCompare(b.name),
};
const TREE = [
  ["Laser Machines", "machines", [["XRF Series", "xrf-series"], ["Cobra Series", "cobra-series"], ["Hydra Gen2", "hydra-gen2"], ["VertiGo", "vertigo"], ["Previous Generation", "previous-generation"]]],
  ["Accessories", "accessories", [["Rotary Attachments", "rotary"], ["Fume Extractors", "fume"], ["Lens, Mirrors & Tubes", "optics"], ["Chillers", "cooling"], ["Expansion", "expansion"], ["Software & Training", "software"]]],
  ["Materials", "materials", [["Acrylic Sheets", "acrylic"], ["Leatherette", "leatherette"]]],
];
const thumb = (h) => products.find(collections[h]?.filter || (() => false))?.images[0];

function Card({ product }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const machine = product.kind === "machine";
  const single = product.variants.length === 1;
  const to = `/products/${product.handle}`;
  const addNow = () => {
    add(product.handle, product.variants[0].id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <article className="il-card">
      <Link to={to} className={`il-card-media${machine ? " front" : ""}`} tabIndex={-1} aria-hidden="true"><img src={img(machine ? frontImg(product) : product.images[0], 500)} alt="" loading="lazy" /></Link>
      <p className="il-card-tag">
        {!product.available ? <span>{t("Out of stock")}</span> : newHandles.includes(product.handle) ? <b>{t("New")}</b> : product.compareAt ? <b>{t("Save")} {money(product.compareAt - product.price)}</b> : null}
      </p>
      <h3><Link to={to}>{product.name}</Link></h3>
      {machine && (
        <ul className="il-specs">
          {glanceRows(product, { full: false }).slice(0, 2).map(([icon, value, label]) => <li key={label}><Icon name={icon} size={15} /><span><b>{t(value)}</b> {t(label)}</span></li>)}
          {product.bestFor && <li><Icon name="target" size={15} /><span><b>{t("Best for")}:</b> {t(product.bestFor)}</span></li>}
        </ul>
      )}
      <div className="il-card-foot">
        <span className="il-price">{product.priceVaries ? tf("From {price}", { price: money(product.price) }) : money(product.price)}{product.compareAt && <s>{money(product.compareAt)}</s>}</span>
        {!product.available ? (
          <button type="button" className="il-pill muted" disabled>{t("Notify me")}</button>
        ) : machine || !single ? (
          <Link to={to} className="il-pill">{machine ? t("Buy now") : t("Select options")}</Link>
        ) : (
          <button type="button" className={`il-pill${added ? " added" : ""}`} onClick={addNow} aria-live="polite">{added ? t("Added") : t("Add to cart")}</button>
        )}
      </div>
    </article>
  );
}

function Group({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="il-group">
      <button type="button" className="il-group-head" aria-expanded={open} onClick={() => setOpen(!open)}><span>{t(title)}</span><i aria-hidden="true">{open ? "–" : "+"}</i></button>
      {open && <div className="il-group-body">{children}</div>}
    </div>
  );
}

export default function Collection({ handle, search }) {
  const col = search != null ? { title: `Results for “${search}”`, intro: "", filter: (p) => `${p.name} ${p.title} ${p.tagline} ${Object.values(p.specs || {}).join(" ")}`.toLowerCase().includes(search.toLowerCase()) } : collections[handle];
  const [sort, setSort] = useState("Recommended");
  const [onlySale, setOnlySale] = useState(false);
  const [onlyStock, setOnlyStock] = useState(false);
  const [pick, setPick] = useState({ job: [], size: [], budget: [] });
  // "Largest piece" is one answer (tap again to clear); the other groups allow several
  const flip = (k, id) => setPick((s) => ({ ...s, [k]: s[k].includes(id) ? s[k].filter((x) => x !== id) : k === "size" ? [id] : [...s[k], id] }));
  const [filterOpen, setFilterOpen] = useState(false);
  const group = TREE.find(([, h, kids]) => h === handle || kids.some(([, k]) => k === handle)) || TREE[0];
  const list = useMemo(() => {
    if (!col) return [];
    let l = products.filter(col.filter);
    if (onlySale) l = l.filter((p) => p.compareAt);
    if (onlyStock) l = l.filter((p) => p.available);
    // within a group: any of the ticked options; across groups: all of them
    const any = (opts, ids) => (p) => !ids.length || opts.some(([id, , f]) => ids.includes(id) && f(p));
    l = l.filter(any(JOBS, pick.job)).filter(any(SIZES, pick.size)).filter(any(BUDGETS, pick.budget));
    return SORTS[sort] ? [...l].sort(SORTS[sort]) : l;
  }, [col, sort, onlySale, onlyStock, pick]);
  if (!col) return <div className="container section-pad"><h1>{t("Collection not found")}</h1><Link to="/">{t("Back to store")}</Link></div>;
  const reset = () => { setOnlySale(false); setOnlyStock(false); setPick({ job: [], size: [], budget: [] }); };
  const count = Number(onlySale) + Number(onlyStock) + pick.job.length + pick.size.length + pick.budget.length;
  const machinesHere = group[1] === "machines";
  const opts = (k, list) => list.map(([id, label]) => <label key={id}><input type="checkbox" checked={pick[k].includes(id)} onChange={() => flip(k, id)} /><span>{t(label)}</span></label>);
  const strip = [["All", group[1]], ...group[2]];
  return (
    <section className="il">
      <h1 className="il-sr">{t(col.title)}</h1>
      {handle === "deals" && !saleOn && <p className="il-ended" role="status">{t(col.intro)}</p>}
      <nav className="il-strip" aria-label={t("Categories")}>
        <div>
          {strip.map(([label, h]) => (
            <Link key={h} to={`/collections/${h}`} className={h === handle ? "on" : ""}>
              <span><img src={img(thumb(h), 200)} alt="" loading="lazy" /></span>
              <b>{t(label)}</b>
            </Link>
          ))}
        </div>
      </nav>
      <div className="il-body">
        <aside className={`il-filter${filterOpen ? " open" : ""}`}>
          <div className="il-filter-head">
            <h2>{t("Filter")}</h2><em>{count}</em>
            <button type="button" onClick={reset}>{t("Reset")}</button>
            <button type="button" className="icon-btn only-mobile" aria-label={t("Close filter")} onClick={() => setFilterOpen(false)}><Icon name="close" /></button>
          </div>
          {machinesHere && (
            <>
              <Group title={t("What you'll make")}>{opts("job", JOBS)}</Group>
              <Group title={t("Largest piece")}>{opts("size", SIZES)}</Group>
              <Group title={t("Budget")}>{opts("budget", BUDGETS)}</Group>
            </>
          )}
          <Group title={t("Offers")}>
            <label><input type="checkbox" checked={onlySale} onChange={(e) => setOnlySale(e.target.checked)} /><span>{t("Sale")}</span></label>
            <label><input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} /><span>{t("In stock")}</span></label>
          </Group>
          <Group title={t("Category")}>
            {TREE.map(([label, h]) => <Link key={h} to={`/collections/${h}`} className={h === group[1] ? "on" : ""}>{t(label)}</Link>)}
          </Group>
          <Group title={group[0]}>
            {group[2].map(([label, h]) => <Link key={h} to={`/collections/${h}`} className={h === handle ? "on" : ""}>{t(label)}</Link>)}
          </Group>
          <button type="button" className="il-pill only-mobile" onClick={() => setFilterOpen(false)}>{t("Show")} {list.length} {t("items")}</button>
        </aside>
        <div className="il-main">
          {machinesHere && (
            <button type="button" className="ih-finder il-finder" onClick={goToFinder}>
              <span className="ih-finder-ico"><Icon name="sparkle" size={22} /></span>
              <span className="ih-finder-text"><b>{t("Not sure which laser fits?")}</b><em>{t("Answer 4 quick questions about what you make, your space and your budget. We'll match you to a machine.")}</em></span>
              <span className="ih-btn dark sm">{t("Find my machine")}</span>
            </button>
          )}
          <div className="il-toolbar">
            <p>{list.length} {t("items found")}{search != null && ` for “${search}”`}{machinesHere && <Link to="/compare" className="il-compare">{t("Compare specs side by side")} →</Link>}</p>
            <button type="button" className="il-filter-open only-mobile" onClick={() => setFilterOpen(true)}><Icon name="filter" size={16} /> {t("Filter")}</button>
            <label><span>{t("Sort by:")}</span><select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.keys(SORTS).map((s) => <option key={s} value={s}>{t(s)}</option>)}</select></label>
          </div>
          {list.length ? <div className="il-grid">{list.map((p) => <Card key={p.handle} product={p} />)}</div> : <p className="il-empty">{t("No products match.")}</p>}
        </div>
      </div>
    </section>
  );
}
