import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Bot, User, Zap, Link2 } from "lucide-react";
import { sendChat } from "../services/api";

const SUGGESTIONS = [
  "Quel est le montant total TTC ?",
  "Quelles anomalies ont été détectées ?",
  "Quelle est la date d'échéance ?",
  "Qui est le fournisseur ?",
  "Y a-t-il des incohérences de TVA ?",
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <span className="dot text-gray-400" />
      <span className="dot text-gray-400" />
      <span className="dot text-gray-400" />
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  scale: 1 }}
      transition={{ duration: 0.25 }}
      className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
        isUser ? "bg-gradient-to-br from-slate-600 to-slate-800" : "bg-gradient-to-br from-brand-600 to-violet-600"}`}>
        {isUser ? <User size={15} className="text-white" /> : <Bot size={15} className="text-white" />}
      </div>

      {/* Bubble */}
      <div className={`max-w-[76%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
        isUser      ? "bg-brand-600 text-white rounded-br-sm"
        : msg.error ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-bl-sm"
        :             "bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-800 dark:text-slate-200 rounded-bl-sm"
      }`}>
        <p className="whitespace-pre-line">{msg.text}</p>
        {msg.sources?.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-gray-100 dark:border-slate-700 flex flex-wrap gap-1.5">
            {msg.sources.map((s, i) => (
              <span key={i} className="inline-flex items-center gap-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-xs px-2 py-0.5 rounded-full border border-brand-100 dark:border-brand-800">
                <Link2 size={9} /> {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const GREETING = {
  role: "assistant",
  text: "Bonjour ! Je suis votre assistant FinDoc.\nPosez-moi une question sur ce document financier — montants, dates, anomalies, parties impliquées…",
};

export default function ChatPage() {
  const { id }  = useParams();
  const [messages, setMessages] = useState([GREETING]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef  = useRef(null);
  const textareaRef = useRef(null);

  // Reset chat when navigating to a different document — no cross-document history.
  useEffect(() => {
    setMessages([GREETING]);
    setInput("");
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setMessages((p) => [...p, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await sendChat(Number(id), q);
      setMessages((p) => [...p, { role: "assistant", text: data.answer, sources: data.sources ?? [] }]);
    } catch (err) {
      setMessages((p) => [...p, { role: "assistant", text: `Erreur : ${err.response?.data?.detail || err.message}`, error: true }]);
    } finally {
      setLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const onlyGreeting = messages.length === 1;

  return (
    <div className="flex flex-col h-[calc(100vh-7.5rem)] max-w-3xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/dashboard/${id}`}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 bg-gray-100 dark:bg-slate-800 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-3 py-2 rounded-xl transition-colors font-medium">
          <ArrowLeft size={14} /> Tableau de bord
        </Link>
        <div className="flex items-center gap-2.5 ml-1">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center shadow-sm">
            <Bot size={16} className="text-white" />
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold text-gray-900 dark:text-white">FinDoc RAG</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">Document #{id}</p>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
          <Zap size={11} className="fill-current" /> RAG · ChromaDB
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto space-y-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs">

        {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-end gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-600 to-violet-600 flex items-center justify-center">
              <Bot size={15} className="text-white" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-bl-sm shadow-xs px-3 py-2">
              <TypingDots />
            </div>
          </motion.div>
        )}

        {/* Suggestions */}
        <AnimatePresence>
          {onlyGreeting && !loading && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => { setInput(s); textareaRef.current?.focus(); }}
                  className="text-xs text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20 hover:bg-brand-100 dark:hover:bg-brand-900/30 border border-brand-100 dark:border-brand-800 px-3 py-1.5 rounded-full transition-colors font-medium">
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div className="mt-3 flex gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-2 shadow-xs focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-300 dark:focus-within:border-brand-600 transition-all">
        <textarea ref={textareaRef} rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
          placeholder="Posez votre question… (Entrée pour envoyer)"
          className="flex-1 bg-transparent px-3 py-2 text-sm resize-none focus:outline-none text-gray-800 dark:text-slate-200 placeholder:text-gray-400 dark:placeholder:text-slate-600"
        />
        <button onClick={handleSend} disabled={!input.trim() || loading}
          className="self-end flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow-md">
          <Send size={15} /> Envoyer
        </button>
      </div>
    </div>
  );
}
