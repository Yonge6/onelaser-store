import { useState } from "react";
import { t } from "../i18n.js";
import { asset, img, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { Icon, Link } from "../components/ui.jsx";

/* Layout, sizes and type follow the Insta360 Store checkout (store.insta360.com/order/confirm, measured 2026-11-17 at 1440):
   64px header with logo and "Secure" → gray page, "Check out as guest" 28px bold → left 742 white card (radius 16, padding 32/40)
   with Contact info and Shipping details (56px fields, radius 8, floating labels, Save pill), then collapsed Shipping method,
   Billing address and Payment method cards → right 434 card "Order summary" with Edit cart, coupon, totals and a 48px Place order pill.
   Layout only. Nothing typed here is stored or sent anywhere. */

const Field = ({ label, required = true, className = "", ...rest }) => (
  <label className={`ik-field ${className}`}>
    <input placeholder=" " {...rest} />
    <span>{label}{required && <i> *</i>}</span>
  </label>
);

const STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "Washington DC", "West Virginia", "Wisconsin", "Wyoming"];

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const [done, setDone] = useState(null);
  const [step, setStep] = useState(0); // 0 address, 1 shipping, 2 payment
  const [method, setMethod] = useState("card");
  const head = (
    <header className="ik-header">
      <div><Link to="/" className="brand"><img src={asset("onelaser-logo-transparent.svg")} alt="OneLaser" /><span>{t("Store")}</span></Link><span className="ik-secure"><Icon name="shield" size={18} />{t("Secure")}</span></div>
    </header>
  );
  if (done)
    return (
      <div className="ik">{head}
        <div className="ik-done"><span><Icon name="check" size={34} /></span><h1>{t("Thank you — this is a demo order")}</h1><p>{t("Confirmation page layout. No order was placed and no payment was taken. Demo total:")} {money(done)}.</p><Link to="/" className="ik-pill">{t("Back to store")}</Link></div>
      </div>
    );
  if (!items.length)
    return <div className="ik">{head}<div className="ik-done"><h1>{t("Nothing to check out")}</h1><Link to="/collections/machines" className="ik-pill">{t("Shop laser machines")}</Link></div></div>;
  const place = () => { setDone(subtotal); clear(); window.scrollTo(0, 0); };
  return (
    <div className="ik">
      {head}
      <div className="ik-wrap">
        <h1>{t("Check out as guest")}</h1>
        <div className="ik-layout">
          <div className="ik-left">
            <section className="ik-card">
              <h2>{t("Contact info")}</h2>
              <Field label={t("Email Address")} type="email" />
              <p className="ik-hint">{t("Design draft — do not enter real details. Nothing here is saved or sent.")} <Link href="https://www.1laser.com/account/login">{t("LOG IN")}</Link></p>
              <h2 className="ik-divided">{t("Shipping details")}</h2>
              {step === 0 ? (
                <div className="ik-grid">
                  <label className="ik-field ik-static c2"><span>{t("Country/Region")}<i> *</i></span><b>{t("United States")}</b></label>
                  <Field label={t("First name")} /><Field label={t("Last name")} />
                  <Field label={t("Mobile number")} type="tel" className="c2" />
                  <Field label={t("Street address")} className="c2" />
                  <Field label={t("Apt, Suite, Building (Optional)")} required={false} className="c2" />
                  <p className="ik-note c2">* The address should be in the country or region you have selected.<br />* To facilitate delivery, please do not enter a P.O. Box, FPO, APO address, or remote area.</p>
                  <Field label={t("City")} />
                  <label className="ik-field ik-select"><select defaultValue=""><option value="" disabled>State/Province/Region *</option>{STATES.map((s) => <option key={s}>{s}</option>)}</select><Icon name="chevron" size={14} /></label>
                  <Field label={t("ZIP")} className="c2" />
                  <div className="ik-actions c2"><button type="button" className="ik-pill" onClick={() => setStep(1)}>{t("Save")}</button></div>
                </div>
              ) : (
                <p className="ik-saved"><span>{t("Address saved for this demo.")}</span><button type="button" onClick={() => setStep(0)}>{t("Edit")}</button></p>
              )}
            </section>
            <section className={`ik-card${step < 1 ? " off" : ""}`}>
              <h2>{t("Shipping method")}</h2>
              {step === 1 && (
                <>
                  <label className="ik-choice on"><input type="radio" name="ship" defaultChecked /><span><b>{t("Freight delivery")}</b><em>{t("Rate and delivery estimate confirmed after address review")}</em></span><i>—</i></label>
                  <div className="ik-actions"><button type="button" className="ik-pill" onClick={() => setStep(2)}>{t("Continue")}</button></div>
                </>
              )}
              {step > 1 && <p className="ik-saved"><span>{t("Freight delivery")}</span><button type="button" onClick={() => setStep(1)}>{t("Edit")}</button></p>}
            </section>
            <section className={`ik-card${step < 2 ? " off" : ""}`}>
              <h2>{t("Billing address")}</h2>
              {step === 2 && <label className="ik-check"><input type="checkbox" defaultChecked /><span>{t("Same as shipping address")}</span></label>}
            </section>
            <section className={`ik-card${step < 2 ? " off" : ""}`}>
              <h2>{t("Payment method")}</h2>
              {step === 2 && (
                <>
                  {[["card", "Credit / debit card"], ["paypal", "PayPal"], ["shop", "Shop Pay"], ["finance", "Pay over time (financing)"]].map(([id, label]) => (
                    <label key={id} className={`ik-choice${method === id ? " on" : ""}`}><input type="radio" name="pay" checked={method === id} onChange={() => setMethod(id)} /><span><b>{t(label)}</b></span></label>
                  ))}
                  {method === "card" && (
                    <div className="ik-grid ik-cardfields">
                      <Field label={t("Card number")} className="c2" disabled /><Field label={t("Expiration (MM / YY)")} disabled /><Field label={t("Security code")} disabled />
                    </div>
                  )}
                  <p className="ik-hint">{t("Payment fields are disabled in this design draft.")}</p>
                </>
              )}
            </section>
          </div>
          <aside className="ik-card ik-summary">
            <div className="ik-summary-head"><h2>{t("Order summary")}</h2><Link to="/cart">{t("Edit cart")}</Link></div>
            <ul className="ik-lines">
              {items.map((i) => (
                <li key={i.variantId}>
                  <img src={img(i.variant.image || i.product.images[0], 160)} alt="" />
                  <span><b>{i.product.name}</b>{i.variant.title && <em>{i.variant.title}</em>}<em>× {i.qty}</em></span>
                  <strong>{money(i.total)}</strong>
                </li>
              ))}
            </ul>
            <h3>{t("Coupon code")}</h3>
            <div className="ik-coupon"><input placeholder={t("Enter your coupon code")} aria-label={t("Coupon code")} disabled /><button type="button" disabled aria-label={t("Apply")}><Icon name="arrow" size={18} /></button></div>
            <dl>
              <div><dt>{t("Subtotal :")}</dt><dd>{money(subtotal)}</dd></div>
              <div><dt>{t("Shipping :")}</dt><dd>{t("Calculated after address")}</dd></div>
              <div><dt>{t("Tax :")}</dt><dd>{t("Calculated after address")}</dd></div>
              <div className="total"><dt>{t("Total :")}</dt><dd>{money(subtotal)}</dd></div>
            </dl>
            <button type="button" className="ik-pill wide" disabled={step < 2} onClick={place}>{t("Place order")}</button>
            <p className="ik-legal">Demo only — no charge, no order. By clicking "Place order" on the live store you would accept the OneLaser sales and privacy policies.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
