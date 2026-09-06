import { motion } from "framer-motion";

const LEVELS = [
  { max: 0.3, label: "Faible", color: "#047857", glow: "rgba(16,185,129,0.2)",  bg: "#f0fdf4", border: "#a7f3d0" },
  { max: 0.7, label: "Modéré", color: "#b45309", glow: "rgba(245,158,11,0.2)",  bg: "#fffbeb", border: "#fde68a" },
  { max: 1.0, label: "Élevé",  color: "#b91c1c", glow: "rgba(239,68,68,0.2)",   bg: "#fef2f2", border: "#fecaca" },
];
const getLevel = (s) => LEVELS.find((l) => s <= l.max) ?? LEVELS[LEVELS.length - 1];

const SCALE_BARS = [
  { label: "0 – 30 %",  name: "Faible", color: "#10b981" },
  { label: "30 – 70 %", name: "Modéré", color: "#f59e0b" },
  { label: "> 70 %",    name: "Élevé",  color: "#ef4444" },
];

const CX = 110, CY = 105, R = 88;
const TRACK = `M ${CX - R},${CY} A ${R},${R} 0 0,1 ${CX + R},${CY}`;

export default function RiskGauge({ score }) {
  const level = getLevel(score);
  const pct   = Math.round(score * 100);

  return (
    <div className="flex flex-col items-center gap-5">

      {/* SVG Arc Gauge */}
      <div className="relative w-full max-w-[240px]">
        <svg viewBox="0 0 220 120" className="w-full overflow-visible">
          <defs>
            <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={level.color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={level.color} stopOpacity="1" />
            </linearGradient>
            <filter id="arc-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Track */}
          <path d={TRACK} fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round" />

          {/* Fill */}
          <motion.path
            d={TRACK}
            fill="none"
            stroke="url(#arc-grad)"
            strokeWidth="14"
            strokeLinecap="round"
            filter="url(#arc-glow)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: score, opacity: 1 }}
            transition={{
              pathLength: { duration: 1.4, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 },
              opacity:    { duration: 0.3 },
            }}
          />

          <motion.text x={CX} y={CY - 14} textAnchor="middle" dominantBaseline="middle"
            fill={level.color} fontSize="38" fontWeight="800" fontFamily="Inter, system-ui, sans-serif"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.4 }}>
            {pct}%
          </motion.text>

          <motion.text x={CX} y={CY + 10} textAnchor="middle"
            fill="#94a3b8" fontSize="10" fontFamily="Inter, system-ui, sans-serif"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
            score de risque
          </motion.text>
        </svg>
      </div>

      {/* Level badge */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.45, duration: 0.3 }}
        className="flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm border"
        style={{ background: level.bg, borderColor: level.border, color: level.color }}>
        <span className="w-2.5 h-2.5 rounded-full" style={{ background: level.color }} />
        Risque {level.label}
      </motion.div>

      {/* Scale bars */}
      <div className="w-full space-y-2.5 pt-3 border-t border-gray-100">
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-3 text-gray-400">Seuils</p>
        {SCALE_BARS.map((bar, i) => {
          const active = getLevel(score).label === bar.name;
          return (
            <div key={bar.name} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-300"
                style={{ background: bar.color, opacity: active ? 1 : 0.3, transform: active ? "scale(1.4)" : "scale(1)" }} />
              <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-gray-100">
                <motion.div className="h-full rounded-full"
                  style={{ background: bar.color, opacity: active ? 1 : 0.2 }}
                  initial={{ width: 0 }}
                  animate={{ width: active ? "100%" : "12%" }}
                  transition={{ duration: 0.7, delay: 0.4 + i * 0.1, ease: "easeOut" }} />
              </div>
              <span className="text-[11px] font-medium tabular-nums w-16 text-right"
                style={{ color: active ? "#6b7280" : "#94a3b8" }}>
                {bar.label}
              </span>
              <span className="text-[11px] font-semibold w-12"
                style={{ color: active ? bar.color : "#cbd5e1" }}>
                {bar.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
