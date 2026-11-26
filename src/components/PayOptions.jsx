import { useEffect, useRef, useState } from "react";
import { t, tf } from "../i18n.js";
import { asset, lockScroll, money, monthlyText, popupLink, useFocusTrap, isTopDialog } from "../lib.js";
import { footer, promo, saleOn } from "../data/site.js";
import { shipQuote, shipRegion } from "../data/shipping.js";
import { Icon, Link } from "./ui.jsx";
import { TermsBox } from "./Terms.jsx";

/* "How would you like to pay?" on the cart, after xTool's cart (xtool.com/cart, read 2026-11-26): four blocks.
   1 Pay in full or monthly (the normal checkout), and for businesses, schools and government:
   2 business financing (OneLaser's own lenders and apply links, from the financing page),
   3 a quote / purchase order, 4 a tax-exempt account.
   OneLaser's channel for purchase orders and tax-exempt accounts is sales@1laser.com (1laser.com Contact Us → Corporate Sales). */

const SALES = "sales@1laser.com";
/* The payment methods 1laser.com takes (its Payment Methods page + the express buttons on its live checkout), Shopify logos. */
export const PAY = [["visa", "Visa"], ["mastercard", "Mastercard"], ["amex", "American Express"], ["discover", "Discover"], ["paypal", "PayPal"], ["apple-pay", "Apple Pay"], ["google-pay", "Google Pay"], ["amazon-pay", "Amazon Pay"], ["shop-pay", "Shop Pay"]];
/* Lenders and apply links: the financing page's (src/pages/Finance.jsx, from 1laser.com/pages/financing). */
const LENDERS = [
  ["OneLaser Subsidy Loan", "$0 down, first 3 months payment-free, up to 60 months.", "https://www.1laser.com/pages/onelaser-loan-form"],
  ["First Citizens Bank", "Equipment finance for established businesses.", "https://kraftengineeringcorp.firstcitizensef.com/"],
  ["ClickLease", "Lease to own, $0 down, approval in minutes.", "https://www.clicklease.com/partner/onelaser"],
];

