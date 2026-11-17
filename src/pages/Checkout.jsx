import { useState } from "react";
import { asset, img, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { Icon, Link } from "../components/ui.jsx";
import { OrderSummary } from "./Cart.jsx";

const Field = ({ label, wide, ...rest }) => (
  <label className={`field${wide ? " wide" : ""}`}><span>{label}</span><input {...rest} /></label>
);

/** Checkout layout only. Nothing typed here is stored or sent anywhere. */
export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [done, setDone] = useState(null);
  const [method, setMethod] = useState("card");
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
  return (
    <div className="checkout">
      <div className="checkout-main">
        <header className="checkout-head">
          <Link to="/" className="brand"><img src={asset("onelaser-logo-transparent.svg")} alt="OneLaser" /><span>Store</span></Link>
          <Link to="/cart" className="back-link">‹ Back to cart</Link>
        </header>
        <p className="demo-note">Design draft: this page shows the checkout layout only. Do not enter real personal or payment details — nothing is saved or submitted.</p>
        <form onSubmit={place} autoComplete="off">
          <section>
            <h2>Express checkout</h2>
            <div className="express"><button type="button" disabled>Shop Pay</button><button type="button" disabled>PayPal</button><button type="button" disabled>G Pay</button></div>
            <p className="or"><span>OR</span></p>
          </section>
          <section>
            <h2>Contact</h2>
            <div className="fields"><Field label="Email" type="email" wide placeholder="you@example.com" /></div>
            <label className="check"><input type="checkbox" /> Email me with news and offers</label>
          </section>
          <section>
            <h2>Delivery</h2>
            <div className="fields">
              <label className="field wide"><span>Country/Region</span><select defaultValue="United States"><option>United States</option><option>Canada</option></select></label>
              <Field label="First name" /><Field label="Last name" />
              <Field label="Company (optional)" wide />
              <Field label="Address" wide />
              <Field label="City" /><Field label="State" /><Field label="ZIP code" /><Field label="Phone" type="tel" />
            </div>
          </section>
          <section>
            <h2>Shipping method</h2>
            <div className="choice on"><span><b>Freight delivery</b><small>Rate and delivery estimate confirmed after address entry</small></span><span>—</span></div>
          </section>
          <section>
            <h2>Payment</h2>
            <p className="muted small"><Icon name="lock" size={14} /> All transactions are secure and encrypted.</p>
            {[["card", "Credit card"], ["paypal", "PayPal"], ["finance", "Pay over time (financing)"]].map(([id, label]) => (
              <label key={id} className={`choice${method === id ? " on" : ""}`}>
                <span><input type="radio" name="pay" checked={method === id} onChange={() => setMethod(id)} /> <b>{label}</b></span>
              </label>
            ))}
            {method === "card" && (
              <div className="fields card-fields">
                <Field label="Card number" wide disabled placeholder="Disabled in design draft" />
                <Field label="Expiration (MM / YY)" disabled /><Field label="Security code" disabled />
                <Field label="Name on card" wide disabled />
              </div>
            )}
          </section>
          <button className="btn-primary block">Place demo order</button>
          <p className="muted small center">Demo only — no charge, no order.</p>
        </form>
      </div>
      <div className="checkout-side">
        <OrderSummary>
          <ul className="mini-lines">
            {items.map((i) => (
              <li key={i.variantId}>
                <span className="mini-img"><img src={img(i.variant.image || i.product.images[0], 140)} alt="" /><em>{i.qty}</em></span>
                <span><b>{i.product.name}</b>{i.variant.title && <small>{i.variant.title}</small>}</span>
                <b>{money(i.total)}</b>
              </li>
            ))}
          </ul>
          <div className="discount"><input placeholder="Discount code or gift card" aria-label="Discount code" disabled /><button type="button" className="btn-soft" disabled>Apply</button></div>
        </OrderSummary>
      </div>
    </div>
  );
}
