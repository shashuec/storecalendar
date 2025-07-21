'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;
  login: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  getAuthHeaders: () => Record<string, string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  // Helper to get stored token
  const getStoredToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth-token');
    }
    return null;
  };

  // Helper to store token
  const storeToken = (newToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', newToken);
    }
    setToken(newToken);
  };

  // Helper to clear token
  const clearToken = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
    setToken(null);
  };

  // Helper to get auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const authToken = token || getStoredToken();
    return authToken ? { 'Authorization': `Bearer ${authToken}` } : {};
  };

  const checkAuth = async (authToken?: string) => {
    try {
      const tokenToUse = authToken || token || getStoredToken();
      if (!tokenToUse) {
        setUser(null);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${tokenToUse}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        if (authToken) {
          storeToken(authToken);
        } else {
          setToken(tokenToUse);
        }
      } else {
        setUser(null);
        clearToken();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      clearToken();
    } finally {
      setLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/api/auth/google';
  };

  const logout = async () => {
    try {
      const authHeaders = getAuthHeaders();
      if (Object.keys(authHeaders).length > 0 && authHeaders.Authorization) {
        await fetch('/api/auth/logout', { 
          method: 'POST',
          headers: authHeaders as Record<string, string>
        });
      }
      clearToken();
      setUser(null);
      // Clear any persisted state on logout
      if (typeof window !== 'undefined') {
        localStorage.removeItem('app-state');
      }
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      clearToken();
      setUser(null);
      window.location.href = '/';
    }
  };

  useEffect(() => {
    // Check for token in URL params (from OAuth callback)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = urlParams.get('token');
    
    if (tokenFromUrl) {
      // Remove token from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('token');
      window.history.replaceState({}, '', newUrl.toString());
      // Check auth with the new token
      checkAuth(tokenFromUrl);
    } else {
      // Check auth with stored token
      checkAuth();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, checkAuth, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}