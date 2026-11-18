import { CartProvider } from "./cart.jsx";
import { useRoute } from "./lib.js";
import { useLang } from "./i18n.js";
import { Footer, Header } from "./components/Chrome.jsx";
import Home from "./pages/Home.jsx";
import Collection from "./pages/Collection.jsx";
import Product from "./pages/Product.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Compare from "./pages/Compare.jsx";

function Page({ path, query }) {
  const [, section, handle] = path.split("/");
  if (section === "collections" && handle) return <Collection key={handle} handle={handle} />;
  if (section === "products" && handle) return <Product handle={handle} />;
  if (section === "search") return <Collection key={`s-${query.get("q")}`} search={query.get("q") || ""} />;
  if (section === "compare") return <Compare />;
  if (section === "cart") return <Cart />;
  return <Home />;
}

export default function App() {
  const { path, query } = useRoute();
  const lang = useLang(); // every t() call re-reads the language on re-render
  return (
    <CartProvider>
      {path === "/checkout" ? (
        <Checkout key={lang} />
      ) : (
        <>
          <Header path={path} lang={lang} />
          <main key={`main-${lang}`}><Page path={path} query={query} /></main>
          <Footer key={`footer-${lang}`} />
        </>
      )}
    </CartProvider>
  );
}
