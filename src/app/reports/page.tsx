'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { DateRangePeriod, FinancialReportData, Branch } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  FileSpreadsheet,
  Download,
  Building2,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  ShieldCheck,
  AlertTriangle,
  Lock,
  CheckCircle2,
  FileText,
  Clock,
  PieChart as PieIcon,
} from 'lucide-react';

const PERIOD_OPTIONS: { label: string; value: DateRangePeriod }[] = [
  { label: 'This Month', value: 'THIS_MONTH' },
  { label: 'This Quarter', value: 'THIS_QUARTER' },
  { label: 'This Year', value: 'THIS_YEAR' },
  { label: 'Custom', value: 'CUSTOM' },
];

export default function ReportsPage() {
  const { currentTenant, currentUser } = useAuth();

  const [selectedPeriod, setSelectedPeriod] = useState<DateRangePeriod>('THIS_YEAR');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('ALL');
  const [branches, setBranches] = useState<Branch[]>([]);

  const [report, setReport] = useState<FinancialReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Check if current user is authorized to export
  // Only Owner, GM, Finance Officer, Super Admin
  const isAuthorizedToExport =
    currentUser?.role === 'OWNER' ||
    currentUser?.role === 'GYM_OWNER' ||
    currentUser?.role === 'GENERAL_MANAGER' ||
    currentUser?.role === 'FINANCE_OFFICER' ||
    currentUser?.role === 'SUPER_ADMIN';

  // Load branches
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

  // Load report data
  const fetchReport = async () => {
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

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
      }
    } catch (e) {
      console.error('Failed to fetch report:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [currentTenant.id, selectedBranchId, selectedPeriod, customStartDate, customEndDate]);

  // Export handler
  const handleExport = async (reportType: 'FINANCIAL' | 'MEMBERSHIP' | 'CHECK_IN' | 'EXPENSES', format: 'CSV' | 'JSON') => {
    if (!isAuthorizedToExport) {
      setExportError('Access Denied: Only Finance Officers, General Managers, and Owners can export reports.');
      return;
    }
    setIsExporting(true);
    setExportError(null);

    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-role': currentUser?.role || '',
          'x-tenant-id': currentTenant.id,
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          branchId: selectedBranchId,
          reportType,
          format,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Export failed.');
      }

      // Download the blob
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileExt = format === 'CSV' ? 'csv' : 'json';
      link.download = `${currentTenant.slug || 'apex'}_${reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}.${fileExt}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setExportError(err.message || 'An error occurred while exporting.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedBranchName =
    selectedBranchId === 'ALL'
      ? 'All Branches'
      : branches.find((b) => b.id === selectedBranchId)?.name || 'Selected Branch';

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Financial & Organizational Reports
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                P&L • Aged Dues • Exports
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Role-governed audit-grade reports with scoped CSV and JSON exports.
            </p>
          </div>

          {/* Export Controls Toolbar */}
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

            {/* Export CSV Button */}
            <button
              onClick={() => handleExport('FINANCIAL', 'CSV')}
              disabled={isExporting}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition shadow-sm ${
                isAuthorizedToExport
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
              title={isAuthorizedToExport ? 'Export financial statement as CSV' : 'Export requires Finance Officer or Owner role'}
            >
              {isAuthorizedToExport ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Export CSV</span>
            </button>

            {/* Export JSON Button */}
            <button
              onClick={() => handleExport('FINANCIAL', 'JSON')}
              disabled={isExporting}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition shadow-sm ${
                isAuthorizedToExport
                  ? 'bg-slate-800 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              {isAuthorizedToExport ? <Download className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Date Filters */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5" />
            Reporting Period:
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

        {/* Role Authorization Alert */}
        {!isAuthorizedToExport && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-800 dark:text-amber-300">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              You are signed in as <strong>{currentUser?.role}</strong>. Organizational report exports are restricted to <strong>Finance Officers, General Managers, and Owners</strong> to protect member privacy and financial integrity.
            </span>
          </div>
        )}

        {exportError && (
          <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
            {exportError}
          </div>
        )}
      </div>

      {/* Financial Statement (P&L Summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Gross Revenue</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(report?.grossRevenue || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">100% of recognized income</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Operating Expenses</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatCurrency(report?.totalExpenses || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Approved & paid vouchers</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Net Profit</div>
          <div
            className={`text-2xl font-black mt-1 ${
              (report?.netProfit || 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatCurrency(report?.netProfit || 0)}
          </div>
          <div className="text-xs text-slate-400 mt-2">Revenue minus Expenses</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-semibold text-slate-500 uppercase">Profit Margin</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {report?.profitMarginPercent || 0}%
          </div>
          <div className="text-xs text-slate-400 mt-2">Net Margin efficiency</div>
        </div>
      </div>

      {/* Aged Accounts Receivable (Aged Debts) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Aged Accounts Receivable</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Outstanding member balances categorized by days past due ({selectedBranchName})
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
            Total Overdue: {formatCurrency(report?.outstandingBalances?.totalOutstanding || 0)}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="text-xs font-medium text-slate-500">0 - 30 Days</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(report?.outstandingBalances?.aged0To30 || 0)}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">Recently overdue</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="text-xs font-medium text-slate-500">31 - 60 Days</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(report?.outstandingBalances?.aged31To60 || 0)}
            </div>
            <div className="text-[11px] text-amber-600 mt-1">Requires follow-up</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="text-xs font-medium text-slate-500">61 - 90 Days</div>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {formatCurrency(report?.outstandingBalances?.aged61To90 || 0)}
            </div>
            <div className="text-[11px] text-rose-500 mt-1">Urgent notice</div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="text-xs font-medium text-slate-500">90+ Days</div>
            <div className="text-lg font-bold text-rose-600 dark:text-rose-400 mt-1">
              {formatCurrency(report?.outstandingBalances?.aged90Plus || 0)}
            </div>
            <div className="text-[11px] text-rose-600 font-medium mt-1">Collection risk</div>
          </div>
        </div>
      </div>

      {/* Membership & Renewal Performance Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Membership Status Cohort */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Membership Lifecycle Status</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="font-medium text-slate-700 dark:text-slate-300">Active Members</span>
              <span className="font-bold text-emerald-600">{report?.membershipStatusDistribution?.active || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="font-medium text-slate-700 dark:text-slate-300">Expiring Soon (&lt; 7 Days)</span>
              <span className="font-bold text-amber-600">{report?.membershipStatusDistribution?.expiringSoon || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="font-medium text-slate-700 dark:text-slate-300">Expired Members</span>
              <span className="font-bold text-rose-600">{report?.membershipStatusDistribution?.expired || 0}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/40">
              <span className="font-medium text-slate-700 dark:text-slate-300">Frozen & Suspended</span>
              <span className="font-bold text-slate-600 dark:text-slate-400">
                {(report?.membershipStatusDistribution?.frozen || 0) + (report?.membershipStatusDistribution?.suspended || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Renewal & Churn Metrics */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Retention & Conversion</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600 dark:text-slate-400">Renewal Conversion Rate</span>
                <span className="text-emerald-600 dark:text-emerald-400">{report?.renewalMetrics?.conversionRatePercent || 0}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, report?.renewalMetrics?.conversionRatePercent || 0)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500">Renewed Members</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {report?.renewalMetrics?.renewedCount || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <div className="text-xs text-slate-500">Churned Members</div>
                <div className="text-xl font-bold text-rose-600 mt-0.5">
                  {report?.renewalMetrics?.churnedCount || 0}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
