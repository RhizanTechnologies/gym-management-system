'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Receipt,
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  Building,
  CreditCard,
  Trash2,
  Filter,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Check,
  XCircle,
  Ban,
  Search,
  Paperclip,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Expense, ProfitLossSummary, ExpenseCategory, ExpenseStatus } from '@/lib/types';

export default function ExpensesPage() {
  const { currentTenant, currentUser } = useAuth();
  const [summary, setSummary] = useState<ProfitLossSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Action States
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionModal, setActionModal] = useState<{
    type: 'REJECT' | 'VOID' | 'APPROVE';
    expense: Expense;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'UTILITIES' as ExpenseCategory,
    amount: '',
    paymentMethod: 'CASH' as const,
    vendor: '',
    date: new Date().toISOString().split('T')[0],
    receiptNumber: '',
    evidenceUrl: '',
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const params = new URLSearchParams({ tenantId: currentTenant.id });
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const [sumRes, expRes] = await Promise.all([
        fetch(`/api/expenses?tenantId=${currentTenant.id}&summary=true`),
        fetch(`/api/expenses?${params.toString()}`),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        if (sumData.summary) setSummary(sumData.summary);
      }

      if (expRes.ok) {
        const expData = await expRes.json();
        if (expData.expenses) setExpenses(expData.expenses);
      } else {
        const errData = await expRes.json().catch(() => ({}));
        setFetchError(errData.error || `Failed to load expenses (${expRes.status})`);
      }
    } catch (e: any) {
      console.error(e);
      setFetchError(e.message || 'Network error loading financial expenses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTenant.id, categoryFilter, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount || !formData.vendor) return;

    try {
      setSubmitting(true);
      setActionError(null);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          ...formData,
          amount: parseFloat(formData.amount),
          loggedBy: currentUser?.name || 'Manager',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddModal(false);
        setFormData({
          title: '',
          category: 'UTILITIES',
          amount: '',
          paymentMethod: 'CASH',
          vendor: '',
          date: new Date().toISOString().split('T')[0],
          receiptNumber: '',
          evidenceUrl: '',
          notes: '',
        });
        fetchData();
      } else {
        setActionError(data.error || 'Failed to record expense');
      }
    } catch (err: any) {
      setActionError(err.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionModal) return;
    const { type, expense } = actionModal;

    if ((type === 'REJECT' || type === 'VOID') && !actionReason.trim()) {
      setActionError('A valid reason is required for financial auditability.');
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      const res = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: type,
          id: expense.id,
          tenantId: currentTenant.id,
          reason: actionReason,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setActionModal(null);
        setActionReason('');
        fetchData();
      } else {
        setActionError(data.error || `Failed to ${type.toLowerCase()} expense`);
      }
    } catch (err: any) {
      setActionError(err.message || 'Action failed');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${currentTenant.currencySymbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'UTILITIES':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'EQUIPMENT_REPAIR':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'PAYROLL':
        return 'bg-slate-900 text-white border-slate-900';
      case 'INVENTORY':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status?: ExpenseStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PENDING_APPROVAL':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'REJECTED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'VOIDED':
        return 'bg-slate-200 text-slate-600 border-slate-300 line-through';
      case 'PAID':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Receipt className="h-5 w-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Expenses & Financial Ledger</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Server-enforced approval limits ($1,000 threshold for Managers), non-destructive audit voiding, and live P&L.
          </p>
        </div>

        <button
          onClick={() => {
            setActionError(null);
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* P&L Financial Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Gross Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <ArrowUpRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {summary ? formatCurrency(summary.grossRevenue) : '$0.00'}
            </h2>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span>Plans: {summary ? formatCurrency(summary.membershipRevenue) : '$0'}</span>
              <span>•</span>
              <span>POS: {summary ? formatCurrency(summary.posRevenue) : '$0'}</span>
              <span>•</span>
              <span>Lockers: {summary ? formatCurrency(summary.lockerRevenue) : '$0'}</span>
            </div>
          </div>
        </div>

        {/* Total Operational Expenses */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Deductions</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ArrowDownRight className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <h2 className="text-3xl font-extrabold text-slate-900">
              {summary ? formatCurrency(summary.totalExpenses) : '$0.00'}
            </h2>
            <p className="mt-2 text-[11px] text-slate-500">
              Approved operational costs (voided and rejected items are excluded)
            </p>
          </div>
        </div>

        {/* Net Profit */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Operating Profit</span>
            <span className="flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
              <Percent className="h-3 w-3" />
              {summary ? `${summary.profitMarginPercent}% Margin` : '0%'}
            </span>
          </div>
          <div className="mt-3">
            <h2 className={`text-3xl font-extrabold ${summary && summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {summary ? formatCurrency(summary.netProfit) : '$0.00'}
            </h2>
            <p className="mt-2 text-[11px] text-slate-500">
              Current net margin after deducting approved gym expenses
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Status Navigation Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'All Records' },
              { id: 'PENDING_APPROVAL', label: 'Pending Approval' },
              { id: 'APPROVED', label: 'Approved' },
              { id: 'VOIDED', label: 'Voided' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-colors ${
                  statusFilter === st.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') fetchData();
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Category:
          </span>
          {['ALL', 'UTILITIES', 'EQUIPMENT_REPAIR', 'PAYROLL', 'INVENTORY', 'FACILITY_RENT'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-xs font-semibold">Loading financial records & expense ledger...</p>
        </div>
      )}

      {fetchError && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Unable to Access Expenses</h3>
          <p className="text-xs text-rose-700 mt-1">{fetchError}</p>
          <button
            onClick={fetchData}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Itemized Expense Ledger Table */}
      {!loading && !fetchError && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Itemized Expenditure History</h3>
              <p className="text-xs text-slate-500 mt-0.5">{expenses.length} records matching current filter</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Expense & Vendor</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Evidence</th>
                  <th className="px-5 py-3.5">Logged By</th>
                  <th className="px-5 py-3.5 text-right">Amount</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <Receipt className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No expense records found.</p>
                      <p className="mt-0.5">Try changing your search term or click "Record Expense".</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => {
                    const isPending = expense.status === 'PENDING_APPROVAL';
                    const isOverLimit = expense.amount > 1000;

                    return (
                      <tr
                        key={expense.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          expense.status === 'VOIDED' ? 'opacity-60 bg-slate-50/40' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5 font-medium text-slate-900 whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString()}
                        </td>

                        <td className="px-5 py-3.5">
                          <p className={`font-bold ${expense.status === 'VOIDED' ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                            {expense.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                            <span>Vendor: <strong>{expense.vendor}</strong></span>
                            <span>•</span>
                            <span>{expense.paymentMethod}</span>
                          </div>
                          {expense.voidReason && (
                            <p className="mt-1 text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Voided by {expense.voidedBy}: "{expense.voidReason}"
                            </p>
                          )}
                          {expense.rejectionReason && (
                            <p className="mt-1 text-[10px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              Rejected: "{expense.rejectionReason}"
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`inline-block text-[10px] px-2 py-0.5 rounded border ${getCategoryBadge(expense.category)}`}>
                            {expense.category.replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-block text-[10px] px-2 py-0.5 rounded border font-semibold ${getStatusBadge(expense.status)}`}>
                              {(expense.status || 'PENDING_APPROVAL').replace(/_/g, ' ')}
                            </span>
                            {isPending && isOverLimit && (
                              <span className="text-[9px] font-bold text-amber-800 bg-amber-50 px-1 rounded border border-amber-200">
                                Owner/Finance Approval Req. (&gt;$1k)
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {expense.evidenceUrl ? (
                            <a
                              href={expense.evidenceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 rounded bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] font-bold text-slate-800"
                              title="View receipt evidence document"
                            >
                              <Paperclip className="h-3 w-3 text-slate-500" />
                              <span>Receipt</span>
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">None</span>
                          )}
                        </td>

                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap text-[11px]">
                          {expense.loggedBy}
                        </td>

                        <td className="px-5 py-3.5 text-right font-extrabold whitespace-nowrap">
                          <span className={expense.status === 'VOIDED' ? 'line-through text-slate-400' : 'text-slate-900'}>
                            {formatCurrency(expense.amount)}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending && (
                              <>
                                <button
                                  onClick={() => {
                                    setActionModal({ type: 'APPROVE', expense });
                                    setActionReason('');
                                    setActionError(null);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 shadow-xs"
                                  title="Approve expense"
                                >
                                  <Check className="h-3 w-3" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setActionModal({ type: 'REJECT', expense });
                                    setActionReason('');
                                    setActionError(null);
                                  }}
                                  className="inline-flex items-center gap-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 px-2 py-1 text-[10px] font-bold hover:bg-rose-100"
                                  title="Reject expense"
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>Reject</span>
                                </button>
                              </>
                            )}

                            {expense.status !== 'VOIDED' && (
                              <button
                                onClick={() => {
                                  setActionModal({ type: 'VOID', expense });
                                  setActionReason('');
                                  setActionError(null);
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Void expense record (auditable correction)"
                              >
                                <Ban className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Record Operational Expense</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Expense Description / Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., HVAC Maintenance or Towel Replenishment"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="UTILITIES">Utilities (Water, Power, HVAC)</option>
                    <option value="EQUIPMENT_REPAIR">Equipment Repair & Maintenance</option>
                    <option value="PAYROLL">Staff & Trainer Payroll</option>
                    <option value="INVENTORY">POS Inventory Restocking</option>
                    <option value="FACILITY_RENT">Facility Rent & Lease</option>
                    <option value="MARKETING">Marketing & Advertising</option>
                    <option value="OTHER">Other Operational Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Amount ({currentTenant.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  />
                  {parseFloat(formData.amount) > 1000 && (
                    <p className="text-[10px] text-amber-700 mt-1 font-semibold flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />
                      Amount exceeds $1,000 threshold. Will require Owner or Finance Officer sign-off.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Vendor / Payee Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Power Utility Corp, CleanPro"
                    value={formData.vendor}
                    onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="CASH">Cash Drawer</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date Logged</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Receipt / Invoice Evidence URL</label>
                  <input
                    type="text"
                    placeholder="https://receipts.internal/inv-101.pdf"
                    value={formData.evidenceUrl}
                    onChange={(e) => setFormData({ ...formData, evidenceUrl: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Notes / Explanation</label>
                <textarea
                  rows={2}
                  placeholder="Optional internal justification or details..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Save & Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Action Approval / Rejection / Voiding Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {actionModal.type === 'APPROVE' && 'Approve Operational Expense'}
                {actionModal.type === 'REJECT' && 'Reject Expense Request'}
                {actionModal.type === 'VOID' && 'Void Expense Record (Auditable)'}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {actionError && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-semibold">
                {actionError}
              </div>
            )}

            <div className="mt-4 space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                <p className="font-bold text-slate-900">{actionModal.expense.title}</p>
                <p className="text-slate-500 mt-0.5">
                  Vendor: {actionModal.expense.vendor} | Amount: <strong>{formatCurrency(actionModal.expense.amount)}</strong>
                </p>
                {actionModal.expense.amount > 1000 && (
                  <p className="mt-2 text-[10px] font-bold text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                    Threshold Policy: Expenses exceeding $1,000 require Owner or Finance Officer authorization. Managers attempting approval will be blocked server-side.
                  </p>
                )}
              </div>

              {(actionModal.type === 'REJECT' || actionModal.type === 'VOID') && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Audit Reason (Required for Financial Integrity) *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide mandatory reason for ledger audit trail..."
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              )}

              {actionModal.type === 'APPROVE' && (
                <p className="text-slate-600">
                  Are you sure you want to approve this expense of <strong>{formatCurrency(actionModal.expense.amount)}</strong>? This will deduct the amount from the gym's net operating profit.
                </p>
              )}

              <div className="mt-5 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAction}
                  disabled={submitting}
                  className={`rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-50 ${
                    actionModal.type === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {submitting
                    ? 'Processing...'
                    : actionModal.type === 'APPROVE'
                    ? 'Confirm Approval'
                    : actionModal.type === 'REJECT'
                    ? 'Confirm Rejection'
                    : 'Confirm Voiding'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
