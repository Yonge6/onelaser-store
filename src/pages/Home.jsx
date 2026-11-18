import { useEffect, useRef, useState } from "react";
import { useCart } from "../cart.jsx";
import { t } from "../i18n.js";
import { asset, byHandle, img, money, products } from "../lib.js";
import { heroSlides, homeStories, homeTabs, interests, newHandles, promo, shortSlogans } from "../data/site.js";
import { Countdown, Icon, Link } from "../components/ui.jsx";
import { BenefitArt } from "../components/Chrome.jsx";
import FinderCard, { FinderHelp } from "../components/Finder.jsx";

/* Module order, sizes and type follow the insta360.com homepage (measured 2026-11-17 at 1440 and 375):
   full-bleed hero 660 with segmented progress → headline + sticky pill tabs + 3-column product cards (416×554, radius 24)
   → feature banner 480 → Shop by interest (310×480 tiles) → two half cards 640×480 → image banner 480
   → story carousel (864×486) → business band 376 → four support tiles 240. 64px gutters, 64px between blocks.
   Typeface is Poppins, as on Insta360. Only the brand red is OneLaser's own (Insta360 uses yellow). */

const SLIDE_MS = 10000;

/** Product family shot built from the official renders (percent = height of the stage), each standing on a soft floor shadow. */
const Lineup = ({ items }) => (
  <div className="ih-lineup" aria-hidden="true">
    {items.map(([h, pct]) => <span key={h} style={{ height: `${pct}%` }}><img src={img(byHandle[h].images[0], 700)} alt="" loading="lazy" /></span>)}
  </div>
);

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

/** Horizontal scroller with Insta360's round arrow buttons in the heading row. */
function useScroller() {
  const ref = useRef(null);
  const by = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return [ref, by];
}

function Interests() {
  const [ref, by] = useScroller();
  return (
    <section className="ih-block">
      <div className="ih-wrap">
        <div className="ih-head-row">
          <h2 className="ih-h2">{t("Shop by project")}</h2>
          <div className="ih-arrows">
            <button type="button" aria-label={t("Previous")} onClick={() => by(-1)}><Icon name="chevron" size={18} /></button>
            <button type="button" aria-label={t("Next")} onClick={() => by(1)}><Icon name="chevron" size={18} /></button>
          </div>
        </div>
      </div>
      <div className="ih-scroller ih-interests" ref={ref}>
        {interests.map(([label, image, to]) => (
          <Link key={label} to={to} className="ih-interest">
            <img src={asset(image)} alt="" loading="lazy" />
            <span><b>{t(label)}</b><Icon name="chevron" size={20} /></span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Stories() {
  const [ref] = useScroller();
  const [at, setAt] = useState(0);
  const onScroll = () => {
    const el = ref.current;
    const card = el?.firstElementChild;
    if (card) setAt(Math.round(el.scrollLeft / (card.getBoundingClientRect().width + parseFloat(getComputedStyle(el).columnGap || 0))));
  };
  const go = (n) => {
    const el = ref.current;
    el?.children[n]?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };
  return (
    <section className="ih-block">
      <div className="ih-wrap"><h2 className="ih-h2">{t("See what OneLaser is up to")}</h2></div>
      <div className="ih-scroller ih-stories" ref={ref} onScroll={onScroll}>
        {homeStories.map(([title, text, image, to]) => (
          <Link key={title} to={to} className="ih-story">
            <img src={asset(image)} alt="" loading="lazy" />
            <span><b>{t(title)}</b><em>{t(text)}</em></span>
          </Link>
        ))}
      </div>
      <div className="ih-dashes">{homeStories.map((s, n) => <button key={n} type="button" aria-label={`Story ${n + 1}`} className={n === at ? "on" : ""} onClick={() => go(n)} />)}</div>
    </section>
  );
}

const SUPPORT = [
  ["Talk to an expert", "support", "https://www.1laser.com/pages/sales-consultation"],
  ["Easy returns", "returns", "https://www.1laser.com/pages/refund-policy"],
  ["Financing", "payment", "https://www.1laser.com/pages/financing"],
  ["3-2-1 Warranty", "warranty", "https://www.1laser.com/pages/warranty-policy"],
];

export default function Home() {
  return (
    <div className="ih">
      <Hero />
      <ProductBlock />

      <Interests />

      <section className="ih-block">
        <div className="ih-wrap ih-halves">
          <article className="ih-half">
            <p>{t("Machine finder")}</p>
            <h3>{t("Find your perfect laser with a side-by-side comparison.")}</h3>
            <div className="ih-half-btns"><Link to="/compare" className="ih-btn dark">{t("Compare")}</Link><Link href="https://www.1laser.com/pages/sales-consultation" className="ih-link lg">{t("Talk to sales")}</Link></div>
            <Lineup items={[["hydra-9-gen-2-70w-rf-co2-dual-laser-machine", 88], ["cobra-10-100w-co2-laser-engraver-cutter", 78], ["onelaser-xrf-desktop-laser-machine", 46], ["vertigo-vertical-laser-engraver", 44]]} />
          </article>
          <article className="ih-half">
            <p>{t("Accessories")}</p>
            <h3>{t("Level up your laser with official OneLaser gear.")}</h3>
            <div className="ih-half-btns"><Link to="/collections/accessories" className="ih-btn dark">{t("Shop now")}</Link></div>
            <Lineup items={[["onelaser-industrial-chiller-for-hydra-laser-engraver", 62], ["piburn-omni-for-onelaser", 70], ["filtrabox-micro", 78], ["onelaser-x-series-riser-base", 48]]} />
          </article>
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

      <Stories />

      <Link href="https://www.1laser.com/pages/sales-consultation" className="ih-business">
        <span className="ih-wrap">
          <span className="ih-business-copy"><small>{t("OneLaser for Business")}</small><b>{t("Machines that mean business.")}</b><span className="ih-btn dark">{t("Learn more")}</span></span>
          <span className="ih-business-art">
            <img src={asset("home-product-cobra-scene.webp")} alt="" loading="lazy" />
            <img src={asset("home-project-large-acrylic-sign.webp")} alt="" loading="lazy" />
            <img src={asset("home-project-batch-leather-gifts.webp")} alt="" loading="lazy" />
            <img src={asset("home-project-vertigo-corporate-tumbler-batch.webp")} alt="" loading="lazy" />
          </span>
        </span>
      </Link>

      <section className="ih-block ih-support">
        <div className="ih-wrap">
          {SUPPORT.map(([label, icon, href]) => <Link key={label} href={href} className="ih-entry"><BenefitArt name={icon} /><span>{t(label)}</span><Icon name="chevron" size={22} /></Link>)}
        </div>
      </section>
    </div>
  );
}
