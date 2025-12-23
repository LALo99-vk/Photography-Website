import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'client' | 'photographer' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-inter text-gray-600">Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role requirement
  if (requiredRole) {
    if (!userProfile) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <p className="font-inter text-gray-600">Loading profile...</p>
        </div>
      );
    }

    if (userProfile.role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;