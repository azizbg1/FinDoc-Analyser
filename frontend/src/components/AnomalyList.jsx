import { motion } from "framer-motion";
import { AlertTriangle, AlertOctagon, Info, CheckCircle, ChevronRight } from "lucide-react";

const SEV_CONFIG = {
  HIGH: {
    label: "Critique", Icon: AlertOctagon,
    color: "#b91c1c", bg: "#fef2f2", border: "#fecaca",
    badgeBg: "#fee2e2", badgeColor: "#991b1b",
    iconBg: "#fef2f2", leftBar: "#ef4444",
  },
  MEDIUM: {
    label: "Modérée", Icon: AlertTriangle,
    color: "#b45309", bg: "#fffbeb", border: "#fde68a",
    badgeBg: "#fef3c7", badgeColor: "#92400e",
    iconBg: "#fffbeb", leftBar: "#f59e0b",
  },
  LOW: {
    label: "Faible", Icon: Info,
    color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe",
    badgeBg: "#dbeafe", badgeColor: "#1e40af",
    iconBg: "#eff6ff", leftBar: "#3b82f6",
  },
};

const TYPE_LABELS = {
  missing_field:            "Champ manquant",
  total_inconsistency:      "Incohérence de total",
  line_total_error:         "Erreur total de ligne",
  negative_amount:          "Montant négatif",
  zero_amount:              "Montant nul",
  missing_tva:              "TVA absente",
  total_less_than_subtotal: "Total < Sous-total",
  invoice_number_format:    "Format numéro de facture",
  statistical_outlier:      "Anomalie statistique",
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
    <span className="inline-block mt-2 text-[11px] font-mono px-2.5 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-600">
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
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
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
            {label && <span className="text-[11px] font-medium text-gray-500">{label}</span>}
          </div>
          <p className="text-sm leading-relaxed font-medium" style={{ color: cfg.color }}>{message}</p>
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
        className="flex items-center gap-3.5 p-5 rounded-xl bg-emerald-50 border border-emerald-200">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100">
          <CheckCircle size={18} className="text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-sm text-emerald-800">Aucune anomalie détectée</p>
          <p className="text-xs mt-0.5 text-emerald-600">Le document est conforme aux règles métier.</p>
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
