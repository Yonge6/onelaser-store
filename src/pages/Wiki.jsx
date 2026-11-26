import { useEffect, useMemo, useState } from "react";
import wiki from "../data/wiki.json";
import { t, tf, getLang, localeTag } from "../i18n.js";
import { asset, byHandle, frontImg, go, img } from "../lib.js";
import { Icon, Link } from "../components/ui.jsx";
import Assistant from "../components/Assistant.jsx";
import "../wiki.css";

/* Product Knowledge Base: #/wiki, guide pages at #/wiki/<slug> (ready for 1laser.com/wiki/<slug>).
   Content: the 236 public guides of wiki.1laser.com, built into src/data/wiki.json + public/wiki-data by scripts/build-wiki.mjs.
   Guide text is English; the interface around it follows the store language. */

const FAMILY_ORDER = ["x-series", "hydra-series", "cobra", "vertigo", "software", "accessories", "materials", "basics", "general"];
const MACHINES = ["x-series", "hydra-series", "cobra", "vertigo"];
const TOPIC_ORDER = ["getting-started", "troubleshooting", "guides", "downloads"];
// Product photo per machine family: the same front views the store's menus and cards use.
const FAMILY_MODEL = { "x-series": "onelaser-xrf-desktop-laser-machine", "hydra-series": "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", cobra: "cobra-10-100w-co2-laser-engraver-cutter", vertigo: "vertigo-vertical-laser-engraver" };
const familyImage = (f) => { const src = byHandle[FAMILY_MODEL[f]] && frontImg(byHandle[FAMILY_MODEL[f]]); return src && /^https:/.test(src) ? img(src, 600) : src; };
const POPULAR_SEARCHES = ["Firmware", "Air assist", "Autofocus", "LightBurn", "Camera"];
const POPULAR_GUIDES = ["x-series/firmware-upgrade", "onelaser-cobra/air-assist-fails-to-turn-off", "x-series/incorrect-autofocus-focal-distance", "vertigo/first-time-setup-guide", "x-series/unboxing", "software-app/lightburn-2-1-device-camera-errors"];
// Each family's old landing page on wiki.1laser.com, shown first as "Start here".
const START = { "x-series": "x-series/overview", "hydra-series": "hydra-series/overview", cobra: "onelaser-cobra", vertigo: "vertigo/vertigo-series-wiki", software: "software-app", accessories: "accessories/overview", materials: "material-library", general: "faq" };
const SUPPORT_TICKET = "https://zohodesk.1laser.com/portal/en/newticket";

const familyName = (f) => ({ "x-series": t("X Series"), "hydra-series": t("Hydra Series"), cobra: t("Cobra Series"), vertigo: t("VertiGo"), software: t("Software & firmware"), accessories: t("Accessories"), materials: t("Materials"), basics: t("Laser basics & care"), general: t("General help") })[f] || f;
const familyText = (f) => ({
  "x-series": t("Desktop lasers: setup, care and fixes."),
  "hydra-series": t("Hydra and Hydra Gen2: setup, manuals and fixes."),
  cobra: t("CO₂ laser cutters: manual and daily use."),
  vertigo: t("The vertical drinkware laser: setup, focus and care."),
  software: t("LightBurn, MakerBoost, cameras and firmware updates."),
  accessories: t("Air assist, rotary, auto feeder and riser base."),
  materials: t("Settings and tips for wood, acrylic, leather and more."),
  basics: t("How lasers work, cleaning and safety."),
  general: t("Common questions, terms and new guides."),
})[f] || "";

/* "Fix by symptom": what owners see, matched on guide titles (titles are written as problems, summaries mention too much).
   Manuals, material settings and general pages are left out; "Manuals & firmware" is its own tile (the downloads topic). */
