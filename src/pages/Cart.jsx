import { useEffect, useState, useRef } from "react";
import { asset, byHandle, frontImg, go, img, lockScroll, money, monthlyText, popupLink, useFocusTrap, isTopDialog } from "../lib.js";
import { TermsAsk, TermsBox, useTerms } from "../components/Terms.jsx";
import { SHIP_TEXT, shipQuote, shipRegion } from "../data/shipping.js";
import { t, tf } from "../i18n.js";
import { useCart } from "../cart.jsx";
import { Icon, Link } from "../components/ui.jsx";

/* Cart after the Insta360 Store cart (store.insta360.com/cart, checked again 2026-11-19 at 1440):
   gray page, "Shopping cart" title, left column of white cards (delivery note, then each item with a tick box,
   picture, name, return tag, options, stepper, price and bin; add-ons for the item listed under it with an "Add" link),
   right sticky "Order details" card (price, shipping, tax, estimated total, pay-over-time line, Check out button,
   delivery / returns / support / payment notes), then "You might also like". On phones the total and button stay at the bottom.
   Add-ons and suggestions are real OneLaser catalog products. */

const SERVICES = ["engineer-1-on-1-training-support", "lightburn-software-pro-license-key"];
const CHILLER = "onelaser-industrial-chiller-for-hydra-laser-engraver"; // "for Hydra & Cobra glass tube laser system"
const GLASS = ["cobra", "hydra"]; // series that can run a glass tube; Hydra 7 Gen2 is RF only
const SUGGEST = ["piburn-v-for-onelaser", "air-assist-for-laser-engraver-cutter", "filtrabox-micro", "lightburn-software-pro-license-key", "multi-function-rotary-axis-57-motor", "engineer-1-on-1-training-support", "1-8-frosted-matte-acrylic-sheets-12-12-4-pack-for-laser-engraving-cutting"];
/* The methods 1laser.com's own Payment Methods page shows, with the same Shopify payment logos (public/assets/pay).
   Shop Pay covers Shop Pay Installments (provided by Affirm), so Affirm has no logo of its own. */
const PAY = [["visa", "Visa"], ["mastercard", "Mastercard"], ["amex", "American Express"], ["discover", "Discover"], ["apple-pay", "Apple Pay"], ["google-pay", "Google Pay"], ["shop-pay", "Shop Pay"]];

const addOnsFor = (p) => {
  if (p.kind !== "machine") return [];
  const list = [...SERVICES];
  if (GLASS.includes(p.series) && !/hydra-7/.test(p.handle)) list.unshift(CHILLER);
  return list.map((h) => byHandle[h]).filter(Boolean);
};
/* Arrival offer after Insta360's cart "Protect your device with FlexiCare" dialog: shown once per visit when a machine is in
   the cart, listing real OneLaser services/parts with points taken from their own product descriptions. */
const OFFER = {
  "engineer-1-on-1-training-support": ["1 hour on live video with a OneLaser technician", "Machine assembly and software setup", "Troubleshooting, so you avoid costly mistakes"],
  "lightburn-software-pro-license-key": ["The \u201ceverything\u201d license of LightBurn", "Works on Windows and macOS"],
  [CHILLER]: ["1400W cooling capacity", "\u00b10.3\u00b0C temperature control", "Water-flow and temperature alarms"],
};
const OFFER_KEY = "onelaser-cart-offer-seen";

/* "Where are we shipping?": a ZIP box on the cart that tells the buyer, right away, what shipping means for that address
   (rules from the shipping policy, data/shipping.js). The ZIP is kept for the visit and starts the checkout address. */
