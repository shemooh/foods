"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useAdmin } from "../lib/useAdmin";
import Image from "next/image";

type FoodItem = {
  id?: string;
  emoji: string;
  name: string;
  rest: string;
  description: string;
  price: string;
  time: string;
  rating: string;
  tag: string;
  image_url?: string;
};

type Order = {
  id: string;
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

const emptyForm: FoodItem = { emoji: "🍕", name: "", rest: "", description: "", price: "", time: "", rating: "", tag: "Popular", image_url: "" };
const tags = ["Popular", "New", "Trending", "Healthy", "Value", "Premium", "Local", "Dessert", "Lami kaayu"];
const emojis = ["🍕","🍔","🍜","🌮","🍣","🍛","🥗","🍱","🥩","🍝","🌯","🧆","🍗","🥟","🍲","🧁","🥪","🍦"];
const STATUSES = ["pending", "preparing", "ready", "delivered"] as const;
const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "#f97316", bg: "rgba(249,115,22,0.08)"  },
  preparing: { label: "Preparing", color: "#eab308", bg: "rgba(234,179,8,0.08)"   },
  ready:     { label: "Ready",     color: "#16a34a", bg: "rgba(22,163,74,0.08)"   },
  delivered: { label: "Delivered", color: "#6b7280", bg: "rgba(107,114,128,0.08)" },
};

