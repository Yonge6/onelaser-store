import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { asset, byHandle, img, money, products, frontImg } from "../lib.js";
import { heroSlides, homeAmbition, homeFaq, homeProof, homeReviews, homeStandard, homeTabs, homeVideos, trustpilot, newHandles, promo, shortSlogans } from "../data/site.js";
import { AddButton, Countdown, Icon, Link, useDragScroll } from "../components/ui.jsx";
import FinderCard, { FinderHelp } from "../components/Finder.jsx";

/* Module order, sizes and type follow the insta360.com homepage (measured 2026-11-17 at 1440 and 375):
   full-bleed hero 660 with segmented progress → headline + sticky pill tabs + 3-column product cards (416×554, radius 24)
   → feature banner 480 → Shop by interest (310×480 tiles) → two half cards 640×480 → image banner 480
   → story carousel (864×486) → business band 376 → four support tiles 240. 64px gutters, 64px between blocks.
   Typeface is Poppins, as on Insta360. Only the brand red is OneLaser's own (Insta360 uses yellow). */

const SLIDE_MS = 10000;

/* Insta360's hero has "Buy now" + "Learn more", both leading to the same page. Here the second button does something else:
   a product slide adds that product to the cart (first available option, stays on the page); a series slide opens the comparison. */
function HeroButtons({ s, tab }) {
  const product = s.to.startsWith("/products/") ? byHandle[s.to.slice(10)] : null;
  return (
    <div className="ih-btns">
      <Link to={s.to} className="ih-btn light" tabIndex={tab}>{product ? t("Buy now") : t("Shop now")}</Link>
      {product && product.available ? (
        <AddButton product={product} className="ih-btn ghost" drop="down" iconSize={18} />
      ) : (
        <Link to="/compare" className="ih-btn ghost" tabIndex={tab}>{t("Compare models")}</Link>
      )}
    </div>
  );
}

/** Background clip for a hero slide: loads and plays only while its slide is showing, rewinds when it leaves. */
function HeroVideo({ src, poster, active }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(false);
  const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    const v = ref.current;
    if (!v || still) return;
    if (active) v.play().catch(() => {});
    else { v.pause(); try { v.currentTime = 0; } catch { /* not loaded yet */ } }
  }, [active, still]);
  if (still) return null;
  return <video ref={ref} className={ready ? "ready" : ""} src={active || ready ? src : undefined} poster={poster} muted loop playsInline preload="none" onPlaying={() => setReady(true)} aria-hidden="true" />;
}

/** Muted YouTube clip over a hero slide. The frame stays invisible until the player itself reports "playing" (state 1) through the
    IFrame API messages, so a blocked or sign-in-walled player never shows; the slide's own video or image stays in view instead. */
