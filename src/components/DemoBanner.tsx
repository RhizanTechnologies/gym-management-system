'use client';

import React, { useState } from 'react';
import { Sparkles, ShieldAlert, RotateCcw, Compass, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface DemoBannerProps {
  onOpenJourneyTour?: () => void;
  onResetData?: () => Promise<void>;
}

export function DemoBanner({ onOpenJourneyTour, onResetData }: DemoBannerProps) {
  const { currentTenant } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Only display if the current workspace is a demo instance
  if (dismissed) return null;

  const handleReset = async () => {
    if (confirm('Reset demo gym data (members, invoices, tickets, check-ins) to pristine pilot state?')) {
      setIsResetting(true);
      try {
        await fetch('/api/admin/reset', { method: 'POST' });
        window.location.reload();
      } catch (e) {
        console.error('Reset failed:', e);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <aside
      aria-label="Pilot Demonstration Environment Notice"
      className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-b border-emerald-500/30 text-white text-xs px-3 sm:px-6 py-2 shadow-sm relative z-40"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        {/* Left: Pilot Demo Notice */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-black text-[11px] border border-emerald-500/30">
            DEMO
          </span>
          <div className="truncate text-slate-200 text-[11px] sm:text-xs">
            <span className="font-bold text-white tracking-wide">
              {currentTenant?.name || 'M Fitness and Gym'}
            </span>{' '}
            <span className="text-emerald-400 font-semibold">• Pilot Instance</span>{' '}
            <span className="hidden md:inline text-slate-400">
              (Believable synthetic data • Zero real personal/health PII)
            </span>
          </div>
        </div>

        {/* Right: Quick Action Triggers */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onOpenJourneyTour && (
            <button
              onClick={onOpenJourneyTour}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] transition shadow-xs"
              title="Launch step-by-step walkthrough of Prompt 7 user journey"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Pilot Journey Tour</span>
              <ChevronRight className="w-3 h-3 ml-0.5 opacity-70" />
            </button>
          )}

          <button
            onClick={handleReset}
            disabled={isResetting}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-[11px] border border-slate-700 transition"
            title="Reset demo records to initial pristine state"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset State</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss demo banner for current session"
            className="text-slate-400 hover:text-white p-0.5 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
