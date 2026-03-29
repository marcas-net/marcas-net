import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import CreateOrganization from './pages/CreateOrganization';
import OrganizationDetail from './pages/OrganizationDetail';
import OrganizationDocuments from './pages/OrganizationDocuments';
import OrgMembers from './pages/OrgMembers';
import OrgSettings from './pages/OrgSettings';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import Feed from './pages/Feed';
import Jobs from './pages/Jobs';
import AcceptInvitation from './pages/AcceptInvitation';
import AuthCallback from './pages/AuthCallback';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './layouts/DashboardLayout';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontSize: '13px',
              fontFamily: 'Inter, sans-serif',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/accept-invitation/:token" element={<AcceptInvitation />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Dashboard layout wraps all protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orgs" element={<Organizations />} />
            <Route path="/orgs/create" element={<CreateOrganization />} />
            <Route path="/orgs/:id" element={<OrganizationDetail />} />
            <Route path="/orgs/:id/documents" element={<OrganizationDocuments />} />
            <Route path="/orgs/:id/members" element={<OrgMembers />} />
            <Route path="/orgs/:id/settings" element={<OrgSettings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/feed" element={<Feed />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/dashboard/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
