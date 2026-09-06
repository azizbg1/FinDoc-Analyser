import { useEffect, useLayoutEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FileText, AlertTriangle, BarChart3, Calendar,
  MessageSquare, ChevronRight, Download, Shield,
  AlertOctagon, Info, Sparkles,
} from "lucide-react";
import { getResults }  from "../services/api";
import RiskGauge       from "../components/RiskGauge";
import AnomalyList     from "../components/AnomalyList";

function norm(raw = "") {
  const u = raw.toUpperCase();
  return u === "HIGH" ? "HIGH" : u === "LOW" ? "LOW" : "MEDIUM";
}

function severityCounts(anomalies) {
  const c = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  anomalies.forEach((a) => c[norm(a.severity)]++);
  return c;
}

const cardV = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.35, ease: "easeOut" } }),
};

function parseSummary(text = "") {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const blocks = [];
  let current = null;
  lines.forEach((line) => {
    if (line.endsWith(":") && !line.startsWith("•")) {
      if (current) blocks.push(current);
      current = { title: line.slice(0, -1), items: [] };
    } else {
      const clean = line.replace(/^[•\-]\s*/, "");
      if (current) {
        current.items.push(clean);
      } else {
        if (!blocks.length || blocks[blocks.length - 1].title !== "__text") {
          blocks.push({ title: "__text", items: [clean] });
        } else {
          blocks[blocks.length - 1].items.push(clean);
        }
      }
    }
  });
  if (current) blocks.push(current);
  return blocks;
}

