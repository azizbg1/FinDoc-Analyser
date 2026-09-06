import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function formatDate() {
  return new Date().toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function UserMenu({ user, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-gray-100"
        aria-label="Menu utilisateur"
        aria-expanded={open}>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
          {initials}
        </div>
        <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[96px] truncate">
          {user?.name || "Utilisateur"}
        </span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 rounded-xl shadow-lg overflow-hidden z-50 bg-white border border-gray-200">

            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900 truncate">{user?.name || "Utilisateur"}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{user?.email || ""}</p>
              <span className="inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                {user?.role || "Analyste"}
              </span>
            </div>

            <button
              onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              <LogOut size={15} /> Se déconnecter
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-14 flex items-center px-6 gap-4 sticky top-0 z-20 bg-white border-b border-gray-200">

      {/* Titre */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-gray-900 leading-none tracking-tight truncate">
          Financial Document Intelligence
        </h1>
        <p className="text-[11px] text-gray-400 mt-0.5 font-medium">
          Multi-Agent AI · RAG · NLP
        </p>
      </div>

      {/* Date */}
      <div className="hidden md:flex flex-col items-end leading-tight">
        <span className="text-xs font-medium text-gray-500">{getGreeting()}</span>
        <span className="text-[11px] text-gray-400 capitalize">{formatDate()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          className="w-9 h-9 rounded-lg flex items-center justify-center relative text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Notifications">
          <Bell size={17} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400" />
        </button>
        <UserMenu user={user} logout={logout} />
      </div>
    </header>
  );
}