const SYMPTOMS = [
  ["firing", "bolt", /\b(fir(e|es|ing)|no laser output|laser output|low power|rf tube|laser tube|tube led|power supply|power on|no power|laser stops|abnormal laser light)\b/i],
  ["focus", "target", /\b(auto-?focus|focus(ing)?|focal|defocus|z-axis|cylinder)\b/i],
  ["alignment", "beam", /\b(optical path|light path|beam path|red (dot|light)|mirror mount|double beam|misalign\w*|offset|start point|backlash)\b/i],
  ["quality", "image", /\b(quality|blurr?y|charring|jitter|stray|lines|kerf|flam\w*|sparks?|poor processing|cut through|missing areas|hollow|size compression|squares|dimensions?)\b/i],
  ["connection", "tv", /\b(lightburn|usb|wi-?fi|ethernet|connect\w*|driver|camera|makerboost|rdworks|export files|saved (design )?files)\b/i],
  ["air", "drop", /\b(air assist|air pump|air (pipe|tube|hose)|airflow|fan|chiller|water|cooling|exhaust|smoke|antifreeze)\b/i],
  ["motion", "gauge", /\b(x-?axis|y-?axis|axis|origin|homing|belt|motor|rotary|slider|wheels?|drifts?|wobbles?|shakes?|movement|step distance|hits material|conveyor|feeder)\b/i],
  ["errors", "help", /\b(alarm|error|er\d+|not buffer|no response|touchscreen|reset failed)\b/i],
];
const SYMPTOM_IDS = SYMPTOMS.map(([id]) => id);
const symptomName = (k) => ({ firing: t("Laser won't fire"), focus: t("Focus & autofocus"), alignment: t("Beam alignment & red dot"), quality: t("Engraving & cutting quality"), connection: t("Connection & software"), air: t("Air assist & cooling"), motion: t("Movement, origin & rotary"), errors: t("Alarms & error codes") })[k] || k;
const symptomText = (k) => ({ firing: t("No output, stops mid-job, weak power"), focus: t("Bad focus distance, autofocus stops early"), alignment: t("Misaligned beam, offset, double beam"), quality: t("Blurry, charring, jitter, not cutting through"), connection: t("LightBurn, USB, Wi-Fi, camera"), air: t("Air pump, fan, chiller, smoke"), motion: t("Origin, axes, belts, rotary"), errors: t("Touchscreen alarms, driver errors") })[k] || "";
const symptomOf = (a) => (a.topic === "downloads" || a.safety?.includes("bypass") || ["materials", "general", "basics"].includes(a.family) ? null : SYMPTOMS.find(([, , re]) => re.test(a.title))?.[0] || null);
const BY_SYMPTOM = Object.fromEntries(SYMPTOM_IDS.map((k) => [k, wiki.articles.filter((a) => symptomOf(a) === k)]));
// "Learn your laser": background reading, each with a photo from the store. Missing guides are skipped.
const LEARN = [
  ["knowledge-base/popularization/laser-focus", "home-product-hydra-gen2-scene.webp"],
  ["knowledge-base/popularization/laser-processing-acrylic", "material-acrylic.webp"],
  ["knowledge-base/maintenance/laser-lens-cleaning-guide", "home-product-xrf-scene.webp"],
  ["knowledge-base/popularization/laser-processing-leather", "material-leather.webp"],
  ["knowledge-base/maintenance/clean-the-optical-parts", "home-product-cobra-scene.webp"],
];
const topicName = (k) => ({ "getting-started": t("Getting started"), troubleshooting: t("Troubleshooting"), guides: t("How-to guides"), downloads: t("Manuals & downloads") })[k] || k;
const guidesCount = (n) => (n === 1 ? t("1 guide") : tf("{n} guides", { n }));

const bySlug = new Map(wiki.articles.map((a) => [a.slug, a]));
const inFamily = (f) => wiki.articles.filter((a) => a.family === f);
const date = (d) => { try { return new Date(`${d}T12:00:00Z`).toLocaleDateString(localeTag(), { year: "numeric", month: "short", day: "numeric" }); } catch { return d; } };
const dataUrl = (file) => `${import.meta.env.BASE_URL}wiki-data/${file}`;
const qs = (o) => { const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v)); const s = p.toString(); return s ? `?${s}` : ""; };

// Guide text for search, fetched once on the first search (about 190 KB compressed).
let bodies = null;
let bodiesLoad = null;
// A failed fetch is not remembered, so the next search tries again (titles and summaries are still searched meanwhile).
const loadBodies = () => (bodiesLoad ??= fetch(dataUrl("search.json")).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then((j) => (bodies = j)).catch(() => { bodiesLoad = null; return null; }));
const pages = new Map();
const loadPage = (id) => (pages.has(id) ? Promise.resolve(pages.get(id)) : fetch(dataUrl(`${id}.json`)).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then((j) => (pages.set(id, j), j)));

