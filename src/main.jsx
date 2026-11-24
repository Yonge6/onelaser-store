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

// Prices are fixed when the page loads. A tab left open past the end of Black Friday reloads, so the cart and checkout
// switch to regular prices at once (checked every minute and whenever the tab comes back into view).
if (saleOn) {
  const ends = Date.parse(promo.endsAt);
  const check = () => { if (now() >= ends) window.location.reload(); };
  setInterval(check, 60000);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && check());
}

createRoot(document.getElementById("root")).render(<App />);
