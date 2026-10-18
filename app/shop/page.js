import { Suspense } from "react";
import Shop from "./components/shop";
import "./shop.css";

export const metadata = {
  title: "Shop | Date Shopping",
  description: "Stelle dein Date mit 100 Credits zusammen.",
};

export default function ShopPage() {
  return (
    <Suspense fallback={<main className="shop-loading" aria-busy="true">DATE SHOPPING</main>}>
      <Shop />
    </Suspense>
  );
}
