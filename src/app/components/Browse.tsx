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

        .browse-root { padding-top: 64px; min-height: 100vh; background: #fafafa; font-family: 'Inter', -apple-system, sans-serif; }

        .browse-header { max-width: 1080px; margin: 0 auto; padding: 2.5rem 1.5rem 1.25rem; }
        .browse-title { font-size: 1.75rem; font-weight: 900; color: #000; letter-spacing: -0.04em; text-transform: uppercase; margin-bottom: 0.25rem; }
        .browse-sub { font-size: 0.78rem; font-weight: 300; color: rgba(0,0,0,0.35); letter-spacing: 0.02em; }

        .tags-row { display: flex; gap: 0.4rem; overflow-x: auto; padding: 1rem 1.5rem; max-width: 1080px; margin: 0 auto; scrollbar-width: none; }
        .tags-row::-webkit-scrollbar { display: none; }
        .tag-btn { flex-shrink: 0; background: #fff; border: 1px solid rgba(0,0,0,0.09); border-radius: 2px; padding: 0.4rem 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.68rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(0,0,0,0.4); cursor: pointer; transition: all 0.15s; }
        .tag-btn:hover { border-color: rgba(0,0,0,0.25); color: #000; }
        .tag-btn.active { background: #000; color: #fff; border-color: #000; }

        .grid { max-width: 1080px; margin: 0 auto; padding: 0 1.5rem 4rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.75rem; }
        .food-tile { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; overflow: hidden; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
        .food-tile:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .food-tile.active-tile { border-color: #000; box-shadow: 0 0 0 2px #000; }
        .tile-thumb { background: #f5f5f5; display: flex; align-items: center; justify-content: center; height: 110px; width: 100%; position: relative; border-bottom: 1px solid rgba(0,0,0,0.06); }
        .tile-emoji { font-size: 3.5rem; filter: grayscale(1); }
        .tile-body { padding: 0.85rem; }
        .tile-tag { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(0,0,0,0.3); margin-bottom: 0.3rem; }
        .tile-name { font-size: 0.82rem; font-weight: 700; color: #000; letter-spacing: -0.02em; margin-bottom: 0.15rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tile-rest { font-size: 0.62rem; color: rgba(0,0,0,0.28); margin-bottom: 0.65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .tile-meta { display: flex; justify-content: space-between; align-items: center; }
        .tile-price { font-size: 0.82rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        .tile-time { font-size: 0.6rem; color: rgba(0,0,0,0.28); }
        .empty { text-align: center; padding: 4rem 1.5rem; font-size: 0.82rem; color: rgba(0,0,0,0.3); grid-column: 1 / -1; }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; display: flex; align-items: flex-end; justify-content: center; padding: 1rem; }
        .modal { background: #fff; border-radius: 8px; width: 100%; max-width: 400px; padding: 1.75rem; border: 1px solid rgba(0,0,0,0.08); animation: slideUp 0.2s cubic-bezier(0.4,0,0.2,1); max-height: 92vh; overflow-y: auto; }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

        .modal-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; }
        .modal-emoji { font-size: 2.5rem; line-height: 1; }
        .modal-image { width: 80px; height: 80px; border-radius: 8px; object-fit: cover; }
        .modal-close { background: none; border: none; font-size: 1rem; cursor: pointer; color: rgba(0,0,0,0.3); padding: 0; line-height: 1; }
        .modal-close:hover { color: #000; }
        .modal-name { font-size: 1.25rem; font-weight: 900; color: #000; letter-spacing: -0.035em; text-transform: uppercase; margin-bottom: 0.2rem; }
        .modal-rest { font-size: 0.62rem; font-weight: 500; color: rgba(0,0,0,0.28); letter-spacing: 0.07em; text-transform: uppercase; margin-bottom: 0.85rem; }
        .modal-line { height: 1px; background: rgba(0,0,0,0.07); margin-bottom: 0.85rem; }
        .modal-desc { font-size: 0.78rem; font-weight: 300; color: rgba(0,0,0,0.5); line-height: 1.65; margin-bottom: 1rem; }
        .modal-meta { display: flex; gap: 1.5rem; margin-bottom: 1.25rem; }
        .modal-meta-val { font-size: 0.88rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        .modal-meta-label { font-size: 0.55rem; font-weight: 500; color: rgba(0,0,0,0.28); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 0.1rem; }

        .section-divider { height: 1px; background: rgba(0,0,0,0.07); margin: 1rem 0; }
        .section-title { font-size: 0.62rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(0,0,0,0.35); margin-bottom: 0.75rem; }

        .field-row { display: flex; gap: 0.6rem; margin-bottom: 0.65rem; }
        .field-group { flex: 1; display: flex; flex-direction: column; gap: 0.35rem; }
        .field-label { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(0,0,0,0.3); }
        .field-input { width: 100%; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; padding: 0.62rem 0.8rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #000; background: #fff; outline: none; transition: border-color 0.15s; }
        .field-input:focus { border-color: #000; }
        .field-input::placeholder { color: rgba(0,0,0,0.22); }
        .field-input.error { border-color: #cc0000; }
        .field-error { font-size: 0.58rem; color: #cc0000; }

        .saved-tag { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(22,163,74,0.07); border: 1px solid rgba(22,163,74,0.2); border-radius: 2px; padding: 0.3rem 0.65rem; font-size: 0.6rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: #16a34a; margin-bottom: 0.75rem; }
        .saved-dot { width: 5px; height: 5px; border-radius: 50%; background: #16a34a; }

        .note-label { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(0,0,0,0.3); margin-bottom: 0.35rem; display: block; }
        .note-input { width: 100%; border: 1px solid rgba(0,0,0,0.1); border-radius: 4px; padding: 0.62rem 0.8rem; font-family: 'Inter', sans-serif; font-size: 0.78rem; color: #000; background: #fff; outline: none; transition: border-color 0.15s; margin-bottom: 0.85rem; box-sizing: border-box; }
        .note-input:focus { border-color: #000; }
        .note-input::placeholder { color: rgba(0,0,0,0.22); }

        .order-full { width: 100%; border: none; padding: 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; border-radius: 4px; transition: all 0.2s; }
        .order-full.idle { background: #000; color: #fff; }
        .order-full.idle:hover { opacity: 0.75; }
        .order-full.success { background: #16a34a; color: #fff; cursor: default; }

        @media (max-width: 480px) { .grid { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; } }
      `}</style>

      <div className="browse-root">
        <div className="browse-header">
          <div className="browse-title">Browse</div>
          <div className="browse-sub">{filtered.length} items available</div>
        </div>

        <div className="tags-row">
          {tags.map(t => (
            <button key={t} className={`tag-btn${activeTag === t ? " active" : ""}`} onClick={() => setActiveTag(t)}>
              {t}
            </button>
          ))}
        </div>

        <div className="grid">
          {loading && <div className="empty">Loading…</div>}
          {!loading && filtered.length === 0 && <div className="empty">No items found. Add some from the Dashboard.</div>}
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
                  <Image src={food.image_url} alt={food.name} width={110} height={110} className="object-cover w-full h-full" priority={false} />
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
            <div className="modal-top">
              {selected.image_url ? (
                <Image src={selected.image_url} alt={selected.name} width={80} height={80} className="modal-image" />
              ) : (
                <span className="modal-emoji">{selected.emoji}</span>
              )}
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
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