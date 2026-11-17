import { useMemo, useState } from "react";
import { products } from "../lib.js";
import { collections } from "../data/site.js";
import { Icon, Link, ProductCard } from "../components/ui.jsx";

const SORTS = {
  Featured: null,
  "Price: low to high": (a, b) => a.price - b.price,
  "Price: high to low": (a, b) => b.price - a.price,
  "Name: A–Z": (a, b) => a.name.localeCompare(b.name),
};
const MACHINE_SUBS = [["All", "machines"], ["XRF", "xrf-series"], ["Cobra", "cobra-series"], ["Hydra Gen2", "hydra-gen2"], ["VertiGo", "vertigo"], ["Previous gen", "previous-generation"]];
const ACCESSORY_SUBS = [["All", "accessories"], ["Rotary", "rotary"], ["Fume extractors", "fume"], ["Lens, mirrors & tubes", "optics"], ["Chillers", "cooling"], ["Expansion", "expansion"], ["Software & training", "software"]];
const MATERIAL_SUBS = [["All", "materials"], ["Acrylic", "acrylic"], ["Leatherette", "leatherette"]];
const subsFor = (handle) => [MACHINE_SUBS, ACCESSORY_SUBS, MATERIAL_SUBS].find((s) => s.some(([, h]) => h === handle));

export default function Collection({ handle, search }) {
  const col = search != null ? { title: `Results for “${search}”`, intro: "", filter: (p) => `${p.name} ${p.title} ${p.tagline}`.toLowerCase().includes(search.toLowerCase()) } : collections[handle];
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("Featured");
  const [onlySale, setOnlySale] = useState(false);
  const [onlyStock, setOnlyStock] = useState(false);
  const list = useMemo(() => {
    if (!col) return [];
    let l = products.filter(col.filter);
    if (q) l = l.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
    if (onlySale) l = l.filter((p) => p.compareAt);
    if (onlyStock) l = l.filter((p) => p.available);
    return SORTS[sort] ? [...l].sort(SORTS[sort]) : l;
  }, [col, q, sort, onlySale, onlyStock]);
  if (!col) return <div className="wrap section"><h1 className="h1">Collection not found</h1><Link to="/" className="more">Back to store ›</Link></div>;
  const subs = subsFor(handle);
  const isMachines = MACHINE_SUBS.some(([, h]) => h === handle);
  return (
    <div className="wrap collection">
      <nav className="crumbs"><Link to="/">Store</Link> / <span>{col.title}</span></nav>
      <h1 className="h1 center">{col.title}</h1>
      {col.intro && <p className="lead center">{col.intro}</p>}
      {isMachines && (
        <div className="choose-banner">
          <div><b>Which laser is right for me?</b><span>Compare power, work area and speed side by side.</span></div>
          <Link to="/compare" className="more">Help me choose ›</Link>
        </div>
      )}
      {subs && (
        <div className="tabs tabs-center">{subs.map(([label, h]) => <Link key={h} to={`/collections/${h}`} className={h === handle ? "on" : ""}>{label}</Link>)}</div>
      )}
      <label className="col-search"><Icon name="search" size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search for products in this collection" /></label>
      <div className="toolbar">
        <div className="toolbar-left">
          <span className="filter-label"><Icon name="filter" size={16} /> Filter</span>
          <label className="check"><input type="checkbox" checked={onlySale} onChange={(e) => setOnlySale(e.target.checked)} /> On sale</label>
          <label className="check"><input type="checkbox" checked={onlyStock} onChange={(e) => setOnlyStock(e.target.checked)} /> In stock</label>
          <b>{list.length} items</b>
        </div>
        <label className="sort">Sort by <select value={sort} onChange={(e) => setSort(e.target.value)}>{Object.keys(SORTS).map((s) => <option key={s}>{s}</option>)}</select></label>
      </div>
      {list.length ? (
        <div className="grid grid-4">{list.map((p) => <ProductCard key={p.handle} product={p} compact={p.kind !== "machine"} />)}</div>
      ) : (
        <p className="empty">No products match. <Link to="/collections/machines" className="more">Browse all machines ›</Link></p>
      )}
    </div>
  );
}
