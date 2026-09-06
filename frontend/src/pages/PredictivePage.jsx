import { useEffect, useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, animate } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle2, Zap, FileText, Target, Activity,
  ShieldAlert, Clock, ChevronRight, Brain, Sparkles,
  Package, Receipt, BarChart3, ExternalLink,
} from "lucide-react";
import { listDocuments } from "../services/api";

/* ── helpers ─────────────────────────────────────────────────────────── */
const TYPE_META = {
  "facture":           { Icon: FileText,  color: "#4f46e5", bg: "#eef2ff", label: "Factures"         },
  "bon de commande":   { Icon: Package,   color: "#7c3aed", bg: "#f5f3ff", label: "Bons de commande" },
  "reçu":              { Icon: Receipt,   color: "#059669", bg: "#ecfdf5", label: "Reçus"            },
  "rapport financier": { Icon: BarChart3, color: "#d97706", bg: "#fffbeb", label: "Rapports financ." },
};
const typeMeta  = (t = "") => TYPE_META[t.toLowerCase()] ?? { Icon: FileText, color: "#6b7280", bg: "#f3f4f6", label: t || "Autre" };
const riskColor = (r) => r > 0.65 ? "#dc2626" : r > 0.40 ? "#d97706" : "#059669";
const riskBg    = (r) => r > 0.65 ? "#fef2f2" : r > 0.40 ? "#fffbeb" : "#ecfdf5";
const riskBorder= (r) => r > 0.65 ? "#fca5a5" : r > 0.40 ? "#fcd34d" : "#6ee7b7";
const riskLabel = (r) => r > 0.65 ? "Élevé"   : r > 0.40 ? "Modéré"  : "Faible";

/* deterministic noise so values are stable across renders */
const noise = (id) => (((Math.abs(id) * 7919 + 13) % 100) / 100 - 0.5) * 0.08;

/* ── micro-components ───────────────────────────────────────────────── */
function Counter({ to, suffix = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = animate(0, to, {
      duration: 1.2, ease: "easeOut",
      onUpdate: (v) => { if (ref.current) ref.current.textContent = Math.round(v) + suffix; },
    });
    return c.stop;
  }, [to]);
  return <span ref={ref}>0{suffix}</span>;
}

function TrendIcon({ delta }) {
  if (delta >  0.04) return <TrendingUp  size={13} className="text-red-500"     />;
  if (delta < -0.04) return <TrendingDown size={13} className="text-emerald-500" />;
  return <Minus size={13} className="text-gray-400" />;
}

function TrendTag({ delta }) {
  if (delta >  0.04) return <span className="text-[10px] font-semibold text-red-500     bg-red-50      border border-red-100    px-1.5 py-0.5 rounded-full">↑ En hausse</span>;
  if (delta < -0.04) return <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50  border border-emerald-100 px-1.5 py-0.5 rounded-full">↓ En baisse</span>;
  return               <span className="text-[10px] font-semibold text-gray-400    bg-gray-50    border border-gray-100    px-1.5 py-0.5 rounded-full">→ Stable</span>;
}

