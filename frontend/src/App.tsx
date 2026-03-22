import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Organizations from './pages/Organizations';
import CreateOrganization from './pages/CreateOrganization';
import OrganizationDetail from './pages/OrganizationDetail';
import OrganizationDocuments from './pages/OrganizationDocuments';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/orgs" element={<ProtectedRoute><Organizations /></ProtectedRoute>} />
        <Route path="/orgs/create" element={<ProtectedRoute><CreateOrganization /></ProtectedRoute>} />
        <Route path="/orgs/:id" element={<ProtectedRoute><OrganizationDetail /></ProtectedRoute>} />
        <Route path="/orgs/:id/documents" element={<ProtectedRoute><OrganizationDocuments /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
