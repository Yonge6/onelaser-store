import { t } from "../i18n.js";
import { Icon } from "./ui.jsx";

/* "At a glance": a machine's key specs as icon rows with a plain label under each value (Figma product page).
   Every value comes from the catalog specs; only the wording around it is ours. */

export const shortArea = (s = "") => s.replace(/\s*\(.*?\)/g, "").replace(/\d+\.\d{2,}/g, (n) => String(Math.round(parseFloat(n) * 10) / 10));
// Warranty terms from the warranty FAQ: X Series and Hydra 3-2-1 years; Cobra and VertiGo 1 year on mechanical and electrical.
const warranty = (p) => (["xrf", "hydra", "legacy"].includes(p.series) ? ["3-2-1 years", "Warranty: mechanical, electrical, laser"] : ["1 year", "Warranty on mechanical and electrical parts"]);
const glass = (p) => /glass/i.test(p.specs?.["Laser source"] || "");
const rfOnly = (p) => !glass(p);

/** Rows for a machine: [icon, value, label]. */
export function glanceRows(p, { full = true } = {}) {
  const s = p.specs || {};
  const source = (s["Laser source"] || "").split(";");
  const rows = [
    ["bolt", source[0].trim(), source[1] ? source[1].trim() : "Laser power and type"],
    p.series === "vertigo" ? ["area", "Ø 16–230 mm", "Round items it can hold"] : ["area", shortArea(s["Work area"]), "Work area (largest piece)"],
    ["gauge", s["Max engraving speed"], "Top engraving speed"],
    ["target", s["Max resolution"], "Finest detail"],
  ];
  if (full) {
    rows.push(rfOnly(p) ? ["beam", "Air-cooled", "No water chiller needed"] : p.series === "hydra" ? ["drop", "Pro: air-cooled", "Hybrid: glass tube needs water cooling"] : ["drop", "Water-cooled", "Glass tube needs water cooling"]);
    rows.push(["shield", ...warranty(p)]);
  }
  return rows.filter((r) => r[1]);
}

export default function Glance({ product, full = true, title = true, best = true }) {
  const rows = glanceRows(product, { full });
  return (
    <div className="gl">
      {title && <p className="gl-title">{t("At a glance")}</p>}
      <ul className="gl-grid">
        {rows.map(([icon, value, label]) => (
          <li key={label}><span className="gl-ico"><Icon name={icon} size={18} /></span><span><b>{t(value)}</b><em>{t(label)}</em></span></li>
        ))}
        {best && product.bestFor && <li className="gl-wide"><span className="gl-ico"><Icon name="target" size={18} /></span><span><b>{t(product.bestFor)}</b><em>{t("Best for")}</em></span></li>}
      </ul>
    </div>
  );
}
