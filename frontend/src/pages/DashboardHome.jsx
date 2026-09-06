import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, animate } from "framer-motion";
import {
  FileText, AlertOctagon, ShieldCheck, Upload,
  ExternalLink, MessageSquare, Clock, Package, Receipt, BarChart3,
  AlertTriangle, ChevronRight, CheckCircle2, Activity, Plus,
} from "lucide-react";
import { listDocuments } from "../services/api";
import { useAuth } from "../context/AuthContext";

/* ── helpers ─────────────────────────────────────────────────────────── */
const TYPE_META = {
  "facture":           { Icon: FileText,  color: "#4f46e5", bg: "#eef2ff", label: "Factures"          },
  "bon de commande":   { Icon: Package,   color: "#7c3aed", bg: "#f5f3ff", label: "Bons de commande"  },
  "reçu":              { Icon: Receipt,   color: "#059669", bg: "#ecfdf5", label: "Reçus"             },
  "rapport financier": { Icon: BarChart3, color: "#d97706", bg: "#fffbeb", label: "Rapports financ."  },
};
const typeMeta = (t = "") =>
  TYPE_META[t.toLowerCase()] ?? { Icon: FileText, color: "#6b7280", bg: "#f3f4f6", label: t || "Autre" };

const riskOf = (s) => {
  if (s == null) return { label: "—",      color: "#94a3b8", bg: "#f8fafc", border: "#e2e8f0", pct: 0  };
  const p = Math.round(s * 100);
  if (s > 0.7)   return { label: `${p}%`,  color: "#dc2626", bg: "#fef2f2", border: "#fca5a5", pct: p  };
  if (s > 0.3)   return { label: `${p}%`,  color: "#d97706", bg: "#fffbeb", border: "#fcd34d", pct: p  };
  return               { label: `${p}%`,  color: "#059669", bg: "#ecfdf5", border: "#6ee7b7", pct: p  };
};

/* ── Animated counter ─────────────────────────────────────────────────── */
function Counter({ to, suffix = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = animate(0, to, {
      duration: 1.2, ease: "easeOut",
      onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v) + suffix; },
    });
    return c.stop;
  }, [to, suffix]);
  return <span ref={ref}>0{suffix}</span>;
}

