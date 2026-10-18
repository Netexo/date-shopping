import { Suspense } from "react";
import Checkout from "./components/checkout";
import "./checkout.css";

export const metadata = {
  title: "Checkout | Date Shopping",
  description: "Die Zusammenfassung deines Dates.",
};

export default function CheckoutPage() {
  return (
    <Suspense fallback={<main className="checkout-page" aria-busy="true"><p>Zusammenfassung wird geladen.</p></main>}>
      <Checkout />
    </Suspense>
  );
}
