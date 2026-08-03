import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f0f7ff]">
        <div className="w-10 h-10 border-4 border-[#003C43] border-t-transparent rounded-full animate-spin mb-3"></div>
        <div className="text-[#4a6fa5] font-medium text-sm">Loading...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  // Default login page is the student login
  if (!user) {
    return <Navigate to="/student-login" replace />;
  }

  // Check if user has the required role(s)
  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on user role
    const roleMap = {
      admin: '/admin-dashboard',
      teacher: '/teacher-dashboard',
      accountant: '/accountant-dashboard',
      student: '/student-dashboard',
      parent: '/student-dashboard' // Parents go to student dashboard
    };
    
    // If role not found in map, go to default dashboard
    const redirectPath = roleMap[user.role] || '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  // Render children if all checks pass
  return children;
};

export default ProtectedRoute;