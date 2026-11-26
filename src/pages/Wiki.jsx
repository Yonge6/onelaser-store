import { useEffect, useMemo, useState } from "react";
import wiki from "../data/wiki.json";
import { t, tf, getLang, localeTag } from "../i18n.js";
import { byHandle, frontImg, go, img } from "../lib.js";
import { Icon, Link } from "../components/ui.jsx";
import "../wiki.css";

/* Product Knowledge Base: #/wiki, guide pages at #/wiki/<slug> (ready for 1laser.com/wiki/<slug>).
   Content: the 236 public guides of wiki.1laser.com, built into src/data/wiki.json + public/wiki-data by scripts/build-wiki.mjs.
   Guide text is English; the interface around it follows the store language. */

const FAMILY_ORDER = ["x-series", "hydra-series", "cobra", "vertigo", "software", "accessories", "materials", "general"];
const MACHINES = ["x-series", "hydra-series", "cobra", "vertigo"];
const TOPIC_ORDER = ["getting-started", "troubleshooting", "guides", "downloads"];
// Product photo per machine family: the same front views the store's menus and cards use.
const FAMILY_MODEL = { "x-series": "onelaser-xrf-desktop-laser-machine", "hydra-series": "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", cobra: "cobra-10-100w-co2-laser-engraver-cutter", vertigo: "vertigo-vertical-laser-engraver" };
const familyImage = (f) => { const src = byHandle[FAMILY_MODEL[f]] && frontImg(byHandle[FAMILY_MODEL[f]]); return src && /^https:/.test(src) ? img(src, 600) : src; };
const TOPIC_ICON = { "getting-started": "school", troubleshooting: "help", guides: "layers", downloads: "download" };
const POPULAR_SEARCHES = ["Firmware", "Air assist", "Autofocus", "LightBurn", "Camera"];
const POPULAR_GUIDES = ["x-series/firmware-upgrade", "onelaser-cobra/air-assist-fails-to-turn-off", "x-series/incorrect-autofocus-focal-distance", "vertigo/first-time-setup-guide", "x-series/unboxing", "software-app/lightburn-2-1-device-camera-errors"];
// Each family's old landing page on wiki.1laser.com, shown first as "Start here".
const START = { "x-series": "x-series/overview", "hydra-series": "hydra-series/overview", cobra: "onelaser-cobra", vertigo: "vertigo/vertigo-series-wiki", software: "software-app", accessories: "accessories/overview", materials: "material-library", general: "faq" };
const SUPPORT_TICKET = "https://zohodesk.1laser.com/portal/en/newticket";

const familyName = (f) => ({ "x-series": t("X Series"), "hydra-series": t("Hydra Series"), cobra: t("Cobra Series"), vertigo: t("VertiGo"), software: t("Software & firmware"), accessories: t("Accessories"), materials: t("Materials"), general: t("General help") })[f] || f;
const familyText = (f) => ({
  "x-series": t("Desktop lasers: setup, care and fixes."),
  "hydra-series": t("Hydra and Hydra Gen2: setup, manuals and fixes."),
  cobra: t("CO₂ laser cutters: manual and daily use."),
  vertigo: t("The vertical drinkware laser: setup, focus and care."),
  software: t("LightBurn, MakerBoost, cameras and firmware updates."),
  accessories: t("Air assist, rotary, auto feeder and riser base."),
  materials: t("Settings and tips for wood, acrylic, leather and more."),
  general: t("Common questions, terms and new guides."),
})[f] || "";
const topicName = (k) => ({ "getting-started": t("Getting started"), troubleshooting: t("Troubleshooting"), guides: t("How-to guides"), downloads: t("Manuals & downloads") })[k] || k;
const topicText = (k) => ({
  "getting-started": t("Unbox, install and run your first job."),
  troubleshooting: t("Fixes for errors and common problems."),
  guides: t("Maintenance, settings and everyday tips."),
  downloads: t("User manuals, firmware and software."),
})[k] || "";
const guidesCount = (n) => (n === 1 ? t("1 guide") : tf("{n} guides", { n }));

const bySlug = new Map(wiki.articles.map((a) => [a.slug, a]));
const inFamily = (f) => wiki.articles.filter((a) => a.family === f);
const date = (d) => { try { return new Date(`${d}T12:00:00Z`).toLocaleDateString(localeTag(), { year: "numeric", month: "short", day: "numeric" }); } catch { return d; } };
const dataUrl = (file) => `${import.meta.env.BASE_URL}wiki-data/${file}`;
const qs = (o) => { const p = new URLSearchParams(Object.entries(o).filter(([, v]) => v)); const s = p.toString(); return s ? `?${s}` : ""; };

