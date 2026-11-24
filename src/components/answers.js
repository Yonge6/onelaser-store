import { homeFaq } from "../data/site.js";
import { shortArea } from "./Glance.jsx";

/* Plain answers to what buyers ask most, built from the catalog specs and the store FAQ (no claims beyond those). */
const faqText = (q) => homeFaq.find(([k]) => k.startsWith(q))?.[1] || "";
export function quickAnswers(p) {
  if (p.kind !== "machine") return [];
  const src = p.specs?.["Laser source"] || "";
  const glass = /glass/i.test(src);
  const watt = (src.match(/(\d+)W Glass/) || [])[1];
  const name = p.name.replace(/™/g, "");
  const out = [];
  if (p.series === "vertigo") out.push(["Can it cut, or only engrave?", "It engraves only. VertiGo is made for round items like tumblers, mugs and bottles; it does not cut flat sheets."]);
  else if (p.series === "hydra" && glass) out.push(["Can it cut, or only engrave?", "Both. Choose the Hybrid version: the glass tube cuts wood and acrylic, and the RF laser engraves fine detail. The Pro version (70W RF) also cuts, with clean edges."]);
  else if (glass) out.push(["Can it cut, or only engrave?", { tpl: "Both. The {w}W glass tube is made for cutting wood and acrylic, and it engraves too.", v: { w: watt } }]);
  else if (/70W RF/.test(src)) out.push(["Can it cut, or only engrave?", "Both. The 70W RF laser engraves fine detail and cuts with clean edges."]);
  else out.push(["Can it cut, or only engrave?", "Both, but it's at its best on fine, fast engraving. For thick wood and acrylic, a higher-power glass-tube machine such as Cobra is the better choice."]);
  if (p.series === "vertigo") out.push(["How big can my items be?", "Round items from 16 to 230 mm across (about 0.6 to 9 in)."]);
  else out.push(["How big can my pieces be?", { tpl: "Up to {area}, the size of the work area.", v: { area: shortArea(p.specs?.["Work area"]) } }]);
  out.push(["Do I need a water chiller?", !glass ? "No. It uses an air-cooled RF laser, so no chiller is needed." : p.series === "hydra" ? "Only for the Hybrid version: its glass tube is water-cooled. The Pro version (70W RF) is air-cooled." : "Yes. The glass tube is water-cooled, so you'll need a chiller."]);
  if (p.series !== "vertigo") out.push(["Can it engrave tumblers and other round items?", "Yes, with a rotary attachment (sold separately). If drinkware is most of your work, VertiGo holds tumblers upright with its rotary built in."]);
  out.push(["What software does it use?", faqText("Which software")]);
  out.push(["What warranty do I get?", ["xrf", "hydra", "legacy"].includes(p.series) ? "3 years on mechanical parts, 2 years on electrical components, 1 year on optics and the laser source." : p.series === "vertigo" ? "1 year on mechanical and electrical parts, 6 months on the laser source, 1 month on lens and mirror." : "1 year on mechanical and electrical parts. Optical lenses are not covered."]);
  out.push(["Can I pay monthly?", faqText("Is financing available")]);
  return out.map(([q, a]) => [q, a, name]);
}