const ZIP_KEY = "onelaser-ship-zip";
/** [zip, set]: the cart's delivery ZIP, kept for the visit (checkout starts its address with it). */
function useShipZip() {
  const [zip, setZip] = useState(() => { try { return sessionStorage.getItem(ZIP_KEY) || ""; } catch { return ""; } });
  return [zip, setZip];
}
/** "Free shipping" / "Shipping $900" + the store's delivery estimate, or null when a rate is not known. */
export function quoteText(q) {
  if (!q) return null;
  const head = q.fee === 0 ? t("Free shipping") : `${t("Shipping")} ${money(q.fee)}`;
  if (q.partial) return [tf("{amount} so far", { amount: head }), t("Shipping for the other items is confirmed at checkout.")];
  return [head, tf("Arrives in about {a}–{b} business days.", { a: q.days[0], b: q.days[1] })];
}
/** The order-summary shipping cell: "Free" / "$900", with "+ more at checkout" when part is still to be confirmed. */
export const quoteCell = (q) => `${q.fee === 0 ? t("Free") : money(q.fee)}${q.partial ? ` + ${t("rest at checkout")}` : ""}`;
function ShipCheck({ zip, setZip, quote }) {
  const region = shipRegion(zip);
  const qt = quoteText(quote);
  const typedFive = /^\d{5}$/.test(zip.trim());
  const save = (v) => { const z = v.replace(/[^\d-]/g, "").slice(0, 10); setZip(z); try { shipRegion(z) ? sessionStorage.setItem(ZIP_KEY, z) : sessionStorage.removeItem(ZIP_KEY); } catch { /* private mode */ } };
  return (
    <div className="ic-card ic-note ic-ship">
      <Icon name="truck" size={22} />
      <div>
        <p><b>{t("Ships from the U.S.")}</b> <span className="ic-note-more">{t("Enter your ZIP to check shipping for your area.")}</span></p>
        <label className="ic-zip">
          <span className="sr-only">{t("ZIP code")}</span>
          <input inputMode="numeric" autoComplete="postal-code" placeholder={t("ZIP code")} value={zip} onChange={(e) => save(e.target.value)} maxLength={10} />
        </label>
        {region ? (
          <p className={`ic-ship-out${region === "military" || region === "territory" ? " stop" : ""}`} role="status">{qt ? <><b>{qt[0]}</b> {qt[1]}</> : <><b>{t(SHIP_TEXT[region][0])}</b> {t(SHIP_TEXT[region][1])}</>}</p>
        ) : typedFive ? <p className="ic-ship-out stop" role="status">{t("We couldn't find that ZIP code. Check for typos and try again.")}</p> : null}
      </div>
    </div>
  );
}

function Offer({ list, onClose }) {
  const { add } = useCart();
  const [sel, setSel] = useState(() => new Set([list[0].handle]));
  const box = useRef(null);
  useFocusTrap(box);
  useEffect(() => {
    const unlock = lockScroll();
    const esc = (e) => e.key === "Escape" && isTopDialog(box.current) && onClose();
    window.addEventListener("keydown", esc);
    return () => { unlock(); window.removeEventListener("keydown", esc); };
  }, []);
  const flip = (h) => setSel((s) => { const n = new Set(s); n.has(h) ? n.delete(h) : n.add(h); return n; });
  const confirm = () => { list.forEach((a) => sel.has(a.handle) && add(a.handle, a.variants[0].id, 1)); onClose(); };
  return (
    <div className="ic-offer-scrim" onClick={onClose}>
      <div ref={box} className="ic-offer" role="dialog" aria-modal="true" aria-labelledby="ic-offer-h" onClick={(e) => e.stopPropagation()}>
        <h2 id="ic-offer-h">{t("Get your machine running right, the first time")}</h2>
        <p className="ic-offer-sub">{t("Optional extras that fit this machine.")}</p>
        <ul>
          {list.map((a, n) => (
            <li key={a.handle}>
              <label className={sel.has(a.handle) ? "on" : ""}>
                <input type="checkbox" checked={sel.has(a.handle)} onChange={() => flip(a.handle)} />
                {n === 0 && <em className="ic-offer-rec">{t("Recommended")}</em>}
                <img src={img(a.images[0], 120)} alt="" />
                <span className="ic-offer-name"><b>{a.name}</b><span>{money(a.price)}{a.compareAt > a.price && <s>{money(a.compareAt)}</s>}</span></span>
                <ul>{OFFER[a.handle].map((x) => <li key={x}><Icon name="check" size={14} />{t(x)}</li>)}</ul>
              </label>
            </li>
          ))}
        </ul>
        <div className="ic-offer-btns">
          <button type="button" className="ic-ghost" onClick={onClose}>{t("Not now")}</button>
          <button type="button" className="ic-checkout" disabled={!sel.size} onClick={confirm}>{t("Add to cart")}{sel.size > 1 ? ` (${sel.size})` : ""}</button>
        </div>
      </div>
    </div>
  );
}

