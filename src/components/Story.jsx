import { useEffect, useRef, useState } from "react";
import { img } from "../lib.js";
import { Icon } from "./ui.jsx";

/* Long-form product story, in the dark cinematic style of the Bambu Lab and ComMarker product pages.
   Blocks come from src/data/stories.json (scraped from the 1laser.com product pages), in the official order.
   Specs and FAQ blocks are rendered by the product page itself, in the light sections after the story. */

const ytId = (url) => (url.match(/embed\/([\w-]+)/) || url.match(/[?&]v=([\w-]+)/) || [])[1];

function Reveal({ as: Tag = "section", className = "", children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return el?.classList.add("in");
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (el.classList.add("in"), io.disconnect()), { rootMargin: "0px 0px -12% 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`ls-reveal ${className}`} {...rest}>{children}</Tag>;
}

const Head = ({ b, left = false }) =>
  b.title || b.eyebrow ? (
    <header className={`ls-head${left ? " left" : ""}`}>
      {b.eyebrow && <p className="ls-eyebrow">{b.eyebrow}</p>}
      {b.title && <h2>{b.title}</h2>}
      {b.intro && <p className="ls-intro">{b.intro}</p>}
    </header>
  ) : null;

const Media = ({ item, width = 1400 }) =>
  item.video && !/youtube/.test(item.video) ? (
    <video src={item.video} poster={img(item.img || item.image, width)} muted loop playsInline autoPlay preload="none" />
  ) : (
    <img src={img(item.img || item.image, width)} alt={item.title || ""} loading="lazy" />
  );

const Proof = ({ text }) => (text ? <ul className="ls-proof">{text.split(" · ").map((t) => <li key={t}>{t}</li>)}</ul> : null);

function Tabs({ b, id }) {
  const [i, setI] = useState(0);
  const item = b.items[i] || b.items[0];
  return (
    <Reveal className="ls-block" id={id}>
      <Head b={b} />
      <div className="ls-tabs" role="tablist">
        {b.items.map((it, n) => <button key={n} type="button" role="tab" aria-selected={n === i} className={n === i ? "on" : ""} onClick={() => setI(n)}>{it.eyebrow || it.title}</button>)}
      </div>
      <div className={`ls-panel${item.img || item.video ? "" : " text-only"}`} key={i}>
        {(item.img || item.video) && <div className="ls-panel-media"><Media item={item} /></div>}
        <div className="ls-panel-copy">
          {item.eyebrow && <p className="ls-eyebrow">{item.eyebrow}</p>}
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          <Proof text={item.footer} />
        </div>
      </div>
    </Reveal>
  );
}

function Features({ b, id }) {
  const lead = b.items.find((x) => x.img || x.video) || (b.image ? { title: "", text: "", img: b.image, tags: [] } : null);
  const cards = b.items.filter((x) => x !== lead);
  return (
    <Reveal className="ls-block" id={id}>
      <Head b={b} />
      {lead && (
        <article className="ls-lead">
          <Media item={lead} width={1800} />
          {lead.title && (
            <div>
              {lead.eyebrow && <p className="ls-eyebrow">{lead.eyebrow}</p>}
              <h3>{lead.title}</h3>
              {lead.text !== b.intro && <p>{lead.text}</p>}
              <Proof text={lead.footer} />
            </div>
          )}
        </article>
      )}
      {cards.length > 0 && (
        <div className={`ls-cards n${Math.min(cards.length, 3)}`}>
          {cards.map((c, n) => (
            <article key={n}>
              {(c.img || c.video) && <div className="ls-card-media"><Media item={c} width={900} /></div>}
              <div>
                {c.eyebrow && <p className="ls-eyebrow">{c.eyebrow}</p>}
                <h3>{c.title}</h3>
                <p>{c.text}</p>
                <Proof text={c.footer} />
              </div>
            </article>
          ))}
        </div>
      )}
      {b.stats?.length > 0 && <div className="ls-stats">{b.stats.map(([v, l]) => <div key={v + l}><strong>{v}</strong><span>{l}</span></div>)}</div>}
    </Reveal>
  );
}

function Gallery({ b, id }) {
  const [all, setAll] = useState(false);
  const items = all ? b.items : b.items.slice(0, 8);
  return (
    <Reveal className="ls-block" id={id}>
      <Head b={b} />
      <div className="ls-gallery">
        {items.map((it, n) => <figure key={n}><img src={img(it.img, 700)} alt="" loading="lazy" /><figcaption>{it.title}</figcaption></figure>)}
      </div>
      {b.items.length > 8 && !all && <button type="button" className="ls-more" onClick={() => setAll(true)}>Show all {b.items.length} ideas</button>}
    </Reveal>
  );
}

const PROMISE_ICONS = ["refresh", "shield", "headset"];

export default function Story({ blocks, firstId, galleryId }) {
  const [video, setVideo] = useState(null);
  useEffect(() => {
    if (!video) return undefined;
    const close = (e) => e.key === "Escape" && setVideo(null);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [video]);
  let firstUsed = false;
  let galleryUsed = false;
  let splits = 0;
  const first = () => (firstUsed ? undefined : ((firstUsed = true), firstId));
  const Play = ({ id, thumb, big }) => (
    <button type="button" className={`ls-video${big ? " big" : ""}`} onClick={() => setVideo(id)} aria-label="Play video">
      <img src={thumb ? img(thumb, big ? 1400 : 700) : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" />
      <span aria-hidden="true" />
    </button>
  );
  return (
    <div className="ls">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case "banner":
            return (
              <Reveal as="div" className="ls-banner" key={i}>
                <picture>
                  {b.mobile && <source media="(max-width: 640px)" srcSet={img(b.mobile, 900)} />}
                  <img src={img(b.image, 2000)} alt="" loading="lazy" />
                </picture>
              </Reveal>
            );
          case "split":
            return (
              <Reveal className={`ls-block ls-split${splits++ % 2 ? " flip" : ""}`} key={i} id={first()}>
                <div className="ls-split-media">{b.video && ytId(b.video) ? <Play id={ytId(b.video)} thumb={b.image} big /> : <Media item={b} />}</div>
                <Head b={b} left />
              </Reveal>
            );
          case "tabs":
            return <Tabs b={b} key={i} id={first()} />;
          case "features":
            return <Features b={b} key={i} id={first()} />;
          case "gallery":
            return <Gallery b={b} key={i} id={galleryUsed ? undefined : ((galleryUsed = true), galleryId)} />;
          case "videos":
            return (
              <Reveal className="ls-block" key={i}>
                <Head b={b} />
                <div className={`ls-videos n${Math.min(b.videos.length, 5)}`}>{b.videos.map((v, n) => <Play key={v.id} id={v.id} thumb={v.img} big={n === 0} />)}</div>
              </Reveal>
            );
          case "table":
            return (
              <Reveal className="ls-block" key={i}>
                <Head b={b} />
                {b.video && ytId(b.video) && <div className="ls-table-video"><Play id={ytId(b.video)} big /></div>}
                {b.rows?.length > 1 && (
                  <div className="ls-table-scroll">
                    <table className="ls-table">
                      <thead><tr>{b.rows[0].map((c, n) => <th key={n}>{c}</th>)}</tr></thead>
                      <tbody>{b.rows.slice(1).map((r, n) => <tr key={n}>{r.map((c, k) => (k ? <td key={k}>{c}</td> : <th key={k}>{c}</th>))}</tr>)}</tbody>
                    </table>
                  </div>
                )}
              </Reveal>
            );
          case "promise":
            return (
              <Reveal className="ls-block" key={i}>
                <div className="ls-promise">
                  {b.items.map((it, n) => <article key={n}><Icon name={PROMISE_ICONS[n % 3]} size={32} /><h3>{it.title}</h3><p>{it.text}</p></article>)}
                </div>
              </Reveal>
            );
          default:
            return null;
        }
      })}
      {video && (
        <div className="ls-modal" role="dialog" aria-modal="true" aria-label="Video" onClick={() => setVideo(null)}>
          <button type="button" aria-label="Close video">×</button>
          <div onClick={(e) => e.stopPropagation()}>
            <iframe src={`https://www.youtube-nocookie.com/embed/${video}?autoplay=1&rel=0`} title="Video" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
          </div>
        </div>
      )}
    </div>
  );
}