/** Every word must appear in the title, summary, family/topic or guide text; title hits rank first. */
function find(q, body, family, topic, fix) {
  const phrase = q.toLowerCase().trim();
  const words = phrase.split(/[^\p{L}\p{N}.₂-]+/u).filter((w) => w.length > 1 || /\d/.test(w));
  const pool = (fix ? BY_SYMPTOM[fix] : wiki.articles).filter((a) => (!family || a.family === family) && (!topic || a.topic === topic));
  if (!words.length) return pool;
  // Every word must appear (title hits rank first). A described problem ("autofocus stops early") rarely matches every
  // word, so when nothing does, guides matching most of the words are shown instead.
  const rank = (need, ws = words) => pool
    .map((a) => {
      const title = a.title.toLowerCase();
      const about = `${a.excerpt} ${a.family} ${a.topic} ${familyName(a.family)} ${topicName(a.topic)}`.toLowerCase();
      const text = body?.[a.id] || "";
      let score = title.includes(phrase) ? 30 : 0, hits = 0;
      for (const w of ws) {
        if (title.includes(w)) { score += 10; hits++; } else if (about.includes(w)) { score += 4; hits++; } else if (text.includes(w)) { score += 1; hits++; }
      }
      return hits >= need ? { a, score } : null;
    })
    .filter(Boolean);
  const order = (list) => list.sort((x, y) => y.score - x.score || x.a.title.localeCompare(y.a.title)).map((x) => x.a);
  const strict = rank(words.length);
  if (strict.length >= 3 || words.length < 2) return order(strict);
  // word stems ("stops" also finds "stopping"), filler words dropped
  const stems = words.filter((w) => !ASK_STOP.has(w)).map((w) => w.slice(0, Math.max(4, w.length - 2)));
  if (!stems.length) return order(strict);
  const best = new Map();
  for (const x of [...strict, ...rank(Math.ceil(stems.length * 0.6), stems)]) if (!best.has(x.a) || best.get(x.a).score < x.score) best.set(x.a, x);
  return order([...best.values()]).slice(0, 40);
}

/* Guides for the assistant: a question in everyday words ("how do I update the firmware?") rather than search keywords.
   Filler words are dropped, words match by their first letters ("calibrate" finds "calibration"), and most of the
   remaining words must appear; title hits count most. Up to 3 guides. */