/** The add-on offer for the machine in the cart, once per visit. Used on the cart and on checkout ("Buy now" skips the cart),
    so the extras the product page no longer lists still come up before paying. */
export function OfferGate() {
  const { items, picked } = useCart();
  const inCart = items.map((i) => i.product.handle);
  // the machine actually being checked out (ticked), so an unticked machine's extras are never offered
  const hasMachine = picked.find((i) => i.product.kind === "machine");
  const offer = hasMachine ? Object.keys(OFFER).filter((h) => addOnsFor(hasMachine.product).some((a) => a.handle === h) && !inCart.includes(h)).map((h) => byHandle[h]) : [];
  const [show, setShow] = useState(false);
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem(OFFER_KEY) === "1"; } catch {}
    if (offer.length && !seen) {
      const id = setTimeout(() => setShow(true), 600);
      return () => clearTimeout(id);
    }
    return undefined;
  }, []);
  const close = () => { setShow(false); try { sessionStorage.setItem(OFFER_KEY, "1"); } catch {} };
  return show && offer.length > 0 ? <Offer list={offer} onClose={close} /> : null;
}

const picture = (p, v) => (p.kind === "machine" ? frontImg(p) : v?.image || p.images[0]);

function Suggestions({ exclude = [] }) {
  const { add } = useCart();
  const list = SUGGEST.filter((h) => !exclude.includes(h)).map((h) => byHandle[h]).filter(Boolean).slice(0, 4);
  return (
    <section className="ic-more">
      <h2>{t("You might also like")}</h2>
      <ul>
        {list.map((p) => (
          <li key={p.handle}>
            <Link to={`/products/${p.handle}`} className="ic-more-img"><img src={img(p.images[0], 400)} alt="" loading="lazy" /></Link>
            <h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3>
            <p><b>{money(p.price)}</b>{p.compareAt > p.price && <s>{money(p.compareAt)}</s>}</p>
            <button type="button" className="ic-more-add" onClick={() => add(p.handle, p.variants[0].id)}><Icon name="cart" size={16} />{t("Add to cart")}</button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function Cart() {
  const { items, picked, setQty, add, subtotal, savings, toggle, toggleAll } = useCart();
  const [terms, setTermsOk] = useTerms();
  const [ask, setAsk] = useState(false);
  const [zip, setZip] = useShipZip();
  const inCart = items.map((i) => i.product.handle);
  const hasMachine = items.find((i) => i.product.kind === "machine");
  if (!items.length)
    return (
      <section className="ic">
        <div className="ic-wrap">
          <h1>{t("Shopping cart")}</h1>
          <div className="ic-card ic-empty">
            <span className="ic-empty-ico"><Icon name="cart" size={40} /></span>
            <b>{t("Your shopping cart is empty")}</b>
            <p>{t("Not sure where to start? Answer a few questions and we'll match you with a machine.")}</p>
            <div className="ic-empty-btns">
              <Link to="/collections/machines" className="ic-checkout">{t("Shop laser machines")}</Link>
              <Link to="/" className="ic-ghost">{t("Find my machine")}</Link>
            </div>
          </div>
          <Suggestions />
        </div>
      </section>
    );
  const all = picked.length === items.length;
  // shipping for the ticked items to the ZIP above (store rates, data/shipping.js); the total includes it when known
  const quote = shipQuote(picked, zip);
  const total = subtotal + (quote?.fee || 0);
  const okTerms = () => setTermsOk(true);
  const toCheckout = (e) => { if (!terms) { e.preventDefault(); setAsk(true); } };
  const pickedQty = picked.reduce((s, i) => s + i.qty, 0);
  const machine = picked.find((i) => i.product.kind === "machine") || items.find((i) => i.product.kind === "machine");
  return (
    <section className="ic">
      <div className="ic-wrap">
        <h1>{t("Shopping cart")}</h1>
        <div className="ic-layout">
          <div className="ic-left">
            <ShipCheck zip={zip} setZip={setZip} quote={quote} />
            <div className="ic-card ic-lines">
              <label className="ic-all">
                <input type="checkbox" checked={all} onChange={(e) => toggleAll(e.target.checked)} />
                <span>{t("Select all")} ({items.length})</span>
              </label>
              {items.map((i) => {
                const addOns = addOnsFor(i.product).filter((a) => !inCart.includes(a.handle));
                return (
                  <article key={i.variantId} className={`ic-item${i.off ? " off" : ""}`}>
                    <div className="ic-line">
                      <input type="checkbox" className="ic-pick" checked={!i.off} onChange={() => toggle(i.variantId)} aria-label={`${t("Check out")} ${i.product.name}`} />
                      <Link to={`/products/${i.product.handle}`} className="ic-line-media"><img src={img(picture(i.product, i.variant), 300)} alt="" /></Link>
                      <div className="ic-line-info">
                        <h2><Link to={`/products/${i.product.handle}`}>{i.product.name}</Link></h2>
                        <span className="ic-tag">{t("30-Day Returns")}</span>
                        {i.variant.title && i.variant.title !== "Default Title" && <p>{i.variant.title}</p>}
                        {["xrf", "hydra", "legacy"].includes(i.product.series) && <p className="ic-warranty"><Icon name="shield" size={14} />{t("3-2-1 warranty included")}</p>}
                      </div>
                      <div className="ic-qty">
                        <button type="button" aria-label={t("Decrease quantity")} disabled={i.qty <= 1} onClick={() => setQty(i.variantId, i.qty - 1)}>−</button>
                        <span aria-live="polite">{i.qty}</span>
                        <button type="button" aria-label={t("Increase quantity")} onClick={() => setQty(i.variantId, i.qty + 1)}>+</button>
                      </div>
                      <div className="ic-line-price">{money(i.total)}{i.variant.compareAt > i.variant.price && <s>{money(i.variant.compareAt * i.qty)}</s>}</div>
                      <button type="button" className="ic-remove" aria-label={`${t("Remove")} ${i.product.name}`} onClick={() => setQty(i.variantId, 0)}><Icon name="trash" size={18} /></button>
                    </div>
                    {addOns.length > 0 && (
                      <ul className="ic-addons" aria-label={t("Recommended with this machine")}>
                        {addOns.map((a) => (
                          <li key={a.handle}>
                            <img src={img(a.images[0], 160)} alt="" />
                            <span><b>{a.name}</b>{OFFER[a.handle] && <small>{t(OFFER[a.handle][0])}</small>}<Link to={`/products/${a.handle}`}>{t("Learn more")}</Link></span>
                            <i className="ic-addons-x">× 1</i>
                            <em>{money(a.price)}{a.compareAt > a.price && <s>{money(a.compareAt)}</s>}</em>
                            <button type="button" onClick={() => add(a.handle, a.variants[0].id)}>{t("Add")}</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
          <aside className="ic-card ic-details">
            <h2>{t("Order details")}</h2>
            <p><span>{t("Price")} ({pickedQty} {t(pickedQty === 1 ? "item" : "items")})</span><span>{money(subtotal + savings)}</span></p>
            {savings > 0 && <p className="save"><span>{t("Savings")}</span><span>−{money(savings)}</span></p>}
            <p><span>{t("Shipping")}</span>{quote ? <span>{quoteCell(quote)}</span> : <span className="muted">{t(shipRegion(zip) ? "Calculated at checkout" : "Enter your ZIP above")}</span>}</p>
            {/* which states OneLaser collects sales tax in is for finance to confirm; the live checkout adds it */}
            <p><span>{t("Tax")}</span><span className="muted">{t("Added by state at checkout")}</span></p>
            <p className="total"><span>{t("Estimated total")}</span><b>{money(total)}</b></p>
            {/* the site's one estimate (lib.js perMonth), same as the product cards and the payment popup */}
            {/* financing covers the items (the business-loan subsidy threshold is on the purchase), so shipping is left out */}
            {subtotal >= 1000 && <p className="ic-monthly">{t("or")} <b>{monthlyText(subtotal)}</b>{t("/mo for 24 months (est. 15% APR)")}</p>}
            {subtotal >= 1000 && (
              <a {...popupLink("financing", { amount: subtotal, h: machine?.product.handle }, `#/pages/financing?amount=${subtotal}&n=24${machine ? `&p=${machine.product.handle}` : ""}`)} className="ic-finance">
                <Icon name="card" size={16} />{t("Pay over time with financing.")} <u>{t("Estimate my payment")}</u>
              </a>
            )}
            {picked.length > 0 && <TermsBox id="ic-terms" ok={terms} onChange={setTermsOk} />}
            {picked.length ? <Link to="/checkout" className="ic-checkout" onClick={toCheckout}>{t("Check out")}</Link> : <span className="ic-checkout off" aria-disabled="true">{t("Select an item to check out")}</span>}
            <Link to="/collections/machines" className="ic-continue">{t("Continue shopping")}</Link>
            <h3>{t("Shipped by OneLaser")}</h3>
            <ul>
              <li><Icon name="truck" size={20} /><span><b>{t("Delivery by address")}</b>{t("All items ship according to the item with the latest shipping date.")}</span></li>
              <li><Icon name="refresh" size={20} /><span><b>{t("30-day return period")}</b>{t("Terms and conditions apply.")}</span></li>
              <li><Icon name="headset" size={20} /><span><b>{t("U.S.-based support")}</b>{t("Talk to real laser engineers.")} <a {...popupLink("book", {}, "#/pages/sales-consultation")}>{t("Book a free call")}</a></span></li>
              <li><Icon name="lock" size={20} /><span><b>{t("Pay your way")}</b><span className="ic-pay">{PAY.map(([f, name]) => <img key={f} src={asset(`pay/${f}.svg`)} alt={name} title={name} width="38" height="24" loading="lazy" />)}</span></span></li>
            </ul>
          </aside>
        </div>
        <Suggestions exclude={[...inCart, ...items.flatMap((i) => addOnsFor(i.product).map((a) => a.handle))]} />
      </div>
      <div className="ic-bar">
        <label><input type="checkbox" checked={all} onChange={(e) => toggleAll(e.target.checked)} /><span>{t("All")}</span></label>
        <p><small>{t("Estimated total")}</small><b>{money(total)}</b></p>
        {picked.length ? <Link to="/checkout" className="ic-checkout" onClick={toCheckout}>{t("Check out")} ({pickedQty})</Link> : <span className="ic-checkout off">{t("Check out")}</span>}
      </div>
      {ask && <TermsAsk onClose={() => setAsk(false)} onAccept={() => { okTerms(); setAsk(false); go("/checkout"); }} />}
      {/* the add-on offer opens when the buyer moves on to checkout (OfferGate in Checkout.jsx), not on top of the cart */}
    </section>
  );
}
