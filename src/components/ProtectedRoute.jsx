import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, requiredRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    // Not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Role doesn't match (e.g. non-admin trying to access admin dashboard)
    // Redirect students to a simple placeholder or back to login (or alert them)
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
