'use client';

import React, { useState } from 'react';
import { Tenant } from '@/lib/types';
import { X, KeyRound, CheckCircle2 } from 'lucide-react';

interface AddLockerModalProps {
  tenant: Tenant;
  onClose: () => void;
  onCreated: () => void;
}

export function AddLockerModal({ tenant, onClose, onCreated }: AddLockerModalProps) {
  const [number, setNumber] = useState('');
  const [zone, setZone] = useState('Cardio Zone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!number) {
      setError('Locker Number is required.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          action: 'CREATE_LOCKER',
          number,
          zone,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create locker');
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating locker';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-emerald-600" />
            <h3 className="font-extrabold text-sm text-slate-900">Add New Gym Locker</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Locker Number / ID *</label>
            <input
              type="text"
              required
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. L-15 or VIP-05"
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Locker Zone / Area</label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
            >
              <option value="Cardio Zone">Cardio Zone</option>
              <option value="Free Weights">Free Weights</option>
              <option value="Locker Room A">Locker Room A (Men)</option>
              <option value="Locker Room B">Locker Room B (Women)</option>
              <option value="VIP Lounge">VIP Lounge</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-500 shadow-sm transition-all"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Adding...' : 'Add Locker'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
