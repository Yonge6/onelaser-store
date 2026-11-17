import { go, img, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { Icon, Link, QtyStepper } from "../components/ui.jsx";

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

const Trust = () => (
  <ul className="cart-trust">
    <li><Icon name="truck" size={30} /><span>Shipping options at checkout<br />Delivery estimated by address</span></li>
    <li><Icon name="lock" size={30} /><span>Secure, encrypted payment<br />Financing available</span></li>
    <li><Icon name="headset" size={30} /><span>U.S.-based support<br /><Link href="https://www.1laser.com/pages/contact-us">Contact us</Link></span></li>
  </ul>
);

/* Structure follows the DJI Store cart: item table → notes left, totals right → Continue Shopping / Check Out → trust row. */
export default function Cart() {
  const { items, setQty, subtotal, savings } = useCart();
  if (!items.length)
    return (
      <div className="wrap cart-page">
        <h1 className="h1">My Shopping Cart</h1>
        <div className="cart-empty">
          <b>Your cart is empty</b>
          <p className="muted">Explore OneLaser machines and add your favorite gear to get started.</p>
          <Link to="/collections/machines" className="btn btn-red">Continue Shopping</Link>
        </div>
        <Trust />
      </div>
    );
  return (
    <div className="wrap cart-page">
      <h1 className="h1">My Shopping Cart</h1>
      <div className="cart-table" role="table">
        <div className="cart-row cart-head" role="row"><span>Item</span><span>Item Price</span><span>Quantity</span><span>Price</span><span /></div>
        {items.map((i) => (
          <div key={i.variantId} className="cart-row" role="row">
            <Link to={`/products/${i.handle}`} className="cart-item">
              <img src={img(i.variant.image || i.product.images[0], 240)} alt="" />
              <span><b>{i.product.name}</b>{i.variant.title && <small>{i.variant.title}</small>}</span>
            </Link>
            <span data-label="Item Price">USD {money(i.variant.price)}{i.variant.compareAt && <s>{money(i.variant.compareAt)}</s>}</span>
            <span data-label="Quantity"><QtyStepper value={i.qty} min={1} onChange={(n) => setQty(i.variantId, n)} /></span>
            <span data-label="Price"><b>USD {money(i.total)}</b></span>
            <button type="button" className="icon-btn cart-remove" aria-label={`Remove ${i.product.name}`} onClick={() => setQty(i.variantId, 0)}><Icon name="close" size={18} /></button>
          </div>
        ))}
      </div>
      <div className="cart-bottom">
        <div className="cart-notes">
          <b>Have a coupon code?</b>
          <p className="muted">Proceed to checkout to apply discount codes and gift cards.</p>
          <p className="muted">30-Day Easy Returns · 3-2-1 Warranty on XRF and Hydra · U.S.-Based Support</p>
        </div>
        <div className="cart-totals">
          <div className="row subtotal"><span>CART SUBTOTAL:</span><b>USD {money(subtotal)}</b></div>
          {savings > 0 && <div className="row save"><span>You save:</span><b>−{money(savings)}</b></div>}
          <div className="row"><span>Tax:</span><span>Calculated at checkout</span></div>
          <div className="row"><span>Shipping:</span><span>Calculated at checkout</span></div>
        </div>
      </div>
      <div className="cart-actions">
        <Link to="/collections/machines" className="btn btn-soft">Continue Shopping</Link>
        <button type="button" className="btn btn-red" onClick={() => go("/checkout")}>Check Out</button>
      </div>
      <Trust />
    </div>
  );
}
