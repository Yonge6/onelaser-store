import { useMemo, useState } from "react";
import { products } from "../lib.js";
import { collections } from "../data/site.js";
import { CollectionCard, Icon, Link } from "../components/ui.jsx";

/* Layout, sizes and type follow the DJI Store collection page (measured 2026-11-16):
   breadcrumb → centered intro → 272px sticky filter + 3-column grid (gap 24), count + sort toolbar. */

const SORTS = {
  Recommendation: null,
  "Price: Low to High": (a, b) => a.price - b.price,
  "Price: High to Low": (a, b) => b.price - a.price,
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
  const active = TREE.find(([, h, kids]) => h === handle || kids.some(([, k]) => k === handle))?.[1] || "machines";
  const [openGroup, setOpenGroup] = useState(active);
  const list = useMemo(() => {
    if (!col) return [];
    let l = products.filter(col.filter);
    if (onlySale) l = l.filter((p) => p.compareAt);
    if (onlyStock) l = l.filter((p) => p.available);
    return SORTS[sort] ? [...l].sort(SORTS[sort]) : l;
  }, [col, sort, onlySale, onlyStock]);
  if (!col) return <div className="container section-pad"><h1>Collection not found</h1><Link to="/">Back to store</Link></div>;
  const reset = () => { setOnlySale(false); setOnlyStock(false); };
  return (
    <section className="collection">
      <div className="collection-container">
        <nav className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to="/collections/machines">Shop</Link><span>/</span><b>{col.title}</b></nav>
        <header className="collection-intro"><h1>{col.title}</h1>{col.intro && <p>{col.intro}</p>}</header>
        <div className="collection-layout">
          <aside className={`filters${filterOpen ? " open" : ""}`}>
            <div className="filters-head"><h2>Filter</h2><Link to="/collections/machines">Shop All <Icon name="arrow" size={16} /></Link><button type="button" className="icon-btn only-mobile" aria-label="Close filter" onClick={() => setFilterOpen(false)}><Icon name="close" /></button></div>
            <nav className="category-nav">
              <h3>Product Categories</h3>
              <ul>
                {TREE.map(([label, h, kids]) => (
                  <li key={h}>
                    <div className={`category-row${h === handle ? " on" : ""}`}>
                      <Link to={`/collections/${h}`}>{label}</Link>
                      <button type="button" aria-label={`Toggle ${label}`} aria-expanded={openGroup === h} onClick={() => setOpenGroup(openGroup === h ? null : h)}><Icon name="chevron" size={16} /></button>
                    </div>
                    {openGroup === h && <ul>{kids.map(([l, k]) => <li key={k}><div className={`category-row${k === handle ? " on" : ""}`}><Link to={`/collections/${k}`}>{l}</Link></div></li>)}</ul>}
                  </li>
                ))}
              </ul>
            </nav>
            <fieldset className="filter-group">
              <legend>Offers</legend>
              <label><input type="checkbox" checked={onlySale} onChange={(e) => setOnlySale(e.target.checked)} /><span>On Sale</span></label>
              <label><input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} /><span>In Stock</span></label>
            </fieldset>
            <button type="button" className="filter-reset" onClick={reset}>Reset</button>
            <button type="button" className="btn-primary only-mobile" onClick={() => setFilterOpen(false)}>Show {list.length} items</button>
          </aside>
          <div>
            <div className="collection-toolbar">
              <p>{list.length} Item(s) Found</p>
              <button type="button" className="filter-open only-mobile" onClick={() => setFilterOpen(true)}><Icon name="filter" size={16} /> Filter</button>
              <label className="sort"><span>Sort by:</span><select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.keys(SORTS).map((s) => <option key={s}>{s}</option>)}</select></label>
            </div>
            {list.length ? <div className="collection-grid">{list.map((p) => <CollectionCard key={p.handle} product={p} />)}</div> : <p className="empty">No products match.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
