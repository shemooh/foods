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

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

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
        pos -= 0.4;
        const half = el.scrollWidth / 3;
        if (Math.abs(pos) >= half) pos = 0;
        el.style.transform = `translateX(${pos}px)`;
      }
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    const pause = () => (paused = true);
    const resume = () => (paused = false);

    el.addEventListener("mouseenter", pause);
    el.addEventListener("mouseleave", resume);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("touchend", resume, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("mouseenter", pause);
      el.removeEventListener("mouseleave", resume);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("touchend", resume);
    };
  }, [cards]);

  const handleOrder = () => {
    if (!food) return;
    addToCart(food, note);
    setAdded(true);
    setNote("");
    setTimeout(() => setAdded(false), 1200);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
      if (dx < 0) setCurrent(c => Math.min(cards.length - 1, c + 1));
      else setCurrent(c => Math.max(0, c - 1));
    }
    touchStartX.current = null;
    touchStartY.current = null;
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
          padding: 3rem 1.25rem 1.5rem;
          display: flex;
          gap: 3rem;
          align-items: center;
        }

        .deck { width: 100%; max-width: 320px; flex-shrink: 0; }
        .stack { position: relative; margin-bottom: 1.25rem; }
        .shadow-card {
          position: absolute;
          background: #ddd;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 6px;
        }
        .s1 { inset: 8px -6px -8px 6px; }
        .s2 { inset: 4px -3px -4px 3px; background: #e8e8e8; }

        .card {
          position: relative;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.12);
          border-radius: 6px;
          padding: 1.6rem;
          z-index: 2;
          max-height: calc(100svh - 280px);
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 1.1rem;
        }
        .card-image { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
        .card-emoji { font-size: 2.75rem; line-height: 1; }

        .card-tag {
          font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: #555;
          border: 1px solid #bbb; padding: 0.25rem 0.55rem; border-radius: 2px;
        }

        .card-name { font-size: 1.3rem; font-weight: 800; color: #000; letter-spacing: -0.035em; line-height: 1.1; margin-bottom: 0.2rem; }
        .card-rest { font-size: 0.65rem; font-weight: 600; color: #555; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 0.9rem; }
        .card-line { height: 1px; background: #e0e0e0; margin-bottom: 0.9rem; }
        .card-desc { font-size: 0.82rem; font-weight: 400; color: #444; line-height: 1.65; margin-bottom: 1.1rem; }
        .card-meta { display: flex; gap: 1.25rem; margin-bottom: 1.25rem; }
        .meta-val { font-size: 0.9rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        .meta-label { font-size: 0.6rem; font-weight: 600; color: #666; letter-spacing: 0.07em; text-transform: uppercase; margin-top: 0.1rem; }

        .note-wrap {
          display: flex;
          border: 1px solid #ccc;
          border-radius: 4px;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .note-wrap:focus-within { border-color: #555; }
        .note-input {
          flex: 1; border: none; outline: none; background: #f7f7f7;
          font-family: 'Inter', sans-serif; color: #111;
          padding: 0.65rem 0.8rem;
          font-size: max(0.8rem, 16px);
        }
        .note-input::placeholder { color: #999; }

        .bottom-nav { display: flex; align-items: center; gap: 0.5rem; margin-top: 1.1rem; }
        .nav-arrow {
          width: 44px; height: 44px;
          background: #fff; border: 1px solid #ccc; border-radius: 4px;
          cursor: pointer; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center;
          transition: background 0.15s; flex-shrink: 0; color: #111;
          -webkit-tap-highlight-color: transparent;
        }
        .nav-arrow:hover { background: #f0f0f0; }
        .nav-arrow:active { background: #e8e8e8; }
        .nav-arrow:disabled { opacity: 0.25; cursor: default; }

        .order-btn {
          flex: 1; height: 44px;
          border: none; font-family: 'Inter', sans-serif;
          font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; cursor: pointer; border-radius: 4px;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .order-btn.idle { background: #111; color: #fff; }
        .order-btn.idle:hover { opacity: 0.8; }
        .order-btn.idle:active { opacity: 0.6; }
        .order-btn.success { background: #16a34a; color: #fff; cursor: default; }

        .dots { display: flex; justify-content: center; gap: 0.4rem; margin-top: 1.25rem; flex-wrap: wrap; }
        .dot {
          width: 8px; height: 8px;
          border-radius: 50%; background: #bbb;
          transition: background 0.2s, transform 0.2s; cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .dot.active { background: #111; transform: scale(1.2); }

        .hero-copy { flex: 1; }
        .hero-label { font-size: 0.65rem; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #666; margin-bottom: 1rem; }
        .hero-title {
          font-size: clamp(2.4rem, 7vw, 4rem);
          font-weight: 900; color: #000; letter-spacing: -0.04em;
          line-height: 0.95; text-transform: uppercase; margin-bottom: 1rem;
        }
        .hero-sub { font-size: 0.88rem; font-weight: 400; color: #444; line-height: 1.7; max-width: 320px; }

        .cards-outer {
          overflow: hidden;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
          padding: 0.5rem 0;
          margin-top: 2rem;
        }
        .cards-track { display: flex; gap: 1px; will-change: transform; }
        .scroll-card {
          flex-shrink: 0; width: 160px;
          background: #fff; border-right: 1px solid #e8e8e8;
          padding: 1rem; cursor: pointer; transition: background 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .scroll-card:hover { background: #f5f5f5; }
        .scroll-card:active { background: #efefef; }
        .sc-image { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; margin-bottom: 0.5rem; display: block; }
        .sc-emoji { font-size: 1.8rem; display: block; margin-bottom: 0.5rem; }
        .sc-name { font-size: 0.75rem; font-weight: 700; color: #111; letter-spacing: -0.02em; text-transform: uppercase; margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sc-rest { font-size: 0.62rem; color: #666; margin-bottom: 0.5rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sc-meta { display: flex; justify-content: space-between; font-size: 0.62rem; color: #666; }

        .swipe-hint {
          display: none;
          text-align: center;
          font-size: 0.62rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #888;
          margin-top: 0.5rem;
        }

        .hero-empty { text-align: center; padding: 4rem 1.5rem; font-size: 0.82rem; color: #666; }

        @media (max-width: 860px) {
          .hero-body { gap: 2rem; padding: 2.5rem 1.25rem 1.5rem; }
          .deck { max-width: 300px; }
        }

        @media (max-width: 640px) {
          .hero-body {
            flex-direction: column;
            align-items: stretch;
            padding: 1.5rem 1rem 1rem;
            gap: 1.5rem;
          }
          .hero-copy { order: -1; }
          .hero-title { font-size: clamp(2rem, 11vw, 3rem); }
          .hero-sub { max-width: 100%; font-size: 0.84rem; }
          .deck { max-width: 100%; }
          .card { padding: 1.25rem; max-height: none; overflow-y: visible; }
          .card-name { font-size: 1.15rem; }
          .card-desc { font-size: 0.8rem; }
          .note-input { padding: 0.75rem 0.8rem; font-size: 16px; }
          .swipe-hint { display: block; }
          .scroll-card { width: 140px; padding: 0.75rem; }
          .sc-name { font-size: 0.7rem; }
        }

        @media (max-width: 380px) {
          .hero-body { padding: 1.25rem 0.875rem 0.875rem; }
          .card { padding: 1rem; }
          .card-name { font-size: 1.05rem; }
          .card-meta { gap: 0.9rem; }
          .meta-val { font-size: 0.82rem; }
          .scroll-card { width: 128px; }
        }

        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .hero { padding-bottom: env(safe-area-inset-bottom); }
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
                <div
                  className="stack"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
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

                <div className="swipe-hint">← swipe to browse →</div>

                <div className="bottom-nav">
                  <button
                    className="nav-arrow"
                    onClick={() => setCurrent(c => Math.max(0, c - 1))}
                    disabled={current === 0}
                    aria-label="Previous item"
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
                    aria-label="Next item"
                  >
                    →
                  </button>
                </div>

                <div className="dots" role="tablist" aria-label="Food items">
                  {cards.map((_, i) => (
                    <div
                      key={i}
                      role="tab"
                      aria-selected={i === current}
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
                  TCC Canteen at your fingertips. Hot and fresh, under 30 minutes. THIS SITE OPENS ONLY AT 11-12NN ON SCHOOL DAYS.
                </div>
              </div>
            </div>

            {track.length > 0 && (
              <div className="cards-outer">
                <div ref={rowRef} className="cards-track">
                  {track.map((c, i) => (
                    <div
                      key={i}
                      className="scroll-card"
                      onClick={() => {
                        const idx = cards.indexOf(c);
                        if (idx !== -1) setCurrent(idx);
                      }}
                    >
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