'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import {
  LayoutDashboard,
  QrCode,
  Users,
  UserCheck,
  Layers,
  KeyRound,
  FileSpreadsheet,
  Smartphone,
  ShieldCheck,
  Store,
  Sparkles,
  Receipt,
  Wrench,
  ShieldAlert,
  Bell,
  FileText,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { currentTenant, currentUser } = useAuth();
  const { t, isAmharic } = useLanguage();

  if (pathname === '/login' || pathname === '/' || pathname === '/access-denied') {
    return null;
  }

  // Normalize role
  const rawRole = currentUser?.role || 'OWNER';
  const role = rawRole === 'GYM_OWNER' ? 'OWNER' : rawRole;

  // Role-Specific Navigation Definitions per docs/02-roles-and-use-cases.md
  const allNavItems = [
    {
      label: isAmharic ? t.dashboard : 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'FINANCE_OFFICER'],
    },
    {
      label: isAmharic ? t.leads : 'Leads & Enquiries',
      href: '/leads',
      icon: UserCheck,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST'],
    },
    {
      label: isAmharic ? t.checkinKiosk : 'QR Check-In',
      href: '/checkin',
      icon: QrCode,
      badge: 'Live',
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST'],
    },
    {
      label: isAmharic ? t.members : 'Members',
      href: '/members',
      icon: Users,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'TRAINER', 'FINANCE_OFFICER'],
    },
    {
      label: isAmharic ? t.billing : 'Payments & POS',
      href: '/pos',
      icon: Store,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'FINANCE_OFFICER'],
    },
    {
      label: isAmharic ? 'ወጪዎችና ትርፍ' : 'Expenses & P&L',
      href: '/expenses',
      icon: Receipt,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'FINANCE_OFFICER'],
    },
    {
      label: isAmharic ? t.reports : 'Reports & Exports',
      href: '/reports',
      icon: FileSpreadsheet,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'FINANCE_OFFICER'],
    },
    {
      label: isAmharic ? 'ማሳወቂያዎች' : 'Notifications',
      href: '/notifications',
      icon: Bell,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST'],
    },
    {
      label: isAmharic ? t.maintenance : 'Equipment & Assets',
      href: '/equipment',
      icon: Wrench,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'MAINTENANCE_STAFF', 'TRAINER'],
    },
    {
      label: isAmharic ? t.packages : 'Packages & Plans',
      href: '/plans',
      icon: Layers,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER'],
    },
    {
      label: isAmharic ? t.staff : 'Staff & Shifts',
      href: '/staff',
      icon: ShieldCheck,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'MAINTENANCE_STAFF'],
    },
    {
      label: isAmharic ? 'የወረቀት መዝገብ ማስገቢያ' : 'Paper Import',
      href: '/import',
      icon: FileSpreadsheet,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST'],
    },
    {
      label: isAmharic ? 'የመቆለፊያ ሳጥኖች' : 'Lockers',
      href: '/lockers',
      icon: KeyRound,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST'],
    },
    {
      label: isAmharic ? t.memberPortal : 'Member Pass (PWA)',
      href: '/member-portal',
      icon: Smartphone,
      roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'TRAINER', 'MAINTENANCE_STAFF', 'FINANCE_OFFICER', 'MEMBER'],
    },
    {
      label: 'Platform Admin',
      href: '/super-admin',
      icon: Sparkles,
      badge: 'SaaS',
      roles: ['SUPER_ADMIN'],
    },
  ];

  const visibleItems = allNavItems.filter((item) =>
    item.roles.includes(role) || (role === 'OWNER' && item.roles.includes('GYM_OWNER'))
  );

  return (
    <aside
      aria-label="Main Navigation"
      className="w-[240px] shrink-0 border-r border-[#E5E7EB] bg-white p-3 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]"
    >
      <div className="space-y-4">
        {/* Organization & Branch Header */}
        <div className="rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-3">
          <div className="flex items-center gap-2.5">
            <div className="text-xl shrink-0">{currentTenant.logo || '🏋️'}</div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-[14px] leading-[20px] text-[#1F2937] truncate">
                {currentTenant.name}
              </h2>
              <p className="text-[12px] leading-[16px] text-[#1F2937]/60 truncate">
                {currentTenant.address}
              </p>
            </div>
          </div>
          <div className="mt-2.5 flex items-center justify-between border-t border-[#E5E7EB] pt-2 text-[12px] text-[#1F2937]/70">
            <span>Cap: {currentTenant.maxCapacity}</span>
            <span className="font-semibold text-[#0F766E]">
              {currentTenant.currencySymbol || currentTenant.currency || 'ETB'}
            </span>
          </div>
        </div>

        {/* Role-Scoped Navigation Menu */}
        <nav className="space-y-0.5">
          <div className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#1F2937]/50 flex items-center justify-between">
            <span>Workspace</span>
            <span className="text-[10px] font-mono text-[#0F766E] bg-[#0F766E]/10 px-1.5 py-0.5 rounded font-semibold">
              {role.replace('_', ' ')}
            </span>
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[14px] leading-[20px] font-medium transition-colors ${
                  isActive
                    ? 'bg-[#0F766E]/10 text-[#0F766E] font-semibold border-l-2 border-[#0F766E]'
                    : 'text-[#1F2937]/80 hover:bg-[#F8FAFC] hover:text-[#1F2937]'
                } focus-visible:outline-2 focus-visible:outline-[#0F766E]`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#0F766E]' : 'text-[#1F2937]/70'}`}
                    aria-hidden="true"
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                      item.badge === 'Live'
                        ? 'bg-[#0F766E] text-white'
                        : 'bg-[#F8FAFC] text-[#1F2937] border border-[#E5E7EB]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Status Footer */}
      {currentUser && (
        <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-2.5 flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[#0F766E] flex items-center justify-center text-white text-xs font-bold uppercase shrink-0 shadow-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="font-semibold text-[13px] text-[#1F2937] truncate">{currentUser.name}</p>
            <p className="text-[11px] text-[#0F766E] font-medium truncate">{currentUser.role.replace('_', ' ')}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
