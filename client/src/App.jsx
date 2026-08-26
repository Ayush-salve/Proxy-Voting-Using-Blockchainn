import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleRoute } from './routes/RoleRoute';
import { AppLayout } from './components/layout/AppLayout';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { LoginPage } from './pages/public/LoginPage';
import { RegisterPage } from './pages/public/RegisterPage';
import { UnauthorizedPage } from './pages/public/UnauthorizedPage';
import { VerifyVotePage } from './pages/shared/VerifyVotePage';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminShareholdersPage } from './pages/admin/AdminShareholdersPage';
import { AdminMeetingsPage } from './pages/admin/AdminMeetingsPage';
import { AdminProposalsPage } from './pages/admin/AdminProposalsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminAnomaliesPage } from './pages/admin/AdminAnomaliesPage';
import { AdminAuditPage } from './pages/admin/AdminAuditPage';

// Shareholder Pages
import { ShareholderDashboard } from './pages/shareholder/ShareholderDashboard';
import { ShareholderProposalsPage } from './pages/shareholder/ShareholderProposalsPage';
import { ShareholderProxiesPage } from './pages/shareholder/ShareholderProxiesPage';
import { ShareholderHistoryPage } from './pages/shareholder/ShareholderHistoryPage';

// Proxy Pages
import { ProxyDashboard } from './pages/proxy/ProxyDashboard';
import { ProxyDelegationsPage } from './pages/proxy/ProxyDelegationsPage';
import { ProxyVotingPage } from './pages/proxy/ProxyVotingPage';

// Auditor Pages
import { AuditorDashboard } from './pages/auditor/AuditorDashboard';
import { AuditorBlockchainPage } from './pages/auditor/AuditorBlockchainPage';
import { AuditorAuditPage } from './pages/auditor/AuditorAuditPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/blockchain/verify" element={<VerifyVotePage />} />

          {/* Protected Dashboard Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <RoleRoute allowedRoles={['COMPANY_ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/shareholders"
              element={
                <RoleRoute allowedRoles={['COMPANY_ADMIN', 'AUDITOR']}>
                  <AdminShareholdersPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/meetings"
              element={
                <RoleRoute allowedRoles={['COMPANY_ADMIN']}>
                  <AdminMeetingsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/proposals"
              element={
                <RoleRoute allowedRoles={['COMPANY_ADMIN']}>
                  <AdminProposalsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RoleRoute allowedRoles={['COMPANY_ADMIN', 'AUDITOR']}>
                  <AdminAnalyticsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/anomalies"
              element={
                <RoleRoute allowedRoles={['COMPANY_ADMIN']}>
                  <AdminAnomaliesPage />
                </RoleRoute>
              }
            />
            <Route
              path="/admin/audit"
              element={
                <RoleRoute allowedRoles={['COMPANY_ADMIN', 'AUDITOR']}>
                  <AdminAuditPage />
                </RoleRoute>
              }
            />

            {/* Shareholder Routes */}
            <Route
              path="/shareholder/dashboard"
              element={
                <RoleRoute allowedRoles={['SHAREHOLDER']}>
                  <ShareholderDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/shareholder/proposals"
              element={
                <RoleRoute allowedRoles={['SHAREHOLDER']}>
                  <ShareholderProposalsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/shareholder/voting"
              element={
                <RoleRoute allowedRoles={['SHAREHOLDER']}>
                  <ShareholderProposalsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/shareholder/proxies"
              element={
                <RoleRoute allowedRoles={['SHAREHOLDER']}>
                  <ShareholderProxiesPage />
                </RoleRoute>
              }
            />
            <Route
              path="/shareholder/history"
              element={
                <RoleRoute allowedRoles={['SHAREHOLDER']}>
                  <ShareholderHistoryPage />
                </RoleRoute>
              }
            />

            {/* Proxy Representative Routes */}
            <Route
              path="/proxy/dashboard"
              element={
                <RoleRoute allowedRoles={['PROXY_REPRESENTATIVE']}>
                  <ProxyDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/proxy/delegations"
              element={
                <RoleRoute allowedRoles={['PROXY_REPRESENTATIVE']}>
                  <ProxyDelegationsPage />
                </RoleRoute>
              }
            />
            <Route
              path="/proxy/voting"
              element={
                <RoleRoute allowedRoles={['PROXY_REPRESENTATIVE']}>
                  <ProxyVotingPage />
                </RoleRoute>
              }
            />
            <Route
              path="/proxy/history"
              element={
                <RoleRoute allowedRoles={['PROXY_REPRESENTATIVE']}>
                  <ShareholderHistoryPage />
                </RoleRoute>
              }
            />

            {/* Auditor Routes */}
            <Route
              path="/auditor/dashboard"
              element={
                <RoleRoute allowedRoles={['AUDITOR']}>
                  <AuditorDashboard />
                </RoleRoute>
              }
            />
            <Route
              path="/auditor/blockchain"
              element={
                <RoleRoute allowedRoles={['AUDITOR', 'COMPANY_ADMIN']}>
                  <AuditorBlockchainPage />
                </RoleRoute>
              }
            />
            <Route
              path="/auditor/audit"
              element={
                <RoleRoute allowedRoles={['AUDITOR', 'COMPANY_ADMIN']}>
                  <AuditorAuditPage />
                </RoleRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
