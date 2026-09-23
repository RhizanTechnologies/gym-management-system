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
      className="bg-emerald-50 border-b border-emerald-200 text-emerald-900 text-xs px-3 sm:px-6 py-2 shadow-xs relative z-40"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        {/* Left: Pilot Demo Notice */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-600 text-white font-black text-[11px] shadow-xs">
            DEMO
          </span>
          <div className="truncate text-emerald-950 text-[11px] sm:text-xs">
            <span className="font-bold tracking-wide">
              {currentTenant?.name || 'M Fitness and Gym'}
            </span>{' '}
            <span className="text-emerald-700 font-semibold">• Pilot Instance</span>{' '}
            <span className="hidden md:inline text-emerald-800/70">
              (Believable synthetic data • Zero real personal/health PII)
            </span>
          </div>
        </div>

        {/* Right: Quick Action Triggers */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {onOpenJourneyTour && (
            <button
              onClick={onOpenJourneyTour}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] transition shadow-xs"
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
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-emerald-100 text-emerald-800 hover:text-emerald-950 font-medium text-[11px] border border-emerald-300 transition shadow-xs"
            title="Reset demo records to initial pristine state"
          >
            <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Reset State</span>
          </button>

          <button
            onClick={() => setDismissed(true)}
            aria-label="Dismiss demo banner for current session"
            className="text-emerald-700 hover:text-emerald-950 p-0.5 rounded transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
