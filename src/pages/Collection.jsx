import { useMemo, useState } from "react";
import { products } from "../lib.js";
import { collections } from "../data/site.js";
import { Icon, Link, ProductCard } from "../components/ui.jsx";

/* Structure follows the DJI Store collection page:
   breadcrumbs → centered title + intro → left filter (category tree, product filters, reset) → count + sort → card grid. */

const SORTS = {
  Recommendation: null,
  "Price: low to high": (a, b) => a.price - b.price,
  "Price: high to low": (a, b) => b.price - a.price,
  "Name: A–Z": (a, b) => a.name.localeCompare(b.name),
};
const TREE = [
  ["Laser Machines", "machines", [["XRF Series", "xrf-series"], ["Cobra Series", "cobra-series"], ["Hydra Gen2", "hydra-gen2"], ["VertiGo", "vertigo"], ["Previous Generation", "previous-generation"]]],
  ["Accessories", "accessories", [["Rotary Attachments", "rotary"], ["Fume Extractors", "fume"], ["Lens, Mirrors & Tubes", "optics"], ["Chillers", "cooling"], ["Expansion", "expansion"], ["Software & Training", "software"]]],
  ["Materials", "materials", [["Acrylic Sheets", "acrylic"], ["Leatherette", "leatherette"]]],
];

export default function Collection({ handle, search }) {
  const col = search != null ? { title: `Results for “${search}”`, intro: "", filter: (p) => `${p.name} ${p.title} ${p.tagline}`.toLowerCase().includes(search.toLowerCase()) } : collections[handle];
  const [sort, setSort] = useState("Recommendation");
  const [onlySale, setOnlySale] = useState(false);
  const [onlyStock, setOnlyStock] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const list = useMemo(() => {
    if (!col) return [];
    let l = products.filter(col.filter);
    if (onlySale) l = l.filter((p) => p.compareAt);
    if (onlyStock) l = l.filter((p) => p.available);
    return SORTS[sort] ? [...l].sort(SORTS[sort]) : l;
  }, [col, sort, onlySale, onlyStock]);
  if (!col) return <div className="wrap section"><h1 className="h1">Collection not found</h1><Link to="/" className="more">Back to store ›</Link></div>;
  const reset = () => { setOnlySale(false); setOnlyStock(false); };
  const openGroup = TREE.find(([, h, kids]) => h === handle || kids.some(([, k]) => k === handle))?.[1];
  return (
    <div className="wrap collection">
      <nav className="crumbs"><Link to="/">Home</Link> / <Link to="/collections/machines">Shop</Link> / <span>{col.title}</span></nav>
      <h1 className="h1 center">{col.title}</h1>
      {col.intro && <p className="lead center">{col.intro}</p>}
      <div className="col-layout">
        <aside className={`col-filter${filterOpen ? " open" : ""}`}>
          <div className="col-filter-head"><b>Filter</b><Link to="/collections/machines" className="more small">Shop All →</Link><button type="button" className="icon-btn only-mobile" aria-label="Close filter" onClick={() => setFilterOpen(false)}><Icon name="close" /></button></div>
          <p className="col-filter-title">Product Categories</p>
          {TREE.map(([label, h, kids]) => (
            <details key={h} open={h === openGroup || (!openGroup && h === "machines")}>
              <summary className={h === handle ? "on" : ""}>{label}</summary>
              <Link to={`/collections/${h}`} className={h === handle ? "on" : ""}>All {label}</Link>
              {kids.map(([l, k]) => <Link key={k} to={`/collections/${k}`} className={k === handle ? "on" : ""}>{l}</Link>)}
            </details>
          ))}
          <p className="col-filter-title">Offers & Availability</p>
          <Link to="/collections/deals" className={`col-deals${handle === "deals" ? " on" : ""}`}>Black Friday Deals</Link>
          <label className="check"><input type="checkbox" checked={onlySale} onChange={(e) => setOnlySale(e.target.checked)} /> On sale</label>
          <label className="check"><input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} /> In stock</label>
          <button type="button" className="btn btn-soft btn-sm" onClick={reset}>Reset</button>
          <button type="button" className="btn btn-red btn-block only-mobile" onClick={() => setFilterOpen(false)}>Show {list.length} items</button>
        </aside>
        <div>
          <div className="toolbar">
            <b>{list.length} Item(s) Found</b>
            <button type="button" className="btn btn-soft btn-sm only-mobile" onClick={() => setFilterOpen(true)}><Icon name="filter" size={16} /> Filter</button>
            <label className="sort">Sort by: <select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.keys(SORTS).map((s) => <option key={s}>{s}</option>)}</select></label>
          </div>
          {list.length ? (
            <div className="grid grid-3">{list.map((p) => <ProductCard key={p.handle} product={p} />)}</div>
          ) : (
            <p className="empty">No products match. <Link to="/collections/machines" className="more">Browse all machines ›</Link></p>
          )}
        </div>
      </div>
    </div>
  );
}
