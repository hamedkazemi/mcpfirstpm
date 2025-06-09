'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { authApi } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { firstName?: string; lastName?: string; avatar?: string }) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = Cookies.get('accessToken');
        if (token) {
          const response = await authApi.getProfile();
          if (response.data.success && response.data.data) {
            setUser(response.data.data);
          }
        }
      } catch {
        // Token is invalid or expired
        Cookies.remove('accessToken');
        Cookies.remove('refreshToken');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      const response = await authApi.login({ email, password });
      
      if (response.data.success && response.data.data) {
        const { user, tokens } = response.data.data;
        
        // Store tokens
        Cookies.set('accessToken', tokens.accessToken, { expires: 1 }); // 1 day
        Cookies.set('refreshToken', tokens.refreshToken, { expires: 7 }); // 7 days
        
        setUser(user);
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string, role?: string): Promise<void> => {
    try {
      const response = await authApi.register({ name, email, password, role });
      
      if (response.data.success && response.data.data) {
        const { user, tokens } = response.data.data;
        
        // Store tokens
        Cookies.set('accessToken', tokens.accessToken, { expires: 1 }); // 1 day
        Cookies.set('refreshToken', tokens.refreshToken, { expires: 7 }); // 7 days
        
        setUser(user);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local state and tokens
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      setUser(null);
    }
  };

  const updateProfile = async (data: { firstName?: string; lastName?: string; avatar?: string }): Promise<void> => {
    try {
      const response = await authApi.updateProfile(data);
      
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      } else {
        throw new Error(response.data.message || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// HOC for protecting routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return function ProtectedComponent(props: P) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      return null;
    }

    return <Component {...props} />;
  };
};

// Hook for checking permissions
export const usePermissions = () => {
  const { user } = useAuth();

  const hasRole = (roles: User['role'][]): boolean => {
    return user ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => {
    return user?.role === 'admin';
  };

  const isManager = (): boolean => {
    return user?.role === 'manager' || user?.role === 'admin';
  };

  const canManageProject = (): boolean => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  const canCreateProject = (): boolean => {
    return user?.role === 'admin' || user?.role === 'manager';
  };

  const canDeleteProject = (): boolean => {
    return user?.role === 'admin';
  };

  return {
    hasRole,
    isAdmin,
    isManager,
    canManageProject,
    canCreateProject,
    canDeleteProject,
    currentRole: user?.role,
  };
};
