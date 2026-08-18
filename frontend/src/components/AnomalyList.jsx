import { motion } from "framer-motion";
import { AlertTriangle, AlertOctagon, Info, CheckCircle, ChevronRight } from "lucide-react";

const SEV_CONFIG = {
  HIGH: {
    label: "Critique", Icon: AlertOctagon,
    color: "#ef4444", bgStyle: "rgba(239,68,68,0.06)", borderStyle: "rgba(239,68,68,0.2)",
    badgeBg: "rgba(239,68,68,0.12)", badgeColor: "#f87171", iconBg: "rgba(239,68,68,0.1)", leftBar: "#ef4444",
  },
  MEDIUM: {
    label: "Modérée", Icon: AlertTriangle,
    color: "#f59e0b", bgStyle: "rgba(245,158,11,0.06)", borderStyle: "rgba(245,158,11,0.2)",
    badgeBg: "rgba(245,158,11,0.12)", badgeColor: "#fbbf24", iconBg: "rgba(245,158,11,0.1)", leftBar: "#f59e0b",
  },
  LOW: {
    label: "Faible", Icon: Info,
    color: "#3b82f6", bgStyle: "rgba(59,130,246,0.06)", borderStyle: "rgba(59,130,246,0.2)",
    badgeBg: "rgba(59,130,246,0.12)", badgeColor: "#60a5fa", iconBg: "rgba(59,130,246,0.1)", leftBar: "#3b82f6",
  },
};

const TYPE_LABELS = {
  missing_field: "Champ manquant", total_inconsistency: "Incohérence de total",
  line_total_error: "Erreur total de ligne", negative_amount: "Montant négatif",
  zero_amount: "Montant nul", missing_tva: "TVA absente",
  total_less_than_subtotal: "Total < Sous-total", invoice_number_format: "Format numéro de facture",
  statistical_outlier: "Anomalie statistique",
};

function norm(raw = "") {
  const u = raw.toUpperCase();
  return u === "HIGH" ? "HIGH" : u === "LOW" ? "LOW" : "MEDIUM";
}

function ValueChip({ value }) {
  if (value === undefined || value === null) return null;
  const text = typeof value === "object"
    ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join("  ·  ")
    : String(value);
  return (
    <span className="inline-block mt-2 text-[11px] font-mono px-2.5 py-1 rounded-lg"
      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#64748b" }}>
      {text}
    </span>
  );
}

function AnomalyCard({ anomaly, index }) {
  const sev = norm(anomaly.severity);
  const cfg = SEV_CONFIG[sev];
  const { Icon } = cfg;
  const message = anomaly.message ?? anomaly.description ?? "";
  const label = TYPE_LABELS[anomaly.type] ?? anomaly.type ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3, ease: "easeOut" }}
      whileHover={{ x: 3, transition: { duration: 0.15 } }}
      className="group relative rounded-xl overflow-hidden cursor-default"
      style={{ background: cfg.bgStyle, border: `1px solid ${cfg.borderStyle}` }}
    >
      <div className="absolute left-0 inset-y-0 w-[3px]" style={{ background: cfg.leftBar }} />
      <div className="pl-5 pr-4 py-4 flex gap-3.5 items-start">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: cfg.iconBg }}>
          <Icon size={15} style={{ color: cfg.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
              style={{ background: cfg.badgeBg, color: cfg.badgeColor }}>
              {cfg.label}
            </span>
            {label && <span className="text-[11px] font-medium" style={{ color: "#475569" }}>{label}</span>}
          </div>
          <p className="text-sm leading-relaxed" style={{ color: cfg.color }}>{message}</p>
          <ValueChip value={anomaly.value} />
        </div>
        <ChevronRight size={14} className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: cfg.color }} />
      </div>
    </motion.div>
  );
}

export default function AnomalyList({ anomalies }) {
  if (!anomalies || anomalies.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex items-center gap-3.5 p-5 rounded-xl"
        style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.1)" }}>
          <CheckCircle size={18} style={{ color: "#10b981" }} />
        </div>
        <div>
          <p className="font-semibold text-sm" style={{ color: "#10b981" }}>Aucune anomalie détectée</p>
          <p className="text-xs mt-0.5" style={{ color: "#059669" }}>Le document est conforme aux règles métier.</p>
        </div>
      </motion.div>
    );
  }

  const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sorted = [...anomalies].sort((a, b) => (order[norm(a.severity)] ?? 1) - (order[norm(b.severity)] ?? 1));

  return (
    <div className="space-y-2.5">
      {sorted.map((a, i) => <AnomalyCard key={i} anomaly={a} index={i} />)}
    </div>
  );
}
