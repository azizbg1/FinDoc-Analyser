import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, Upload, FileText, Package, Receipt,
  TrendingUp, AlertTriangle, ExternalLink, MessageSquare, AlertOctagon,
} from "lucide-react";
import { listDocuments } from "../services/api";

const TYPE_META = {
  "facture":           { Icon: FileText,  color: "#818cf8", bg: "rgba(99,102,241,0.1)",  label: "Facture"           },
  "bon de commande":   { Icon: Package,   color: "#a78bfa", bg: "rgba(139,92,246,0.1)",  label: "Bon de commande"   },
  "reçu":              { Icon: Receipt,   color: "#34d399", bg: "rgba(16,185,129,0.1)",  label: "Reçu"              },
  "rapport financier": { Icon: BarChart3, color: "#60a5fa", bg: "rgba(59,130,246,0.1)",  label: "Rapport financier" },
};
const typeMeta = (t = "") =>
  TYPE_META[t.toLowerCase()] ?? { Icon: FileText, color: "#64748b", bg: "rgba(100,116,139,0.1)", label: t || "Autre" };

const riskBadge = (score) => {
  if (score === undefined || score === null) return null;
  const pct = Math.round(score * 100);
  if (score > 0.7)  return { label: `${pct}%`, color: "#ef4444", bg: "rgba(239,68,68,0.1)",  border: "rgba(239,68,68,0.25)"  };
  if (score > 0.3)  return { label: `${pct}%`, color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" };
  return              { label: `${pct}%`, color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)"  };
};

function StatsBar({ docs }) {
  const highRisk = docs.filter((d) => (d.risk_score ?? 0) > 0.7).length;
  const avgRisk  = docs.length ? Math.round(docs.reduce((s, d) => s + (d.risk_score ?? 0), 0) / docs.length * 100) : 0;
  return (
    <div className="grid grid-cols-3 gap-4 mb-8">
      {[
        { label: "Documents analysés", value: docs.length,   Icon: FileText,     color: "#818cf8", bg: "rgba(99,102,241,0.1)"  },
        { label: "Risque élevé",        value: highRisk,     Icon: AlertOctagon, color: "#f87171", bg: "rgba(239,68,68,0.1)"   },
        { label: "Score moyen",         value: `${avgRisk}%`, Icon: TrendingUp,  color: "#fbbf24", bg: "rgba(245,158,11,0.1)" },
      ].map((s, i) => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
          className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
            <s.Icon size={20} style={{ color: s.color }} />
          </div>
          <div>
            <p className="text-2xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[11px] font-medium mt-0.5" style={{ color: "#475569" }}>{s.label}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default function HistoryPage() {
  const [docs,    setDocs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    listDocuments()
      .then(({ data }) => setDocs(data))
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4 mt-4 animate-pulse">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 p-5 rounded-2xl text-sm"
      style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
      <AlertTriangle size={18} className="flex-shrink-0" /> Erreur : {error}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Historique des analyses</h1>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>Documents traités par le pipeline multi-agents.</p>
        </div>
        <Link to="/upload"
          className="flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 14px rgba(99,102,241,0.25)" }}>
          <Upload size={15} /> Nouveau document
        </Link>
      </div>

      {docs.length > 0 && <StatsBar docs={docs} />}

      {docs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-20 rounded-2xl"
          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <FileText size={28} style={{ color: "#6366f1" }} />
          </div>
          <p className="font-semibold" style={{ color: "#94a3b8" }}>Aucun document analysé</p>
          <p className="text-sm mt-1" style={{ color: "#475569" }}>Téléversez votre premier PDF pour commencer.</p>
          <Link to="/upload" className="inline-block mt-5 text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
            Analyser un document
          </Link>
        </motion.div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3"
            style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["Fichier", "Type", "Date", "Score de risque", "Actions"].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#334155" }}>{h}</span>
            ))}
          </div>

          <div>
            {docs.map((doc, i) => {
              const meta = typeMeta(doc.document_type);
              const rb   = riskBadge(doc.risk_score);
              return (
                <motion.div key={doc.id}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center transition-colors"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                      <meta.Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{doc.filename}</p>
                      {doc.anomaly_count !== undefined && (
                        <p className="text-[11px]" style={{ color: "#475569" }}>
                          {doc.anomaly_count} anomalie{doc.anomaly_count !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg w-fit"
                    style={{ background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>

                  <div className="text-xs">
                    <p style={{ color: "#94a3b8" }}>{new Date(doc.upload_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                    <p style={{ color: "#334155" }}>{new Date(doc.upload_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>

                  {rb ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg w-fit"
                      style={{ background: rb.bg, color: rb.color, border: `1px solid ${rb.border}` }}>
                      <span className="w-2 h-2 rounded-full inline-block" style={{ background: rb.color, boxShadow: `0 0 6px ${rb.color}` }} />
                      {rb.label}
                    </span>
                  ) : <span style={{ color: "#1e293b" }}>—</span>}

                  <div className="flex items-center gap-1.5">
                    <Link to={`/dashboard/${doc.id}`}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", border: "1px solid rgba(99,102,241,0.2)" }}>
                      <ExternalLink size={11} /> Détails
                    </Link>
                    <Link to={`/chat/${doc.id}`}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <MessageSquare size={11} /> Chat
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
