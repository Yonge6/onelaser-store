import { useEffect, useState } from "react";
import { img, money } from "../lib.js";

export const Link = ({ to, href, children, ...rest }) =>
  href ? (
    <a href={href} target="_blank" rel="noreferrer" {...rest}>{children}</a>
  ) : (
    <a href={`#${to}`} {...rest}>{children}</a>
  );

export const Icon = ({ name, size = 22 }) => {
  const paths = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" /></>,
    cart: <><path d="M3 4h2.5l2.2 11h10.6L20.5 7H7" /><circle cx="9.5" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></>,
    close: <path d="M6 6l12 12M18 6 6 18" />,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    chevron: <path d="m9 6 6 6-6 6" />,
    check: <path d="m5 12 4.5 4.5L19 7" />,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
    trash: <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12M10 11v5M14 11v5" />,
    truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17.5" cy="17.5" r="1.6" /></>,
    shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6z" />,
    refresh: <><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2" /><path d="M20 4v5h-5M4 20v-5h5" /></>,
    headset: <><path d="M5 13a7 7 0 0 1 14 0" /><rect x="3.5" y="13" width="4" height="6" rx="1.5" /><rect x="16.5" y="13" width="4" height="6" rx="1.5" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    card: <><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18" /></>,
    filter: <path d="M4 6h16l-6 7v5l-4 2v-7z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

/** DJI writes prices as "$439.00 USD" on product pages and "USD $439" on cards and in the cart. */
export const usd = (n) => `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function Price({ product, variant, from = false }) {
  const v = variant || product;
  return (
    <span className="price">
      {from && product.priceVaries && "From "}
      <span>{usd(v.price)} USD</span>
      {v.compareAt && <s>{usd(v.compareAt)} USD</s>}
    </span>
  );
}

export function QtyStepper({ value, onChange, min = 0 }) {
  return (
    <span className="qty">
      <button type="button" aria-label="Decrease quantity" disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(value + 1)}>+</button>
    </span>
  );
}

const LABELS = { rotary: "Rotary attachment", fume: "Fume extraction", optics: "Optics", cooling: "Water chiller", expansion: "Expansion", air: "Air assist", software: "Software & training", acrylic: "Acrylic sheets", leatherette: "Leatherette" };
export const productLabel = (p) => (p.kind === "machine" ? `${p.seriesName.replace(" Series", "")} laser` : LABELS[p.category] || "Accessory");

/** Home product card (DJI "figma-product-card"): gray media, series line, two-line name, "From USD $x". */
export function ProductCard({ product }) {
  return (
    <article className="pcard">
      <Link to={`/products/${product.handle}`} className="pcard-media"><img src={img(product.images[0], 500)} alt="" loading="lazy" /></Link>
      <div className="pcard-body">
        <p className="pcard-series">{product.compareAt && <span>Sale · </span>}{productLabel(product)}</p>
        <h3><Link to={`/products/${product.handle}`}>{product.name}</Link></h3>
        <span className="pcard-price"><strong>{product.priceVaries ? "From " : ""}USD {usd(product.price)}</strong></span>
      </div>
    </article>
  );
}

/** Collection card (DJI "collection-v2 card"): flat gray tile, title, "USD $x", round Shop → action. */
export function CollectionCard({ product }) {
  return (
    <article className="ccard">
      <Link to={`/products/${product.handle}`} className="ccard-link">
        {product.compareAt && <span className="ccard-tag">Sale</span>}
        {!product.available && <span className="ccard-tag muted">Sold out</span>}
        <span className="ccard-media"><img src={img(product.images[0], 700)} alt="" loading="lazy" /></span>
        <span className="ccard-content">
          <span className="ccard-details">
            <span className="ccard-title">{product.name}</span>
            <span className="ccard-price">USD <b>{money(product.price)}</b>{product.compareAt && <s>USD {money(product.compareAt)}</s>}</span>
          </span>
          <span className="ccard-action"><span>Shop</span><Icon name="arrow" size={18} /></span>
        </span>
      </Link>
    </article>
  );
}

export function Countdown({ endsAt }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const left = Math.max(0, new Date(endsAt).getTime() - now);
  const parts = [
    ["Days", Math.floor(left / 864e5)], ["Hours", Math.floor(left / 36e5) % 24],
    ["Minutes", Math.floor(left / 6e4) % 60], ["Seconds", Math.floor(left / 1e3) % 60],
  ];
  return (
    <div className="countdown" role="timer">
      {parts.map(([label, n]) => (
        <span key={label}><strong>{String(n).padStart(2, "0")}</strong><small>{label}</small></span>
      ))}
    </div>
  );
}

/** Horizontal slider with round overlay arrows (DJI "slider-shell"). */
export function Rail({ children, label, className = "" }) {
  const scroll = (e, dir) => {
    const track = e.currentTarget.parentElement.querySelector(".rail-track");
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className={`rail ${className}`} aria-label={label}>
      <button type="button" className="slider-arrow prev" aria-label="Previous" onClick={(e) => scroll(e, -1)}>‹</button>
      <div className="rail-track">{children}</div>
      <button type="button" className="slider-arrow next" aria-label="Next" onClick={(e) => scroll(e, 1)}>›</button>
    </div>
  );
}
