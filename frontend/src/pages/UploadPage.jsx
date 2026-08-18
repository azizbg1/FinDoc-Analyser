import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, CheckCircle2, AlertCircle, ScanText, Tag, ShieldAlert, FileSearch, MessageSquare } from "lucide-react";
import { uploadDocument, analyzeDocument } from "../services/api";

const FEATURES = [
  { Icon: ScanText,    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400", title: "Extraction OCR",        desc: "PaddleOCR extrait le texte de vos PDFs avec une haute précision." },
  { Icon: Tag,         color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",         title: "Classification NLP",     desc: "Facture, bon de commande, reçu ou rapport — identifié automatiquement." },
  { Icon: ShieldAlert, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400", title: "Détection d'anomalies",  desc: "Isolation Forest + SVM + LOF + règles métier financières." },
  { Icon: FileSearch,  color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400", title: "Résumé automatique",  desc: "Llama 3 génère une synthèse structurée avec montants et points d'attention." },
  { Icon: MessageSquare, color: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400",       title: "Chat RAG",               desc: "Interrogez vos documents via ChromaDB + sentence-transformers." },
];

const STEPS = ["Upload", "Extraction", "Classification", "Anomalies", "Résumé", "Rapport"];

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: "easeOut" } }),
};

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
      const timer = setInterval(() => setStepIdx((i) => (i < STEPS.length - 2 ? i + 1 : i)), 500);
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
    <div className="space-y-10">

      {/* ── Hero ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="text-center space-y-3 pt-2">
        <span className="inline-flex items-center gap-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 text-xs font-semibold px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-700">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse inline-block" />
          Architecture multi-agents · NLP + RAG
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Analysez vos documents
          <span className="block bg-gradient-to-r from-brand-600 to-violet-500 bg-clip-text text-transparent">
            financiers avec l'IA
          </span>
        </h2>
        <p className="text-gray-500 dark:text-slate-400 max-w-lg mx-auto text-sm leading-relaxed">
          Déposez une facture, un reçu ou un rapport financier. Le pipeline multi-agents
          extrait, classe, détecte les anomalies et génère un rapport complet en quelques secondes.
        </p>
      </motion.div>

      {/* ── Drop zone ── */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35, delay: 0.1 }}
        className="max-w-xl mx-auto">
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 ${
            isDragActive  ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-glow scale-[1.01]"
            : file        ? "border-brand-300 dark:border-brand-700 bg-brand-50/60 dark:bg-brand-900/10"
            :               "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-brand-400 hover:bg-brand-50/30 dark:hover:bg-brand-900/10 hover:shadow-md"
          }`}
        >
          <input {...getInputProps()} />
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div key="file" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center shadow-md">
                  <FileText size={26} className="text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white text-sm">{file.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{(file.size / 1024).toFixed(1)} KB · PDF</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setFile(null); setStatus("idle"); }}
                  className="text-xs text-red-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                  Supprimer le fichier
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${
                  isDragActive ? "bg-brand-200 dark:bg-brand-800" : "bg-gray-100 dark:bg-slate-800"}`}>
                  <Upload size={28} className={isDragActive ? "text-brand-600" : "text-gray-400 dark:text-slate-500"} />
                </div>
                <div>
                  <p className="font-semibold text-gray-700 dark:text-slate-200">
                    {isDragActive ? "Relâchez pour déposer" : "Déposez votre document ici"}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">
                    ou <span className="text-brand-600 dark:text-brand-400 font-medium">cliquez pour sélectionner un PDF</span>
                  </p>
                  <p className="text-xs text-gray-300 dark:text-slate-600 mt-2">PDF uniquement · Taille max 20 Mo</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Analyze button */}
        <AnimatePresence>
          {file && !isLoading && (
            <motion.button
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={handleAnalyze}
              className="mt-4 w-full bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 text-white font-semibold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 text-sm flex items-center justify-center gap-2"
            >
              <ScanText size={16} />
              Lancer l'analyse multi-agents
            </motion.button>
          )}
        </AnimatePresence>

        {/* Progress */}
        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-4">Pipeline en cours</p>
              <div className="space-y-2.5">
                {STEPS.map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 text-xs font-bold ${
                      i < stepIdx  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400"
                      : i === stepIdx ? "bg-brand-600 text-white ring-4 ring-brand-100 dark:ring-brand-900/40"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600"
                    }`}>
                      {i < stepIdx ? <CheckCircle2 size={14} /> : i + 1}
                    </div>
                    <div className="flex-1">
                      <div className={`h-1 rounded-full transition-all duration-500 ${
                        i < stepIdx ? "bg-emerald-400 dark:bg-emerald-600 w-full"
                        : i === stepIdx ? "bg-brand-500 w-3/4 animate-pulse"
                        : "bg-gray-100 dark:bg-slate-800 w-full"
                      }`} />
                    </div>
                    <span className={`text-xs font-medium w-24 ${
                      i < stepIdx ? "text-emerald-600 dark:text-emerald-400"
                      : i === stepIdx ? "text-brand-600 dark:text-brand-400"
                      : "text-gray-300 dark:text-slate-600"
                    }`}>{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {status === "error" && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 p-4 rounded-xl text-sm">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              {errorMsg || "Une erreur est survenue."}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Feature grid ── */}
      <div>
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-slate-600 mb-6">
          Capacités du système
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} custom={i} variants={cardVariants} initial="hidden" animate="visible"
              whileHover={{ y: -3, boxShadow: "0 8px 24px 0 rgb(0 0 0 / .10)" }}
              className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col items-center text-center gap-3 cursor-default">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${f.color}`}>
                <f.Icon size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-800 dark:text-white">{f.title}</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
