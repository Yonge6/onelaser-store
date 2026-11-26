import { useEffect, useState } from "react";
import { t } from "../i18n.js";
import { asset, frontImg, img, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { footer } from "../data/site.js";
import { Icon, Link } from "../components/ui.jsx";
import { OfferGate, quoteCell, quoteText } from "./Cart.jsx";
import { TermsBox, useTerms } from "../components/Terms.jsx";
import AddressSuggest from "../components/AddressSuggest.jsx";
import { SHIP_TEXT, isPoBox, shipQuote, shipRegion, zipMatchesState } from "../data/shipping.js";

/* Checkout after xTool's (Shopify one-page checkout, xtool.com/checkout, read 2026-11-26): header with the logo and
   "Data encrypted"; left: express buttons, Contact, Delivery (city · state · ZIP on one line), Shipping method (appears
   once the address is known), Payment, the policies box and one "Pay now"; right (grey): support contact, items,
   discount code, totals with estimated taxes. On phones the summary folds into a bar at the top.
   Kept from before: address suggestions, live shipping from the store's rates, ZIP/state reminder, no P.O. Box / APO /
   territories, accepted policies, the tax-exempt note, and no order once Black Friday prices have ended.
   Design draft: nothing typed here is stored or sent, and payment fields are disabled. Checks out the lines ticked in the cart. */

// Tax-exempt buyers: the state's official resale certificate (OneLaser ships from California; 1laser.com has no form of its own).
// Exemption requests go to the sales team (sales@1laser.com, as listed in the site footer). TODO(team): finance to confirm.
const DRAFT = "onelaser-checkout-draft";
const TAX_FORM = "https://www.cdtfa.ca.gov/formspubs/cdtfa230.pdf";
const STATES = ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"];
const REQUIRED = ["email", "first", "last", "phone", "street", "city", "state", "zip"];
/* Express buttons as on the live checkout (Shop Pay, PayPal, Amazon Pay, Google Pay), Shopify's own logos. */
const EXPRESS = [["shop-pay", "Shop Pay", "#5a31f4"], ["paypal", "PayPal", "#ffc439"], ["amazon-pay", "Amazon Pay", "#ffd814"], ["google-pay", "Google Pay", "#000"]];

const Field = ({ label, name, value, onChange, bad, required = true, className = "", ...rest }) => (
  <label className={`ik-field ${bad ? "bad " : ""}${className}`}>
    <input placeholder=" " name={name} value={value || ""} onChange={(e) => onChange(name, e.target.value)} aria-invalid={bad || undefined} {...rest} />
    <span>{label}{required && <i> *</i>}</span>
  </label>
);
const picture = (i) => (i.product.kind === "machine" ? frontImg(i.product) : i.variant.image || i.product.images[0]);

export default function Checkout() {
  const { picked: items, subtotal, savings, clearPicked } = useCart();
  const [done, setDone] = useState(null);
  // the draft (address, notes) survives a refresh, e.g. "Refresh prices" when Black Friday ends mid-checkout
  const draft = useState(() => { try { return JSON.parse(sessionStorage.getItem(DRAFT)) || {}; } catch { return {}; } })[0];
  // a ZIP entered in the cart's delivery box starts the address here
  const [f, setF] = useState(() => (draft.f && { ...draft.f, state: draft.f.state === "Washington DC" ? "District of Columbia" : draft.f.state }) || { state: "", zip: (() => { try { return sessionStorage.getItem("onelaser-ship-zip") || ""; } catch { return ""; } })() });
  useEffect(() => { try { sessionStorage.setItem(DRAFT, JSON.stringify({ f })); } catch { /* private mode: this page only */ } }, [f]);
  const [err, setErr] = useState({});
  // the policies must be accepted before the order is placed, however the buyer got here (cart, Buy now, a new tab)
  const [terms, setTerms] = useTerms();
  const [termsBad, setTermsBad] = useState(false);
  const [method, setMethod] = useState("card");
  const [sameBill, setSameBill] = useState(true);
  const [code, setCode] = useState("");
  const [codeMsg, setCodeMsg] = useState("");
  const [express, setExpress] = useState("");
  const [open, setOpen] = useState(false); // phone: order summary folded
  const [ended, setEnded] = useState(() => !!window.__saleEnded); // Black Friday ended while checkout was open: hold the order
  useEffect(() => { const h = () => setEnded(true); window.addEventListener("onelaser:sale-ended", h); return () => window.removeEventListener("onelaser:sale-ended", h); }, []);
  const set = (k, v) => { setF((x) => ({ ...x, [k]: v })); if (err[k]) setErr((e) => ({ ...e, [k]: false })); };
  const machines = items.some((i) => i.product.kind === "machine");
  const count = items.reduce((s, i) => s + i.qty, 0);

  const head = (
    <header className="kx-header">
      <div className="kx-header-in">
        <Link to="/" className="kx-logo"><img src={asset("onelaser-logo-transparent.svg")} alt="OneLaser" /></Link>
        <span className="kx-secure"><Icon name="lock" size={14} />{t("Data encrypted")}</span>
        <Link to="/cart" className="kx-bag" aria-label={t("Back to cart")}><Icon name="cart" size={20} /></Link>
      </div>
    </header>
  );
  if (done)
    return (
      <div className="ik">{head}
        <div className="ik-done"><span><Icon name="check" size={34} /></span><h1>{t("Thank you — this is a demo order")}</h1><p>{t("Confirmation page layout. No order was placed and no payment was taken. Demo total:")} {money(done)}.</p><Link to="/" className="ik-pill">{t("Back to store")}</Link></div>
      </div>
    );
  if (!items.length)
    return <div className="ik">{head}<div className="ik-done"><h1>{t("Nothing to check out")}</h1><p>{t("Tick the items you want in your cart, or keep shopping.")}</p><div className="ik-done-btns"><Link to="/cart" className="ik-pill">{t("Back to cart")}</Link><Link to="/collections/machines" className="ik-pill ghost">{t("Shop laser machines")}</Link></div></div></div>;

  // shipping to the ZIP typed (the store's own rates, data/shipping.js), live; the total and "Pay now" include it
  const region = shipRegion(f.zip);
  const quote = shipQuote(items, f.zip);
  const shipFee = quote ? quote.fee : null;
  const total = subtotal + (shipFee || 0);
  const shipBlocked = region === "military" || region === "territory";

  const check = () => {
    const bad = {};
    REQUIRED.forEach((k) => { if (!String(f[k] || "").trim()) bad[k] = true; });
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) bad.email = true;
    if (f.zip && !/^\d{5}(-\d{4})?$/.test(f.zip.trim())) bad.zip = true;
    // the shipping policy: no APO/FPO, no direct shipping to U.S. territories
    if (shipBlocked) bad.zip = true;
    if (f.zip && !region) bad.zip = true; // not a U.S. ZIP we know
    if (isPoBox(f.street)) bad.street = true;
    if (isPoBox(f.apt)) bad.apt = true;
    return bad;
  };
  const payNow = () => {
    if (ended) return;
    const bad = check();
    setErr(bad);
    if (Object.keys(bad).length) {
      // after React has marked the fields: bring the first one into view and put the cursor in it
      requestAnimationFrame(() => { const el = document.querySelector(".ik-field.bad, .ik-select.bad"); el?.scrollIntoView({ behavior: "smooth", block: "center" }); el?.querySelector("input, select")?.focus({ preventScroll: true }); });
      return;
    }
    if (!terms) { setTermsBad(true); document.getElementById("kx-terms")?.focus(); return; }
    try { sessionStorage.removeItem(DRAFT); } catch { /* ignore */ }
    setDone(total); clearPicked(); window.scrollTo(0, 0);
  };
  const applyCode = () => setCodeMsg(code.trim() ? t("Codes are checked on the live store. This draft does not apply discounts.") : t("Enter a code first."));
  const errors = Object.keys(err).filter((k) => err[k]).length;

  const summary = (
    <div className="kx-sum">
      <div className="kx-help">
        <span><Icon name="phone" size={16} /><b>{footer.contact[0][1]}</b><small>{t("Talk to a U.S.-based laser expert")}</small></span>
        <span><Icon name="mail" size={16} /><b>cs@1laser.com</b><small>{t("We're here to help")}</small></span>
      </div>
      <ul className="kx-lines">
        {items.map((i) => (
          <li key={i.variantId}>
            <span className="kx-thumb"><img src={img(picture(i), 160)} alt="" /><em>{i.qty}</em></span>
            <span className="kx-name"><b>{i.product.name}</b>{i.variant.title && i.variant.title !== "Default Title" && <small>{i.variant.title}</small>}</span>
            <span className="kx-price">{i.variant.compareAt > i.variant.price && <s>{money(i.variant.compareAt * i.qty)}</s>}<b>{money(i.total)}</b></span>
          </li>
        ))}
      </ul>
      <div className="kx-code">
        <input value={code} onChange={(e) => { setCode(e.target.value); setCodeMsg(""); }} placeholder={t("Discount code or gift card")} aria-label={t("Discount code or gift card")} onKeyDown={(e) => e.key === "Enter" && applyCode()} />
        <button type="button" onClick={applyCode} className={code.trim() ? "on" : ""}>{t("Apply")}</button>
      </div>
      {codeMsg && <p className="ik-code-msg" role="status">{codeMsg}</p>}
      <dl className="kx-totals">
        <div><dt>{t("Subtotal")}</dt><dd>{money(subtotal)}</dd></div>
        {/* live: changes as soon as a ZIP is typed */}
        <div><dt>{t("Shipping")}</dt><dd>{quote ? quoteCell(quote) : region && !shipBlocked ? t(region === "lower48" ? "Fixed rate" : SHIP_TEXT[region][0]) : t("Enter shipping address")}</dd></div>
        {/* the live checkout estimates the full local sales tax from the address; the draft does not copy rates */}
        <div><dt>{t("Estimated taxes")}</dt><dd>{t("Calculated from your address")}</dd></div>
        <div className="tot"><dt>{t("Total")}<small>{t("before tax")}</small></dt><dd><small>USD</small>{money(total)}</dd></div>
      </dl>
      {savings > 0 && <p className="kx-saved"><Icon name="check" size={14} />{t("Total savings")} <b>{money(savings)}</b></p>}
      <p className="ik-tax-note">{t("The final tax and total are confirmed by email after you place your order.")}</p>
      <div className="ik-tax">
        <p><b>{t("Buying tax-exempt or for resale?")}</b>{t("Download the California resale certificate (CDTFA-230), or use your own state's exemption form. Email it to our sales team at sales@1laser.com before you pay so they can apply your exemption.")}</p>
        <a href={TAX_FORM} target="_blank" rel="noreferrer" download><Icon name="download" size={16} />{t("Download the California form (PDF)")}</a>
      </div>
    </div>
  );

  return (
    <div className="ik kx">
      {head}
      <button type="button" className={`kx-fold${open ? " open" : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>{t("Order summary")} ({count})<Icon name="chevron" size={14} /></span>
        <span className="kx-fold-total">{savings > 0 && <s>{money(total + savings)}</s>}<b>{money(total)}</b></span>
      </button>
      {open && <div className="kx-fold-body">{summary}</div>}
      <div className="kx-layout">
        <main className="kx-main">
          <section className="kx-express" aria-labelledby="kx-ex-h">
            <p id="kx-ex-h">{t("Express checkout")}</p>
            <div className="kx-express-btns">
              {EXPRESS.map(([f2, name]) => <button key={f2} type="button" aria-label={name} onClick={() => setExpress(name)}><img src={asset(`pay/${f2}.svg`)} alt="" /></button>)}
            </div>
            {express && <p className="kx-express-msg" role="status">{express} · {t("Express checkout opens on the live store.")}</p>}
            <div className="kx-or"><span>{t("OR")}</span></div>
          </section>

          <section className="kx-sec">
            <div className="kx-sec-head"><h2>{t("Contact")}</h2><Link href="https://www.1laser.com/account/login">{t("Sign in")}</Link></div>
            <Field label={t("Email")} name="email" type="email" autoComplete="email" value={f.email} onChange={set} bad={err.email} />
            <p className="kx-sub">{t("We'll send the order confirmation and updates here.")}</p>
            <label className="ik-check"><input type="checkbox" checked={!!f.news} onChange={(e) => set("news", e.target.checked)} /><span>{t("Email me with news and offers")}</span></label>
          </section>

          <section className="kx-sec">
            <h2>{t("Delivery")}</h2>
            <div className="ik-grid kx-grid">
              <label className="ik-field ik-static c2"><span>{t("Country/Region")}</span><b>{t("United States")}</b></label>
              <Field label={t("First name")} name="first" autoComplete="given-name" value={f.first} onChange={set} bad={err.first} />
              <Field label={t("Last name")} name="last" autoComplete="family-name" value={f.last} onChange={set} bad={err.last} />
              <AddressSuggest value={f.street} onChange={set} bad={err.street} onPick={(a) => { setF((x) => ({ ...x, street: a.street, city: a.city || x.city, state: a.state || x.state, zip: a.zip || x.zip })); setErr((e) => ({ ...e, street: false, city: false, state: false, zip: false })); }} />
              <Field label={t("Apt, Suite, Building (Optional)")} name="apt" autoComplete="address-line2" value={f.apt} onChange={set} required={false} bad={err.apt} className="c2" />
              <div className="kx-csz c2">
                <Field label={t("City")} name="city" autoComplete="address-level2" value={f.city} onChange={set} bad={err.city} />
                <label className={`ik-field ik-select${err.state ? " bad" : ""}${f.state ? " has" : ""}`}>
                  <select value={f.state} onChange={(e) => set("state", e.target.value)} autoComplete="address-level1" aria-invalid={err.state || undefined}><option value="" disabled>{t("State")}</option>{STATES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
                  <span>{t("State")}<i> *</i></span><Icon name="chevron" size={14} />
                </label>
                <Field label={t("ZIP code")} name="zip" inputMode="numeric" autoComplete="postal-code" value={f.zip} onChange={set} bad={err.zip} />
              </div>
              {/* ZIP ranges are by prefix, and a few border towns use a neighbour's range, so this only reminds */}
              {f.zip && f.state && !zipMatchesState(f.zip, f.state) && <p className="ik-hint ik-mismatch c2" role="status">{t("This ZIP code usually belongs to another state. Please double-check the ZIP and state.")}</p>}
              <Field label={t("Mobile number")} name="phone" type="tel" autoComplete="tel" value={f.phone} onChange={set} bad={err.phone} className="c2" />
              <p className="kx-sub c2">{t("We use your number only to contact you about this order, such as delivery updates.")}</p>
              <p className="kx-sub c2">{t("We don't ship to P.O. Boxes or APO/FPO addresses.")}</p>
            </div>
          </section>

          <section className="kx-sec">
            <h2>{t("Shipping method")}</h2>
            {quote ? (
              <label className="kx-choice on"><input type="radio" name="ship" defaultChecked /><span><b>{t(machines ? "Freight delivery" : "Standard shipping")}</b><small>{quoteText(quote)[1]}</small></span><strong>{quoteCell(quote)}</strong></label>
            ) : region ? (
              <p className={`ik-ship-live${shipBlocked ? " stop" : ""}`} role="status"><Icon name="truck" size={18} /><span><b>{t(SHIP_TEXT[region][0])}</b>{t(SHIP_TEXT[region][1])}</span></p>
            ) : (
              <p className="kx-empty">{t("Enter your shipping address to see shipping options.")}</p>
            )}
            {machines && !shipBlocked && (
              <label className="ik-field ik-area"><textarea rows={2} placeholder=" " value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} /><span>{t("Delivery notes (optional): lift gate, stairs, loading dock…")}</span></label>
            )}
          </section>

          <section className="kx-sec">
            <h2>{t("Payment")}</h2>
            <p className="kx-sub">{t("All transactions are secure and encrypted.")}</p>
            <div className="kx-pay">
              {[
                ["card", "Credit card", ["visa", "mastercard", "amex", "discover"]],
                ["shop", "Shop Pay · Pay in full or in installments", ["shop-pay"]],
                ["paypal", "PayPal", ["paypal"]],
              ].map(([id, label, logos]) => (
                <div key={id} className={`kx-pay-opt${method === id ? " on" : ""}`}>
                  <label><input type="radio" name="pay" checked={method === id} onChange={() => setMethod(id)} /><b>{t(label)}</b><span className="kx-pay-logos">{logos.map((l) => <img key={l} src={asset(`pay/${l}.svg`)} alt="" />)}</span></label>
                  {method === id && id === "card" && (
                    <div className="kx-pay-body">
                      <div className="ik-grid ik-cardfields">
                        <Field label={t("Card number")} name="card" onChange={() => {}} className="c2" disabled />
                        <Field label={t("Expiration (MM / YY)")} name="exp" onChange={() => {}} disabled />
                        <Field label={t("Security code")} name="cvc" onChange={() => {}} disabled />
                        <Field label={t("Name on card")} name="cardname" onChange={() => {}} className="c2" disabled />
                      </div>
                      <label className="ik-check"><input type="checkbox" checked={sameBill} onChange={(e) => setSameBill(e.target.checked)} /><span>{t("Use shipping address as billing address")}</span></label>
                      {!sameBill && (
                        <div className="ik-grid ik-bill">
                          <Field label={t("Street address")} name="bStreet" value={f.bStreet} onChange={set} className="c2" />
                          <Field label={t("City")} name="bCity" value={f.bCity} onChange={set} />
                          <Field label={t("ZIP code")} name="bZip" value={f.bZip} onChange={set} />
                        </div>
                      )}
                      <p className="ik-hint">{t("Payment fields are disabled in this design draft.")}</p>
                    </div>
                  )}
                  {method === id && id !== "card" && <div className="kx-pay-body"><p className="kx-sub">{t(id === "shop" ? "After you click Pay now, you'll finish with Shop Pay. Installments are subject to eligibility." : "After you click Pay now, you'll finish on PayPal.")}</p></div>}
                </div>
              ))}
            </div>
            <p className="ik-biz"><Icon name="card" size={18} /><span>{t("Buying for a business? $0-down loans and lease-to-own are arranged before you order.")} <Link to="/pages/financing">{t("See business financing")}</Link></span></p>
          </section>

          <div className="kx-finish">
            <TermsBox id="kx-terms" ok={terms} bad={termsBad && !terms} onChange={(v) => { setTerms(v); setTermsBad(false); }} />
            {errors > 0 && <p className="ik-err" role="alert">{t("Please check the fields marked in red.")}</p>}
            {ended && <p className="ik-err" role="alert">{t("Prices have changed since this page opened. Refresh to get a quote at today's prices.")}</p>}
            <button type="button" className="kx-paynow" disabled={ended} onClick={payNow}>{t("Pay now")} · {money(total)}</button>
            <p className="ik-legal">{t("Demo only: no charge and no order. On the live store, paying means you accept the OneLaser sales and privacy policies.")}</p>
          </div>
        </main>
        <aside className="kx-aside">{summary}</aside>
      </div>
      <OfferGate />
    </div>
  );
}
