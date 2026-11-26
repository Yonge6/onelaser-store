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
import Consult, { Booking } from "./pages/Consult.jsx";
import { PolicyBody } from "./components/Terms.jsx";
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

/* Popups over the current page, so the visitor never loses their place:
   - "finder": "Find my machine" in the header, the listing banner, the assistant (same finder card as the home page);
   - "financing": the payment estimate, started on the cart total or a machine ({ h, amount });
   - "book": the free-call time picker from the booking page.
   Opened with openPopup() (lib.js); a link to another page inside closes it, even one pointing at the page underneath. */
function Popup({ path }) {
  const [p, setP] = useState(null);
  useEffect(() => {
    const onPopup = (e) => setP(e.detail);
    const onFinder = () => setP({ kind: "finder" });
    window.addEventListener("onelaser:popup", onPopup);
    window.addEventListener("onelaser:finder-open", onFinder);
    return () => { window.removeEventListener("onelaser:popup", onPopup); window.removeEventListener("onelaser:finder-open", onFinder); };
  }, []);
  useEffect(() => setP(null), [path]);
  if (!p) return null;
  const close = () => setP(null);
  return (
    <div onClickCapture={(e) => e.target.closest?.('a[href^="#/"]:not([data-popup])') && setTimeout(close)}>
      <TrustDialog key={p.kind} kind={p.kind} start={p} onClose={close} onBook={() => setP({ kind: "book" })}>{p.kind === "book" ? <BookPopup /> : p.kind === "policy" ? <PolicyBody page={p.page} /> : null}</TrustDialog>
    </div>
  );
}
function BookPopup() {
  return <div className="tdlg-book"><Booking /></div>;
}

export default function App() {
  const { path, query } = useRoute();
  const lang = useLang(); // every t() call re-reads the language on re-render
  return (
    <CartProvider>
      <SaleEnded />
      {path === "/checkout" ? (
        <>
          <Checkout key={lang} />
          <Popup path={path} />
        </>
      ) : (
        <>
          <Header path={path} lang={lang} />
          <main key={`main-${lang}`}><Page path={path} query={query} /></main>
          <Footer key={`footer-${lang}`} />
          <Popup path={path} />
          {/* Shopping assistant while people are choosing (home, product, collection, search, compare).
              Left out of the single-goal pages: booking, financing, cart and checkout. */}
          {/^\/($|products\/|collections\/|search|compare)/.test(path) && <Assistant key={path.split("/")[2] || "site"} product={path.startsWith("/products/") ? byHandle[path.split("/")[2]] : null} />}
        </>
      )}
    </CartProvider>
  );
}