// Filler words, one per entry (apostrophes split words: "doesn't" -> "doesn" + "t").
const ASK_STOP = new Set(["an", "the", "to", "of", "for", "and", "or", "in", "on", "at", "with", "how", "do", "does", "did", "my", "me", "is", "it", "its", "are", "was", "can", "could", "should", "what", "why", "when", "where", "which", "this", "that", "there", "not", "doesn", "isn", "won", "don", "doesnt", "isnt", "wont", "dont", "cant", "through", "anymore", "still", "cannot", "help", "please", "laser", "machine", "onelaser", "get", "keep", "keeps", "after", "before", "during", "working", "work", "series"]);
const ASK_SAME = { updat: "upgrad" }; // "update the firmware" finds the "Firmware Upgrade" guides
const stemOf = (w) => { const s = w.slice(0, 5); return ASK_SAME[s] || s; };
const FAMILY_WORDS = { "x-series": /\b(xrf|xt|x[\s-]?series)\b/, "hydra-series": /\bhydra\b/, cobra: /\bcobra\b/, vertigo: /\bvertigo\b/ };
// Guides whose fix switches off a safety protection (shorting the Z-axis anti-collision lock, bypassing the water-flow
// sensor). They stay in the Knowledge Base, but the assistant never suggests them on its own: it points to support instead.
// (marked "bypass" by scripts/build-wiki.mjs, which keeps the list)
const ASSIST_NEVER = new Set(wiki.articles.filter((a) => a.safety?.includes("bypass")).map((a) => a.slug));
const MACHINE_FAMILIES = new Set(["x-series", "hydra-series", "cobra", "vertigo"]);
const FAMILY_NAMES = new Set(["xrf", "xt", "hydra", "cobra", "vertigo"]);
export function assistGuides(q) {
  loadBodies(); // full text for the next question; titles and summaries meanwhile
  const low = q.toLowerCase();
  const fam = Object.keys(FAMILY_WORDS).find((f) => FAMILY_WORDS[f].test(low));
  const ws = [...new Set(low.split(/[^\p{L}\p{N}₂]+/u).filter((w) => w.length > 1 && !ASK_STOP.has(w) && !FAMILY_NAMES.has(w)).map(stemOf))];
  if (!ws.length) return [];
  const need = Math.max(1, Math.ceil(ws.length * 0.6));
  const ranked = wiki.articles
    .map((a) => {
      const title = a.title.toLowerCase(), about = a.excerpt.toLowerCase(), text = bodies?.[a.id] || "";
      let score = 0, hits = 0;
      for (const w of ws) {
        if (title.includes(w)) { score += 6; hits++; } else if (about.includes(w)) { score += 3; hits++; } else if (text.includes(w)) { score += 1; hits++; }
      }
      if (fam && a.family === fam) score += 4;
      if (fam && a.family !== fam && MACHINE_FAMILIES.has(a.family)) return null; // "Cobra firmware" never offers X Series or Hydra guides
      if (a.topic === "troubleshooting") score += 1;
      return hits >= need && score >= 6 ? { a, score } : null;
    })
    .filter(Boolean)
    .sort((x, y) => y.score - x.score)
    .slice(0, 4);
  const picks = ranked.filter((x) => !ASSIST_NEVER.has(x.a.slug)).slice(0, 3).map((x) => x.a);
  picks.checkFirst = ranked.some((x) => ASSIST_NEVER.has(x.a.slug)); // a protection-bypass fix matched: ask support first
  return picks;
}

assistGuides.prepare = loadBodies; // the assistant waits for the full text (or its failure) before answering

function useTitle(title) {
  useEffect(() => { document.title = `${title} | OneLaser`; return () => { document.title = "OneLaser Store — Redesign Draft"; }; }, [title]);
}

function SearchBox({ q = "", family = "", topic = "", big = false, ask = false }) {
  const [v, setV] = useState(q);
  useEffect(() => setV(q), [q]);
  return (
    <form className={`wk-search${big ? " big" : ""}`} role="search" onSubmit={(e) => { e.preventDefault(); go(`/wiki${qs({ q: v.trim(), family, topic })}`); }}>
      <Icon name="search" size={20} />
      <input type="search" value={v} onChange={(e) => setV(e.target.value)} placeholder={ask ? t("Describe the issue, like “autofocus stops early”") : family ? tf("Search {name} guides", { name: familyName(family) }) : t("Search by model, issue or keyword")} aria-label={t("Search the knowledge base")} enterKeyHint="search" />
      <button type="submit" className="btn-primary">{ask ? t("Find a fix") : t("Search")}</button>
    </form>
  );
}

function Crumbs({ items }) {
  return (
    <nav className="breadcrumbs wk-crumbs" aria-label={t("Breadcrumb")}>
      <Link to="/">{t("Home")}</Link>
      {items.map(([label, to]) => (
        <span key={label} className="wk-crumb"><span aria-hidden="true">/</span>{to ? <Link to={to}>{label}</Link> : <b>{label}</b>}</span>
      ))}
    </nav>
  );
}

function GuideCard({ a, showFamily = true }) {
  return (
    <Link to={`/wiki/${a.slug}`} className="wk-card">
      <small>{showFamily ? `${familyName(a.family)} · ${topicName(a.topic)}` : topicName(a.topic)}</small>
      <b>{a.title}</b>
      {a.excerpt && <span>{a.excerpt}</span>}
      <em>{tf("{n} min read", { n: a.min })}<Icon name="arrow" size={16} /></em>
    </Link>
  );
}

function GuideRow({ a }) {
  return (
    <li>
      <Link to={`/wiki/${a.slug}`} className="wk-row">
        <span><small>{familyName(a.family)} · {topicName(a.topic)}</small><b>{a.title}</b>{a.excerpt && <em>{a.excerpt}</em>}</span>
        <Icon name="chevron" size={18} />
      </Link>
    </li>
  );
}

