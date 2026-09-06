import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, CheckCircle2, AlertCircle,
  ScanText, Tag, ShieldAlert, FileSearch, MessageSquare, Zap,
} from "lucide-react";
import { uploadDocument, analyzeDocument } from "../services/api";

const FEATURES = [
  { Icon: ScanText,      color: "#eef2ff", textColor: "#4f46e5", title: "Extraction OCR",      desc: "PaddleOCR extrait le texte avec haute précision." },
  { Icon: Tag,           color: "#eff6ff", textColor: "#1d4ed8", title: "Classification NLP",  desc: "Type de document identifié automatiquement."      },
  { Icon: ShieldAlert,   color: "#fffbeb", textColor: "#b45309", title: "Détection anomalies", desc: "Isolation Forest + SVM + règles métier."          },
  { Icon: FileSearch,    color: "#f0fdf4", textColor: "#15803d", title: "Résumé automatique",  desc: "Llama 3 génère une synthèse structurée."          },
  { Icon: MessageSquare, color: "#fdf4ff", textColor: "#7e22ce", title: "Chat RAG",            desc: "Interrogez vos documents en langage naturel."     },
];

const PIPELINE = ["Upload", "Extraction", "Classification", "Anomalies", "Résumé", "Rapport"];

export default function UploadPage() {
  const navigate  = useNavigate();
  const [file,     setFile]     = useState(null);
  const [status,   setStatus]   = useState("idle");
  const [stepIdx,  setStepIdx]  = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) { setFile(accepted[0]); setStatus("idle"); setErrorMsg(""); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "application/pdf": [".pdf"] }, maxFiles: 1,
  });

  const handleAnalyze = async () => {
    if (!file) return;
    setErrorMsg("");
    try {
      setStatus("uploading"); setStepIdx(0);
      const { data: doc } = await uploadDocument(file);
      setStatus("analyzing");
      const timer = setInterval(() => setStepIdx((i) => (i < PIPELINE.length - 2 ? i + 1 : i)), 500);
      await analyzeDocument(doc.id);
      clearInterval(timer);
      navigate(`/dashboard/${doc.id}`);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message);
      setStatus("error");
    }
  };

  const isLoading = status === "uploading" || status === "analyzing";

  return (
    <div className="space-y-8 max-w-2xl mx-auto">

      {/* ── Titre ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2 pt-2">
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
          Analysez votre document
        </h2>
        <p className="text-sm text-gray-500">
          Déposez une facture, un reçu ou un rapport financier pour lancer l'analyse IA.
        </p>
      </motion.div>

      {/* ── Zone de dépôt ── */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
        <div
          {...getRootProps()}
          className="relative cursor-pointer outline-none transition-all duration-200"
          style={{
            borderRadius: 28,
            padding: "52px 40px 44px",
            textAlign: "center",
            background: isDragActive
              ? "linear-gradient(135deg, #c4b5fd 0%, #a5b4fc 40%, #93c5fd 100%)"
              : "linear-gradient(135deg, #f9a8d4 0%, #c4b5fd 35%, #a5b4fc 65%, #93c5fd 100%)",
            border: `2px dashed ${isDragActive ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.7)"}`,
            boxShadow: "0 8px 32px rgba(167,139,250,0.18)",
          }}>
          <input {...getInputProps()} />
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div key="file" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.35)", backdropFilter: "blur(8px)" }}>
                  <FileText size={26} style={{ color: "#4338ca" }} />
                </div>
                <div>
                  <p className="font-semibold" style={{ color: "#1e1b4b" }}>{file.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(67,56,202,0.7)" }}>
                    {(file.size / 1024).toFixed(1)} KB · PDF
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); setStatus("idle"); }}
                  className="text-xs font-medium transition-colors"
                  style={{ color: "#dc2626" }}>
                  Supprimer le fichier
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-4">
                {/* Icône upload */}
                <motion.div
                  animate={isDragActive ? { scale: 1.15, y: -4 } : { scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                  <Upload size={40} style={{ color: "#3730a3" }} strokeWidth={2} />
                </motion.div>

                {/* Textes */}
                <div className="space-y-1.5">
                  <p className="text-base font-bold" style={{ color: "#1e1b4b" }}>
                    {isDragActive ? "Relâchez pour déposer" : "Choisissez un fichier ou glissez-le ici."}
                  </p>
                  <p className="text-xs font-medium" style={{ color: "rgba(67,56,202,0.65)" }}>
                    pdf uniquement · Max 20 Mo
                  </p>
                </div>

                {/* Bouton */}
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 px-7 py-2.5 rounded-full text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.55)",
                    backdropFilter: "blur(8px)",
                    color: "#3730a3",
                    border: "1px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 2px 8px rgba(99,102,241,0.15)",
                  }}>
                  Choisir un fichier
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bouton analyser */}
        <AnimatePresence>
          {file && !isLoading && (
            <motion.button
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={handleAnalyze}
              className="mt-4 w-full font-semibold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 text-white"
              style={{ background: "#6366f1", boxShadow: "0 4px 14px rgba(99,102,241,0.25)" }}>
              <Zap size={16} /> Lancer l'analyse multi-agents
            </motion.button>
          )}
        </AnimatePresence>

        {/* Progression */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-5 rounded-2xl p-5 bg-white border border-gray-200">
              <p className="text-xs font-semibold uppercase tracking-widest mb-4 text-brand-600">
                Pipeline en cours
              </p>
              <div className="space-y-3">
                {PIPELINE.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all duration-300"
                      style={
                        i < stepIdx  ? { background: "#d1fae5", color: "#047857" }
                        : i === stepIdx ? { background: "#6366f1", color: "#fff", boxShadow: "0 0 12px rgba(99,102,241,0.35)" }
                        : { background: "#f3f4f6", color: "#9ca3af" }
                      }>
                      {i < stepIdx ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <div
                        className="h-1 rounded-full transition-all duration-500"
                        style={
                          i < stepIdx  ? { background: "#10b981", width: "100%" }
                          : i === stepIdx ? { background: "#6366f1", width: "75%" }
                          : { background: "#e5e7eb", width: "100%" }
                        }
                      />
                    </div>
                    <span
                      className="text-xs font-medium w-24"
                      style={
                        i < stepIdx  ? { color: "#10b981" }
                        : i === stepIdx ? { color: "#6366f1" }
                        : { color: "#9ca3af" }
                      }>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Erreur */}
        <AnimatePresence>
          {status === "error" && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-3 p-4 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              {errorMsg || "Une erreur est survenue."}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Capacités ── */}
      <div>
        <p className="text-center text-[10px] font-semibold uppercase tracking-widest mb-5 text-gray-400">
          Capacités du pipeline
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
              whileHover={{ y: -2 }}
              className="rounded-xl p-4 flex flex-col items-center text-center gap-3 cursor-default bg-white border border-gray-200 transition-shadow hover:shadow-md">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: f.color }}>
                <f.Icon size={18} style={{ color: f.textColor }} />
              </div>
              <div>
                <p className="font-semibold text-xs text-gray-900">{f.title}</p>
                <p className="text-[11px] mt-1 leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
