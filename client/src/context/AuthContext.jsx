import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Initial Load: Check if JWT token exists and fetch user profile
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('blockproxy_access_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        setUser(response.data.data.user);
      } catch (error) {
        console.warn('Session initialization failed:', error.response?.data?.message);
        localStorage.removeItem('blockproxy_access_token');
        localStorage.removeItem('blockproxy_refresh_token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // 2. Login function (with email, password, and optional role)
  const login = async (email, password, role) => {
    const response = await api.post('/auth/login', { email, password, role });
    const { user: authUser, accessToken, refreshToken } = response.data.data;

    localStorage.setItem('blockproxy_access_token', accessToken);
    if (refreshToken) {
      localStorage.setItem('blockproxy_refresh_token', refreshToken);
    }

    setUser(authUser);
    return authUser;
  };

  // 3. Register function
  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    const data = response.data;

    if (!data.requiresApproval && data.data?.accessToken) {
      const { user: authUser, accessToken, refreshToken } = data.data;
      localStorage.setItem('blockproxy_access_token', accessToken);
      if (refreshToken) {
        localStorage.setItem('blockproxy_refresh_token', refreshToken);
      }
      setUser(authUser);
      return { requiresApproval: false, user: authUser };
    }

    return { requiresApproval: true, message: data.message, user: data.data?.user };
  };

  // 4. Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('blockproxy_access_token');
      localStorage.removeItem('blockproxy_refresh_token');
      setUser(null);
    }
  };

  const value = {
    user,
    setUser,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
