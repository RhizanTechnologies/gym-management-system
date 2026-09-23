'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function AccessDeniedPage() {
  const { currentUser, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F8FAFC]">
      <div className="w-full max-w-md bg-white border border-[#E5E7EB] rounded-xl p-8 shadow-sm text-center">
        {/* Shield icon with Warm Gold alert indicator */}
        <div className="mx-auto w-14 h-14 rounded-full bg-[#F8FAFC] border border-[#E5E7EB] flex items-center justify-center mb-5 text-[#1F2937] relative">
          <ShieldAlert className="w-7 h-7 text-[#1F2937]" />
          <span className="absolute top-0 right-0 w-3 h-3 bg-[#D97706] rounded-full border-2 border-white" />
        </div>

        <span className="inline-block px-2.5 py-0.5 rounded-full text-[12px] font-semibold bg-[#F8FAFC] text-[#D97706] border border-[#E5E7EB] mb-3">
          Access Restricted
        </span>

        <h1 className="text-[22px] leading-[30px] font-bold text-[#1F2937] mb-2">
          Permission Required
        </h1>

        <p className="text-[14px] leading-[20px] text-[#1F2937]/70 mb-4">
          You do not have the required role permissions to view or perform operations on this section.
        </p>

        {isAuthenticated && currentUser && (
          <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-lg p-3 text-left mb-6 text-[13px] text-[#1F2937]/80">
            <div className="flex justify-between py-1">
              <span className="text-[#1F2937]/60">Logged in as:</span>
              <span className="font-semibold text-[#1F2937]">{currentUser.name}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-[#E5E7EB]/60">
              <span className="text-[#1F2937]/60">Assigned Role:</span>
              <span className="font-semibold text-[#0F766E]">{currentUser.role.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between py-1 border-t border-[#E5E7EB]/60">
              <span className="text-[#1F2937]/60">Policy rule:</span>
              <span className="text-[#1F2937]/70">Least-privilege operational boundary</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F766E] text-white text-[14px] font-semibold hover:bg-[#0F766E]/90 transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Allowed Workspace</span>
          </Link>

          {!isAuthenticated && (
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-[#1F2937] text-[14px] font-semibold hover:bg-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