export default function Dashboard() {
  const router = useRouter();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const fileRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<"menu" | "orders">("orders");

  // Food items state
  const [items, setItems] = useState<FoodItem[]>([]);
  const [form, setForm] = useState<FoodItem>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState<"all" | Order["status"]>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [clearMsg, setClearMsg] = useState("");

  useEffect(() => {
    if (!adminLoading && !isAdmin) router.push("/");
  }, [isAdmin, adminLoading]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchItems();
    fetchOrders();

    const channel = supabase
      .channel("dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => fetchOrders())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  const fetchItems = async () => {
    setLoadingItems(true);
    const { data } = await supabase.from("food_items").select("*").order("created_at", { ascending: false });
    setItems(data || []);
    setLoadingItems(false);
  };

  const fetchOrders = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
    setLoadingOrders(false);
  };

  // Food item handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("food-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
    if (uploadError) { setMsg("⚠ Upload failed: " + uploadError.message); setUploading(false); return; }
    const { data } = supabase.storage.from("food-images").getPublicUrl(fileName);
    setForm(f => ({ ...f, image_url: data.publicUrl }));
    setUploading(false);
  };

  const handleRemoveImage = () => {
    setPreview("");
    setForm(f => ({ ...f, image_url: "" }));
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.name || !form.rest || !form.description || !form.price || !form.time || !form.rating) {
      setMsg("⚠ Please fill in all fields."); return;
    }
    setSaving(true); setMsg("");
    if (editId) {
      const { error } = await supabase.from("food_items").update(form).eq("id", editId);
      if (error) { setMsg("⚠ " + error.message); setSaving(false); return; }
      setMsg("✓ Updated!");
    } else {
      const { error } = await supabase.from("food_items").insert([form]);
      if (error) { setMsg("⚠ " + error.message); setSaving(false); return; }
      setMsg("✓ Added!");
    }
    setSaving(false); setForm(emptyForm); setEditId(null); setPreview("");
    fetchItems();
    setTimeout(() => setMsg(""), 2000);
  };

  const handleEdit = (item: FoodItem) => {
    setForm({ emoji: item.emoji, name: item.name, rest: item.rest, description: item.description, price: item.price, time: item.time, rating: item.rating, tag: item.tag, image_url: item.image_url || "" });
    setEditId(item.id!);
    setPreview(item.image_url || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await supabase.from("food_items").delete().eq("id", id);
    setDeleting(null);
    fetchItems();
  };

  const handleCancel = () => { setForm(emptyForm); setEditId(null); setMsg(""); setPreview(""); };

  // Order handlers — auto-delete all when every order is delivered
  const updateStatus = async (id: string, status: Order["status"]) => {
    setUpdating(id);
    await supabase.from("orders").update({ status }).eq("id", id);

    // Re-fetch fresh list after update
    const { data: fresh } = await supabase.from("orders").select("*");
    const freshOrders: Order[] = fresh || [];

    // If every order is now delivered, delete them all
    if (freshOrders.length > 0 && freshOrders.every(o => o.status === "delivered")) {
      const ids = freshOrders.map(o => o.id);
      await supabase.from("orders").delete().in("id", ids);
      setOrders([]);
      setClearMsg("✓ All orders delivered! Order list has been cleared.");
      setTimeout(() => setClearMsg(""), 4000);
    } else {
      setOrders(freshOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    }

    setUpdating(null);
  };

  const deleteOrder = async (id: string) => {
    setUpdating(id);
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) {
      setOrders(prev => prev.filter(o => o.id !== id));
    } else {
      console.error("Delete failed:", error.message);
      setClearMsg("⚠ Delete failed: " + error.message);
      setTimeout(() => setClearMsg(""), 4000);
    }
    setUpdating(null);
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const counts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    preparing: orders.filter(o => o.status === "preparing").length,
    ready: orders.filter(o => o.status === "ready").length,
    delivered: orders.filter(o => o.status === "delivered").length,
  };

  const timeAgo = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  if (adminLoading) return (
    <div style={{ paddingTop: 64, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif", fontSize: "1rem", color: "rgba(0,0,0,0.4)" }}>
      Checking access…
    </div>
  );

  if (!isAdmin) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');
        * { box-sizing: border-box; }
        .db-root { padding-top: 72px; min-height: 100vh; background: #fafafa; font-family: 'Inter', -apple-system, sans-serif; }
        .db-header { max-width: 1080px; margin: 0 auto; padding: 2.5rem 1.5rem 0; }
        .db-title { font-size: 1.65rem; font-weight: 900; color: #000; letter-spacing: -0.04em; text-transform: uppercase; margin-bottom: 0.3rem; }
        .db-sub { font-size: 0.88rem; font-weight: 400; color: rgba(0,0,0,0.45); margin-bottom: 1.5rem; }

        .db-tabs { display: flex; gap: 0; border-bottom: 1px solid rgba(0,0,0,0.08); max-width: 1080px; margin: 0 auto; padding: 0 1.5rem; }
        .db-tab { background: none; border: none; border-bottom: 2px solid transparent; padding: 0.85rem 1.4rem; font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(0,0,0,0.4); cursor: pointer; transition: all 0.15s; margin-bottom: -1px; }
        .db-tab:hover { color: #000; }
        .db-tab.active { color: #000; border-bottom-color: #f97316; }
        .db-tab-badge { background: #f97316; color: #fff; border-radius: 2px; padding: 0.12rem 0.4rem; font-size: 0.65rem; font-weight: 700; margin-left: 0.4rem; }

        .db-body { max-width: 1080px; margin: 0 auto; padding: 2rem 1.5rem; }

        /* ── ORDERS TAB ── */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 1.75rem; }
        .stat-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 1.1rem; }
        .stat-val { font-size: 2rem; font-weight: 900; color: #000; letter-spacing: -0.04em; line-height: 1; margin-bottom: 0.3rem; }
        .stat-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
        .live-pill { display: inline-flex; align-items: center; gap: 0.45rem; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 2px; padding: 0.35rem 0.8rem; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(0,0,0,0.45); margin-bottom: 1.5rem; }
        .live-dot { width: 7px; height: 7px; border-radius: 50%; background: #16a34a; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

        .clear-banner { background: rgba(22,163,74,0.08); border: 1px solid rgba(22,163,74,0.25); border-radius: 6px; padding: 0.85rem 1.1rem; font-size: 0.85rem; font-weight: 600; color: #15803d; margin-bottom: 1.25rem; }

        .filter-row { display: flex; gap: 0.45rem; margin-bottom: 1.35rem; overflow-x: auto; scrollbar-width: none; }
        .filter-row::-webkit-scrollbar { display: none; }
        .filter-btn { flex-shrink: 0; background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 2px; padding: 0.45rem 0.95rem; font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(0,0,0,0.45); cursor: pointer; transition: all 0.15s; }
        .filter-btn:hover { border-color: rgba(0,0,0,0.3); color: #000; }
        .filter-btn.active { background: #000; color: #fff; border-color: #000; }

        .order-row { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 1.2rem 1.4rem; margin-bottom: 0.65rem; display: flex; align-items: center; gap: 1.1rem; transition: box-shadow 0.15s; }
        .order-row:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
        .or-emoji { font-size: 2rem; filter: grayscale(1); flex-shrink: 0; line-height: 1; }
        .or-info { flex: 1; min-width: 0; }
        .or-num { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(0,0,0,0.35); margin-bottom: 0.2rem; }
        .or-name { font-size: 1rem; font-weight: 700; color: #000; letter-spacing: -0.02em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .or-rest { font-size: 0.72rem; color: rgba(0,0,0,0.4); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 0.15rem; }
        .or-email { font-size: 0.72rem; color: rgba(0,0,0,0.4); margin-top: 0.2rem; }
        .or-note { font-size: 0.75rem; color: rgba(0,0,0,0.45); font-style: italic; margin-top: 0.35rem; }
        .or-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; flex-shrink: 0; }
        .or-price { font-size: 0.95rem; font-weight: 700; color: #000; letter-spacing: -0.02em; }
        .or-time { font-size: 0.72rem; color: rgba(0,0,0,0.35); }
        .status-select { border: 1.5px solid rgba(0,0,0,0.12); border-radius: 5px; padding: 0.45rem 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; cursor: pointer; outline: none; transition: border-color 0.15s; background: #fff; flex-shrink: 0; }
        .status-select:focus { border-color: #000; }
        .status-select:disabled { opacity: 0.4; cursor: default; }
        .or-delete-btn { flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; background: rgba(204,0,0,0.07); border: 1px solid rgba(204,0,0,0.22); color: #cc0000; font-size: 0.75rem; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
        .or-delete-btn:hover { background: #cc0000; color: #fff; border-color: #cc0000; }
        .or-delete-btn:disabled { opacity: 0.4; cursor: default; }
        .dash-empty { text-align: center; padding: 3rem 0; font-size: 0.95rem; color: rgba(0,0,0,0.35); }

        /* ── MENU TAB ── */
        .menu-body { display: grid; grid-template-columns: 380px 1fr; gap: 2rem; align-items: start; }
        .db-form { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 1.5rem; position: sticky; top: 80px; }
        .db-form-title { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(0,0,0,0.35); margin-bottom: 1.25rem; }
        .f-row { margin-bottom: 0.75rem; }
        .f-label { font-size: 0.7rem; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(0,0,0,0.4); margin-bottom: 0.35rem; display: block; }
        .f-input { width: 100%; border: 1px solid rgba(0,0,0,0.1); border-radius: 5px; padding: 0.65rem 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.88rem; color: #000; background: #fafafa; outline: none; transition: border-color 0.15s; }
        .f-input:focus { border-color: #f97316; background: #fff; }
        .f-input::placeholder { color: rgba(0,0,0,0.22); }
        .f-textarea { resize: vertical; min-height: 70px; line-height: 1.5; }
        .f-select { appearance: none; cursor: pointer; }
        .img-upload-area { border: 1.5px dashed rgba(0,0,0,0.12); border-radius: 6px; padding: 1rem; text-align: center; cursor: pointer; transition: border-color 0.15s, background 0.15s; background: #fafafa; position: relative; }
        .img-upload-area:hover { border-color: #f97316; background: rgba(249,115,22,0.02); }
        .img-upload-area input { display: none; }
        .img-preview { position: relative; width: 100%; height: 140px; border-radius: 4px; overflow: hidden; margin-bottom: 0.5rem; }
        .img-placeholder { display: flex; flex-direction: column; align-items: center; gap: 0.4rem; padding: 1rem 0; }
        .img-placeholder-icon { font-size: 1.75rem; opacity: 0.3; }
        .img-placeholder-text { font-size: 0.78rem; color: rgba(0,0,0,0.35); }
        .img-placeholder-sub { font-size: 0.7rem; color: rgba(0,0,0,0.25); }
        .img-remove { position: absolute; top: 0.4rem; right: 0.4rem; background: rgba(0,0,0,0.55); color: #fff; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 0.65rem; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; transition: background 0.15s; }
        .img-remove:hover { background: #cc0000; }
        .img-uploading { font-size: 0.78rem; color: #f97316; text-align: center; padding: 0.35rem 0; }
        .img-or { display: flex; align-items: center; gap: 0.5rem; margin: 0.65rem 0; }
        .img-or::before, .img-or::after { content: ''; flex: 1; height: 1px; background: rgba(0,0,0,0.07); }
        .img-or span { font-size: 0.68rem; color: rgba(0,0,0,0.25); letter-spacing: 0.06em; text-transform: uppercase; }
        .emoji-grid { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.35rem; }
        .emoji-btn { width: 34px; height: 34px; background: #fafafa; border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; cursor: pointer; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; transition: all 0.1s; }
        .emoji-btn:hover { background: #f0f0f0; }
        .emoji-btn.selected { border-color: #f97316; background: rgba(249,115,22,0.08); }
        .f-two { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
        .f-msg { font-size: 0.8rem; padding: 0.55rem 0.8rem; border-radius: 4px; margin-bottom: 0.65rem; font-weight: 500; }
        .f-msg.error { color: #cc0000; background: rgba(204,0,0,0.05); border: 1px solid rgba(204,0,0,0.12); }
        .f-msg.success { color: #1a7a1a; background: rgba(26,122,26,0.05); border: 1px solid rgba(26,122,26,0.12); }
        .f-btns { display: flex; gap: 0.5rem; margin-top: 1rem; }
        .f-save { flex: 1; background: #f97316; color: #fff; border: none; border-radius: 5px; padding: 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; }
        .f-save:hover { opacity: 0.85; }
        .f-save:disabled { opacity: 0.4; cursor: default; }
        .f-cancel { background: none; border: 1px solid rgba(0,0,0,0.12); border-radius: 5px; padding: 0.75rem 1rem; font-family: 'Inter', sans-serif; font-size: 0.75rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(0,0,0,0.45); cursor: pointer; transition: all 0.15s; }
        .f-cancel:hover { border-color: #000; color: #000; }
        .db-list { display: flex; flex-direction: column; gap: 0.55rem; }
        .db-empty { font-size: 0.88rem; color: rgba(0,0,0,0.35); padding: 2rem; text-align: center; background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 8px; }
        .item-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 1rem; transition: box-shadow 0.15s; }
        .item-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .item-thumb { width: 54px; height: 54px; border-radius: 7px; overflow: hidden; flex-shrink: 0; background: #f5f5f5; display: flex; align-items: center; justify-content: center; font-size: 1.85rem; position: relative; }
        .item-info { flex: 1; min-width: 0; }
        .item-name { font-size: 0.95rem; font-weight: 700; color: #000; letter-spacing: -0.02em; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-rest { font-size: 0.75rem; color: rgba(0,0,0,0.4); margin-top: 0.15rem; }
        .item-meta { display: flex; gap: 0.6rem; margin-top: 0.4rem; flex-wrap: wrap; }
        .item-pill { font-size: 0.68rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(0,0,0,0.45); background: #f3f3f3; padding: 0.22rem 0.55rem; border-radius: 3px; }
        .item-actions { display: flex; gap: 0.45rem; flex-shrink: 0; }
        .btn-edit { background: none; border: 1px solid rgba(0,0,0,0.12); border-radius: 4px; padding: 0.45rem 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(0,0,0,0.5); cursor: pointer; transition: all 0.15s; }
        .btn-edit:hover { border-color: #000; color: #000; }
        .btn-del { background: none; border: 1px solid rgba(204,0,0,0.18); border-radius: 4px; padding: 0.45rem 0.85rem; font-family: 'Inter', sans-serif; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(204,0,0,0.55); cursor: pointer; transition: all 0.15s; }
        .btn-del:hover { border-color: #cc0000; color: #cc0000; }
        .btn-del:disabled { opacity: 0.4; cursor: default; }
        .db-count { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(0,0,0,0.3); margin-bottom: 0.85rem; }

        @media (max-width: 780px) {
          .menu-body { grid-template-columns: 1fr; }
          .db-form { position: static; }
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .order-row { flex-wrap: wrap; }
        }
      `}</style>

      <div className="db-root">
        <div className="db-header">
          <div className="db-title">⚡ Canteen Dashboard</div>
          <div className="db-sub">Manage orders and food items for the campus canteen.</div>
        </div>

        <div className="db-tabs">
          <button className={`db-tab${activeTab === "orders" ? " active" : ""}`} onClick={() => setActiveTab("orders")}>
            Orders
            {counts.pending > 0 && <span className="db-tab-badge">{counts.pending}</span>}
          </button>
          <button className={`db-tab${activeTab === "menu" ? " active" : ""}`} onClick={() => setActiveTab("menu")}>
            Menu Items
            <span className="db-tab-badge" style={{ background: "rgba(0,0,0,0.15)" }}>{items.length}</span>
          </button>
        </div>

        <div className="db-body">

          {/* ── ORDERS TAB ── */}
          {activeTab === "orders" && (
            <>
              <div className="live-pill">
                <span className="live-dot" />
                Live updates enabled
              </div>

              <div className="stats-row">
                <div className="stat-card">
                  <div className="stat-val">{counts.pending}</div>
                  <div className="stat-label" style={{ color: "#f97316" }}>Pending</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{counts.preparing}</div>
                  <div className="stat-label" style={{ color: "#eab308" }}>Preparing</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{counts.ready}</div>
                  <div className="stat-label" style={{ color: "#16a34a" }}>Ready</div>
                </div>
                <div className="stat-card">
                  <div className="stat-val">{counts.delivered}</div>
                  <div className="stat-label" style={{ color: "#6b7280" }}>Delivered</div>
                </div>
              </div>

              {clearMsg && <div className="clear-banner">{clearMsg}</div>}

              <div className="filter-row">
                {(["all", ...STATUSES] as const).map(s => (
                  <button key={s} className={`filter-btn${filter === s ? " active" : ""}`} onClick={() => setFilter(s)}>
                    {s === "all" ? `All (${counts.all})` : `${STATUS_CONFIG[s].label} (${counts[s]})`}
                  </button>
                ))}
              </div>

              {loadingOrders && <div className="dash-empty">Loading orders…</div>}
              {!loadingOrders && filtered.length === 0 && (
                <div className="dash-empty">
                  {orders.length === 0 ? "No orders yet. All clear! 🎉" : "No orders matching this filter."}
                </div>
              )}

              {filtered.map(order => {
                const s = STATUS_CONFIG[order.status];
                return (
                  <div key={order.id} className="order-row">
                    <span className="or-emoji">{order.food_emoji || "🍴"}</span>
                    <div className="or-info">
                      <div className="or-num">Order #{order.order_number}</div>
                      <div className="or-name">{order.food_name}</div>
                      <div className="or-rest">{order.restaurant}</div>
                      {order.user_email && <div className="or-email">👤 {order.user_email}</div>}
                      {order.note && <div className="or-note">📝 "{order.note}"</div>}
                    </div>
                    <div className="or-meta">
                      <span className="or-price">{order.price}</span>
                      <span className="or-time">{timeAgo(order.created_at)}</span>
                    </div>
                    <select
                      className="status-select"
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={e => updateStatus(order.id, e.target.value as Order["status"])}
                      style={{ color: s.color, borderColor: s.color }}
                    >
                      {STATUSES.map(st => (
                        <option key={st} value={st}>{STATUS_CONFIG[st].label}</option>
                      ))}
                    </select>
                    {order.status === "delivered" && (
                      <button
                        className="or-delete-btn"
                        disabled={updating === order.id}
                        onClick={() => deleteOrder(order.id)}
                        title="Remove this order"
                      >
                        {updating === order.id ? "…" : "✕"}
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* ── MENU TAB ── */}
          {activeTab === "menu" && (
            <div className="menu-body">
              <div className="db-form">
                <div className="db-form-title">{editId ? "✏ Edit Item" : "+ New Food Item"}</div>
                {msg && <div className={`f-msg ${msg.startsWith("⚠") ? "error" : "success"}`}>{msg}</div>}

                <div className="f-row">
                  <label className="f-label">Photo</label>
                  <div className="img-upload-area" onClick={() => !uploading && fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} />
                    {uploading && <div className="img-uploading">⏳ Uploading…</div>}
                    {!uploading && preview ? (
                      <div className="img-preview">
                        <Image src={preview} alt="preview" fill style={{ objectFit: "cover" }} />
                        <button className="img-remove" onClick={e => { e.stopPropagation(); handleRemoveImage(); }}>✕</button>
                      </div>
                    ) : !uploading && (
                      <div className="img-placeholder">
                        <div className="img-placeholder-icon">📷</div>
                        <div className="img-placeholder-text">Click to upload a photo</div>
                        <div className="img-placeholder-sub">JPG, PNG, WEBP — max 5MB</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="img-or"><span>or use an emoji</span></div>
                <div className="f-row">
                  <div className="emoji-grid">
                    {emojis.map(e => (
                      <button key={e} className={`emoji-btn${form.emoji === e ? " selected" : ""}`} onClick={() => setForm(f => ({ ...f, emoji: e }))}>{e}</button>
                    ))}
                  </div>
                </div>

                <div className="f-row">
                  <label className="f-label">Food Name</label>
                  <input className="f-input" placeholder="e.g. Margherita Pizza" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="f-row">
                  <label className="f-label">Restaurant / Canteen</label>
                  <input className="f-input" placeholder="e.g. TCC Main Canteen" value={form.rest} onChange={e => setForm(f => ({ ...f, rest: e.target.value }))} />
                </div>
                <div className="f-row">
                  <label className="f-label">Description</label>
                  <textarea className="f-input f-textarea" placeholder="Describe the dish..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="f-two">
                  <div className="f-row">
                    <label className="f-label">Price</label>
                    <input className="f-input" placeholder="₱220" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  </div>
                  <div className="f-row">
                    <label className="f-label">Delivery Time</label>
                    <input className="f-input" placeholder="20 min" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                  </div>
                </div>
                <div className="f-two">
                  <div className="f-row">
                    <label className="f-label">Rating</label>
                    <input className="f-input" placeholder="4.8" value={form.rating} onChange={e => setForm(f => ({ ...f, rating: e.target.value }))} />
                  </div>
                  <div className="f-row">
                    <label className="f-label">Tags</label>
                    <select className="f-input f-select" value={form.tag} onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}>
                      {tags.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="f-btns">
                  <button className="f-save" onClick={handleSave} disabled={saving || uploading}>
                    {saving ? "Saving…" : editId ? "Update Item" : "Add Item"}
                  </button>
                  {editId && <button className="f-cancel" onClick={handleCancel}>Cancel</button>}
                </div>
              </div>

              <div>
                <div className="db-count">{items.length} item{items.length !== 1 ? "s" : ""}</div>
                <div className="db-list">
                  {loadingItems && <div className="db-empty">Loading…</div>}
                  {!loadingItems && items.length === 0 && <div className="db-empty">No food items yet. Add your first one →</div>}
                  {items.map(item => (
                    <div key={item.id} className="item-card">
                      <div className="item-thumb">
                        {item.image_url
                          ? <Image src={item.image_url} alt={item.name} fill style={{ objectFit: "cover" }} />
                          : item.emoji
                        }
                      </div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-rest">{item.rest}</div>
                        <div className="item-meta">
                          <span className="item-pill">{item.price}</span>
                          <span className="item-pill">{item.time}</span>
                          <span className="item-pill">★ {item.rating}</span>
                          <span className="item-pill">{item.tag}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button className="btn-edit" onClick={() => handleEdit(item)}>Edit</button>
                        <button className="btn-del" disabled={deleting === item.id} onClick={() => handleDelete(item.id!)}>
                          {deleting === item.id ? "…" : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}