const lineName = (i) => [i.product.name, i.variant.title && i.variant.title !== "Default Title" ? i.variant.title : ""].filter(Boolean).join(" · ");
const today = () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** The cart as a CSV a lender can read (ClickLease builds its contract from an itemized invoice). */
function downloadItems(lines, shipping, partial) {
  const rows = [["Item", "Quantity", "Unit price (USD)", "Line total (USD)"], ...lines.map((i) => [lineName(i), i.qty, i.variant.price.toFixed(2), i.total.toFixed(2)])];
  const sub = lines.reduce((s, i) => s + i.total, 0);
  rows.push([], ["Subtotal", "", "", sub.toFixed(2)]);
  if (shipping != null) rows.push([partial ? "Estimated shipping (known items; the rest is confirmed with the order)" : "Estimated shipping", "", "", shipping.toFixed(2)]);
  rows.push(["Sales tax", "", "", "Added at checkout from the delivery address"], [], [`OneLaser cart items, ${today()}`], [`Questions: ${SALES} · ${footer.contact[0][1]}`]);
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = `onelaser-cart-items-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** A plain email to sales with the cart, for a purchase order or a tax-exempt account. */
const mailto = (subject, lines, extra = "") => `mailto:${SALES}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
  `${extra}${extra ? "\n\n" : ""}Cart:\n${lines.map((i) => `- ${lineName(i)} × ${i.qty}: ${money(i.total)}`).join("\n")}\n`,
)}`;

/* part "main": pay in full or monthly (the cart's side column, with Check out); part "biz": the business options (under the
   cart items, so the two columns stay balanced). */
export default function PayOptions({ part = "main", className = "", lines, subtotal, total, quote, machine, terms, setTerms, toCheckout, onQuote }) {
  const [lend, setLend] = useState(false);
  // shipping known so far (the cart's quote); "partial" = other items' shipping is confirmed with the order
  const shipFee = quote ? quote.fee : null;
  const shipPartial = !!quote?.partial;
  if (part === "main") return (
    <section className="po" aria-labelledby="po-h">
      <h2 id="po-h">{t("How would you like to pay?")}</h2>
      <div className="po-card po-main">
        <h3>{t("Pay in full or monthly")}</h3>
        <p className="po-price"><b>{money(total)}</b>{subtotal >= 1000 && <> {t("or")} <b>{monthlyText(subtotal)}</b>{t("/mo for 24 months (est. 15% APR)")}</>}</p>
        {subtotal >= 1000 && (
          <a {...popupLink("financing", { amount: subtotal, h: machine?.product.handle }, `#/pages/financing?amount=${subtotal}&n=24${machine ? `&p=${machine.product.handle}` : ""}`)} className="po-link">
            {t("View all financing options")}<Icon name="plus" size={14} />
          </a>
        )}
        {lines.length > 0 && <TermsBox id="ic-terms" ok={terms} onChange={setTerms} />}
        {lines.length ? <Link to="/checkout" className="ic-checkout" onClick={toCheckout}>{t("Check out")}</Link> : <span className="ic-checkout off" aria-disabled="true">{t("Select an item to check out")}</span>}
        <span className="ic-pay po-pay">{PAY.map(([f, name]) => <img key={f} src={asset(`pay/${f}.svg`)} alt={name} title={name} width="38" height="24" loading="lazy" />)}</span>
      </div>
    </section>
  );
  return (
    <section className={`po po-biz-wrap ${className}`} aria-label={t("For businesses, schools and government")}>
      <div className="po-card po-biz">
        <h3>{t("For businesses, schools and government")}</h3>
        <p className="po-sub">{t("Finance the purchase, get a formal quote, or buy tax-free.")}</p>
        <div className="po-opts">

        <div className="po-opt">
          <Icon name="card" size={18} />
          <div>
            <b>{t("Business financing: OneLaser loan, First Citizens Bank & ClickLease")}</b>
            <p>{t("A business loan or lease-to-own, from $0 down and up to 60 months. Pick one and apply online.")}</p>
            <p className="po-acts">
              <button type="button" className="po-link" aria-expanded={lend} onClick={() => setLend((v) => !v)}>{t("Apply now")}<Icon name={lend ? "minus" : "plus"} size={14} /></button>
              <button type="button" className="po-link" onClick={() => downloadItems(lines, shipFee, shipPartial)} disabled={!lines.length}>{t("Download cart items (CSV)")}<Icon name="download" size={14} /></button>
            </p>
            {lend && (
              <ul className="po-lenders">
                {LENDERS.map(([name, sub, url]) => <li key={name}><a href={url} target="_blank" rel="noreferrer"><b>{t(name)}</b><small>{t(sub)}</small><Icon name="arrow" size={14} /></a></li>)}
              </ul>
            )}
          </div>
        </div>

        <div className="po-opt">
          <Icon name="quote" size={18} />
          <div>
            <b>{t("Quote for companies, schools, government and nonprofits")}</b>
            <button type="button" className="po-quote" onClick={onQuote} disabled={!lines.length}>{t("Get an instant quote")}</button>
            <a className="po-link" href={mailto("Purchase order", lines, "Please find our purchase order attached.")}>{t("Purchase order: email it to our sales team")}<Icon name="chevron" size={14} /></a>
          </div>
        </div>

        <div className="po-opt">
          <Icon name="shield" size={18} />
          <div>
            <b>{t("Tax exemption: skip sales tax on this and future orders.")}</b>
            <a className="po-link" href={mailto("Tax-exempt account application", lines, "We'd like to buy tax-exempt. Our exemption or resale certificate is attached.")}>{t("Apply to qualify")}<Icon name="chevron" size={14} /></a>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}

/* "Get an instant quote": organization type → details → the quote (print or save as PDF, or email it to sales).
   Built in the browser from the cart; nothing is sent anywhere unless the buyer emails it. */
