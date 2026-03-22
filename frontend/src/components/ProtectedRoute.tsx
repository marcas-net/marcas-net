import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute = ({ children, requiredRoles }: Props) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;