function HeroYouTube({ id, start = 0, active }) {
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const still = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  useEffect(() => {
    if (!active) { setPlaying(false); return undefined; }
    const onMessage = (e) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname) || e.source !== ref.current?.contentWindow) return;
      let data;
      try { data = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      const state = data?.info?.playerState;
      if (state === 1) setPlaying(true);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [active]);
  if (still || !active) return null;
  const src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}&start=${start}&playsinline=1&rel=0&modestbranding=1&disablekb=1&fs=0&iv_load_policy=3&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`;
  const listen = () => ref.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
  return (
    <div className={`ih-yt${playing ? " ready" : ""}`} aria-hidden="true">
      <iframe ref={ref} src={src} title="" tabIndex={-1} allow="autoplay; encrypted-media" onLoad={() => { listen(); setTimeout(listen, 600); setTimeout(listen, 1500); }} />
    </div>
  );
}

function Hero() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused) return undefined;
    const t = setTimeout(() => setI((n) => (n + 1) % heroSlides.length), SLIDE_MS);
    return () => clearTimeout(t);
  }, [i, paused]);
  // Finger swipe (phones and tablets): a mostly horizontal move of 40px or more changes the slide; vertical moves still scroll the page.
  const touch = useRef(null);
  const n = heroSlides.length;
  const onTouchStart = (e) => { const p = e.touches[0]; touch.current = { x: p.clientX, y: p.clientY }; setPaused(true); };
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null; setPaused(false);
    if (!s) return;
    const p = e.changedTouches[0]; const dx = p.clientX - s.x; const dy = p.clientY - s.y;
    if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.2) setI((k) => (k + (dx < 0 ? 1 : n - 1)) % n);
  };
  return (
    <section className="ih-hero" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} onTouchCancel={() => { touch.current = null; setPaused(false); }} aria-roledescription="carousel">
      {heroSlides.map((s, n) => (
        <article key={s.title} className={`ih-slide${n === i ? " on" : ""}`} aria-hidden={n !== i}>
          <img src={asset(s.image)} alt="" />
          {s.video && <HeroVideo src={/^https?:/.test(s.video) ? s.video : asset(s.video)} poster={asset(s.image)} active={n === i} />}
          {s.youtube && <HeroYouTube id={s.youtube} start={s.start} active={n === i} />}
          <div className="ih-slide-copy">
            <p className="ih-top">{t(s.eyebrow)}</p>
            <h1>{t(s.title)}</h1>
            <p className="ih-slogan">{t(s.text)}</p>
            <HeroButtons s={s} tab={n === i ? 0 : -1} />
          </div>
        </article>
      ))}
      <button type="button" className="ih-hero-arrow prev" aria-label={t("Previous slide")} onClick={() => setI((i + heroSlides.length - 1) % heroSlides.length)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M16 5L9 12L16 19" stroke="white" strokeWidth="2.5" strokeLinejoin="round" /></svg>
      </button>
      <button type="button" className="ih-hero-arrow next" aria-label={t("Next slide")} onClick={() => setI((i + 1) % heroSlides.length)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M8 5L15 12L8 19" stroke="white" strokeWidth="2.5" strokeLinejoin="round" /></svg>
      </button>
      <div className="ih-pages">
        {heroSlides.map((s, n) => (
          <button key={s.title} type="button" aria-label={`Slide ${n + 1}: ${s.title}`} className={n === i ? "on" : ""} onClick={() => setI(n)}>
            <em>{t(s.title)}</em>
            <i><span style={n === i ? { animationDuration: `${SLIDE_MS}ms`, animationPlayState: paused ? "paused" : "running" } : undefined} /></i>
          </button>
        ))}
      </div>
    </section>
  );
}

/* Insta360's card has "Learn more" + "Buy now", both leading to the product page. Here the left control adds to the cart instead:
   it adds the first available option (the one the product page preselects), stays on the page and confirms for a moment. */
// Monthly figure = price ÷ 24, the same "24-month payment" 1laser.com shows on its product pages ($4,399 → $183.29/mo.).
// It is an illustration, not an offer: the real rate and term depend on the lender's approval.
const FINANCE_MONTHS = 24;

function HomeCard({ p }) {
  return (
    <article className="ih-card">
      <div className="ih-card-info">
        {newHandles.includes(p.handle) && <span className="ih-new">{t("NEW")}</span>}
        <h3><Link to={`/products/${p.handle}`}>{p.name}</Link></h3>
        <p>{t(shortSlogans[p.handle] || p.tagline)}</p>
      </div>
      <Link to={`/products/${p.handle}`} className="ih-card-media" tabIndex={-1} aria-hidden="true"><img src={img(frontImg(p), 700)} alt="" loading="lazy" className={p.kind === "machine" ? "front" : undefined} /></Link>
      <p className="ih-card-price">
        {p.priceVaries && <span>{t("From")}</span>}
        <b>{money(p.price)}</b>
        {p.compareAt > p.price && <s>{money(p.compareAt)}</s>}
        {p.compareAt > p.price && <em>{t("Save")} {money(p.compareAt - p.price)}</em>}
      </p>
      {p.kind === "machine" && (
        <p className="ih-card-monthly">{t("or")} <b>${(p.price / FINANCE_MONTHS).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>{t("/mo for 24 months")}</p>
      )}
      <div className="ih-card-btns">
        <AddButton product={p} className="ih-btn line sm" />
        <Link to={`/products/${p.handle}`} className="ih-btn dark sm">{t("Buy now")}</Link>
      </div>
    </article>
  );
}

function ProductBlock() {
  const tabsRef = useDragScroll({ wheel: true });
  const [ti, setTi] = useState(0);
  const tab = homeTabs[ti];
  const list = (tab.picks ? tab.picks.map((h) => byHandle[h]) : products.filter((p) => p.category === tab.collection || (tab.collection === "materials" && p.kind === "material"))).filter(Boolean).slice(0, 6);
  return (
    <section className="ih-products">
      <div className="ih-wrap"><h2 className="ih-h2 narrow">{t("Laser machines for makers and growing businesses.")}</h2></div>
      <div className="ih-sticky">
        <div className="ih-wrap">
          <div className="ih-tabs" role="tablist" ref={tabsRef}>
            {homeTabs.map((x, n) => <button key={x.label} type="button" role="tab" aria-selected={n === ti} className={n === ti ? "on" : ""} onClick={() => setTi(n)}>{t(x.label)}</button>)}
          </div>
        </div>
      </div>
      <div className="ih-wrap">
        <div className="ih-grid" key={ti}>
          <div className="ih-row">
            {list.slice(0, 4).map((p) => (
              <HomeCard key={p.handle} p={p} />
            ))}
          </div>
          <FinderCard />
        </div>
        <div id="fc-result" />
        <div className="ih-viewall"><Link to={tab.all}>{t("View all")}</Link></div>
        <FinderHelp />
      </div>
    </section>
  );
}

/* Video module: pill tabs per product line, one large player on the left and the rest of the list on the right.
   Clicking a row loads it into the player; nothing from YouTube loads until a video is played (privacy-enhanced embed). */
const thumb = (id) => `https://i.ytimg.com/vi/${id}/hq720.jpg`;
const thumbFallback = (e, id) => { if (!e.target.dataset.fb) { e.target.dataset.fb = 1; e.target.src = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`; } };

function Videos() {
  const [tab, setTab] = useState(0);
  const [cur, setCur] = useState(0);
  const [playing, setPlaying] = useState(false);
  const items = homeVideos[tab].items;
  const [id, title, channel] = items[cur] || items[0];
  const choose = (n, play) => { setCur(n); setPlaying(play); };
  return (
    <section className="ih-block iv">
      <div className="ih-wrap">
        <div className="iv-head">
          <h2 className="ih-h2">{t("Watch OneLaser in action")}</h2>
          <div className="ih-tabs" role="tablist">
            {homeVideos.map((g, n) => <button key={g.label} type="button" role="tab" aria-selected={n === tab} className={n === tab ? "on" : ""} onClick={() => { setTab(n); choose(0, false); }}>{g.label}</button>)}
          </div>
        </div>
        <div className="iv-grid" key={tab}>
          <div className="iv-main">
            <div className="iv-player">
              {playing ? (
                <iframe key={id} src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
              ) : (
                <button type="button" onClick={() => setPlaying(true)} aria-label={`${t("Play video")}: ${title}`}>
                  <img key={id} src={thumb(id)} onError={(e) => thumbFallback(e, id)} alt="" loading="lazy" />
                  <span aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="iv-meta"><b>{title}</b><span>{channel}</span></div>
          </div>
          <ul className="iv-list">
            {items.map(([vid, vt, vc], n) => (
              <li key={vid}>
                <button type="button" className={n === cur ? "on" : ""} aria-current={n === cur} onClick={() => choose(n, true)}>
                  <span className="iv-thumb"><img src={thumb(vid)} onError={(e) => thumbFallback(e, vid)} alt="" loading="lazy" /><i aria-hidden="true" /></span>
                  <span className="iv-text"><b>{vt}</b><em>{vc}</em></span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* "Built for every ambition" (official heading and segment copy) with a pill switch for Makers / Business / Education.
   Each segment is one full-bleed row: an intro card with the official photo and copy, then that segment's videos, which open
   in a dialog on this page. */
function Makers() {
  const [seg, setSeg] = useState(0);
  const [open, setOpen] = useState(null);
  const row = useDragScroll();
  const slide = (dir) => row.current?.scrollBy({ left: dir * row.current.clientWidth * 0.8, behavior: "smooth" });
  useEffect(() => { row.current?.scrollTo({ left: 0 }); }, [seg]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);
  const A = homeAmbition;
  const cur = A.segments[seg];
  return (
    <section className="ih-block iu">
      <div className="ih-wrap">
        <p className="ist-kicker">{t(A.kicker)}</p>
        <div className="ip2-head">
          <h2 className="ih-h2">{t(A.title)}</h2>
          <p>{t(A.text)}</p>
        </div>
        <div className="iu-bar">
          <div className="iu-seg" role="tablist">
            {A.segments.map((g, n) => <button key={g.label} type="button" role="tab" aria-selected={n === seg} className={n === seg ? "on" : ""} onClick={() => setSeg(n)}>{t(g.label)}</button>)}
          </div>
          <div className="ih-arrows">
            <button type="button" aria-label={t("Previous")} onClick={() => slide(-1)}><Icon name="chevron" size={18} /></button>
            <button type="button" aria-label={t("Next")} onClick={() => slide(1)}><Icon name="chevron" size={18} /></button>
          </div>
        </div>
      </div>
      <div className="ih-scroller iu-row" ref={row} key={seg}>
        <Link href={A.cta[1]} className="iu-intro">
          <img src={img(cur.image, 1000)} alt="" loading="lazy" />
          <span><small>{t(cur.label)}</small><b>{t(cur.title)}</b><em>{t(cur.text)}</em><i>{t(A.cta[0])} ›</i></span>
        </Link>
        {cur.videos.map(([id, title, channel, what, machine]) => (
          <button key={id} type="button" className="iu-card" onClick={() => setOpen([id, title])} aria-label={`${t("Play video")}: ${title}`}>
            <span className="iu-thumb">
              <img src={thumb(id)} onError={(e) => thumbFallback(e, id)} alt="" loading="lazy" />
              <i aria-hidden="true" />
              <em>{machine}</em>
            </span>
            <span className="iu-what">{t(what)}</span>
            <b>{title}</b>
            <small>{channel}</small>
          </button>
        ))}
      </div>
      {open && (
        <div className="is-modal" role="dialog" aria-modal="true" aria-label={open[1]} onClick={() => setOpen(null)}>
          <button type="button" aria-label={t("Close video")}>×</button>
          <div onClick={(e) => e.stopPropagation()}>
            <iframe src={`https://www.youtube-nocookie.com/embed/${open[0]}?autoplay=1&rel=0`} title={open[1]} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
          </div>
        </div>
      )}
    </section>
  );
}

