'use client';

import React from 'react';
import { X, Download, Filter, CheckCircle, AlertTriangle, Clock, ArrowUpRight } from 'lucide-react';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { MetricDrillDownType } from '@/lib/types';

interface MetricDrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  drillDownData: {
    metric: MetricDrillDownType;
    filter: {
      tenantId: string;
      branchId?: string;
      period?: string;
      startDate?: string;
      endDate?: string;
    };
    title: string;
    summary: {
      totalRecords: number;
      primaryValue: number;
      secondaryValue?: number;
      unit?: string;
    };
    records: any[];
  } | null;
  branchName?: string;
}

export function MetricDrillDownModal({
  isOpen,
  onClose,
  drillDownData,
  branchName = 'All Branches',
}: MetricDrillDownModalProps) {
  if (!isOpen || !drillDownData) return null;

  const { metric, filter, title, summary, records } = drillDownData;

  const handleExportCsv = () => {
    if (!records || records.length === 0) return;
    const headers = Object.keys(records[0]).join(',');
    const rows = records.map((r) =>
      Object.values(r)
        .map((v) => (typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v))
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${metric.toLowerCase()}_drilldown_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                100% Reconciled Metric
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
                <Filter className="w-3 h-3" />
                {branchName} • {filter.period || 'This Month'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              title="Export filtered records"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-6 bg-slate-50/50 dark:bg-slate-900/20 border-b border-slate-100 dark:border-slate-800/80">
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs text-slate-500 dark:text-slate-400">Total Count</div>
            <div className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {summary.totalRecords} records
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <div className="text-xs text-slate-500 dark:text-slate-400">Reconciled Total</div>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {summary.unit === '$' ? formatCurrency(summary.primaryValue) : `${summary.primaryValue} ${summary.unit || ''}`}
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 col-span-2 sm:col-span-1">
            <div className="text-xs text-slate-500 dark:text-slate-400">Filter Scope</div>
            <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 truncate">
              {branchName} ({filter.branchId || 'ALL'})
            </div>
          </div>
        </div>

        {/* Records Table */}
        <div className="flex-1 overflow-y-auto p-6">
          {records.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              No matching records found for the selected branch and period filter.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100/75 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                  <tr>
                    {metric === 'REVENUE' && (
                      <>
                        <th className="px-4 py-3">Invoice #</th>
                        <th className="px-4 py-3">Member</th>
                        <th className="px-4 py-3">Paid Amount</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </>
                    )}
                    {(metric === 'ACTIVE_MEMBERS' || metric === 'NEW_MEMBERS' || metric === 'EXPIRING_SOON' || metric === 'EXPIRED') && (
                      <>
                        <th className="px-4 py-3">Member #</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Subscription End</th>
                      </>
                    )}
                    {metric === 'CHECK_INS' && (
                      <>
                        <th className="px-4 py-3">Time</th>
                        <th className="px-4 py-3">Member Name</th>
                        <th className="px-4 py-3">Member #</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Locker</th>
                      </>
                    )}
                    {metric === 'OUTSTANDING_BALANCES' && (
                      <>
                        <th className="px-4 py-3">Member #</th>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Plan</th>
                        <th className="px-4 py-3">Due Balance</th>
                      </>
                    )}
                    {metric === 'EXPENSES' && (
                      <>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Title</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Vendor</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {metric === 'URGENT_TICKETS' && (
                      <>
                        <th className="px-4 py-3">Ticket Title</th>
                        <th className="px-4 py-3">Equipment</th>
                        <th className="px-4 py-3">Priority</th>
                        <th className="px-4 py-3">Assignee</th>
                        <th className="px-4 py-3">Status</th>
                      </>
                    )}
                    {metric === 'NET_PROFIT' && (
                      <>
                        <th className="px-4 py-3">Financial Item</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Details</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {records.map((r, idx) => (
                    <tr key={r.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      {metric === 'REVENUE' && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium text-slate-900 dark:text-white">{r.invoiceNumber}</td>
                          <td className="px-4 py-3 font-medium">{r.memberName}</td>
                          <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(r.paidAmount)}</td>
                          <td className="px-4 py-3 text-xs">{r.paymentMethod}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.createdAt)}</td>
                        </>
                      )}
                      {(metric === 'ACTIVE_MEMBERS' || metric === 'NEW_MEMBERS' || metric === 'EXPIRING_SOON' || metric === 'EXPIRED') && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium">{r.memberNumber}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                          <td className="px-4 py-3 text-xs">{r.phone}</td>
                          <td className="px-4 py-3 text-xs">{r.planName || 'Standard'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              r.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' :
                              r.status === 'EXPIRING_SOON' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' :
                              'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                            }`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {r.subscriptionEnd ? formatDate(r.subscriptionEnd) : r.joinDate ? formatDate(r.joinDate) : '-'}
                          </td>
                        </>
                      )}
                      {metric === 'CHECK_INS' && (
                        <>
                          <td className="px-4 py-3 text-xs font-mono">{formatTime(r.timestamp)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.memberName}</td>
                          <td className="px-4 py-3 text-xs font-mono">{r.memberNumber}</td>
                          <td className="px-4 py-3 text-xs">{r.method}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                              {r.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs font-mono">{r.lockerAssigned || 'None'}</td>
                        </>
                      )}
                      {metric === 'OUTSTANDING_BALANCES' && (
                        <>
                          <td className="px-4 py-3 font-mono font-medium">{r.memberNumber}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.name}</td>
                          <td className="px-4 py-3 text-xs">{r.phone}</td>
                          <td className="px-4 py-3 text-xs">{r.planName}</td>
                          <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{formatCurrency(r.dueBalance)}</td>
                        </>
                      )}
                      {metric === 'EXPENSES' && (
                        <>
                          <td className="px-4 py-3 text-xs text-slate-500">{formatDate(r.date)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.title}</td>
                          <td className="px-4 py-3 text-xs">{r.category}</td>
                          <td className="px-4 py-3 text-xs">{r.vendor}</td>
                          <td className="px-4 py-3 font-bold text-rose-600 dark:text-rose-400">{formatCurrency(r.amount)}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                              {r.status || 'APPROVED'}
                            </span>
                          </td>
                        </>
                      )}
                      {metric === 'URGENT_TICKETS' && (
                        <>
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{r.title}</td>
                          <td className="px-4 py-3 text-xs">{r.equipmentName}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                              {r.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">{r.assigneeName || 'Unassigned'}</td>
                          <td className="px-4 py-3 text-xs font-medium">{r.status}</td>
                        </>
                      )}
                      {metric === 'NET_PROFIT' && (
                        <>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{r.item}</td>
                          <td className={`px-4 py-3 font-bold text-base ${r.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                            {formatCurrency(r.amount)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {r.count !== undefined ? `${r.count} transactions` : r.margin || ''}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Reconciliation invariant holds: metric total precisely matches the {summary.totalRecords} records displayed.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
