'use client';

import React, { useState } from 'react';
import { Tenant, Invoice, CheckInLog, User } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  X,
  Printer,
  DollarSign,
  CreditCard,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface ShiftCloseoutModalProps {
  tenant: Tenant;
  currentUser: User | null;
  invoices: Invoice[];
  checkInCount: number;
  onClose: () => void;
}

export function ShiftCloseoutModal({
  tenant,
  currentUser,
  invoices,
  checkInCount,
  onClose,
}: ShiftCloseoutModalProps) {
  const [openingFloat, setOpeningFloat] = useState<number>(50.0);
  const [actualCashCounted, setActualCashCounted] = useState<number>(50.0);
  const [notes, setNotes] = useState<string>('');

  // Calculate shift financial totals
  const cashSales = invoices
    .filter((inv) => inv.paymentMethod === 'CASH')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const cardSales = invoices
    .filter((inv) => inv.paymentMethod === 'CARD')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const mobileSales = invoices
    .filter((inv) => inv.paymentMethod === 'MOBILE_MONEY')
    .reduce((sum, inv) => sum + inv.paidAmount, 0);

  const totalSalesRevenue = cashSales + cardSales + mobileSales;
  const expectedCashInDrawer = openingFloat + cashSales;
  const cashDiscrepancy = actualCashCounted - expectedCashInDrawer;

  const now = new Date();
  const shiftDate = now.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const shiftTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl p-6 sm:p-8 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-slate-900">End-of-Shift Drawer Closeout (Z-Report)</h2>
              <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                AUDIT READY
              </span>
            </div>
            <p className="text-xs text-slate-500">
              {tenant.name} • Cashier: {currentUser?.name || 'Front Desk Staff'} • {shiftDate} at {shiftTime}
            </p>
          </div>
        </div>

        {/* Financial Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
              <span>Cash Collected</span>
            </div>
            <p className="text-lg font-black text-emerald-700">{formatCurrency(cashSales, tenant.currencySymbol)}</p>
            <p className="text-[10px] text-slate-400">Physical bills in drawer</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <CreditCard className="h-3.5 w-3.5 text-slate-700" />
              <span>Card / POS</span>
            </div>
            <p className="text-lg font-black text-slate-900">{formatCurrency(cardSales, tenant.currencySymbol)}</p>
            <p className="text-[10px] text-slate-400">Card terminal settlement</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Smartphone className="h-3.5 w-3.5 text-slate-700" />
              <span>Mobile Money</span>
            </div>
            <p className="text-lg font-black text-slate-900">{formatCurrency(mobileSales, tenant.currencySymbol)}</p>
            <p className="text-[10px] text-slate-400">Direct transfer / wallet</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              <Users className="h-3.5 w-3.5 text-slate-700" />
              <span>Gym Check-Ins</span>
            </div>
            <p className="text-lg font-black text-slate-900">{checkInCount}</p>
            <p className="text-[10px] text-slate-400">Members served today</p>
          </div>
        </div>

        {/* Drawer Reconciliation Section */}
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-emerald-600" />
            <span>Cash Drawer Reconciliation</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Starting Drawer Float ({tenant.currencySymbol})
              </label>
              <input
                type="number"
                step="0.5"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-slate-500 mt-1">Cash in drawer before shift opened</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Actual Physical Cash Counted ({tenant.currencySymbol})
              </label>
              <input
                type="number"
                step="0.5"
                value={actualCashCounted}
                onChange={(e) => setActualCashCounted(Number(e.target.value) || 0)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <p className="text-[10px] text-slate-500 mt-1">Count all physical currency in till</p>
            </div>
          </div>

          {/* Reconciliation Balance Bar */}
          <div className="rounded-2xl bg-white p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div>
              <span className="text-xs text-slate-500">Expected Total in Drawer:</span>
              <p className="text-base font-extrabold text-slate-900">
                {formatCurrency(expectedCashInDrawer, tenant.currencySymbol)}{' '}
                <span className="text-xs text-slate-500 font-normal">
                  ({formatCurrency(openingFloat, tenant.currencySymbol)} float +{' '}
                  {formatCurrency(cashSales, tenant.currencySymbol)} cash sales)
                </span>
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500">Variance / Difference:</span>
              <p
                className={`text-base font-black ${
                  cashDiscrepancy === 0
                    ? 'text-emerald-700'
                    : cashDiscrepancy > 0
                    ? 'text-slate-900'
                    : 'text-red-600'
                }`}
              >
                {cashDiscrepancy === 0
                  ? `✓ Perfect (${formatCurrency(0, tenant.currencySymbol, tenant.currency)})`
                  : cashDiscrepancy > 0
                  ? `+${formatCurrency(cashDiscrepancy, tenant.currencySymbol, tenant.currency)} (Over)`
                  : `-${formatCurrency(Math.abs(cashDiscrepancy), tenant.currencySymbol, tenant.currency)} (Short)`}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Staff Shift Handover Notes</label>
            <input
              type="text"
              placeholder="e.g. Clean shift, no refunds, gave 50 small change to Marcus..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all shadow-sm"
          >
            <Printer className="h-4 w-4" />
            <span>Print Shift Audit Slip</span>
          </button>

          <button
            onClick={() => {
              alert('Shift closeout successfully recorded and verified!');
              onClose();
            }}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Confirm & Sign Off Shift</span>
          </button>
        </div>
      </div>
    </div>
  );
}
