import { Link, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminRoute, PrivateRoute, PublicRoute } from './components/Guards';
import { ForgotPassword, Login, Register, ResetPassword, VerifyEmail } from './pages/AuthPages';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Goals from './pages/Goals';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

const NotFound = () => (
  <div className="empty" style={{ paddingTop: 120 }}>
    <h3>Page not found</h3>
    <p>The page you are looking for doesn't exist.</p>
    <p style={{ marginTop: 14 }}><Link className="btn" to="/">Back to dashboard</Link></p>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />

      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="goals" element={<Goals />} />
          <Route path="reports" element={<Reports />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<Profile />} />
          <Route element={<AdminRoute />}>
            <Route path="admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
