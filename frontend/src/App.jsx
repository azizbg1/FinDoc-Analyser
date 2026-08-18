import { Routes, Route, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ThemeProvider }   from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import Sidebar       from "./components/Sidebar";
import Header        from "./components/Header";
import UploadPage    from "./pages/UploadPage";
import DashboardPage from "./pages/DashboardPage";
import ChatPage      from "./pages/ChatPage";
import HistoryPage   from "./pages/HistoryPage";
import LoginPage     from "./pages/LoginPage";

// Force a full unmount+remount when the document id changes.
// Without key, React reuses the component instance and useState keeps the
// previous document's data visible for one frame before useEffect resets it.
function DashboardRoute() {
  const { id } = useParams();
  return <DashboardPage key={id} />;
}

function ChatRoute() {
  const { id } = useParams();
  return <ChatPage key={id} />;
}

function Layout({ children }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-dark">
      <Sidebar />
      <motion.div
        className="flex-1 flex flex-col min-w-0"
        animate={{ marginLeft: collapsed ? 72 : 260 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-6 py-7">
            {children}
          </div>
        </main>
      </motion.div>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<UploadPage />}    />
        <Route path="/upload"        element={<UploadPage />}    />
        <Route path="/dashboard/:id" element={<DashboardRoute />} />
        <Route path="/chat/:id"      element={<ChatRoute />}     />
        <Route path="/history"       element={<HistoryPage />}   />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <AppRoutes />
        </SidebarProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