// Guide text for search, fetched once on the first search (about 190 KB compressed).
let bodies = null;
let bodiesLoad = null;
const loadBodies = () => (bodiesLoad ??= fetch(dataUrl("search.json")).then((r) => (r.ok ? r.json() : {})).then((j) => (bodies = j)).catch(() => (bodiesLoad = null, {})));
const pages = new Map();
const loadPage = (id) => (pages.has(id) ? Promise.resolve(pages.get(id)) : fetch(dataUrl(`${id}.json`)).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).then((j) => (pages.set(id, j), j)));

/** Every word must appear in the title, summary, family/topic or guide text; title hits rank first. */
function find(q, body, family, topic) {
  const phrase = q.toLowerCase().trim();
  const words = phrase.split(/[^\p{L}\p{N}.₂-]+/u).filter((w) => w.length > 1 || /\d/.test(w));
  const pool = wiki.articles.filter((a) => (!family || a.family === family) && (!topic || a.topic === topic));
  if (!words.length) return pool;
  return pool
    .map((a) => {
      const title = a.title.toLowerCase();
      const about = `${a.excerpt} ${a.family} ${a.topic} ${familyName(a.family)} ${topicName(a.topic)}`.toLowerCase();
      const text = body?.[a.id] || "";
      let score = title.includes(phrase) ? 30 : 0;
      for (const w of words) {
        if (title.includes(w)) score += 10;
        else if (about.includes(w)) score += 4;
        else if (text.includes(w)) score += 1;
        else return null;
      }
      return { a, score };
    })
    .filter(Boolean)
    .sort((x, y) => y.score - x.score || x.a.title.localeCompare(y.a.title))
    .map((x) => x.a);
}

function useTitle(title) {
  useEffect(() => { document.title = `${title} | OneLaser`; return () => { document.title = "OneLaser Store — Redesign Draft"; }; }, [title]);
}

function SearchBox({ q = "", family = "", topic = "", big = false }) {
  const [v, setV] = useState(q);
  useEffect(() => setV(q), [q]);
  return (
    <form className={`wk-search${big ? " big" : ""}`} role="search" onSubmit={(e) => { e.preventDefault(); go(`/wiki${qs({ q: v.trim(), family, topic })}`); }}>
      <Icon name="search" size={20} />
      <input type="search" value={v} onChange={(e) => setV(e.target.value)} placeholder={family ? tf("Search {name} guides", { name: familyName(family) }) : t("Search by model, issue or keyword")} aria-label={t("Search the knowledge base")} enterKeyHint="search" />
      <button type="submit" className="btn-primary">{t("Search")}</button>
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
  const topics = TOPIC_ORDER.map((k) => [k, wiki.articles.filter((a) => a.topic === k).length]);
  const popular = POPULAR_GUIDES.map((s) => bySlug.get(s)).filter(Boolean);
  return (
    <>
      <section className="wk-hero">
        <div className="container">
          <p className="wk-kicker">{t("Support")}</p>
          <h1>{t("Product Knowledge Base")}</h1>
          <p className="wk-sub">{tf("{n} guides for setup, troubleshooting, software and materials.", { n: wiki.articles.length })}</p>
          <SearchBox big />
          <div className="wk-popular">
            <span>{t("Popular searches")}</span>
            {POPULAR_SEARCHES.map((s) => <Link key={s} to={`/wiki${qs({ q: s })}`}>{t(s)}</Link>)}
          </div>
          <EnglishNote />
        </div>
      </section>
      <section className="container wk-section">
        <h2 className="wk-h2">{t("What do you need?")}</h2>
        <div className="wk-topics">
          {topics.map(([k, n]) => (
            <Link key={k} to={`/wiki${qs({ topic: k })}`} className="wk-topic">
              <Icon name={TOPIC_ICON[k]} size={28} tone />
              <b>{topicName(k)}</b>
              <span>{topicText(k)}</span>
              <small>{guidesCount(n)}</small>
            </Link>
          ))}
        </div>
      </section>
      <section className="container wk-section">
        <h2 className="wk-h2">{t("Browse by product")}</h2>
        <div className="wk-families">
          {MACHINES.map((f) => (
            <Link key={f} to={`/wiki/${f}`} className="wk-family">
              <span className="wk-family-img"><img src={familyImage(f)} alt="" loading="lazy" /></span>
              <b>{familyName(f)}</b>
              <span>{familyText(f)}</span>
              <small>{guidesCount(inFamily(f).length)}<Icon name="arrow" size={16} /></small>
            </Link>
          ))}
        </div>
        <div className="wk-more">
          {FAMILY_ORDER.filter((f) => !MACHINES.includes(f)).map((f) => (
            <Link key={f} to={`/wiki/${f}`} className="wk-more-item">
              <span><b>{familyName(f)}</b><span>{familyText(f)}</span></span>
              <small>{guidesCount(inFamily(f).length)}</small>
            </Link>
          ))}
        </div>
      </section>
      <section className="container wk-section">
        <div className="wk-h2-row">
          <h2 className="wk-h2">{t("Popular guides")}</h2>
          <Link to={`/wiki${qs({ all: "1" })}`} className="wk-link">{tf("Browse all {n} guides", { n: wiki.articles.length })}<Icon name="chevron" size={16} /></Link>
        </div>
        <div className="wk-cards">{popular.map((a) => <GuideCard key={a.id} a={a} />)}</div>
      </section>
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

function Results({ q, family, topic }) {
  const [body, setBody] = useState(bodies);
  useEffect(() => { if (q && !body) loadBodies().then(setBody); }, [q, body]);
  const list = useMemo(() => find(q, body, family, topic), [q, body, family, topic]);
  useTitle(q ? tf("Search results for “{q}”", { q }) : t("All guides"));
  const heading = q ? tf("Results for “{q}”", { q }) : topic ? topicName(topic) : family ? familyName(family) : t("All guides");
  return (
    <>
      <section className="wk-hero small">
        <div className="container">
          <Crumbs items={[[t("Product Knowledge Base"), "/wiki"], [q ? t("Search") : t("All guides")]]} />
          <SearchBox q={q} family={family} topic={topic} />
        </div>
      </section>
      <section className="container wk-section wk-results">
        <h1 className="wk-h1">{heading}</h1>
        <p className="wk-count" aria-live="polite">{q && !body ? t("Searching…") : guidesCount(list.length)}</p>
        <Chips label={t("Topic")} value={topic} options={[["", t("All topics")], ...TOPIC_ORDER.map((k) => [k, topicName(k)])]} make={(v) => `/wiki${qs({ q, family, topic: v, all: !q && !family && !v ? "1" : "" })}`} />
        <Chips label={t("Product")} value={family} options={[["", t("All products")], ...FAMILY_ORDER.map((f) => [f, familyName(f)])]} make={(v) => `/wiki${qs({ q, family: v, topic, all: !q && !topic && !v ? "1" : "" })}`} />
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
            <div className="wk-cards">{all.filter((a) => a.topic === k && a !== start).sort((x, y) => x.title.localeCompare(y.title)).map((a) => <GuideCard key={a.id} a={a} showFamily={false} />)}</div>
          </div>
        ))}
      </section>
    </>
  );
}

