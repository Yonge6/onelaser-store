import { useEffect, useMemo, useState } from "react";
import { byHandle, go, img, machines, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { addOns, faq, promo } from "../data/site.js";
import { Countdown, Icon, Link, QtyStepper, usd } from "../components/ui.jsx";
import stories from "../data/stories.json";

/* Structure follows the Bambu Lab and ComMarker store product pages (studied 2026-11-16):
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
    if (!story) return { highlights: [], cases: [], videos: [], specs: null, qa: [], bullets: null };
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
    const promise = story.blocks.find((b) => b.kind === "promise")?.items.map((i) => [i.title, i.text]) || [];
    return {
      highlights, cases,
      videos: story.blocks.filter((b) => b.kind === "videos").flatMap((b) => b.videos).slice(0, 8),
      specs: story.blocks.find((b) => b.kind === "specs")?.groups || null,
      qa: [...promise, ...(story.blocks.find((b) => b.kind === "faq")?.qa || [])],
      bullets: story.highlights.length >= 3 ? story.highlights.slice(0, 6) : null,
    };
  }, [handle]);
}

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
  const [qty, setQty] = useState(1);
  const [allSpecs, setAllSpecs] = useState(false);
  const [details, setDetails] = useState(null);
  const [active, setActive] = useState("overview");
  useEffect(() => {
    setVariantId(null); setPhoto(0); setPicked({}); setQty(1); setAllSpecs(false); setDetails(null); setActive("overview");
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
  const features = story.highlights;
  const glance = isMachine && product.specs ? Object.entries(product.specs).slice(0, 6) : [];
  const home = product.kind === "machine" ? ["machines", "Laser Machines"] : product.kind === "material" ? ["materials", "Materials"] : ["accessories", "Accessories"];
  const sections = [["overview", "Overview"], features.length && ["highlights", "Features"], story.cases.length && ["cases", "Applications"], compare.length && ["compare", "Compare"], specGroups && ["specs", "Specs"], ["faq", "FAQ"]].filter(Boolean);
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
  const onSale = !!variant.compareAt && new Date(promo.endsAt) > new Date();

  return (
    <div className="pdp">
      <section className="pdp-main">
        <nav className="pdp-crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link><span>›</span><Link to={`/collections/${home[0]}`}>{home[1]}</Link><span>›</span><b>{product.name}</b>
        </nav>
        <div className="pdp-hero">
          <div className="gallery">
            <div className="gallery-stage">
              <img src={img(gallery[photo] || gallery[0], 1200)} alt={product.name} />
              {saved > 0 && <span className="gallery-flag"><small>Save</small>{usd(variant.compareAt - variant.price).replace(".00", "")}</span>}
              <span className="gallery-count">{photo + 1}/{gallery.length}</span>
              {gallery.length > 1 && (
                <>
                  <button type="button" className="gallery-arrow prev" aria-label="Previous image" onClick={() => setPhoto((photo + gallery.length - 1) % gallery.length)}>‹</button>
                  <button type="button" className="gallery-arrow next" aria-label="Next image" onClick={() => setPhoto((photo + 1) % gallery.length)}>›</button>
                </>
              )}
            </div>
            <div className="gallery-thumbs">
              {gallery.map((src, i) => <button key={src} type="button" className={i === photo ? "on" : ""} onClick={() => setPhoto(i)} aria-label={`Image ${i + 1}`}><img src={img(src, 160)} alt="" loading="lazy" /></button>)}
            </div>
            <ul className="pdp-trust">
              <li><Icon name="refresh" size={26} />30-Day Easy Returns</li>
              <li><Icon name="shield" size={26} />{isMachine ? "3-2-1 Warranty" : "Official Accessory"}</li>
              <li><Icon name="headset" size={26} />U.S.-Based Support</li>
              <li><Icon name="lock" size={26} />Secure Checkout</li>
            </ul>
          </div>

          <div className="info">
            <h1>{product.name}</h1>
            <p className="pdp-price">
              <strong>{usd(variant.price)} USD</strong>
              {variant.compareAt && <><s>{usd(variant.compareAt)} USD</s><em>Save {usd(variant.compareAt - variant.price).replace(".00", "")}</em></>}
            </p>
            <p className="pdp-tagline">{product.tagline}</p>

            <div className="pdp-features">
              <h2>Product Features</h2>
              <ul>{bullets.map((b) => <li key={b}>{b}</li>)}{product.fit && <li>Fits: {product.fit}</li>}</ul>
            </div>

            {onSale && (
              <Link to={promo.link} className="pdp-sale">
                <img src={img(product.images[0], 160)} alt="" />
                <span><b>Black Friday:</b> save {usd(variant.compareAt - variant.price).replace(".00", "")} on {product.name}. Ends Cyber Monday.</span>
                <Countdown endsAt={promo.endsAt} />
              </Link>
            )}

            <div className="variants">
              <p className="legend">{product.optionName || (isMachine ? "Package" : "Option")}</p>
              {many ? (
                <select className="variant-select" value={variant.id} onChange={(e) => pickVariant(product.variants.find((v) => v.id === e.target.value))}>
                  {product.variants.map((v) => <option key={v.id} value={v.id} disabled={!v.available}>{v.title} — {usd(v.price)} USD{v.available ? "" : " (sold out)"}</option>)}
                </select>
              ) : (
                product.variants.map((v) => (
                  <button key={v.id} type="button" className={`variant-card${v.id === variant.id ? " on" : ""}`} disabled={!v.available} onClick={() => pickVariant(v)}>
                    <span className="variant-heading">
                      <span className="variant-media"><img src={img(v.image || product.images[0], 200)} alt="" /></span>
                      <span className="variant-name">{v.title || product.name}{!v.available && " (Sold out)"}</span>
                      <span className="variant-price"><b>{usd(v.price)} USD</b>{v.compareAt && <><s>{usd(v.compareAt)} USD</s><em>Saved {usd(v.compareAt - v.price).replace(".00", "")}</em></>}</span>
                    </span>
                  </button>
                ))
              )}
              {isMachine && (
                <>
                  <Link to="/compare" className="help-row"><span>Not sure what to choose? Compare machines side by side.</span><Icon name="arrow" size={16} /></Link>
                  <a href="https://www.1laser.com/pages/sales-consultation" target="_blank" rel="noreferrer" className="help-row"><span>Need more help? Talk to a OneLaser specialist.</span><Icon name="headset" size={16} /></a>
                </>
              )}
            </div>

            {options.length > 0 && (
              <section className="accessories">
                <h2>Performance Accessories</h2>
                <p className="accessories-sub">Add what this machine needs on day one. Ticked items go into the cart with it.</p>
                <div className="accessory-list">
                  {options.map((a) => (
                    <article key={a.handle} className="accessory-pick">
                      <label className="accessory-check"><input type="checkbox" checked={!!picked[a.handle]} onChange={(e) => setPicked((s) => ({ ...s, [a.handle]: e.target.checked ? 1 : 0 }))} aria-label={`Add ${a.name}`} /></label>
                      <div className="accessory-image"><img src={img(a.images[0], 240)} alt="" loading="lazy" /></div>
                      <div className="accessory-content">
                        <h3>{a.name}</h3>
                        <p className="accessory-price">{usd(a.price)} USD{a.compareAt && <s>{usd(a.compareAt)} USD</s>}</p>
                        <QtyStepper value={picked[a.handle] || 0} onChange={(n) => setPicked((s) => ({ ...s, [a.handle]: n }))} />
                        <p className="accessory-description">{a.tagline}</p>
                        <button type="button" className="accessory-details" aria-expanded={details === a.handle} onClick={() => setDetails(details === a.handle ? null : a.handle)}><span>Details</span><span aria-hidden="true">{details === a.handle ? "−" : "+"}</span></button>
                        {details === a.handle && <p className="accessory-more">{a.description.slice(0, 420)}… <Link to={`/products/${a.handle}`}>View product</Link></p>}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className="pdp-qty"><span>Quantity</span><QtyStepper value={qty} min={1} onChange={setQty} /></div>
            <div className="buy-group">{buttons}</div>

            <div className="pdp-order">
              <h2>Order Info</h2>
              <ul>
                <li>Delivery estimate and shipping rate are shown at checkout once you enter your address.</li>
                <li>See the <a href="https://www.1laser.com/pages/shipping-policy" target="_blank" rel="noreferrer">Shipping Policy</a> for details.</li>
              </ul>
              <h2>Payment</h2>
              <p className="pdp-pay">{["VISA", "Mastercard", "AMEX", "PayPal", "Shop Pay", "Financing"].map((m) => <em key={m}>{m}</em>)}</p>
            </div>
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
        <section className="pdp-section">
          <h2>Highlights at a Glance</h2>
          <div className="glance">{glance.map(([k, v]) => <div key={k}><strong>{v}</strong><span>{k}</span></div>)}</div>
        </section>
      )}

      {features.length > 0 && (
        <section id="pdp-highlights" className="pdp-section">
          <h2>Explore {product.name.replace("™", "")}</h2>
          <div className="stories">
            {features.map((h, n) => (
              <article key={n} className="story">
                <img src={img(h.img, 1400)} alt="" loading="lazy" />
                <div><h3>{h.title}</h3><p>{h.text}</p></div>
              </article>
            ))}
          </div>
        </section>
      )}

      {story.cases.length > 0 && (
        <section id="pdp-cases" className="pdp-section">
          <h2>Endless Possibilities With {product.name.replace("™", "")}</h2>
          <UseCases key={handle} cases={story.cases} />
        </section>
      )}

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

      <div className="sticky-bar">
        <div className="sticky-delivery"><strong>{product.name}</strong><span>{variant.title || product.tagline}</span></div>
        <div className="sticky-purchase">
          <span className="sticky-price"><b>{usd(total)} USD</b>{saved > 0 && <small>Saving {usd(saved)} USD</small>}</span>
          <div className="sticky-actions">{buttons}</div>
        </div>
      </div>
    </div>
  );
}
