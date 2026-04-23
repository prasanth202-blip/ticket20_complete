import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('tf_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await authAPI.getMe();
      const u   = res.data.user;
      // Preserve companySlug from stored data if company is a slug string
      const stored = JSON.parse(localStorage.getItem('tf_user') || '{}');
      setUser({ ...u, companySlug: u.company?.slug || stored.companySlug });
    } catch {
      localStorage.removeItem('tf_token');
      localStorage.removeItem('tf_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = (token, userData) => {
    localStorage.setItem('tf_token', token);
    localStorage.setItem('tf_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('tf_token');
    localStorage.removeItem('tf_user');
    setUser(null);
  };

  const updateUser = (data) => setUser(prev => ({ ...prev, ...data }));

  const isPlatformOwner = user?.role === 'platform_owner';
  const isCompanyAdmin  = ['company_super_admin','company_admin'].includes(user?.role);
  const isAgent         = user?.role === 'agent';
  const isUser          = user?.role === 'user';
  const isStaff         = ['company_super_admin','company_admin','employee','agent'].includes(user?.role);
  const companySlug     = user?.company?.slug || user?.companySlug;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isPlatformOwner, isCompanyAdmin, isAgent, isUser, isStaff, companySlug }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
