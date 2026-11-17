import { useEffect, useMemo, useState } from "react";
import { accessories, byHandle, go, img, machines, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { addOns, faq } from "../data/site.js";
import { Icon, Link, Price, ProductCard, QtyStepper } from "../components/ui.jsx";

function addOnsFor(product) {
  if (product.kind !== "machine") return [];
  return (addOns[product.family] || []).map((h) => byHandle[h]).filter((a) => a?.available);
}

export default function Product({ handle }) {
  const product = byHandle[handle];
  const { add } = useCart();
  const [variantId, setVariantId] = useState(null);
  const [photo, setPhoto] = useState(0);
  const [picked, setAddOns] = useState({});
  const [tab, setTab] = useState("overview");
  useEffect(() => {
    setVariantId(null); setPhoto(0); setAddOns({}); setTab("overview");
  }, [handle]);
  const options = useMemo(() => addOnsFor(product || {}), [product]);
  if (!product) return <div className="wrap section"><h1 className="h1">Product not found</h1><Link to="/" className="more">Back to store ›</Link></div>;

  const variant = product.variants.find((v) => v.id === variantId) || product.variants.find((v) => v.available) || product.variants[0];
  const gallery = variant.image && !product.images.includes(variant.image) ? [variant.image, ...product.images] : product.images;
  const pickVariant = (v) => {
    setVariantId(v.id);
    const at = gallery.indexOf(v.image);
    setPhoto(at >= 0 ? at : 0);
  };
  const addOnTotal = options.reduce((s, a) => s + (picked[a.handle] || 0) * a.price, 0);
  const total = variant.price + addOnTotal;
  const commit = (thenCheckout) => {
    add(product.handle, variant.id, 1, { open: !thenCheckout });
    options.forEach((a) => picked[a.handle] && add(a.handle, a.variants[0].id, picked[a.handle], { open: false }));
    if (thenCheckout) go("/checkout");
  };
  const isMachine = product.kind === "machine";
  const many = product.variants.length > 6;
  const related = isMachine ? machines.filter((m) => m.series === product.series && m.handle !== handle).concat(machines.filter((m) => m.series !== product.series && m.series !== "legacy")).slice(0, 4) : accessories.filter((a) => a.category === product.category && a.handle !== handle).slice(0, 4);
  const sections = [["overview", "Overview"], ...(isMachine ? [["specs", "Specs"]] : []), ["faq", "FAQ"]];
  const buyButtons = (
    <div className="buy-buttons">
      <button type="button" className="btn btn-dark" disabled={!variant.available} onClick={() => commit(false)}>{variant.available ? "Add to Cart" : "Sold out"}</button>
      <button type="button" className="btn btn-red" disabled={!variant.available} onClick={() => commit(true)}>Buy Now</button>
    </div>
  );

  return (
    <div className="pdp">
      <div className="wrap">
        <nav className="crumbs"><Link to="/">Store</Link> / <Link to={isMachine ? "/collections/machines" : product.kind === "material" ? "/collections/materials" : "/collections/accessories"}>{isMachine ? "Laser Machines" : product.kind === "material" ? "Materials" : "Accessories"}</Link> / <span>{product.name}</span></nav>
        <div className="pdp-top">
          <div className="gallery">
            <div className="gallery-main">
              {variant.compareAt && <span className="badge badge-sale">{money(variant.compareAt - variant.price)} OFF</span>}
              <img src={img(gallery[photo] || gallery[0], 1200)} alt={product.name} />
              <span className="gallery-count">{photo + 1} / {gallery.length}</span>
            </div>
            <div className="thumbs">
              {gallery.map((src, i) => <button key={src} type="button" className={i === photo ? "on" : ""} onClick={() => setPhoto(i)} aria-label={`Image ${i + 1}`}><img src={img(src, 160)} alt="" loading="lazy" /></button>)}
            </div>
          </div>

          <div className="buybox">
            {isMachine && <p className="kicker">{product.seriesName}</p>}
            <h1>{product.name}</h1>
            <p className="pdp-tagline">{product.tagline}</p>
            <Price product={product} variant={variant} large />
            {variant.compareAt && <p className="save-note">Saving {money(variant.compareAt - variant.price)}</p>}
            <ul className="perks">
              <li><Icon name="refresh" size={18} /> 30-Day Easy Returns</li>
              <li><Icon name="shield" size={18} /> {isMachine ? "3-2-1 Warranty" : "Official OneLaser accessory"}</li>
              <li><Icon name="headset" size={18} /> U.S.-Based Support</li>
            </ul>
            {product.chips && <ul className="feature-list">{Object.entries(product.specs).slice(0, 6).map(([k, v]) => <li key={k}><b>{k}:</b> {v}</li>)}</ul>}
            {product.fit && <p className="fit">Fits: {product.fit}</p>}

            {product.variants.length > 1 && (
              <div className="option-group">
                <h2>Select {product.optionName || "Option"}</h2>
                {many ? (
                  <select className="select" value={variant.id} onChange={(e) => pickVariant(product.variants.find((v) => v.id === e.target.value))}>
                    {product.variants.map((v) => <option key={v.id} value={v.id} disabled={!v.available}>{v.title} — {money(v.price)}{v.available ? "" : " (sold out)"}</option>)}
                  </select>
                ) : (
                  product.variants.map((v) => (
                    <button key={v.id} type="button" className={`option${v.id === variant.id ? " on" : ""}`} disabled={!v.available} onClick={() => pickVariant(v)}>
                      <span><b>{v.title}</b>{!v.available && <em>Sold out</em>}</span>
                      <Price product={product} variant={v} />
                    </button>
                  ))
                )}
              </div>
            )}

            {options.length > 0 && (
              <div className="option-group">
                <h2>Don't Miss Top Accessories</h2>
                {options.map((a) => (
                  <div key={a.handle} className={`addon${picked[a.handle] ? " on" : ""}`}>
                    <img src={img(a.images[0], 160)} alt="" loading="lazy" />
                    <div>
                      <b>{a.name}</b>
                      <span className="muted small">{a.tagline}</span>
                      <span className="row"><Price product={a} /><Link to={`/products/${a.handle}`} className="more small">Details</Link></span>
                    </div>
                    {picked[a.handle] ? (
                      <QtyStepper value={picked[a.handle]} onChange={(n) => setAddOns((s) => ({ ...s, [a.handle]: n }))} />
                    ) : (
                      <button type="button" className="add-circle" aria-label={`Add ${a.name}`} onClick={() => setAddOns((s) => ({ ...s, [a.handle]: 1 }))}>+</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="summary">
              <div className="row"><span>Selected</span><b>{product.name}{variant.title ? ` · ${variant.title}` : ""}</b></div>
              {addOnTotal > 0 && <div className="row"><span>Accessories</span><b>{money(addOnTotal)}</b></div>}
              <div className="row total"><span>Total</span><b>{money(total)}</b></div>
              <p className="muted small"><Icon name="truck" size={16} /> Shipping and delivery estimate shown at checkout.</p>
              {buyButtons}
            </div>
          </div>
        </div>
      </div>

      <div className="pdp-tabs">
        <div className="wrap">
          {sections.map(([id, label]) => <button key={id} type="button" className={tab === id ? "on" : ""} onClick={() => { setTab(id); document.getElementById(`pdp-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>{label}</button>)}
        </div>
      </div>

      <div className="wrap pdp-body">
        <section id="pdp-overview" className="pdp-section">
          <h2 className="h2">{isMachine ? "Take a Closer Look" : "Overview"}</h2>
          {isMachine && (
            <div className="closer">
              {Object.entries(product.specs).slice(0, 6).map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}
            </div>
          )}
          <p className="pdp-desc">{product.description}{product.description.length >= 1500 ? "…" : ""}</p>
          <div className="pdp-photos">{product.images.slice(1, 5).map((src) => <img key={src} src={img(src, 900)} alt="" loading="lazy" />)}</div>
          <Link href={product.sourceUrl} className="more">See the full product story on 1laser.com ›</Link>
        </section>

        {isMachine && (
          <section id="pdp-specs" className="pdp-section">
            <h2 className="h2">Specs</h2>
            <table className="spec-table"><tbody>
              <tr><th>Best for</th><td>{product.bestFor}</td></tr>
              {Object.entries(product.specs).map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
            </tbody></table>
            <Link to="/compare" className="more">Compare all machines ›</Link>
          </section>
        )}

        <section id="pdp-faq" className="pdp-section">
          <h2 className="h2">FAQ</h2>
          {faq.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
        </section>

        {related.length > 0 && (
          <section className="pdp-section">
            <h2 className="h2">You may also like</h2>
            <div className="grid grid-4">{related.map((p) => <ProductCard key={p.handle} product={p} compact />)}</div>
          </section>
        )}
      </div>

      <div className="sticky-buy">
        <div className="wrap">
          <div><b>{product.name}</b><Price product={product} variant={{ ...variant, price: total, compareAt: addOnTotal ? null : variant.compareAt }} /></div>
          {buyButtons}
        </div>
      </div>
    </div>
  );
}
