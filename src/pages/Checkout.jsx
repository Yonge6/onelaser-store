import { useState } from "react";
import { asset, img, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { Icon, Link } from "../components/ui.jsx";

/* Floating-label input, as in the DJI Store (Shopify) checkout: 49px box, radius 12, label shrinks to 12px when filled. */
const Field = ({ label, icon, className = "", ...rest }) => (
  <label className={`co-field ${className}`}>
    <input placeholder=" " {...rest} />
    <span>{label}</span>
    {icon && <i aria-hidden="true">{icon === "?" ? <b className="co-help">?</b> : <Icon name={icon} size={16} />}</i>}
  </label>
);

const Select = ({ label, children, className = "", ...rest }) => (
  <label className={`co-field co-select ${className}`}>
    <select {...rest}>{children}</select>
    <span>{label}</span>
    <i aria-hidden="true"><Icon name="chevron" size={14} /></i>
  </label>
);

const STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "Washington DC", "West Virginia", "Wisconsin", "Wyoming"];

const METHODS = [
  ["card", "Credit card", null, ["VISA", "MC", "AMEX"]],
  ["shop", "Shop Pay", "Pay in full or in installments", ["shop"]],
  ["paypal", "PayPal", null, ["PayPal"]],
  ["finance", "Pay over time", "Financing, subject to approval", ["0% APR"]],
];

/* Module order, sizes and type follow the DJI Store checkout (measured 2026-11-16, 1440 and 375):
   65px header → 500px form column / 400px summary on #f5f5f5 → notice, express, Contact, Delivery,
   Shipping method, Payment (radio list), Pay now → policy links.
   Layout only. Nothing typed here is stored or sent anywhere; card fields are disabled. */