/* ── Circular progress ring ───────────────────────────────────────────── */
function Ring({ pct, size = 64, stroke = 6, color, label, sublabel }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
            stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={`0 ${circ}`}
            animate={{ strokeDasharray: `${(pct/100)*circ} ${circ}` }}
            transition={{ duration: 1.1, delay: 0.3, ease: "easeOut" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-extrabold leading-none" style={{ color }}>
            {pct}<span className="text-[10px]">%</span>
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-[11px] font-semibold text-gray-700 leading-tight">{label}</p>
        {sublabel && <p className="text-[10px] text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

/* ── Donut chart ──────────────────────────────────────────────────────── */
function Donut({ high, med, low, total }) {
  const R = 52, stroke = 16, circ = 2 * Math.PI * R;
  const segs = [
    { val: high, color: "#ef4444", label: "Élevé",  sub: `${total > 0 ? Math.round(high/total*100) : 0}%` },
    { val: med,  color: "#f59e0b", label: "Modéré", sub: `${total > 0 ? Math.round(med/total*100)  : 0}%` },
    { val: low,  color: "#10b981", label: "Faible", sub: `${total > 0 ? Math.round(low/total*100)  : 0}%` },
  ];
  let off = 0;
  const arcs = segs.map((s) => {
    const dash = total > 0 ? (s.val / total) * circ : 0;
    const arc  = { ...s, dash, offset: off };
    off += dash;
    return arc;
  });
  const sz = (R + stroke / 2) * 2 + 2;

  return (
    <div className="flex items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: sz, height: sz }}>
        <svg width={sz} height={sz} viewBox={`0 0 ${sz} ${sz}`}
          style={{ transform: "rotate(-90deg)" }}>
          <circle cx={sz/2} cy={sz/2} r={R} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
          {total > 0 && arcs.map((arc, i) => (
            <motion.circle key={i} cx={sz/2} cy={sz/2} r={R} fill="none"
              stroke={arc.color} strokeWidth={stroke} strokeLinecap="butt"
              strokeDasharray={`${arc.dash} ${circ - arc.dash}`}
              strokeDashoffset={-arc.offset}
              initial={{ strokeDasharray: `0 ${circ}` }}
              animate={{ strokeDasharray: `${arc.dash} ${circ - arc.dash}` }}
              transition={{ duration: 1, delay: 0.2 + i * 0.15, ease: "easeOut" }} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
          <span className="text-2xl font-extrabold text-gray-900">{total}</span>
          <span className="text-[10px] text-gray-400 font-medium">Total</span>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {arcs.map((arc) => (
          <div key={arc.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: arc.color }} />
                <span className="text-xs font-medium text-gray-600">{arc.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-800">{arc.val}</span>
                <span className="text-[10px] text-gray-400 w-7 text-right">{arc.sub}</span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div className="h-full rounded-full" style={{ background: arc.color }}
                initial={{ width: 0 }}
                animate={{ width: arc.sub }}
                transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function DashboardHome() {
  const { user } = useAuth();
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    listDocuments(0, 100)
      .then(({ data }) => setDocs(data))
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, []);

  const total          = docs.length;
  const highRisk       = docs.filter((d) => (d.risk_score ?? 0) > 0.7).length;
  const medRisk        = docs.filter((d) => { const s = d.risk_score ?? 0; return s > 0.3 && s <= 0.7; }).length;
  const lowRisk        = docs.filter((d) => (d.risk_score ?? 0) <= 0.3).length;
  const avgScore       = total ? Math.round(docs.reduce((s, d) => s + (d.risk_score ?? 0), 0) / total * 100) : 0;
  const totalAnomalies = docs.reduce((s, d) => s + (d.anomaly_count ?? 0), 0);
  const safeRate       = total ? Math.round((lowRisk  / total) * 100) : 0;
  const criticalRate   = total ? Math.round((highRisk / total) * 100) : 0;
  const withAnomalies  = docs.filter((d) => (d.anomaly_count ?? 0) > 0).length;

  const categories = useMemo(() => {
    const m = {};
    docs.forEach((d) => { const k = (d.document_type || "autre").toLowerCase(); m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([type, count]) => ({ ...typeMeta(type), count, type }));
  }, [docs]);
  const maxCat = Math.max(...categories.map((c) => c.count), 1);

  const recent   = useMemo(() =>
    [...docs].sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date)).slice(0, 6),
  [docs]);

  const activity = useMemo(() => recent.slice(0, 5).map((doc) => ({
    doc,
    ok:    (doc.risk_score ?? 0) <= 0.3,
    event: (doc.risk_score ?? 0) > 0.7
      ? "Anomalies critiques détectées"
      : (doc.anomaly_count ?? 0) > 0
      ? "Analyse terminée avec alertes"
      : "Document conforme — aucune anomalie",
  })), [recent]);

  if (loading) return <Skeleton />;
  if (error)   return (
    <div className="flex items-center gap-3 p-5 rounded-2xl text-sm bg-red-50 border border-red-200 text-red-700">
      <AlertTriangle size={18} className="flex-shrink-0" /> Erreur : {error}
    </div>
  );

  /* ── health ring metrics ── */
  const rings = [
    { pct: safeRate,                                 color: "#10b981", label: "Conformité",       sublabel: "Docs à faible risque"   },
    { pct: total > 0 ? 100 - criticalRate : 0,       color: "#6366f1", label: "Sûreté",           sublabel: "Sans risque élevé"      },
    { pct: total > 0 ? Math.max(0, 100-avgScore) : 0,color: "#3b82f6", label: "Score global",     sublabel: "Indice de confiance"    },
    { pct: total > 0 ? Math.round((1 - withAnomalies/total)*100) : 0, color: "#f59e0b", label: "Sans anomalie", sublabel: "Docs sans alerte" },
  ];

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5 capitalize">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link to="/upload"
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: "#4f46e5", boxShadow: "0 4px 14px rgba(79,70,229,0.30)" }}>
          <Plus size={15} /> Nouveau document
        </Link>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { Icon: FileText,     label: "Documents",    value: total,          suffix: "",  color: "#4f46e5", bg: "#eef2ff", accent: "#c7d2fe" },
          { Icon: AlertOctagon, label: "Risque élevé", value: highRisk,       suffix: "",  color: "#dc2626", bg: "#fef2f2", accent: "#fecaca" },
          { Icon: Activity,     label: "Anomalies",    value: totalAnomalies, suffix: "",  color: "#d97706", bg: "#fffbeb", accent: "#fde68a" },
          { Icon: ShieldCheck,  label: "Score moyen",  value: avgScore,       suffix: "%", color: "#059669", bg: "#ecfdf5", accent: "#a7f3d0" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.38 }}
            className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.accent }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <s.Icon size={18} style={{ color: s.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums">
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5 truncate">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Row 1 : Health rings + Donut + Categories ──────────────────── */}
      <div className="grid lg:grid-cols-[1fr_280px_220px] gap-4">

        {/* Santé des documents — 4 rings */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <div className="w-1 h-4 rounded-full bg-brand-500" />
                <h2 className="text-sm font-bold text-gray-900">Santé des documents</h2>
              </div>
              <p className="text-[11px] text-gray-400 ml-3">Indicateurs de qualité et conformité IA</p>
            </div>
            {total > 0 && (
              <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Pipeline actif
              </span>
            )}
          </div>

          {total === 0 ? (
            <div className="flex flex-col items-center py-8 gap-3">
              <Activity size={32} className="text-gray-200" />
              <p className="text-sm text-gray-400">Analysez votre premier document pour voir les métriques.</p>
              <Link to="/upload" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                <Upload size={12} /> Commencer →
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {rings.map((r) => <Ring key={r.label} {...r} size={72} stroke={7} />)}
              </div>

              {/* Key insight banner */}
              <div className="rounded-xl p-4 flex items-start gap-3"
                style={{ background: safeRate >= 70 ? "#f0fdf4" : safeRate >= 40 ? "#fffbeb" : "#fef2f2",
                         border: `1px solid ${safeRate >= 70 ? "#bbf7d0" : safeRate >= 40 ? "#fde68a" : "#fecaca"}` }}>
                {safeRate >= 70
                  ? <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  : <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-semibold" style={{ color: safeRate >= 70 ? "#065f46" : safeRate >= 40 ? "#92400e" : "#991b1b" }}>
                    {safeRate >= 70 ? "Portefeuille sain — majorité conforme" :
                     safeRate >= 40 ? "Vigilance recommandée — risques modérés présents" :
                     "Attention — plusieurs documents à risque élevé détectés"}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: safeRate >= 70 ? "#059669" : safeRate >= 40 ? "#b45309" : "#dc2626" }}>
                    {lowRisk} document{lowRisk > 1 ? "s" : ""} conforme{lowRisk > 1 ? "s" : ""} sur {total} · {totalAnomalies} anomalie{totalAnomalies > 1 ? "s" : ""} au total
                  </p>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Répartition des risques — Donut */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}
          className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-4 rounded-full"
              style={{ background: "linear-gradient(180deg,#ef4444,#f59e0b,#10b981)" }} />
            <h2 className="text-sm font-bold text-gray-900">Répartition des risques</h2>
          </div>
          <Donut high={highRisk} med={medRisk} low={lowRisk} total={total} />

          {total > 0 && (
            <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
              {[
                { val: criticalRate, label: "Critique", color: "#dc2626" },
                { val: total > 0 ? Math.round(medRisk/total*100) : 0, label: "Modéré", color: "#d97706" },
                { val: safeRate,     label: "Sûr",      color: "#059669" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-base font-extrabold" style={{ color: s.color }}>{s.val}%</p>
                  <p className="text-[10px] text-gray-400 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Catégories */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-violet-400" />
              <h2 className="text-sm font-bold text-gray-900">Catégories</h2>
            </div>
            <Link to="/history" className="text-[11px] font-semibold text-brand-500 hover:text-brand-700">
              Tout voir
            </Link>
          </div>

          {categories.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aucun document</p>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.type} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: cat.bg }}>
                    <cat.Icon size={13} style={{ color: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-medium text-gray-600 truncate">{cat.label}</span>
                      <span className="text-[11px] font-bold text-gray-800 ml-1 flex-shrink-0">{cat.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ background: cat.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(cat.count / maxCat) * 100}%` }}
                        transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Row 2 : Recent docs + Activity ────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* Documents récents */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-gray-900">Documents récents</h2>
              {total > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{total}</span>
              )}
            </div>
            <Link to="/history" className="text-[11px] font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-0.5">
              Voir tout <ChevronRight size={12} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-16 text-center">
              <FileText size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Aucun document analysé</p>
              <Link to="/upload"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold px-4 py-2 rounded-xl text-white bg-brand-500">
                <Upload size={12} /> Analyser un document
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {/* header */}
              <div className="grid grid-cols-[1fr_80px_64px_60px] gap-2 px-5 py-2 bg-gray-50">
                {["Fichier", "Type", "Risque", ""].map((h) => (
                  <span key={h} className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{h}</span>
                ))}
              </div>
              {recent.map((doc, i) => {
                const meta = typeMeta(doc.document_type);
                const risk = riskOf(doc.risk_score);
                return (
                  <motion.div key={doc.id}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="grid grid-cols-[1fr_80px_64px_60px] gap-2 items-center px-5 py-3 hover:bg-gray-50/80 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center"
                        style={{ background: meta.bg }}>
                        <meta.Icon size={13} style={{ color: meta.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] font-semibold text-gray-900 truncate">{doc.filename}</p>
                        <p className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock size={8} />
                          {new Date(doc.upload_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md w-fit truncate"
                      style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                    <div>
                      <span className="text-xs font-bold" style={{ color: risk.color }}>{risk.label}</span>
                      <div className="h-1 rounded-full bg-gray-100 overflow-hidden mt-1">
                        <div className="h-full rounded-full" style={{ background: risk.color, width: `${risk.pct}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Link to={`/dashboard/${doc.id}`}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors">
                        <ExternalLink size={11} />
                      </Link>
                      <Link to={`/chat/${doc.id}`}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-500 hover:bg-violet-50 transition-colors">
                        <MessageSquare size={11} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Activité récente */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <div className="w-1 h-4 rounded-full bg-violet-500" />
            <h2 className="text-sm font-bold text-gray-900">Activité récente</h2>
            <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {activity.length === 0 ? (
            <div className="py-16 text-center">
              <Activity size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Aucune activité</p>
            </div>
          ) : (
            <div className="p-5 space-y-1">
              {activity.map(({ doc, event, ok }, i) => (
                <motion.div key={doc.id}
                  initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.46 + i * 0.06 }}
                  className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${ok ? "bg-emerald-50" : "bg-red-50"}`}>
                    {ok
                      ? <CheckCircle2 size={14} className="text-emerald-500" />
                      : <AlertOctagon size={14} className="text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-900 truncate">{doc.filename}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: ok ? "#059669" : "#dc2626" }}>{event}</p>
                    <p className="text-[10px] text-gray-300 mt-0.5 flex items-center gap-1">
                      <Clock size={8} />
                      {new Date(doc.upload_date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <Link to={`/dashboard/${doc.id}`}
                    className="text-[11px] font-semibold text-brand-500 hover:text-brand-700 flex-shrink-0 mt-1">
                    Voir →
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between"><div className="h-8 skeleton w-40" /><div className="h-9 skeleton w-36 rounded-xl" /></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-[1fr_280px_220px] gap-4">
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
        <div className="h-64 skeleton rounded-2xl" />
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-72 skeleton rounded-2xl" />
        <div className="h-72 skeleton rounded-2xl" />
      </div>
    </div>
  );
}
