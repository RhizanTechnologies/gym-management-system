'use client';

import React, { useState } from 'react';
import { Member, MembershipPlan, Locker, Tenant } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { X, UserCheck, Trash2, Snowflake, Sparkles } from 'lucide-react';

interface EditMemberModalProps {
  member: Member;
  tenant: Tenant;
  plans: MembershipPlan[];
  lockers: Locker[];
  onClose: () => void;
  onUpdated: () => void;
  onDeleted?: () => void;
}

export function EditMemberModal({
  member,
  tenant,
  plans,
  lockers,
  onClose,
  onUpdated,
  onDeleted,
}: EditMemberModalProps) {
  const { currentUser } = useAuth();
  const [firstName, setFirstName] = useState(member.firstName);
  const [lastName, setLastName] = useState(member.lastName);
  const [phone, setPhone] = useState(member.phone);
  const [email, setEmail] = useState(member.email || '');
  const [planId, setPlanId] = useState(member.currentPlanId || plans[0]?.id || '');
  const [dueBalance, setDueBalance] = useState(member.dueBalance.toString());
  const [assignedLockerNumber, setAssignedLockerNumber] = useState(member.assignedLockerNumber || '');
  const [emergencyContactName, setEmergencyContactName] = useState(member.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(member.emergencyContactPhone || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const availableLockers = lockers.filter(
    (l) => l.status === 'AVAILABLE' || l.number === member.assignedLockerNumber
  );

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const plan = plans.find((p) => p.id === planId);
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'RECEPTIONIST',
          'x-user-id': currentUser?.id || 'user-staff-1',
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          firstName,
          lastName,
          phone,
          email: email || undefined,
          currentPlanId: planId,
          currentPlanName: plan?.name,
          dueBalance: parseFloat(dueBalance) || 0,
          assignedLockerNumber: assignedLockerNumber || undefined,
          emergencyContactName: emergencyContactName || undefined,
          emergencyContactPhone: emergencyContactPhone || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update member');
      }

      onUpdated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Update failed';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFreeze = async () => {
    if (!confirm(`Freeze ${member.firstName}'s membership for 30 days? Expiration date will be extended.`)) return;

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'RECEPTIONIST',
          'x-user-id': currentUser?.id || 'user-staff-1',
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          status: 'FROZEN',
        }),
      });

      if (res.ok) {
        onUpdated();
        onClose();
      }
    } catch (e) {
      console.error('Freeze error', e);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${member.firstName} ${member.lastName}? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/members/${member.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'OWNER',
          'x-user-id': currentUser?.id || 'user-owner-1',
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({ tenantId: tenant.id }),
      });

      if (res.ok) {
        if (onDeleted) onDeleted();
        else onUpdated();
        onClose();
      }
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Edit Member Profile</h2>
              <p className="text-xs text-slate-500">{member.memberNumber} • {tenant.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (${p.price})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Assigned Locker</label>
              <select
                value={assignedLockerNumber}
                onChange={(e) => setAssignedLockerNumber(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="">No Locker</option>
                {availableLockers.map((l) => (
                  <option key={l.id} value={l.number}>
                    Locker {l.number} ({l.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Outstanding Due Balance ($)</label>
            <input
              type="number"
              min="0"
              step="any"
              value={dueBalance}
              onChange={(e) => setDueBalance(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
            />
          </div>

          {/* Action Row */}
          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleFreeze}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <Snowflake className="h-3.5 w-3.5 text-slate-600" />
                <span>Freeze (30d)</span>
              </button>

              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-500 shadow-sm transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
