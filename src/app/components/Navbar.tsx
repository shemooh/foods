"use client";

import { useCart } from "../lib/cartContext";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import CartDrawer from "./CartDrawer";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export default function Navbar() {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { count: cartCount } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) setShowLogin(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const reset = () => { setEmail(""); setPassword(""); setName(""); setError(""); setDone(false); };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  const handleSubmit = async () => {
    setError("");
    if (!email || !password) { setError("Please fill in all fields."); return; }
    if (!isValidEmail(email)) { setError("Please enter a valid email address."); return; }
    if (tab === "signup" && !name.trim()) { setError("Please enter your full name."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);

    if (tab === "signup") {
      const { error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { data: { full_name: name.trim() } },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setDone(true); setLoading(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) { setError(error.message); setLoading(false); return; }
      setDone(true); setLoading(false);
      setTimeout(() => { setShowLogin(false); reset(); router.push("/"); }, 800);
    }
  };

  const displayName = user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Account";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        .nb-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; background: rgba(255,255,255,0.85); backdrop-filter: saturate(180%) blur(20px); -webkit-backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid rgba(0,0,0,0.08); font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
        .nb-inner { max-width: 1080px; margin: 0 auto; padding: 0 1.5rem; height: 72px; display: flex; align-items: center; gap: 2rem; }
        .nb-logo { text-decoration: none; flex-shrink: 0; display: flex; align-items: center; }
        .nb-links { display: flex; align-items: center; gap: 0.1rem; flex: 1; }
        .nb-link { text-decoration: none; font-size: 0.78rem; font-weight: 400; color: #1d1d1f; padding: 0.35rem 0.7rem; border-radius: 6px; letter-spacing: -0.01em; transition: background 0.15s; white-space: nowrap; }
        .nb-link:hover { background: rgba(0,0,0,0.05); }
        .nb-link-dashboard { text-decoration: none; font-size: 0.72rem; font-weight: 700; color: #fff; background: #f97316; padding: 0.35rem 0.8rem; border-radius: 6px; letter-spacing: 0.06em; text-transform: uppercase; transition: opacity 0.15s; white-space: nowrap; }
        .nb-link-dashboard:hover { opacity: 0.85; }
        .nb-actions { display: flex; align-items: center; gap: 0.75rem; margin-left: auto; }
        .nb-cart-btn { background: none; border: none; cursor: pointer; font-size: 0.78rem; font-weight: 400; color: #1d1d1f; letter-spacing: -0.01em; display: flex; align-items: center; gap: 0.3rem; transition: opacity 0.15s; padding: 0; position: relative; }
        .nb-cart-btn:hover { opacity: 0.6; }
        .nb-badge { background: #f97316; color: #fff; border-radius: 50%; width: 16px; height: 16px; font-size: 0.6rem; font-weight: 600; display: flex; align-items: center; justify-content: center; }
        .nb-badge-bump { animation: bump 0.3s cubic-bezier(0.36,0.07,0.19,0.97); }
        @keyframes bump { 0%,100% { transform: scale(1); } 50% { transform: scale(1.4); } }
        .nb-cta { background: #f97316; color: #fff; border: none; font-family: 'Inter', sans-serif; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 0.45rem 1rem; border-radius: 2px; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
        .nb-cta:hover { opacity: 0.85; }
        .nb-user { display: flex; align-items: center; gap: 0.5rem; }
        .nb-username { font-size: 0.75rem; font-weight: 500; color: #1d1d1f; letter-spacing: -0.01em; }
        .nb-logout { background: none; border: 1px solid rgba(0,0,0,0.1); font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.07em; text-transform: uppercase; color: rgba(0,0,0,0.4); padding: 0.35rem 0.7rem; border-radius: 2px; cursor: pointer; transition: all 0.15s; }
        .nb-logout:hover { border-color: #000; color: #000; }
        .nb-toggle { display: none; background: none; border: none; cursor: pointer; color: #1d1d1f; font-size: 1rem; padding: 0.25rem; margin-left: auto; }
        .nb-mobile { background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); border-top: 1px solid rgba(0,0,0,0.08); padding: 0.5rem 1.5rem 1rem; display: flex; flex-direction: column; }
        .nb-mobile-link { text-decoration: none; font-size: 0.9rem; font-weight: 400; color: #1d1d1f; letter-spacing: -0.01em; padding: 0.75rem 0; border-bottom: 1px solid rgba(0,0,0,0.06); font-family: 'Inter', -apple-system, sans-serif; background: none; border-left: none; border-right: none; border-top: none; cursor: pointer; text-align: left; width: 100%; }
        .nb-mobile-cart { display: flex; justify-content: space-between; align-items: center; }
        .nb-mobile-cart-badge { background: #f97316; color: #fff; border-radius: 2px; padding: 0.1rem 0.4rem; font-size: 0.6rem; font-weight: 700; }

        @media (max-width: 720px) { .nb-links { display: none; } .nb-actions { display: none; } .nb-toggle { display: block; } }

        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.3); backdrop-filter: blur(6px); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 1rem; animation: fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .modal { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 6px; width: 100%; max-width: 340px; padding: 2rem; position: relative; animation: slideUp 0.2s cubic-bezier(0.4,0,0.2,1); }
        @keyframes slideUp { from { transform: translateY(14px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-x { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 0.9rem; cursor: pointer; color: rgba(0,0,0,0.3); transition: color 0.15s; }
        .modal-x:hover { color: #000; }
        .modal-logo { margin-bottom: 1.25rem; display: block; }
        .modal-title { font-size: 1.3rem; font-weight: 900; color: #000; letter-spacing: -0.04em; text-transform: uppercase; line-height: 1; margin-bottom: 0.25rem; }
        .modal-sub { font-size: 0.72rem; font-weight: 300; color: rgba(0,0,0,0.4); margin-bottom: 1.5rem; }
        .m-tabs { display: flex; border: 1px solid rgba(0,0,0,0.08); border-radius: 4px; overflow: hidden; margin-bottom: 1.25rem; }
        .m-tab { flex: 1; background: transparent; border: none; padding: 0.5rem; font-family: 'Inter', sans-serif; font-size: 0.65rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(0,0,0,0.3); cursor: pointer; transition: all 0.15s; }
        .m-tab.active { background: #f97316; color: #fff; }
        .m-field { margin-bottom: 0.65rem; }
        .m-label { font-size: 0.58rem; font-weight: 600; letter-spacing: 0.09em; text-transform: uppercase; color: rgba(0,0,0,0.28); margin-bottom: 0.35rem; display: block; }
        .m-input { width: 100%; border: 1px solid rgba(0,0,0,0.09); border-radius: 4px; padding: 0.65rem 0.8rem; font-family: 'Inter', sans-serif; font-size: 0.8rem; color: #000; background: #fafafa; outline: none; transition: border-color 0.15s, background 0.15s; box-sizing: border-box; }
        .m-input:focus { border-color: #f97316; background: #fff; }
        .m-input::placeholder { color: rgba(0,0,0,0.18); }
        .m-input.invalid { border-color: #cc0000; background: rgba(204,0,0,0.02); }
        .m-hint { font-size: 0.6rem; color: #cc0000; margin-top: 0.3rem; }
        .m-error { font-size: 0.68rem; color: #cc0000; background: rgba(204,0,0,0.05); border: 1px solid rgba(204,0,0,0.1); border-radius: 4px; padding: 0.55rem 0.75rem; margin-bottom: 0.65rem; }
        .m-success { font-size: 0.68rem; color: #1a7a1a; background: rgba(26,122,26,0.05); border: 1px solid rgba(26,122,26,0.1); border-radius: 4px; padding: 0.55rem 0.75rem; margin-bottom: 0.65rem; }
        .m-submit { width: 100%; background: #f97316; color: #fff; border: none; border-radius: 4px; padding: 0.75rem; font-family: 'Inter', sans-serif; font-size: 0.68rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: opacity 0.15s; display: flex; align-items: center; justify-content: center; margin-top: 0.75rem; }
        .m-submit:hover { opacity: 0.85; }
        .m-submit:disabled { opacity: 0.4; cursor: default; }
        .spinner { width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .m-footer { margin-top: 1rem; font-size: 0.65rem; color: rgba(0,0,0,0.3); text-align: center; line-height: 1.7; }
        .m-footer a { color: #f97316; font-weight: 500; text-decoration: none; cursor: pointer; }
        .m-footer a:hover { text-decoration: underline; }
      `}</style>

      <nav className="nb-nav">
        <div className="nb-inner">
          <Link href="/" className="nb-logo">
            <Image src="/logo.png" alt="TCCBite" width={150} height={70} style={{ objectFit: "contain" }} priority />
          </Link>

          <div className="nb-links">
            <Link href="/" className="nb-link">Home</Link>
            <Link href="/browse" className="nb-link">Browse</Link>
            <Link href="/track" className="nb-link">Track Order</Link>
            {user && <Link href="/dashboard" className="nb-link-dashboard">⚡ Dashboard</Link>}
          </div>

          <div className="nb-actions">
            <button className="nb-cart-btn" onClick={() => setCartOpen(true)}>
              🛒
              {cartCount > 0 && (
                <span key={cartCount} className="nb-badge nb-badge-bump">{cartCount}</span>
              )}
            </button>
            {user ? (
              <div className="nb-user">
                <span className="nb-username">👤 {displayName}</span>
                <button className="nb-logout" onClick={handleLogout}>Log out</button>
              </div>
            ) : (
              <button className="nb-cta" onClick={() => { setShowLogin(true); reset(); }}>Order Now</button>
            )}
          </div>

          <button className="nb-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>

        {mobileOpen && (
          <div className="nb-mobile">
            <Link href="/" className="nb-mobile-link" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link href="/browse" className="nb-mobile-link" onClick={() => setMobileOpen(false)}>Browse</Link>
            <Link href="/track" className="nb-mobile-link" onClick={() => setMobileOpen(false)}>Track Order</Link>
            {user && <Link href="/dashboard" className="nb-mobile-link" onClick={() => setMobileOpen(false)}>⚡ Dashboard</Link>}
            <button
              className="nb-mobile-link nb-mobile-cart"
              onClick={() => { setCartOpen(true); setMobileOpen(false); }}
            >
              <span>🛒 Cart</span>
              {cartCount > 0 && <span className="nb-mobile-cart-badge">{cartCount}</span>}
            </button>
            {user
              ? <button className="nb-mobile-link" onClick={handleLogout}>Log out ({displayName})</button>
              : <button className="nb-mobile-link" onClick={() => { setShowLogin(true); setMobileOpen(false); reset(); }}>Order Now</button>
            }
          </div>
        )}
      </nav>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {showLogin && (
        <div className="overlay" onClick={() => setShowLogin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-x" onClick={() => setShowLogin(false)}>✕</button>
            <span className="modal-logo">
              <Image src="/logo.png" alt="TCCBite" width={90} height={26} style={{ objectFit: "contain" }} />
            </span>
            <div className="modal-title">Welcome.</div>
            <div className="modal-sub">{tab === "login" ? "Sign in to place your order." : "Create an account to get started."}</div>
            <div className="m-tabs">
              <button className={`m-tab${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setError(""); setDone(false); }}>Login</button>
              <button className={`m-tab${tab === "signup" ? " active" : ""}`} onClick={() => { setTab("signup"); setError(""); setDone(false); }}>Sign Up</button>
            </div>
            {error && <div className="m-error">⚠ {error}</div>}
            {done && tab === "signup" && <div className="m-success">✓ Check your email to confirm your account.</div>}
            {done && tab === "login" && <div className="m-success">✓ Signed in! Redirecting…</div>}
            {tab === "signup" && (
              <div className="m-field">
                <label className="m-label">Full Name</label>
                <input className={`m-input${tab === "signup" && name === "" && error ? " invalid" : ""}`} placeholder="Juan dela Cruz" value={name} onChange={e => setName(e.target.value)} />
              </div>
            )}
            <div className="m-field">
              <label className="m-label">Email</label>
              <input className={`m-input${email && !isValidEmail(email) ? " invalid" : ""}`} type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              {email && !isValidEmail(email) && <div className="m-hint">Enter a valid email (e.g. name@domain.com)</div>}
            </div>
            <div className="m-field">
              <label className="m-label">Password</label>
              <input className={`m-input${password && password.length < 6 ? " invalid" : ""}`} type="password" placeholder="Min. 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
              {password && password.length < 6 && <div className="m-hint">Password must be at least 6 characters</div>}
            </div>
            <button className="m-submit" onClick={handleSubmit} disabled={loading || (done && tab === "signup")}>
              {loading ? <span className="spinner" /> : tab === "login" ? "Sign In" : "Create Account"}
            </button>
            <div className="m-footer">
              {tab === "login"
                ? <>No account? <a onClick={() => { setTab("signup"); setError(""); setDone(false); }}>Sign up</a></>
                : <>Already have an account? <a onClick={() => { setTab("login"); setError(""); setDone(false); }}>Sign in</a></>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}