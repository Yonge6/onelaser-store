import { useEffect, useRef, useState } from "react";
import { asset, byHandle, img, products } from "../lib.js";
import { heroSlides, homeFeature, homeStories, homeTabs, interests, newHandles, promo, shortSlogans } from "../data/site.js";
import { Countdown, Icon, Link } from "../components/ui.jsx";

/* Module order, sizes and type follow the insta360.com homepage (measured 2026-11-17 at 1440 and 375):
   full-bleed hero 660 with segmented progress → headline + sticky pill tabs + 3-column product cards (416×554, radius 24)
   → feature banner 480 → Shop by interest (310×480 tiles) → two half cards 640×480 → image banner 480
   → story carousel (864×486) → business band 376 → four support tiles 240. 64px gutters, 64px between blocks.
   Kept from OneLaser: Certia typeface and brand red (Insta360 uses Poppins and yellow). */

const SLIDE_MS = 6000;

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
            <p className="ih-top">{s.eyebrow}</p>
            <h1>{s.title}</h1>
            <p className="ih-slogan">{s.text}</p>
            {s.countdown && <Countdown endsAt={promo.endsAt} />}
            <div className="ih-btns">
              <Link to={s.to} className="ih-btn light" tabIndex={n === i ? 0 : -1}>Buy now</Link>
              <Link to={s.to} className="ih-btn ghost" tabIndex={n === i ? 0 : -1}>Learn more</Link>
            </div>
          </div>
        </article>
      ))}
      <div className="ih-pages">
        {heroSlides.map((s, n) => (
          <button key={s.title} type="button" aria-label={`Slide ${n + 1}`} className={n === i ? "on" : n < i ? "done" : ""} onClick={() => setI(n)}>
            <span style={n === i ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined} />
          </button>
        ))}
      </div>
    </section>
  );
}

