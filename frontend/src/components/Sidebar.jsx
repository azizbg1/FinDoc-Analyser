import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, History, MessageSquare,
  Settings, FileText, ChevronLeft, Sparkles, LayoutDashboard, TrendingUp,
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";

const NAV_ITEMS = [
  { to: "/",            label: "Dashboard",   Icon: LayoutDashboard, end: true  },
  { to: "/upload",      label: "Analyser",    Icon: Upload,          end: true  },
  { to: "/history",     label: "Historique",  Icon: History,         end: false },
  { to: "/predictions", label: "Prédictions", Icon: TrendingUp,      end: false },
  { to: "/chat/1",      label: "Chat RAG",    Icon: MessageSquare,   end: false },
];

export default function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="fixed left-0 top-0 h-screen z-30 flex flex-col overflow-hidden bg-white border-r border-gray-200">

      {/* ── Logo ── */}
      <div className="h-14 flex items-center px-3.5 flex-shrink-0 border-b border-gray-100 gap-2.5">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)" }}>
          {collapsed ? (
            <button
              onClick={toggle}
              className="w-full h-full rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
              title="Ouvrir le menu">
              <FileText size={15} className="text-white" strokeWidth={2.5} />
            </button>
          ) : (
            <FileText size={15} className="text-white" strokeWidth={2.5} />
          )}
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.18 }}
              className="flex-1 overflow-hidden">
              <p className="text-[14px] font-bold leading-none whitespace-nowrap tracking-tight text-gray-900">
                FinDoc
              </p>
              <p className="text-[10px] font-semibold leading-none mt-1 whitespace-nowrap text-brand-500">
                Analyzer AI
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.14 }}
              onClick={toggle}
              className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Réduire le menu">
              <ChevronLeft size={14} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* ── AI Chip ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, delay: 0.04 }}
            className="mx-3 mt-3 mb-1">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-50 border border-brand-100">
              <Sparkles size={11} className="text-brand-500 flex-shrink-0" />
              <span className="text-[11px] font-medium whitespace-nowrap text-brand-600">
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
            className="px-4 mt-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Navigation
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden py-1">
        {NAV_ITEMS.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className="group relative flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150"
            style={({ isActive }) => isActive
              ? { background: "#eef2ff", color: "#4f46e5" }
              : { color: "#6b7280" }
            }
            onMouseEnter={(e) => {
              if (!e.currentTarget.style.background.includes("#eef2ff")) {
                e.currentTarget.style.background = "#f9fafb";
                e.currentTarget.style.color = "#374151";
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.style.background.includes("#eef2ff")) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "#6b7280";
              }
            }}>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 inset-y-2 w-[3px] rounded-r-full bg-brand-500" />
                )}
                <Icon
                  size={16}
                  className="flex-shrink-0 transition-colors"
                  style={{ color: isActive ? "#6366f1" : "#9ca3af" }}
                />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="whitespace-nowrap overflow-hidden flex-1">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="px-2 pb-4 flex-shrink-0 border-t border-gray-100 pt-2">
        <NavLink
          to="/settings"
          className="group flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-sm font-medium transition-all"
          style={({ isActive }) => ({
            background: isActive ? "#eef2ff" : "transparent",
            color:      isActive ? "#4f46e5" : "#6b7280",
          })}>
          <Settings size={16} className="flex-shrink-0 text-gray-400" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.14 }}
                className="whitespace-nowrap">
                Paramètres
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
      </div>
    </motion.aside>
  );
}
