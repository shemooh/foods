"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
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

const tags = [
  "All", "Popular", "New", "Trending", "Healthy",
  "Value", "Premium", "Local", "Dessert", "Lami kaayu"
];

export default function Browse() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTag, setActiveTag] = useState("All");
  const [selected, setSelected] = useState<FoodItem | null>(null);
  const [message, setMessage] = useState("");
  const [added, setAdded] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [nameError, setNameError] = useState(false);
  const [roomError, setRoomError] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    supabase
      .from("food_items")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error("Error fetching foods:", error);
        else setFoods(data || []);
        setLoading(false);
      });

    const savedName = localStorage.getItem("student_name");
    const savedRoom = localStorage.getItem("student_room");
    if (savedName) setStudentName(savedName);
    if (savedRoom) setRoomNumber(savedRoom);
  }, []);

  const filtered = activeTag === "All"
    ? foods
    : foods.filter(f => f.tag === activeTag);

  const handleOrder = () => {
    if (!selected) return;
    let hasError = false;
    if (!studentName.trim()) { setNameError(true); hasError = true; }
    if (!roomNumber.trim()) { setRoomError(true); hasError = true; }
    if (hasError) return;

    localStorage.setItem("student_name", studentName.trim());
    localStorage.setItem("student_room", roomNumber.trim());

    const note = [message, `Student: ${studentName.trim()}`, `Location: ${roomNumber.trim()}`]
      .filter(Boolean).join(" | ");

    addToCart(selected, note);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      setSelected(null);
      setMessage("");
    }, 1000);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        * { box-sizing: border-box; }

        .browse-root {
          padding-top: 64px;
          min-height: 100vh;
          background: #fafafa;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        /* ── Header ── */
        .browse-header {
          max-width: 1080px;
          margin: 0 auto;
          padding: 2rem 1.25rem 1rem;
        }
        .browse-title {
          font-size: 1.75rem; font-weight: 900; color: #000;
          letter-spacing: -0.04em; text-transform: uppercase; margin-bottom: 0.2rem;
        }
        /* sub was rgba(0,0,0,0.35) — now solid */
        .browse-sub { font-size: 0.8rem; font-weight: 500; color: #666; }

        /* ── Tag pills ── */
        .tags-row {
          display: flex; gap: 0.4rem; overflow-x: auto;
          padding: 0.75rem 1.25rem;
          max-width: 1080px; margin: 0 auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .tags-row::-webkit-scrollbar { display: none; }
        .tag-btn {
          flex-shrink: 0;
          background: #fff; border: 1px solid #ccc; border-radius: 2px;
          padding: 0.45rem 0.9rem;
          font-family: 'Inter', sans-serif; font-size: 0.68rem;
          font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase;
          /* was rgba(0,0,0,0.4) — now readable */
          color: #555;
          cursor: pointer; transition: all 0.15s;
          -webkit-tap-highlight-color: transparent;
          /* larger touch area */
          min-height: 36px;
        }
        .tag-btn:hover { border-color: #555; color: #000; }
        .tag-btn:active { background: #f0f0f0; }
        .tag-btn.active { background: #000; color: #fff; border-color: #000; }

        /* ── Grid ── */
        .grid {
          max-width: 1080px; margin: 0 auto;
          padding: 0.5rem 1.25rem 4rem;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 0.75rem;
        }

        .food-tile {
          background: #fff; border: 1px solid #ddd; border-radius: 6px;
          overflow: hidden; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s;
          -webkit-tap-highlight-color: transparent;
        }
        .food-tile:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
        .food-tile:active { transform: translateY(0); }
        .food-tile.active-tile { border-color: #000; box-shadow: 0 0 0 2px #000; }

        .tile-thumb {
          background: #f0f0f0;
          display: flex; align-items: center; justify-content: center;
          height: 110px; width: 100%; position: relative;
          border-bottom: 1px solid #e0e0e0;
        }
        .tile-emoji { font-size: 3.5rem; }

        .tile-body { padding: 0.85rem; }
        /* tag was rgba(0,0,0,0.3) — now readable */
        .tile-tag { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #777; margin-bottom: 0.3rem; }
        .tile-name { font-size: 0.84rem; font-weight: 700; color: #000; letter-spacing: -0.02em; margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        /* rest was rgba(0,0,0,0.28) — now readable */
        .tile-rest { font-size: 0.65rem; color: #666; margin-bottom: 0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tile-meta { display: flex; justify-content: space-between; align-items: center; }
        .tile-price { font-size: 0.84rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        /* time was rgba(0,0,0,0.28) — now readable */
        .tile-time { font-size: 0.62rem; color: #666; }

        .empty { text-align: center; padding: 4rem 1.5rem; font-size: 0.82rem; color: #666; grid-column: 1 / -1; }

        /* ── Modal overlay ── */
        .overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 200;
          display: flex;
          align-items: flex-end; /* bottom sheet on all sizes */
          justify-content: center;
        }

        /* Modal as a bottom sheet */
        .modal {
          background: #fff;
          border-radius: 16px 16px 0 0;
          width: 100%;
          max-width: 480px;
          padding: 0 1.5rem 1.5rem;
          border: 1px solid #e0e0e0;
          border-bottom: none;
          animation: slideUp 0.22s cubic-bezier(0.4,0,0.2,1);
          max-height: 92svh;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          /* safe area bottom */
          padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
        }
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }

        /* Pull handle */
        .modal-handle {
          width: 36px; height: 4px;
          background: #ccc; border-radius: 2px;
          margin: 12px auto 16px;
          flex-shrink: 0;
        }

        .modal-top {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 1rem;
        }
        .modal-emoji { font-size: 2.5rem; line-height: 1; }
        .modal-image { width: 72px; height: 72px; border-radius: 8px; object-fit: cover; }

        /* Close button — bigger tap target */
        .modal-close {
          width: 44px; height: 44px;
          display: flex; align-items: center; justify-content: center;
          background: #f0f0f0; border: none; border-radius: 50%;
          font-size: 0.9rem; cursor: pointer; color: #555;
          transition: background 0.15s;
          margin: -0.5rem -0.5rem 0 0;
          -webkit-tap-highlight-color: transparent;
        }
        .modal-close:hover { background: #e0e0e0; color: #000; }
        .modal-close:active { background: #d0d0d0; }

        .modal-name { font-size: 1.2rem; font-weight: 900; color: #000; letter-spacing: -0.035em; text-transform: uppercase; margin-bottom: 0.2rem; }
        /* was rgba(0,0,0,0.28) */
        .modal-rest { font-size: 0.65rem; font-weight: 600; color: #666; letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 0.85rem; }
        .modal-line { height: 1px; background: #e0e0e0; margin-bottom: 0.85rem; }
        /* desc was rgba(0,0,0,0.5) weight 300 — now readable */
        .modal-desc { font-size: 0.82rem; font-weight: 400; color: #444; line-height: 1.65; margin-bottom: 1rem; }
        .modal-meta { display: flex; gap: 1.5rem; margin-bottom: 1.25rem; }
        .modal-meta-val { font-size: 0.9rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        /* was rgba(0,0,0,0.28) */
        .modal-meta-label { font-size: 0.58rem; font-weight: 600; color: #666; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 0.1rem; }

        .section-divider { height: 1px; background: #e0e0e0; margin: 1rem 0; }
        /* was rgba(0,0,0,0.35) */
        .section-title { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #555; margin-bottom: 0.75rem; }

        /* Stack fields vertically on mobile for more breathing room */
        .field-row { display: flex; gap: 0.6rem; margin-bottom: 0.65rem; }
        .field-group { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; }
        /* was rgba(0,0,0,0.3) */
        .field-label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: #555; }
        .field-input {
          width: 100%; border: 1px solid #ccc; border-radius: 4px;
          padding: 0.75rem 0.8rem;
          font-family: 'Inter', sans-serif;
          /* 16px prevents iOS zoom */
          font-size: 16px;
          color: #111; background: #fff; outline: none;
          transition: border-color 0.15s;
          -webkit-appearance: none;
        }
        .field-input:focus { border-color: #111; }
        /* was rgba(0,0,0,0.22) — now clearly visible */
        .field-input::placeholder { color: #aaa; }
        .field-input.error { border-color: #cc0000; }
        .field-error { font-size: 0.6rem; color: #cc0000; font-weight: 600; }

        .saved-tag {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.25);
          border-radius: 2px; padding: 0.35rem 0.7rem;
          font-size: 0.62rem; font-weight: 700; letter-spacing: 0.07em;
          text-transform: uppercase; color: #16a34a; margin-bottom: 0.75rem;
        }
        .saved-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; }

        .note-label {
          font-size: 0.6rem; font-weight: 700; letter-spacing: 0.09em;
          text-transform: uppercase; color: #555;
          margin-bottom: 0.35rem; display: block;
        }
        .note-input {
          width: 100%; border: 1px solid #ccc; border-radius: 4px;
          padding: 0.75rem 0.8rem;
          font-family: 'Inter', sans-serif; font-size: 16px;
          color: #111; background: #fff; outline: none;
          transition: border-color 0.15s; margin-bottom: 1rem;
          -webkit-appearance: none;
        }
        .note-input:focus { border-color: #111; }
        .note-input::placeholder { color: #aaa; }

        /* Order button — taller for mobile */
        .order-full {
          width: 100%; border: none;
          padding: 1rem;
          font-family: 'Inter', sans-serif; font-size: 0.72rem;
          font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; border-radius: 6px; transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }
        .order-full.idle { background: #111; color: #fff; }
        .order-full.idle:hover { opacity: 0.8; }
        .order-full.idle:active { opacity: 0.6; }
        .order-full.success { background: #16a34a; color: #fff; cursor: default; }

        /* ── Responsive ── */

        /* 2-column grid on mobile */
        @media (max-width: 540px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
            padding: 0.5rem 1rem 4rem;
          }
          .browse-header { padding: 1.5rem 1rem 0.75rem; }
          .tags-row { padding: 0.75rem 1rem; }
          .tile-thumb { height: 95px; }
          .tile-body { padding: 0.7rem; }
          .tile-name { font-size: 0.78rem; }
        }

        /* Stack field row on very small phones */
        @media (max-width: 360px) {
          .field-row { flex-direction: column; }
          .tile-thumb { height: 80px; }
          .tile-emoji { font-size: 2.75rem; }
        }

        /* On larger screens, center the modal like before */
        @media (min-width: 641px) {
          .overlay { align-items: center; padding: 1rem; }
          .modal {
            border-radius: 10px;
            border: 1px solid #e0e0e0;
            max-height: 90vh;
            padding-bottom: 1.5rem;
          }
          .modal-handle { display: none; }
          .modal-close {
            background: none; border-radius: 0;
            width: auto; height: auto; padding: 0.25rem;
            font-size: 1rem; margin: 0;
          }
          .modal-close:hover { background: none; }
        }
      `}</style>

      <div className="browse-root">
        <div className="browse-header">
          <div className="browse-title">Browse</div>
          <div className="browse-sub">{filtered.length} items available</div>
        </div>

        <div className="tags-row">
          {tags.map(t => (
            <button
              key={t}
              className={`tag-btn${activeTag === t ? " active" : ""}`}
              onClick={() => setActiveTag(t)}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid">
          {loading && <div className="empty">Loading…</div>}
          {!loading && filtered.length === 0 && (
            <div className="empty">No items found. Add some from the Dashboard.</div>
          )}
          {filtered.map(food => (
            <div
              key={food.id}
              className={`food-tile${selected?.id === food.id ? " active-tile" : ""}`}
              onClick={() => {
                setSelected(food);
                setMessage("");
                setAdded(false);
                setNameError(false);
                setRoomError(false);
              }}
            >
              <div className="tile-thumb">
                {food.image_url ? (
                  <Image
                    src={food.image_url}
                    alt={food.name}
                    width={110} height={110}
                    className="object-cover w-full h-full"
                    priority={false}
                  />
                ) : (
                  <span className="tile-emoji">{food.emoji}</span>
                )}
              </div>
              <div className="tile-body">
                <div className="tile-tag">{food.tag}</div>
                <div className="tile-name">{food.name}</div>
                <div className="tile-rest">{food.rest}</div>
                <div className="tile-meta">
                  <span className="tile-price">{food.price}</span>
                  <span className="tile-time">{food.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {/* Pull handle — visible on mobile */}
            <div className="modal-handle" />

            <div className="modal-top">
              {selected.image_url ? (
                <Image src={selected.image_url} alt={selected.name} width={72} height={72} className="modal-image" />
              ) : (
                <span className="modal-emoji">{selected.emoji}</span>
              )}
              <button className="modal-close" onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>

            <div className="modal-name">{selected.name}</div>
            <div className="modal-rest">{selected.rest}</div>
            <div className="modal-line" />
            <div className="modal-desc">{selected.description}</div>

            <div className="modal-meta">
              <div>
                <div className="modal-meta-val">{selected.price}</div>
                <div className="modal-meta-label">Price</div>
              </div>
              <div>
                <div className="modal-meta-val">{selected.time}</div>
                <div className="modal-meta-label">Delivery</div>
              </div>
              <div>
                <div className="modal-meta-val">★ {selected.rating}</div>
                <div className="modal-meta-label">Rating</div>
              </div>
            </div>

            <div className="section-divider" />
            <div className="section-title">Delivery Details</div>

            {studentName && roomNumber && !nameError && !roomError && (
              <div className="saved-tag">
                <span className="saved-dot" />
                {studentName} · {roomNumber}
              </div>
            )}

            <div className="field-row">
              <div className="field-group">
                <label className="field-label">Your Name</label>
                <input
                  className={`field-input${nameError ? " error" : ""}`}
                  placeholder="Juan dela Cruz"
                  value={studentName}
                  onChange={e => { setStudentName(e.target.value); setNameError(false); }}
                />
                {nameError && <span className="field-error">Required</span>}
              </div>
              <div className="field-group">
                <label className="field-label">Room / Location</label>
                <input
                  className={`field-input${roomError ? " error" : ""}`}
                  placeholder="e.g. Room 201"
                  value={roomNumber}
                  onChange={e => { setRoomNumber(e.target.value); setRoomError(false); }}
                />
                {roomError && <span className="field-error">Required</span>}
              </div>
            </div>

            <div className="section-divider" />

            <label className="note-label">Note to restaurant</label>
            <input
              className="note-input"
              placeholder="e.g. No onions, extra spicy…"
              value={message}
              onChange={e => setMessage(e.target.value)}
            />

            <button
              className={`order-full${added ? " success" : " idle"}`}
              onClick={handleOrder}
              disabled={added}
            >
              {added ? "✓ Added to Cart!" : `Order for ${selected.price}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}