export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [done, setDone] = useState(null);
  const [method, setMethod] = useState("card");
  const [open, setOpen] = useState(false);
  if (done)
    return (
      <div className="checkout-done">
        <span className="done-mark"><Icon name="check" size={34} /></span>
        <h1>Thank you — this is a demo order</h1>
        <p>Confirmation page layout. No order was placed and no payment was taken. Demo total: {money(done)}.</p>
        <Link to="/" className="btn-primary">Back to store</Link>
      </div>
    );
  if (!items.length)
    return <div className="checkout-done"><h1>Nothing to check out</h1><Link to="/collections/machines" className="btn-primary">Shop laser machines</Link></div>;
  const place = (e) => {
    e.preventDefault();
    setDone(subtotal);
    clear();
    window.scrollTo(0, 0);
  };
  const count = items.reduce((s, i) => s + i.qty, 0);
  const totalRow = (
    <div className="co-total"><span>Total</span><span><small>USD</small><b>{money(subtotal)}</b></span></div>
  );
  return (
    <div className="co">
      <header className="co-header">
        <div className="co-header-inner">
          <Link to="/" className="brand"><img src={asset("onelaser-logo-transparent.svg")} alt="OneLaser" /><span>Store</span></Link>
          <Link to="/cart" className="co-bag" aria-label="Back to cart"><Icon name="cart" size={22} /></Link>
        </div>
      </header>
      <div className="co-body">
        <aside className={`co-side${open ? " open" : ""}`}>
          <button type="button" className="co-toggle" aria-expanded={open} onClick={() => setOpen(!open)}>
            <span>Order summary <Icon name="chevron" size={14} /></span>
            <b>{money(subtotal)}</b>
          </button>
          <div className="co-summary">
            <ul className="co-lines">
              {items.map((i) => (
                <li key={i.variantId}>
                  <span className="co-thumb"><img src={img(i.variant.image || i.product.images[0], 140)} alt="" /><em>{i.qty}</em></span>
                  <span className="co-line-name">{i.product.name}{i.variant.title && <small>{i.variant.title}</small>}</span>
                  <span>{money(i.total)}</span>
                </li>
              ))}
            </ul>
            <div className="co-discount">
              <Field label="Discount code or gift card" aria-label="Discount code or gift card" disabled />
              <button type="button" disabled>Apply</button>
            </div>
            <div className="co-costs">
              <div><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div><span>Shipping</span><span className="co-muted">Enter shipping address</span></div>
              <div><span>Estimated taxes</span><span className="co-muted">Calculated after address</span></div>
            </div>
            {totalRow}
          </div>
        </aside>
        <main className="co-main">
          <form onSubmit={place} autoComplete="off">
            <p className="co-notice"><b className="co-help">i</b><span>Design draft — don’t enter real details. Nothing is saved or sent.</span></p>
            <section className="co-express">
              <h2>Express checkout</h2>
              <div>
                <button type="button" disabled className="x-shop">shop</button>
                <button type="button" disabled className="x-paypal">PayPal</button>
                <button type="button" disabled className="x-gpay">G Pay</button>
              </div>
              <p className="co-or"><span>OR</span></p>
            </section>
            <section>
              <div className="co-title"><h2>Contact</h2><a href="#/checkout" onClick={(e) => e.preventDefault()}>Sign in</a></div>
              <Field label="Email" type="email" icon="?" />
              <label className="co-check"><input type="checkbox" /><span>Receive news and promotional offers by email about all OneLaser products.</span></label>
            </section>
            <section>
              <div className="co-title"><h2>Delivery</h2></div>
              <div className="co-grid">
                <Select label="Country/Region" className="c6" defaultValue="United States"><option>United States</option><option>Canada</option></Select>
                <Field label="First name" className="c3" /><Field label="Last name" className="c3" />
                <Field label="Address" className="c6" icon="search" />
                <Field label="Apartment, suite, etc. (optional)" className="c6" />
                <Field label="City" className="c2" />
                <Select label="State" className="c2" defaultValue="California">{STATES.map((s) => <option key={s}>{s}</option>)}</Select>
                <Field label="ZIP code" className="c2" />
                <Field label="Phone (optional)" type="tel" className="c6" icon="?" />
              </div>
              <h3>Shipping method</h3>
              <p className="co-placeholder">Enter your shipping address to view available shipping methods.</p>
            </section>
            <section>
              <div className="co-title"><h2>Payment</h2></div>
              <p className="co-sub">All transactions are secure and encrypted.</p>
              <div className="co-methods" role="radiogroup" aria-label="Payment method">
                {METHODS.map(([id, label, note, marks]) => (
                  <div key={id} className={`co-method${method === id ? " on" : ""}`}>
                    <label>
                      <input type="radio" name="pay" checked={method === id} onChange={() => setMethod(id)} />
                      <b>{label}</b>
                      {note && <span className="co-muted">· {note}</span>}
                      <span className="co-marks">{marks.map((m) => <em key={m}>{m}</em>)}</span>
                    </label>
                    {id === "card" && method === "card" && (
                      <div className="co-card">
                        <div className="co-grid">
                          <Field label="Card number" className="c6" icon="lock" disabled />
                          <Field label="Expiration date (MM / YY)" className="c3" disabled />
                          <Field label="Security code" className="c3" icon="?" disabled />
                          <Field label="Name on card" className="c6" disabled />
                        </div>
                        <label className="co-check"><input type="checkbox" defaultChecked /><span>Use shipping address as billing address</span></label>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
            <div className="co-mobile-total">
              <span className="co-thumb"><img src={img(items[0].variant.image || items[0].product.images[0], 140)} alt="" /></span>
              <span className="co-line-name"><b>Total</b><small>{count} {count === 1 ? "item" : "items"}</small></span>
              <span><small>USD</small><b>{money(subtotal)}</b></span>
            </div>
            <button className="co-pay">Pay now</button>
            <p className="co-demo">Demo only — no charge, no order.</p>
            <footer className="co-footer"><a href="#/checkout" onClick={(e) => e.preventDefault()}>Terms and policies</a><a href="#/checkout" onClick={(e) => e.preventDefault()}>Cookies</a></footer>
          </form>
        </main>
      </div>
    </div>
  );
}