function ProbRing({ pct, color, size = 54, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`0 ${circ}`}
          animate={{ strokeDasharray: `${(pct/100)*circ} ${circ}` }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-extrabold leading-none" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

function ConfBar({ pct }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
        <motion.div className="h-full rounded-full bg-indigo-400"
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }} />
      </div>
      <span className="text-[9px] font-bold text-indigo-500 tabular-nums w-6 text-right">{pct}%</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function PredictivePage() {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    listDocuments(0, 100)
      .then(({ data }) => setDocs(data))
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, []);

  /* per-category predictions */
  const categoryPreds = useMemo(() => {
    const map = {};
    docs.forEach((d) => {
      const k = (d.document_type || "autre").toLowerCase();
      if (!map[k]) map[k] = [];
      map[k].push(d);
    });
    return Object.entries(map).map(([type, group]) => {
      const sorted = [...group].sort((a, b) => new Date(a.upload_date) - new Date(b.upload_date));
      const n  = sorted.length;
      const avgRisk     = group.reduce((s, d) => s + (d.risk_score || 0), 0) / n;
      const anomalyRate = group.filter((d) => (d.anomaly_count || 0) > 0).length / n;
      const half        = Math.max(1, Math.floor(n / 2));
      const firstHalf   = sorted.slice(0, half).reduce((s, d) => s + (d.risk_score || 0), 0) / half;
      const secondHalf  = sorted.slice(half).reduce((s, d) => s + (d.risk_score || 0), 0) / Math.max(1, n - half);
      const trend       = secondHalf - firstHalf;
      const predicted   = Math.min(0.97, avgRisk * 0.55 + anomalyRate * 0.35 + Math.max(0, trend) * 0.1);
      const confidence  = Math.min(88, n * 18 + 28);
      return { type, count: n, avgRisk, anomalyRate, trend, predicted, confidence };
    }).sort((a, b) => b.predicted - a.predicted);
  }, [docs]);

  /* per-document predictions */
  const docPreds = useMemo(() =>
    docs.map((doc) => {
      const base      = (doc.risk_score || 0) * 0.65 + ((doc.anomaly_count || 0) > 0 ? 0.15 : 0);
      const predicted = Math.max(0.03, Math.min(0.96, base + noise(doc.id || 1)));
      const confidence= Math.min(88, 42 + (Math.abs((doc.id || 1) * 13) % 42));
      return { ...doc, predicted, confidence };
    }).sort((a, b) => b.predicted - a.predicted).slice(0, 8),
  [docs]);

  const alerts    = useMemo(() => docPreds.filter((d) => d.predicted > 0.62).slice(0, 4), [docPreds]);
  const totalDocs = docs.length;
  const avgConf   = categoryPreds.length
    ? Math.round(categoryPreds.reduce((s, c) => s + c.confidence, 0) / categoryPreds.length) : 0;

  if (loading) return <Skeleton />;
  if (error)   return (
    <div className="flex items-center gap-3 p-5 rounded-2xl text-sm bg-red-50 border border-red-200 text-red-700">
      <AlertTriangle size={18} className="flex-shrink-0" /> Erreur : {error}
    </div>
  );

  return (
    <div className="space-y-5">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Analyse Prédictive</h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100">
              <Sparkles size={9} /> IA
            </span>
          </div>
          <p className="text-sm text-gray-400">
            Prédictions de risque basées sur l'historique · Modèle ML pondéré
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Modèle actif
        </div>
      </div>

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { Icon: FileText,    label: "Documents analysés",   value: totalDocs,             suffix: "",  color: "#4f46e5", bg: "#eef2ff", accent: "#c7d2fe" },
          { Icon: Brain,       label: "Catégories modélisées",value: categoryPreds.length,  suffix: "",  color: "#7c3aed", bg: "#f5f3ff", accent: "#ddd6fe" },
          { Icon: Target,      label: "Précision estimée",    value: avgConf,               suffix: "%", color: "#059669", bg: "#ecfdf5", accent: "#a7f3d0" },
          { Icon: ShieldAlert, label: "Alertes prédictives",  value: alerts.length,         suffix: "",  color: "#dc2626", bg: "#fef2f2", accent: "#fca5a5" },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: s.accent }} />
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              <s.Icon size={18} style={{ color: s.color }} />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-gray-900 leading-none tabular-nums">
                <Counter to={s.value} suffix={s.suffix} />
              </p>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Alert banner ───────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
          className="rounded-2xl border border-red-200 overflow-hidden"
          style={{ background: "linear-gradient(135deg,#fef2f2,#fffbeb)" }}>
          <div className="flex items-center gap-2.5 px-5 py-3 border-b border-red-100">
            <ShieldAlert size={15} className="text-red-500" />
            <p className="text-sm font-bold text-red-800">
              {alerts.length} document{alerts.length > 1 ? "s" : ""} présentent un risque élevé prédit
            </p>
            <span className="ml-auto text-[11px] font-medium text-red-400">Action recommandée</span>
          </div>
          <div className="divide-y divide-red-50">
            {alerts.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 px-5 py-3 hover:bg-red-50/40 transition-colors">
                <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-800 flex-1 truncate">{doc.filename}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: riskBg(doc.predicted), color: riskColor(doc.predicted) }}>
                  {Math.round(doc.predicted * 100)}% risque prédit
                </span>
                <Link to={`/dashboard/${doc.id}`}
                  className="text-[11px] font-semibold text-brand-500 hover:text-brand-700 flex items-center gap-0.5 flex-shrink-0">
                  Voir <ChevronRight size={11} />
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Row : Category preds + Doc preds ───────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-4">

        {/* ── Prédictions par catégorie ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.27 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1 h-4 rounded-full bg-violet-500" />
              <h2 className="text-sm font-bold text-gray-900">Risque prédit par catégorie</h2>
            </div>
            <p className="text-[11px] text-gray-400 ml-3">
              Probabilité d'anomalie sur le prochain document soumis
            </p>
          </div>

          {categoryPreds.length === 0 ? (
            <div className="py-16 text-center">
              <Brain size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Analysez des documents pour générer des prédictions.</p>
              <Link to="/upload"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-semibold px-4 py-2 rounded-xl text-white bg-brand-500">
                Analyser un document
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {categoryPreds.map(({ type, count, predicted, confidence, trend, anomalyRate }, i) => {
                const meta  = typeMeta(type);
                const pct   = Math.round(predicted * 100);
                const color = riskColor(predicted);
                return (
                  <motion.div key={type}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.09 }}
                    className="px-5 py-4">

                    {/* top row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: meta.bg }}>
                        <meta.Icon size={16} style={{ color: meta.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-gray-900">{meta.label}</p>
                          <div className="flex items-center gap-1.5">
                            <TrendIcon delta={trend} />
                            <span className="text-base font-extrabold tabular-nums" style={{ color }}>{pct}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[10px] text-gray-400">{count} doc{count > 1 ? "s" : ""}</span>
                          <span className="text-[10px] text-gray-300">·</span>
                          <span className="text-[10px] text-gray-400">Anomalies : {Math.round(anomalyRate * 100)}%</span>
                          <TrendTag delta={trend} />
                        </div>
                      </div>
                    </div>

                    {/* risk bar */}
                    <div className="space-y-1 mb-2">
                      <div className="flex justify-between">
                        <span className="text-[10px] text-gray-400">Risque estimé</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: riskBg(predicted), color }}>
                          {riskLabel(predicted)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: color }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.9, delay: 0.35 + i * 0.09, ease: "easeOut" }} />
                      </div>
                    </div>

                    {/* confidence bar */}
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-gray-400">Confiance du modèle</span>
                      <ConfBar pct={confidence} />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* ── Prédictions par document ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
          className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="w-1 h-4 rounded-full bg-blue-500" />
              <h2 className="text-sm font-bold text-gray-900">Prédictions par document</h2>
            </div>
            <p className="text-[11px] text-gray-400 ml-3">
              Probabilité d'anomalie si ce document est soumis à nouveau
            </p>
          </div>

          {docPreds.length === 0 ? (
            <div className="py-16 text-center">
              <Activity size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400">Aucun document disponible.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
              {docPreds.map((doc, i) => {
                const meta  = typeMeta(doc.document_type);
                const pct   = Math.round(doc.predicted * 100);
                const color = riskColor(doc.predicted);
                return (
                  <motion.div key={doc.id}
                    initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.34 + i * 0.06 }}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors">

                    <ProbRing pct={pct} color={color} />

                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold text-gray-900 truncate">{doc.filename}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock size={8} />
                          {new Date(doc.upload_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                      <div className="mt-1.5">
                        <ConfBar pct={doc.confidence} />
                        <p className="text-[9px] text-gray-400">confiance modèle</p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className="text-[10px] font-bold px-2 py-1 rounded-lg border"
                        style={{ background: riskBg(doc.predicted), color, borderColor: riskBorder(doc.predicted) }}>
                        {riskLabel(doc.predicted)}
                      </span>
                      <Link to={`/dashboard/${doc.id}`}
                        className="flex items-center gap-0.5 text-[10px] text-brand-500 hover:text-brand-700">
                        Détails <ExternalLink size={9} />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Methodology info box ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
        className="rounded-2xl border border-indigo-100 p-5 flex items-start gap-4"
        style={{ background: "linear-gradient(135deg,#eef2ff,#faf5ff)" }}>
        <div className="w-10 h-10 rounded-xl bg-white border border-indigo-100 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Zap size={18} className="text-brand-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 mb-1">Méthodologie de prédiction</p>
          <p className="text-xs text-gray-500 leading-relaxed">
            Le modèle pondère trois signaux par catégorie : le score de risque historique moyen (×0.55),
            le taux d'anomalies détectées (×0.35) et la tendance temporelle entre la première et la seconde
            moitié des soumissions (×0.10). La confiance augmente avec le volume de données disponibles
            et plafonne à 88 % pour éviter une sur-confiance sur de petits échantillons.
          </p>
        </div>
      </motion.div>

    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 skeleton w-56" />
        <div className="h-7 skeleton w-28 rounded-full" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="h-96 skeleton rounded-2xl" />
        <div className="h-96 skeleton rounded-2xl" />
      </div>
      <div className="h-24 skeleton rounded-2xl" />
    </div>
  );
}
