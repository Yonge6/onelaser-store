import { useState } from "react";
import { img } from "../lib.js";

/** Long-form product story. Blocks come from src/data/stories.json (scraped from 1laser.com product pages). */
const Head = ({ b, center = true }) =>
  b.title || b.eyebrow ? (
    <header className={`story-head${center ? " center" : ""}`}>
      {b.eyebrow && <p className="kicker">{b.eyebrow}</p>}
      {b.title && <h2 className="h2">{b.title}</h2>}
      {b.intro && <p className="lead">{b.intro}</p>}
    </header>
  ) : null;

const Media = ({ item, width = 1200, className = "" }) =>
  item.video ? (
    <video className={className} src={item.video} poster={img(item.img || item.image, width)} controls muted playsInline preload="none" />
  ) : (
    <img className={className} src={img(item.img || item.image, width)} alt={item.title || ""} loading="lazy" />
  );

function Tabs({ b }) {
  const [i, setI] = useState(0);
  const item = b.items[i];
  const label = (it) => it.eyebrow || it.title;
  return (
    <section className="story-block">
      <Head b={b} />
      <div className="tabs tabs-center" role="tablist">
        {b.items.map((it, n) => <button key={it.title} type="button" role="tab" aria-selected={n === i} className={n === i ? "on" : ""} onClick={() => setI(n)}>{label(it)}</button>)}
      </div>
      <div className="story-tab">
        {item.img && <Media item={item} />}
        <div>
          {item.eyebrow && <p className="kicker">{item.eyebrow}</p>}
          <h3>{item.title}</h3>
          <p>{item.text}</p>
          {item.footer && <p className="story-proof">{item.footer}</p>}
        </div>
      </div>
    </section>
  );
}

function Features({ b }) {
  const [lead, ...rest] = b.items;
  const big = lead.img || lead.video ? lead : null;
  const cards = big ? rest : b.items;
  return (
    <section className="story-block">
      <Head b={b} />
      {big && (
        <div className="story-lead">
          <Media item={big} width={1400} />
          <div>
            <h3>{big.title}</h3>
            <p>{big.text}</p>
            {big.tags.length > 0 && <ul className="chips">{big.tags.map((t) => <li key={t}>{t}</li>)}</ul>}
          </div>
        </div>
      )}
      {cards.length > 0 && (
        <div className={`story-cards n${Math.min(cards.length, 4)}`}>
          {cards.map((c) => (
            <article key={c.title}>
              {(c.img || c.video) && <Media item={c} width={800} />}
              <div><h4>{c.title}</h4><p>{c.text}</p>{c.tags.length > 0 && <ul className="chips">{c.tags.map((t) => <li key={t}>{t}</li>)}</ul>}</div>
            </article>
          ))}
        </div>
      )}
      {b.stats?.length > 0 && <div className="story-stats">{b.stats.map(([v, l]) => <div key={v + l}><b>{v}</b><span>{l}</span></div>)}</div>}
      {b.badges?.length > 0 && <ul className="chips story-badges">{b.badges.map((t) => <li key={t}>{t}</li>)}</ul>}
    </section>
  );
}

export function SpecGroups({ groups }) {
  return (
    <div className="spec-groups">
      {groups.map((g, i) => (
        <details key={g.group} open={i < 2}>
          <summary>{g.group}</summary>
          <table className="spec-table"><tbody>{g.rows.map(([k, v]) => <tr key={k}><th>{k}</th><td>{v}</td></tr>)}</tbody></table>
        </details>
      ))}
    </div>
  );
}

function Block({ b, flip }) {
  switch (b.kind) {
    case "banner":
      return (
        <picture className="story-banner">
          {b.mobile && <source media="(max-width: 640px)" srcSet={img(b.mobile, 900)} />}
          <img src={img(b.image, 1800)} alt="" loading="lazy" />
        </picture>
      );
    case "split":
      return (
        <section className={`story-split${flip ? " flip" : ""}`}>
          <Media item={b} width={1200} />
          <div><Head b={b} center={false} /></div>
        </section>
      );
    case "tabs":
      return <Tabs b={b} />;
    case "features":
      return <Features b={b} />;
    case "gallery":
      return (
        <section className="story-block">
          <Head b={b} />
          <div className="story-gallery">{b.items.map((it) => <figure key={it.title}><img src={img(it.img, 600)} alt="" loading="lazy" /><figcaption>{it.title}</figcaption></figure>)}</div>
        </section>
      );
    case "videos":
      return (
        <section className="story-block">
          <Head b={b} />
          <div className="story-videos">
            {b.videos.map((v) => (
              <a key={v.id} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noreferrer" aria-label="Watch video on YouTube">
                <img src={img(v.img, 700)} alt="" loading="lazy" /><span className="play" aria-hidden="true">▶</span>
              </a>
            ))}
          </div>
        </section>
      );
    case "table":
      return (
        <section className="story-block">
          <Head b={b} />
          <div className="compare-scroll">
            <table className="story-table">
              <thead><tr>{b.rows[0].map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
              <tbody>{b.rows.slice(1).map((r) => <tr key={r[0]}>{r.map((c, i) => (i ? <td key={i}>{c}</td> : <th key={i}>{c}</th>))}</tr>)}</tbody>
            </table>
          </div>
        </section>
      );
    case "promise":
      return (
        <section className="story-block">
          <div className="story-promise">{b.items.map((it) => <article key={it.title}><h4>{it.title}</h4><p>{it.text}</p></article>)}</div>
        </section>
      );
    default:
      return null;
  }
}

export default function Story({ blocks }) {
  let splits = 0;
  return <div className="story">{blocks.map((b, i) => <Block key={i} b={b} flip={b.kind === "split" && splits++ % 2 === 1} />)}</div>;
}
