import { Routes, Route, useParams } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import Sidebar       from "./components/Sidebar";
import Header        from "./components/Header";
import UploadPage     from "./pages/UploadPage";
import DashboardHome  from "./pages/DashboardHome";
import DashboardPage  from "./pages/DashboardPage";
import ChatPage      from "./pages/ChatPage";
import HistoryPage     from "./pages/HistoryPage";
import PredictivePage  from "./pages/PredictivePage";
import LoginPage       from "./pages/LoginPage";
import LandingPage     from "./pages/LandingPage";

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
    <div className="flex h-screen overflow-hidden bg-gray-50">
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
  const [showLogin, setShowLogin] = useState(false);

  if (!isAuthenticated) {
    if (showLogin) return <LoginPage />;
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/"              element={<DashboardHome />} />
        <Route path="/upload"        element={<UploadPage />}    />
        <Route path="/dashboard/:id" element={<DashboardRoute />} />
        <Route path="/chat/:id"      element={<ChatRoute />}     />
        <Route path="/history"       element={<HistoryPage />}     />
        <Route path="/predictions"   element={<PredictivePage />}  />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
        <AppRoutes />
      </SidebarProvider>
    </AuthProvider>
  );
}
