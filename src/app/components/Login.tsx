"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Login() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");

    if (tab === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) { setError(error.message); setLoading(false); return; }
      setDone(true);
      setLoading(false);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); return; }
      setDone(true);
      setTimeout(() => router.push("/"), 600);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          min-height: 100vh;
          background: #fafafa;
          font-family: 'Inter', -apple-system, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }

        .login-card {
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 6px;
          width: 100%;
          max-width: 360px;
          padding: 2.25rem;
        }

        .login-logo {
          font-size: 1rem;
          font-weight: 700;
          color: #000;
          letter-spacing: -0.02em;
          text-transform: uppercase;
          margin-bottom: 1.75rem;
          display: block;
        }

        .login-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #000;
          letter-spacing: -0.04em;
          text-transform: uppercase;
          line-height: 1;
          margin-bottom: 0.35rem;
        }

        .login-sub {
          font-size: 0.75rem;
          font-weight: 300;
          color: rgba(0,0,0,0.4);
          margin-bottom: 1.75rem;
        }

        .tabs {
          display: flex;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1.25rem;
        }

        .tab {
          flex: 1;
          background: transparent;
          border: none;
          padding: 0.55rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.68rem;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: rgba(0,0,0,0.3);
          cursor: pointer;
          transition: all 0.15s;
        }

        .tab.active { background: #000; color: #fff; }

        .field { margin-bottom: 0.75rem; }

        .field-label {
          font-size: 0.6rem;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: rgba(0,0,0,0.3);
          margin-bottom: 0.4rem;
          display: block;
        }

        .field-input {
          width: 100%;
          border: 1px solid rgba(0,0,0,0.09);
          border-radius: 4px;
          padding: 0.7rem 0.85rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.82rem;
          color: #000;
          background: #fafafa;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
        }

        .field-input:focus { border-color: rgba(0,0,0,0.3); background: #fff; }
        .field-input::placeholder { color: rgba(0,0,0,0.2); }

        .error-msg {
          font-size: 0.7rem;
          color: #cc0000;
          background: rgba(204,0,0,0.05);
          border: 1px solid rgba(204,0,0,0.12);
          border-radius: 4px;
          padding: 0.6rem 0.8rem;
          margin-bottom: 0.75rem;
        }

        .success-msg {
          font-size: 0.7rem;
          color: #1a7a1a;
          background: rgba(26,122,26,0.05);
          border: 1px solid rgba(26,122,26,0.12);
          border-radius: 4px;
          padding: 0.6rem 0.8rem;
          margin-bottom: 0.75rem;
        }

        .submit-btn {
          width: 100%;
          background: #000;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 0.8rem;
          font-family: 'Inter', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.75rem;
        }

        .submit-btn:hover { opacity: 0.75; }
        .submit-btn:disabled { opacity: 0.4; cursor: default; }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .login-footer {
          margin-top: 1.25rem;
          font-size: 0.68rem;
          color: rgba(0,0,0,0.3);
          text-align: center;
          line-height: 1.7;
        }

        .login-footer a {
          color: #000;
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
        }

        .login-footer a:hover { text-decoration: underline; }
      `}</style>

      <div className="login-root">
        <div className="login-card">
          <span className="login-logo">🔥 dashbite</span>

          <div className="login-title">{tab === "login" ? "Welcome back." : "Join us."}</div>
          <div className="login-sub">{tab === "login" ? "Sign in to place your order." : "Create an account to get started."}</div>

          <div className="tabs">
            <button className={`tab${tab === "login" ? " active" : ""}`} onClick={() => { setTab("login"); setError(""); setDone(false); }}>Login</button>
            <button className={`tab${tab === "signup" ? " active" : ""}`} onClick={() => { setTab("signup"); setError(""); setDone(false); }}>Sign Up</button>
          </div>

          {error && <div className="error-msg">⚠ {error}</div>}
          {done && tab === "signup" && <div className="success-msg">✓ Check your email to confirm your account.</div>}
          {done && tab === "login" && <div className="success-msg">✓ Signed in! Redirecting…</div>}

          {tab === "signup" && (
            <div className="field">
              <label className="field-label">Full Name</label>
              <input className="field-input" placeholder="Juan dela Cruz" value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          <div className="field">
            <label className="field-label">Email</label>
            <input className="field-input" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <input className="field-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <button className="submit-btn" onClick={handleSubmit} disabled={loading || (done && tab === "signup")}>
            {loading ? <span className="spinner" /> : tab === "login" ? "Sign In" : "Create Account"}
          </button>

          <div className="login-footer">
            {tab === "login"
              ? <>No account? <a onClick={() => { setTab("signup"); setError(""); setDone(false); }}>Sign up</a></>
              : <>Already have an account? <a onClick={() => { setTab("login"); setError(""); setDone(false); }}>Sign in</a></>
            }
          </div>
        </div>
      </div>
    </>
  );
}