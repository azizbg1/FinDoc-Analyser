import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Upload, History, MessageSquare,
  Settings, FileText, ChevronLeft, Sparkles,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

const NAV_ITEMS = [
  { to: "/",        label: "Dashboard",  Icon: LayoutDashboard, end: true  },
  { to: "/upload",  label: "Analyser",   Icon: Upload,          end: true  },
  { to: "/history", label: "Historique", Icon: History,         end: false },
  { to: "/chat/1",  label: "Chat RAG",   Icon: MessageSquare,   end: false },
];

export default function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed left-0 top-0 h-screen z-30 flex flex-col overflow-hidden"
      style={{ background: "linear-gradient(160deg, #ffffff 0%, #f5f3ff 55%, #fdf4ff 100%)" }}
    >
      {/* Right border */}
      <div className="absolute inset-y-0 right-0 w-px"
        style={{ background: "linear-gradient(to bottom, rgba(139,92,246,0.2), rgba(99,102,241,0.1) 60%, transparent)" }} />

      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 40% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />

      {/* ── Logo ── */}
      <div className="h-16 flex items-center px-[18px] flex-shrink-0 relative">
        {collapsed ? (
          <button
            onClick={toggle}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.30)",
            }}
            title="Ouvrir le menu"
          >
            <FileText size={17} className="text-white" strokeWidth={2.5} />
          </button>
        ) : (
          <>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                boxShadow: "0 4px 14px rgba(99,102,241,0.30)",
              }}>
              <FileText size={17} className="text-white" strokeWidth={2.5} />
            </div>
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
              className="ml-3 flex-1 overflow-hidden"
            >
              <p className="text-[15px] font-bold leading-none whitespace-nowrap tracking-tight"
                style={{ color: "#1e1b4b" }}>FinDoc</p>
              <p className="text-[11px] font-semibold leading-none mt-1 whitespace-nowrap"
                style={{ color: "#7c3aed" }}>Analyzer AI</p>
            </motion.div>
            <button
              onClick={toggle}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0"
              style={{ color: "#a5b4fc" }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(99,102,241,0.08)"; e.currentTarget.style.color = "#6366f1"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a5b4fc"; }}
              title="Réduire le menu"
            >
              <ChevronLeft size={15} />
            </button>
          </>
        )}
      </div>

      {/* ── AI Badge ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, delay: 0.05 }}
            className="mx-3 mb-4"
          >
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.06) 100%)",
                border: "1px solid rgba(139,92,246,0.18)",
              }}>
              <Sparkles size={12} style={{ color: "#8b5cf6" }} />
              <span className="text-[11px] font-semibold whitespace-nowrap" style={{ color: "#6d28d9" }}>
                Multi-Agent AI System
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Section label ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.14 }}
            className="px-5 mb-1.5 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "#c4b5fd" }}
          >
            Navigation
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-[11px] rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive ? "" : "hover:text-indigo-700"
              }`
            }
            style={({ isActive }) => isActive ? {
              background: "linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(139,92,246,0.08) 100%)",
              border: "1px solid rgba(99,102,241,0.22)",
              color: "#4f46e5",
            } : {
              border: "1px solid transparent",
              color: "#64748b",
            }}
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: isActive ? "#6366f1" : "#94a3b8" }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="whitespace-nowrap overflow-hidden flex-1"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && !collapsed && (
                  <motion.div
                    layoutId="nav-pill"
                    className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-2.5 pb-4 flex-shrink-0">
        <div className="pt-3 space-y-0.5"
          style={{ borderTop: "1px solid rgba(99,102,241,0.12)" }}>
          <NavLink
            to="/settings"
            className="group flex items-center gap-3 px-3 py-[11px] rounded-xl text-sm font-medium transition-all"
            style={({ isActive }) => ({
              border: "1px solid transparent",
              color: isActive ? "#4f46e5" : "#94a3b8",
              background: isActive ? "rgba(99,102,241,0.08)" : "transparent",
            })}
          >
            <Settings size={17} className="flex-shrink-0" style={{ color: "#c4b5fd" }} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.14 }}
                  className="whitespace-nowrap">
                  Paramètres
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        </div>

      </div>
    </motion.aside>
  );
}
