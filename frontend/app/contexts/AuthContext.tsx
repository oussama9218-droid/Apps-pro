import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  is_onboarded: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  checkAuthState: () => Promise<void>;
  isOnline: boolean;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Log API configuration at startup
console.log('🔧 API Configuration:');
console.log('  - EXPO_PUBLIC_BACKEND_URL:', process.env.EXPO_PUBLIC_BACKEND_URL);
console.log('  - Resolved API_URL:', API_URL);
console.log('  - Environment:', __DEV__ ? 'Development' : 'Production');

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);

  const handleApiError = (error: any) => {
    console.error('API Error:', error);
    if (error.message?.includes('Network')) {
      setIsOnline(false);
      throw new Error('Vérifiez votre connexion internet');
    }
    if (error.status === 401) {
      logout();
      throw new Error('Session expirée, veuillez vous reconnecter');
    }
    throw error;
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      setIsOnline(true);
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        timeout: 10000, // 10 second timeout
      } as RequestInit);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Erreur réseau' }));
        const apiError = new Error(error.detail || 'Erreur serveur');
        (apiError as any).status = response.status;
        throw apiError;
      }

      return response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Network request failed') {
        setIsOnline(false);
        throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
      }
      throw handleApiError(error);
    }
  };

  const checkAuthState = async () => {
    try {
      const savedToken = await AsyncStorage.getItem('auth_token');
      if (savedToken) {
        const userData = await apiCall(`${API_URL}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${savedToken}` },
        });
        setUser(userData);
        setToken(savedToken);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await AsyncStorage.removeItem('auth_token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await apiCall(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    setUser(data.user);
    setToken(data.access_token);
    await AsyncStorage.setItem('auth_token', data.access_token);
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    const data = await apiCall(`${API_URL}/api/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    setUser(data.user);
    setToken(data.access_token);
    await AsyncStorage.setItem('auth_token', data.access_token);
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('auth_token');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    checkAuthState();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
        checkAuthState,
        isOnline,
      }}
    >
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