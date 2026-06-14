import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import RoleRoute from './components/RoleRoute';

// Auth pages (teammate's work)
import HomePage from './components/HomePage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import CheckEmailPage from './pages/CheckEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ProfilePage from './pages/ProfilePage';

// Dashboard redirect
import DashboardPage from './pages/DashboardPage';

// Feature 3 — Attendance
import AttendancePage from './pages/attendance/AttendancePage';
import AttendanceReportPage from './pages/attendance/AttendanceReportPage';

// Feature 3 — Worker
import WorkerDashboardPage from './pages/worker/WorkerDashboardPage';
import StationDetailPage from './pages/worker/StationDetailPage';
import WorkerHistoryPage from './pages/worker/WorkerHistoryPage';

// Feature 3 — Driver
import DriverDashboardPage from './pages/driver/DriverDashboardPage';
import DriverHistoryPage from './pages/driver/DriverHistoryPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/check-email" element={<CheckEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected: profile (any role) */}
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />

          {/* Dashboard — redirects based on role */}
          <Route path="/dashboard" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          } />

          {/* Attendance — WORKER & DRIVER */}
          <Route path="/attendance" element={
            <RoleRoute roles={['WORKER', 'DRIVER']}>
              <AttendancePage />
            </RoleRoute>
          } />

          {/* Attendance Report — OUTLET_ADMIN & SUPER_ADMIN */}
          <Route path="/attendance/report" element={
            <RoleRoute roles={['OUTLET_ADMIN', 'SUPER_ADMIN']}>
              <AttendanceReportPage />
            </RoleRoute>
          } />

          {/* Worker Routes */}
          <Route path="/worker" element={
            <RoleRoute roles={['WORKER']}>
              <WorkerDashboardPage />
            </RoleRoute>
          } />
          <Route path="/worker/station/:stationId" element={
            <RoleRoute roles={['WORKER']}>
              <StationDetailPage />
            </RoleRoute>
          } />
          <Route path="/worker/history" element={
            <RoleRoute roles={['WORKER']}>
              <WorkerHistoryPage />
            </RoleRoute>
          } />

          {/* Driver Routes */}
          <Route path="/driver" element={
            <RoleRoute roles={['DRIVER']}>
              <DriverDashboardPage />
            </RoleRoute>
          } />
          <Route path="/driver/history" element={
            <RoleRoute roles={['DRIVER']}>
              <DriverHistoryPage />
            </RoleRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
