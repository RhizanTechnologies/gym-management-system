'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  User as UserIcon,
  Mail,
  Phone,
  Shield,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  KeyRound,
} from 'lucide-react';

interface ProfileData {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: string;
  phone: string;
  avatarUrl: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { currentUser, currentTenant, refreshData } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Password change fields
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  // Feedback
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchProfile = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/profile?userId=${currentUser.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setProfile(data.user);
          setName(data.user.name);
          setEmail(data.user.email);
          setPhone(data.user.phone || '');
        }
      }
    } catch (e) {
      console.error('Failed to fetch profile', e);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setErrorMsg('');
    setSuccessMsg('');
    setSaving(true);

    // Validate password match
    if (showPasswordSection && newPassword) {
      if (!currentPassword) {
        setErrorMsg('Please enter your current password to change it.');
        setSaving(false);
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('New password must be at least 6 characters.');
        setSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New password and confirmation do not match.');
        setSaving(false);
        return;
      }
    }

    try {
      const payload: Record<string, string> = {
        userId: currentUser.id,
      };

      if (name.trim() !== profile?.name) payload.name = name.trim();
      if (email.trim().toLowerCase() !== profile?.email) payload.email = email.trim();
      if (phone.trim() !== (profile?.phone || '')) payload.phone = phone.trim();
      if (showPasswordSection && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      // Check if anything changed
      if (Object.keys(payload).length <= 1) {
        setErrorMsg('No changes to save.');
        setSaving(false);
        return;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to update profile');
        return;
      }

      setSuccessMsg(data.message || 'Profile updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordSection(false);

      // Refresh profile and auth data
      await fetchProfile();
      await refreshData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error updating profile');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      OWNER: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Gym Owner' },
      GYM_OWNER: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Gym Owner' },
      SUPER_ADMIN: { bg: 'bg-slate-900', text: 'text-white', label: 'Super Admin' },
      GENERAL_MANAGER: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'General Manager' },
      TRAINER: { bg: 'bg-violet-100', text: 'text-violet-800', label: 'Trainer / Coach' },
      RECEPTIONIST: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Receptionist' },
      FINANCE_OFFICER: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Finance Officer' },
      MAINTENANCE_STAFF: { bg: 'bg-slate-100', text: 'text-slate-700', label: 'Maintenance Staff' },
      MEMBER: { bg: 'bg-teal-100', text: 'text-teal-800', label: 'Member' },
    };
    return map[role] || { bg: 'bg-slate-100', text: 'text-slate-700', label: role.replace('_', ' ') };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  const role = getRoleBadge(profile?.role || currentUser?.role || 'RECEPTIONIST');
  const joinDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-2xl font-black uppercase shadow-lg">
            {(profile?.name || currentUser?.name || 'U').charAt(0)}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {profile?.name || currentUser?.name}
            </h1>
            <p className="text-sm text-slate-500">{profile?.email || currentUser?.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${role.bg} ${role.text}`}>
                {role.label}
              </span>
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {currentTenant?.name || 'M Fitness and Gym'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Calendar className="h-3.5 w-3.5 text-emerald-600" />
            <span>Joined: <strong className="text-slate-700">{joinDate}</strong></span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Shield className="h-3.5 w-3.5 text-emerald-600" />
            <span>Status: <strong className="text-emerald-700">Active</strong></span>
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center gap-2 text-xs text-emerald-800 font-semibold animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-center gap-2 text-xs text-rose-800 font-semibold animate-in slide-in-from-top duration-200">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Profile Edit Form */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
            <UserIcon className="h-4 w-4 text-emerald-600" />
            Personal Information
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 91 000 0000"
                  className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Role</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={role.label}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Role can only be changed by the Gym Owner</p>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-emerald-600" />
              Security & Password
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowPasswordSection(!showPasswordSection);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
              }}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              {showPasswordSection ? 'Cancel' : 'Change Password'}
            </button>
          </div>

          {!showPasswordSection ? (
            <div className="mt-4 text-xs text-slate-500 flex items-center gap-2">
              <Lock className="h-4 w-4 text-slate-400" />
              <span>Your password is set. Click "Change Password" to update it.</span>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Current Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Enter your current password"
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">New Password *</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="At least 6 characters"
                    minLength={6}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Confirm New Password *</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Re-enter new password"
                    minLength={6}
                    className={`w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 font-medium ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
                        : 'border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/20'
                    }`}
                  />
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-[10px] text-rose-600 mt-1 font-semibold">Passwords do not match</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
