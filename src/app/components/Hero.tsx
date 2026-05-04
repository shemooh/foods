"use client";

import Image from "next/image";
import { useRef, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/cartContext";

type FoodItem = {
  id: string;
  emoji: string;
  name: string;
  rest: string;
  description: string;
  price: string;
  time: string;
  rating: string;
  tag: string;
  image_url?: string;
  created_at?: string;
};

export default function Hero() {
  const rowRef = useRef<HTMLDivElement>(null);
  const [cards, setCards] = useState<FoodItem[]>([]);
  const [current, setCurrent] = useState(0);
  const [note, setNote] = useState("");
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    supabase
      .from("food_items")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("Error fetching hero cards:", error);
        else if (data && data.length > 0) setCards(data);
      });
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el || cards.length === 0) return;

    let pos = 0;
    let paused = false;
    let raf: number;

    const step = () => {
      if (!paused) {
        pos -= 0.5;
        const half = el.scrollWidth / 3;
        if (Math.abs(pos) >= half) pos = 0;
        el.style.transform = `translateX(${pos}px)`;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    el.addEventListener("mouseenter", () => (paused = true));
    el.addEventListener("mouseleave", () => (paused = false));
    return () => cancelAnimationFrame(raf);
  }, [cards]);

  const handleOrder = () => {
    if (!food) return;
    addToCart(food, note);
    setAdded(true);
    setNote("");
    setTimeout(() => setAdded(false), 1200);
  };

  const food = cards[current];
  const track = [...cards, ...cards, ...cards];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        * { box-sizing: border-box; }
        .hero { 
          padding-top: 64px; 
          min-height: 100vh; 
          background: #fafafa; 
          font-family: 'Inter', -apple-system, sans-serif; 
          overflow: hidden; 
          display: flex; 
          flex-direction: column; 
          justify-content: center; 
        }
        .hero-body { 
          max-width: 1080px; 
          margin: 0 auto; 
          padding: 4rem 1.5rem 2rem; 
          display: flex; 
          gap: 3rem; 
          align-items: center; 
        }
        .deck { width: 100%; max-width: 320px; flex-shrink: 0; }
        .stack { position: relative; margin-bottom: 1.25rem; }
        .shadow-card { position: absolute; background: #ececec; border: 1px solid rgba(0,0,0,0.06); border-radius: 6px; }
        .s1 { inset: 8px -6px -8px 6px; }
        .s2 { inset: 4px -3px -4px 3px; background: #f4f4f4; }
        .card { position: relative; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; padding: 1.6rem; z-index: 2; }
        .card-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1.1rem; }
        .card-image { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
        .card-emoji { font-size: 2.75rem; line-height: 1; filter: grayscale(1); }
        .card-tag { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(0,0,0,0.35); border: 1px solid rgba(0,0,0,0.1); padding: 0.25rem 0.55rem; border-radius: 2px; }
        .card-name { font-size: 1.3rem; font-weight: 800; color: #000; letter-spacing: -0.035em; line-height: 1.1; margin-bottom: 0.2rem; }
        .card-rest { font-size: 0.65rem; font-weight: 500; color: rgba(0,0,0,0.3); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.9rem; }
        .card-line { height: 1px; background: rgba(0,0,0,0.07); margin-bottom: 0.9rem; }
        .card-desc { font-size: 0.8rem; font-weight: 300; color: rgba(0,0,0,0.5); line-height: 1.65; margin-bottom: 1.1rem; }
        .card-meta { display: flex; gap: 1.25rem; margin-bottom: 1.25rem; }
        .meta-val { font-size: 0.9rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        .meta-label { font-size: 0.57rem; font-weight: 500; color: rgba(0,0,0,0.28); letter-spacing: 0.07em; text-transform: uppercase; margin-top: 0.1rem; }
        .note-wrap { display: flex; border: 1px solid rgba(0,0,0,0.09); border-radius: 4px; overflow: hidden; transition: border-color 0.15s; margin-bottom: 0; }
        .note-wrap:focus-within { border-color: rgba(0,0,0,0.3); }
        .note-input { flex: 1; border: none; outline: none; background: #fafafa; font-family: 'Inter', sans-serif; font-size: 0.75rem; color: #000; padding: 0.65rem 0.8rem; }
        .note-input::placeholder { color: rgba(0,0,0,0.2); }
        .bottom-nav { display: flex; align-items: center; gap: 0.5rem; margin-top: 1.1rem; }
        .nav-arrow { width: 38px; height: 38px; background: #fff; border: 1px solid rgba(0,0,0,0.09); border-radius: 4px; cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; transition: background 0.15s; flex-shrink: 0; color: #000; }
        .nav-arrow:hover { background: #f0f0f0; }
        .nav-arrow:disabled { opacity: 0.2; cursor: default; }
        .order-btn { flex: 1; height: 38px; border: none; font-family: 'Inter', sans-serif; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: all 0.2s; }
        .order-btn.idle { background: #000; color: #fff; }
        .order-btn.idle:hover { opacity: 0.75; }
        .order-btn.success { background: #16a34a; color: #fff; cursor: default; }
        .dots { display: flex; justify-content: center; gap: 0.4rem; margin-top: 1.25rem; }
        .dot { width: 5px; height: 5px; border-radius: 50%; background: rgba(0,0,0,0.12); transition: background 0.2s, transform 0.2s; cursor: pointer; }
        .dot.active { background: #000; transform: scale(1.2); }
        .hero-copy { flex: 1; }
        .hero-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(0,0,0,0.3); margin-bottom: 1rem; }
        .hero-title { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; color: #000; letter-spacing: -0.04em; line-height: 0.95; text-transform: uppercase; margin-bottom: 1rem; }
        .hero-sub { font-size: 0.85rem; font-weight: 300; color: rgba(0,0,0,0.45); line-height: 1.7; max-width: 320px; }
        .cards-outer { overflow: hidden; border-top: 1px solid rgba(0,0,0,0.07); border-bottom: 1px solid rgba(0,0,0,0.07); padding: 0.5rem 0; margin-top: 2rem; }
        .cards-track { display: flex; gap: 1px; will-change: transform; }
        .scroll-card { flex-shrink: 0; width: 180px; background: #fff; border-right: 1px solid rgba(0,0,0,0.07); padding: 1rem; cursor: pointer; transition: background 0.15s; }
        .scroll-card:hover { background: #f5f5f5; }
        .sc-image { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; margin-bottom: 0.5rem; display: block; }
        .sc-emoji { font-size: 1.8rem; display: block; margin-bottom: 0.5rem; filter: grayscale(1); }
        .sc-name { font-size: 0.75rem; font-weight: 700; color: #000; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sc-rest { font-size: 0.62rem; color: rgba(0,0,0,0.3); margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sc-meta { display: flex; justify-content: space-between; font-size: 0.62rem; color: rgba(0,0,0,0.3); }
        .hero-empty { text-align: center; padding: 4rem 1.5rem; font-size: 0.82rem; color: rgba(0,0,0,0.3); }
        @media (max-width: 720px) { 
          .hero-body { flex-direction: column; } 
          .hero-copy { order: -1; } 
        }
      `}</style>

      <div className="hero">
        {cards.length === 0 ? (
          <div className="hero-empty">
            No food items yet. Add some from the <strong>Dashboard</strong>.
          </div>
        ) : (
          <>
            <div className="hero-body">
              <div className="deck">
                <div className="stack">
                  <div className="shadow-card s1" />
                  <div className="shadow-card s2" />
                  {food && (
                    <div className="card">
                      <div className="card-top">
                        {food.image_url ? (
                          <Image src={food.image_url} alt={food.name} width={44} height={44} className="card-image" />
                        ) : (
                          <span className="card-emoji">{food.emoji}</span>
                        )}
                        <span className="card-tag">{food.tag}</span>
                      </div>
                      <div className="card-name">{food.name}</div>
                      <div className="card-rest">{food.rest}</div>
                      <div className="card-line" />
                      <div className="card-desc">{food.description}</div>
                      <div className="card-meta">
                        <div>
                          <div className="meta-val">{food.price}</div>
                          <div className="meta-label">Price</div>
                        </div>
                        <div>
                          <div className="meta-val">{food.time}</div>
                          <div className="meta-label">Delivery</div>
                        </div>
                        <div>
                          <div className="meta-val">★ {food.rating}</div>
                          <div className="meta-label">Rating</div>
                        </div>
                      </div>
                      <div className="note-wrap">
                        <input
                          className="note-input"
                          placeholder="Note to restaurant…"
                          value={note}
                          onChange={e => setNote(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="bottom-nav">
                  <button
                    className="nav-arrow"
                    onClick={() => setCurrent(c => Math.max(0, c - 1))}
                    disabled={current === 0}
                  >
                    ←
                  </button>
                  <button
                    className={`order-btn${added ? " success" : " idle"}`}
                    onClick={handleOrder}
                    disabled={added}
                  >
                    {added ? "✓ Added to Cart!" : `Order for ${food?.price}`}
                  </button>
                  <button
                    className="nav-arrow"
                    onClick={() => setCurrent(c => Math.min(cards.length - 1, c + 1))}
                    disabled={current === cards.length - 1}
                  >
                    →
                  </button>
                </div>
                <div className="dots">
                  {cards.map((_, i) => (
                    <div
                      key={i}
                      className={`dot${i === current ? " active" : ""}`}
                      onClick={() => setCurrent(i)}
                    />
                  ))}
                </div>
              </div>

              <div className="hero-copy">
                <div className="hero-label">🎓 Student meals · Fast & affordable</div>
                <div className="hero-title">Good food.<br />Fast.</div>
                <div className="hero-sub">
                  Hundreds of restaurants at your fingertips. Hot and fresh, under 30 minutes.
                </div>
              </div>
            </div>

            {track.length > 0 && (
              <div className="cards-outer">
                <div ref={rowRef} className="cards-track">
                  {track.map((c, i) => (
                    <div key={i} className="scroll-card" onClick={() => setCurrent(cards.indexOf(c) !== -1 ? cards.indexOf(c) : current)}>
                      {c.image_url ? (
                        <Image src={c.image_url} alt={c.name} width={36} height={36} className="sc-image" />
                      ) : (
                        <span className="sc-emoji">{c.emoji}</span>
                      )}
                      <div className="sc-name">{c.name}</div>
                      <div className="sc-rest">{c.rest}</div>
                      <div className="sc-meta">
                        <span>{c.time}</span>
                        <span>★ {c.rating}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}