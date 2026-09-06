import { motion } from "framer-motion";
import { useState } from "react";
import {
  FileText, ScanText, Brain, ShieldAlert, FileSearch,
  MessageSquare, BarChart3, Shield, ArrowRight, Sparkles,
  Upload, History, LayoutDashboard, Info, Mail, Menu, X, Zap,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Accueil",     Icon: LayoutDashboard },
  { label: "Analyser",    Icon: Upload          },
  { label: "Dashboard",   Icon: BarChart3       },
  { label: "Historique",  Icon: History         },
  { label: "Chat RAG",    Icon: MessageSquare   },
  { label: "À propos",    Icon: Info            },
  { label: "Contact",     Icon: Mail            },
];

const STATS = [
  { value: "1 / 4",  color: "#6366f1", title: "factures contiennent une erreur",          desc: "Montants incohérents, TVA incorrecte, champs manquants — non détectés manuellement." },
  { value: "+6h",    color: "#8b5cf6", title: "de vérification manuelle par semaine",      desc: "Le temps perdu à vérifier ce qu'une IA peut analyser en moins de 30 secondes." },
  { value: "😕",     color: "#64748b", title: "des chiffres illisibles dans les outils",   desc: "Les scores bruts que ni les comptables ni les managers ne comprennent." },
];

const STEPS = [
  { num: "01", label: "CAPTEUR",    title: "Extraction OCR",       desc: "PaddleOCR extrait le texte des PDFs — natif ou scanné — avec une haute précision.",           Icon: ScanText    },
  { num: "02", label: "CERVEAU",    title: "Classification NLP",   desc: "Facture, reçu, bon de commande, rapport — le type est identifié automatiquement.",           Icon: Brain       },
  { num: "03", label: "ANALYSE IA", title: "Détection anomalies",  desc: "Isolation Forest + SVM + règles métier fusionnés en un score de risque composite 0–100.",    Icon: ShieldAlert },
  { num: "04", label: "ACTION",     title: "Rapport intelligent",  desc: "Llama 3 génère un résumé narratif structuré avec montants clés et points d'attention.",      Icon: FileSearch  },
];

const FEATURES = [
  { Icon: MessageSquare, title: "Chat RAG",          desc: "Posez des questions sur vos documents en langage naturel. ChromaDB + Llama 3 répondent avec précision." },
  { Icon: FileSearch,    title: "Résumé narratif",   desc: "Un rapport lisible qui raconte la situation financière au lieu d'afficher des chiffres bruts." },
  { Icon: BarChart3,     title: "Score de risque",   desc: "Un score calibré 0–100 calculé via un modèle ML composite et des règles métier financières." },
  { Icon: Shield,        title: "Alertes anomalies", desc: "Anomalies priorisées : total incohérent, champ manquant, TVA incorrecte — sans jargon technique." },
];

