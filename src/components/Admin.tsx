import React, { useState, useEffect } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

interface Admin {
  id: string;
  username: string;
  email: string;
  role: string;
  lastLoginAt: string;
}

const Admin: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already authenticated (token in localStorage)
    const savedToken = localStorage.getItem('adminToken');
    const savedAdmin = localStorage.getItem('adminData');
    
    if (savedToken && savedAdmin) {
      setToken(savedToken);
      setAdmin(JSON.parse(savedAdmin));
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (authToken: string, adminData: Admin) => {
    setToken(authToken);
    setAdmin(adminData);
    setIsAuthenticated(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('adminToken', authToken);
    localStorage.setItem('adminData', JSON.stringify(adminData));
  };

  const handleLogout = () => {
    setToken(null);
    setAdmin(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard token={token!} admin={admin!} onLogout={handleLogout} />;
};

export default Admin;
