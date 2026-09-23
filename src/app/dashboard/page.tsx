'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Member, CheckInLog, DateRangePeriod, MetricDrillDownType, Branch } from '@/lib/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { MemberCardModal } from '@/components/MemberCardModal';
import { NewMemberModal } from '@/components/NewMemberModal';
import { MetricDrillDownModal } from '@/components/MetricDrillDownModal';
import {
  Users,
  UserCheck,
  TrendingUp,
  AlertTriangle,
  QrCode,
  UserPlus,
  FileSpreadsheet,
  Store,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Receipt,
  Wrench,
  DollarSign,
  Percent,
  Calendar,
  Building2,
  Filter,
  CheckCircle2,
  ArrowUpRight,
  Bell,
  RefreshCw,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const PERIOD_OPTIONS: { label: string; value: DateRangePeriod }[] = [
  { label: 'Today', value: 'TODAY' },
  { label: 'Yesterday', value: 'YESTERDAY' },
  { label: 'This Week', value: 'THIS_WEEK' },
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'This Quarter', value: 'THIS_QUARTER' },
  { label: 'This Year', value: 'THIS_YEAR' },
  { label: 'Custom', value: 'CUSTOM' },
];

const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

export default function DashboardPage() {
  const { currentTenant, currentUser } = useAuth();

  // Filters State
  const [selectedPeriod, setSelectedPeriod] = useState<DateRangePeriod>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [branches, setBranches] = useState<Branch[]>([]);

  // Dashboard Data State
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dashboard, setDashboard] = useState<any>(null);

  // Drill Down State
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = useState<boolean>(false);
  const [drillDownLoading, setDrillDownLoading] = useState<boolean>(false);

  // Modals
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showNewMemberModal, setShowNewMemberModal] = useState(false);
  const [plans, setPlans] = useState([]);
  const [lockers, setLockers] = useState([]);

  // Fetch branches once
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch(`/api/branches?tenantId=${currentTenant.id}`);
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || []);
        }
      } catch (e) {
        console.error('Failed to load branches:', e);
      }
    }
    loadBranches();
  }, [currentTenant.id]);

  // Fetch dashboard data whenever filter changes
  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: currentTenant.id,
        branchId: selectedBranchId,
        period: selectedPeriod,
      });
      if (selectedPeriod === 'CUSTOM') {
        if (customStartDate) params.set('startDate', customStartDate);
        if (customEndDate) params.set('endDate', customEndDate);
      }

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDashboard(data.dashboard);
      }

      // Also fetch auxiliary plans & lockers for the registration modal
      const [resPlans, resLockers] = await Promise.all([
        fetch(`/api/plans?tenantId=${currentTenant.id}`),
        fetch(`/api/lockers?tenantId=${currentTenant.id}`),
      ]);
      if (resPlans.ok) setPlans((await resPlans.json()).plans || []);
      if (resLockers.ok) setLockers((await resLockers.json()).lockers || []);
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [currentTenant.id, selectedBranchId, selectedPeriod, customStartDate, customEndDate]);

  // Handler for KPI Card Click -> Open Drill Down
  const handleCardClick = async (metricType: MetricDrillDownType) => {
    setDrillDownLoading(true);
    try {
      const params = new URLSearchParams({
        tenantId: currentTenant.id,
        branchId: selectedBranchId,
        period: selectedPeriod,
        drillDown: metricType,
      });
      if (selectedPeriod === 'CUSTOM') {
        if (customStartDate) params.set('startDate', customStartDate);
        if (customEndDate) params.set('endDate', customEndDate);
      }

      const res = await fetch(`/api/dashboard?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setDrillDownData(data.drillDown);
        setIsDrillDownOpen(true);
      }
    } catch (e) {
      console.error('Failed to fetch drill down data:', e);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const selectedBranchName =
    selectedBranchId === 'ALL'
      ? 'All Branches'
      : branches.find((b) => b.id === selectedBranchId)?.name || 'Selected Branch';

  const filterContextText = `${selectedBranchName} • ${dashboard?.dateRange?.label || selectedPeriod}`;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Branch/Date Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Executive Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Live Reconciled
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Multi-branch analytics, financial totals, and 1-click reconciling drill-downs.
            </p>
          </div>

          {/* Controls: Branch Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action Links */}
            <Link
              href="/reports"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-500" />
              <span>Reports & Export</span>
            </Link>

            <Link
              href="/notifications"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Notifications</span>
            </Link>

            <button
              onClick={() => setShowNewMemberModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Member</span>
            </button>
          </div>
        </div>

        {/* Date Range Period Filter Pills */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5" />
            Period:
          </span>
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedPeriod(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedPeriod === opt.value
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}

          {/* Custom Date Pickers */}
          {selectedPeriod === 'CUSTOM' && (
            <div className="flex items-center gap-2 ml-auto">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200"
              />
              <span className="text-slate-400 text-xs">to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200"
              />
            </div>
          )}
        </div>
      </div>

      {/* 2. Empty / First-Use Dashboard Guided State (Criterion 8) */}
      {dashboard?.isFirstUse && (
        <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="max-w-2xl">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Welcome to GymOS!
            </span>
            <h2 className="text-xl font-bold text-white mt-2">Let&apos;s get your facility up and running</h2>
            <p className="text-sm text-slate-300 mt-1">
              Your dashboard currently has no records. Follow these meaningful steps to get started:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <button
                onClick={() => setShowNewMemberModal(true)}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition"
              >
                <UserPlus className="w-5 h-5 text-emerald-400 mb-1" />
                <div className="text-xs font-bold text-white">1. Register Member</div>
                <div className="text-[11px] text-slate-400">Enroll your first member</div>
              </button>

              <Link
                href="/plans"
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition"
              >
                <Store className="w-5 h-5 text-blue-400 mb-1" />
                <div className="text-xs font-bold text-white">2. Set Up Plans</div>
                <div className="text-[11px] text-slate-400">Configure prices & tiers</div>
              </Link>

              <Link
                href="/checkin"
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition"
              >
                <QrCode className="w-5 h-5 text-purple-400 mb-1" />
                <div className="text-xs font-bold text-white">3. Check-In Desk</div>
                <div className="text-[11px] text-slate-400">Test reception scanning</div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 3. Reconciled Metric KPI Cards Grid (Clickable to Drill Down) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Gross Revenue Card */}
        <div
          onClick={() => handleCardClick('REVENUE')}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Gross Revenue
              </span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {formatCurrency(dashboard?.revenue?.total || 0)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{dashboard?.revenue?.count || 0} invoices</span>
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition">
              Drill down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Total Expenses Card */}
        <div
          onClick={() => handleCardClick('EXPENSES')}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition">
                <Receipt className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {formatCurrency(dashboard?.expenses?.total || 0)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{dashboard?.expenses?.count || 0} vouchers</span>
            <span className="flex items-center text-rose-600 dark:text-rose-400 font-semibold group-hover:translate-x-0.5 transition">
              Drill down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Net Profit & Margin Card */}
        <div
          onClick={() => handleCardClick('NET_PROFIT')}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Net Profit
              </span>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span
                className={`text-2xl font-black ${
                  (dashboard?.profitAndLoss?.netProfit || 0) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(dashboard?.profitAndLoss?.netProfit || 0)}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400">
                {dashboard?.profitAndLoss?.profitMarginPercent || 0}% margin
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">Rev - Expenses</span>
            <span className="flex items-center text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition">
              Drill down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Active Members Card */}
        <div
          onClick={() => handleCardClick('ACTIVE_MEMBERS')}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Members
              </span>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {dashboard?.members?.active || 0}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{dashboard?.members?.total || 0} total enrolled</span>
            <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold group-hover:translate-x-0.5 transition">
              Drill down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* New Members (This Period) Card */}
        <div
          onClick={() => handleCardClick('NEW_MEMBERS')}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/50 dark:hover:border-teal-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                New Joiners
              </span>
              <div className="p-2 bg-teal-50 dark:bg-teal-950/60 rounded-xl text-teal-600 dark:text-teal-400 group-hover:scale-110 transition">
                <UserPlus className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
              {dashboard?.members?.newThisPeriod || 0}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">Joined in period</span>
            <span className="flex items-center text-teal-600 dark:text-teal-400 font-semibold group-hover:translate-x-0.5 transition">
              Drill down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Expiring Soon Card */}
        <div
          onClick={() => handleCardClick('EXPIRING_SOON')}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 dark:hover:border-amber-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Expiring Soon
              </span>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl text-amber-600 dark:text-amber-400 group-hover:scale-110 transition">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-2">
              {dashboard?.members?.expiringSoon || 0}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">Expires within 7 days</span>
            <span className="flex items-center text-amber-600 dark:text-amber-400 font-semibold group-hover:translate-x-0.5 transition">
              Drill down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Outstanding Dues Card */}
        <div
          onClick={() => handleCardClick('OUTSTANDING_BALANCES')}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 dark:hover:border-rose-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Uncollected Dues
              </span>
              <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600 dark:text-rose-400 group-hover:scale-110 transition">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-2">
              {formatCurrency(dashboard?.debts?.totalOutstanding || 0)}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">{dashboard?.debts?.debtorCount || 0} debtors</span>
            <span className="flex items-center text-rose-600 dark:text-rose-400 font-semibold group-hover:translate-x-0.5 transition">
              Drill down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Check-ins & Live Occupancy Card */}
        <div
          onClick={() => handleCardClick('CHECK_INS')}
          className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 dark:hover:border-cyan-500/50 rounded-2xl p-5 shadow-sm hover:shadow-md cursor-pointer transition flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Total Check-Ins
              </span>
              <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 rounded-xl text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {dashboard?.checkIns?.total || 0}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                ({dashboard?.checkIns?.todayTotal || 0} today)
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="truncate">
              Occupancy: {dashboard?.checkIns?.occupancy?.current || 0}/{dashboard?.checkIns?.occupancy?.max || 80}
            </span>
            <span className="flex items-center text-cyan-600 dark:text-cyan-400 font-semibold group-hover:translate-x-0.5 transition">
              Drill down <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>
      </div>

      {/* 4. Visual Analytics & Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Gym Visits by Time</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Hourly attendance flow ({filterContextText})</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
              {dashboard?.checkIns?.total || 0} total
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard?.checkIns?.hourlyDistribution || []}>
                <XAxis dataKey="time" stroke="#64748B" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1E293B',
                    borderRadius: '8px',
                    border: 'none',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="visits" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Plan / Service */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Revenue Distribution</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">By membership plan ({filterContextText})</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
              {formatCurrency(dashboard?.revenue?.total || 0)}
            </span>
          </div>
          <div className="h-64">
            {(!dashboard?.revenue?.breakdownByPlan || dashboard.revenue.breakdownByPlan.length === 0) ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No revenue records in this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboard.revenue.breakdownByPlan}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="amount"
                    nameKey="planName"
                    label={({ name, percent }) => `${name.slice(0, 12)} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {dashboard.revenue.breakdownByPlan.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* 5. Reconciled Drill Down Modal */}
      <MetricDrillDownModal
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        drillDownData={drillDownData}
        branchName={selectedBranchName}
      />

      {/* Auxiliary Modals */}
      {selectedMember && (
        <MemberCardModal member={selectedMember} tenant={currentTenant} onClose={() => setSelectedMember(null)} />
      )}
      {showNewMemberModal && (
        <NewMemberModal
          tenant={currentTenant}
          plans={plans}
          lockers={lockers}
          onClose={() => setShowNewMemberModal(false)}
          onCreated={() => {
            setShowNewMemberModal(false);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
