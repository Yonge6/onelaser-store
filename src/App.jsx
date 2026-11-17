import { CartProvider } from "./cart.jsx";
import { useRoute } from "./lib.js";
import { CartDrawer, Footer, Header } from "./components/Chrome.jsx";
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
  if (section === "cart") return <Cart />;
  if (section === "compare") return <Compare />;
  return <Home />;
}

export default function App() {
  const { path, query } = useRoute();
  const checkout = path === "/checkout";
  return (
    <CartProvider>
      {checkout ? (
        <Checkout />
      ) : (
        <>
          <Header path={path} />
          <main><Page path={path} query={query} /></main>
          <Footer />
        </>
      )}
      <CartDrawer />
    </CartProvider>
  );
}
