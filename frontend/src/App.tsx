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
import Messages from './pages/Messages';
import Network from './pages/Network';
import Sourcing from './pages/Sourcing';
import OrgSourcingDashboard from './pages/OrgSourcingDashboard';
import OrgSourcingCatalog from './pages/OrgSourcingCatalog';
import ProductDetail from './pages/ProductDetail';
import Notifications from './pages/Notifications';
import AcceptInvitation from './pages/AcceptInvitation';
import AuthCallback from './pages/AuthCallback';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Marketplace from './pages/Marketplace';
import Forms from './pages/Forms';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardLayout } from './layouts/DashboardLayout';
import { MobileFAB } from './components/MobileFAB';

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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Dashboard layout wraps all protected routes */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/feed" element={<Feed />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/orgs" element={<Organizations />} />
            <Route path="/orgs/create" element={<CreateOrganization />} />
            <Route path="/orgs/:id" element={<OrganizationDetail />} />
            <Route path="/orgs/:id/documents" element={<OrganizationDocuments />} />
            <Route path="/orgs/:id/members" element={<OrgMembers />} />
            <Route path="/orgs/:id/settings" element={<OrgSettings />} />
            <Route path="/orgs/:id/sourcing" element={<OrgSourcingDashboard />} />
            <Route path="/orgs/:id/catalog" element={<OrgSourcingCatalog />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<UserProfile />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/network" element={<Network />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/orgs/sourcing" element={<Sourcing />} />
            <Route path="/sourcing" element={<Sourcing />} />
            <Route path="/dashboard/settings" element={<Settings />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <MobileFAB />
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