export default function LandingPage({ onLogin }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans">

      {/* ══════════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <FileText size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">FinDoc</span>
          </div>

          {/* Nav links — desktop */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
            {NAV_LINKS.map(({ label, Icon }) => (
              <button
                key={label}
                className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                <Icon size={14} />
                {label}
              </button>
            ))}
          </div>

          {/* Se connecter */}
          <div className="flex items-center gap-2">
            <button
              onClick={onLogin}
              className="hidden sm:flex items-center gap-1.5 text-sm font-bold px-4 py-2 rounded-xl text-white transition-all hover:opacity-90 hover:scale-105"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <ArrowRight size={15} /> Se connecter
            </button>
            <button className="lg:hidden p-2 text-gray-500" onClick={() => setMenuOpen(v => !v)}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-1">
            {NAV_LINKS.map(({ label, Icon }) => (
              <button key={label}
                className="w-full flex items-center gap-2 text-sm font-medium px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <Icon size={15} /> {label}
              </button>
            ))}
            <button onClick={() => { setMenuOpen(false); onLogin(); }}
              className="w-full mt-2 flex items-center justify-center gap-2 text-sm font-bold px-4 py-2.5 rounded-xl text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              <ArrowRight size={15} /> Se connecter
            </button>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════
          HERO — fond blanc, texte sombre
      ══════════════════════════════════════════ */}
      <section className="pt-36 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-semibold"
            style={{ background: "rgba(99,102,241,0.08)", color: "#6366f1", border: "1px solid rgba(99,102,241,0.2)" }}>
            <Sparkles size={14} /> Plateforme IA Nouvelle Génération
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="text-5xl sm:text-6xl font-black text-gray-900 mb-3 leading-tight">
            FinDoc Analyzer
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
            className="text-4xl sm:text-5xl font-black mb-6"
            style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Anomalies & Intelligence
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-base text-gray-500 leading-relaxed mb-3 max-w-xl mx-auto">
            La solution complète pour analyser vos documents financiers et détecter les anomalies automatiquement.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="text-base text-gray-500 leading-relaxed mb-10 max-w-xl mx-auto">
            Uploadez vos factures, bons de commande et rapports. Laissez l'IA faire le reste.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onLogin}
              className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl text-white transition-all hover:scale-105 hover:shadow-lg"
              style={{ background: "#6366f1", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}>
              Analyser un document <Upload size={15} />
            </button>
            <button
              onClick={onLogin}
              className="flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl text-white transition-all hover:scale-105"
              style={{ background: "#10b981", boxShadow: "0 4px 14px rgba(16,185,129,0.3)" }}>
              Voir le Dashboard <LayoutDashboard size={15} />
            </button>
            <button
              onClick={() => document.getElementById("section-steps")?.scrollIntoView({ behavior: "smooth" })}
              className="flex items-center gap-2 text-sm font-semibold px-6 py-3 rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all hover:scale-105">
              Comment ça marche <ArrowRight size={15} />
            </button>
          </motion.div>

          {/* Label page */}
          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="mt-14 text-lg font-black text-gray-400">
            — Page D'Accueil —
          </motion.p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS — fond gris très clair
      ══════════════════════════════════════════ */}
      <section className="py-16 px-6" style={{ background: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest mb-2 text-indigo-500">
            LE PROBLÈME
          </p>
          <h2 className="text-center text-3xl font-black text-gray-900 mb-2">
            On agit toujours trop tard.
          </h2>
          <p className="text-center text-sm text-gray-400 max-w-lg mx-auto mb-10">
            Les anomalies financières existent depuis des semaines avant d'être détectées.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STATS.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <p className="text-4xl font-black mb-1" style={{ color: s.color }}>{s.value}</p>
                <p className="font-bold text-gray-800 text-sm mb-1.5">{s.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ÉTAPES — fond indigo sombre
      ══════════════════════════════════════════ */}
      <section id="section-steps" className="py-16 px-6" style={{ background: "#1e1b4b" }}>
        <div className="max-w-5xl mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest mb-2 text-amber-400">
            COMMENT ÇA MARCHE
          </p>
          <h2 className="text-center text-3xl font-black text-white mb-2">
            Du document brut au rapport intelligent.
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: "rgba(165,180,252,0.6)" }}>
            Quatre étapes, une seule promesse : rendre l'invisible compréhensible.
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map((s, i) => (
              <motion.div key={s.num}
                initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="relative rounded-2xl p-5"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(99,102,241,0.25)" }}>
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:flex absolute top-9 -right-2.5 z-10 w-5 h-5 rounded-full items-center justify-center"
                    style={{ background: "rgba(99,102,241,0.2)" }}>
                    <ArrowRight size={11} className="text-indigo-400" />
                  </div>
                )}
                <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-amber-400">
                  {s.num} — {s.label}
                </p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: "rgba(99,102,241,0.2)" }}>
                  <s.Icon size={18} className="text-indigo-300" />
                </div>
                <p className="font-bold text-white text-sm mb-1.5">{s.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(148,163,184,0.65)" }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURES IA — fond blanc
      ══════════════════════════════════════════ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-black uppercase tracking-widest mb-2 text-indigo-500">
            LA COUCHE IA
          </p>
          <h2 className="text-center text-3xl font-black text-gray-900 mb-2">
            Une intelligence qui parle humain.
          </h2>
          <p className="text-center text-sm text-gray-400 max-w-md mx-auto mb-10">
            Le bon message, au bon format, pour la bonne personne.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.09 }}
                className="relative rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow bg-white">
                <span className="absolute top-4 right-4 text-[11px] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: "#ede9fe", color: "#7c3aed" }}>
                  + IA générative
                </span>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: "#ede9fe" }}>
                  <f.Icon size={20} style={{ color: "#7c3aed" }} />
                </div>
                <p className="font-bold text-gray-900 mb-2">{f.title}</p>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════ */}
      <section className="py-20 px-6 text-center" style={{ background: "#f0f0ff" }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-4xl font-black text-gray-900 mb-3">
            Prêt à analyser vos<br />
            <span style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              documents financiers ?
            </span>
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Connectez-vous et déposez votre premier PDF. Le pipeline multi-agents s'occupe du reste.
          </p>
          <button
            onClick={onLogin}
            className="inline-flex items-center gap-2 text-sm font-bold px-8 py-4 rounded-xl text-white transition-all hover:scale-105 hover:shadow-xl"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 4px 20px rgba(99,102,241,0.35)" }}>
            <Zap size={16} /> Commencer l'analyse
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-300 bg-white border-t border-gray-100">
        FinDoc Analyzer · Multi-Agent AI System · Financial Document Intelligence
      </footer>
    </div>
  );
}
