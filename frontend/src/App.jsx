import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import GuestList from './pages/GuestList';
import AdminEvents from './pages/AdminEvents';
import AdminManage from './pages/AdminManage';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  const user = userData ? JSON.parse(userData) : null;
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard/home" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* ── Admin Area (dark layout) ── */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="manage" element={<AdminManage />} />
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Admin event selector (standalone page) */}
        <Route
          path="/admin/events"
          element={
            <AdminRoute>
              <AdminEvents />
            </AdminRoute>
          }
        />

        {/* ── Receptionist / Event Dashboard ── */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="home" element={<Home />} />
          <Route path="guests" element={<GuestList />} />
          {/* Legacy admin manage route kept for backward compat */}
          <Route path="admin/manage" element={<AdminManage />} />
          <Route index element={<Navigate to="/dashboard/home" replace />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
