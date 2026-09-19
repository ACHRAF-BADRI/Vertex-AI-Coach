import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppToaster } from "./components/AppToaster";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Sidebar } from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";
import { AdminUsers } from "./pages/AdminUsers";
import { Dashboard } from "./pages/Dashboard";
import { GymInbox } from "./pages/GymInbox";
import { GymPlanView } from "./pages/GymPlanView";
import { GymProfile } from "./pages/GymProfile";
import { GymSavedPlans } from "./pages/GymSavedPlans";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { PlanView } from "./pages/PlanView";
import { Profile } from "./pages/Profile";
import { Register } from "./pages/Register";
import { StepsDashboard } from "./pages/StepsDashboard";
import { StepsTracker } from "./pages/StepsTracker";
import { Suspended } from "./pages/Suspended";
import { TrainingLog } from "./pages/TrainingLog";

function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

function App() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      <Sidebar />
      <AppToaster />
      <main className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/" replace />
                ) : (
                  <PageTransition>
                    <Login />
                  </PageTransition>
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? (
                  <Navigate to="/" replace />
                ) : (
                  <PageTransition>
                    <Register />
                  </PageTransition>
                )
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Home />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/training-log"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <TrainingLog />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/plan"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <PlanView />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute adminOnly>
                  <PageTransition>
                    <AdminUsers />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <Profile />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/steps"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <StepsTracker />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/steps/dashboard"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <StepsDashboard />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gym/profile"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <GymProfile />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gym/plan"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <GymPlanView />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gym/saved"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <GymSavedPlans />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/gym/inbox"
              element={
                <ProtectedRoute>
                  <PageTransition>
                    <GymInbox />
                  </PageTransition>
                </ProtectedRoute>
              }
            />
            <Route
              path="/suspended"
              element={
                <PageTransition>
                  <Suspended />
                </PageTransition>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
