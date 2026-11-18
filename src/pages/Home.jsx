import { useEffect, useState } from "react";
import { useCart } from "../cart.jsx";
import { t } from "../i18n.js";
import { asset, byHandle, img, money, products } from "../lib.js";
import { heroSlides, homeFaq, homeProof, homeReviews, homeStandard, homeTabs, homeVideos, newHandles, promo, shortSlogans } from "../data/site.js";
import { Countdown, Icon, Link } from "../components/ui.jsx";
import FinderCard, { FinderHelp } from "../components/Finder.jsx";

/* Module order, sizes and type follow the insta360.com homepage (measured 2026-11-17 at 1440 and 375):
   full-bleed hero 660 with segmented progress → headline + sticky pill tabs + 3-column product cards (416×554, radius 24)
   → feature banner 480 → Shop by interest (310×480 tiles) → two half cards 640×480 → image banner 480
   → story carousel (864×486) → business band 376 → four support tiles 240. 64px gutters, 64px between blocks.
   Typeface is Poppins, as on Insta360. Only the brand red is OneLaser's own (Insta360 uses yellow). */

const SLIDE_MS = 10000;

/* Insta360's hero has "Buy now" + "Learn more", both leading to the same page. Here the second button does something else:
   a product slide adds that product to the cart (first available option, stays on the page); a series slide opens the comparison. */
function HeroButtons({ s, tab }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const product = s.to.startsWith("/products/") ? byHandle[s.to.slice(10)] : null;
  const variant = product && (product.variants.find((v) => v.available) || product.variants[0]);
  const addNow = () => {
    add(product.handle, variant.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <div className="ih-btns">
      <Link to={s.to} className="ih-btn light" tabIndex={tab}>{product ? t("Buy now") : t("Shop now")}</Link>
      {product && product.available ? (
        <button type="button" className={`ih-btn ghost${added ? " added" : ""}`} tabIndex={tab} onClick={addNow} aria-live="polite">
          <Icon name={added ? "check" : "cart"} size={18} />{added ? t("Added") : t("Add to cart")}
        </button>
      ) : (
        <Link to="/compare" className="ih-btn ghost" tabIndex={tab}>{t("Compare models")}</Link>
      )}
    </div>
  );
}

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setI((n) => (n + 1) % heroSlides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, paused]);
  return (
    <section className="ih-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      {heroSlides.map((s, n) => (
        <article key={s.title} className={`ih-slide${n === i ? " on" : ""}`} aria-hidden={n !== i}>
          <img src={asset(s.image)} alt="" />
          <div className="ih-slide-copy">
            <p className="ih-top">{t(s.eyebrow)}</p>
            <h1>{t(s.title)}</h1>
            <p className="ih-slogan">{t(s.text)}</p>
            <HeroButtons s={s} tab={n === i ? 0 : -1} />
          </div>
        </article>
      ))}
      <button type="button" className="ih-hero-arrow prev" aria-label={t("Previous slide")} onClick={() => setI((i + heroSlides.length - 1) % heroSlides.length)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16 5L9 12L16 19" stroke="white" strokeWidth="2.5" strokeLinejoin="round" /></svg>
      </button>
      <button type="button" className="ih-hero-arrow next" aria-label={t("Next slide")} onClick={() => setI((i + 1) % heroSlides.length)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5L15 12L8 19" stroke="white" strokeWidth="2.5" strokeLinejoin="round" /></svg>
      </button>
      <div className="ih-pages">
        {heroSlides.map((s, n) => (
          <button key={s.title} type="button" aria-label={`Slide ${n + 1}: ${s.title}`} className={n === i ? "on" : ""} onClick={() => setI(n)}>
            <em>{t(s.title)}</em>
            <i><span style={n === i ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined} /></i>
          </button>
        ))}
      </div>
    </section>
  );
}

/* Insta360's card has "Learn more" + "Buy now", both leading to the product page. Here the left control adds to the cart instead:
   it adds the first available option (the one the product page preselects), stays on the page and confirms for a moment. */
// Monthly figure = price ÷ 24, the same "24-month payment" 1laser.com shows on its product pages ($4,399 → $183.29/mo.).
// It is an illustration, not an offer: the real rate and term depend on the lender's approval.
const FINANCE_MONTHS = 24;

