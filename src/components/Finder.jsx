import { useMemo, useState } from "react";
import { t } from "../i18n.js";
import { byHandle, img, money } from "../lib.js";
import { useCart } from "../cart.jsx";
import { Icon, Link } from "./ui.jsx";
import { BenefitArt } from "./Chrome.jsx";

/* "Find your machine": a compact card in the last cell of the home product grid.
   The questions follow the four-step finder on thunderlaserusa.com (material → work → pieces → shop → machine), adapted to the
   OneLaser line-up. What is different: single-choice steps move on by themselves, every step can be skipped or revisited, the
   current best match is named while you answer, and the card ends as a shoppable product card (reasons, price, 24-month figure,
   add to cart, buy now) instead of sending you to another page.
   The rules below are a first pass written from the published specs. TODO(team): sales to confirm weights and wording. */

const M = {
  xrf: { handle: "onelaser-xrf-desktop-laser-machine", width: 23.6, tube: "rf", tier: 1 },
  vertigo: { handle: "vertigo-vertical-laser-engraver", width: 0, tube: "rf", tier: 1 },
  cobra8: { handle: "cobra-8-90w-co2-laser-engraver-cutter", width: 31.5, tube: "glass", tier: 2 },
  cobra10: { handle: "cobra-10-100w-co2-laser-engraver-cutter", width: 39.4, tube: "glass", tier: 2 },
  cobra14: { handle: "cobra-14-130w-co2-laser-engraver-cutter", width: 55.1, tube: "glass", tier: 2 },
  hydra7: { handle: "hydra-7-gen-2-70w-rf-co2-dual-laser-machine", width: 27.6, tube: "hybrid", tier: 3 },
  hydra9: { handle: "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", width: 35.4, tube: "hybrid", tier: 3 },
  hydra13: { handle: "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", width: 51.2, tube: "hybrid", tier: 3 },
  hydra16: { handle: "hydra-16-gen-2-70w-rf-co2-dual-laser-machine", width: 63, tube: "hybrid", tier: 3 },
};
const POPULAR = ["xrf", "hydra9", "cobra10"];

const STEPS = [
  {
    id: "material", label: "Your material", title: "What do you work with?", hint: "Pick all that apply.", multi: true,
    options: [
      ["wood", "Wood, acrylic, MDF"],
      ["leather", "Leather, fabric, paper"],
      ["drinkware", "Tumblers and drinkware"],
      ["stone", "Glass, stone, slate, tile"],
      ["coated", "Coated or anodized metal"],
      ["photo", "Photos and fine detail"],
    ],
  },
  {
    id: "work", label: "Your work", title: "Mostly cutting or mostly engraving?", hint: "Most shops do both. Pick the bigger share.",
    options: [["engrave", "Mostly engraving"], ["both", "About half and half"], ["cut", "Mostly cutting"]],
  },
  {
    id: "size", label: "Your pieces", title: "How big is your largest piece?", hint: "Pick the closest size.",
    options: [
      ["s", "Small: up to 12 × 12 in.", "Tags, coasters, ornaments"],
      ["m", "Medium: up to 24 × 12 in.", "Signs, cutting boards"],
      ["l", "Large: up to 36 × 24 in.", "Big signs, 3 × 2 ft sheets"],
      ["xl", "Extra large: up to 51 × 35 in.", "Furniture panels, batch layouts"],
      ["xxl", "Full size: up to 63 × 39 in.", "Large-format production"],
    ],
  },
  {
    id: "shop", label: "Your shop", title: "How much will it run?", hint: "Pick where you are today, plus a little room to grow.",
    options: [["side", "Side business or just starting"], ["full", "Full-time shop"], ["high", "High volume, every day"]],
  },
];
const NEED = { s: 12, m: 24, l: 36, xl: 51, xxl: 63 };

