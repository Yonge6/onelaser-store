import { useEffect, useState } from "react";
import { img, money, saving } from "../lib.js";

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
    truck: <><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17.5" cy="17.5" r="1.6" /></>,
    shield: <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.500 7-10V6z" />,
    refresh: <><path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2" /><path d="M20 4v5h-5M4 20v-5h5" /></>,
    headset: <><path d="M5 13a7 7 0 0 1 14 0" /><rect x="3.500" y="13" width="4" height="6" rx="1.500" /><rect x="16.500" y="13" width="4" height="6" rx="1.500" /></>,
    lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
    filter: <path d="M4 6h16l-6 7v5l-4 2v-7z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

export function Price({ product, variant, from = false, large = false }) {
  const v = variant || product;
  return (
    <span className={`price${large ? " price-lg" : ""}`}>
      {from && product.priceVaries && <span className="price-from">From </span>}
      <span className={v.compareAt ? "price-now sale" : "price-now"}>{money(v.price)}</span>
      {v.compareAt && <s>{money(v.compareAt)}</s>}
    </span>
  );
}

export function QtyStepper({ value, onChange, min = 0 }) {
  return (
    <span className="qty">
      <button type="button" aria-label="Decrease quantity" onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" onClick={() => onChange(value + 1)}>+</button>
    </span>
  );
}

const LABELS = { rotary: "Rotary attachment", fume: "Fume extraction", optics: "Optics", cooling: "Water chiller", expansion: "Expansion", air: "Air assist", software: "Software & training", acrylic: "Acrylic sheets", leatherette: "Leatherette" };
export const productLabel = (p) => (p.kind === "machine" ? `${p.seriesName.replace(" Series", "")} laser` : LABELS[p.category] || "Accessory");

/** Product card (DJI Store): image, category label, name, price, "Shop →". Sale badge follows Bambu's "$X OFF". */
export function ProductCard({ product, shop = true }) {
  const off = saving(product);
  return (
    <Link to={`/products/${product.handle}`} className="card">
      <span className="card-media">
        {off > 0 && <span className="badge badge-sale">{money(off)} OFF</span>}
        {!product.available && <span className="badge badge-muted">Sold out</span>}
        <img src={img(product.images[0], 600)} alt="" loading="lazy" />
      </span>
      <span className="card-body">
        <span className="card-label">{productLabel(product)}</span>
        <b className="card-name">{product.name}</b>
        <span className="card-price">
          {product.priceVaries && "From "}USD <strong className={product.compareAt ? "sale" : ""}>{money(product.price)}</strong>
          {product.compareAt && <s>{money(product.compareAt)}</s>}
        </span>
        {shop && <span className="card-shop">Shop →</span>}
      </span>
    </Link>
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
        <div key={label}><b>{String(n).padStart(2, "0")}</b><span>{label}</span></div>
      ))}
    </div>
  );
}

/** Horizontal scroll rail with arrow buttons (DJI "What's Hot"). */
export function Rail({ children, label }) {
  const scroll = (e, dir) => {
    const track = e.currentTarget.parentElement.querySelector(".rail-track");
    track.scrollBy({ left: dir * track.clientWidth * 0.8, behavior: "smooth" });
  };
  return (
    <div className="rail" aria-label={label}>
      <button type="button" className="rail-arrow prev" aria-label="Previous" onClick={(e) => scroll(e, -1)}>‹</button>
      <div className="rail-track">{children}</div>
      <button type="button" className="rail-arrow next" aria-label="Next" onClick={(e) => scroll(e, 1)}>›</button>
    </div>
  );
}
