// ตัวกันไม่ให้เข้าหน้าที่ไม่มีสิทธิ์: เช็ค token/role ใน localStorage ก่อนปล่อยให้เห็นหน้า
// ถ้าไม่ได้ล็อกอิน หรือ role ไม่ตรงที่กำหนด จะเด้งกลับไปหน้า /login ทันที

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
