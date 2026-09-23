'use client';

import React from 'react';
import { useLanguage } from '@/lib/language-context';
import { Languages } from 'lucide-react';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`inline-flex items-center rounded-xl border border-slate-200 bg-white p-1 shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
          language === 'en'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="English"
      >
        <span>EN</span>
      </button>
      <button
        type="button"
        onClick={() => setLanguage('am')}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
          language === 'am'
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
        }`}
        title="አማርኛ (Amharic)"
      >
        <Languages className="h-3.5 w-3.5" />
        <span>አማርኛ</span>
      </button>
    </div>
  );
}
