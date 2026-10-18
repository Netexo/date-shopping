import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ShopIcon from "./shop-icon";

export default function CartDrawer({ open, onClose, cart, appointment }) {
  const dialogRef = useRef(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  function finishClose() {
    setClosing(false);
    onClose();
  }

  function requestClose() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) finishClose();
    else setClosing(true);
  }

  return (
    <dialog
      id="cart-drawer"
      ref={dialogRef}
      className={`cart-drawer${closing ? " is-closing" : ""}`}
      aria-labelledby="cart-title"
      onClose={() => { if (!dialogRef.current?.open) finishClose(); }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          requestClose();
        }
      }}
      onCancel={(event) => { event.preventDefault(); requestClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}
      onAnimationEnd={(event) => { if (closing && event.target === event.currentTarget) finishClose(); }}
    >
      <div className="cart-panel">
        <header className="cart-heading">
          <h2 id="cart-title">YOUR CART <span>({cart.count})</span></h2>
          <button type="button" className="cart-close" onClick={requestClose} aria-label="Warenkorb schließen"><ShopIcon name="close" /></button>
        </header>
        {appointment && <p className="cart-appointment">YOUR DATE <span>{appointment.label}</span></p>}
        <div className="cart-body">
          {cart.count === 0 ? <div className="cart-empty"><ShopIcon name="bag" /><p>YOUR CART IS EMPTY</p></div> : (
            <ul className="cart-items">
              {cart.items.map((product) => (
                <li key={product.id} className="cart-item" data-cart-product={product.id}>
                  <div className="cart-item-visual"><ShopIcon name={product.icon} /></div>
                  <div className="cart-item-details"><h3>{product.name}</h3><p>{product.points} CREDITS</p><button type="button" onClick={() => cart.remove(product.id)} aria-label={`${product.name} entfernen`}>REMOVE</button></div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <footer className="cart-footer">
          <dl><div><dt>CREDITS SPENT</dt><dd data-testid="cart-spent">{cart.spent}</dd></div><div><dt>REMAINING BALANCE</dt><dd data-testid="cart-remaining">{cart.remaining}</dd></div></dl>
          <Link className="checkout-button checkout-link" href={appointment ? {
            pathname: "/checkout", query: { date: appointment.date, time: appointment.time },
          } : "/checkout"}>CHECKOUT</Link>
        </footer>
      </div>
    </dialog>
  );
}
