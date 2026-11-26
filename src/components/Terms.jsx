import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { lockScroll, popupLink, useFocusTrap, isTopDialog } from "../lib.js";
import { footer } from "../data/site.js";
import policies from "../data/policies.json";
import { Icon } from "./ui.jsx";

/* Policies the buyer accepts before checkout (as on aeonlaser.us): terms, warranty, shipping and refund, linked to the
   1laser.com pages in the footer's Policy group. Accepted once per visit. */
const TERMS_KEY = "onelaser-terms-ok";
/** [accepted, set]: shared by the cart and checkout, remembered for the visit. */
export function useTerms() {
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem(TERMS_KEY) === "1"; } catch { return false; } });
  const set = (v) => { setOk(v); try { v ? sessionStorage.setItem(TERMS_KEY, "1") : sessionStorage.removeItem(TERMS_KEY); } catch { /* private mode: this page only */ } };
  return [ok, set];
}
/* slot in the sentence → [link label, 1laser.com page] */
const POLICY = { terms: ["Terms of Service", "terms-of-service"], warranty: ["Warranty Policy", "warranty-policy"], shipping: ["Shipping Policy", "shipping-policy"], refund: ["Refund Policy", "refund-policy"] };
const policyUrl = (name) => footer.groups.find(([g]) => g === "Policy")?.[1].find(([l]) => l === name)?.[1];
/* One translated sentence with link slots, so each language keeps its own order and punctuation. Each link opens the
   policy in a popup (PolicyBody); a new tab still gets the page on 1laser.com. */
function TermsText() {
  const parts = t("I have read and accept the {terms}, {warranty}, {shipping} and {refund}.").split(/\{(\w+)\}/);
  return (
    <span>
      {parts.map((x, n) => {
        if (n % 2 === 0) return x;
        const [label, page] = POLICY[x] || [];
        return label ? <a key={x} {...popupLink("policy", { page }, policyUrl(label))}>{t(label)}</a> : null;
      })}
    </span>
  );
}
/** A policy's text (copied from 1laser.com, src/data/policies.json) for the policy popup. */
export function PolicyBody({ page }) {
  const blocks = policies.pages[page] || [];
  const label = Object.values(POLICY).find(([, p]) => p === page)?.[0];
  return (
    <div className="tdlg-policy-body">
      {blocks.map(([tag, text], n) => (tag === "h1" ? <h3 key={n}>{text}</h3> : tag === "h" ? <h4 key={n}>{text}</h4> : tag === "li" ? <p key={n} className="li">{text}</p> : <p key={n}>{text}</p>))}
      {label && <p className="tdlg-policy-src"><a href={policyUrl(label)} target="_blank" rel="noreferrer">{t("Open on 1laser.com")} ↗</a></p>}
    </div>
  );
}
export function TermsBox({ ok, onChange, id, bad }) {
  return (
    <label className={`ic-terms${bad ? " bad" : ""}`} htmlFor={id}>
      <input id={id} type="checkbox" checked={ok} onChange={(e) => onChange(e.target.checked)} aria-invalid={bad || undefined} />
      <TermsText />
    </label>
  );
}
/* Check out without the box ticked: ask once in a small window; ticking it there continues to checkout. */
export function TermsAsk({ onClose, onAccept }) {
  const box = useRef(null);
  useFocusTrap(box);
  useEffect(() => {
    const unlock = lockScroll();
    const esc = (e) => e.key === "Escape" && isTopDialog(box.current) && onClose();
    window.addEventListener("keydown", esc);
    return () => { unlock(); window.removeEventListener("keydown", esc); };
  }, []);
  return (
    <div className="ic-offer-scrim" onClick={onClose}>
      <div ref={box} className="ic-ask" role="dialog" aria-modal="true" aria-labelledby="ic-terms-h" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="ic-terms-x" aria-label={t("Close")} onClick={onClose}><Icon name="close" size={20} /></button>
        <h2 id="ic-terms-h">{t("Please review and accept our policies")}</h2>
        <p className="ic-ask-sub">{t("Tick the box to continue to checkout.")}</p>
        <TermsBox id="ic-terms-modal" ok={false} onChange={(v) => v && onAccept()} />
      </div>
    </div>
  );
}

