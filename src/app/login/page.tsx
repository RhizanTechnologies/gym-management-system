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
      } else if (user?.role === 'TRAINER') {
        router.push('/trainer');
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

  const [showTrainerJoinModal, setShowTrainerJoinModal] = useState(false);
  const [trainerForm, setTrainerForm] = useState({ name: '', email: '', phone: '' });
  const [trainerJoinError, setTrainerJoinError] = useState('');
  const [trainerJoinSuccess, setTrainerJoinSuccess] = useState('');
  const [trainerJoinLoading, setTrainerJoinLoading] = useState(false);

  const handleTrainerJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrainerJoinError('');
    setTrainerJoinSuccess('');
    setTrainerJoinLoading(true);

    try {
      const res = await fetch('/api/auth/register-trainer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(trainerForm),
      });
      const data = await res.json();
      if (res.ok) {
        setTrainerJoinSuccess(data.message || 'Trainer registered successfully!');
        setEmail(trainerForm.email);
        setPassword('password');
        setTimeout(() => {
          setShowTrainerJoinModal(false);
        }, 1500);
      } else {
        setTrainerJoinError(data.error || 'Registration failed');
      }
    } catch {
      setTrainerJoinError('Network error registering trainer');
    } finally {
      setTrainerJoinLoading(false);
    }
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

          {/* Trainer Join Link */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Are you a personal trainer?{' '}
              <button
                type="button"
                onClick={() => setShowTrainerJoinModal(true)}
                className="font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
              >
                Join or Register Here
              </button>
            </p>
          </div>
        </div>

        {/* Modal: Join as Personal Trainer */}
        {showTrainerJoinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Join as Personal Trainer</h3>
                    <p className="text-[11px] text-slate-500">Create your coach account to access your trainees</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTrainerJoinModal(false)}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>

              {trainerJoinError && (
                <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-semibold">
                  {trainerJoinError}
                </div>
              )}
              {trainerJoinSuccess && (
                <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-semibold">
                  {trainerJoinSuccess}
                </div>
              )}

              <form onSubmit={handleTrainerJoin} className="mt-4 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name / Coach Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coach Abebe"
                    value={trainerForm.name}
                    onChange={(e) => setTrainerForm({ ...trainerForm, name: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="coach.abebe@gym.com"
                    value={trainerForm.email}
                    onChange={(e) => setTrainerForm({ ...trainerForm, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="0911223344"
                    value={trainerForm.phone}
                    onChange={(e) => setTrainerForm({ ...trainerForm, phone: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowTrainerJoinModal(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={trainerJoinLoading}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {trainerJoinLoading ? 'Registering...' : 'Join Gym as Trainer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
