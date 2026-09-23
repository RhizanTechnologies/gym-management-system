'use client';

import React, { useState } from 'react';
import { Tenant, UserRole } from '@/lib/types';
import { X, UserPlus, Shield, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react';

interface AddStaffModalProps {
  tenant: Tenant;
  onClose: () => void;
  onCreated: () => void;
}

export function AddStaffModal({ tenant, onClose, onCreated }: AddStaffModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('RECEPTIONIST');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Success state — shows credentials after account creation
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      setError('Full Name and Email are required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant?.id || 'tenant-1',
          name: name.trim(),
          email: email.trim().toLowerCase(),
          role,
          phone: phone ? phone.trim() : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create staff account');
      }

      // Show credentials screen
      setCreatedUser({
        name: data.user?.name || name.trim(),
        email: data.user?.email || email.trim().toLowerCase(),
        role: data.user?.role || role,
      });
      setGeneratedPassword(data.generatedPassword || '');
      onCreated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating staff';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    const text = `M Fitness & Gym — Staff Credentials\n\nName: ${createdUser?.name}\nEmail: ${createdUser?.email}\nPassword: ${generatedPassword}\nRole: ${createdUser?.role?.replace('_', ' ')}\n\nLogin at: ${typeof window !== 'undefined' ? window.location.origin : ''}/login`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // ──────────────────────────────────────────────
  // SUCCESS SCREEN — Show generated credentials
  // ──────────────────────────────────────────────
  if (createdUser && generatedPassword) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Staff Account Created!</h3>
                <p className="text-[11px] text-slate-500">Save these credentials — the password won't be shown again</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Credentials Card */}
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Full Name</span>
                <span className="font-bold text-slate-900">{createdUser.name}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-emerald-100 pt-2">
                <span className="text-slate-500 font-medium">Email (Login)</span>
                <span className="font-bold text-slate-900">{createdUser.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-emerald-100 pt-2">
                <span className="text-slate-500 font-medium">Role</span>
                <span className="font-bold text-emerald-700 uppercase text-[11px]">{createdUser.role.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-emerald-100 pt-2">
                <span className="text-slate-500 font-medium">Password</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200 text-[13px] tracking-wider">
                    {showPassword ? generatedPassword : '••••••••••'}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-700 transition-colors"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Info Banner */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800 flex items-start gap-2">
              <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                Share these credentials privately with the staff member. They can change their password from their Profile page after logging in.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCopyCredentials}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Done</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ──────────────────────────────────────────────
  // FORM SCREEN — Input fields for new staff
  // ──────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <UserPlus className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Staff Account</h3>
              <p className="text-[11px] text-slate-500">{tenant?.name || 'M Fitness and Gym'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800 font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sara Haile"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sara@gym.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role Permission</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none font-medium"
              >
                <option value="RECEPTIONIST">Receptionist / Front Desk</option>
                <option value="TRAINER">Trainer / Coach</option>
                <option value="GENERAL_MANAGER">General Manager</option>
                <option value="FINANCE_OFFICER">Finance Officer</option>
                <option value="MAINTENANCE_STAFF">Maintenance Staff</option>
                <option value="OWNER">Gym Owner / Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 91 000 0000"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600 flex items-start gap-2">
            <Shield className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              A secure password will be auto-generated and shown to you after creation. Share it privately with the staff member.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating...' : 'Create Account'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