function Help() {
  return (
    <section className="wk-help">
      <div className="container">
        <span className="wk-help-icon"><Icon name="headset" size={28} tone /></span>
        <div><h2>{t("Still need help?")}</h2><p>{t("Our U.S. support team can help with your machine.")}</p></div>
        <div className="wk-help-actions">
          <Link href={SUPPORT_TICKET} className="btn-primary">{t("Open a support ticket")}</Link>
          <Link to="/pages/sales-consultation" className="btn-soft">{t("Book a free call")}</Link>
        </div>
      </div>
    </section>
  );
}

function EnglishNote() {
  return getLang() === "en" ? null : <p className="wk-lang-note"><Icon name="globe" size={16} />{t("Guides are written in English.")}</p>;
}

function Overview() {
  useTitle(t("Product Knowledge Base"));
  const popular = POPULAR_GUIDES.map((sl) => bySlug.get(sl)).filter(Boolean);
  const learn = LEARN.map(([sl, pic]) => [bySlug.get(sl), pic]).filter(([a]) => a);
  const manuals = wiki.articles.filter((a) => a.topic === "downloads").length;
  return (
    <>
      <section className="wk-hero dark">
        <img className="wk-hero-art" src={familyImage("hydra-series")} alt="" />
        <div className="container">
          <p className="wk-kicker">{t("OneLaser Support")}</p>
          <h1>{t("What's going on with your laser?")}</h1>
          <SearchBox big ask />
          <div className="wk-popular">
            {POPULAR_SEARCHES.map((x) => <Link key={x} to={`/wiki${qs({ q: x })}`}>{t(x)}</Link>)}
          </div>
          <EnglishNote />
        </div>
      </section>
      <section className="container wk-section">
        <h2 className="wk-h2">{t("Fix by symptom")}</h2>
        <div className="wk-symptoms">
          {SYMPTOMS.map(([k, icon]) => (
            <Link key={k} to={`/wiki${qs({ fix: k })}`} className="wk-symptom">
              <span className="wk-symptom-icon"><Icon name={icon} size={22} /></span>
              <b>{symptomName(k)}</b>
              <span>{symptomText(k)}</span>
              <small>{guidesCount(BY_SYMPTOM[k].length)}</small>
            </Link>
          ))}
          <Link to={`/wiki${qs({ topic: "downloads" })}`} className="wk-symptom alt">
            <span className="wk-symptom-icon"><Icon name="download" size={22} /></span>
            <b>{t("Manuals & firmware")}</b>
            <span>{t("User manuals, firmware and software.")}</span>
            <small>{guidesCount(manuals)}</small>
          </Link>
          <Link to={`/wiki${qs({ topic: "getting-started" })}`} className="wk-symptom alt">
            <span className="wk-symptom-icon"><Icon name="school" size={22} /></span>
            <b>{t("Getting started")}</b>
            <span>{t("Unbox, install and run your first job.")}</span>
            <small>{guidesCount(wiki.articles.filter((a) => a.topic === "getting-started").length)}</small>
          </Link>
        </div>
      </section>
      <section className="container wk-section">
        <div className="wk-h2-row">
          <h2 className="wk-h2">{t("Or start from your machine")}</h2>
          <Link to={`/wiki${qs({ all: "1" })}`} className="wk-link">{tf("Browse all {n} guides", { n: wiki.articles.length })}<Icon name="chevron" size={16} /></Link>
        </div>
        <div className="wk-machines">
          {MACHINES.map((f) => (
            <Link key={f} to={`/wiki/${f}`} className="wk-machine">
              <img src={familyImage(f)} alt="" loading="lazy" />
              <span><b>{familyName(f)}</b><small>{guidesCount(inFamily(f).length)}</small></span>
              <Icon name="chevron" size={18} />
            </Link>
          ))}
        </div>
        <div className="wk-chips wk-others">
          {FAMILY_ORDER.filter((f) => !MACHINES.includes(f) && inFamily(f).length).map((f) => <Link key={f} to={`/wiki/${f}`}>{familyName(f)} <small>{inFamily(f).length}</small></Link>)}
        </div>
      </section>
      <section className="container wk-section">
        <h2 className="wk-h2">{t("Recommended fixes")}</h2>
        <ol className="wk-top">
          {popular.map((a, i) => (
            <li key={a.id}>
              <Link to={`/wiki/${a.slug}`}>
                <em>{i + 1}</em>
                <span><b>{a.title}</b><small>{familyName(a.family)} · {topicName(a.topic)}</small></span>
                <i>{tf("{n} min read", { n: a.min })}</i>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      {learn.length > 0 && (
        <section className="container wk-section">
          <div className="wk-h2-row">
            <h2 className="wk-h2">{t("Learn your laser")}</h2>
            {inFamily("basics").length > 0 && <Link to="/wiki/basics" className="wk-link">{tf("All {name} guides", { name: familyName("basics") })}<Icon name="chevron" size={16} /></Link>}
          </div>
          <div className="wk-learn">
            {learn.map(([a, pic]) => (
              <Link key={a.id} to={`/wiki/${a.slug}`} className="wk-learn-card">
                <span className="wk-learn-pic"><img src={asset(pic)} alt="" loading="lazy" /></span>
                <span className="wk-learn-text"><small>{familyName(a.family)}</small><b>{a.title}</b></span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function Chips({ label, value, options, make }) {
  return (
    <div className="wk-chips" role="group" aria-label={label}>
      {options.map(([v, name]) => <Link key={v || "all"} to={make(v)} className={value === v ? "on" : ""} aria-current={value === v ? "true" : undefined}>{name}</Link>)}
    </div>
  );
}

function Results({ q, family, topic, fix }) {
  const [body, setBody] = useState(bodies);
  useEffect(() => { if (q && !bodies) loadBodies().then((b) => setBody(b || {})); }, [q]);
  const list = useMemo(() => find(q, body, family, topic, fix), [q, body, family, topic, fix]);
  useTitle(q ? tf("Search results for “{q}”", { q }) : fix ? symptomName(fix) : t("All guides"));
  const heading = q ? tf("Results for “{q}”", { q }) : fix ? symptomName(fix) : topic ? topicName(topic) : family ? familyName(family) : t("All guides");
  return (
    <>
      <section className="wk-hero small">
        <div className="container">
          <Crumbs items={[[t("Product Knowledge Base"), "/wiki"], [q ? t("Search") : fix ? t("Fix by symptom") : t("All guides")]]} />
          <SearchBox q={q} family={family} topic={topic} />
        </div>
      </section>
      <section className="container wk-section wk-results">
        <h1 className="wk-h1">{heading}</h1>
        <p className="wk-count" aria-live="polite">{fix && `${symptomText(fix)} · `}{q && !body ? t("Searching…") : guidesCount(list.length)}</p>
        {fix ? (
          <Chips label={t("Fix by symptom")} value={fix} options={SYMPTOM_IDS.map((k) => [k, symptomName(k)])} make={(v) => `/wiki${qs({ fix: v, family })}`} />
        ) : (
          <Chips label={t("Topic")} value={topic} options={[["", t("All topics")], ...TOPIC_ORDER.map((k) => [k, topicName(k)])]} make={(v) => `/wiki${qs({ q, family, topic: v, all: !q && !family && !v ? "1" : "" })}`} />
        )}
        <Chips label={t("Product")} value={family} options={[["", t("All products")], ...FAMILY_ORDER.filter((f) => !fix || BY_SYMPTOM[fix].some((a) => a.family === f)).map((f) => [f, familyName(f)])]} make={(v) => `/wiki${qs({ q, fix, family: v, topic, all: !q && !fix && !topic && !v ? "1" : "" })}`} />
        {list.length ? (
          <ul className="wk-list">{list.map((a) => <GuideRow key={a.id} a={a} />)}</ul>
        ) : (
          (!q || body) && (
            <div className="wk-empty">
              <b>{q ? tf("No guides match “{q}”.", { q }) : t("No guides here yet.")}</b>
              <p>{t("Try a model name or fewer words, or get help below.")}</p>
              <Link to="/wiki" className="btn-soft">{t("Back to the Knowledge Base")}</Link>
            </div>
          )
        )}
      </section>
    </>
  );
}

function Family({ f, topic }) {
  useTitle(`${familyName(f)} · ${t("Product Knowledge Base")}`);
  const all = inFamily(f);
  const start = bySlug.get(START[f]);
  const shown = TOPIC_ORDER.filter((k) => (!topic || topic === k) && all.some((a) => a.topic === k));
  return (
    <>
      <section className="wk-hero small">
        <div className="container wk-fam-head">
          <div>
            <Crumbs items={[[t("Product Knowledge Base"), "/wiki"], [familyName(f)]]} />
            <h1 className="wk-h1">{familyName(f)}</h1>
            <p className="wk-sub">{familyText(f)} {guidesCount(all.length)}</p>
            <SearchBox family={f} />
          </div>
          {familyImage(f) && <img src={familyImage(f)} alt="" />}
        </div>
      </section>
      <section className="container wk-section">
        <Chips label={t("Topic")} value={topic} options={[["", t("All topics")], ...TOPIC_ORDER.filter((k) => all.some((a) => a.topic === k)).map((k) => [k, `${topicName(k)} (${all.filter((a) => a.topic === k).length})`])]} make={(v) => `/wiki/${f}${qs({ topic: v })}`} />
        {start && !topic && (
          <Link to={`/wiki/${start.slug}`} className="wk-start">
            <small>{t("Start here")}</small><b>{start.title}</b>{start.excerpt && <span>{start.excerpt}</span>}<Icon name="arrow" size={18} />
          </Link>
        )}
        {shown.map((k) => (
          <div key={k} className="wk-group">
            <h2 className="wk-h2">{topicName(k)}</h2>
            <div className="wk-cards">{all.filter((a) => a.topic === k && (topic || a !== start)).sort((x, y) => x.title.localeCompare(y.title)).map((a) => <GuideCard key={a.id} a={a} showFamily={false} />)}</div>
          </div>
        ))}
      </section>
    </>
  );
}

const scrollToId = (id) => { const el = id && document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); return !!el; };

function Toc({ slug, toc, open, onToggle }) {
  if (toc.length < 2) return null;
  return (
    <nav className={`wk-toc${open ? " open" : ""}`} aria-label={t("On this page")}>
      <button type="button" className="wk-toc-head" aria-expanded={open} onClick={onToggle}>{t("On this page")}<Icon name="chevron" size={16} /></button>
      <ol>
        {toc.map((h) => (
          <li key={h.id} className={h.level === 3 ? "sub" : ""}>
            <a href={`#/wiki/${slug}?h=${encodeURIComponent(h.id)}`} data-anchor={h.id} onClick={(e) => { e.preventDefault(); scrollToId(h.id); }}>{h.text}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The store's own safety notice above a guide (the guide text itself stays as published). */
function SafetyNote({ safety = [] }) {
  if (!safety.length) return null;
  const strong = safety.includes("bypass");
  return (
    <div className={`wk-safety${strong ? " strong" : ""}`} role="note">
      <Icon name="shield" size={20} />
      <div>
        {strong && <p><b>{t("This fix switches off a safety protection.")}</b> {t("Please contact our support team before trying it, so a technician can confirm it's the right fix for your machine.")}</p>}
        {safety.includes("fire") && <p><b>{t("If a fire grows or spreads, get everyone out and call the fire department (911 in the U.S.).")}</b> {t("Only fight a small fire you can put out safely.")}</p>}
        {safety.includes("electrical") && !strong && <p>{t("Before opening any panel, turn the machine off and unplug it. If you're not comfortable working inside the machine, our support team can help.")}</p>}
        {(strong || safety.includes("electrical")) && <Link href={SUPPORT_TICKET}>{t("Open a support ticket")} →</Link>}
      </div>
    </div>
  );
}

function Guide({ a, anchor }) {
  useTitle(a.title);
  const [page, setPage] = useState(() => pages.get(a.id) || null);
  const [failed, setFailed] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  useEffect(() => { let live = true; loadPage(a.id).then((p) => live && setPage(p)).catch(() => live && setFailed(true)); return () => { live = false; }; }, [a.id]);
  useEffect(() => { if (page && anchor) requestAnimationFrame(() => scrollToId(anchor)); }, [page, anchor]);
  const onClick = (e) => {
    const link = e.target.closest?.("a[data-anchor]");
    if (link && scrollToId(link.dataset.anchor)) e.preventDefault();
  };
  const related = useMemo(() => {
    const same = wiki.articles.filter((x) => x.family === a.family && x.id !== a.id);
    return [...same.filter((x) => x.topic === a.topic), ...same.filter((x) => x.topic !== a.topic)].slice(0, 4);
  }, [a]);
  return (
    <>
      <div className="container wk-guide-top">
        <Crumbs items={[[t("Product Knowledge Base"), "/wiki"], [familyName(a.family), `/wiki/${a.family}`], [a.title]]} />
      </div>
      <div className="container wk-guide">
        <aside className="wk-aside">{page && <Toc slug={a.slug} toc={page.toc} open={tocOpen} onToggle={() => setTocOpen(!tocOpen)} />}</aside>
        <article className="wk-article">
          <p className="wk-meta"><Link to={`/wiki${qs({ topic: a.topic, family: a.family })}`}>{topicName(a.topic)}</Link><span>{tf("{n} min read", { n: a.min })}</span>{a.updated && <span>{tf("Updated {date}", { date: date(a.updated) })}</span>}</p>
          <h1 className="wk-title">{a.title}</h1>
          <EnglishNote />
          <SafetyNote safety={a.safety} />
          {failed ? (
            <div className="wk-empty"><b>{t("This guide didn't load.")}</b><p>{t("Check your connection and try again.")}</p><button type="button" className="btn-soft" onClick={() => { setFailed(false); loadPage(a.id).then(setPage).catch(() => setFailed(true)); }}>{t("Try again")}</button></div>
          ) : page ? (
            // Cleaned by scripts/build-wiki.mjs (tag and attribute allowlist, http(s) links only).
            <div className="wk-body" onClick={onClick} lang="en" dangerouslySetInnerHTML={{ __html: page.html }} />
          ) : (
            <div className="wk-loading" aria-busy="true"><span /><span /><span /><span /></div>
          )}
          {related.length > 0 && (
            <section className="wk-related">
              <h2 className="wk-h2">{tf("More {name} guides", { name: familyName(a.family) })}</h2>
              <div className="wk-cards two">{related.map((x) => <GuideCard key={x.id} a={x} showFamily={false} />)}</div>
              <Link to={`/wiki/${a.family}`} className="wk-link">{tf("All {name} guides", { name: familyName(a.family) })}<Icon name="chevron" size={16} /></Link>
            </section>
          )}
        </article>
      </div>
    </>
  );
}

function NotFound() {
  useTitle(t("Product Knowledge Base"));
  return (
    <section className="container wk-section">
      <div className="wk-empty">
        <b>{t("We couldn't find that guide.")}</b>
        <p>{t("This link may be out of date. Search for the guide or go back to the Knowledge Base.")}</p>
        <SearchBox />
        <Link to="/wiki" className="btn-soft">{t("Back to the Knowledge Base")}</Link>
      </div>
    </section>
  );
}

export default function Wiki({ rest, query }) {
  let slug;
  try { slug = decodeURIComponent(rest || ""); } catch { slug = "\u0000"; } // malformed address (e.g. "%E0"): "guide not found", not a blank page
  slug = slug.replace(/^\/+|\/+$/g, "").toLowerCase();
  const q = (query.get("q") || "").trim().slice(0, 100);
  const family = FAMILY_ORDER.includes(query.get("family")) ? query.get("family") : "";
  const topic = TOPIC_ORDER.includes(query.get("topic")) ? query.get("topic") : "";
  const fix = SYMPTOM_IDS.includes(query.get("fix")) ? query.get("fix") : "";
  let body;
  if (!slug) body = q || family || topic || fix || query.has("all") ? <Results q={q} family={family} topic={topic} fix={fix} /> : <Overview />;
  else if (FAMILY_ORDER.includes(slug)) body = <Family f={slug} topic={topic} />;
  else if (bySlug.has(slug)) body = <Guide key={slug} a={bySlug.get(slug)} anchor={query.get("h") || ""} />;
  else body = <NotFound />;
  return (
    <div className="wk">
      {body}
      <Help />
      <Assistant guides={assistGuides} />
    </div>
  );
}
