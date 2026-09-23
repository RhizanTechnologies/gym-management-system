'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  DollarSign,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Smartphone,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';

interface SalesPitchModalProps {
  onClose: () => void;
  onResetData: () => Promise<void>;
}

export function SalesPitchModal({ onClose, onResetData }: SalesPitchModalProps) {
  const [memberCount, setMemberCount] = useState<number>(200);
  const [avgMembershipFee, setAvgMembershipFee] = useState<number>(45);
  const [isResetting, setIsResetting] = useState(false);

  // Financial ROI estimation:
  // Gyms using paper typically lose 8-12% of revenue to forgotten expirations and unpaid dues
  const uncollectedRevenueLost = Math.round(memberCount * avgMembershipFee * 0.1);
  const annualSavings = uncollectedRevenueLost * 12;

  const handleReset = async () => {
    if (confirm('Are you sure you want to reset all demo members, check-ins, and lockers to original pristine state?')) {
      setIsResetting(true);
      await onResetData();
      setIsResetting(false);
      alert('Demo data successfully restored to fresh presentation state!');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 font-black">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Commercial Pitch & Sales Deck Kit</h2>
            <p className="text-xs text-slate-500">
              Interactive ROI calculator & presentation talking points to close gym owners this week.
            </p>
          </div>
        </div>

        {/* 2-Minute Pitch Playbook */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <Zap className="h-4 w-4" /> 2-Minute Pitch Playbook
          </h3>

          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                1
              </span>
              <p>
                <strong>The Pain:</strong> <i>&quot;How many members enter your gym with expired memberships or unpaid dues because receptionists are too busy writing in paper notebooks?&quot;</i>
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                2
              </span>
              <p>
                <strong>The Solution (Show Check-in Kiosk):</strong> Demonstrate the 1-second QR scan. Show the sound chime for active members and instant buzzer + WhatsApp reminder for expired members.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px]">
                3
              </span>
              <p>
                <strong>The Value:</strong> Show the digital locker matrix, POS retail receipts, and the end-of-day cash drawer Z-report that prevents cash leakage.
              </p>
            </div>
          </div>
        </div>

        {/* Interactive ROI Calculator */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <span>Interactive Gym ROI Calculator</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Total Gym Members</label>
              <input
                type="number"
                value={memberCount}
                onChange={(e) => setMemberCount(Math.max(10, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Average Monthly Fee ($)</label>
              <input
                type="number"
                value={avgMembershipFee}
                onChange={(e) => setAvgMembershipFee(Math.max(5, Number(e.target.value) || 0))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-emerald-50 p-4 border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div>
              <span className="text-xs text-slate-600">Estimated Uncollected Dues Recovered:</span>
              <p className="text-2xl font-black text-emerald-700">
                +${uncollectedRevenueLost.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-500">/ month</span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-600">Annual Recovered Revenue:</span>
              <p className="text-xl font-black text-slate-900">+${annualSavings.toLocaleString()} / year</p>
            </div>
          </div>
        </div>

        {/* Demo Data Reset Action */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
          <div>
            <p className="text-xs font-bold text-slate-900">Presentation Reset</p>
            <p className="text-[10px] text-slate-500">Restore clean demo members, active lockers & sales</p>
          </div>

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all"
          >
            <RotateCcw className={`h-4 w-4 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Resetting...' : 'Reset Demo Data'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
