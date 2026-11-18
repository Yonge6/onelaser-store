import { useEffect, useState } from "react";
import { LANGS, getLang, setLang, t } from "../i18n.js";
import { asset, byHandle, go, img, products } from "../lib.js";
import { useCart } from "../cart.jsx";
import { nav, promo, benefits } from "../data/site.js";
import { Icon, Link, usd } from "./ui.jsx";

export function Header({ path }) {
  const { count } = useCart();
  const [open, setOpen] = useState(null); // mega menu label
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  const [langOpen, setLangOpen] = useState(false);
  const current = LANGS.find((l) => l.code === getLang()) || LANGS[0];
  const [top, setTop] = useState(true);
  useEffect(() => {
    setOpen(null); setMobile(false); setSearch(false); setLangOpen(false);
  }, [path]);
  useEffect(() => {
    const onScroll = () => setTop(window.scrollY < 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Insta360: the bar floats transparent over the home hero and turns white once the page scrolls or a menu opens.
  const overlay = path === "/" && top && !open && !search;
  const hits = q.trim().length > 1 ? products.filter((p) => `${p.name} ${p.title}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <>
      <header className={`site-header${overlay ? " overlay" : ""}`} onMouseLeave={() => setOpen(null)}>
        <div className="site-header-bar">
          <button type="button" className="icon-btn only-mobile" aria-label={t("Menu")} onClick={() => setMobile(true)}><Icon name="menu" /></button>
          <Link to="/" className="brand" aria-label={t("OneLaser Store home")}><img src={asset(overlay ? "onelaser-logo-red-white.svg" : "onelaser-logo-transparent.svg")} alt="OneLaser" /></Link>
          <nav className="site-nav" aria-label={t("Primary")}>
            {nav.map((n) => (
              <Link key={n.label} to={n.to} href={n.href} className={n.hot ? "hot" : ""} onMouseEnter={() => setOpen(n.columns ? n.label : null)} onFocus={() => setOpen(n.columns ? n.label : null)}>{t(n.label)}</Link>
            ))}
          </nav>
          <div className="site-actions">
            <Link to="/collections/deals" className="store-btn"><Icon name="cart" size={16} /><span>{t("Deals")}</span></Link>
            <button type="button" className="icon-btn" aria-label={t("Search")} onClick={() => setSearch((s) => !s)}><Icon name="search" size={22} /></button>
            <Link href="https://www.1laser.com/account/login" className="icon-btn hide-mobile" aria-label={t("Account")}><Icon name="user" size={22} /></Link>
            <Link to="/cart" className="icon-btn cart-btn" aria-label={`Cart, ${count} items`}><Icon name="cart" size={22} />{count > 0 && <em>{count}</em>}</Link>
            <div className={`lang-menu hide-mobile${langOpen ? " open" : ""}`} onMouseLeave={() => setLangOpen(false)}>
              <button type="button" className="icon-btn lang-btn" aria-haspopup="menu" aria-expanded={langOpen} aria-label={t("Choose your language")} onClick={() => setLangOpen((v) => !v)}><Icon name="globe" size={22} /></button>
              <ul role="menu">
                {LANGS.map((l) => (
                  <li key={l.code} role="none"><button type="button" role="menuitemradio" aria-checked={l.code === current.code} lang={l.code === "zh" ? "zh-CN" : l.code} className={l.code === current.code ? "on" : ""} onClick={() => { setLang(l.code); setLangOpen(false); }}><span>{l.label}</span>{l.code === current.code && <Icon name="check" size={16} />}</button></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {nav.filter((n) => n.label === open).map((n) => (
          <div key={n.label} className="mega">
            <div className="mega-inner">
              {n.columns.map((c) => (
                <div key={c.title}><h2>{t(c.title)}</h2>{c.links.map(([label, to]) => <Link key={to} to={to}>{t(label)}</Link>)}</div>
              ))}
            </div>
          </div>
        ))}
        {search && (
          <div className="mega search-panel">
            <form className="mega-inner" onSubmit={submit}>
              <div className="search-field">
                <Icon name="search" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Search machines, accessories, materials")} aria-label={t("Search")} />
                <button type="button" className="icon-btn" aria-label={t("Close search")} onClick={() => setSearch(false)}><Icon name="close" /></button>
              </div>
              {hits.length > 0 && (
                <ul className="search-hits">
                  {hits.map((p) => <li key={p.handle}><Link to={`/products/${p.handle}`}><img src={img(p.images[0], 120)} alt="" /><span>{p.name}</span><b>USD {usd(p.price)}</b></Link></li>)}
                </ul>
              )}
            </form>
          </div>
        )}
      </header>
      {path !== "/" && <div className="header-spacer" />}
      {mobile && (
        <div className="drawer-scrim" onClick={() => setMobile(false)}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label={t("Menu")}>
            <div className="drawer-head"><b>{t("Menu")}</b><button type="button" className="icon-btn" aria-label={t("Close")} onClick={() => setMobile(false)}><Icon name="close" /></button></div>
            <details className="drawer-lang">
              <summary><Icon name="globe" size={20} /><span>{current.label}</span><Icon name="chevron" size={16} /></summary>
              {LANGS.map((l) => <button key={l.code} type="button" lang={l.code === "zh" ? "zh-CN" : l.code} className={l.code === current.code ? "on" : ""} onClick={() => { setLang(l.code); setMobile(false); }}>{l.label}</button>)}
            </details>
            <div className="mobile-nav">
              {nav.map((n) => (
                <details key={n.label}>
                  <summary>{n.columns ? t(n.label) : <Link to={n.to} href={n.href}>{t(n.label)}</Link>}</summary>
                  {n.columns?.flatMap((c) => c.links).map(([label, to]) => <Link key={to + label} to={to}>{t(label)}</Link>)}
                </details>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

/** Minimal header for cart and checkout (DJI cart-v2 store header). */
export function MiniHeader() {
  return (
    <header className="store-header">
      <div className="container">
        <Link to="/" className="brand" aria-label={t("OneLaser Store home")}><img src={asset("onelaser-logo-transparent.svg")} alt="OneLaser" /><span>{t("Store")}</span></Link>
        <Link href="https://www.1laser.com/account/login">{t("Sign In")}</Link>
      </div>
    </header>
  );
}

/* Two-tone illustrations for the "Why shop" tiles: brand-red line work on a soft tint, one dark accent each. */
const R = "#e7310e", T = "#ffe4dc", D = "#1d1d1f";
const ART = {
  returns: (
    <>
      <ellipse cx="70" cy="62" rx="52" ry="38" fill="#fff4f0" />
      <path d="M38 46 70 32l32 14v34L70 94 38 80z" fill={T} stroke={R} strokeWidth="3" strokeLinejoin="round" />
      <path d="M38 46l32 14 32-14M70 60v34" stroke={R} strokeWidth="3" strokeLinejoin="round" />
      <path d="M54 39l32 14v11" stroke={D} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M96 24a30 30 0 0 0-50-6" stroke={D} strokeWidth="3" strokeLinecap="round" />
      <path d="M44 6v13h13" stroke={D} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  warranty: (
    <>
      <ellipse cx="70" cy="58" rx="54" ry="40" fill="#fff4f0" />
      <path d="M70 12 40 24v24c0 21 12 36 30 46 18-10 30-25 30-46V24z" fill={T} stroke={R} strokeWidth="3" strokeLinejoin="round" />
      <path d="M57 51l10 10 18-20" stroke={R} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M112 20v10M107 25h10M24 62v8M20 66h8" stroke={D} strokeWidth="3" strokeLinecap="round" />
      <circle cx="26" cy="30" r="3.5" fill={D} />
    </>
  ),
  support: (
    <>
      <ellipse cx="68" cy="60" rx="54" ry="38" fill="#fff4f0" />
      <path d="M36 62V52a30 30 0 0 1 60 0v10" stroke={R} strokeWidth="3" strokeLinecap="round" />
      <rect x="28" y="56" width="16" height="26" rx="7" fill={T} stroke={R} strokeWidth="3" />
      <rect x="88" y="56" width="16" height="26" rx="7" fill={T} stroke={R} strokeWidth="3" />
      <path d="M96 82c0 8-8 12-20 12" stroke={R} strokeWidth="3" strokeLinecap="round" />
      <rect x="62" y="89" width="14" height="9" rx="4.5" fill={R} />
      <path d="M100 8h24a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5h-12l-8 7v-7h-4a5 5 0 0 1-5-5V13a5 5 0 0 1 5-5z" fill="#fff" stroke={D} strokeWidth="3" strokeLinejoin="round" />
      <path d="M105 20h.01M112 20h.01M119 20h.01" stroke={D} strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  payment: (
    <>
      <ellipse cx="68" cy="60" rx="54" ry="38" fill="#fff4f0" />
      <rect x="20" y="28" width="84" height="56" rx="9" fill={T} stroke={R} strokeWidth="3" />
      <path d="M20 46h84" stroke={R} strokeWidth="8" />
      <path d="M32 68h22" stroke={R} strokeWidth="4" strokeLinecap="round" />
      <circle cx="102" cy="76" r="20" fill="#fff" stroke={D} strokeWidth="3" />
      <rect x="93" y="74" width="18" height="13" rx="3" fill={D} />
      <path d="M97 74v-4a5 5 0 0 1 10 0v4" stroke={D} strokeWidth="3" strokeLinecap="round" />
    </>
  ),
};
export const BenefitArt = ({ name }) => <svg className="benefit-art" viewBox="0 0 140 104" fill="none" aria-hidden="true">{ART[name]}</svg>;

/** "Why shop" bento (DJI figma-benefits): three columns, tiles 178+266 / 222+222 / 460. */
export function Benefits() {
  const icons = { "30-Day Easy Returns": "returns", "3-2-1 Warranty": "warranty", "U.S.-Based Support": "support", "Secure Payment": "payment" };
  const tile = ([title, text]) => (
    <div key={title} className="benefit-tile">
      <strong>{title}</strong>
      <span className="benefit-text">{text}</span>
      <span className="benefit-media">
        {icons[title] ? <BenefitArt name={icons[title]} /> : <img src={img(byHandle["piburn-omni-for-onelaser"].images[0], 700)} alt="" loading="lazy" />}
      </span>
    </div>
  );
  const [returns, warranty, support, accessories, payment] = benefits;
  return (
    <section className="module">
      <div className="page">
        <h2>{t("Why shop with OneLaser Store")}</h2>
        <div className="benefits">
          <div className="benefits-col a">{[returns, support].map(tile)}</div>
          <div className="benefits-col b">{[warranty, payment].map(tile)}</div>
          <div className="benefits-col c">{[accessories].map(tile)}</div>
        </div>
      </div>
    </section>
  );
}

export const ServiceStrip = () => (
  <div className="service-strip">
    <div className="page">
      <div><Icon name="truck" size={40} /><p>{t("Shipping Options at Checkout")}<br />{t("Delivery Estimated by Address")}</p></div>
      <div><Icon name="card" size={40} /><p>{t("We accept credit cards, PayPal")}<br />and financing</p></div>
      <div><Icon name="headset" size={40} /><p>{t("U.S.-Based Support:")} <Link href="https://www.1laser.com/pages/contact-us">{t("Contact Us")}</Link></p></div>
    </div>
  </div>
);

export function Footer() {
  const groups = [
    ["Machines", [["XRF Series", "/collections/xrf-series"], ["Cobra Series", "/collections/cobra-series"], ["Hydra Gen2", "/collections/hydra-gen2"], ["VertiGo", "/collections/vertigo"], ["Previous generation", "/collections/previous-generation"], ["Compare machines", "/compare"]]],
    ["Accessories", [["Rotary Attachments", "/collections/rotary"], ["Fume Extractors", "/collections/fume"], ["Lens, Mirrors & Tubes", "/collections/optics"], ["Chillers", "/collections/cooling"], ["Software & Training", "/collections/software"]]],
    ["Materials", [["Acrylic Sheets", "/collections/acrylic"], ["Leatherette", "/collections/leatherette"], ["All materials", "/collections/materials"]]],
    ["Where to buy", [["Black Friday Deals", "/collections/deals"], ["All machines", "/collections/machines"]]],
    ["Support", [["Sales consultation", "https://www.1laser.com/pages/sales-consultation"], ["Contact Us", "https://www.1laser.com/pages/contact-us"], ["Common FAQ", "https://www.1laser.com/pages/faq"], ["Financing", "https://www.1laser.com/pages/financing"]]],
    ["Policies", [["Shipping Policy", "https://www.1laser.com/pages/shipping-policy"], ["Refund Policy", "https://www.1laser.com/pages/refund-policy"], ["Warranty Policy", "https://www.1laser.com/pages/warranty-policy"], ["Payment Methods", "https://www.1laser.com/pages/payment-methods"]]],
    ["About us", [["About OneLaser", "https://www.1laser.com/pages/about-us"]]],
    ["Explore", [["Community", "https://www.1laser.com/pages/laser-engraving-community"]]],
  ];
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div className="footer-groups">
          {groups.map(([title, links]) => (
            <div key={title}>
              <h3>{t(title)}</h3>
              {links.map(([l, to]) => (to.startsWith("http") ? <Link key={l} href={to}>{t(l)}</Link> : <Link key={l} to={to}>{t(l)}</Link>))}
            </div>
          ))}
        </div>
        <div className="footer-subscribe">
          <h3>{t("Subscribe")}</h3>
          <p>{t("Get the latest news from OneLaser")}</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder={t("Enter Your Email")} aria-label={t("Email address")} disabled />
            <button disabled aria-label={t("Subscribe")}><Icon name="chevron" size={14} /></button>
          </form>
          <small>{t("Newsletter sign-up is disabled in this design draft.")}</small>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{t("Design draft for internal review — not the live store. Content and prices from 1laser.com.")}</p>
        <p>{t("Copyright © 2026 OneLaser. All rights reserved.")}</p>
      </div>
    </footer>
  );
}
