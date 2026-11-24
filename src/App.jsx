import { CartProvider } from "./cart.jsx";
import { useRoute } from "./lib.js";
import { useLang } from "./i18n.js";
import { Footer, Header } from "./components/Chrome.jsx";
import Home, { TrustDialog } from "./pages/Home.jsx";
import Collection from "./pages/Collection.jsx";
import Product from "./pages/Product.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Compare from "./pages/Compare.jsx";
import Consult from "./pages/Consult.jsx";
import Finance from "./pages/Finance.jsx";
import Assistant from "./components/Assistant.jsx";
import FinderFlow from "./components/FinderFlow.jsx";
import { byHandle } from "./lib.js";
import { useEffect, useState } from "react";
import { t } from "./i18n.js";

/** Shown when Black Friday ends while the page is open: prices on screen are the old ones until the visitor refreshes. */
function SaleEnded() {
  const [on, setOn] = useState(() => typeof window !== "undefined" && !!window.__saleEnded);
  useEffect(() => { const f = () => setOn(true); window.addEventListener("onelaser:sale-ended", f); return () => window.removeEventListener("onelaser:sale-ended", f); }, []);
  if (!on) return null;
  return (
    <div className="sale-ended" role="status">
      <span>{t("Black Friday has ended, so prices have changed. Refresh to see today's prices; your checkout details stay filled in.")}</span>
      <button type="button" onClick={() => window.location.reload()}>{t("Refresh prices")}</button>
    </div>
  );
}

function Page({ path, query }) {
  const [, section, handle] = path.split("/");
  if (section === "collections" && handle) return <Collection key={handle} handle={handle} />;
  if (section === "products" && handle) return <Product handle={handle} />;
  if (section === "search") return <Collection key={`s-${query.get("q")}`} search={query.get("q") || ""} />;
  if (section === "compare") return <Compare />;
  if (section === "pages" && handle === "sales-consultation") return <Consult />;
  if (section === "pages" && handle === "financing") return <Finance key={query.get("p") || ""} query={query} />;
  if (section === "find-my-machine") return <FinderFlow page />; // Figma 4-question version, to compare with the home finder
  if (section === "cart") return <Cart />;
  return <Home />;
}

/* The machine finder as a popup on any page ("Find my machine" in the header, the listing banner, the assistant).
   Same finder card and answers as the one on the home page; it closes by itself when the visitor follows a link out of it. */
function FinderPopup({ path }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { const f = () => setOpen(true); window.addEventListener("onelaser:finder-open", f); return () => window.removeEventListener("onelaser:finder-open", f); }, []);
  useEffect(() => setOpen(false), [path]);
  // a link inside it (machine, details, booking) closes it, even when it points at the page already open underneath
  return open ? <div onClickCapture={(e) => e.target.closest?.("a[href]") && setTimeout(() => setOpen(false))}><TrustDialog kind="finder" onClose={() => setOpen(false)} /></div> : null;
}

export default function App() {
  const { path, query } = useRoute();
  const lang = useLang(); // every t() call re-reads the language on re-render
  return (
    <CartProvider>
      <SaleEnded />
      {path === "/checkout" ? (
        <Checkout key={lang} />
      ) : (
        <>
          <Header path={path} lang={lang} />
          <main key={`main-${lang}`}><Page path={path} query={query} /></main>
          <Footer key={`footer-${lang}`} />
          <FinderPopup path={path} />
          {/* Shopping assistant while people are choosing (home, product, collection, search, compare).
              Left out of the single-goal pages: booking, financing, cart and checkout. */}
          {/^\/($|products\/|collections\/|search|compare)/.test(path) && <Assistant key={path.split("/")[2] || "site"} product={path.startsWith("/products/") ? byHandle[path.split("/")[2]] : null} />}
        </>
      )}
    </CartProvider>
  );
}
