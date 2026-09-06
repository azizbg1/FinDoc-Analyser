import { useState } from "react";
import { Eye, EyeOff, AlertCircle, FileText, ShieldCheck, MessageSquare, BarChart3 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

/* ── Éléments décoratifs flottants dans le fond violet ── */
function BackgroundDecor() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>

      {/* Grands cercles flous */}
      <div style={{ position: "absolute", width: 320, height: 320, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.12)", top: -60, left: -80 }} />
      <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.08)", top: -20, left: -30 }} />
      <div style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.10)", bottom: -100, right: -100 }} />
      <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)", bottom: -60, right: -40 }} />

      {/* Cercles remplis subtils */}
      <div style={{ position: "absolute", width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.06)", top: "12%", left: "8%" }} />
      <div style={{ position: "absolute", width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.08)", top: "18%", right: "10%" }} />
      <div style={{ position: "absolute", width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.05)", bottom: "15%", left: "6%" }} />
      <div style={{ position: "absolute", width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.07)", bottom: "22%", right: "8%" }} />

      {/* Petits points */}
      {[
        { top: "22%",  left: "15%"  }, { top: "35%",  left: "6%"   },
        { top: "60%",  left: "12%"  }, { top: "72%",  left: "22%"  },
        { top: "20%",  right: "18%" }, { top: "40%",  right: "7%"  },
        { top: "65%",  right: "15%" }, { top: "80%",  right: "24%" },
        { top: "8%",   left: "40%"  }, { bottom: "8%", right: "40%" },
      ].map((pos, i) => (
        <motion.div key={i}
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
          style={{ position: "absolute", width: 5, height: 5, borderRadius: "50%", background: "rgba(255,255,255,0.55)", ...pos }} />
      ))}

      {/* Lignes diagonales subtiles */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.10 }}>
        <line x1="0"    y1="30%"  x2="18%"  y2="0"    stroke="white" strokeWidth="1" />
        <line x1="0"    y1="70%"  x2="14%"  y2="100%" stroke="white" strokeWidth="1" />
        <line x1="100%" y1="25%"  x2="82%"  y2="0"    stroke="white" strokeWidth="1" />
        <line x1="100%" y1="75%"  x2="86%"  y2="100%" stroke="white" strokeWidth="1" />
      </svg>

      {/* Mini cartes flottantes gauche */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute", left: "6%", top: "30%",
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 9,
        }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.20)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <FileText size={14} color="white" />
        </div>
        <div>
          <div style={{ width: 70, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.50)", marginBottom: 4 }} />
          <div style={{ width: 50, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.28)" }} />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 7, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        style={{
          position: "absolute", left: "5%", top: "54%",
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 9,
        }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ShieldCheck size={14} color="white" />
        </div>
        <div>
          <div style={{ width: 80, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.45)", marginBottom: 4 }} />
          <div style={{ width: 55, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.25)" }} />
        </div>
      </motion.div>

      {/* Mini cartes flottantes droite */}
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
        style={{
          position: "absolute", right: "5%", top: "28%",
          background: "rgba(255,255,255,0.11)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.20)",
          borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 9,
        }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MessageSquare size={14} color="white" />
        </div>
        <div>
          <div style={{ width: 65, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.48)", marginBottom: 4 }} />
          <div style={{ width: 45, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.26)" }} />
        </div>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
        style={{
          position: "absolute", right: "5%", top: "54%",
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 12, padding: "10px 14px",
          display: "flex", alignItems: "center", gap: 9,
        }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <BarChart3 size={14} color="white" />
        </div>
        <div>
          <div style={{ width: 72, height: 7, borderRadius: 4, background: "rgba(255,255,255,0.44)", marginBottom: 4 }} />
          <div style={{ width: 48, height: 5, borderRadius: 4, background: "rgba(255,255,255,0.24)" }} />
        </div>
      </motion.div>

      {/* Branding top-center */}
      <div style={{ position: "absolute", top: 28, left: "50%", transform: "translateX(-50%)", textAlign: "center" }}>
        <p style={{ color: "rgba(255,255,255,0.90)", fontWeight: 800, fontSize: 15, letterSpacing: "0.02em", margin: 0 }}>
          FinDoc Analyzer
        </p>
        <p style={{ color: "rgba(255,255,255,0.50)", fontSize: 11, marginTop: 3, fontWeight: 500 }}>
          AI-Powered Financial Analysis
        </p>
      </div>

      {/* Footer bottom-center */}
      <p style={{ position: "absolute", bottom: 18, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.35)", fontSize: 11, whiteSpace: "nowrap" }}>
        © 2025 FinDoc Analyzer. All rights reserved.
      </p>
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.detail || "Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #B48EF5 0%, #9B6FEF 35%, #7C3AED 100%)",
        padding: "24px",
        fontFamily: "Inter, system-ui, sans-serif",
      }}>

      <BackgroundDecor />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          position: "relative",
          zIndex: 1,
          background: "#FFFFFF",
          borderRadius: 24,
          padding: "56px 52px 48px",
          width: "100%",
          maxWidth: 500,
          boxShadow: "0 20px 60px rgba(91,30,200,0.22), 0 4px 16px rgba(0,0,0,0.08)",
        }}>

        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
          <div style={{
            width: 56, height: 56,
            borderRadius: "50%",
            background: "linear-gradient(145deg, #9B6FEF, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(124,58,237,0.35)",
          }}>
            {/* Document + magnifier SVG logo */}
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="4" y="3" width="15" height="19" rx="2.5" fill="white" fillOpacity="0.25" stroke="white" strokeWidth="1.5"/>
              <line x1="7.5" y1="8.5"  x2="15.5" y2="8.5"  stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="7.5" y1="12"   x2="13.5" y2="12"   stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              <line x1="7.5" y1="15.5" x2="11.5" y2="15.5" stroke="white" strokeWidth="1.4" strokeLinecap="round"/>
              <circle cx="20" cy="20" r="5" fill="white" fillOpacity="0.18" stroke="white" strokeWidth="1.5"/>
              <line x1="23.8" y1="23.8" x2="26" y2="26" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1 style={{
            fontSize: 24, fontWeight: 800,
            color: "#111827", margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}>
            Welcome back! 👋
          </h1>
          <p style={{ fontSize: 14, color: "#6B7280", margin: 0, lineHeight: 1.5 }}>
            FinDoc Analyzer
          </p>
          <p style={{ fontSize: 13, color: "#9CA3AF", margin: "4px 0 0" }}>
            Connectez-vous à votre espace d'analyse
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>

          {/* Email */}
          <input
            type="email"
            autoComplete="email"
            value={email}
            placeholder="Email..."
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            style={{
              width: "100%",
              padding: "13px 16px",
              borderRadius: 10,
              border: "1.5px solid #E5E7EB",
              fontSize: 14,
              color: "#111827",
              background: "#FAFAFA",
              outline: "none",
              boxSizing: "border-box",
              transition: "border-color 0.15s, box-shadow 0.15s",
            }}
            onFocus={(e) => {
              e.target.style.borderColor = "#7C3AED";
              e.target.style.boxShadow   = "0 0 0 3px rgba(124,58,237,0.10)";
              e.target.style.background  = "#FFFFFF";
            }}
            onBlur={(e) => {
              e.target.style.borderColor = "#E5E7EB";
              e.target.style.boxShadow   = "none";
              e.target.style.background  = "#FAFAFA";
            }}
          />

          {/* Password */}
          <div style={{ position: "relative" }}>
            <input
              type={showPwd ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              placeholder="Password..."
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              style={{
                width: "100%",
                padding: "13px 44px 13px 16px",
                borderRadius: 10,
                border: "1.5px solid #E5E7EB",
                fontSize: 14,
                color: "#111827",
                background: "#FAFAFA",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#7C3AED";
                e.target.style.boxShadow   = "0 0 0 3px rgba(124,58,237,0.10)";
                e.target.style.background  = "#FFFFFF";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.boxShadow   = "none";
                e.target.style.background  = "#FAFAFA";
              }}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              style={{
                position: "absolute", right: 14, top: "50%",
                transform: "translateY(-50%)",
                background: "none", border: "none",
                cursor: "pointer", color: "#9CA3AF",
                display: "flex", padding: 0,
              }}>
              {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "10px 14px", borderRadius: 8,
                  background: "#FEF2F2", border: "1px solid #FECACA",
                  color: "#DC2626", fontSize: 13,
                }}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
              color: "#FFFFFF",
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 4,
              opacity: loading ? 0.75 : 1,
              boxShadow: "0 4px 14px rgba(124,58,237,0.40)",
              transition: "opacity 0.15s, box-shadow 0.15s",
              letterSpacing: "0.01em",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.boxShadow = "0 6px 20px rgba(124,58,237,0.55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 14px rgba(124,58,237,0.40)"; }}>
            {loading ? (
              <>
                <svg style={{ width: 16, height: 16, animation: "spin 0.8s linear infinite" }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Connexion…
              </>
            ) : "Continue"}
          </button>

          {/* Reset */}
          <p style={{ textAlign: "center", margin: "6px 0 0" }}>
            <button
              type="button"
              style={{
                background: "none", border: "none",
                cursor: "pointer", color: "#6B7280",
                fontSize: 13, fontWeight: 500,
                textDecoration: "underline", textDecorationColor: "transparent",
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#7C3AED"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#6B7280"; }}>
              Reset password
            </button>
          </p>
        </form>
      </motion.div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