/** Score every machine against the answers. Returns [{ key, score, reasons }] best first. */
function rank(a) {
  const mats = a.material || [];
  const onlyDrinkware = mats.length === 1 && mats[0] === "drinkware";
  return Object.entries(M)
    .map(([key, m]) => {
      let score = 0;
      const reasons = [];
      const add = (n, why) => { score += n; if (why && n > 0) reasons.push([n, why]); };
      if (mats.includes("drinkware")) {
        if (key === "vertigo") add(onlyDrinkware ? 9 : 4, "Built-in vertical rotary for drinkware");
        else add(0.5, "Takes a rotary attachment for round items");
      } else if (key === "vertigo" && mats.length) score -= 100; // drinkware machine: only offered when drinkware is picked
      if (mats.includes("photo") || mats.includes("stone") || mats.includes("coated")) {
        if (m.tube !== "glass") add(2, "RF tube for fine detail and photo engraving");
      }
      if (mats.includes("wood") && a.work !== "engrave" && m.tube !== "rf") add(1.5, m.tube === "glass" ? "Glass CO₂ power for cutting wood and acrylic" : "Hybrid option adds a glass tube for cutting");
      if (a.work === "engrave") { if (m.tube !== "glass") add(3, "RF source: fast, clean engraving"); }
      if (a.work === "cut") { if (m.tube === "glass") add(3, "High-power glass tube for cutting"); else if (m.tube === "hybrid") add(2, "Hybrid option adds a glass tube for cutting"); }
      if (a.work === "both") { if (m.tube === "hybrid") add(3, "RF for engraving, glass tube for cutting"); else add(1); }
      if (a.size) {
        const need = NEED[a.size];
        if (key === "vertigo") { if (need > 24) score -= 100; else if (!onlyDrinkware) score -= 4; }
        else if (m.width + 1 < need) score -= 100;
        else {
          const spare = m.width - need;
          add(spare < 14 ? 4 : spare < 28 ? 2 : 0.5, spare < 14 ? "Work area fits your largest piece" : "Work area with room to grow");
        }
      }
      if (a.shop === "side") add(m.tier === 1 ? 3 : m.tier === 2 ? 1.5 : 0, m.tier === 1 ? "Desktop size and price to start with" : "Workshop capacity at an entry price");
      if (a.shop === "full") add(m.tier === 3 ? 2.5 : m.tier === 2 ? 2 : 0.5, m.tier === 3 ? "2,000 mm/s and 4G for daily production" : "Sized for a full-time workshop");
      if (a.shop === "high") add(m.tier === 3 ? 4 : m.tier === 2 ? 1 : 0, "Industrial speed for high-volume runs");
      // small nudge so the popular models lead when nothing is answered
      score += POPULAR.includes(key) ? 0.3 - POPULAR.indexOf(key) * 0.05 : 0;
      return { key, score, reasons: reasons.sort((x, y) => y[0] - x[0]).map((r) => r[1]).filter((r, i, all) => all.indexOf(r) === i).slice(0, 3) };
    })
    .filter((r) => r.score > -50 && byHandle[M[r.key].handle])
    .sort((x, y) => y.score - x.score);
}

const FINANCE_MONTHS = 24; // same illustration as 1laser.com's "24-month payment": price ÷ 24
const monthly = (p) => (p.price / FINANCE_MONTHS).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Compact finder that sits in the last cell of the home product grid. When the last question is answered
    (or skipped) the card turns into a product card for the best match, with the reasons and the buy buttons. */
