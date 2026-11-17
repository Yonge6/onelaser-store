import { useEffect, useState } from "react";
import { asset, byHandle, img } from "../lib.js";
import { bestSellers, categoryRail, heroSlides, hot, promo, promoBanner, seriesBlocks } from "../data/site.js";
import { Benefits } from "../components/Chrome.jsx";
import { Countdown, Link, ProductCard, Rail, usd } from "../components/ui.jsx";

/* Module order, sizes and type follow the DJI Store homepage (measured 2026-11-16):
   hero 430 + category strip → What's Hot → promo → Best Sellers → Why shop → one module per product line. */

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => setI((n) => (n + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, [paused]);
  return (
    <div className="hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
      {heroSlides.map((s, n) => (
        <article key={s.title} className={`hero-slide${n === i ? " active" : ""}${s.masked ? " masked" : ""}`} aria-hidden={n !== i}>
          <img src={asset(s.image)} alt="" />
          <div className="hero-copy">
            <p className="kicker">{s.eyebrow}</p>
            <h1>{s.title}</h1>
            <p>{s.text}</p>
            {s.countdown && <Countdown endsAt={promo.endsAt} />}
            <Link to={s.to} className="pill" tabIndex={n === i ? 0 : -1}>Buy Now</Link>
          </div>
        </article>
      ))}
      <button type="button" className="slider-arrow prev" aria-label="Previous slide" onClick={() => setI((i + heroSlides.length - 1) % heroSlides.length)}>‹</button>
      <button type="button" className="slider-arrow next" aria-label="Next slide" onClick={() => setI((i + 1) % heroSlides.length)}>›</button>
      <div className="hero-dots">
        {heroSlides.map((s, n) => <button key={s.title} type="button" aria-label={`Slide ${n + 1}`} className={n === i ? "on" : ""} onClick={() => setI(n)} />)}
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="home">
      <section className="home-top">
        <Hero />
        <div className="category-tabs">
          {categoryRail.map(([label, to, handle]) => (
            <Link key={label} to={to} className="category"><span><img src={img(byHandle[handle].images[0], 200)} alt="" loading="lazy" /></span><span>{label}</span></Link>
          ))}
        </div>
      </section>

      <section className="module">
        <div className="page">
          <h2>What's Hot</h2>
          <Rail label="What's hot" className="hot-shell">
            {hot.map((h) => byHandle[h]).map((p) => (
              <article key={p.handle} className="hot-tile">
                <Link to={`/products/${p.handle}`} className="hot-media" aria-label={p.name}><img src={img(p.images[0], 700)} alt="" loading="lazy" /></Link>
                <div className="hot-copy"><h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3><p>{p.tagline}</p></div>
                <div className="hot-footer"><span>{p.priceVaries ? "From " : ""}{usd(p.price)}</span><Link to={`/products/${p.handle}`} className="hot-cta">Buy Now</Link></div>
              </article>
            ))}
          </Rail>
        </div>
      </section>

      <section className="module">
        <div className="page">
          <Link to={promoBanner.to} className="promo">
            <span className="promo-copy"><span>{promoBanner.kicker}</span><strong>{promoBanner.title}</strong><em>{promoBanner.text}</em></span>
            <span className="promo-media"><img src={img(byHandle[promoBanner.product].images[0], 900)} alt="" loading="lazy" /></span>
          </Link>
        </div>
      </section>

      <section className="module">
        <div className="page">
          <h2>Best Sellers</h2>
          <Rail label="Best sellers" className="product-shell">{bestSellers.map((h) => <ProductCard key={h} product={byHandle[h]} />)}</Rail>
        </div>
      </section>

      <Benefits />

      {seriesBlocks.map((b) => (
        <section key={b.title} className="module">
          <div className="page">
            <h2>{b.title}</h2>
            <Link to={b.to} className="feature-card">
              <img src={asset(b.image)} alt="" loading="lazy" />
              <span className="feature-copy"><small>{b.kicker}</small><strong>{b.name}</strong><em>{b.text}</em><b>Buy Now</b></span>
            </Link>
            <Rail label={b.title} className="product-shell">
              {b.picks.map((h) => <ProductCard key={h} product={byHandle[h]} />)}
              <article className="pcard special">
                <Link to={b.view}>
                  <span className="pcard-media"><img src={asset(b.image)} alt="" loading="lazy" /></span>
                  <span className="pcard-body"><strong>{b.viewLabel}</strong><b aria-hidden="true">→</b></span>
                </Link>
              </article>
            </Rail>
          </div>
        </section>
      ))}
    </div>
  );
}
