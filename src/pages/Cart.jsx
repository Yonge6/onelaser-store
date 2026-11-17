import { go, img, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { ServiceStrip } from "../components/Chrome.jsx";
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

/* Layout, sizes and type follow the DJI Store cart (measured 2026-11-16):
   726/150/150/150/24 table → notes left (600) + totals right (500) → Continue Shopping / Check Out → service strip. */
export default function Cart() {
  const { items, setQty, subtotal, savings } = useCart();
  return (
    <section className="cart">
      <div className="cart-notice"><p className="container">Large machines ship by freight. Delivery timing is confirmed after checkout.</p></div>
      <div className="cart-article">
        <div className="container">
          <h1>My Shopping Cart</h1>
          {!items.length ? (
            <div className="cart-empty">
              <b>Your cart is empty</b>
              <p>Explore OneLaser products and add your favorite gear to get started.</p>
              <Link to="/collections/machines" className="btn-primary">Continue Shopping</Link>
            </div>
          ) : (
            <>
              <div className="cart-table">
                <div className="cart-head"><span>Item</span><span>Item Price</span><span>Quantity</span><span>Price</span><span /></div>
                {items.map((i) => (
                  <article key={i.variantId} className="cart-line">
                    <div className="cart-product">
                      <Link to={`/products/${i.handle}`} className="cart-media"><img src={img(i.variant.image || i.product.images[0], 300)} alt="" /></Link>
                      <div><Link to={`/products/${i.handle}`} className="cart-title">{i.product.name}</Link>{i.variant.title && <small>{i.variant.title}</small>}</div>
                    </div>
                    <div data-label="Item Price">USD {money(i.variant.price)}</div>
                    <div data-label="Quantity"><QtyStepper value={i.qty} min={1} onChange={(n) => setQty(i.variantId, n)} /></div>
                    <div data-label="Price">USD {money(i.total)}</div>
                    <button type="button" className="cart-remove" aria-label={`Remove ${i.product.name}`} onClick={() => setQty(i.variantId, 0)}><Icon name="trash" size={18} /></button>
                  </article>
                ))}
              </div>
              <div className="cart-summary">
                <div className="cart-benefits">
                  <p>30-Day Easy Returns · 3-2-1 Warranty on XRF and Hydra · U.S.-Based Support.</p>
                  <Link href="https://www.1laser.com/pages/financing">Learn more about financing ›</Link>
                  <p>Have a Coupon Code?</p>
                  <p className="coupon-text">Proceed to checkout to use coupons and gift cards.</p>
                </div>
                <div className="cart-totals">
                  <div className="subtotal"><span>CART SUBTOTAL:</span><strong>USD {money(subtotal)}</strong></div>
                  {savings > 0 && <div><span>You save:</span><span>USD {money(savings)}</span></div>}
                  <div><span>Tax:</span><span>Calculated at checkout</span></div>
                  <div><span>Shipping:</span><span>Calculated at checkout</span></div>
                </div>
              </div>
              <div className="cart-actions">
                <Link to="/collections/machines" className="btn-soft">Continue Shopping</Link>
                <button type="button" className="btn-primary" onClick={() => go("/checkout")}>Check Out</button>
              </div>
            </>
          )}
        </div>
      </div>
      <ServiceStrip />
    </section>
  );
}
