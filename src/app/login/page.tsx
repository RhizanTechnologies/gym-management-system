'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Dumbbell, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, allUsers } = useAuth();
  const [email, setEmail] = useState('dawit@apexfitness.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    const res = await login(email, password);
    if (res.success) {
      // Find role for routing
      const user = res.user || allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (user?.role === 'MEMBER') {
        router.push('/member-portal');
      } else if (user?.role === 'RECEPTIONIST') {
        router.push('/checkin');
      } else if (user?.role === 'SUPER_ADMIN') {
        router.push('/super-admin');
      } else {
        router.push('/dashboard');
      }
    } else {
      setError(res.error || 'Invalid credentials');
    }
    setIsLoading(false);
  };

  const handleQuickLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-600 text-white font-black shadow-md">
            <Dumbbell className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sign in to GymOS</h1>
          <p className="text-xs text-slate-500">
            Next-Gen Multi-Tenant Gym Management Platform & Mobile Pass
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gym.com"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold">Demo: password123</span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Login for Live Testing */}
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              1-Click Demo Login (Test Roles):
            </span>
            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickLogin('dawit@apexfitness.com')}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-xs"
              >
                <p className="font-extrabold text-slate-900">💼 Gym Owner</p>
                <p className="text-[10px] text-slate-500">Dawit (Full Admin)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('selam@apexfitness.com')}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-xs"
              >
                <p className="font-extrabold text-slate-900">📋 Receptionist</p>
                <p className="text-[10px] text-slate-500">Selam (Front Desk)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('marcus@apexfitness.com')}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-xs"
              >
                <p className="font-extrabold text-slate-900">🏋️ Trainer</p>
                <p className="text-[10px] text-slate-500">Marcus (Coach)</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('yonas@gmail.com')}
                className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all text-xs"
              >
                <p className="font-extrabold text-slate-900">📱 Member Pass</p>
                <p className="text-[10px] text-slate-500">Yonas (PWA User)</p>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleQuickLogin('superadmin@gymos.io')}
              className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2 text-center hover:bg-slate-200 transition-all text-xs font-bold text-slate-700"
            >
              👑 Platform Super Admin (Multi-Gym SaaS Control)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
