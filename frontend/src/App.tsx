import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import MeetingDetailsPage from './pages/MeetingDetailsPage';

const FullPageSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-bg text-brand-text-primary font-mono">
    <div className="flex flex-col items-center gap-4">
      <div className="w-10 h-10 border-2 border-brand-accent border-t-transparent rounded-lg animate-spin"></div>
      <p className="text-brand-text-muted text-xs tracking-widest uppercase animate-pulse">Loading MeetSense...</p>
    </div>
  </div>
);

// Router Guard for protected routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Router Guard for public-only routes (e.g. login/signup)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <FullPageSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />

          {/* Public Authentication routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthPage defaultIsLogin={true} />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <AuthPage defaultIsLogin={false} />
              </PublicRoute>
            }
          />

          {/* Protected Dashboard & Detail routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/meetings/:id"
            element={
              <ProtectedRoute>
                <MeetingDetailsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback routing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
