import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { byHandle } from "./lib.js";

const CartContext = createContext(null);
const KEY = "onelaser-store-cart-v1";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const [lines, setLines] = useState(load); // [{handle, variantId, qty}]
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines]);

  const value = useMemo(() => {
    const items = lines
      .map((l) => {
        const product = byHandle[l.handle];
        const variant = product?.variants.find((v) => v.id === l.variantId);
        return product && variant ? { ...l, product, variant, total: variant.price * l.qty } : null;
      })
      .filter(Boolean);
    const subtotal = items.reduce((s, i) => s + i.total, 0);
    const savings = items.reduce((s, i) => s + (i.variant.compareAt ? (i.variant.compareAt - i.variant.price) * i.qty : 0), 0);
    const count = items.reduce((s, i) => s + i.qty, 0);
    const add = (handle, variantId, qty = 1, { open = true } = {}) => {
      setLines((prev) => {
        const hit = prev.find((l) => l.variantId === variantId);
        return hit ? prev.map((l) => (l === hit ? { ...l, qty: l.qty + qty } : l)) : [...prev, { handle, variantId, qty }];
      });
      if (open) setDrawerOpen(true);
    };
    const setQty = (variantId, qty) =>
      setLines((prev) => (qty <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, qty } : l))));
    const clear = () => setLines([]);
    return { items, subtotal, savings, count, add, setQty, clear, drawerOpen, setDrawerOpen };
  }, [lines, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