export default function DashboardPage() {
  const { id } = useParams();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useLayoutEffect(() => {
    setData(null);
    setLoading(true);
    setError("");
  }, [id]);

  useEffect(() => {
    getResults(id)
      .then(({ data }) => setData(data))
      .catch((e) => setError(e.response?.data?.detail || e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DashSkeleton />;
  if (error)   return <ErrorBanner msg={error} />;
  if (!data)   return null;

  const { document: doc, analysis } = data;
  const anomalies     = analysis?.anomalies ?? [];
  const counts        = severityCounts(anomalies);
  const risk          = analysis?.risk_score ?? 0;
  const riskPct       = Math.round(risk * 100);
  const summaryBlocks = parseSummary(analysis?.summary ?? "");
  const riskColor     = risk > 0.7 ? "#b91c1c" : risk > 0.3 ? "#b45309" : "#047857";
  const riskBg        = risk > 0.7 ? "#fef2f2" : risk > 0.3 ? "#fffbeb" : "#f0fdf4";
  const riskLabel     = risk > 0.7 ? "Élevé"   : risk > 0.3 ? "Modéré"  : "Faible";

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-1.5 text-xs text-gray-500">
        <Link to="/history" className="hover:text-brand-600 transition-colors font-medium">Historique</Link>
        <ChevronRight size={12} className="text-gray-300" />
        <span className="truncate max-w-xs text-gray-400">{doc.filename}</span>
      </motion.div>

      {/* Document Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="rounded-2xl p-6 bg-white border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 bg-brand-50 border border-brand-100">
            <FileText size={22} className="text-brand-600" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Analyse terminée
              </span>
              <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                {doc.document_type}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight truncate tracking-tight">{doc.filename}</h1>
            <p className="text-xs mt-1 text-gray-400">
              Téléversé le {new Date(doc.upload_date).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200">
              <Download size={13} /> Télécharger
            </button>
            <Link to={`/chat/${id}`}
              className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl text-white"
              style={{ background: "#6366f1", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}>
              <MessageSquare size={13} /> Poser une question
            </Link>
          </div>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Type de document", Icon: FileText, i: 0,
            iconBg: "#eef2ff", iconColor: "#4f46e5",
            value: <span className="text-base font-bold capitalize mt-1 block text-brand-600">{doc.document_type || "—"}</span>,
            sub: "Classification NLP",
          },
          {
            label: "Anomalies", Icon: AlertTriangle, i: 1,
            iconBg: anomalies.length > 0 ? "#fef2f2" : "#f0fdf4",
            iconColor: anomalies.length > 0 ? "#b91c1c" : "#047857",
            value: <span className="text-4xl font-extrabold leading-none tabular-nums mt-1 block"
              style={{ color: anomalies.length > 0 ? "#b91c1c" : "#047857" }}>{anomalies.length}</span>,
            sub: `${counts.HIGH} critique · ${counts.MEDIUM} modérée`,
          },
          {
            label: "Score de risque", Icon: BarChart3, i: 2,
            iconBg: riskBg, iconColor: riskColor,
            value: <span className="text-4xl font-extrabold leading-none tabular-nums mt-1 block" style={{ color: riskColor }}>{riskPct}%</span>,
            sub: `Risque ${riskLabel}`,
          },
          {
            label: "Date d'analyse", Icon: Calendar, i: 3,
            iconBg: "#f5f3ff", iconColor: "#7c3aed",
            value: <span className="text-base font-bold mt-1 block text-violet-700">
              {new Date(doc.upload_date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })}
            </span>,
            sub: new Date(doc.upload_date).getFullYear().toString(),
          },
        ].map(({ label, Icon, i, iconBg, iconColor, value, sub }) => (
          <motion.div key={label} custom={i} variants={cardV} initial="hidden" animate="visible"
            whileHover={{ y: -2, transition: { duration: 0.15 } }}
            className="rounded-2xl p-5 cursor-default bg-white border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{label}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: iconBg }}>
                <Icon size={14} style={{ color: iconColor }} />
              </div>
            </div>
            {value}
            <p className="text-[11px] mt-2 text-gray-500">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main 2-col */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-5">

          {/* Summary */}
          {analysis?.summary && (
            <motion.div custom={4} variants={cardV} initial="hidden" animate="visible"
              className="rounded-2xl overflow-hidden bg-white border border-gray-200">
              <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
                <div className="w-1 h-4 rounded-full bg-brand-500" />
                <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  Résumé automatique
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 bg-brand-50 text-brand-600 border border-brand-100">
                    <Sparkles size={9} /> IA
                  </span>
                </h2>
              </div>
              <div className="p-6 space-y-5">
                {summaryBlocks.map((block, bi) => (
                  <div key={bi}>
                    {block.title !== "__text" && (
                      <p className="text-[10px] font-bold uppercase tracking-widest mb-2.5 text-brand-600">
                        {block.title}
                      </p>
                    )}
                    <div className="space-y-1.5">
                      {block.items.map((item, ii) => (
                        <div key={ii} className="flex items-start gap-2.5">
                          {block.title !== "__text" && (
                            <div className="w-1.5 h-1.5 rounded-full mt-[7px] flex-shrink-0 bg-brand-400" />
                          )}
                          <p className="text-sm leading-relaxed text-gray-600">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Anomalies */}
          {analysis && (
            <motion.div custom={5} variants={cardV} initial="hidden" animate="visible"
              className="rounded-2xl overflow-hidden bg-white border border-gray-200">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #ef4444, #f59e0b)" }} />
                  <h2 className="text-sm font-semibold text-gray-900">
                    Anomalies détectées
                    <span className="ml-2 text-xs font-normal text-gray-400">({anomalies.length})</span>
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  {counts.HIGH > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
                      <AlertOctagon size={10} /> {counts.HIGH}
                    </span>
                  )}
                  {counts.MEDIUM > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      <AlertTriangle size={10} /> {counts.MEDIUM}
                    </span>
                  )}
                  {counts.LOW > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      <Info size={10} /> {counts.LOW}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <AnomalyList anomalies={anomalies} />
              </div>
            </motion.div>
          )}
        </div>

        {/* Risk Gauge sidebar */}
        {analysis && (
          <motion.div custom={3} variants={cardV} initial="hidden" animate="visible"
            className="rounded-2xl overflow-hidden sticky top-20 bg-white border border-gray-200">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-gray-100">
              <div className="w-1 h-4 rounded-full bg-brand-500" />
              <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                Score de risque <Shield size={13} className="text-brand-500" />
              </h2>
            </div>
            <div className="p-6">
              <RiskGauge score={analysis.risk_score} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function DashSkeleton() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-4 skeleton w-48" />
      <div className="h-24 skeleton rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
      </div>
      <div className="h-52 skeleton rounded-2xl" />
      <div className="h-72 skeleton rounded-2xl" />
    </div>
  );
}

function ErrorBanner({ msg }) {
  return (
    <div className="flex items-center gap-3 p-5 rounded-2xl text-sm bg-red-50 border border-red-200 text-red-700">
      <AlertTriangle size={18} className="flex-shrink-0" /> Erreur : {msg}
    </div>
  );
}
