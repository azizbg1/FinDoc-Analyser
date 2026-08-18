import { useState, useRef, useEffect } from "react";
import { Sun, Moon, Bell, LogOut, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bonne après-midi";
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
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 p-1 transition-colors">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
          {initials}
        </div>
        <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-gray-50 dark:border-slate-800">
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{user?.name || "Utilisateur"}</p>
              <p className="text-xs text-gray-400 dark:text-slate-500 truncate">{user?.email || ""}</p>
              <span className="inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-800">
                {user?.role || "Analyste"}
              </span>
            </div>

            {/* Logout */}
            <button onClick={() => { setOpen(false); logout(); }}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium">
              <LogOut size={15} /> Se déconnecter
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Header() {
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center px-6 gap-4 sticky top-0 z-20 backdrop-blur-sm bg-white/95 dark:bg-slate-900/95">

      {/* Title block */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-bold text-gray-900 dark:text-white leading-none truncate">
          Financial Document Intelligence System
        </h1>
        <p className="text-xs text-brand-500 dark:text-brand-400 font-medium mt-0.5 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse inline-block" />
          Multi-Agent AI · RAG · NLP
        </p>
      </div>

      {/* Date */}
      <div className="hidden md:flex flex-col items-end text-xs text-gray-400 dark:text-slate-500 leading-tight">
        <span className="font-medium">{getGreeting()}</span>
        <span className="capitalize">{formatDate()}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors relative">
          <Bell size={17} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500" />
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={toggle}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-yellow-400 transition-colors"
          title={dark ? "Mode clair" : "Mode sombre"}
        >
          {dark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* User menu */}
        <UserMenu user={user} logout={logout} />
      </div>
    </header>
  );
}