function HomeCard({ p }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const variant = p.variants.find((v) => v.available) || p.variants[0];
  const addNow = () => {
    add(p.handle, variant.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  return (
    <article className="ih-card">
      <div className="ih-card-info">
        {newHandles.includes(p.handle) && <span className="ih-new">{t("NEW")}</span>}
        <h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3>
        <p>{t(shortSlogans[p.handle] || p.tagline)}</p>
      </div>
      <Link to={`/products/${p.handle}`} className="ih-card-media" tabIndex={-1} aria-hidden="true"><img src={img(p.images[0], 700)} alt="" loading="lazy" /></Link>
      <p className="ih-card-price">
        {p.priceVaries && <span>{t("From")}</span>}
        <b>{money(p.price)}</b>
        {p.compareAt > p.price && <s>{money(p.compareAt)}</s>}
        {p.compareAt > p.price && <em>{t("Save")} {money(p.compareAt - p.price)}</em>}
      </p>
      {p.kind === "machine" && (
        <p className="ih-card-monthly">{t("or")} <b>${(p.price / FINANCE_MONTHS).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>{t("/mo for 24 months")}</p>
      )}
      <div className="ih-card-btns">
        <button type="button" className={`ih-btn line sm${added ? " added" : ""}`} disabled={!p.available} onClick={addNow} aria-live="polite">
          {added ? <><Icon name="check" size={16} />{t("Added")}</> : !p.available ? t("Sold Out") : <><Icon name="cart" size={16} />{t("Add to cart")}</>}
        </button>
        <Link to={`/products/${p.handle}`} className="ih-btn dark sm">{t("Buy now")}</Link>
      </div>
    </article>
  );
}

function ProductBlock() {
  const [ti, setTi] = useState(0);
  const tab = homeTabs[ti];
  const list = (tab.picks ? tab.picks.map((h) => byHandle[h]) : products.filter((p) => p.category === tab.collection || (tab.collection === "materials" && p.kind === "material"))).filter(Boolean).slice(0, 6);
  return (
    <section className="ih-products">
      <div className="ih-wrap"><h2 className="ih-h2 narrow">{t("Laser machines for makers and growing businesses.")}</h2></div>
      <div className="ih-sticky">
        <div className="ih-wrap">
          <div className="ih-tabs" role="tablist">
            {homeTabs.map((x, n) => <button key={x.label} type="button" role="tab" aria-selected={n === ti} className={n === ti ? "on" : ""} onClick={() => setTi(n)}>{t(x.label)}</button>)}
          </div>
        </div>
      </div>
      <div className="ih-wrap">
        <div className="ih-grid" key={ti}>
          {list.slice(0, 5).map((p) => (
            <HomeCard key={p.handle} p={p} />
          ))}
          <FinderCard />
        </div>
        <div className="ih-viewall"><Link to={tab.all}>{t("View all")}</Link></div>
        <FinderHelp />
      </div>
    </section>
  );
}

/* Video module: pill tabs per product line, one large player on the left and the rest of the list on the right.
   Clicking a row loads it into the player; nothing from YouTube loads until a video is played (privacy-enhanced embed). */
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hq720.jpg`;
const thumbFallback = (e, id) => { if (!e.target.dataset.fb) { e.target.dataset.fb = 1; e.target.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; } };

function Videos() {
  const [tab, setTab] = useState(0);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const items = homeVideos[tab].items;
  const [id, title, channel] = items[cur] || items[0];
  const choose = (n, play) => { setCur(n); setPlaying(play); };
  return (
    <section className="ih-block iv">
      <div className="ih-wrap">
        <div className="iv-head">
          <h2 className="ih-h2">{t("Watch OneLaser in action")}</h2>
          <div className="ih-tabs" role="tablist">
            {homeVideos.map((g, n) => <button key={g.label} type="button" role="tab" aria-selected={n === tab} className={n === tab ? "on" : ""} onClick={() => { setTab(n); choose(0, false); }}>{g.label}</button>)}
          </div>
        </div>
        <div className="iv-grid" key={tab}>
          <div className="iv-main">
            <div className="iv-player">
              {playing ? (
                <iframe key={id} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
              ) : (
                <button type="button" onClick={() => setPlaying(true)} aria-label={`${t("Play video")}: ${title}`}>
                  <img key={id} src={thumb(id)} onError={(e) => thumbFallback(e, id)} alt="" loading="lazy" />
                  <span aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="iv-meta"><b>{title}</b><span>{channel}</span></div>
          </div>
          <ul className="iv-list">
            {items.map(([vid, vt, vc], n) => (
              <li key={vid}>
                <button type="button" className={n === cur ? "on" : ""} aria-current={n === cur} onClick={() => choose(n, true)}>
                  <span className="iv-thumb"><img src={thumb(vid)} onError={(e) => thumbFallback(e, vid)} alt="" loading="lazy" /><i aria-hidden="true" /></span>
                  <span className="iv-text"><b>{vt}</b><em>{vc}</em></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="ih">
      <Hero />
      <ProductBlock />

      <Videos />

      <section className="ih-block ip2">
        <div className="ih-wrap">
          <div className="ip2-head">
            <h2 className="ih-h2">{t("Built for the thousandth job, not just the first.")}</h2>
            <p>{t("The numbers that decide how long a laser earns its keep.")}</p>
          </div>
          <div className="ip2-grid">
            {homeProof.map(([figure, title, text]) => (
              <article key={figure}><b>{figure}</b><h3>{t(title)}</h3><p>{t(text)}</p></article>
            ))}
          </div>
        </div>
      </section>

      <section className="ih-block irv">
        <div className="ih-wrap">
          <div className="irv-head">
            <h2 className="ih-h2">{t("Owners say it better.")}</h2>
            <Link href={homeReviews.url} className="irv-score">
              <span className="irv-stars" aria-hidden="true">★★★★★</span>
              <b>{homeReviews.average}</b>
              <em>{t("out of 5")} · {homeReviews.count} {t("reviews of the")} {homeReviews.product}</em>
            </Link>
          </div>
          <div className="irv-grid">
            {homeReviews.items.map((r) => (
              <figure key={r.name}>
                <span className="irv-stars" aria-label="5 / 5">★★★★★</span>
                <blockquote>“{r.text}”</blockquote>
                <figcaption><b>{r.name}</b><span>{r.verified && <><Icon name="check" size={13} />{t("Verified buyer")} · </>}{homeReviews.product} · {r.date}</span></figcaption>
              </figure>
            ))}
          </div>
          <p className="fd-links"><Link href={homeReviews.url}>{t("Read all reviews")} ›</Link></p>
        </div>
      </section>

      <section className="ih-block ist">
        <div className="ih-wrap">
          <div className="ist-photo"><img src={img(homeStandard.image, 2400)} alt="OneLaser U.S. headquarters, Lake Forest, California" loading="lazy" /></div>
          <p className="ist-kicker">{t(homeStandard.kicker)}</p>
          <h2 className="ih-h2">{t(homeStandard.title)}</h2>
          <p className="ist-text">{t(homeStandard.text)}</p>
          <ol className="ist-points">
            {homeStandard.points.map(([title, text], n) => <li key={title}><i>{String(n + 1).padStart(2, "0")}</i><h3>{t(title)}</h3><p>{t(text)}</p></li>)}
          </ol>
          <p className="fd-links"><Link href={homeStandard.cta[1]}>{t(homeStandard.cta[0])} ›</Link></p>
        </div>
      </section>

      <section className="ih-block">
        <div className="ih-wrap">
          <Link to="/collections/deals" className="ih-banner">
            <img src={asset("home-bf.jpg")} alt="" loading="lazy" />
            <span className="ih-banner-copy">
              <small>{t(promo.label)}</small>
              <b>{t(promo.headline)}</b>
              <Countdown endsAt={promo.endsAt} />
              <span className="ih-btn light">{t("Learn more")}</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="ih-block ifq">
        <div className="ih-wrap">
          <h2 className="ih-h2">{t("Questions? Answers.")}</h2>
          <ul className="iw-faq">
            {homeFaq.map(([q, ans], n) => (
              <li key={q}><details open={n === 0}><summary><span>{t(q)}</span><Icon name="chevron" size={16} /></summary><p>{t(ans)}</p></details></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