const scrollToId = (id) => { const el = id && document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); return !!el; };

function Toc({ toc, open, onToggle }) {
  if (toc.length < 2) return null;
  return (
    <nav className={`wk-toc${open ? " open" : ""}`} aria-label={t("On this page")}>
      <button type="button" className="wk-toc-head" aria-expanded={open} onClick={onToggle}>{t("On this page")}<Icon name="chevron" size={16} /></button>
      <ol>
        {toc.map((h) => (
          <li key={h.id} className={h.level === 3 ? "sub" : ""}>
            <a href={`#/wiki`} data-anchor={h.id} onClick={(e) => { e.preventDefault(); scrollToId(h.id); }}>{h.text}</a>
          </li>
        ))}
      </ol>
    </nav>
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
        <aside className="wk-aside">{page && <Toc toc={page.toc} open={tocOpen} onToggle={() => setTocOpen(!tocOpen)} />}</aside>
        <article className="wk-article">
          <p className="wk-meta"><Link to={`/wiki${qs({ topic: a.topic, family: a.family })}`}>{topicName(a.topic)}</Link><span>{tf("{n} min read", { n: a.min })}</span>{a.updated && <span>{tf("Updated {date}", { date: date(a.updated) })}</span>}</p>
          <h1 className="wk-title">{a.title}</h1>
          <EnglishNote />
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
  const slug = decodeURIComponent(rest || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  const q = (query.get("q") || "").trim().slice(0, 100);
  const family = FAMILY_ORDER.includes(query.get("family")) ? query.get("family") : "";
  const topic = TOPIC_ORDER.includes(query.get("topic")) ? query.get("topic") : "";
  let body;
  if (!slug) body = q || family || topic || query.has("all") ? <Results q={q} family={family} topic={topic} /> : <Overview />;
  else if (FAMILY_ORDER.includes(slug)) body = <Family f={slug} topic={topic} />;
  else if (bySlug.has(slug)) body = <Guide key={slug} a={bySlug.get(slug)} anchor={query.get("h") || ""} />;
  else body = <NotFound />;
  return (
    <div className="wk">
      {body}
      <Help />
    </div>
  );
}
