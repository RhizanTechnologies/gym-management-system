import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-sm text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center mb-5 text-[#1F2937]">
          <HelpCircle className="w-7 h-7 text-[#1F2937]" />
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#F8FAFC] text-[#1F2937]/70 border border-[#E5E7EB] mb-3">
          Error 404
        </span>

        <h1 className="text-[22px] leading-[30px] font-bold text-[#1F2937] mb-2">
          Page Not Found
        </h1>

        <p className="text-[14px] leading-[20px] text-[#1F2937]/70 mb-6">
          The requested page could not be located or has moved. Please verify the URL or return to the application dashboard.
        </p>

        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F766E] text-white text-[14px] font-semibold hover:bg-[#0F766E]/90 transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