function ProductBlock() {
  const [t, setT] = useState(0);
  const tab = homeTabs[t];
  const list = (tab.picks ? tab.picks.map((h) => byHandle[h]) : products.filter((p) => p.category === tab.collection || (tab.collection === "materials" && p.kind === "material"))).filter(Boolean).slice(0, 6);
  return (
    <section className="ih-products">
      <div className="ih-wrap"><h2 className="ih-h2 narrow">Laser machines for makers and growing businesses.</h2></div>
      <div className="ih-sticky">
        <div className="ih-wrap">
          <div className="ih-tabs" role="tablist">
            {homeTabs.map((x, n) => <button key={x.label} type="button" role="tab" aria-selected={n === t} className={n === t ? "on" : ""} onClick={() => setT(n)}>{x.label}</button>)}
          </div>
        </div>
      </div>
      <div className="ih-wrap">
        <div className="ih-grid" key={t}>
          {list.map((p) => (
            <article key={p.handle} className="ih-card">
              <div className="ih-card-info">
                {newHandles.includes(p.handle) && <span className="ih-new">NEW</span>}
                <h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3>
                <p>{shortSlogans[p.handle] || p.tagline}</p>
              </div>
              <Link to={`/products/${p.handle}`} className="ih-card-media" tabIndex={-1} aria-hidden="true"><img src={img(p.images[0], 700)} alt="" loading="lazy" /></Link>
              <div className="ih-card-btns">
                <Link to={`/products/${p.handle}`} className="ih-link">Learn more</Link>
                <Link to={`/products/${p.handle}`} className="ih-btn dark sm">Buy now</Link>
              </div>
            </article>
          ))}
        </div>
        <div className="ih-viewall"><Link to={tab.all}>View all</Link></div>
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
          <h2 className="ih-h2">Shop by project</h2>
          <div className="ih-arrows">
            <button type="button" aria-label="Previous" onClick={() => by(-1)}><Icon name="chevron" size={18} /></button>
            <button type="button" aria-label="Next" onClick={() => by(1)}><Icon name="chevron" size={18} /></button>
          </div>
        </div>
      </div>
      <div className="ih-scroller ih-interests" ref={ref}>
        {interests.map(([label, image, to]) => (
          <Link key={label} to={to} className="ih-interest">
            <img src={asset(image)} alt="" loading="lazy" />
            <span><b>{label}</b><Icon name="chevron" size={20} /></span>
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
      <div className="ih-wrap"><h2 className="ih-h2">See what OneLaser is up to</h2></div>
      <div className="ih-scroller ih-stories" ref={ref} onScroll={onScroll}>
        {homeStories.map(([title, text, image, to]) => (
          <Link key={title} to={to} className="ih-story">
            <img src={asset(image)} alt="" loading="lazy" />
            <span><b>{title}</b><em>{text}</em></span>
          </Link>
        ))}
      </div>
      <div className="ih-dashes">{homeStories.map((s, n) => <button key={n} type="button" aria-label={`Story ${n + 1}`} className={n === at ? "on" : ""} onClick={() => go(n)} />)}</div>
    </section>
  );
}

const SUPPORT = [
  ["Talk to an expert", "headset", "https://www.1laser.com/pages/sales-consultation"],
  ["Product support", "refresh", "https://www.1laser.com/pages/contact-us"],
  ["Financing", "card", "https://www.1laser.com/pages/financing"],
  ["3-2-1 Warranty", "shield", "https://www.1laser.com/pages/warranty-policy"],
];

export default function Home() {
  const f = homeFeature;
  return (
    <div className="ih">
      <Hero />
      <ProductBlock />

      <section className="ih-block">
        <div className="ih-wrap">
          <Link to={f.to} className="ih-feature">
            <img src={asset(f.image)} alt="" loading="lazy" />
            <span className="ih-feature-copy">
              <b>{f.title}</b>
              <em>{f.text.map((l) => <span key={l}>{l}</span>)}</em>
              <span className="ih-feature-btns"><span className="ih-link lg">Learn more</span><span className="ih-btn dark wide">Buy now</span></span>
            </span>
          </Link>
        </div>
      </section>

      <Interests />

      <section className="ih-block">
        <div className="ih-wrap ih-halves">
          <article className="ih-half">
            <p>Machine finder</p>
            <h3>Find your perfect laser with a side-by-side comparison.</h3>
            <div className="ih-half-btns"><Link to="/compare" className="ih-btn dark">Compare</Link><Link href="https://www.1laser.com/pages/sales-consultation" className="ih-link lg">Talk to sales</Link></div>
            <div className="ih-half-art">
              {["cobra-10-100w-co2-laser-engraver-cutter", "onelaser-xrf-desktop-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "vertigo-vertical-laser-engraver"].map((h) => <img key={h} src={img(byHandle[h].images[0], 500)} alt="" loading="lazy" />)}
            </div>
          </article>
          <article className="ih-half">
            <p>Accessories</p>
            <h3>Level up your laser with official OneLaser gear.</h3>
            <div className="ih-half-btns"><Link to="/collections/accessories" className="ih-btn dark">Shop now</Link></div>
            <div className="ih-half-art">
              {["piburn-omni-for-onelaser", "filtrabox-micro", "onelaser-x-series-riser-base", "onelaser-industrial-chiller-for-hydra-laser-engraver"].map((h) => <img key={h} src={img(byHandle[h].images[0], 500)} alt="" loading="lazy" />)}
            </div>
          </article>
        </div>
      </section>

      <section className="ih-block">
        <div className="ih-wrap">
          <Link to="/collections/deals" className="ih-banner">
            <img src={asset("home-product-hydra-gen2-scene.webp")} alt="" loading="lazy" />
            <span className="ih-banner-copy">
              <small>{promo.label}</small>
              <b>{promo.headline}</b>
              <Countdown endsAt={promo.endsAt} />
              <span className="ih-btn light">Learn more</span>
            </span>
          </Link>
        </div>
      </section>

      <Stories />

      <Link href="https://www.1laser.com/pages/sales-consultation" className="ih-business">
        <span className="ih-wrap">
          <span className="ih-business-copy"><small>OneLaser for Business</small><b>Machines that mean business.</b><span className="ih-btn dark">Learn more</span></span>
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
          {SUPPORT.map(([label, icon, href]) => <Link key={label} href={href} className="ih-entry"><Icon name={icon} size={64} /><span>{label}</span><Icon name="chevron" size={22} /></Link>)}
        </div>
      </section>
    </div>
  );
}
