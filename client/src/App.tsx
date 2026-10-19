import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { NotFoundPage } from './pages/NotFoundPage';
import { Activity } from 'lucide-react';

const RootIndexRedirect: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <div className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center text-white shadow-lg shadow-sky-200 animate-bounce">
          <Activity className="w-6 h-6" />
        </div>
        <p className="mt-4 text-sm font-semibold text-slate-600">Loading MediTrack...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={user.role === 'DOCTOR' ? '/doctor' : '/patient'} replace />;
};

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/70">
      <Navbar />
      <main className="flex-1">{children}</main>
      <footer className="mt-auto py-6 bg-white border-t border-slate-200 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MediTrack – Full Stack Practical Assessment for NT Tech Innovation.</p>
          <p className="text-slate-400">
            Powered by Node.js, Express, PostgreSQL (NeonDB), React & Gemini AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Index Route */}
          <Route path="/" element={<RootIndexRedirect />} />

          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage initialMode="login" />} />
          <Route path="/register" element={<LoginPage initialMode="register" />} />

          {/* Protected Patient Routes */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRole="PATIENT">
                <DashboardLayout>
                  <PatientDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={<Navigate to="/patient" replace />}
          />

          {/* Protected Doctor Routes */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRole="DOCTOR">
                <DashboardLayout>
                  <DoctorDashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
