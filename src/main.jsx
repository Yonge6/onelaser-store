import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/poppins/900.css";
import "./styles.css";

import { now, promo, saleOn } from "./data/site.js";

// Prices are fixed when the page loads. A tab left open past the end of Black Friday is told so (an event the app shows as
// a banner, and checkout holds "Place order") instead of reloading on its own, so nothing someone is typing gets lost.
if (saleOn) {
  const ends = Date.parse(promo.endsAt);
  let told = false;
  const check = () => { if (!told && now() >= ends) { told = true; window.__saleEnded = true; window.dispatchEvent(new Event("onelaser:sale-ended")); } };
  setInterval(check, 30000);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && check());
}

createRoot(document.getElementById("root")).render(<App />);
