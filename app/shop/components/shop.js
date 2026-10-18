"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { categoryLabel, products } from "../lib/products";
import { readAppointment } from "../lib/appointment";
import useCart from "./use-cart";
import ShopHeader from "./shop-header";
import ProductGrid from "./product-grid";
import CartDrawer from "./cart-drawer";
import WelcomeDialog from "./welcome-dialog";

export default function Shop() {
  const [category, setCategory] = useState("all");
  const [cartOpen, setCartOpen] = useState(false);
  const cart = useCart();
  const searchParams = useSearchParams();
  const appointment = readAppointment(searchParams.get("date"), searchParams.get("time"));
  const visibleProducts = category === "all" ? products : products.filter((product) => product.category === category);

  return (
    <div className="shop-shell">
      <ShopHeader category={category} onCategoryChange={setCategory} remaining={cart.remaining} count={cart.count} onOpenCart={() => setCartOpen(true)} />
      <main className="shop-main">
        <section className="shop-intro" aria-labelledby="shop-title">
          <div><p className="shop-eyebrow">DATE SHOPPING / THE COLLECTION</p><h1 id="shop-title">THE DATE EDIT</h1></div>
          {appointment && <div className="shop-appointment"><span>YOUR DATE</span><p>{appointment.label}</p></div>}
        </section>
        <div className="shop-collection-heading"><h2>{categoryLabel(category)}</h2><span aria-live="polite">{visibleProducts.length} PRODUCTS</span></div>
        <ProductGrid products={visibleProducts} cart={cart} />
      </main>
      <WelcomeDialog />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} appointment={appointment} />
      <p className="shop-sr-only" role="status" aria-live="polite">{cart.ready ? `${cart.count} Produkte im Warenkorb. ${cart.remaining} Credits verfügbar.` : "Warenkorb wird geladen."}</p>
    </div>
  );
}
