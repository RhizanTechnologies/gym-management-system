'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Dumbbell, Lock, Mail, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, allUsers } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError('');

    const res = await login(email, password);
    if (res.success) {
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
      setError(res.error || 'Invalid email or password');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F766E] text-white font-black shadow-md">
            <Dumbbell className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#1F2937] tracking-tight">Sign in to GymOS</h1>
          <p className="text-xs text-[#1F2937]/60">
            M Fitness and Gym Management System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 sm:p-8 shadow-xl space-y-5">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#1F2937]/70 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1F2937]/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@mfitnessgym.com"
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-10 pr-4 py-2.5 text-xs text-[#1F2937] placeholder-[#1F2937]/40 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1F2937]/70">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1F2937]/40" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[#E5E7EB] bg-white pl-10 pr-4 py-2.5 text-xs text-[#1F2937] placeholder-[#1F2937]/40 focus:border-[#0F766E] focus:outline-none focus:ring-1 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0F766E] py-3 text-xs font-extrabold text-white shadow-xs hover:bg-[#0D655E] transition-all disabled:opacity-50"
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
        </div>
      </div>
    </div>
  );
}
