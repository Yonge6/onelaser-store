import { useEffect, useState } from "react";
import { asset, byHandle, img } from "../lib.js";
import { bestSellers, categoryRail, heroSlides, hot, promo, promoBanner, seriesBlocks } from "../data/site.js";
import { Benefits } from "../components/Chrome.jsx";
import { Countdown, Link, Price, ProductCard, Rail } from "../components/ui.jsx";

/* Structure follows the DJI Store homepage:
   promo hero + category strip → What's Hot → promo banner → Best Sellers → Why shop → one block per product line. */

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <section className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      {heroSlides.map((s, n) => (
        <div key={s.title} className={`hero-slide${n === i ? " active" : ""}${s.masked ? " masked" : ""}`} aria-hidden={n !== i}>
          <img src={asset(s.image)} alt="" />
          <div className="wrap hero-copy">
            <p className="eyebrow">{s.eyebrow}</p>
            <h1>{s.title}</h1>
            <p className="hero-text">{s.text}</p>
            {s.countdown && <Countdown endsAt={promo.endsAt} />}
            <Link to={s.to} className="btn btn-light" tabIndex={n === i ? 0 : -1}>Buy Now</Link>
          </div>
        </div>
      ))}
      <button type="button" className="hero-arrow prev" aria-label="Previous slide" onClick={() => setI((i + heroSlides.length - 1) % heroSlides.length)}>‹</button>
      <button type="button" className="hero-arrow next" aria-label="Next slide" onClick={() => setI((i + 1) % heroSlides.length)}>›</button>
      <div className="hero-dots">
        {heroSlides.map((s, n) => <button key={s.title} type="button" aria-label={`Slide ${n + 1}`} className={n === i ? "on" : ""} onClick={() => setI(n)} />)}
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Hero />

      <section className="cat-strip">
        <div className="wrap">
          <Rail label="Shop by category">
            {categoryRail.map(([label, to, handle]) => (
              <Link key={label} to={to} className="cat"><img src={img(byHandle[handle].images[0], 240)} alt="" loading="lazy" /><span>{label}</span></Link>
            ))}
          </Rail>
        </div>
      </section>

      <section className="section wrap">
        <h2 className="h2">What's Hot</h2>
        <Rail label="What's hot">
          {hot.map((h) => byHandle[h]).map((p) => (
            <Link key={p.handle} to={`/products/${p.handle}`} className="hot-card">
              <img src={img(p.images[0], 600)} alt="" loading="lazy" />
              <span className="hot-foot">
                <span><b>{p.name}</b><small>{p.tagline}</small><Price product={p} from /></span>
                <span className="btn btn-light btn-sm">Buy Now</span>
              </span>
            </Link>
          ))}
        </Rail>
      </section>

      <section className="section wrap">
        <Link to={promoBanner.to} className="promo-banner">
          <img src={asset(promoBanner.image)} alt="" loading="lazy" />
          <span><small>{promoBanner.kicker}</small><b>{promoBanner.title}</b><em>{promoBanner.text}</em></span>
        </Link>
      </section>

      <section className="section wrap">
        <h2 className="h2">Best Sellers</h2>
        <div className="card-row six">{bestSellers.map((h) => <ProductCard key={h} product={byHandle[h]} shop={false} />)}</div>
      </section>

      <Benefits />

      {seriesBlocks.map((b) => (
        <section key={b.title} className="section wrap series">
          <h2 className="h2">{b.title}</h2>
          <Link to={b.to} className="series-banner">
            <img src={asset(b.image)} alt="" loading="lazy" />
            <span><small>{b.kicker}</small><b>{b.name}</b><em>{b.text}</em><span className="btn btn-light btn-sm">Buy Now</span></span>
          </Link>
          <div className="card-row five">
            {b.picks.map((h) => <ProductCard key={h} product={byHandle[h]} shop={false} />)}
            <Link to={b.view} className="card explore-card"><b>{b.viewLabel}</b><span className="explore-arrow" aria-hidden="true">→</span></Link>
          </div>
        </section>
      ))}

      <section className="section wrap">
        <div className="helper">
          <div><b>Which laser is right for me?</b><span>Compare power, work area and speed side by side, or talk to a U.S.-based laser expert.</span></div>
          <div className="helper-actions">
            <Link to="/compare" className="btn btn-dark">Compare machines</Link>
            <Link href="https://www.1laser.com/pages/sales-consultation" className="btn btn-outline">Book a free call</Link>
          </div>
        </div>
      </section>
    </>
  );
}
