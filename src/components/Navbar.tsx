'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  Dumbbell,
  Building2,
  ChevronDown,
  Sparkles,
  Smartphone,
  QrCode,
  LogOut,
  LogIn,
  Menu,
  X,
  LayoutDashboard,
  Users,
  FileSpreadsheet,
  Layers,
  Store,
  KeyRound,
  ShieldCheck,
  Receipt,
  Wrench,
  Compass,
} from 'lucide-react';
import { SalesPitchModal } from './SalesPitchModal';
import { OperationalAlertsDropdown } from './OperationalAlertsDropdown';
import { DemoBanner } from './DemoBanner';
import { PilotJourneyModal } from './PilotJourneyModal';
import { LanguageToggle } from './LanguageToggle';

export function Navbar() {
  const pathname = usePathname();
  const { currentTenant, currentUser, allTenants, allUsers, switchTenant, switchUser, logout, refreshData } = useAuth();
  const [occupancy, setOccupancy] = useState<{ current: number; max: number; percentage: number }>({
    current: 0,
    max: 80,
    percentage: 0,
  });
  const [showTenantMenu, setShowTenantMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPitchModal, setShowPitchModal] = useState(false);
  const [showJourneyModal, setShowJourneyModal] = useState(false);

  useEffect(() => {
    const fetchOccupancy = async () => {
      try {
        const res = await fetch(`/api/checkin?tenantId=${currentTenant.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.occupancy) setOccupancy(data.occupancy);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchOccupancy();
    const interval = setInterval(fetchOccupancy, 10000);
    return () => clearInterval(interval);
  }, [currentTenant.id]);

  if (pathname === '/' || pathname === '/login' || pathname === '/access-denied') return null;

  const rawRole = currentUser?.role || 'OWNER';
  const role = rawRole === 'GYM_OWNER' ? 'OWNER' : rawRole;

  const getRoleBadgeStyle = (userRole: string) => {
    switch (userRole) {
      case 'SUPER_ADMIN':
        return 'bg-[#1F2937] text-white border-[#1F2937]';
      case 'OWNER':
      case 'GYM_OWNER':
        return 'bg-[#0F766E] text-white border-[#0F766E]';
      case 'GENERAL_MANAGER':
        return 'bg-[#0F766E]/15 text-[#0F766E] border-[#0F766E]/30';
      case 'FINANCE_OFFICER':
        return 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/30';
      case 'RECEPTIONIST':
        return 'bg-[#F8FAFC] text-[#1F2937] border-[#E5E7EB]';
      case 'TRAINER':
        return 'bg-[#F8FAFC] text-[#0F766E] border-[#E5E7EB]';
      case 'MAINTENANCE_STAFF':
        return 'bg-[#F8FAFC] text-[#1F2937]/80 border-[#E5E7EB]';
      default:
        return 'bg-[#F8FAFC] text-[#1F2937]/60 border-[#E5E7EB]';
    }
  };

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'FINANCE_OFFICER'] },
    { label: 'QR Check-In Kiosk', href: '/checkin', icon: QrCode, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST'] },
    { label: 'Members', href: '/members', icon: Users, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'TRAINER', 'FINANCE_OFFICER'] },
    { label: 'Payments & POS', href: '/pos', icon: Store, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'FINANCE_OFFICER'] },
    { label: 'Expenses & P&L', href: '/expenses', icon: Receipt, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'FINANCE_OFFICER'] },
    { label: 'Equipment & Assets', href: '/equipment', icon: Wrench, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'MAINTENANCE_STAFF', 'TRAINER'] },
    { label: 'Packages & Plans', href: '/plans', icon: Layers, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER'] },
    { label: 'Staff & Shifts', href: '/staff', icon: ShieldCheck, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'MAINTENANCE_STAFF'] },
    { label: 'Paper Importer', href: '/import', icon: FileSpreadsheet, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST'] },
    { label: 'Lockers', href: '/lockers', icon: KeyRound, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST'] },
    { label: 'Member Pass PWA', href: '/member-portal', icon: Smartphone, roles: ['SUPER_ADMIN', 'OWNER', 'GENERAL_MANAGER', 'RECEPTIONIST', 'TRAINER', 'MAINTENANCE_STAFF', 'FINANCE_OFFICER', 'MEMBER'] },
  ].filter((item) => item.roles.includes(role) || (role === 'OWNER' && item.roles.includes('GYM_OWNER')));

  return (
    <>
      <DemoBanner onOpenJourneyTour={() => setShowJourneyModal(true)} />
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E7EB] bg-white h-16 shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Gym Selector */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#1F2937] focus-visible:outline-2 focus-visible:outline-[#0F766E]"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group focus-visible:outline-2 focus-visible:outline-[#0F766E]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F766E] text-white font-black shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[18px] leading-[24px] text-[#1F2937]">GymOS</span>
                <span className="rounded bg-[#0F766E]/10 px-1.5 py-0.2 text-[10px] font-bold text-[#0F766E] uppercase border border-[#0F766E]/20">
                  {currentTenant.planTier}
                </span>
              </div>
            </div>
          </Link>

          {/* Organization Badge - Strictly isolated: other organization users NEVER see list of other gyms */}
          {role === 'SUPER_ADMIN' && allTenants.length > 1 ? (
            <div className="relative hidden sm:block">
              <button
                onClick={() => setShowTenantMenu(!showTenantMenu)}
                className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-[12px] font-semibold text-[#1F2937] hover:bg-white transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
              >
                <Building2 className="h-3.5 w-3.5 text-[#0F766E]" />
                <span className="max-w-[130px] truncate">{currentTenant.name}</span>
                <ChevronDown className="h-3 w-3 text-[#1F2937]/50" />
              </button>

              {showTenantMenu && (
                <div className="absolute left-0 mt-2 w-64 rounded-lg border border-[#E5E7EB] bg-white p-1.5 shadow-lg z-50">
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#1F2937]/50 uppercase tracking-wider">
                    Select Organization (Super Admin Only)
                  </div>
                  {allTenants.map((tenant) => (
                    <button
                      key={tenant.id}
                      onClick={() => {
                        switchTenant(tenant.id);
                        setShowTenantMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-md px-2.5 py-2 text-[12px] transition-colors ${
                        tenant.id === currentTenant.id
                          ? 'bg-[#0F766E]/10 text-[#0F766E] font-semibold'
                          : 'text-[#1F2937] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{tenant.logo || '🏋️'}</span>
                        <span className="truncate">{tenant.name}</span>
                      </div>
                      <span className="text-[10px] text-[#1F2937]/50">{tenant.currency}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Non-super-admins: static badge only, never sees list or dropdown of other gyms */
            <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-2.5 py-1.5 text-[12px] font-medium text-[#1F2937]">
              <Building2 className="h-3.5 w-3.5 text-[#0F766E]" />
              <span className="max-w-[140px] truncate">{currentTenant.name}</span>
            </div>
          )}
        </div>

        {/* Center: Live Occupancy Counter */}
        <div className="hidden lg:flex items-center gap-2.5 rounded-full border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 py-1 text-[12px]">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0F766E]"></span>
          </span>
          <span className="text-[#1F2937]/70 font-medium">Floor Occupancy:</span>
          <span className="font-bold text-[#1F2937] tabular-nums">
            {occupancy.current} / {occupancy.max} <span className="text-[#1F2937]/50">({occupancy.percentage}%)</span>
          </span>
          <div className="h-1.5 w-16 rounded-full bg-[#E5E7EB] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                occupancy.percentage > 85 ? 'bg-[#D97706]' : 'bg-[#0F766E]'
              }`}
              style={{ width: `${occupancy.percentage}%` }}
            />
          </div>
        </div>

        {/* Right: Quick Actions, Alerts & User Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <LanguageToggle />
          <OperationalAlertsDropdown tenantId={currentTenant.id} />

          {role !== 'MEMBER' && (
            <Link
              href="/checkin"
              className="flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm hover:bg-[#0F766E]/90 transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
            >
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">QR Kiosk</span>
            </Link>
          )}

          <Link
            href="/member-portal"
            className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#1F2937] hover:bg-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
            title="Member Pass PWA View"
          >
            <Smartphone className="h-3.5 w-3.5 text-[#0F766E]" />
            <span className="hidden md:inline">Member Pass</span>
          </Link>

          <button
            type="button"
            onClick={() => setShowJourneyModal(true)}
            aria-label="Interactive pilot journey walkthrough"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 px-2.5 py-1.5 text-[12px] font-bold hover:bg-emerald-100 transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
            title="Launch Prompt 7 Pilot Journey Tour"
          >
            <Compass className="h-3.5 w-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Pilot Tour</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPitchModal(true)}
            aria-label="Demo pitch and reset tools"
            className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#0F766E]" />
            <span className="hidden md:inline">Demo & Pitch</span>
          </button>

          {/* User & Role Switcher */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                aria-label={`Logged in as ${currentUser.name}, role ${currentUser.role}`}
                className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white p-1 sm:px-2.5 sm:py-1 hover:bg-[#F8FAFC] transition-colors focus-visible:outline-2 focus-visible:outline-[#0F766E]"
              >
                <div className="h-7 w-7 rounded-full bg-[#1F2937] flex items-center justify-center text-[12px] font-bold text-white uppercase">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="text-left hidden xl:block">
                  <div className="text-[13px] font-semibold text-[#1F2937] leading-tight">{currentUser.name}</div>
                  <span
                    className={`inline-block text-[10px] font-semibold uppercase px-1 rounded border ${getRoleBadgeStyle(
                      currentUser.role
                    )}`}
                  >
                    {currentUser.role.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-[#1F2937]/50" />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-lg border border-[#E5E7EB] bg-white p-2 shadow-xl z-50">
                  <div className="px-2 py-1 text-[11px] font-semibold text-[#1F2937]/50 uppercase tracking-wider">
                    Switch Role View (Demo)
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-0.5">
                    {allUsers
                      .filter((u) => role === 'SUPER_ADMIN' || u.tenantId === currentTenant.id)
                      .map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          switchUser(u.id);
                          setShowRoleMenu(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[12px] transition-colors ${
                          u.id === currentUser.id
                            ? 'bg-[#0F766E]/10 text-[#0F766E] font-semibold'
                            : 'text-[#1F2937] hover:bg-[#F8FAFC]'
                        }`}
                      >
                        <div className="text-left truncate pr-2">
                          <p className="font-medium text-[#1F2937] truncate">{u.name}</p>
                          <p className="text-[10px] text-[#1F2937]/50 truncate">{u.email}</p>
                        </div>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded border shrink-0 ${getRoleBadgeStyle(
                            u.role
                          )}`}
                        >
                          {u.role.replace('_', ' ')}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 border-t border-[#E5E7EB] pt-1.5">
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-[12px] font-medium text-[#1F2937] hover:bg-[#F8FAFC] transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5 text-[#1F2937]/60" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC] focus-visible:outline-2 focus-visible:outline-[#0F766E]"
            >
              <LogIn className="h-3.5 w-3.5 text-[#0F766E]" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E5E7EB] bg-white p-3 space-y-1 shadow-md">
          <div className="px-2.5 py-1 text-[11px] font-semibold uppercase text-[#1F2937]/50 tracking-wider">
            Workspace Navigation
          </div>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[14px] font-medium ${
                  isActive
                    ? 'bg-[#0F766E]/10 text-[#0F766E] font-semibold border-l-2 border-[#0F766E]'
                    : 'text-[#1F2937] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-[#0F766E]' : 'text-[#1F2937]/60'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Sales Pitch & Demo Reset Modal */}
      {showPitchModal && (
        <SalesPitchModal
          onClose={() => setShowPitchModal(false)}
          onResetData={async () => {
            await fetch('/api/admin/reset', { method: 'POST' });
            await refreshData();
            window.location.reload();
          }}
        />
      )}

      {/* Pilot Journey Walkthrough Modal */}
      <PilotJourneyModal
        isOpen={showJourneyModal}
        onClose={() => setShowJourneyModal(false)}
      />
    </header>
  </>
  );
}
