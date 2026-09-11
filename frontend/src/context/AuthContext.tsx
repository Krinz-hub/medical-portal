import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, DoctorProfile, PatientProfile } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: DoctorProfile | PatientProfile | null;
  isLoading: boolean;
  login: (credentials: any) => Promise<void>;
  registerPatient: (data: any) => Promise<void>;
  registerDoctor: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isDoctor: boolean;
  isPatient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DoctorProfile | PatientProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await authApi.getCurrentUser();
      setUser(data.user);
      setProfile(data.profile);
    } catch (error) {
      console.error('Failed to load user session:', error);
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleUnauthorized = () => {
      setUser(null);
      setProfile(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const login = async (credentials: any) => {
    const res = await authApi.login(credentials);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setProfile(res.data.profile);
  };

  const registerPatient = async (data: any) => {
    const res = await authApi.registerPatient(data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setProfile(res.data.profile);
  };

  const registerDoctor = async (data: any) => {
    const res = await authApi.registerDoctor(data);
    localStorage.setItem('token', res.data.token);
    setUser(res.data.user);
    setProfile(res.data.profile);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setProfile(null);
    }
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        login,
        registerPatient,
        registerDoctor,
        logout,
        refreshUser,
        isDoctor: user?.role === 'DOCTOR',
        isPatient: user?.role === 'PATIENT'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