/** "Read all reviews": the Trustpilot profile figures and a selection of reviews in a dialog, so the visitor stays on the page. */
function ReviewsDialog({ onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [onClose]);
  const tp = trustpilot;
  const Stars = ({ n }) => <span className="tp-stars" aria-label={`${n} / 5`}>{[1, 2, 3, 4, 5].map((k) => <i key={k} className={k <= n ? "on" : ""}>★</i>)}</span>;
  return (
    <div className="tp-scrim" onClick={onClose}>
      <div className="tp-dialog" role="dialog" aria-modal="true" aria-label={t("Reviews on Trustpilot")} onClick={(e) => e.stopPropagation()}>
        <button type="button" className="tp-close" aria-label={t("Close")} onClick={onClose}><Icon name="close" size={22} /></button>
        <header className="tp-head">
          <div>
            <p className="tp-kicker">{t("Reviews on Trustpilot")}</p>
            <p className="tp-score"><b>{tp.score}</b><span>/ 5</span><Stars n={Math.round(Number(tp.score))} /></p>
            <p className="tp-count">{t("TrustScore")} · {tp.count} {t("reviews")} · {tp.asOf}</p>
          </div>
          <ul className="tp-bars">
            {tp.stars.map(([n, c]) => <li key={n}><span>{n}★</span><i><b style={{ width: `${(c / tp.count) * 100}%` }} /></i><em>{c}</em></li>)}
          </ul>
        </header>
        <p className="tp-note">{t("Showing a selection of our 4 and 5-star reviews.")}</p>
        <div className="tp-list">
          {tp.items.map((r) => (
            <article key={r.name}>
              <Stars n={r.rating} />
              <h3>{r.title}</h3>
              <p>{r.text}</p>
              <footer><b>{r.name}</b><span>{r.verified && <><Icon name="check" size={13} />{t("Verified")} · </>}{r.date}</span></footer>
            </article>
          ))}
        </div>
        <p className="tp-foot"><Link href={tp.url}>{t("See all reviews on Trustpilot")} ↗</Link></p>
      </div>
    </div>
  );
}

