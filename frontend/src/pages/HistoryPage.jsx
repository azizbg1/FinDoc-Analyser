import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3, Upload, FileText, Package, Receipt,
  TrendingUp, AlertTriangle, ExternalLink, MessageSquare, AlertOctagon,
  CheckCircle, Clock,
} from "lucide-react";
import { listDocuments } from "../services/api";

const TYPE_META = {
  "facture":           { Icon: FileText,  color: "#4f46e5", bg: "#eef2ff", label: "Facture"           },
  "bon de commande":   { Icon: Package,   color: "#7c3aed", bg: "#f5f3ff", label: "Bon de commande"   },
  "reçu":              { Icon: Receipt,   color: "#047857", bg: "#f0fdf4", label: "Reçu"              },
  "rapport financier": { Icon: BarChart3, color: "#1d4ed8", bg: "#eff6ff", label: "Rapport financier" },
};
const typeMeta = (t = "") =>
  TYPE_META[t.toLowerCase()] ?? { Icon: FileText, color: "#6b7280", bg: "#f3f4f6", label: t || "Autre" };

const riskBadge = (score) => {
  if (score === undefined || score === null) return null;
  const pct = Math.round(score * 100);
  if (score > 0.7) return { label: `${pct}%`, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
  if (score > 0.3) return { label: `${pct}%`, color: "#b45309", bg: "#fffbeb", border: "#fde68a" };
  return             { label: `${pct}%`, color: "#047857", bg: "#f0fdf4", border: "#a7f3d0" };
};

function KpiCard({ value, label, sub, Icon, color, bg, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="rounded-2xl p-5 flex flex-col gap-3 bg-white border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: bg }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Stats</span>
      </div>
      <div>
        <p className="text-3xl font-extrabold tabular-nums" style={{ color }}>{value}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{label}</p>
        {sub && <p className="text-xs mt-1 text-gray-400">{sub}</p>}
      </div>
    </motion.div>
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

  const highRisk = docs.filter((d) => (d.risk_score ?? 0) > 0.7).length;
  const lowRisk  = docs.filter((d) => (d.risk_score ?? 0) <= 0.3).length;
  const avgRisk  = docs.length
    ? Math.round(docs.reduce((s, d) => s + (d.risk_score ?? 0), 0) / docs.length * 100)
    : 0;

  if (loading) return (
    <div className="space-y-4 mt-4 animate-pulse">
      {[...Array(3)].map((_, i) => <div key={i} className="h-20 skeleton rounded-2xl" />)}
    </div>
  );

  if (error) return (
    <div className="flex items-center gap-3 p-5 rounded-2xl text-sm bg-red-50 border border-red-200 text-red-700">
      <AlertTriangle size={18} className="flex-shrink-0" /> Erreur : {error}
    </div>
  );

  return (
    <div className="space-y-8">

      {/* ── En-tête ── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-brand-500 mb-1">
            Historique
          </p>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analyses de documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Documents traités par le pipeline multi-agents IA.
          </p>
        </div>
        <Link to="/upload"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: "#6366f1", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}>
          <Upload size={14} /> Nouveau document
        </Link>
      </div>

      {/* ── KPI Cards ── */}
      {docs.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard value={docs.length}   label="Documents analysés" sub="Total cumulé"    Icon={FileText}     color="#4f46e5" bg="#eef2ff" delay={0}    />
          <KpiCard value={highRisk}      label="Risque élevé"       sub="Score > 70 %"   Icon={AlertOctagon} color="#b91c1c" bg="#fef2f2" delay={0.07} />
          <KpiCard value={`${avgRisk}%`} label="Score moyen"        sub="Sur l'ensemble"  Icon={TrendingUp}   color="#b45309" bg="#fffbeb" delay={0.14} />
          <KpiCard value={lowRisk}       label="Faible risque"      sub="Score ≤ 30 %"   Icon={CheckCircle}  color="#047857" bg="#f0fdf4" delay={0.21} />
        </div>
      )}

      {/* ── Tableau / liste ── */}
      {docs.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-24 rounded-2xl bg-white border border-gray-200">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-brand-50 border border-brand-100">
            <FileText size={28} className="text-brand-500" />
          </div>
          <p className="font-semibold text-gray-700">Aucun document analysé</p>
          <p className="text-sm mt-1 text-gray-400">Téléversez votre premier PDF pour commencer.</p>
          <Link to="/upload"
            className="inline-flex items-center gap-2 mt-5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white"
            style={{ background: "#6366f1" }}>
            <Upload size={14} /> Analyser un document
          </Link>
        </motion.div>
      ) : (
        <div className="rounded-2xl overflow-hidden bg-white border border-gray-200">

          {/* Table header */}
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200">
            {["Fichier", "Type", "Date", "Score de risque", "Actions"].map((h) => (
              <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {h}
              </span>
            ))}
          </div>

          <div className="divide-y divide-gray-100">
            {docs.map((doc, i) => {
              const meta = typeMeta(doc.document_type);
              const rb   = riskBadge(doc.risk_score);
              return (
                <motion.div key={doc.id}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center transition-colors cursor-default hover:bg-gray-50">

                  {/* Fichier */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: meta.bg }}>
                      <meta.Icon size={16} style={{ color: meta.color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{doc.filename}</p>
                      {doc.anomaly_count !== undefined && (
                        <p className="text-[11px] text-gray-400">
                          {doc.anomaly_count} anomalie{doc.anomaly_count !== 1 ? "s" : ""}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Type */}
                  <span className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-lg w-fit"
                    style={{ background: meta.bg, color: meta.color }}>
                    {meta.label}
                  </span>

                  {/* Date */}
                  <div className="text-xs">
                    <p className="flex items-center gap-1 text-gray-500">
                      <Clock size={11} />
                      {new Date(doc.upload_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <p className="mt-0.5 text-gray-400">
                      {new Date(doc.upload_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  {/* Score */}
                  {rb ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg w-fit border"
                      style={{ background: rb.bg, color: rb.color, borderColor: rb.border }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: rb.color }} />
                      {rb.label}
                    </span>
                  ) : <span className="text-gray-300">—</span>}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <Link to={`/dashboard/${doc.id}`}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 bg-brand-50 text-brand-600 border border-brand-100 hover:bg-brand-100">
                      <ExternalLink size={11} /> Détails
                    </Link>
                    <Link to={`/chat/${doc.id}`}
                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200">
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
