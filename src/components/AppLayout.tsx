'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/Navbar';
import { Sidebar } from '@/components/Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/access-denied' ||
    pathname === '/member-portal';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, isPublicPage, pathname, router]);

  // 1. Standalone pages: Public Landing Page, Login, and Access-Denied
  if (pathname === '/' || pathname === '/login' || pathname === '/access-denied') {
    return <main className="min-h-screen w-full bg-[#F8FAFC] text-[#1F2937]">{children}</main>;
  }

  // 2. Member Portal PWA (Mobile-first self-service view, no desktop sidebar)
  if (pathname === '/member-portal') {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#1F2937]">
        <main className="flex-1 w-full max-w-lg mx-auto p-4 sm:p-6">{children}</main>
      </div>
    );
  }

  // If unauthenticated and not on public page, show loading state while redirecting
  if (!isAuthenticated && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] border-t-[#0F766E] animate-spin" />
      </div>
    );
  }

  // 3. Admin & Staff Workspace Shell: 240px sidebar, 64px header, max 1440px content
  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC] text-[#1F2937]">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-4 sm:p-6 max-w-[1440px] mx-auto w-full overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
