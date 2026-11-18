import { img, money } from "../lib.js";
import { t } from "../i18n.js";
import { useCart } from "../cart.jsx";
import { Icon, Link } from "../components/ui.jsx";

/* Layout, sizes and type follow the Insta360 Store cart (store.insta360.com/cart, measured 2026-11-17 at 1440):
   gray page #F8F9FC, "Shopping cart" 32px bold, left column 800 of white cards (radius 16, padding 32/40) with one line per item
   (120px image, 20/24 bold name, tag pill, 24px steppers, price right), right 480 card "Order details" (20px bold) with
   16px rows, 24px extra-bold total, 56px pill Check out and service notes. */

export function OrderSummary({ children, shipping }) {
  const { items, subtotal, savings } = useCart();
  return (
    <aside className="order-summary">
      <h2>{t("Order summary")}</h2>
      {children}
      <div className="row"><span>{t("Subtotal")} ({items.reduce((s, i) => s + i.qty, 0)} {t("items")})</span><b>{money(subtotal)}</b></div>
      {savings > 0 && <div className="row save"><span>{t("Savings")}</span><b>−{money(savings)}</b></div>}
      <div className="row"><span>{t("Shipping")}</span><span className="muted">{shipping || "Calculated at checkout"}</span></div>
      <div className="row total"><span>{t("Total")}</span><b>USD {money(subtotal)}</b></div>
    </aside>
  );
}

export default function Cart() {
  const { items, setQty, subtotal, savings } = useCart();
  if (!items.length)
    return (
      <section className="ic">
        <div className="ic-wrap">
          <h1>{t("Shopping cart")}</h1>
          <div className="ic-card ic-empty"><Icon name="cart" size={40} /><b>{t("Your cart is empty")}</b><Link to="/collections/machines" className="ic-checkout">{t("Shop laser machines")}</Link></div>
        </div>
      </section>
    );
  return (
    <section className="ic">
      <div className="ic-wrap">
        <h1>{t("Shopping cart")}</h1>
        <div className="ic-layout">
          <div className="ic-left">
            <div className="ic-card ic-note"><Icon name="truck" size={22} /><p><b>{t("Delivery by address.")}</b> {t("Estimate and shipping rate are shown at checkout.")}<br />30-day easy returns on every order.</p></div>
            <div className="ic-card ic-lines">
              {items.map((i) => (
                <article key={i.variantId} className="ic-line">
                  <Link to={`/products/${i.product.handle}`} className="ic-line-media"><img src={img(i.variant.image || i.product.images[0], 300)} alt="" /></Link>
                  <div className="ic-line-info">
                    <h2><Link to={`/products/${i.product.handle}`}>{i.product.name}</Link></h2>
                    <span className="ic-tag">30-Day Returns</span>
                    {i.variant.title && <p>{i.variant.title}</p>}
                  </div>
                  <div className="ic-qty">
                    <button type="button" aria-label={t("Decrease quantity")} onClick={() => setQty(i.variantId, i.qty - 1)}>−</button>
                    <span aria-live="polite">{i.qty}</span>
                    <button type="button" aria-label={t("Increase quantity")} onClick={() => setQty(i.variantId, i.qty + 1)}>+</button>
                  </div>
                  <div className="ic-line-price">{money(i.total)}{i.variant.compareAt && <s>{money(i.variant.compareAt * i.qty)}</s>}</div>
                  <button type="button" className="ic-remove" aria-label={`Remove ${i.product.name}`} onClick={() => setQty(i.variantId, 0)}><Icon name="trash" size={18} /></button>
                </article>
              ))}
            </div>
          </div>
          <aside className="ic-card ic-details">
            <h2>{t("Order details")}</h2>
            <p><span>{t("Price :")}</span><span>{money(subtotal + savings)}</span></p>
            {savings > 0 && <p className="save"><span>{t("Savings :")}</span><span>−{money(savings)}</span></p>}
            <p><span>{t("Shipping :")}</span><span>{t("Calculated at checkout")}</span></p>
            <p><span>{t("Tax :")}</span><span>{t("Calculated at checkout")}</span></p>
            <p className="total"><span>{t("Estimated total")}</span><b>{money(subtotal)}</b></p>
            <Link to="/checkout" className="ic-checkout">{t("Check out")}</Link>
            <Link to="/collections/machines" className="ic-continue">{t("Continue shopping")}</Link>
            <h3>{t("Shipped by OneLaser")}</h3>
            <ul>
              <li><Icon name="truck" size={20} /><span><b>{t("Delivery by address")}</b>{t("All items ship according to the item with the latest shipping date.")}</span></li>
              <li><Icon name="refresh" size={20} /><span><b>30-day return period</b>{t("Terms and conditions apply.")}</span></li>
              <li><Icon name="headset" size={20} /><span><b>{t("U.S.-based support")}</b>{t("Talk to real laser engineers.")}</span></li>
              <li><Icon name="lock" size={20} /><span><b>{t("Pay your way")}</b>{t("Card, PayPal, Shop Pay or financing.")}</span></li>
            </ul>
          </aside>
        </div>
      </div>
    </section>
  );
}
