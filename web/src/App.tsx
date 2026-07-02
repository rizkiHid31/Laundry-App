import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './components/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import GoogleCallbackPage from './pages/GoogleCallbackPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import CheckEmailPage from './pages/CheckEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';
import AddressesPage from './features/addresses/AddressesPage';

// Dashboards
import CustomerDashboardPage from './pages/customer/CustomerDashboardPage';
import CustomerOrderPage from './pages/customer/CustomerOrderPage';
import CustomerOrdersPage from './pages/customer/CustomerOrdersPage';
import CustomerOrderDetailPage from './pages/customer/CustomerOrderDetailPage';
import OutletAdminDashboardPage from './pages/outletAdmin/OutletAdminDashboardPage';
import SuperAdminDashboardPage from './pages/admin/SuperAdminDashboardPage';

// Feature 3 Pages
import AttendancePage from './pages/attendance/AttendancePage';
import AttendanceReportPage from './pages/attendance/AttendanceReportPage';
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import DriverHistoryPage from './pages/driver/DriverHistoryPage';
import WorkerDashboardPage from './pages/worker/WorkerDashboardPage';
import DashboardRouter from './components/DashboardRouter';
import StationDetailPage from './pages/worker/StationDetailPage';
import WorkerHistoryPage from './pages/worker/WorkerHistoryPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/google-callback" element={<GoogleCallbackPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/addresses" element={<AddressesPage />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Dashboard route - redirect to role-specific pages */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requireVerification>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />
          {/* Placeholder route for users without specific dashboards */}
          <Route
            path="/dashboard/placeholder"
            element={
              <ProtectedRoute requireVerification>
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Dashboard</h1>
                    <p className="text-gray-600">Dashboard coming soon!</p>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />

          {/* Feature 3 — Attendance */}
          <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
          <Route path="/attendance/report" element={<ProtectedRoute><AttendanceReportPage /></ProtectedRoute>} />

          {/* Dashboard Routes */}
          <Route path="/customer" element={<ProtectedRoute requireVerification><CustomerDashboardPage /></ProtectedRoute>} />
          <Route path="/customer/orders" element={<ProtectedRoute requireVerification><CustomerOrdersPage /></ProtectedRoute>} />
          <Route path="/customer/orders/new" element={<ProtectedRoute requireVerification><CustomerOrderPage /></ProtectedRoute>} />
          <Route path="/customer/orders/:orderId" element={<ProtectedRoute requireVerification><CustomerOrderDetailPage /></ProtectedRoute>} />
          <Route path="/outlet-admin" element={<ProtectedRoute requireVerification><OutletAdminDashboardPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireVerification><SuperAdminDashboardPage /></ProtectedRoute>} />

          {/* Feature 3 — Driver */}
          <Route path="/driver" element={<ProtectedRoute><DriverDashboardPage /></ProtectedRoute>} />
          <Route path="/driver/history" element={<ProtectedRoute><DriverHistoryPage /></ProtectedRoute>} />

          {/* Feature 3 — Worker */}
          <Route path="/worker" element={<ProtectedRoute><WorkerDashboardPage /></ProtectedRoute>} />
          <Route path="/worker/orders/:stationId" element={<ProtectedRoute><StationDetailPage /></ProtectedRoute>} />
          <Route path="/worker/history" element={<ProtectedRoute><WorkerHistoryPage /></ProtectedRoute>} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
