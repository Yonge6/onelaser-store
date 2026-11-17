import { useEffect, useMemo, useState } from "react";
import { byHandle, go, img, machines, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { addOns, faq } from "../data/site.js";
import { Icon, Link, Price, QtyStepper } from "../components/ui.jsx";
import stories from "../data/stories.json";

/* Structure follows the DJI Store product page:
   buy area → anchor nav → Take a Closer Look → Use Cases → Which is the Best for You → Specs → FAQ. */

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
      {c.text && <p className="usecase-text"><b>{c.title}</b> {c.text}</p>}
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
  const [active, setActive] = useState("highlights");
  useEffect(() => {
    setVariantId(null); setPhoto(0); setPicked({}); setActive("highlights");
  }, [handle]);
  const options = useMemo(() => addOnsFor(product || {}), [product]);
  const story = useStory(handle);
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
    add(product.handle, variant.id, 1);
    options.forEach((a) => picked[a.handle] && add(a.handle, a.variants[0].id, picked[a.handle]));
    go(thenCheckout ? "/checkout" : "/cart");
  };
  const isMachine = product.kind === "machine";
  const many = product.variants.length > 6;
  const parent = isMachine ? ["Laser Machines", "/collections/machines"] : product.kind === "material" ? ["Materials", "/collections/materials"] : ["Accessories", "/collections/accessories"];
  const compare = isMachine ? compareSet(product) : [];
  const questions = [...story.qa, ...faq];
  const sections = [
    story.highlights.length && ["highlights", "Highlights"], story.cases.length && ["cases", "Use Cases"], story.videos.length && ["videos", "Videos"],
    compare.length && ["compare", "Compare"], isMachine && ["specs", "Specs"], ["faq", "FAQs"],
  ].filter(Boolean);
  const jump = (id) => {
    setActive(id);
    document.getElementById(`pdp-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const buyButtons = (
    <div className="buy-buttons">
      <button type="button" className="btn btn-outline-dark" disabled={!variant.available} onClick={() => commit(false)}>{variant.available ? "Add to Cart" : "Sold out"}</button>
      <button type="button" className="btn btn-red" disabled={!variant.available} onClick={() => commit(true)}>Buy Now</button>
    </div>
  );

  return (
    <div className="pdp">
      <div className="wrap">
        <nav className="crumbs"><Link to="/">Home</Link> / <Link to={parent[1]}>{parent[0]}</Link> / <span>{product.name}</span></nav>
        <div className="pdp-top">
          <div className="gallery">
            <div className="gallery-main">
              {variant.compareAt && <span className="badge badge-sale">{money(variant.compareAt - variant.price)} OFF</span>}
              <img src={img(gallery[photo] || gallery[0], 1200)} alt={product.name} />
              <span className="gallery-count">{photo + 1}/{gallery.length}</span>
              {gallery.length > 1 && (
                <>
                  <button type="button" className="gallery-arrow prev" aria-label="Previous image" onClick={() => setPhoto((photo + gallery.length - 1) % gallery.length)}>‹</button>
                  <button type="button" className="gallery-arrow next" aria-label="Next image" onClick={() => setPhoto((photo + 1) % gallery.length)}>›</button>
                </>
              )}
            </div>
            <div className="thumbs">
              {gallery.map((src, i) => <button key={src} type="button" className={i === photo ? "on" : ""} onClick={() => setPhoto(i)} aria-label={`Image ${i + 1}`}><img src={img(src, 160)} alt="" loading="lazy" /></button>)}
            </div>
          </div>

          <div className="buybox">
            <h1>{product.name}</h1>
            <Price product={product} variant={variant} large />
            <div className="benefit-box">
              <div className="benefit-row"><Icon name="shield" size={20} /><div><b>30-Day Easy Returns</b><b>{isMachine ? "3-2-1 Warranty · U.S.-Based Support" : "U.S.-Based Support"}</b></div></div>
              <div className="benefit-row">
                <Icon name="check" size={20} />
                <ul>
                  {story.bullets
                    ? story.bullets.map((h) => <li key={h}>{h}</li>)
                    : product.specs
                      ? Object.entries(product.specs).slice(0, 6).map(([k, v]) => <li key={k}>{k}: {v}</li>)
                      : <li>{product.tagline}</li>}
                  {product.fit && <li>Fits: {product.fit}</li>}
                </ul>
              </div>
            </div>

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
                      <span className="row"><Price product={a} /><Link to={`/products/${a.handle}`} className="more small">Details</Link></span>
                    </div>
                    {picked[a.handle] ? (
                      <QtyStepper value={picked[a.handle]} onChange={(n) => setPicked((s) => ({ ...s, [a.handle]: n }))} />
                    ) : (
                      <button type="button" className="add-circle" aria-label={`Add ${a.name}`} onClick={() => setPicked((s) => ({ ...s, [a.handle]: 1 }))}>+</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="summary">
              {addOnTotal > 0 && <div className="row total"><span>Total</span><b>{money(total)}</b></div>}
              <p className="muted small"><Icon name="truck" size={16} /> Shipping and delivery estimate shown at checkout.</p>
              {buyButtons}
            </div>
          </div>
        </div>
      </div>

      <div className="pdp-tabs">
        <div className="wrap">
          {sections.map(([id, label]) => <button key={id} type="button" className={active === id ? "on" : ""} onClick={() => jump(id)}>{label}</button>)}
        </div>
      </div>

      <div className="wrap pdp-body">
        {story.highlights.length > 0 && (
          <section id="pdp-highlights" className="pdp-section">
            <h2 className="h2 center">Take a Closer Look</h2>
            <div className="closer-grid">
              {story.highlights.map((h, n) => (
                <article key={n} className="closer-card">
                  <img src={img(h.img, 1400)} alt="" loading="lazy" />
                  <div><h3>{h.title}</h3><p>{h.text}</p></div>
                </article>
              ))}
            </div>
          </section>
        )}

        {story.cases.length > 0 && (
          <section id="pdp-cases" className="pdp-section">
            <h2 className="h2 center">Made With {product.name.replace("™", "")}</h2>
            <UseCases key={handle} cases={story.cases} />
          </section>
        )}

        {story.videos.length > 0 && (
          <section id="pdp-videos" className="pdp-section">
            <h2 className="h2 center">Reviews & Owner Stories</h2>
            <div className="video-rail">
              {story.videos.map((v) => (
                <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" aria-label="Watch on YouTube">
                  <img src={img(v.img, 700)} alt="" loading="lazy" /><span className="play" aria-hidden="true">▶</span>
                </a>
              ))}
            </div>
          </section>
        )}

        {compare.length > 0 && (
          <section id="pdp-compare" className="pdp-section">
            <h2 className="h2 center">Which is the Best for You?</h2>
            <div className="best-scroll">
              <div className="best">
                {compare.map((m) => (
                  <div key={m.handle} className="best-col">
                    <Link to={`/products/${m.handle}`}><img src={img(m.images[0], 500)} alt="" loading="lazy" /></Link>
                    <h3>{m.name}</h3>
                    <p className="muted small">{m.tagline}</p>
                    <p className="best-price">From USD {money(m.price)}</p>
                    {m.handle === handle ? <span className="btn btn-sm btn-dark is-current">Viewing</span> : <Link to={`/products/${m.handle}`} className="btn btn-sm btn-outline-dark">Buy Now</Link>}
                    {COMPARE_ROWS.map((r) => <div key={r} className="best-stat"><b>{m.specs[r]}</b><span>{r}</span></div>)}
                  </div>
                ))}
              </div>
            </div>
            <Link to="/compare" className="more center-link">Compare all machines ›</Link>
          </section>
        )}

        {isMachine && (
          <section id="pdp-specs" className="pdp-section narrow">
            <h2 className="h2 center">Specs</h2>
            {story.specs ? (
              <div className="spec-groups">
                {story.specs.map((g) => (
                  <details key={g.group}>
                    <summary>{g.group}</summary>
                    <table className="spec-table"><tbody>{g.rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
                  </details>
                ))}
              </div>
            ) : (
              <table className="spec-table"><tbody>
                <tr><th>Best for</th><td>{product.bestFor}</td></tr>
                {Object.entries(product.specs).map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}
              </tbody></table>
            )}
          </section>
        )}

        {!isMachine && (
          <section className="pdp-section narrow">
            <h2 className="h2 center">Overview</h2>
            <p className="pdp-desc">{product.description}{product.description.length >= 1500 ? "…" : ""}</p>
          </section>
        )}

        <section id="pdp-faq" className="pdp-section narrow">
          <h2 className="h2 center">Let's Answer Your Questions</h2>
          {questions.map(([q, a]) => <details key={q} className="faq"><summary>{q}</summary><p>{a}</p></details>)}
        </section>
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
