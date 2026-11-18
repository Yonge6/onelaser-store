import { useEffect, useMemo, useState } from "react";
import { byHandle, go, img, machines, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { addOns, faq, promo } from "../data/site.js";
import { Icon, Link, QtyStepper, usd } from "../components/ui.jsx";
import stories from "../data/stories.json";
import Story from "../components/Story.jsx";

/* Buy area follows the Insta360 Store product page (store.insta360.com/product/x5, measured 2026-11-17 at 1440):
   full-bleed gray stage on the left (sticky) | 464px column: 32px title, option summary line, promo card, info card with icon rows,
   bordered option cards (72px image, selected card expands), "Frequently bought together" add-ons, gray order summary,
   shipping notes; fixed 80px bottom bar with name, 24px price and 56px pill buttons.
   The long story, specs and FAQ below are kept from the earlier version (Insta360 keeps those on its brand site).
   Earlier note — structure followed the Bambu Lab and ComMarker store product pages (studied 2026-11-16):
   breadcrumbs → sticky gallery with thumbnail row and trust icons | long buy column (title, red price + typical price + save pill,
   tagline, Product Features bullets, sale countdown bar, bundle cards, help rows, add-on accessories, quantity + buy, order info, payment)
   → sticky anchor nav → overview banner → Highlights at a Glance → feature stories → applications → Find Your Perfect machine
   → Technical Specifications → FAQ, with a fixed bottom buy bar. Sizes and type stay on the DJI scale used by the rest of the store.
   Reviews and "What's in the box" are omitted: 1laser.com has no data for them. */

function addOnsFor(product) {
  if (product.kind !== "machine") return [];
  return (addOns[product.family] || []).map((h) => byHandle[h]).filter((a) => a?.available);
}

/** Flatten the scraped story into DJI-style sections. */
function useStory(handle) {
  return useMemo(() => {
    const story = stories[handle];
    if (!story) return { highlights: [], cases: [], videos: [], specs: null, qa: [], bullets: null, blocks: [] };
    const cards = [];
    let cases = [];
    for (const b of story.blocks) {
      if (b.kind === "tabs" && /material/i.test(`${b.eyebrow} ${b.title}`)) cases = b.items.filter((i) => i.img);
      else if (b.kind === "tabs" || b.kind === "features") cards.push(b.items.filter((i) => i.img));
      else if (b.kind === "split" && b.image && b.intro) cards.push([{ title: b.title, text: b.intro, img: b.image }]);
    }
    // Round-robin across sections so the grid shows one headline feature per topic first.
    const highlights = [];
    for (let i = 0; highlights.length < 7 && cards.some((c) => c[i]); i++) cards.forEach((c) => c[i] && highlights.length < 7 && highlights.push(c[i]));
    if (!cases.length) cases = (story.blocks.find((b) => b.kind === "gallery")?.items || []).slice(0, 5).map((i) => ({ ...i, eyebrow: i.title, text: "" }));
    return {
      highlights, cases,
      videos: story.blocks.filter((b) => b.kind === "videos").flatMap((b) => b.videos).slice(0, 8),
      specs: story.blocks.find((b) => b.kind === "specs")?.groups || null,
      qa: story.blocks.find((b) => b.kind === "faq")?.qa || [],
      blocks: story.blocks.filter((b) => b.kind !== "specs" && b.kind !== "faq"),
      bullets: story.highlights.length >= 3 ? story.highlights.slice(0, 6) : null,
    };
  }, [handle]);
}

// eslint-disable-next-line no-unused-vars
function UseCases({ cases }) {
  const [i, setI] = useState(0);
  const c = cases[i] || cases[0];
  return (
    <>
      <div className="usecase-media"><img src={img(c.img, 1600)} alt={c.title} loading="lazy" /></div>
      <div className="usecase-tabs" role="tablist">
        {cases.map((x, n) => <button key={n} type="button" role="tab" aria-selected={n === i} className={n === i ? "on" : ""} onClick={() => setI(n)}>{x.eyebrow || x.title}</button>)}
      </div>
      {c.text && <p className="usecase-description">{c.text}</p>}
    </>
  );
}

const COMPARE_ROWS = ["Laser source", "Work area", "Max engraving speed", "Acceleration", "Positioning accuracy", "Max resolution"];
function compareSet(product) {
  const current = machines.filter((m) => m.series !== "legacy");
  const same = current.filter((m) => m.series === product.series && m.handle !== product.handle);
  const others = current.filter((m) => m.series !== product.series);
  const flagship = ["onelaser-xrf-desktop-laser-machine", "cobra-10-100w-co2-laser-engraver-cutter", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine"].map((h) => byHandle[h]).filter((m) => others.includes(m));
  return [product, ...[...same, ...flagship, ...others].filter((m, i, a) => a.indexOf(m) === i).slice(0, 2)];
}

export default function Product({ handle }) {
  const product = byHandle[handle];
  const { add } = useCart();
  const [variantId, setVariantId] = useState(null);
  const [photo, setPhoto] = useState(0);
  const [picked, setPicked] = useState({});
  const qty = 1;
  const [allSpecs, setAllSpecs] = useState(false);
  const [details, setDetails] = useState(null);
  const [active, setActive] = useState("overview");
  useEffect(() => {
    setVariantId(null); setPhoto(0); setPicked({}); setAllSpecs(false); setDetails(null); setActive("overview");
  }, [handle]);
  useEffect(() => {
    const spy = () => {
      const ids = ["overview", "highlights", "cases", "compare", "specs", "faq"];
      let current = "overview";
      for (const id of ids) {
        const el = document.getElementById(`pdp-${id}`);
        if (el && el.getBoundingClientRect().top < 200) current = id;
      }
      setActive(current);
    };
    window.addEventListener("scroll", spy, { passive: true });
    return () => window.removeEventListener("scroll", spy);
  }, [handle]);
  const options = useMemo(() => addOnsFor(product || {}), [product]);
  const story = useStory(handle);
  if (!product) return <div className="container section-pad"><h1>Product not found</h1><Link to="/">Back to store</Link></div>;

  const variant = product.variants.find((v) => v.id === variantId) || product.variants.find((v) => v.available) || product.variants[0];
  const gallery = variant.image && !product.images.includes(variant.image) ? [variant.image, ...product.images] : product.images;
  const pickVariant = (v) => {
    setVariantId(v.id);
    const at = gallery.indexOf(v.image);
    setPhoto(at >= 0 ? at : 0);
  };
  const addOnTotal = options.reduce((s, a) => s + (picked[a.handle] || 0) * a.price, 0);
  const total = variant.price * qty + addOnTotal;
  const saved = variant.compareAt ? (variant.compareAt - variant.price) * qty : 0;
  const commit = (thenCheckout) => {
    add(product.handle, variant.id, qty);
    options.forEach((a) => picked[a.handle] && add(a.handle, a.variants[0].id, picked[a.handle]));
    go(thenCheckout ? "/checkout" : "/cart");
  };
  const isMachine = product.kind === "machine";
  const many = product.variants.length > 6;
  const compare = isMachine ? compareSet(product) : [];
  const questions = [...story.qa, ...faq];
  const specGroups = story.specs || (product.specs ? [{ group: "Key specifications", rows: [["Best for", product.bestFor], ...Object.entries(product.specs)] }] : null);
  const bullets = story.bullets || (product.specs ? Object.entries(product.specs).slice(0, 6).map(([k, v]) => `${k}: ${v}`) : [product.tagline]);
  const hasGallery = story.blocks.some((b) => b.kind === "gallery");
  const glance = isMachine && product.specs ? Object.entries(product.specs).slice(0, 6) : [];
  const home = product.kind === "machine" ? ["machines", "Laser Machines"] : product.kind === "material" ? ["materials", "Materials"] : ["accessories", "Accessories"];
  const sections = [["overview", "Overview"], story.blocks.length && ["highlights", "Features"], hasGallery && ["cases", "Applications"], compare.length && ["compare", "Compare"], specGroups && ["specs", "Specs"], ["faq", "FAQ"]].filter(Boolean);
  const jump = (id) => {
    setActive(id);
    document.getElementById(`pdp-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const buttons = (
    <>
      <button type="button" className="buy" disabled={!variant.available} onClick={() => commit(false)}>{variant.available ? "Add to Cart" : "Sold Out"}</button>
      <button type="button" className="buy-now" disabled={!variant.available} onClick={() => commit(true)}>Buy Now</button>
    </>
  );

  return (
    <div className="pdp">
      <section className="ip">
        <div className="ip-stage">
          <div className="ip-stage-view">
            <img src={img(gallery[photo] || gallery[0], 1400)} alt={product.name} />
            {gallery.length > 1 && (
              <>
                <button type="button" className="ip-arrow prev" aria-label="Previous image" onClick={() => setPhoto((photo + gallery.length - 1) % gallery.length)}><Icon name="chevron" size={18} /></button>
                <button type="button" className="ip-arrow next" aria-label="Next image" onClick={() => setPhoto((photo + 1) % gallery.length)}><Icon name="chevron" size={18} /></button>
              </>
            )}
          </div>
          <div className="ip-thumbs">
            {gallery.slice(0, 9).map((src, i) => <button key={src} type="button" className={i === photo ? "on" : ""} onClick={() => setPhoto(i)} aria-label={`Image ${i + 1}`}><img src={img(src, 160)} alt="" loading="lazy" /></button>)}
          </div>
        </div>

        <div className="ip-col">
          <h1>{product.name}</h1>
          <p className="ip-sub">{[variant.title, isMachine ? product.seriesName : null, product.tagline].filter(Boolean).map((t) => <span key={t}>{t}</span>)}</p>

          {saved > 0 && (
            <Link to={promo.link} className="ip-promo">
              <span><img src={img(product.images[0], 240)} alt="" /></span>
              <span><b>Black Friday: save {usd(variant.compareAt - variant.price).replace(".00", "")}</b><em>Ends Cyber Monday, Nov 30. Price already applied.</em></span>
              <strong>See all deals</strong>
            </Link>
          )}

          <div className="ip-info">
            <div><Icon name="truck" size={20} /><ul><li>Delivery estimate and rate shown at checkout</li><li>30-day easy returns{isMachine && " | 3-2-1 warranty"}</li><li>U.S.-based support from laser engineers</li></ul></div>
            <div><Icon name="check" size={20} /><ul>{bullets.slice(0, 4).map((b) => <li key={b}>{b}</li>)}{product.fit && <li>Fits: {product.fit}</li>}</ul></div>
            <div><Icon name="card" size={20} /><ul><li>Financing available at checkout — <a href="https://www.1laser.com/pages/financing" target="_blank" rel="noreferrer">learn more</a></li></ul></div>
          </div>

          <div className="ip-label"><span>Select {product.optionName ? product.optionName.toLowerCase() : "option"}</span>{isMachine && <Link to="/compare">Compare machines</Link>}</div>
          {many ? (
            <select className="variant-select" value={variant.id} onChange={(e) => pickVariant(product.variants.find((v) => v.id === e.target.value))}>
              {product.variants.map((v) => <option key={v.id} value={v.id} disabled={!v.available}>{v.title} — {usd(v.price)}{v.available ? "" : " (sold out)"}</option>)}
            </select>
          ) : (
            <div className="ip-options">
              {product.variants.map((v) => (
                <button key={v.id} type="button" className={`ip-option${v.id === variant.id ? " on" : ""}`} disabled={!v.available} onClick={() => pickVariant(v)}>
                  {v.compareAt && <em>Save {usd(v.compareAt - v.price).replace(".00", "")}</em>}
                  <span className="ip-option-head">
                    <img src={img(v.image || product.images[0], 200)} alt="" />
                    <span><b>{v.title || product.name}{!v.available && " (Sold out)"}</b><i>{usd(v.price)}{v.compareAt && <s>{usd(v.compareAt)}</s>}</i></span>
                  </span>
                  {v.id === variant.id && <span className="ip-option-body"><span>{product.tagline}</span>{product.bestFor && <span>Best for: {product.bestFor}</span>}</span>}
                </button>
              ))}
            </div>
          )}

          {options.length > 0 && (
            <>
              <div className="ip-label"><span>Frequently bought together</span></div>
              <div className="ip-addons">
                {options.map((a) => (
                  <article key={a.handle} className={picked[a.handle] ? "on" : ""}>
                    <label><input type="checkbox" checked={!!picked[a.handle]} onChange={(e) => setPicked((s) => ({ ...s, [a.handle]: e.target.checked ? 1 : 0 }))} aria-label={`Add ${a.name}`} /></label>
                    <img src={img(a.images[0], 200)} alt="" loading="lazy" />
                    <div><h3>{a.name}</h3><p>{usd(a.price)}</p></div>
                    <QtyStepper value={picked[a.handle] || 0} onChange={(n) => setPicked((s) => ({ ...s, [a.handle]: n }))} />
                    <p className="ip-addon-text">{a.tagline} <Link to={`/products/${a.handle}`}>Learn more</Link></p>
                  </article>
                ))}
              </div>
            </>
          )}

          <div className="ip-summary">
            <h2>{product.name}</h2>
            <p>{variant.title || product.tagline}</p>
            {options.filter((a) => picked[a.handle]).map((a) => <p key={a.handle} className="ip-summary-line"><span>{a.name} × {picked[a.handle]}</span><span>{usd(a.price * picked[a.handle])}</span></p>)}
            <p className="ip-summary-total"><span>Total</span><b>{usd(total)}</b></p>
            {saved > 0 && <p className="ip-summary-save">You save {usd(saved)}</p>}
            <div className="buy-group">{buttons}</div>
          </div>

          <div className="ip-ship">
            <h2>Shipped by OneLaser</h2>
            <p><Icon name="truck" size={20} /><span><b>Delivery by address</b>Estimate and shipping rate are shown at checkout. See the <a href="https://www.1laser.com/pages/shipping-policy" target="_blank" rel="noreferrer">Shipping Policy</a>.</span></p>
            <p><Icon name="refresh" size={20} /><span><b>30-day return period</b>See the <a href="https://www.1laser.com/pages/refund-policy" target="_blank" rel="noreferrer">Refund Policy</a> for conditions.</span></p>
            <p><Icon name="lock" size={20} /><span><b>Pay your way</b>Card, PayPal, Shop Pay or financing.</span></p>
          </div>
        </div>
      </section>

      <nav className="anchor-nav" aria-label="Product sections">
        <div>{sections.map(([id, label]) => <button key={id} type="button" className={active === id ? "on" : ""} onClick={() => jump(id)}>{label}</button>)}</div>
      </nav>

      <section id="pdp-overview" className="pdp-overview">
        <img src={img(product.images[0], 1400)} alt="" loading="lazy" />
        <div>
          <p>{isMachine ? product.seriesName : "OneLaser Store"}</p>
          <h2>{product.name}</h2>
          <span>{product.tagline}</span>
        </div>
      </section>

      {glance.length > 0 && (
        <section className="pdp-glance">
          <h2>Highlights at a Glance</h2>
          <div className="glance">{glance.map(([k, v]) => <div key={k}><strong>{v}</strong><span>{k}</span></div>)}</div>
        </section>
      )}

      {story.blocks.length > 0 && <Story key={handle} blocks={story.blocks} firstId="pdp-highlights" galleryId="pdp-cases" />}

      {compare.length > 0 && (
        <section id="pdp-compare" className="pdp-section">
          <h2>Find Your Perfect Machine</h2>
          <div className="compare-scroll">
            <div className="compare-products">
              {compare.map((m) => (
                <article key={m.handle}>
                  <Link to={`/products/${m.handle}`} className="compare-media"><img src={img(m.images[0], 600)} alt="" loading="lazy" /></Link>
                  <h3>{m.name}</h3>
                  <p className="compare-subtitle">{m.tagline}</p>
                  <p className="compare-price">From USD {money(m.price)}</p>
                  <Link to={`/products/${m.handle}`} className="compare-btn">Buy Now</Link>
                </article>
              ))}
            </div>
            <div className="compare-specs">
              {COMPARE_ROWS.map((r) => (
                <div key={r} className="compare-row">{compare.map((m) => <div key={m.handle} className="compare-cell"><strong>{m.specs[r]}</strong><span>{r}</span></div>)}</div>
              ))}
            </div>
          </div>
        </section>
      )}

      {!isMachine && (
        <section className="pdp-section">
          <h2>Overview</h2>
          <p className="overview-text">{product.description}{product.description.length >= 1500 ? "…" : ""}</p>
        </section>
      )}

      {specGroups && (
        <section id="pdp-specs" className="pdp-section">
          <h2>Technical Specifications</h2>
          <div className={`spec-table${allSpecs ? " open" : ""}`}>
            {specGroups.map((g) => (
              <div key={g.group} className="spec-group"><h3>{g.group}</h3><dl>{g.rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl></div>
            ))}
          </div>
          {specGroups.length > 2 && <button type="button" className="spec-more" onClick={() => setAllSpecs(!allSpecs)}>{allSpecs ? "Show fewer specs" : "Show all specs"}</button>}
        </section>
      )}

      <section id="pdp-faq" className="pdp-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq">{questions.map(([q, a], n) => <details key={n}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </section>

      <div className="ip-bar">
        <div className="ip-bar-name"><strong>{product.name}</strong><span>{variant.title || product.tagline}</span></div>
        <div className="ip-bar-price"><b>{usd(total)}</b>{saved > 0 && <small>Save {usd(saved)}</small>}</div>
        <div className="ip-bar-btns">{buttons}</div>
      </div>
    </div>
  );
}
