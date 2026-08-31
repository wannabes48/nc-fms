'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'CONFERENCE_ADMIN' | 'DISTRICT_PASTOR' | 'LOCAL_CLERK';

interface AuthState {
  token: string | null;
  role: Role | null;
  churchId?: number; // Only populated for Local Clerks
}

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [auth, setAuth] = useState<AuthState>({ token: null, role: null });

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') as Role;
    if (storedToken) setAuth({ token: storedToken, role: storedRole });
  }, []);

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);