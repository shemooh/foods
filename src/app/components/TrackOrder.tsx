"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Order = {
  id: string;
  admin_id?: string;
  order_number: number;
  food_name: string;
  food_emoji: string;
  restaurant: string;
  price: string;
  status: "pending" | "preparing" | "ready" | "delivered";
  note: string | null;
  user_email: string | null;
  created_at: string;
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "#f97316", bg: "rgba(249,115,22,0.08)", step: 1 },
  preparing: { label: "Preparing", color: "#eab308", bg: "rgba(234,179,8,0.08)", step: 2 },
  ready: { label: "Ready! 🎉", color: "#16a34a", bg: "rgba(22,163,74,0.08)", step: 3 },
  delivered: { label: "Delivered", color: "#6b7280", bg: "rgba(107,114,128,0.08)", step: 4 },
} as const;

export default function TrackOrder() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .not("status", "eq", "delivered")
      .order("created_at", { ascending: true })
      .limit(10);

    if (error) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setOrders((data as Order[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  const activeCount = orders.length;
  const fillPct = Math.min((activeCount / 10) * 100, 100);
  const isFull = activeCount >= 10;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        * { box-sizing: border-box; }
        .track-root { padding-top: 64px; min-height: 100vh; background: #fafafa; font-family: 'Inter', -apple-system, sans-serif; }
        .track-inner { max-width: 680px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem; }
        .track-title { font-size: 1.75rem; font-weight: 900; color: #000; letter-spacing: -0.04em; text-transform: uppercase; margin-bottom: 0.25rem; }
        .track-sub { font-size: 0.78rem; font-weight: 300; color: rgba(0,0,0,0.35); margin-bottom: 1rem; }
        .live-pill { display: inline-flex; align-items: center; gap: 0.4rem; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 2px; padding: 0.3rem 0.7rem; font-size: 0.62rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(0,0,0,0.4); margin-bottom: 1.75rem; }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #16a34a; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .queue-bar { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; padding: 1.1rem 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1.25rem; }
        .queue-info { flex-shrink: 0; }
        .queue-label { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(0,0,0,0.3); margin-bottom: 0.2rem; }
        .queue-count { font-size: 1.6rem; font-weight: 900; color: #000; letter-spacing: -0.04em; line-height: 1; }
        .queue-max { font-size: 0.6rem; color: rgba(0,0,0,0.25); font-weight: 300; }
        .queue-track { flex: 1; }
        .queue-fill-bg { height: 6px; background: rgba(0,0,0,0.07); border-radius: 3px; overflow: hidden; margin-bottom: 0.4rem; }
        .queue-fill-bar { height: 100%; border-radius: 3px; transition: width 0.5s ease, background 0.3s; }
        .queue-slots { display: flex; gap: 3px; }
        .queue-slot { flex: 1; height: 3px; border-radius: 2px; background: rgba(0,0,0,0.07); transition: background 0.3s; }
        .queue-slot.filled { background: #000; }
        .queue-full-msg { font-size: 0.62rem; font-weight: 600; color: #cc0000; letter-spacing: 0.06em; text-transform: uppercase; margin-top: 0.4rem; }
        .track-empty { text-align: center; padding: 5rem 0; }
        .track-empty-icon { font-size: 3rem; filter: grayscale(1); margin-bottom: 1rem; }
        .track-empty-text { font-size: 0.82rem; color: rgba(0,0,0,0.3); font-weight: 300; }
        .track-loading { text-align: center; padding: 4rem 0; font-size: 0.82rem; color: rgba(0,0,0,0.3); }
        .order-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; padding: 1.25rem; margin-bottom: 0.65rem; transition: box-shadow 0.15s, transform 0.15s; animation: fadeSlide 0.3s ease; }
        @keyframes fadeSlide { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .order-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
        .order-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 1rem; }
        .order-left { display: flex; align-items: center; gap: 0.85rem; }
        .order-emoji { font-size: 2rem; filter: grayscale(1); line-height: 1; }
        .order-num { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(0,0,0,0.28); margin-bottom: 0.2rem; }
        .order-name { font-size: 0.92rem; font-weight: 700; color: #000; letter-spacing: -0.02em; margin-bottom: 0.15rem; }
        .order-rest { font-size: 0.62rem; color: rgba(0,0,0,0.3); text-transform: uppercase; letter-spacing: 0.06em; }
        .order-status { display: flex; align-items: center; gap: 0.35rem; padding: 0.3rem 0.65rem; border-radius: 2px; font-size: 0.62rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; white-space: nowrap; }
        .order-progress { display: flex; gap: 3px; margin-bottom: 0.85rem; }
        .progress-step { flex: 1; height: 3px; border-radius: 2px; background: rgba(0,0,0,0.08); transition: background 0.4s; }
        .progress-step.done { background: #000; }
        .order-bottom { display: flex; justify-content: space-between; align-items: center; }
        .order-meta { display: flex; gap: 1.25rem; }
        .order-meta-val { font-size: 0.78rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        .order-meta-label { font-size: 0.55rem; font-weight: 500; color: rgba(0,0,0,0.28); letter-spacing: 0.07em; text-transform: uppercase; margin-top: 0.1rem; }
        .order-time { font-size: 0.62rem; color: rgba(0,0,0,0.25); }
        .order-note { font-size: 0.65rem; color: rgba(0,0,0,0.35); font-style: italic; margin-top: 0.65rem; padding-top: 0.65rem; border-top: 1px solid rgba(0,0,0,0.06); }
      `}</style>

      <div className="track-root">
        <div className="track-inner">
          <div className="track-title">Track Orders</div>
          <div className="track-sub">Live campus order queue — updates in real time.</div>

          <div className="live-pill">
            <span className="live-dot" />
            Live · Campus Queue · Max 10 active orders
          </div>

          {!loading && (
            <div className="queue-bar">
              <div className="queue-info">
                <div className="queue-label">Active Orders</div>
                <div className="queue-count">
                  {activeCount}
                  <span style={{ fontSize: "1rem", color: "rgba(0,0,0,0.2)", fontWeight: 300 }}>/10</span>
                </div>
                <div className="queue-max">{10 - activeCount} slot{10 - activeCount !== 1 ? "s" : ""} remaining</div>
              </div>
              <div className="queue-track">
                <div className="queue-fill-bg">
                  <div
                    className="queue-fill-bar"
                    style={{
                      width: `${fillPct}%`,
                      background: isFull ? "#cc0000" : activeCount >= 7 ? "#f97316" : "#000",
                    }}
                  />
                </div>
                <div className="queue-slots">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className={`queue-slot${i < activeCount ? " filled" : ""}`} />
                  ))}
                </div>
                {isFull && <div className="queue-full-msg">⚠ Queue full — please wait</div>}
              </div>
            </div>
          )}

          {loading && <div className="track-loading">Loading orders…</div>}

          {!loading && orders.length === 0 && (
            <div className="track-empty">
              <div className="track-empty-icon">🍽️</div>
              <div className="track-empty-text">No active orders right now. Place one!</div>
            </div>
          )}

          {orders.map((order) => {
            const s = STATUS_CONFIG[order.status];
            return (
              <div key={order.id} className="order-card">
                <div className="order-top">
                  <div className="order-left">
                    <span className="order-emoji">{order.food_emoji || "🍴"}</span>
                    <div>
                      <div className="order-num">Order #{order.order_number}</div>
                      <div className="order-name">{order.food_name}</div>
                      <div className="order-rest">{order.restaurant}</div>
                    </div>
                  </div>
                  <div className="order-status" style={{ color: s.color, background: s.bg }}>
                    {s.label}
                  </div>
                </div>

                <div className="order-progress">
                  {[1, 2, 3, 4].map((step) => (
                    <div key={step} className={`progress-step${s.step >= step ? " done" : ""}`} />
                  ))}
                </div>

                <div className="order-bottom">
                  <div className="order-meta">
                    <div>
                      <div className="order-meta-val">{order.price}</div>
                      <div className="order-meta-label">Price</div>
                    </div>
                    {order.user_email && (
                      <div>
                        <div className="order-meta-val">{order.user_email.split("@")[0]}</div>
                        <div className="order-meta-label">Student</div>
                      </div>
                    )}
                  </div>
                  <div className="order-time">{timeAgo(order.created_at)}</div>
                </div>

                {order.note && <div className="order-note">📝 "{order.note}"</div>}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}