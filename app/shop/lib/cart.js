import { resolveCartItem, START_BUDGET } from "./products.js";

// Keep the storage key to sanitize and overwrite carts from the previous catalog.
export const CART_STORAGE_KEY = "date-shopping.cart.v1";
export const initialCart = { entries: [], ready: false };

export function cartSummary(entries) {
  const items = entries.map(resolveCartItem).filter(Boolean);
  const spent = items.reduce((sum, product) => sum + product.points, 0);
  return { items, count: items.length, spent, remaining: START_BUDGET - spent };
}

function entryFor(item) {
  return item.variantId ? { id: item.id, variantId: item.variantId } : { id: item.id };
}

// Ignore removed products, invalid variants, duplicates and over-budget entries.
// Old string IDs are accepted only when they identify a current fixed-price product.
export function restoreCart(value) {
  if (!Array.isArray(value)) return [];
  const entries = [];
  let spent = 0;
  for (const saved of value) {
    const item = resolveCartItem(typeof saved === "string" ? { id: saved } : saved);
    if (!item || entries.some((entry) => entry.id === item.id) || spent + item.points > START_BUDGET) continue;
    entries.push(entryFor(item));
    spent += item.points;
  }
  return entries;
}

export function cartReducer(state, action) {
  switch (action.type) {
    case "restore":
      return { entries: restoreCart(action.entries), ready: true };
    case "add": {
      if (!state.ready) return state;
      const item = resolveCartItem({ id: action.id, variantId: action.variantId });
      if (!item) return state;
      const current = cartSummary(state.entries).items.find((product) => product.id === item.id);
      if (current && current.variantId === item.variantId) return state;
      const available = cartSummary(state.entries).remaining + (current?.points || 0);
      if (item.points > available) return state;
      return {
        ...state,
        entries: current
          ? state.entries.map((entry) => entry.id === item.id ? entryFor(item) : entry)
          : [...state.entries, entryFor(item)],
      };
    }
    case "remove":
      return { ...state, entries: state.entries.filter((entry) => entry.id !== action.id) };
    default:
      return state;
  }
}