export default function Home() {
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const rv = useDragScroll();
  const rvSlide = (dir) => rv.current?.scrollBy({ left: dir * rv.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="ih">
      <Hero />
      <ProductBlock />

      <Videos />

      <section className="ih-block ip2">
        <div className="ih-wrap">
          <div className="ip2-head">
            <h2 className="ih-h2">{t("Built for the thousandth job, not just the first.")}</h2>
            <p>{t("The numbers that decide how long a laser earns its keep.")}</p>
          </div>
          <div className="ip2-grid">
            {homeProof.map(([figure, title, text]) => (
              <article key={figure}><b>{figure}</b><h3>{t(title)}</h3><p>{t(text)}</p></article>
            ))}
          </div>
        </div>
      </section>

      <Makers />

      <section className="ih-block irv">
        <div className="ih-wrap">
          <div className="irv-head">
            <h2 className="ih-h2">{t("Owners say it better.")}</h2>
            <Link href={homeReviews.url} className="irv-score">
              <span className="irv-stars" aria-hidden="true">★★★★★</span>
              <b>{homeReviews.average}</b>
              <em>{t("out of 5")} · {homeReviews.count} {t("machine reviews")}</em>
            </Link>
            <div className="ih-arrows">
              <button type="button" aria-label={t("Previous")} onClick={() => rvSlide(-1)}><Icon name="chevron" size={16} /></button>
              <button type="button" aria-label={t("Next")} onClick={() => rvSlide(1)}><Icon name="chevron" size={16} /></button>
            </div>
          </div>
        </div>
        <div className="ih-scroller irv-row" ref={rv}>
            {[...homeReviews.items, ...trustpilot.items.map((r) => ({ ...r, product: "Trustpilot" }))].map((r) => (
              <figure key={r.product + r.name}>
                <span className="irv-stars" aria-label={`${r.rating || 5} / 5`}>{"★".repeat(r.rating || 5)}</span>
                <blockquote>“{r.text}”</blockquote>
                <figcaption><b>{r.name}</b><span>{r.verified && <><Icon name="check" size={13} />{t(r.product === "Trustpilot" ? "Verified" : "Verified buyer")} · </>}{r.product} · {r.date}</span></figcaption>
              </figure>
            ))}
        </div>
        <div className="ih-wrap">
          <p className="fd-links"><button type="button" onClick={() => setReviewsOpen(true)}>{t("Read all reviews")} ›</button></p>
          {reviewsOpen && <ReviewsDialog onClose={() => setReviewsOpen(false)} />}
        </div>
      </section>

      <section className="ih-block ist">
        <div className="ih-wrap">
          <div className="ist-photo"><img src={img(homeStandard.image, 2400)} alt="OneLaser U.S. headquarters, Lake Forest, California" loading="lazy" /></div>
          <p className="ist-kicker">{t(homeStandard.kicker)}</p>
          <h2 className="ih-h2">{t(homeStandard.title)}</h2>
          <p className="ist-text">{t(homeStandard.text)}</p>
          <ol className="ist-points">
            {homeStandard.points.map(([title, text], n) => <li key={title}><i>{String(n + 1).padStart(2, "0")}</i><h3>{t(title)}</h3><p>{t(text)}</p></li>)}
          </ol>
          <p className="fd-links"><Link href={homeStandard.cta[1]}>{t(homeStandard.cta[0])} ›</Link></p>
        </div>
      </section>

      <section className="ih-block">
        <div className="ih-wrap">
          <Link href={promo.link} className="ih-banner">
            <img src={asset("home-bf-lineup.jpg")} alt="" loading="lazy" />
            <span className="ih-banner-copy">
              <small>{t(promo.label)}</small>
              <b>{t(promo.headline)}</b>
              <Countdown endsAt={promo.endsAt} />
              <span className="ih-btn light">{t("Learn more")}</span>
            </span>
          </Link>
        </div>
      </section>

      <section className="ih-block ifq">
        <div className="ih-wrap">
          <h2 className="ih-h2">{t("Questions? Answers.")}</h2>
          <ul className="iw-faq">
            {homeFaq.map(([q, ans], n) => (
              <li key={q}><details open={n === 0}><summary><span>{t(q)}</span><Icon name="chevron" size={16} /></summary><p>{t(ans)}</p></details></li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
