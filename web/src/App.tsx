import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { LocationProvider } from '@/context/LocationContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import HomePage from '@/components/HomePage';
import RegisterPage from '@/pages/RegisterPage';
import LoginPage from '@/pages/LoginPage';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import CheckEmailPage from '@/pages/CheckEmailPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';
import ProfilePage from '@/pages/ProfilePage';
import DashboardPage from '@/pages/DashboardPage';
import AddressesPage from '@/pages/AddressesPage';
import PickupPage from '@/pages/PickupPage';
import OrdersPage from '@/pages/OrdersPage';
import OrderDetailPage from '@/pages/OrderDetailPage';
import DriverDashboard from '@/pages/driver/DriverDashboard';
import WorkerDashboard from '@/pages/worker/WorkerDashboard';
import OutletAdminDashboard from '@/pages/admin/OutletAdminDashboard';
import SuperAdminDashboard from '@/pages/admin/SuperAdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <Toaster position="top-center" richColors />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/check-email" element={<CheckEmailPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

            <Route path="/addresses" element={
              <ProtectedRoute requireVerification roles={['CUSTOMER']}>
                <AddressesPage />
              </ProtectedRoute>
            } />
            <Route path="/pickup" element={
              <ProtectedRoute requireVerification roles={['CUSTOMER']}>
                <PickupPage />
              </ProtectedRoute>
            } />
            <Route path="/orders" element={
              <ProtectedRoute requireVerification roles={['CUSTOMER']}>
                <OrdersPage />
              </ProtectedRoute>
            } />
            <Route path="/orders/:id" element={
              <ProtectedRoute requireVerification roles={['CUSTOMER']}>
                <OrderDetailPage />
              </ProtectedRoute>
            } />

            <Route path="/driver" element={
              <ProtectedRoute roles={['DRIVER']}><DriverDashboard /></ProtectedRoute>
            } />
            <Route path="/worker" element={
              <ProtectedRoute roles={['WORKER']}><WorkerDashboard /></ProtectedRoute>
            } />
            <Route path="/outlet-admin" element={
              <ProtectedRoute roles={['OUTLET_ADMIN']}><OutletAdminDashboard /></ProtectedRoute>
            } />
            <Route path="/super-admin" element={
              <ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
