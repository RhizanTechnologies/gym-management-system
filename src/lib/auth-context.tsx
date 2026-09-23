'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Tenant, User, UserRole } from './types';

interface AuthContextType {
  currentTenant: Tenant;
  currentUser: User | null;
  allTenants: Tenant[];
  allUsers: User[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => Promise<void>;
  switchTenant: (tenantId: string) => void;
  switchUser: (userId: string) => void;
  refreshData: () => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentTenantId, setCurrentTenantId] = useState<string>('tenant-1');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncSessionCookie = (user: User) => {
    if (typeof document !== 'undefined') {
      document.cookie = `gymos_session=${encodeURIComponent(
        JSON.stringify({ userId: user.id, role: user.role, tenantId: user.tenantId })
      )}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  const fetchTenantsAndUsers = async () => {
    try {
      const [resTenants, resUsers] = await Promise.all([
        fetch('/api/tenants'),
        fetch('/api/auth'),
      ]);

      if (resTenants.ok) {
        const data = await resTenants.json();
        setTenants(data.tenants || []);
      }

      if (resUsers.ok) {
        const data = await resUsers.json();
        const loadedUsers: User[] = data.users || [];
        setUsers(loadedUsers);

        // Restore user from localStorage if authenticated, or default to Owner
        const savedUserId = typeof window !== 'undefined' ? localStorage.getItem('gymos_user_id') : null;
        let activeUser: User | null = null;
        if (savedUserId) {
          const matched = loadedUsers.find((u) => u.id === savedUserId);
          if (matched && matched.isActive && matched.status !== 'DEACTIVATED') {
            activeUser = matched;
          }
        }
        if (!activeUser) {
          // Default to Owner of M Fitness and Gym
          activeUser = loadedUsers.find((u) => u.role === 'OWNER') || loadedUsers[0] || null;
        }

        if (activeUser) {
          setCurrentUser(activeUser);
          if (activeUser.tenantId) setCurrentTenantId(activeUser.tenantId);
          syncSessionCookie(activeUser);
          if (typeof window !== 'undefined') {
            localStorage.setItem('gymos_user_id', activeUser.id);
          }
        } else {
          setCurrentUser(null);
        }
      }
    } catch (err) {
      console.error('Failed to fetch auth data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTenantsAndUsers();
  }, []);

  const login = async (email: string, password?: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setCurrentUser(data.user);
      if (data.user.tenantId) {
        setCurrentTenantId(data.user.tenantId);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('gymos_user_id', data.user.id);
      }
      syncSessionCookie(data.user);

      return { success: true, user: data.user };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gymos_user_id');
      document.cookie =
        'gymos_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax';
      window.location.href = '/login';
    }
  };

  const currentTenant =
    tenants.find((t) => t.id === currentTenantId) ||
    tenants[0] || {
      id: 'tenant-1',
      name: 'M Fitness and Gym',
      slug: 'm-fitness-gym',
      logo: '🏋️‍♂️',
      address: 'Figa, Addis Ababa',
      phone: '0961889867',
      email: 'contact@mfitnessgym.com',
      currency: 'USD',
      currencySymbol: '$',
      maxCapacity: 80,
      monthlySubscriptionFee: 99,
      planTier: 'PRO',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

  const switchTenant = (tenantId: string) => {
    setCurrentTenantId(tenantId);
    // Find first user of this tenant
    const tenantUser = users.find((u) => u.tenantId === tenantId);
    if (tenantUser) {
      setCurrentUser(tenantUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gymos_user_id', tenantUser.id);
      }
      syncSessionCookie(tenantUser);
    }
  };

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUser(user);
      if (user.tenantId) {
        setCurrentTenantId(user.tenantId);
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('gymos_user_id', user.id);
      }
      syncSessionCookie(user);
    }
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'SUPER_ADMIN') return true;
    const current = currentUser.role === 'GYM_OWNER' ? 'OWNER' : currentUser.role;
    return roles.some((r) => r === currentUser.role || (r === 'OWNER' && current === 'OWNER'));
  };

  return (
    <AuthContext.Provider
      value={{
        currentTenant,
        currentUser,
        allTenants: tenants,
        allUsers: users,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchTenant,
        switchUser,
        refreshData: fetchTenantsAndUsers,
        hasRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