const ORGS = [["edu", "Schools, government or nonprofits", "I'm buying for a school, a government agency or a nonprofit."], ["biz", "Companies and businesses", "I'm buying for a company or a firm."]];
export function QuoteDialog({ lines, subtotal, cartQuote, onClose }) {
  const box = useRef(null);
  // prices can end (Black Friday) while the cart is open: then no quote at the old prices
  const [ended, setEnded] = useState(() => !!window.__saleEnded);
  useEffect(() => { const f = () => setEnded(true); window.addEventListener("onelaser:sale-ended", f); return () => window.removeEventListener("onelaser:sale-ended", f); }, []);
  useFocusTrap(box);
  useEffect(() => {
    const unlock = lockScroll();
    const esc = (e) => e.key === "Escape" && isTopDialog(box.current) && onClose();
    window.addEventListener("keydown", esc);
    return () => { unlock(); window.removeEventListener("keydown", esc); };
  }, []);
  const [step, setStep] = useState(0);
  const [org, setOrg] = useState("");
  const [f, setF] = useState({ org: "", name: "", email: "", phone: "", zip: "" });
  const [bad, setBad] = useState({});
  const [no] = useState(() => `OL-Q-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`);
  const set = (k) => (e) => { setF((x) => ({ ...x, [k]: e.target.value })); setBad((b) => ({ ...b, [k]: false })); };
  const next = () => {
    const b = {};
    if (!f.org.trim()) b.org = true;
    if (!f.name.trim()) b.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) b.email = true;
    setBad(b);
    if (!Object.keys(b).length) setStep(2);
  };
  // shipping to the ZIP given for the quote (else the cart's); "partial" = some of it is confirmed with the order
  const sq = shipRegion(f.zip) ? shipQuote(lines, f.zip) : cartQuote;
  const shipFee = sq ? sq.fee : null;
  const shipText = shipFee == null ? t("Confirmed with your order") : `${shipFee === 0 ? t("Free") : money(shipFee)}${sq.partial ? ` + ${t("rest confirmed with your order")}` : ""}`;
  const total = subtotal + (shipFee || 0);
  const totalLabel = shipFee == null || sq.partial ? t("Estimated total before tax") : t("Total before tax");
  const valid = saleOn ? t(promo.label) : "";
  // the same quote, as the email body for sales (in English: it goes to the U.S. sales team)
  const shipEn = shipFee == null ? "Confirmed with the order" : `${shipFee === 0 ? "Free" : money(shipFee)}${sq.partial ? " + rest confirmed with the order" : ""}`;
  const emailBody = [
    `OneLaser quote ${no} · ${today()}`,
    `For: ${f.org} (${f.name}, ${f.email}${f.phone ? ", " + f.phone : ""}${f.zip ? ", ZIP " + f.zip : ""})`,
    "",
    ...lines.map((i) => `- ${lineName(i)} × ${i.qty}: ${money(i.total)}`),
    "",
    `Subtotal: ${money(subtotal)}`,
    `Shipping: ${shipEn}`,
    "Sales tax: by delivery address; none with a tax-exempt certificate",
    `${shipFee == null || sq.partial ? "Estimated total before tax" : "Total before tax"}: ${money(total)}`,
    saleOn ? `Prices are today's sale prices (${promo.label}).` : "",
  ].filter((x) => x !== false).join("\n");
  const print = () => {
    if (ended || window.__saleEnded) { setEnded(true); return; }
    const w = window.open("", "_blank");
    if (!w) return;
    const rows = lines.map((i) => `<tr><td>${esc(lineName(i))}</td><td class="n">${i.qty}</td><td class="n">${esc(money(i.variant.price))}</td><td class="n">${esc(money(i.total))}</td></tr>`).join("");
    w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>OneLaser quote ${no}</title><style>
      body{font:14px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1d1d1f;margin:40px}h1{font-size:22px;margin:0}
      .top{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #e7310e;padding-bottom:14px;margin-bottom:18px}
      table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px 6px;border-bottom:1px solid #e5e5ea;text-align:left}.n{text-align:right}
      .tot td{font-weight:700;border-bottom:0}small{color:#6e6e73}p{margin:4px 0}</style></head><body>
      <div class="top"><div><h1>OneLaser · ${esc(t("Quote"))}</h1><p>${esc(footer.address)}</p><p>${esc(SALES)} · ${esc(footer.contact[0][1])}</p></div>
      <div><p><b>${esc(t("Quote number"))}:</b> ${no}</p><p><b>${esc(t("Date"))}:</b> ${esc(today())}</p></div></div>
      <p><b>${esc(t("Prepared for"))}:</b> ${esc(f.org)} · ${esc(f.name)} · ${esc(f.email)}${f.phone ? " · " + esc(f.phone) : ""}${f.zip ? " · ZIP " + esc(f.zip) : ""}</p>
      <table><thead><tr><th>${esc(t("Item"))}</th><th class="n">${esc(t("Qty"))}</th><th class="n">${esc(t("Unit price"))}</th><th class="n">${esc(t("Amount"))}</th></tr></thead><tbody>${rows}</tbody>
      <tfoot><tr><td colspan="3" class="n">${esc(t("Subtotal"))}</td><td class="n">${esc(money(subtotal))}</td></tr>
      <tr><td colspan="3" class="n">${esc(t("Shipping"))}</td><td class="n">${esc(shipText)}</td></tr>
      <tr><td colspan="3" class="n">${esc(t("Sales tax"))}</td><td class="n">${esc(t("By delivery address; none with a tax-exempt certificate"))}</td></tr>
      <tr class="tot"><td colspan="3" class="n">${esc(totalLabel)}</td><td class="n">${esc(money(total))}</td></tr></tfoot></table>
      ${valid ? `<p><small>${esc(t("Prices shown are today's sale prices"))} (${esc(valid)}).</small></p>` : ""}
      <p><small>${esc(t("To order, reply to sales@1laser.com with this quote number, or send a purchase order."))}</small></p>
      <script>window.onload=()=>window.print()</` + `script></body></html>`);
    w.document.close();
  };
  return (
    <div className="ic-offer-scrim" onClick={onClose}>
      <div ref={box} className="ic-ask qd" role="dialog" aria-modal="true" aria-labelledby="qd-h" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ic-terms-x" aria-label={t("Close")} onClick={onClose}><Icon name="close" size={20} /></button>
        <ol className="qd-steps" aria-hidden="true">{[0, 1, 2].map((n) => <li key={n} className={n < step ? "done" : n === step ? "now" : ""}><i>{n < step ? <Icon name="check" size={12} /> : n + 1}</i></li>)}</ol>
        {step === 0 && (
          <>
            <h2 id="qd-h">{t("Who are you buying for?")}</h2>
            <div className="qd-orgs" role="radiogroup">
              {ORGS.map(([id, title, sub]) => (
                <button key={id} type="button" role="radio" aria-checked={org === id} className={org === id ? "on" : ""} onClick={() => setOrg(id)}>
                  <Icon name={id === "edu" ? "school" : "card"} size={20} /><span><b>{t(title)}</b><small>{t(sub)}</small></span>
                </button>
              ))}
            </div>
            <button type="button" className="ic-checkout" disabled={!org} onClick={() => setStep(1)}>{t("Next")}</button>
          </>
        )}
        {step === 1 && (
          <>
            <h2 id="qd-h">{t("Who should the quote be for?")}</h2>
            <div className="qd-form">
              <label className={bad.org ? "bad" : ""}><span>{t(org === "edu" ? "School or organization name" : "Company name")} *</span><input value={f.org} onChange={set("org")} autoComplete="organization" /></label>
              <label className={bad.name ? "bad" : ""}><span>{t("Your name")} *</span><input value={f.name} onChange={set("name")} autoComplete="name" /></label>
              <label className={bad.email ? "bad" : ""}><span>{t("Email")} *</span><input value={f.email} onChange={set("email")} type="email" autoComplete="email" /></label>
              <label><span>{t("Phone (optional)")}</span><input value={f.phone} onChange={set("phone")} type="tel" autoComplete="tel" /></label>
              <label><span>{t("Delivery ZIP (optional)")}</span><input value={f.zip} onChange={set("zip")} inputMode="numeric" autoComplete="postal-code" /></label>
            </div>
            <div className="qd-btns"><button type="button" className="ic-ghost" onClick={() => setStep(0)}>{t("Back")}</button><button type="button" className="ic-checkout" onClick={next}>{t("Create my quote")}</button></div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 id="qd-h">{t("Your quote is ready")}</h2>
            <p className="qd-meta">{t("Quote number")} <b>{no}</b> · {today()}</p>
            <ul className="qd-lines">{lines.map((i) => <li key={i.variantId}><span>{lineName(i)} × {i.qty}</span><b>{money(i.total)}</b></li>)}</ul>
            <p className="qd-sum"><span>{t("Shipping")}</span><b>{shipText}</b></p>
            <p className="qd-sum total"><span>{totalLabel}</span><b>{money(total)}</b></p>
            {ended && <p className="qd-ended" role="alert">{t("Prices have changed since this page opened. Refresh to get a quote at today's prices.")} <button type="button" onClick={() => window.location.reload()}>{t("Refresh prices")}</button></p>}
            <div className="qd-btns">
              <button type="button" className="ic-checkout" onClick={print}><Icon name="download" size={16} />{t("Save as PDF or print")}</button>
              <a className="ic-ghost" aria-disabled={ended || undefined} onClick={(e) => { if (ended || window.__saleEnded) { e.preventDefault(); setEnded(true); } }} href={`mailto:${SALES}?subject=${encodeURIComponent(`Quote ${no}`)}&body=${encodeURIComponent(emailBody)}`}>{t("Email it to sales")}</a>
            </div>
            <p className="qd-note">{t("Your quote is made in your browser. Nothing is sent until you email it.")}</p>
          </>
        )}
      </div>
    </div>
  );
}
