import { useEffect, useMemo, useRef, useState } from "react";
import { t, tf } from "../i18n.js";
import { byHandle, frontImg, img, isTopDialog, lockScroll, money, useFocusTrap } from "../lib.js";
import { contact } from "../data/site.js";
import { Icon, Link } from "./ui.jsx";
import { useCart } from "../cart.jsx";
import { M, QUIZ, matchQuiz } from "./finderRules.js";
import { MachineMorph } from "./Finder.jsx";
import Glance, { shortArea } from "./Glance.jsx";

/* "Find my machine", reachable from the header on every page (Figma "Find my machine" Q1–Q4 + Results).
   Opens over the current page (window event "onelaser:finder"), so nobody loses their place.
   One question per screen with a 4-part progress bar. On wide screens a side panel keeps the machine animation running
   until two questions are answered, then shows the best match so far; the full result follows the last question. */

const MONTHS = 24; // same illustration as 1laser.com's "24-month payment": price ÷ 24
const available = (h) => !!byHandle[h]?.available;
/* The version a match is about: cutting wood or acrylic on a Hydra means the Hybrid (glass tube); otherwise the lowest-priced
   version. Its price is what the budget check, the price shown, the monthly figure and "Add to cart" all use. */
const cuts = (a) => (a.make || []).includes("signs") || (a.mats || []).some((m) => m === "wood" || m === "acrylic");
export function versionFor(p, a) {
  const vs = p.variants.filter((v) => v.available);
  if (vs.length < 2) return vs[0] || p.variants[0];
  return (cuts(a) && vs.find((v) => /hybrid/i.test(v.title))) || vs.reduce((m, v) => (v.price < m.price ? v : m));
}
const priceFor = (a) => (h) => (byHandle[h] ? versionFor(byHandle[h], a).price : 0);
const memo = { a: {}, step: 0 };

export const openFinder = () => window.dispatchEvent(new Event("onelaser:finder"));

function Pick({ r, kind, a }) {
  const p = byHandle[M[r.key].handle];
  const v = versionFor(p, a);
  return (
    <Link to={`/products/${p.handle}`} className="ff-alt">
      <span className="ff-alt-img"><img src={img(frontImg(p), 300)} alt="" loading="lazy" /></span>
      <span className="ff-alt-text">
        <small>{t(kind)}</small>
        <b>{p.name}</b>
        <em>{[p.specs?.["Laser source"]?.split(/;|, or /)[0], p.series === "vertigo" ? "Ø 16–230 mm" : shortArea(p.specs?.["Work area"]), money(v.price)].filter(Boolean).join(" · ")}</em>
      </span>
      <Icon name="chevron" size={18} />
    </Link>
  );
}

function Result({ a, onRetake, onClose }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const m = useMemo(() => matchQuiz(a, available, priceFor(a)), [a]);
  const p = m.best && byHandle[M[m.best.key].handle];
  if (!p) return null;
  const v = versionFor(p, a);
  const chips = QUIZ.flatMap((q) => [].concat(a[q.id] || []).map((id) => q.options.find((o) => o[0] === id)?.[1])).filter(Boolean);
  return (
    <div className="ff-result">
      <p className="ff-eyebrow">{t("Your best match")}</p>
      <h2>{tf("We recommend the {name}.", { name: p.name })}</h2>
      <ul className="ff-chips">{chips.map((c) => <li key={c}>{t(c)}</li>)}</ul>
      <article className="ff-best">
        <Link to={`/products/${p.handle}`} className="ff-best-img" onClick={onClose} key={p.handle}>
          <span className="ff-shine" />
          <img src={img(frontImg(p), 900)} alt={p.name} />
        </Link>
        <div className="ff-best-body">
          <header>
            <h3>{p.name}</h3>
            <p className="ff-price"><b>{money(v.price)}</b>{v.compareAt > v.price && <s>{money(v.compareAt)}</s>}</p>
          </header>
          {p.variants.length > 1 && v.title && <p className="ff-version">{v.title}</p>}
          <p className="ff-monthly">{tf("or about {amount}/mo over 24 months", { amount: money(Math.round(v.price / MONTHS)) })}</p>
          {(m.best.reasons.length > 0 || m.overBudget || m.bareMetal) && (
            <>
              <p className="ff-why-title">{t("Why it fits you")}</p>
              <ul className="ff-why">
                {m.best.reasons.map((r) => <li key={r}><Icon name="check" size={16} />{t(r)}</li>)}
              </ul>
              {m.overBudget && <p className="ff-note">{t("Our lasers start above $3,000. This is the most affordable one that fits your needs, and monthly payments are available.")}</p>}
              {m.bareMetal && <p className="ff-note">{t("Our CO₂ lasers can't mark bare metal. Cobra takes an optional IR module for that; ask an engineer which one you need.")}</p>}
            </>
          )}
          <Glance product={p} full={false} title={false} best={false} />
          <div className="ff-buy">
            <button type="button" className="ff-btn dark" onClick={() => { add(p.handle, v.id, 1); setAdded(true); }}><Icon name={added ? "check" : "cart"} size={18} />{t(added ? "Added to cart" : "Add to cart")}</button>
            <Link to={`/products/${p.handle}`} className="ff-btn line" onClick={onClose}>{t("View details")}</Link>
          </div>
        </div>
      </article>
      {(m.up || m.save) && (
        <>
          <div className="ff-alts-head"><h3>{t("Also worth a look")}</h3><button type="button" onClick={onRetake}>{t("Retake the quiz")} <Icon name="arrow" size={14} /></button></div>
          <div className="ff-alts" onClick={onClose}>
            {m.up && <Pick r={m.up} kind="Step up" a={a} />}
            {m.save && <Pick r={m.save} kind="Save money" a={a} />}
          </div>
        </>
      )}
      <div className="ff-second">
        <Icon name="headset" size={22} />
        <p>{t("Want a second opinion? Our U.S.-based engineers can confirm the fit.")}</p>
        <Link to="/pages/sales-consultation" className="ff-btn line" onClick={onClose}>{t("Talk to an engineer")}</Link>
      </div>
    </div>
  );
}

