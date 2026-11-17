import { useEffect, useState } from "react";
import { asset, go, img, money, products } from "../lib.js";
import { useCart } from "../cart.jsx";
import { nav, promo, benefits } from "../data/site.js";
import { Icon, Link, Price, QtyStepper } from "./ui.jsx";

export function Header({ path }) {
  const { count, setDrawerOpen } = useCart();
  const [open, setOpen] = useState(null); // mega menu label
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const [q, setQ] = useState("");
  useEffect(() => {
    setOpen(null); setMobile(false); setSearch(false); setDrawerOpen(false);
  }, [path, setDrawerOpen]);
  const hits = q.trim().length > 1 ? products.filter((p) => `${p.name} ${p.title}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6) : [];
  const submit = (e) => {
    e.preventDefault();
    if (q.trim()) go(`/search?q=${encodeURIComponent(q.trim())}`);
  };
  return (
    <>
      <div className="announce">
        <Link to={promo.link}><b>{promo.label}</b> · {promo.headline} <u>Shop now →</u></Link>
      </div>
      <header className="header" onMouseLeave={() => setOpen(null)}>
        <div className="header-bar wrap">
          <button type="button" className="icon-btn only-mobile" aria-label="Menu" onClick={() => setMobile(true)}><Icon name="menu" /></button>
          <Link to="/" className="logo" aria-label="OneLaser Store home">
            <img src={asset("onelaser-logo-transparent.svg")} alt="OneLaser" /><span>STORE</span>
          </Link>
          <nav className="nav" aria-label="Primary">
            {nav.map((n) => (
              <Link key={n.label} to={n.to} href={n.href} className={n.hot ? "hot" : ""} onMouseEnter={() => setOpen(n.columns ? n.label : null)} onFocus={() => setOpen(n.columns ? n.label : null)}>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="header-tools">
            <button type="button" className="icon-btn" aria-label="Search" onClick={() => setSearch((s) => !s)}><Icon name="search" /></button>
            <Link href="https://www.1laser.com/account/login" className="icon-btn only-desktop" aria-label="Account"><Icon name="user" /></Link>
            <button type="button" className="icon-btn cart-btn" aria-label={`Cart, ${count} items`} onClick={() => setDrawerOpen(true)}>
              <Icon name="cart" />{count > 0 && <em>{count}</em>}
            </button>
          </div>
        </div>
        {nav.filter((n) => n.label === open).map((n) => (
          <div key={n.label} className="mega">
            <div className="wrap mega-inner">
              {n.columns.map((c) => (
                <div key={c.title}>
                  <p>{c.title}</p>
                  {c.links.map(([label, to]) => <Link key={to} to={to}>{label}</Link>)}
                </div>
              ))}
            </div>
          </div>
        ))}
        {search && (
          <div className="mega search-panel">
            <form className="wrap" onSubmit={submit}>
              <div className="search-field">
                <Icon name="search" />
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search machines, accessories, materials" aria-label="Search" />
                <button type="button" className="icon-btn" aria-label="Close search" onClick={() => setSearch(false)}><Icon name="close" /></button>
              </div>
              {hits.length > 0 && (
                <ul className="search-hits">
                  {hits.map((p) => (
                    <li key={p.handle}>
                      <Link to={`/products/${p.handle}`}><img src={img(p.images[0], 120)} alt="" /><span>{p.name}</span><Price product={p} from /></Link>
                    </li>
                  ))}
                </ul>
              )}
            </form>
          </div>
        )}
      </header>
      {mobile && (
        <div className="drawer-scrim" onClick={() => setMobile(false)}>
          <aside className="drawer drawer-left" onClick={(e) => e.stopPropagation()} aria-label="Menu">
            <div className="drawer-head"><b>Menu</b><button type="button" className="icon-btn" aria-label="Close" onClick={() => setMobile(false)}><Icon name="close" /></button></div>
            <div className="mobile-nav">
              {nav.map((n) => (
                <details key={n.label} open={false}>
                  <summary>{n.columns ? n.label : <Link to={n.to} href={n.href}>{n.label}</Link>}</summary>
                  {n.columns?.flatMap((c) => c.links).map(([label, to]) => <Link key={to + label} to={to}>{label}</Link>)}
                </details>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

export function CartDrawer() {
  const { items, subtotal, count, setQty, drawerOpen, setDrawerOpen } = useCart();
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    const esc = (e) => e.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [drawerOpen, setDrawerOpen]);
  if (!drawerOpen) return null;
  const close = () => setDrawerOpen(false);
  return (
    <div className="drawer-scrim" onClick={close}>
      <aside className="drawer" onClick={(e) => e.stopPropagation()} aria-label="Cart">
        <div className="drawer-head"><b>Cart ({count})</b><button type="button" className="icon-btn" aria-label="Close cart" onClick={close}><Icon name="close" /></button></div>
        {items.length === 0 ? (
          <div className="drawer-empty"><p>Your cart is empty.</p><Link to="/collections/machines" className="btn btn-dark" onClick={close}>Shop laser machines</Link></div>
        ) : (
          <>
            <ul className="lines">
              {items.map((i) => <CartLine key={i.variantId} item={i} setQty={setQty} onNavigate={close} />)}
            </ul>
            <div className="drawer-foot">
              <div className="row"><span>Subtotal</span><b>{money(subtotal)}</b></div>
              <p className="muted small">Shipping and taxes calculated at checkout.</p>
              <Link to="/checkout" className="btn btn-red btn-block" onClick={close}>Checkout</Link>
              <Link to="/cart" className="btn btn-outline btn-block" onClick={close}>View cart</Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

export function CartLine({ item, setQty, onNavigate }) {
  return (
    <li className="line">
      <Link to={`/products/${item.handle}`} onClick={onNavigate} className="line-img"><img src={img(item.variant.image || item.product.images[0], 200)} alt="" /></Link>
      <div className="line-main">
        <Link to={`/products/${item.handle}`} onClick={onNavigate}><b>{item.product.name}</b></Link>
        {item.variant.title && <span className="muted small">{item.variant.title}</span>}
        <div className="row">
          <QtyStepper value={item.qty} onChange={(n) => setQty(item.variantId, n)} />
          <Price product={item.product} variant={item.variant} />
        </div>
      </div>
    </li>
  );
}

export function Benefits() {
  const icons = ["refresh", "shield", "headset", "check", "lock"];
  return (
    <section className="section wrap">
      <h2 className="h2 center">Why buy from the OneLaser Store</h2>
      <ul className="benefits">
        {benefits.map(([title, text], i) => (
          <li key={title}><Icon name={icons[i]} size={30} /><b>{title}</b><span>{text}</span></li>
        ))}
      </ul>
    </section>
  );
}

export function Footer() {
  const cols = [
    ["Shop", [["Laser Machines", "/collections/machines"], ["Accessories", "/collections/accessories"], ["Materials", "/collections/materials"], ["Black Friday Deals", "/collections/deals"], ["Compare machines", "/compare"]]],
    ["Machines", [["XRF Series", "/collections/xrf-series"], ["Cobra Series", "/collections/cobra-series"], ["Hydra Gen2", "/collections/hydra-gen2"], ["VertiGo", "/collections/vertigo"]]],
  ];
  const ext = [
    ["Support", [["Sales consultation", "https://www.1laser.com/pages/sales-consultation"], ["Contact Us", "https://www.1laser.com/pages/contact-us"], ["Common FAQ", "https://www.1laser.com/pages/faq"], ["Financing", "https://www.1laser.com/pages/financing"], ["Community", "https://www.1laser.com/pages/laser-engraving-community"]]],
    ["Policies", [["Shipping Policy", "https://www.1laser.com/pages/shipping-policy"], ["Refund Policy", "https://www.1laser.com/pages/refund-policy"], ["Warranty Policy", "https://www.1laser.com/pages/warranty-policy"], ["Payment Methods", "https://www.1laser.com/pages/payment-methods"], ["About Us", "https://www.1laser.com/pages/about-us"]]],
  ];
  return (
    <footer className="footer">
      <div className="wrap footer-top">
        <form className="newsletter" onSubmit={(e) => e.preventDefault()}>
          <h3>Stay in the loop</h3>
          <p>Deals, new machines and project ideas.</p>
          <div><input type="email" placeholder="Email address" aria-label="Email address" disabled /><button className="btn btn-light" disabled>Subscribe</button></div>
          <small>Newsletter sign-up is disabled in this draft.</small>
        </form>
        {cols.map(([title, links]) => (
          <div key={title}><p>{title}</p>{links.map(([l, to]) => <Link key={to} to={to}>{l}</Link>)}</div>
        ))}
        {ext.map(([title, links]) => (
          <div key={title}><p>{title}</p>{links.map(([l, href]) => <Link key={href} href={href}>{l}</Link>)}</div>
        ))}
      </div>
      <div className="wrap footer-bottom">
        <span>© 2026 OneLaser. Design draft for internal review — not the live store. Content and prices from 1laser.com (2026-11-16).</span>
      </div>
    </footer>
  );
}