export default function FinderCard() {
  const { add } = useCart();
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [added, setAdded] = useState(false);
  const done = step >= STEPS.length;
  const cur = STEPS[Math.min(step, STEPS.length - 1)];
  const ranked = useMemo(() => rank(answers), [answers]);
  const answered = Object.values(answers).some((v) => (Array.isArray(v) ? v.length : v));
  const top = ranked[0] && byHandle[M[ranked[0].key].handle];
  const next = ranked[1] && byHandle[M[ranked[1].key].handle];
  const has = (s) => (s.multi ? (answers[s.id] || []).length > 0 : !!answers[s.id]);
  const pick = (id) => {
    if (cur.multi) {
      const set = answers[cur.id] || [];
      setAnswers({ ...answers, [cur.id]: set.includes(id) ? set.filter((x) => x !== id) : [...set, id] });
    } else {
      setAnswers({ ...answers, [cur.id]: id });
      setTimeout(() => setStep((s) => Math.max(s, STEPS.indexOf(cur) + 1)), 260);
    }
  };
  const reset = () => { setAnswers({}); setStep(0); };
  const addNow = () => {
    const variant = top.variants.find((v) => v.available) || top.variants[0];
    add(top.handle, variant.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };
  const bar = (
    <div className="fc-bar" aria-hidden="true">
      {STEPS.map((s, n) => <i key={s.id} className={n < step ? "done" : n === step ? "on" : ""} />)}
    </div>
  );

  if (done && top)
    return (
      <article className="ih-card fc fc-done" aria-live="polite">
        <div className="ih-card-info">
          <span className="ih-new">{t("Best match")}</span>
          <h3><Link to={`/products/${top.handle}`}>{top.name}</Link></h3>
          <ul className="fc-reasons">{(answered ? ranked[0].reasons : []).slice(0, 2).map((r) => <li key={r}><Icon name="check" size={14} />{t(r)}</li>)}</ul>
        </div>
        <Link to={`/products/${top.handle}`} className="ih-card-media" tabIndex={-1} aria-hidden="true"><img src={img(top.images[0], 700)} alt="" /></Link>
        <p className="ih-card-price">
          {top.priceVaries && <span>{t("From")}</span>}
          <b>{money(top.price)}</b>
          {top.compareAt > top.price && <s>{money(top.compareAt)}</s>}
          {top.compareAt > top.price && <em>{t("Save")} {money(top.compareAt - top.price)}</em>}
        </p>
        <p className="ih-card-monthly">{t("or")} <b>${monthly(top)}</b>{t("/mo for 24 months")}</p>
        <div className="ih-card-btns">
          <button type="button" className={`ih-btn line sm${added ? " added" : ""}`} disabled={!top.available} onClick={addNow}>
            <Icon name={added ? "check" : "cart"} size={16} />{added ? t("Added") : t("Add to cart")}
          </button>
          <Link to={`/products/${top.handle}`} className="ih-btn dark sm">{t("Buy now")}</Link>
        </div>
        <p className="fc-foot">
          <button type="button" onClick={reset}>↺ {t("Start over")}</button>
          {next && <Link to={`/products/${next.handle}`}>{t("Also worth a look")}: {next.name} ›</Link>}
        </p>
      </article>
    );

  return (
    <article className="ih-card fc">
      <p className="fc-kicker"><Icon name="search" size={14} />{t("Find your machine")}</p>
      {bar}
      <div className="fc-q" key={cur.id}>
        <h3>{t(cur.title)}</h3>
        <p className="fc-hint">{t(cur.hint)}</p>
        <div className="fc-options" role={cur.multi ? "group" : "radiogroup"}>
          {cur.options.map(([id, label]) => {
            const on = cur.multi ? (answers[cur.id] || []).includes(id) : answers[cur.id] === id;
            return (
              <button key={id} type="button" role={cur.multi ? "checkbox" : "radio"} aria-checked={on} className={on ? "on" : ""} onClick={() => pick(id)}>
                <span>{t(label)}</span><i aria-hidden="true"><Icon name="check" size={12} /></i>
              </button>
            );
          })}
        </div>
      </div>
      <div className="fc-nav">
        {step > 0 ? <button type="button" className="fc-link" onClick={() => setStep(step - 1)}>← {t("Back")}</button> : <span className="fc-count">{step + 1} / {STEPS.length}</span>}
        {top && answered && <span className="fc-peek" aria-live="polite">{t("Best match")}: <b>{top.name}</b></span>}
        <button type="button" className={cur.multi && has(cur) ? "ih-btn dark sm" : "fc-link"} onClick={() => setStep(step + 1)}>
          {cur.multi && has(cur) ? t("Continue") : t("Skip")}
        </button>
      </div>
    </article>
  );
}

/** Links and the "talk to us" card under the grid, after the same block on thunderlaserusa.com. */
export function FinderHelp() {
  return (
    <>
      <p className="fd-links">
        <Link to="/compare">{t("Compare every spec")} ›</Link>
        <Link href="https://www.1laser.com/pages/financing">{t("Pricing and financing")} ›</Link>
      </p>
      <div className="fd-help">
        <BenefitArt name="support" />
        <div>
          <h3>{t("Not sure which one fits?")}</h3>
          <p>{t("Talk it through with a OneLaser laser engineer. Tell us what you make and we'll point you to the right machine.")}</p>
        </div>
        <Link href="https://www.1laser.com/pages/sales-consultation" className="ih-btn dark">{t("Schedule a call")}</Link>
      </div>
    </>
  );
}
