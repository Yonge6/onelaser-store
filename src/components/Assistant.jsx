import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { byHandle, frontImg, img, money, products } from "../lib.js";
import { useCart } from "../cart.jsx";
import { AddButton, Icon, Link } from "./ui.jsx";
import { M, rank } from "./finderRules.js";
import { contact, homeFaq, promo } from "../data/site.js";

/* Floating shopping assistant, after the "Shop with AI" agent on poolinstore.com (checked 2026-11-19):
   a black pill at the bottom centre whose label rotates; it opens a dark chat panel at the bottom right
   (full screen on phones) with a welcome line, swipeable category cards, suggested questions and a message box.
   Design draft: this static preview has no AI behind it. Replies come from preset rules over the real catalog,
   the machine finder's matching rules, and the site's own deal, warranty, return, financing and support text. */

const LABELS = ["Shop with AI", "Shop Deals", "Find my laser"];
const CATS = [
  ["xrf", "XRF desktop", "onelaser-xrf-desktop-laser-machine"],
  ["cobra", "Cobra Series", "cobra-10-100w-co2-laser-engraver-cutter"],
  ["hydra", "Hydra Gen2", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine"],
  ["vertigo", "VertiGo", "vertigo-vertical-laser-engraver"],
  ["deals", "Black Friday deals", null],
  ["rotary", "Rotary attachments", "piburn-v-for-onelaser"],
];
const CHIPS = ["Which laser fits me?", "Show me Black Friday deals", "Cobra or Hydra?", "Can I pay monthly?", "Shipping and returns", "Talk to a person"];
const SERIES = {
  xrf: ["onelaser-xrf-desktop-laser-machine"],
  cobra: ["cobra-8-90w-co2-laser-engraver-cutter", "cobra-10-100w-co2-laser-engraver-cutter", "cobra-14-130w-co2-laser-engraver-cutter"],
  hydra: ["hydra-7-gen-2-70w-rf-co2-dual-laser-machine", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "hydra-13-gen-2-70w-rf-co2-dual-laser-machine", "hydra-16-gen-2-70w-rf-co2-dual-laser-machine"],
  vertigo: ["vertigo-vertical-laser-engraver"],
};
const faq = (q) => homeFaq.find(([k]) => k.startsWith(q))?.[1] || "";
const has = (s, words) => words.some((w) => s.includes(w));

/** Turn a message into finder answers (only what the words say). */
function parse(s) {
  const a = {};
  const mats = [];
  if (has(s, ["wood", "acrylic", "mdf", "plywood", "sign"])) mats.push("wood");
  if (has(s, ["leather", "fabric", "paper", "patch"])) mats.push("leather");
  if (has(s, ["tumbler", "cup", "mug", "bottle", "drinkware", "yeti"])) mats.push("drinkware");
  if (has(s, ["glass", "stone", "slate", "tile"])) mats.push("stone");
  if (has(s, ["metal", "anodized", "coated", "aluminum", "steel"])) mats.push("coated");
  if (has(s, ["photo", "portrait", "detail"])) mats.push("photo");
  if (mats.length) a.material = mats;
  if (has(s, ["cut", "cutting"])) a.work = has(s, ["engrav"]) ? "both" : "cut";
  else if (has(s, ["engrav"])) a.work = "engrave";
  if (/small (piece|item|part|thing|sign)|coaster|ornament|keychain|\btags?\b/.test(s)) a.size = "s"; // not "small business"
  if (has(s, ["large", "big", "furniture", "sheet", "4x8", "batch"])) a.size = "l";
  if (has(s, ["beginner", "start", "hobby", "side", "garage", "home"])) a.shop = "side";
  if (has(s, ["business", "full-time", "full time", "shop"])) a.shop = a.shop || "full";
  if (has(s, ["production", "volume", "factory", "industrial"])) a.shop = "high";
  if (has(s, ["tumbler", "cup", "mug", "bottle", "drinkware", "round", "cylinder"])) a.round = mats.length > 1 ? "some" : "most";
  return a;
}

/** Preset replies. Returns { text, cards?, links?, chips? }. */
function reply(raw) {
  const s = raw.toLowerCase();
  const list = (hs) => hs.map((h) => byHandle[h]).filter(Boolean);
  if (has(s, ["person", "human", "call", "phone", "talk", "expert", "sales", "agent"]))
    return { text: "Happy to hand you over. A OneLaser expert can take a free 30-minute call, or you can ring the team now.", links: [["Book a free call", "/pages/sales-consultation"], [`Call ${contact.phone}`, `tel:${contact.tel}`]] };
  if (has(s, ["deal", "black friday", "sale", "discount", "cheap", "save", "offer", "coupon"])) {
    const deals = products.filter((p) => p.compareAt > p.price).sort((x, y) => (y.compareAt - y.price) - (x.compareAt - x.price)).slice(0, 6);
    return { text: `${promo.label}. ${promo.headline}. These have the biggest savings right now:`, cards: deals, links: [["See all deals", "/collections/machines"]] };
  }
  if (has(s, ["financ", "monthly", "per month", "pay over", "installment", "loan", "lease", "afford"]))
    return { text: faq("Is financing available") + " Business loans can start at $0 down with terms up to 60 months.", links: [["Estimate my monthly payment", "/pages/financing"]] };
  if (has(s, ["ship", "deliver", "return", "refund", "warranty", "guarantee"]))
    return { text: `${faq("What warranty")} ${faq("Can I return")} Shipping rates and delivery dates are shown at checkout once you enter your address; machines ship by freight.`, links: [["Read the warranty policy", "https://www.1laser.com/pages/warranty-policy"]] };
  if (has(s, ["software", "lightburn", "mac", "windows"]))
    return { text: faq("Which software"), cards: list(["lightburn-software-pro-license-key"]) };
  if (has(s, ["support", "help after", "broken", "repair", "service"]))
    return { text: faq("How does support"), links: [["Contact support", "https://zohodesk.1laser.com/portal/en/newticket"]] };
  if (has(s, [" vs", "versus", "compare", "difference", " or "]) && has(s, ["cobra", "hydra", "xrf", "vertigo"]))
    return { text: "Short version: XRF is an all-in-one 38W RF desktop for fine engraving. Cobra uses 90–130W glass CO₂ tubes, the value pick for cutting wood and acrylic. Hydra Gen2 adds RF engraving and a glass tube in one machine, with 2,000 mm/s and 4G for production. VertiGo is a vertical RF machine for round items only.", cards: list(["onelaser-xrf-desktop-laser-machine", "cobra-10-100w-co2-laser-engraver-cutter", "hydra-9-gen-2-70w-rf-co2-dual-laser-machine", "vertigo-vertical-laser-engraver"]), links: [["Compare every spec", "/compare"]] };
  for (const k of Object.keys(SERIES)) if (s.includes(k)) return { text: `Here is the ${k === "xrf" ? "XRF" : k === "vertigo" ? "VertiGo" : k === "cobra" ? "Cobra Series" : "Hydra Gen2"} line-up with today's prices.`, cards: list(SERIES[k]) };
  if (has(s, ["rotary", "piburn", "round"]) && !has(s, ["which", "best", "recommend"])) return { text: "Rotary attachments for engraving round items:", cards: products.filter((p) => p.category === "rotary").slice(0, 6) };
  if (has(s, ["fume", "smoke", "filter", "vent", "extract"])) return { text: "FiltraBox fume extractors, for rooms without an outside vent:", cards: products.filter((p) => p.category === "fume" && p.price > 1000) };
  if (has(s, ["chiller", "cooling", "water"])) return { text: "Glass tubes need water cooling. These chillers fit Cobra and Hydra:", cards: products.filter((p) => p.category === "cooling") };
  if (has(s, ["material", "acrylic sheet", "leatherette", "blank"])) return { text: "MakerDepot materials, cut and tested for lasers:", cards: products.filter((p) => p.kind === "material").slice(0, 6) };
  const a = parse(s);
  if (has(s, ["which", "recommend", "best", "fit", "should i", "need", "want", "looking", "beginner", "start"]) || Object.keys(a).length) {
    const top = rank(a, (h) => !!byHandle[h], (h) => byHandle[h]?.price || 0).slice(0, 3).map((r) => ({ p: byHandle[M[r.key].handle], why: r.reasons }));
    const MAT = { wood: "wood and acrylic", leather: "leather and fabric", drinkware: "tumblers", stone: "glass and stone", coated: "coated metal", photo: "photos" };
    const WORK = { engrave: "mostly engraving", cut: "mostly cutting", both: "cutting and engraving" };
    const USE = { side: "just starting out", full: "a full-time shop", high: "high-volume production" };
    const heard = [a.material && a.material.map((m) => MAT[m]).join(", "), WORK[a.work], a.size && (a.size === "s" ? "small pieces" : "large pieces"), USE[a.shop]].filter(Boolean);
    if (!heard.length) return { text: "Tell me a little about your work and I'll suggest a machine. What do you want to make, and from which materials?", chips: ["Tumblers and drinkware", "Wood signs, cutting acrylic", "Leather patches for a small business", "Large batches, full production"] };
    return { text: `From what you said (${heard.join("; ")}), ${top[0].p.name} is my first pick${top[0].why[0] ? `: ${top[0].why[0].toLowerCase()}` : ""}. Answer the full finder for a closer match.`, cards: top.map((x) => x.p), finder: true };
  }
  return { text: "I can find a machine for your work, show today's deals, explain financing, shipping and warranty, or connect you with a person.", chips: CHIPS };
}

function Cards({ list }) {
  return (
    <div className="ai-cards">
      {list.map((p) => (
        <div key={p.handle} className="ai-card">
          <Link to={`/products/${p.handle}`} className="ai-card-img"><img src={img(p.kind === "machine" ? frontImg(p) : p.images[0], 300)} alt="" loading="lazy" /></Link>
          <b>{p.name}</b>
          <p>{p.priceVaries && <small>{t("From")} </small>}{money(p.price)}{p.compareAt > p.price && <s>{money(p.compareAt)}</s>}</p>
          <div className="ai-card-btns">
            <AddButton product={p} className="ai-add" drop="up" iconSize={14} />
            <Link to={`/products/${p.handle}`} className="ai-view">{t("View")}</Link>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(0);
  const [msgs, setMsgs] = useState([]);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const { count } = useCart();
  const body = useRef(null);
  const input = useRef(null);

  useEffect(() => { const id = setInterval(() => setLabel((n) => (n + 1) % LABELS.length), 3200); return () => clearInterval(id); }, []);
  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: "smooth" }); }, [msgs, typing]);
  useEffect(() => {
    if (!open) return undefined;
    input.current?.focus({ preventScroll: true });
    const key = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", key);
    const small = window.matchMedia("(max-width: 860px)").matches;
    const prev = document.body.style.overflow;
    if (small) document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", key); document.body.style.overflow = prev; };
  }, [open]);

  const ask = (q) => {
    const v = q.trim();
    if (!v || typing) return;
    setMsgs((m) => [...m, { me: true, text: v }]);
    setText("");
    setTyping(true);
    setTimeout(() => { setMsgs((m) => [...m, reply(v)]); setTyping(false); }, 700);
  };
  const cat = ([k, name, h]) => ask(k === "deals" ? "Show me Black Friday deals" : k === "rotary" ? "Rotary attachments" : `Show me the ${name}`);
  const toFinder = () => {
    setOpen(false);
    window.dispatchEvent(new Event("onelaser:finder"));
    setTimeout(() => document.querySelector(".fx")?.scrollIntoView({ behavior: "smooth", block: "center" }), 120);
  };

  return (
    <>
      <button type="button" className={`ai-pill${open ? " hide" : ""}`} onClick={() => setOpen(true)} aria-label={t("Open the OneLaser shopping assistant")} aria-expanded={open}>
        <span className="ai-avatar"><Icon name="sparkle" size={20} /></span>
        <span className="ai-pill-text" key={label}>{t(LABELS[label])}</span>
      </button>
      {open && (
        <div className="ai-panel" role="dialog" aria-label={t("OneLaser shopping assistant")}>
          <header className="ai-head">
            <span className="ai-avatar sm"><Icon name="sparkle" size={16} /></span>
            <span className="ai-title"><b>{t("OneLaser Shopping Assistant")}</b><small><i />{t("Online · replies instantly")}</small></span>
            <Link to="/cart" className="ai-icon" aria-label={t("Cart")}><Icon name="cart" size={20} />{count > 0 && <em>{count}</em>}</Link>
            {msgs.length > 0 && <button type="button" className="ai-icon" aria-label={t("New chat")} title={t("New chat")} onClick={() => setMsgs([])}><Icon name="refresh" size={18} /></button>}
            <button type="button" className="ai-icon" aria-label={t("Close")} onClick={() => setOpen(false)}><Icon name="close" size={20} /></button>
          </header>
          <div className="ai-body" ref={body}>
            <div className="ai-welcome">
              <h2>{t("Welcome to OneLaser")} 👋</h2>
              <p>{t("Ask me anything: which laser fits your work, today's deals, financing or shipping.")}</p>
              <div className="ai-cats-wrap"><div className="ai-cats">
                {CATS.map((c) => {
                  const p = c[2] && byHandle[c[2]];
                  return (
                    <button key={c[0]} type="button" onClick={() => cat(c)}>
                      <span className="ai-cat-img">{p ? <img src={img(p.kind === "machine" ? frontImg(p) : p.images[0], 240)} alt="" /> : <b className="ai-cat-deal">{promo.headline}</b>}</span>
                      <span className="ai-cat-name">{t(c[1])}</span>
                    </button>
                  );
                })}
              </div></div>
              {msgs.length === 0 && (
                <div className="ai-try">
                  <p>{t("Try asking")}</p>
                  <div className="ai-chips grid">{CHIPS.map((c) => <button key={c} type="button" onClick={() => ask(c)}><Icon name="sparkle" size={12} />{t(c)}</button>)}</div>
                </div>
              )}
            </div>
            {msgs.map((m, n) => (m.me ? (
              <p key={n} className="ai-me">{m.text}</p>
            ) : (
              <div key={n} className="ai-bot">
                <p>{t(m.text)}</p>
                {m.cards?.length > 0 && <Cards list={m.cards} />}
                {(m.links || m.finder) && (
                  <div className="ai-links">
                    {m.finder && <button type="button" onClick={toFinder}>{t("Open the machine finder")} →</button>}
                    {m.links?.map(([l, u]) => (/^(https?:|tel:)/.test(u) ? <Link key={l} href={u}>{t(l)} →</Link> : <Link key={l} to={u} onClick={() => setOpen(false)}>{t(l)} →</Link>))}
                  </div>
                )}
                {m.chips && <div className="ai-chips">{m.chips.map((c) => <button key={c} type="button" onClick={() => ask(c)}>{t(c)}</button>)}</div>}
              </div>
            )))}
            {typing && <div className="ai-typing" aria-label={t("Assistant is typing")}><i /><i /><i /></div>}
          </div>
          <form className="ai-input" onSubmit={(e) => { e.preventDefault(); ask(text); }}>
            <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder={t("Message the OneLaser assistant")} aria-label={t("Message")} />
            <button type="submit" disabled={!text.trim() || typing} aria-label={t("Send")}><Icon name="arrow" size={18} /></button>
          </form>
          <p className="ai-fine">{t("Design draft: replies come from preset rules over the real catalog, not a live AI.")}</p>
        </div>
      )}
    </>
  );
}
