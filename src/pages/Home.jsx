import { useEffect, useState } from "react";
import { accessories, asset, byHandle, img, machines } from "../lib.js";
import { accessoryTabs, applications, categoryRail, heroSlides, hot, machineTabs, promo, seriesBlocks } from "../data/site.js";
import { Benefits } from "../components/Chrome.jsx";
import { Countdown, Link, Price, ProductCard, Rail } from "../components/ui.jsx";

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

function Tabs({ tabs, value, onChange }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map((t) => <button key={t} type="button" role="tab" aria-selected={t === value} className={t === value ? "on" : ""} onClick={() => onChange(t)}>{t}</button>)}
    </div>
  );
}

export default function Home() {
  const [mTab, setMTab] = useState(machineTabs[0][0]);
  const [aTab, setATab] = useState(accessoryTabs[0][0]);
  const mList = machines.filter(machineTabs.find(([t]) => t === mTab)[1]);
  const aCat = accessoryTabs.find(([t]) => t === aTab)[1];
  const aList = accessories.filter((p) => p.category === aCat || (aCat === "expansion" && p.category === "air")).slice(0, 4);
  return (
    <>
      <Hero />

      <section className="wrap cat-rail">
        <Rail label="Shop by category">
          {categoryRail.map(([label, to, handle]) => (
            <Link key={label} to={to} className="cat"><img src={img(byHandle[handle].images[0], 240)} alt="" loading="lazy" /><span>{label}</span></Link>
          ))}
        </Rail>
      </section>

      <section className="section wrap">
        <h2 className="h2">What's Hot</h2>
        <Rail label="What's hot">
          {hot.map((h) => byHandle[h]).map((p) => (
            <Link key={p.handle} to={`/products/${p.handle}`} className="hot-card">
              <b>{p.name}</b>
              <span className="muted">{p.tagline}</span>
              <Price product={p} from />
              <span className="btn btn-dark btn-sm">Buy Now</span>
              <img src={img(p.images[0], 500)} alt="" loading="lazy" />
            </Link>
          ))}
        </Rail>
      </section>

      <section className="section wrap">
        <div className="section-head"><h2 className="h2">Laser Machines</h2><Link to="/collections/machines" className="more">View all ›</Link></div>
        <Tabs tabs={machineTabs.map(([t]) => t)} value={mTab} onChange={setMTab} />
        <div className="grid grid-4">{mList.map((p) => <ProductCard key={p.handle} product={p} />)}</div>
        <div className="helper-row">
          <div className="helper">
            <div><b>Which laser is right for me?</b><span>Compare power, work area and speed side by side.</span></div>
            <Link to="/compare" className="btn btn-outline">Compare machines</Link>
          </div>
          <div className="helper">
            <div><b>Talk to a laser expert</b><span>Free consultation with the U.S.-based team.</span></div>
            <Link href="https://www.1laser.com/pages/sales-consultation" className="btn btn-outline">Book a call</Link>
          </div>
        </div>
      </section>

      {seriesBlocks.map((b) => (
        <section key={b.name} className="section wrap series">
          <p className="kicker">{b.kicker}</p>
          <h2 className="h2">{b.title}</h2>
          <div className="series-grid">
            <Link to={b.to} className="series-feature">
              <img src={asset(b.image)} alt="" loading="lazy" />
              <div><h3>{b.name}</h3><p>{b.text}</p><span className="btn btn-light btn-sm">Buy Now</span></div>
            </Link>
            <div className="grid grid-2">{b.picks.map((h) => <ProductCard key={h} product={byHandle[h]} compact />)}</div>
          </div>
          <Link to={b.view} className="more center-link">{b.viewLabel} ›</Link>
        </section>
      ))}

      <section className="section wrap">
        <div className="section-head"><h2 className="h2">Accessories</h2><Link to="/collections/accessories" className="more">View all ›</Link></div>
        <Tabs tabs={accessoryTabs.map(([t]) => t)} value={aTab} onChange={setATab} />
        <div className="grid grid-4">{aList.map((p) => <ProductCard key={p.handle} product={p} compact />)}</div>
      </section>

      <section className="section wrap">
        <div className="section-head"><h2 className="h2">Materials</h2><Link to="/collections/materials" className="more">View all ›</Link></div>
        <div className="tiles">
          <Link to="/collections/acrylic" className="tile"><img src={asset("material-acrylic.webp")} alt="" loading="lazy" /><div><h3>Acrylic Sheets</h3><p>Frosted, translucent, glitter and mirror.</p><span>Shop now ›</span></div></Link>
          <Link to="/collections/leatherette" className="tile"><img src={asset("material-leather.webp")} alt="" loading="lazy" /><div><h3>Leatherette</h3><p>Heat-activated adhesive sheets for engraving.</p><span>Shop now ›</span></div></Link>
        </div>
      </section>

      <section className="section wrap">
        <h2 className="h2">Made with OneLaser</h2>
        <Rail label="Applications">
          {applications.map(([label, image]) => (
            <div key={label} className="app-card"><img src={asset(image)} alt="" loading="lazy" /><span>{label}</span></div>
          ))}
        </Rail>
      </section>

      <Benefits />
    </>
  );
}
