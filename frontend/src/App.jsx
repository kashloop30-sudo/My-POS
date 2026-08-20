import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { BusinessProvider } from './context/BusinessContext';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Businesses from './pages/Businesses';
import Branches from './pages/Branches';
import Clients from './pages/Clients';
import Workflow from './pages/Workflow';
import Finance from './pages/Finance';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AdminDashboard from './pages/AdminDashboard';
import WorkerDashboard from './pages/WorkerDashboard';

const WORKER_ROLES = ['STAFF', 'BRANCH_MANAGER'];

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#f0f4fa]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium text-sm">Loading…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <ToastProvider>
          <Router>
            <Routes>
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route index           element={<Dashboard />} />
                <Route path="worker"   element={<WorkerDashboard />} />
                <Route path="businesses" element={<Businesses />} />
                <Route path="branches"   element={<Branches />} />
                <Route path="clients"    element={<Clients />} />
                <Route path="workflow"   element={<Workflow />} />
                <Route path="finance"    element={<Finance />} />
                <Route path="reports"    element={<Reports />} />
                <Route path="settings"   element={<Settings />} />
                <Route path="admin"      element={<AdminDashboard />} />
              </Route>
            </Routes>
          </Router>
        </ToastProvider>
      </BusinessProvider>
    </AuthProvider>
  );
}

export default App;
