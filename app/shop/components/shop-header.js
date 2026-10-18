import Link from "next/link";
import { categories } from "../lib/products";
import ShopIcon from "./shop-icon";

export default function ShopHeader({ category, onCategoryChange, remaining, count, onOpenCart }) {
  return (
    <header className="shop-header">
      <nav className="shop-categories" aria-label="Produktkategorien">
        {categories.map((item) => (
          <button key={item.id} type="button" className={category === item.id ? "active" : ""} aria-pressed={category === item.id} onClick={() => onCategoryChange(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>
      <Link href="/" className="shop-wordmark" aria-label="Date Shopping Startseite">DATE SHOPPING</Link>
      <div className="shop-header-actions">
        <span className="shop-balance" aria-label={`${remaining} Credits verfügbar`}>
          <ShopIcon name="points" />
          <span><strong data-testid="balance">{remaining}</strong><span className="balance-label"> CREDITS</span></span>
        </span>
        <button type="button" className="shop-cart-toggle" onClick={onOpenCart} aria-label={`Warenkorb öffnen, ${count} Produkte`} aria-haspopup="dialog" aria-controls="cart-drawer">
          <ShopIcon name="bag" /><span className="cart-count">{count}</span>
        </button>
      </div>
    </header>
  );
}
