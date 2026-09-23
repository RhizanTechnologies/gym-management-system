'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-sm text-center">
        {/* Error icon in Ink with Gold attention dot */}
        <div className="mx-auto w-14 h-14 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center mb-5 text-[#1F2937] relative">
          <AlertCircle className="w-7 h-7 text-[#1F2937]" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-[#D97706] rounded-full border-2 border-white" />
        </div>

        <h1 className="text-[22px] leading-[30px] font-bold text-[#1F2937] mb-2">
          An Unexpected Error Occurred
        </h1>

        <p className="text-[14px] leading-[20px] text-[#1F2937]/70 mb-6">
          The system encountered an error while processing your request. Any committed data remains
          safe. You can retry the action or return to the overview.
        </p>

        {error.digest && (
          <div className="text-[12px] font-mono text-[#1F2937]/60 bg-[#F8FAFC] p-2 rounded mb-6 border border-[#E5E7EB]">
            Digest: {error.digest}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F766E] text-white text-[14px] font-semibold hover:bg-[#0F766E]/90 transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] text-[14px] font-semibold hover:bg-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
          >
            <Home className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
