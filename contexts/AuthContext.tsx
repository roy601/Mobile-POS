import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const userData = await SecureStore.getItemAsync('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Mock authentication - replace with real API call
      if (email === 'admin@mobilepos.com' && password === 'admin123') {
        const userData: User = {
          id: '1',
          name: 'System Administrator',
          email: 'admin@mobilepos.com',
          role: 'admin'
        };
        
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      } else if (email === 'manager@mobilepos.com' && password === 'manager123') {
        const userData: User = {
          id: '2',
          name: 'Store Manager',
          email: 'manager@mobilepos.com',
          role: 'manager'
        };
        
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
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