import { accessories, go, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { CartLine } from "../components/Chrome.jsx";
import { Icon, Link, ProductCard } from "../components/ui.jsx";

export function OrderSummary({ children, shipping }) {
  const { items, subtotal, savings } = useCart();
  return (
    <aside className="order-summary">
      <h2>Order summary</h2>
      {children}
      <div className="row"><span>Subtotal ({items.reduce((s, i) => s + i.qty, 0)} items)</span><b>{money(subtotal)}</b></div>
      {savings > 0 && <div className="row save"><span>Savings</span><b>−{money(savings)}</b></div>}
      <div className="row"><span>Shipping</span><span className="muted">{shipping || "Calculated at checkout"}</span></div>
      <div className="row"><span>Estimated tax</span><span className="muted">Calculated at checkout</span></div>
      <div className="row total"><span>Total</span><b>USD {money(subtotal)}</b></div>
    </aside>
  );
}

export default function Cart() {
  const { items, setQty } = useCart();
  const inCart = new Set(items.map((i) => i.handle));
  const suggestions = accessories.filter((a) => a.available && !inCart.has(a.handle) && ["software", "rotary", "expansion"].includes(a.category)).slice(0, 4);
  if (!items.length)
    return (
      <div className="wrap section center">
        <h1 className="h1">Your cart is empty</h1>
        <p className="lead">Find the laser machine that fits how you make.</p>
        <Link to="/collections/machines" className="btn btn-dark">Shop laser machines</Link>
      </div>
    );
  return (
    <div className="wrap section">
      <h1 className="h1">Cart</h1>
      <div className="cart-layout">
        <div>
          <ul className="lines lines-page">{items.map((i) => <CartLine key={i.variantId} item={i} setQty={setQty} />)}</ul>
          <ul className="perks perks-row">
            <li><Icon name="refresh" size={18} /> 30-Day Easy Returns</li>
            <li><Icon name="shield" size={18} /> 3-2-1 Warranty on XRF and Hydra</li>
            <li><Icon name="headset" size={18} /> U.S.-Based Support</li>
          </ul>
        </div>
        <div>
          <OrderSummary />
          <button type="button" className="btn btn-red btn-block" onClick={() => go("/checkout")}><Icon name="lock" size={18} /> Checkout</button>
          <Link to="/collections/machines" className="more center-link">Continue shopping ›</Link>
        </div>
      </div>
      {suggestions.length > 0 && (
        <section className="pdp-section">
          <h2 className="h2">Complete your setup</h2>
          <div className="grid grid-4">{suggestions.map((p) => <ProductCard key={p.handle} product={p} compact />)}</div>
        </section>
      )}
    </div>
  );
}
