'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Compass,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  QrCode,
  AlertTriangle,
  Receipt,
  UserCheck,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Users,
  Wrench,
  DollarSign,
  User,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { UserRole } from '@/lib/types';

interface PilotJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JourneyStep {
  stepNumber: number;
  id: string;
  title: string;
  actorRole: UserRole;
  actorName: string;
  summary: string;
  keyVerification: string;
  targetHref: string;
  actionText: string;
  icon: any;
}

export function PilotJourneyModal({ isOpen, onClose }: PilotJourneyModalProps) {
  const router = useRouter();
  const { currentUser, switchUser, allUsers, currentTenant } = useAuth();
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!isOpen) return null;

  const journeySteps: JourneyStep[] = [
    {
      stepNumber: 1,
      id: 'prospect_packages',
      title: 'Prospect Compares Packages & Submits Lead',
      actorRole: 'MEMBER',
      actorName: 'Prospective Member',
      summary:
        'A fitness prospect visits the public landing page, evaluates multi-tier membership options (Day Pass, Monthly, Quarterly, VIP), and submits an inquiry or free trial request.',
      keyVerification:
        'Public offerings reflect realistic packages and create traceable leads in the follow-up queue.',
      targetHref: '/',
      actionText: 'Visit Public Landing Page',
      icon: TrendingUp,
    },
    {
      stepNumber: 2,
      id: 'registration_billing',
      title: 'Receptionist Registers Member & Issues Receipt',
      actorRole: 'RECEPTIONIST',
      actorName: 'Selam Tesfaye (Receptionist)',
      summary:
        'Receptionist enrolls new member, collects payment (Cash, CBE Birr, Telebirr), issues a sequential audit receipt, and provisions an instant digital QR pass.',
      keyVerification:
        'Immutable receipt generated with timestamp, zero personal info leaked into QR token.',
      targetHref: '/members',
      actionText: 'Go to Reception Members Desk',
      icon: Receipt,
    },
    {
      stepNumber: 3,
      id: 'active_checkin',
      title: 'Active Member QR Check-In Approved',
      actorRole: 'RECEPTIONIST',
      actorName: 'Yonas Abraham (Active Member)',
      summary:
        'Active member presents mobile QR pass at turnstile. System verifies valid subscription date, records entry timestamp, allocates digital locker, and sounds green approval chime.',
      keyVerification:
        'Turnstile grants access instantly with green feedback and accurate occupancy tracking.',
      targetHref: '/checkin',
      actionText: 'Go to Check-in Turnstile Kiosk',
      icon: QrCode,
    },
    {
      stepNumber: 4,
      id: 'expired_checkin',
      title: 'Expired Member QR Check-In Declined',
      actorRole: 'RECEPTIONIST',
      actorName: 'Elias Tadesse (Expired Member)',
      summary:
        'Member with expired plan scans QR pass. Check-in engine blocks entry, displays red warning banner, sounds buzzer, and presents one-tap WhatsApp renewal message button.',
      keyVerification:
        'Access declined with clear expiration reason; prevents unauthorized facility usage.',
      targetHref: '/checkin',
      actionText: 'Test Expired Member Scan',
      icon: AlertTriangle,
    },
    {
      stepNumber: 5,
      id: 'maintenance_lockout',
      title: 'Maintenance Defect Filed & Asset Locked Out',
      actorRole: 'MAINTENANCE_STAFF',
      actorName: 'Kassahun Mengistu (Maintenance)',
      summary:
        'Staff inspects equipment and logs a CRITICAL_SAFETY_HAZARD ticket. The machine is automatically switched to OUT_OF_SERVICE, broadcasting a safety alert across the facility.',
      keyVerification:
        'Hazardous equipment visibly locked out until repaired and verified in service history.',
      targetHref: '/equipment',
      actionText: 'Go to Equipment Register',
      icon: Wrench,
    },
    {
      stepNumber: 6,
      id: 'role_quality_pass',
      title: 'End-to-End 7-Role Quality & Permission Pass',
      actorRole: 'OWNER',
      actorName: 'Role-Based Access Control (RBAC)',
      summary:
        'Verify strict principle of least-privilege across all 7 default roles: Owner, General Manager, Receptionist, Trainer, Maintenance, Finance Officer, and Member.',
      keyVerification:
        'Maintenance staff blocked from financials, Trainers see only assigned clients, Receptionists blocked from expense approvals.',
      targetHref: '/staff',
      actionText: 'Inspect Staff & Roles Matrix',
      icon: ShieldCheck,
    },
    {
      stepNumber: 7,
      id: 'owner_dashboard',
      title: 'Owner Reviews Reconciled Dashboard & Reports',
      actorRole: 'OWNER',
      actorName: 'Dawit Bekele (Gym Owner)',
      summary:
        'Executive owner reviews today revenue, expenses, net profit, active member cohorts, and aged receivables. Clicks any KPI card to drill down into exact reconciling invoices.',
      keyVerification:
        '100% mathematical reconciliation between dashboard cards and underlying itemized ledgers.',
      targetHref: '/dashboard',
      actionText: 'Go to Executive Dashboard',
      icon: DollarSign,
    },
  ];

  const currentStep = journeySteps[activeStepIndex];

  // Helper to switch role automatically to match current step actor
  const handleSwitchRoleAndNavigate = (targetHref: string, targetRole: UserRole) => {
    const matchingUser = allUsers.find(
      (u: any) => u.tenantId === currentTenant?.id && (u.role === targetRole || (targetRole === 'OWNER' && u.role === 'OWNER'))
    ) || allUsers.find((u: any) => u.role === targetRole);

    if (matchingUser) {
      switchUser(matchingUser.id);
    }
    onClose();
    router.push(targetHref);
  };

  const defaultRolesList: { role: UserRole; name: string; title: string; desc: string }[] = [
    {
      role: 'OWNER',
      name: 'Dawit Bekele',
      title: 'Gym Owner',
      desc: 'Unrestricted executive oversight, financial reports, settings, staff',
    },
    {
      role: 'GENERAL_MANAGER',
      name: 'Helen Haile',
      title: 'General Manager',
      desc: 'Operational management, expense approvals up to $1,000, staff scheduling',
    },
    {
      role: 'RECEPTIONIST',
      name: 'Selam Tesfaye',
      title: 'Receptionist',
      desc: 'Member registration, payments, receipt generation, turnstile desk',
    },
    {
      role: 'TRAINER',
      name: 'Coach Marcus',
      title: 'Head Trainer',
      desc: 'Only assigned PT clients, logged sessions, masked medical notes',
    },
    {
      role: 'MAINTENANCE_STAFF',
      name: 'Kassahun Mengistu',
      title: 'Facility Technician',
      desc: 'Equipment inventory, defect tickets; strictly blocked from financials/members',
    },
    {
      role: 'FINANCE_OFFICER',
      name: 'Tewodros Girma',
      title: 'Finance Officer',
      desc: 'Billing ledger, receipts, expenses, audit export; no staff schedule edits',
    },
    {
      role: 'MEMBER',
      name: 'Yonas Abraham',
      title: 'Gym Member',
      desc: 'Self-service mobile pass, check-in QR, assigned locker, attendance history',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/90 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white">
                  Pilot Demonstration Journey Walkthrough
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Prompt 7 Ready
                </span>
              </div>
              <p className="text-xs text-slate-400">
                End-to-end commercial demonstration for owners, managers, and pilot evaluators.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close walkthrough modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Step Progress Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {journeySteps.map((step, idx) => {
              const isActive = idx === activeStepIndex;
              const isPast = idx < activeStepIndex;
              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`p-2 rounded-xl text-left transition border text-xs flex flex-col justify-between h-20 ${
                    isActive
                      ? 'bg-emerald-600/20 border-emerald-500 text-white shadow-xs'
                      : isPast
                      ? 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                      : 'bg-slate-900/40 border-slate-800/80 text-slate-500 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-400' : 'text-slate-400'}`}>
                      Stage {step.stepNumber}
                    </span>
                    {isPast && <Check className="w-3 h-3 text-emerald-400" />}
                  </div>
                  <div className="font-semibold line-clamp-2 text-[11px] leading-snug">
                    {step.title.split(' ')[0]} {step.title.split(' ')[1]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Step Feature Box */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/40 p-5 sm:p-6 relative overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-700/60 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                  <currentStep.icon className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    Stage {currentStep.stepNumber} of 7
                  </span>
                  <h3 className="text-lg font-bold text-white mt-0.5">{currentStep.title}</h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Target Persona:</span>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-700 text-slate-200 border border-slate-600">
                  {currentStep.actorName}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Workflow Scenario
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed">{currentStep.summary}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Pilot Release Check</span>
                  </div>
                  <p className="text-xs text-slate-300">{currentStep.keyVerification}</p>
                </div>
              </div>

              <div className="flex flex-col justify-between bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Instant 1-Click Action
                  </div>
                  <p className="text-xs text-slate-300 mb-4">
                    Clicking the button will automatically impersonate{' '}
                    <strong className="text-white">{currentStep.actorName}</strong> and navigate to the exact workflow
                    screen.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <button
                    onClick={() => handleSwitchRoleAndNavigate(currentStep.targetHref, currentStep.actorRole)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
                  >
                    <span>{currentStep.actionText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  {activeStepIndex < journeySteps.length - 1 ? (
                    <button
                      onClick={() => setActiveStepIndex((prev) => prev + 1)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition text-center"
                    >
                      Next Step →
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveStepIndex(0)}
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition text-center"
                    >
                      Restart Tour ↺
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 7-Role Quality Pass Quick Switcher Matrix */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                <h4 className="text-sm font-bold text-white">Default 7-Role Quality Pass & RBAC Matrix</h4>
              </div>
              <span className="text-[11px] text-slate-400">Currently Logged In: <strong className="text-emerald-400">{currentUser?.name} ({currentUser?.role})</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {defaultRolesList.map((item) => {
                const isCurrent = currentUser?.role === item.role;
                return (
                  <button
                    key={item.role}
                    onClick={() => {
                      const matching = allUsers.find((u: any) => u.role === item.role);
                      if (matching) switchUser(matching.id);
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      isCurrent
                        ? 'bg-emerald-950/40 border-emerald-500 text-white shadow-xs'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{item.title}</span>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                          isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-slate-300'
                        }`}
                      >
                        {item.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{item.name}</div>
                    <div className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-tight">{item.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800 bg-slate-900/90 px-6 py-3 gap-2">
          <div className="text-[11px] text-slate-400">
            🧪 Pilot Demo Gym: <strong className="text-white">Apex Fitness Hub</strong> • Synthetic Non-PII Data
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            Close Tour
          </button>
        </div>
      </div>
    </div>
  );
}
