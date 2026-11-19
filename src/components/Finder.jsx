import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../i18n.js";
import { asset, byHandle, img, money } from "../lib.js";
import { AddButton, Icon, Link } from "./ui.jsx";
import { contact } from "../data/site.js";

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
    id: "material", short: "Material", label: "Your material", title: "What do you work with?", hint: "Pick all that apply.", multi: true,
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
    id: "work", short: "Work", label: "Your work", title: "Mostly cutting or mostly engraving?", hint: "Most shops do both. Pick the bigger share.",
    options: [["engrave", "Mostly engraving"], ["both", "About half and half"], ["cut", "Mostly cutting"]],
  },
  {
    id: "size", short: "Size", label: "Your pieces", title: "How big is your largest piece?", hint: "Pick the closest size.",
    options: [
      ["s", "Small: up to 12 × 12 in.", "Tags, coasters, ornaments"],
      ["m", "Medium: up to 24 × 12 in.", "Signs, cutting boards"],
      ["l", "Large: up to 36 × 24 in.", "Big signs, 3 × 2 ft sheets"],
      ["xl", "Extra large: up to 51 × 35 in.", "Furniture panels, batch layouts"],
      ["xxl", "Full size: up to 63 × 39 in.", "Large-format production"],
    ],
  },
  {
    id: "round", short: "Round items", label: "Round items", title: "Any round items, like tumblers, pens or bottles?", hint: "Round items need a rotary attachment.",
    options: [["flat", "No, all flat"], ["some", "Yes, some round items"], ["most", "Mostly round items"]],
  },
  {
    id: "shop", short: "Volume", label: "Your shop", title: "How much will it run?", hint: "Pick where you are today, plus a little room to grow.",
    options: [["side", "Side business or just starting"], ["full", "Full-time shop"], ["high", "High volume, every day"]],
  },
  {
    id: "vent", short: "Venting", label: "Ventilation", title: "Can you vent fumes outside?", hint: "A window or wall vent works. If not, we will point you to an indoor filter.",
    options: [["out", "Yes, through a wall or window"], ["in", "No, it has to stay indoors"]],
  },
];
const NEED = { s: 12, m: 24, l: 36, xl: 51, xxl: 63 };

