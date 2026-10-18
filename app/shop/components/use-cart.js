import { useEffect, useReducer } from "react";
import { CART_STORAGE_KEY, cartReducer, cartSummary, initialCart } from "../lib/cart";

export default function useCart() {
  const [cart, dispatch] = useReducer(cartReducer, initialCart);

  useEffect(() => {
    let entries = [];
    try {
      entries = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
    } catch {
      // A blocked or corrupt store must not prevent shopping in this session.
    }
    dispatch({ type: "restore", entries });
  }, []);

  useEffect(() => {
    if (!cart.ready) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.entries));
    } catch {
      // State continues to work if browser storage is unavailable.
    }
  }, [cart.entries, cart.ready]);

  return {
    ...cartSummary(cart.entries),
    ready: cart.ready,
    add: (id, variantId) => dispatch({ type: "add", id, variantId }),
    remove: (id) => dispatch({ type: "remove", id }),
  };
}
