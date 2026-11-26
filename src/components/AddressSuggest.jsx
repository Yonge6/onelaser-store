import { useEffect, useRef, useState } from "react";
import { t } from "../i18n.js";
import { Icon } from "./ui.jsx";

/* Street address with suggestions while typing (free OpenStreetMap search by Photon / komoot, no key, no cost).
   Picking a suggestion fills street, city, state and ZIP; the buyer can always keep typing their own address.
   Only what is typed in this field is sent, after 4+ characters and a short pause. */
const STATE_NAMES = new Set(["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"]);
const pick = (p) => ({
  street: [p.housenumber, p.street || p.name].filter(Boolean).join(" "),
  city: p.city || p.town || p.village || p.district || p.county || "",
  state: STATE_NAMES.has(p.state) ? p.state : "",
  zip: /^\d{5}$/.test(p.postcode || "") ? p.postcode : "",
});

export default function AddressSuggest({ value, onChange, onPick, bad }) {
  const [list, setList] = useState([]);
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(-1);
  const typed = useRef(false); // only search after the buyer types, not when a saved draft fills the field
  useEffect(() => {
    const q = String(value || "").trim();
    if (!typed.current || q.length < 4) { setList([]); return undefined; }
    const num = (q.match(/^\d+/) || [""])[0];
    const ctl = new AbortController();
    const id = setTimeout(() => {
      fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6&lang=en&layer=house&layer=street`, { signal: ctl.signal })
        .then((r) => r.json())
        .then((j) => {
          const seen = new Set();
          const out = (j.features || []).map((f) => f.properties).filter((p) => p.countrycode === "US").map(pick)
            .filter((a) => a.street && a.city && !seen.has(a.street + a.city) && seen.add(a.street + a.city))
            // the house number the buyer typed comes first
            .sort((a, b) => (num && b.street.startsWith(num + " ") ? 1 : 0) - (num && a.street.startsWith(num + " ") ? 1 : 0)).slice(0, 5);
          setList(out); setHi(-1); setOpen(true);
        })
        .catch(() => {}); // offline or blocked: the field still works as a plain input
    }, 300);
    return () => { clearTimeout(id); ctl.abort(); };
  }, [value]);
  const choose = (a) => { onPick(a); setOpen(false); setList([]); typed.current = false; };
  const key = (e) => {
    if (!open || !list.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHi((h) => (h + 1) % list.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => (h <= 0 ? list.length - 1 : h - 1)); }
    else if (e.key === "Enter" && hi >= 0) { e.preventDefault(); choose(list[hi]); }
    else if (e.key === "Escape") setOpen(false);
  };
  const show = open && list.length > 0;
  return (
    <div className="ik-addr c2">
      <label className={`ik-field ${bad ? "bad" : ""}`}>
        <input placeholder=" " name="street" autoComplete="address-line1" value={value || ""} role="combobox" aria-expanded={show} aria-controls="ik-addr-list" aria-autocomplete="list"
          aria-activedescendant={show && hi >= 0 ? `ik-addr-${hi}` : undefined}
          onChange={(e) => { typed.current = true; onChange("street", e.target.value); }} onKeyDown={key} onBlur={() => setTimeout(() => setOpen(false), 150)} onFocus={() => list.length && setOpen(true)} />
        <span>{t("Street address")}<i> *</i></span>
      </label>
      {show && (
        <ul className="ik-addr-list" id="ik-addr-list" role="listbox" aria-label={t("Suggested addresses")}>
          {list.map((a, n) => (
            <li key={a.street + a.city + n} id={`ik-addr-${n}`} role="option" aria-selected={n === hi} className={n === hi ? "on" : ""} onMouseDown={(e) => { e.preventDefault(); choose(a); }}>
              <Icon name="pin" size={16} /><span><b>{a.street}</b><small>{[a.city, a.state, a.zip].filter(Boolean).join(", ")}</small></span>
            </li>
          ))}
          <li className="ik-addr-src" aria-hidden="true">{t("Powered by OpenStreetMap")}</li>
        </ul>
      )}
    </div>
  );
}
