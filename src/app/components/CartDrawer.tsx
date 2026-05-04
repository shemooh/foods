"use client";

import { useState } from "react";
import { useCart } from "../lib/cartContext";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, removeFromCart, count, placeOrders } = useCart();
  const router = useRouter();
  const [placing, setPlacing] = useState(false);

  const total = cart.reduce((sum, item) => {
    const price = parseFloat(item.price.replace(/[^0-9.]/g, ""));
    return sum + price * item.quantity;
  }, 0);

  const handleCheckout = async () => {
    setPlacing(true);
    const { data } = await supabase.auth.getSession();
    const email = data.session?.user?.email;
    await placeOrders(email);
    setPlacing(false);
    onClose();
    router.push("/track");
  };

  return (
    <>
      <style>{`
        .drawer-backdrop {
          position: fixed; inset: 0; background: rgba(0,0,0,0.25);
          backdrop-filter: blur(4px); z-index: 300;
          opacity: 0; pointer-events: none; transition: opacity 0.2s;
        }
        .drawer-backdrop.open { opacity: 1; pointer-events: all; }
        .drawer {
          position: fixed; top: 0; right: 0; height: 100vh; width: 100%; max-width: 360px;
          background: #fff; border-left: 1px solid rgba(0,0,0,0.08);
          z-index: 301; display: flex; flex-direction: column;
          transform: translateX(100%); transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
          font-family: 'Inter', -apple-system, sans-serif;
        }
        .drawer.open { transform: translateX(0); }
        .drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1.25rem 1.5rem; border-bottom: 1px solid rgba(0,0,0,0.07);
        }
        .drawer-title {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #000;
        }
        .drawer-count {
          font-size: 0.65rem; color: rgba(0,0,0,0.35); font-weight: 400;
          letter-spacing: 0.04em; margin-left: 0.5rem;
        }
        .drawer-close {
          background: none; border: none; cursor: pointer; font-size: 1rem;
          color: rgba(0,0,0,0.3); padding: 0.25rem; transition: color 0.15s;
        }
        .drawer-close:hover { color: #000; }
        .drawer-body { flex: 1; overflow-y: auto; padding: 1rem 1.5rem; }
        .drawer-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          height: 100%; gap: 0.5rem; color: rgba(0,0,0,0.3);
        }
        .drawer-empty-icon { font-size: 2.5rem; filter: grayscale(1); }
        .drawer-empty-text { font-size: 0.78rem; font-weight: 300; }
        .drawer-empty-link {
          font-size: 0.68rem; font-weight: 600; color: #f97316;
          text-decoration: none; letter-spacing: 0.06em; text-transform: uppercase;
          margin-top: 0.5rem;
        }
        .drawer-empty-link:hover { text-decoration: underline; }
        .d-item {
          display: flex; align-items: flex-start; gap: 0.85rem;
          padding: 0.85rem 0; border-bottom: 1px solid rgba(0,0,0,0.06);
        }
        .d-item:last-child { border-bottom: none; }
        .d-emoji { font-size: 1.75rem; filter: grayscale(1); flex-shrink: 0; line-height: 1; margin-top: 2px; }
        .d-info { flex: 1; min-width: 0; }
        .d-name {
          font-size: 0.82rem; font-weight: 700; color: #000;
          letter-spacing: -0.02em; margin-bottom: 0.15rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .d-rest {
          font-size: 0.6rem; color: rgba(0,0,0,0.28);
          text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.2rem;
        }
        .d-note { font-size: 0.62rem; color: rgba(0,0,0,0.35); font-style: italic; }
        .d-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.4rem; flex-shrink: 0; }
        .d-price { font-size: 0.82rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        .d-qty { font-size: 0.6rem; color: rgba(0,0,0,0.3); }
        .d-remove {
          background: none; border: none; cursor: pointer; font-size: 0.6rem;
          color: rgba(0,0,0,0.2); letter-spacing: 0.06em; text-transform: uppercase;
          padding: 0; transition: color 0.15s; font-family: 'Inter', sans-serif;
        }
        .d-remove:hover { color: #cc0000; }
        .drawer-foot {
          padding: 1.25rem 1.5rem; border-top: 1px solid rgba(0,0,0,0.07);
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .d-total { display: flex; justify-content: space-between; align-items: center; }
        .d-total-label { font-size: 0.62rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(0,0,0,0.35); }
        .d-total-val { font-size: 1.25rem; font-weight: 900; color: #000; letter-spacing: -0.04em; }
        .d-checkout {
          width: 100%; background: #000; color: #fff; border: none;
          padding: 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.7rem;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; border-radius: 4px; transition: opacity 0.15s;
        }
        .d-checkout:hover { opacity: 0.75; }
        .d-checkout:disabled { opacity: 0.4; cursor: default; }
        .d-viewcart {
          display: block; text-align: center; font-size: 0.65rem; font-weight: 500;
          color: rgba(0,0,0,0.35); text-decoration: none; letter-spacing: 0.06em;
          text-transform: uppercase; transition: color 0.15s;
        }
        .d-viewcart:hover { color: #000; }
      `}</style>

      <div className={`drawer-backdrop${open ? " open" : ""}`} onClick={onClose} />
      <div className={`drawer${open ? " open" : ""}`}>
        <div className="drawer-head">
          <div>
            <span className="drawer-title">Cart</span>
            <span className="drawer-count">{count} item{count !== 1 ? "s" : ""}</span>
          </div>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-body">
          {cart.length === 0 ? (
            <div className="drawer-empty">
              <span className="drawer-empty-icon">🛒</span>
              <span className="drawer-empty-text">Your cart is empty</span>
              <Link href="/browse" className="drawer-empty-link" onClick={onClose}>
                Browse food →
              </Link>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="d-item">
                <span className="d-emoji">{item.emoji}</span>
                <div className="d-info">
                  <div className="d-name">{item.name}</div>
                  <div className="d-rest">{item.rest}</div>
                  {item.note && <div className="d-note">"{item.note}"</div>}
                </div>
                <div className="d-right">
                  <span className="d-price">{item.price}</span>
                  <span className="d-qty">x{item.quantity}</span>
                  <button className="d-remove" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="drawer-foot">
            <div className="d-total">
              <span className="d-total-label">Total</span>
              <span className="d-total-val">₱{total.toFixed(2)}</span>
            </div>
            <button className="d-checkout" onClick={handleCheckout} disabled={placing}>
              {placing ? "Placing order…" : "Proceed to Checkout"}
            </button>
            <Link href="/cart" className="d-viewcart" onClick={onClose}>
              View full cart
            </Link>
          </div>
        )}
      </div>
    </>
  );
}