/** Score every machine against the answers. Returns [{ key, score, reasons }] best first. */
function rank(a) {
  const mats = a.material || [];
  const onlyDrinkware = (mats.length === 1 && mats[0] === "drinkware") || a.round === "most";
  const round = mats.includes("drinkware") || a.round === "some" || a.round === "most";
  return Object.entries(M)
    .map(([key, m]) => {
      let score = 0;
      const reasons = [];
      const add = (n, why) => { score += n; if (why && n > 0) reasons.push([n, why]); };
      if (round) {
        if (key === "vertigo") add(onlyDrinkware ? 9 : 4, "Built-in vertical rotary for drinkware");
        else add(0.5, "Takes a rotary attachment for round items");
      } else if (key === "vertigo" && (mats.length || a.round === "flat")) score -= 100; // drinkware machine: only offered for round work
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

/** Accessories the answers call for: a rotary for round items (not for VertiGo, which has one built in) and an indoor fume filter. */
function addOnsFor(a, key) {
  const out = [];
  const round = (a.material || []).includes("drinkware") || a.round === "some" || a.round === "most";
  if (round && key !== "vertigo") out.push(["Rotary attachment", M[key].tier === 1 ? "multi-function-rotary-axis-57-motor" : "piburn-omni-for-onelaser"]);
  if (a.vent === "in") out.push(["Indoor fume filter", M[key].tier === 1 ? "filtrabox-micro" : "filtrabox-compact-x"]);
  return out.filter(([, h]) => byHandle[h]);
}

const FINANCE_MONTHS = 24; // same illustration as 1laser.com's "24-month payment": price ÷ 24
const monthly = (p) => (p.price / FINANCE_MONTHS).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* Idle state of the finder preview: line drawings traced from the four official product photos
   (public/assets/finder-line-*.png). Every 3 s a laser head sweeps across and engraves the next machine in,
   with its name and three key specs from the catalog. Pure CSS, so outline, laser and label share one clock. */
/* Front views drawn in code (viewBox 240 × 160, ground at y 150). Proportions follow the product photos;
   VertiGo uses its published 630 × 710 mm front. Red = the brand trim where it sits on each machine. */
const Logo = ({ x, y, size = 6, anchor = "start" }) => (
  <text x={x} y={y} fontSize={size} fontWeight="700" textAnchor={anchor} className="fv-logo"><tspan className="fv-red">1</tspan> ONELASER</text>
);
const Feet = ({ xs, y, h = 6 }) => xs.map((x) => <path key={x} d={`M${x - 3} ${y} h6 v${h - 2} h2 v2 h-10 v-2 h2 z`} />);
const Casters = ({ xs, y }) => xs.map((x) => <g key={x}><path d={`M${x} ${y} v3`} /><circle cx={x} cy={y + 7} r="4" /></g>);

const FRONT = {
  xrf: (
    <>
      <rect x="20" y="90" width="200" height="56" rx="3" />
      <rect x="20" y="86" width="200" height="9" rx="2" className="fv-glass" />
      <path d="M24 116 H150 L162 142 H24 Z" className="fv-dark" />
      <rect x="20" y="111" width="146" height="3" className="fv-trim" />
      <Logo x={30} y={130} size={7} />
      <rect x="176" y="101" width="26" height="9" rx="2" />
      <path d="M184 122 h18 M184 126 h18 M184 130 h18" className="fv-thin" />
      <circle cx="216" cy="118" r="3" className="fv-trim" />
      <Feet xs={[32, 208]} y={146} h={4} />
    </>
  ),
  cobra: (
    <>
      <rect x="25" y="30" width="190" height="110" rx="3" />
      <rect x="25" y="26" width="190" height="8" rx="2" className="fv-glass" />
      <rect x="43" y="30" width="3" height="110" className="fv-trim" />
      <text x="36" y="132" fontSize="9" fontWeight="800" transform="rotate(-90 36 132)" className="fv-label">COBRA <tspan className="fv-red">10</tspan></text>
      <rect x="46" y="34" width="116" height="106" className="fv-dark" />
      <path d="M58 40 H150 L146 56 H62 Z" className="fv-glass" />
      <rect x="46" y="68" width="116" height="3.5" className="fv-trim" />
      <Logo x={150} y={128} size={7} anchor="end" />
      <path d="M162 30 V140" />
      <circle cx="174" cy="44" r="3.2" className="fv-trim" />
      <path d="M172 58 h34 M172 62 h34 M172 66 h34" className="fv-thin" />
      <circle cx="176" cy="84" r="1.3" /><circle cx="176" cy="90" r="1.3" /><circle cx="176" cy="96" r="1.3" />
      <Feet xs={[36, 94, 150, 204]} y={140} h={10} />
    </>
  ),
  hydra: (
    <>
      <rect x="22" y="28" width="196" height="104" rx="3" />
      <rect x="22" y="28" width="110" height="16" className="fv-glass" />
      <path d="M22 44 H132 V112 H90 L80 104 H22 Z" className="fv-dark" />
      <rect x="22" y="68" width="110" height="3.5" className="fv-trim" />
      <Logo x={32} y={86} size={7} />
      <text x="126" y="108" fontSize="6.5" fontWeight="800" fontStyle="italic" textAnchor="end" className="fv-label">Gen<tspan className="fv-red">2</tspan></text>
      <path d="M132 28 V132" />
      <path d="M150 52 h50 M150 56 h50 M150 60 h50" className="fv-thin" />
      <circle cx="160" cy="84" r="1.3" /><circle cx="160" cy="90" r="1.3" /><circle cx="160" cy="96" r="1.3" />
      <rect x="140" y="38" width="10" height="6" rx="1" />
      <path d="M22 112 H218" />
      <rect x="30" y="118" width="92" height="9" rx="1.5" className="fv-thin" />
      <path d="M190 124 h18 M194 127 h14" className="fv-trim-line" />
      <Casters xs={[36, 82, 158, 204]} y={132} />
    </>
  ),
  vertigo: (
    <>
      <rect x="68" y="24" width="104" height="118" rx="3" />
      <Logo x={112} y={38} size={7} anchor="middle" />
      <rect x="78" y="48" width="70" height="80" rx="2" className="fv-dark" />
      <rect x="84" y="56" width="58" height="64" className="fv-glass" />
      <rect x="78" y="48" width="70" height="5" className="fv-trim" />
      <rect x="78" y="123" width="70" height="5" className="fv-trim" />
      <rect x="150" y="70" width="4" height="34" rx="1" />
      <path d="M157 34 h10" className="fv-trim-line" />
      <rect x="157" y="46" width="10" height="14" rx="1" />
      <text x="165" y="134" fontSize="8" fontWeight="800" fontStyle="italic" transform="rotate(-90 165 134)" className="fv-label">VertiGo</text>
      <path d="M72 142 v4 h96 v-4" />
    </>
  ),
};

const SHAPES = [
  { name: "XRF", art: "xrf", specs: [["Laser", "38W RF"], ["Work area", "23.6 × 11.8 in"], ["Speed", "1,200 mm/s"]] },
  { name: "Cobra", art: "cobra", specs: [["Laser", "90–130W CO₂"], ["Work area", "up to 55 × 35 in"], ["Speed", "1,200 mm/s"]] },
  { name: "Hydra Gen2", art: "hydra", specs: [["Laser", "70W RF / hybrid"], ["Work area", "up to 63 × 39 in"], ["Speed", "2,000 mm/s · 4G"]] },
  { name: "VertiGo", art: "vertigo", specs: [["Laser", "38W RF"], ["Fits", "Ø 16–230 mm"], ["Speed", "800 mm/s"]] },
];
const DUR = 12; // whole cycle; each machine gets a quarter

function MachineMorph() {
  return (
    <div className="fx-morph" aria-hidden="true" style={{ "--dur": `${DUR}s`, "--step": `${DUR / SHAPES.length}s` }}>
      <div className="fx-art">
        {SHAPES.map((x, n) => (
          <svg key={x.art} viewBox="0 0 240 160" className="fv" style={{ animationDelay: `${(n * DUR) / SHAPES.length}s` }}>
            <path d="M8 150.5 H232" className="fv-ground" />
            <g className="fv-lines">{FRONT[x.art]}</g>
          </svg>
        ))}
        <span className="fx-beam" />
      </div>
      <div className="fx-ms">
        {SHAPES.map((x, n) => (
          <div key={x.name} className="fx-ms-item" style={{ animationDelay: `${(n * DUR) / SHAPES.length}s` }}>
            <b>{x.name}</b>
            <dl>{x.specs.map(([k, v]) => <div key={k}><dt>{t(k)}</dt><dd>{v}</dd></div>)}</dl>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Machine finder: spans two cells of the home product grid (one row below on phones).
    Left: one question at a time with a labelled stepper. Right: the best match so far, which updates with every answer,
    so the visitor sees where the answers lead before the end. When done, the card shows the pick and the full
    result opens under the grid (FinderResult). */
const memo = { answers: {}, step: 0 };

export default function FinderCard() {
  const [answers, setAnswersRaw] = useState(memo.answers);
  const [step, setStepRaw] = useState(memo.step);
  const setAnswers = (v) => { memo.answers = v; setAnswersRaw(v); };
  const setStep = (v) => setStepRaw((s) => { const n = typeof v === "function" ? v(s) : v; memo.step = n; return n; });
  const [slot, setSlot] = useState(null);
  const [lead, setLead] = useState(null);
  useEffect(() => setSlot(document.getElementById("fc-result")), []);
  const done = step >= STEPS.length;
  const cur = STEPS[Math.min(step, STEPS.length - 1)];
  const ranked = useMemo(() => rank(answers), [answers]);
  const lines = summary(answers);
  const answered = lines.length > 0;
  const top = ranked[0] && byHandle[M[ranked[0].key].handle];
  const runner = ranked[1] && byHandle[M[ranked[1].key].handle];
  const has = (s) => (s.multi ? (answers[s.id] || []).length > 0 : !!answers[s.id]);
  const reveal = () => setTimeout(() => document.getElementById("fc-result")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  const finish = () => { setStep(STEPS.length); reveal(); };
  const pick = (id) => {
    if (cur.multi) {
      const set = answers[cur.id] || [];
      setAnswers({ ...answers, [cur.id]: set.includes(id) ? set.filter((x) => x !== id) : [...set, id] });
    } else {
      setAnswers({ ...answers, [cur.id]: id });
      const last = STEPS.indexOf(cur) === STEPS.length - 1;
      setTimeout(() => { setStep((s) => Math.max(s, STEPS.indexOf(cur) + 1)); if (last) reveal(); }, 260);
    }
  };
  const reset = () => { setAnswers({}); setStep(0); };
  const edit = (n) => { setStep(n); document.querySelector(".fx")?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const leadDialog = lead && <LeadDialog mode={lead} product={answered ? top : null} lines={lines} onClose={() => setLead(null)} />;

  const stepper = (
    <ol className="fx-steps" aria-label={t("Progress")}>
      {STEPS.map((s, n) => {
        const state = n === step ? "on" : has(s) ? "done" : n < step ? "skip" : "";
        return (
          <li key={s.id} className={state}>
            <button type="button" onClick={() => setStep(n)} aria-current={n === step ? "step" : undefined} disabled={n > step && !has(s)}>
              <i>{has(s) && n !== step ? <Icon name="check" size={11} /> : n + 1}</i><span>{t(s.short)}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );

  if (done && top) {
    const reasons = answered ? ranked[0].reasons : [];
    return (
      <article className="fx fx-done" aria-live="polite">
        <div className="fx-main">
          <p className="fx-kicker"><Icon name="check" size={14} />{t("Your match is ready")}</p>
          <p className="fx-sub">{fill(t("Based on {n} of {total} answers"), { n: lines.length, total: STEPS.length })}</p>
          <h3 className="fx-name"><Link to={`/products/${top.handle}`}>{top.name}</Link></h3>
          <p className="fx-tag">{top.tagline}</p>
          {reasons.length > 0 && <ul className="fx-why">{reasons.map((r) => <li key={r}><Icon name="check" size={14} />{t(r)}</li>)}</ul>}
          <p className="fx-price"><b>{money(top.price)}</b>{top.compareAt > top.price && <s>{money(top.compareAt)}</s>}<span>{t("or")} ${monthly(top)}{t("/mo for 24 months")}</span></p>
          <div className="fx-cta">
            <button type="button" className="ih-btn dark" onClick={reveal}>{t("See why it fits")} ↓</button>
            <button type="button" className="fx-quote" onClick={() => setLead("quote")}><Icon name="mail" size={16} />{t("Email me a written quote")}</button>
          </div>
          <p className="fx-foot">
            <button type="button" onClick={() => edit(STEPS.length - 1)}>← {t("Change answers")}</button>
            <button type="button" onClick={reset}>↺ {t("Start over")}</button>
          </p>
        </div>
        <Link to={`/products/${top.handle}`} className="fx-stage" tabIndex={-1} aria-hidden="true"><img src={img(top.images[0], 900)} alt="" /></Link>
        {slot && createPortal(<FinderResult answers={answers} ranked={ranked} onEdit={edit} onReset={reset} />, slot)}
        {leadDialog}
      </article>
    );
  }

  return (
    <article className="fx">
      <div className="fx-main">
        <div className="fx-top">
          <p className="fx-kicker"><Icon name="search" size={14} />{t("Find your machine")}</p>
          <span className="fx-time">{t("6 quick questions · about 30 seconds")}</span>
        </div>
        {stepper}
        <div className="fx-q" key={cur.id}>
          <p className="fx-count">{fill(t("Question {n} of {total}"), { n: step + 1, total: STEPS.length })}</p>
          <h3>{t(cur.title)}</h3>
          <p className="fx-hint">{t(cur.hint)}</p>
          <div className={`fx-options${cur.options.length > 3 ? " grid" : ""}`} role={cur.multi ? "group" : "radiogroup"} aria-label={t(cur.title)}>
            {cur.options.map(([id, label, sub]) => {
              const on = cur.multi ? (answers[cur.id] || []).includes(id) : answers[cur.id] === id;
              return (
                <button key={id} type="button" role={cur.multi ? "checkbox" : "radio"} aria-checked={on} className={on ? "on" : ""} onClick={() => pick(id)}>
                  <span><b>{t(label)}</b>{sub && <em>{t(sub)}</em>}</span>
                  <i aria-hidden="true"><Icon name="check" size={12} /></i>
                </button>
              );
            })}
          </div>
        </div>
        <div className="fx-nav">
          {step > 0 ? <button type="button" className="fx-link" onClick={() => setStep(step - 1)}>← {t("Back")}</button> : <span />}
          <span className="fx-nav-r">
            {!(cur.multi && has(cur)) && <button type="button" className="fx-link" onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}>{t("Skip")}</button>}
            {cur.multi && has(cur) && <button type="button" className="ih-btn dark sm" onClick={() => (step === STEPS.length - 1 ? finish() : setStep(step + 1))}>{t("Continue")} →</button>}
            {answered && step < STEPS.length - 1 && <button type="button" className="fx-link strong" onClick={finish}>{t("See my match")}</button>}
          </span>
        </div>
      </div>
      <aside className={`fx-peek${answered ? " live" : ""}`} aria-live="polite">
        <p className="fx-peek-label">{answered ? t("Best match so far") : t("Your match appears here")}</p>
        {!answered && <MachineMorph />}
        {answered && top && (
          <Link to={`/products/${top.handle}`} className="fx-peek-card" key={top.handle}>
            <span className="fx-peek-img"><img src={img(top.images[0], 600)} alt="" /></span>
            <b>{top.name}</b>
            <span className="fx-peek-price">{money(top.price)}{top.compareAt > top.price && <s>{money(top.compareAt)}</s>}</span>
          </Link>
        )}
        {answered ? (
          <>
            <ul className="fx-peek-why">{ranked[0].reasons.slice(0, 2).map((r) => <li key={r}><Icon name="check" size={12} />{t(r)}</li>)}</ul>
            <p className="fx-meter" aria-hidden="true"><i style={{ width: `${(lines.length / STEPS.length) * 100}%` }} /></p>
            <p className="fx-peek-note">{fill(t("Based on {n} of {total} answers"), { n: lines.length, total: STEPS.length })}{runner && <> · {t("Runner-up")}: {runner.name}</>}</p>
          </>
        ) : (
          <p className="fx-peek-note">{t("Your best match updates with every answer.")}</p>
        )}
        <a href={`tel:${contact.tel}`} className="fx-expert"><Icon name="phone" size={14} />{t("Rather talk to an expert?")} {contact.phone}</a>
      </aside>
      {leadDialog}
    </article>
  );
}

const SIZE_TEXT = { s: "12 × 12 in.", m: "24 × 12 in.", l: "36 × 24 in.", xl: "51 × 35 in.", xxl: "63 × 39 in." };
const fill = (str, vars) => Object.entries(vars).reduce((out, [k, v]) => out.replace(`{${k}}`, v), str);
const RF_WARRANTY = ["xrf", "hydra7", "hydra9", "hydra13", "hydra16"];

/** What the visitor told the finder, as question → answer lines (shown on the result and sent with a lead). */
function summary(answers) {
  return STEPS.map((s, n) => {
    const v = answers[s.id];
    const ids = Array.isArray(v) ? v : v ? [v] : [];
    if (!ids.length) return null;
    return { n, q: s.title, label: s.label, a: ids.map((id) => s.options.find((o) => o[0] === id)?.[1]).filter(Boolean) };
  }).filter(Boolean);
}

/** "Good to know": plain notes built only from catalog facts (work areas, prices, accessories) and the published warranty. */
function notesFor(answers, key, product) {
  const out = [];
  const mats = answers.material || [];
  const round = mats.includes("drinkware") || answers.round === "some" || answers.round === "most";
  const area = product.specs?.["Work area"];
  if (answers.size && key !== "vertigo" && area) out.push(fill(t("Your largest piece (up to {size}) fits inside its {area} work area."), { size: SIZE_TEXT[answers.size], area }));
  if (round && key === "vertigo") out.push(fill(t("The rotary is built in: {range}."), { range: product.specs?.["Key capability"] || "" }));
  addOnsFor(answers, key).forEach(([label, h]) => {
    const a = { ...byHandle[h], name: byHandle[h].name.split(/ [–-] /)[0] };
    if (label === "Rotary attachment") out.push(fill(t("Round items need a rotary, sold separately: {name} ({price})."), { name: a.name, price: money(a.price) }));
    else out.push(fill(t("No outside vent? The {name} ({price}) is the indoor fume filter we pair with it."), { name: a.name, price: money(a.price) }));
  });
  if (answers.round === "most" && key !== "vertigo" && byHandle[M.vertigo.handle]) {
    const v = byHandle[M.vertigo.handle];
    out.push(fill(t("Mostly tumblers? {name} ({price}) has a vertical rotary built in."), { name: v.name, price: money(v.price) }));
  }
  const family = Object.entries(M).filter(([k, m]) => k.replace(/\d+$/, "") === key.replace(/\d+$/, "") && m.width > M[key].width).sort((x, y) => x[1].width - y[1].width)[0];
  const bigger = family && byHandle[family[1].handle];
  if (bigger) out.push(fill(t("Room to grow: the {name} ({area}) is {price}."), { name: bigger.name, area: bigger.specs?.["Work area"] || "", price: money(bigger.price) }));
  return out;
}

const BUDGETS = ["Under $3k", "$3k–$5k", "$5k–$10k", "$10k+"];
const CODES = [["+1", "US"], ["+44", "UK"], ["+61", "AU"], ["+49", "DE"], ["+33", "FR"], ["+34", "ES"], ["+81", "JP"], ["+86", "CN"]];

/** Lead form in a dialog over the page, laid out after the 1laser.com Black Friday "Talk to a laser expert" pop-up.
    Design draft: nothing is stored or sent. */
export function LeadDialog({ mode = "quote", product, lines = [], onClose }) {
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState({});
  const first = useRef(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    first.current?.focus();
    const key = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", key); };
  }, [onClose]);
  const submit = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const bad = {};
    if (!String(f.get("name") || "").trim()) bad.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(f.get("email") || ""))) bad.email = true;
    if (!f.get("budget")) bad.budget = true;
    if (mode === "call" && String(f.get("phone") || "").replace(/\D/g, "").length < 6) bad.phone = true;
    setErr(bad);
    if (!Object.keys(bad).length) setSent(true);
  };
  const call = mode === "call";
  return createPortal(
    <div className="lead" role="dialog" aria-modal="true" aria-labelledby="lead-title" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lead-box">
        <button type="button" className="lead-x" aria-label={t("Close")} onClick={onClose}>×</button>
        <div className="lead-art">
          <img src={asset("home-bf-lineup.jpg")} alt="" />
          {product && <p className="lead-pick"><span>{t("Your pick")}</span><b>{product.name}</b><em>{money(product.price)}{product.compareAt > product.price && <s>{money(product.compareAt)}</s>}</em></p>}
          <p className="lead-tag">{t("Up to")} <b>$3,000</b> {t("off")}</p>
        </div>
        {sent ? (
          <div className="lead-body lead-done" role="status">
            <span className="lead-ok"><Icon name="check" size={30} /></span>
            <h2 id="lead-title">{t("Thanks — this is a design draft")}</h2>
            <p>{t("This form is not connected yet, so nothing was sent. On the live site a OneLaser laser expert would follow up by email or phone.")}</p>
            <p>{t("Prefer to talk now? Call")} <a href={`tel:${contact.tel}`}>{contact.phone}</a></p>
            <button type="button" className="lead-submit" onClick={onClose}>{t("Back to my result")}</button>
          </div>
        ) : (
          <form className="lead-body" onSubmit={submit} noValidate>
            <h2 id="lead-title">{t(call ? "Talk to a laser expert" : "Get a written quote")}</h2>
            <p className="lead-lede">
              {t(call ? "Leave your details and a OneLaser laser expert will call you about this machine." : "A OneLaser laser expert reviews your answers and sends a written quote with pricing, accessories and delivery.")}{" "}
              {t("Or call")} <a href={`tel:${contact.tel}`}>{contact.phone}</a>.
            </p>
            <label className={`lead-field${err.name ? " bad" : ""}`}><span>{t("Name")} *</span><input ref={first} name="name" autoComplete="name" /></label>
            <label className={`lead-field${err.email ? " bad" : ""}`}><span>{t("Email")} *</span><input name="email" type="email" autoComplete="email" inputMode="email" /></label>
            <div className={`lead-field${err.phone ? " bad" : ""}`}>
              <span>{t(call ? "Phone" : "Phone (optional)")}{call && " *"}</span>
              <div className="lead-phone">
                <select name="code" aria-label={t("Country code")} defaultValue="+1">{CODES.map(([c, r]) => <option key={c} value={c}>{c} {r}</option>)}</select>
                <input name="phone" type="tel" autoComplete="tel-national" inputMode="tel" aria-label={t("Phone number")} required={call} />
              </div>
            </div>
            <fieldset className={`lead-budget${err.budget ? " bad" : ""}`}>
              <legend>{t("What is your budget for the machine?")} *</legend>
              <div>{BUDGETS.map((b) => <label key={b}><input type="radio" name="budget" value={b} /><span>{t(b)}</span></label>)}</div>
            </fieldset>
            <label className="lead-field"><span>{t("Anything else? (optional)")}</span><textarea name="note" rows={2} placeholder={t("Quantities, materials, deadlines…")} /></label>
            {lines.length > 0 && (
              <details className="lead-sum">
                <summary>{t("Sent with your request")} · {lines.length + (product ? 1 : 0)}</summary>
                <ul>
                  {lines.map((l) => <li key={l.q}><span>{t(l.q)}</span><b>{l.a.map((x) => t(x)).join(", ")}</b></li>)}
                  {product && <li><span>{t("Finder pick")}</span><b>{product.name} ({money(product.price)})</b></li>}
                </ul>
              </details>
            )}
            {Object.keys(err).length > 0 && <p className="lead-err" role="alert">{t("Please fill in the fields marked *.")}</p>}
            <button type="submit" className="lead-submit">{t(call ? "Request a call" : "Email me a written quote")}</button>
            <p className="lead-fine">{t("By submitting, you agree to receive follow-ups from the OneLaser team (human or AI) by email, phone, or text regarding your inquiry.")} {t("Never share sensitive information (credit card numbers, social security numbers, passwords) through this form.")}</p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Full-width result under the product grid, after the result panel of the thunderlaserusa.com finder:
    our pick with why it fits, key specs, good-to-know notes, warranty, then buy and lead buttons. */
function FinderResult({ answers, ranked, onEdit, onReset }) {
  const [lead, setLead] = useState(null);
  const key = ranked[0].key;
  const top = byHandle[M[key].handle];
  const alt = ranked[1] && byHandle[M[ranked[1].key].handle];
  const lines = summary(answers);
  const notes = notesFor(answers, key, top);
  const reasons = lines.length ? ranked[0].reasons : [];
  const specs = ["Laser source", "Work area", "Max engraving speed", "Acceleration"].filter((k) => top.specs?.[k]);
  return (
    <section className="fr" aria-labelledby="fr-title">
      <ol className="fr-steps">
        {STEPS.map((s, n) => {
          const l = lines.find((x) => x.n === n);
          return (
            <li key={s.id} className={l ? "done" : ""}>
              <button type="button" onClick={() => onEdit(n)} title={t("Change answer")}>
                <i>{l ? <Icon name="check" size={14} /> : n + 1}</i>
                <span><b>{t(s.label)}</b><em>{l ? l.a.map((x) => t(x)).join(", ") : t("Skipped")}</em></span>
              </button>
            </li>
          );
        })}
        <li className="pick"><span><i>★</i><span><b>{t("Your machine")}</b><em>{top.name}</em></span></span></li>
      </ol>
      <div className="fr-card">
        <div className="fr-stage">
          <Link to={`/products/${top.handle}`} tabIndex={-1} aria-hidden="true"><img src={img(top.images[0], 1000)} alt="" /></Link>
          <p className="fr-price">
            <b>{money(top.price)}</b>
            {top.compareAt > top.price && <s>{money(top.compareAt)}</s>}
            {top.compareAt > top.price && <em>{t("Save")} {money(top.compareAt - top.price)}</em>}
          </p>
          <p className="fr-monthly">{t("or")} <b>${monthly(top)}</b>{t("/mo for 24 months")}</p>
          <div className="fr-buy">
            <AddButton product={top} className="ih-btn line" />
            <Link to={`/products/${top.handle}`} className="ih-btn dark">{t("Buy now")}</Link>
          </div>
        </div>
        <div className="fr-copy">
          <p className="fr-kicker">{t("Our pick for you")}</p>
          <h2 id="fr-title"><Link to={`/products/${top.handle}`}>{top.name}</Link></h2>
          <p className="fr-lede">{top.tagline}{top.bestFor && <> {t("Best for")}: {top.bestFor}.</>}</p>
          {reasons.length > 0 && (
            <>
              <h3>{t("Why it fits your answers")}</h3>
              <ul className="fr-why">{reasons.map((r) => <li key={r}><Icon name="check" size={16} />{t(r)}</li>)}</ul>
            </>
          )}
          <dl className="fr-specs">{specs.map((k) => <div key={k}><dt>{t(k)}</dt><dd>{top.specs[k]}</dd></div>)}</dl>
          {notes.length > 0 && (
            <div className="fr-notes">
              <h3>{t("Good to know")}</h3>
              <ul>{notes.map((n) => <li key={n}>{n}</li>)}</ul>
            </div>
          )}
          <p className="fr-warranty">
            <Icon name="shield" size={16} />
            {RF_WARRANTY.includes(key) ? t("3-2-1 warranty: 3-year mechanical, 2-year electrical and 1-year optics.") : t("Covered by the official OneLaser warranty policy.")} {t("U.S.-based support from laser engineers.")}
          </p>
          <div className="fr-lead">
            <button type="button" className="fr-btn red" onClick={() => setLead("quote")}><Icon name="mail" size={18} />{t("Email me a written quote")}</button>
            <a href={`tel:${contact.tel}`} className="fr-btn ghost"><Icon name="phone" size={18} />{t("Talk to a laser expert")} · {contact.phone}</a>
          </div>
          <p className="fr-foot">
            <button type="button" onClick={() => onEdit(STEPS.length - 1)}>← {t("Change answers")}</button>
            <button type="button" onClick={onReset}>↺ {t("Start over")}</button>
            {alt && <Link to={`/products/${alt.handle}`}>{t("Also worth a look")}: {alt.name} · {money(alt.price)} ›</Link>}
          </p>
        </div>
      </div>
      {lead && <LeadDialog mode={lead} product={top} lines={lines} onClose={() => setLead(null)} />}
    </section>
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
        <span className="fd-faces" aria-hidden="true">{[1, 2, 3].map((n) => <img key={n} src={asset(`team-${n}.jpg`)} alt="" loading="lazy" />)}</span>
        <div>
          <h3>{t("Not sure which one fits?")}</h3>
          <p>{t("Talk it through with a OneLaser laser engineer. Tell us what you make and we'll point you to the right machine.")}</p>
        </div>
        <Link href="https://www.1laser.com/pages/sales-consultation" className="ih-btn dark">{t("Schedule a call")}</Link>
      </div>
    </>
  );
}
