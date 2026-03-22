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
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import { DashboardLayout } from './layouts/DashboardLayout';

function App() {
  return (
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
          <Route path="/profile" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
