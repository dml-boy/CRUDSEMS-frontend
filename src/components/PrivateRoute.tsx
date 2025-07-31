// src/components/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
  requiredRole: 'ADMIN' | 'EMPLOYEE';
}

const PrivateRoute: React.FC<Props> = ({ children, requiredRole }) => {
  const userStr = localStorage.getItem('user');

  // 🚫 Not logged in at all
  if (!userStr) return <Navigate to="/login" replace />;

  let users: { role: string } ;
  try {
    users = JSON.parse(userStr);
  } catch {
    return <Navigate to="/login" replace />;
  }

  // 🚫 Role mismatch
  if (users?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // ✅ All good
  return <>{children}</>;
};

export default PrivateRoute;