export default function FinderFlow() {
  const [open, setOpen] = useState(false);
  const [a, setA] = useState(memo.a);
  const [step, setStep] = useState(memo.step);
  const box = useRef(null);
  useEffect(() => { memo.a = a; memo.step = step; }, [a, step]);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener("onelaser:finder", on);
    return () => window.removeEventListener("onelaser:finder", on);
  }, []);
  // a link inside the finder (a product, the booking page) closes it
  useEffect(() => { if (!open) return undefined; const off = () => setOpen(false); window.addEventListener("hashchange", off); return () => window.removeEventListener("hashchange", off); }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const unlock = lockScroll();
    const key = (e) => e.key === "Escape" && isTopDialog(box.current) && setOpen(false);
    window.addEventListener("keydown", key);
    return () => { unlock(); window.removeEventListener("keydown", key); };
  }, [open]);
  useFocusTrap(box, open);
  useEffect(() => { box.current?.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);
  const done = step >= QUIZ.length;
  const q = QUIZ[Math.min(step, QUIZ.length - 1)];
  const has = (x) => (x.multi ? (a[x.id] || []).length > 0 : !!a[x.id]);
  const answered = QUIZ.filter(has).length;
  const live = useMemo(() => (answered >= 2 ? matchQuiz(a, available, priceFor(a)) : null), [a, answered]);
  const liveP = live?.best && byHandle[M[live.best.key].handle];
  if (!open) return null;

  const pick = (id) => {
    if (q.multi) {
      const cur = a[q.id] || [];
      // "Not sure yet" stands alone
      const next = id === "unsure" ? (cur.includes("unsure") ? [] : ["unsure"]) : cur.includes(id) ? cur.filter((x) => x !== id) : [...cur.filter((x) => x !== "unsure"), id];
      setA({ ...a, [q.id]: next });
    } else {
      setA({ ...a, [q.id]: id });
    }
  };
  const retake = () => { setA({}); setStep(0); };
  const close = () => setOpen(false);

  return (
    <div className="ff" ref={box} role="dialog" aria-modal="true" aria-label={t("Find my machine")}>
      <div className="ff-wrap">
        <div className="ff-top">
          <p className="ff-brand"><Icon name="sparkle" size={16} />{t("Find my machine")}</p>
          {!done && <span className="ff-count">{tf("Question {n} of {total}", { n: step + 1, total: QUIZ.length })}<span className="ff-time"> · {t("about 30 seconds")}</span></span>}
          <button type="button" className="ff-x" aria-label={t("Close")} onClick={close}><Icon name="close" size={20} /></button>
        </div>
        {!done && <ol className="ff-bar" aria-hidden="true">{QUIZ.map((x, n) => <li key={x.id} className={n <= step ? "on" : ""} />)}</ol>}
        <div className={`ff-body${done ? " done" : ""}`}>
          {done ? (
            <Result a={a} onRetake={retake} onClose={close} />
          ) : (
            <>
              <section className="ff-q" key={q.id}>
                <h2>{t(q.title)}</h2>
                <p className="ff-hint">{t(q.hint)}</p>
                <div className="ff-opts" role={q.multi ? "group" : "radiogroup"} aria-label={t(q.title)}>
                  {q.options.map(([id, label, sub, icon]) => {
                    const on = q.multi ? (a[q.id] || []).includes(id) : a[q.id] === id;
                    return (
                      <button key={id} type="button" role={q.multi ? "checkbox" : "radio"} aria-checked={on} className={on ? "on" : ""} onClick={() => pick(id)}>
                        <span className="ff-ico"><Icon name={icon} size={20} /></span>
                        <i className={q.multi ? "box" : "dot"} aria-hidden="true">{on && <Icon name="check" size={12} />}</i>
                        <b>{t(label)}</b>
                        {sub && <em>{t(sub)}</em>}
                      </button>
                    );
                  })}
                </div>
                <div className="ff-nav">
                  {step > 0 && <button type="button" className="ff-btn line" onClick={() => setStep(step - 1)}>{t("Back")}</button>}
                  <a href={`tel:${contact.tel}`} className="ff-call"><Icon name="headset" size={16} />{t("Rather talk it through? Call a U.S.-based engineer")}</a>
                  <button type="button" className="ff-btn dark" disabled={!has(q)} onClick={() => setStep(step + 1)}>{t(step === QUIZ.length - 1 ? "See my match" : "Next")}</button>
                </div>
              </section>
              {/* wide screens: the animation runs until two answers are in, then the best match so far */}
              <aside className={`ff-side${liveP ? " live" : ""}`} aria-live="polite">
                {liveP ? (
                  <div className="ff-peek" key={liveP.handle}>
                    <p className="ff-peek-label">{t("Best match so far")}</p>
                    <img src={img(frontImg(liveP), 600)} alt="" />
                    <b>{liveP.name}</b>
                    <span>{money(versionFor(liveP, a).price)}</span>
                    {live.best.reasons[0] && <em><Icon name="check" size={12} />{t(live.best.reasons[0])}</em>}
                  </div>
                ) : (
                  <>
                    <p className="ff-peek-label">{t("Answer two questions to see your match")}</p>
                    <MachineMorph />
                  </>
                )}
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
