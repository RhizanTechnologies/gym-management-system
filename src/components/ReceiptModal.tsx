'use client';

import React from 'react';
import { Invoice, InvoiceLineItem, Receipt, Tenant } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { X, Printer, CheckCircle2 } from 'lucide-react';

interface ReceiptModalProps {
  invoice?: Invoice;
  receipt?: Receipt;
  tenant: Tenant;
  onClose: () => void;
}

export function ReceiptModal({ invoice, receipt, tenant, onClose }: ReceiptModalProps) {
  const receiptNumber = receipt?.receiptNumber || invoice?.receiptNumber || invoice?.invoiceNumber || 'RCP-N/A';
  const invoiceNumber = receipt?.invoiceNumber || invoice?.invoiceNumber || 'INV-N/A';
  const dateStr = receipt?.issuedAt || receipt?.createdAt || invoice?.createdAt || new Date().toISOString();
  const memberName = receipt?.memberName || invoice?.memberName || 'Valued Member';
  const cashierName = receipt?.issuedByUserName || receipt?.receivedBy || 'Staff Reception';
  const paymentMethod = receipt?.paymentMethod || invoice?.paymentMethod || 'CASH';

  const lineItems: InvoiceLineItem[] = (receipt?.lineItems && receipt.lineItems.length > 0)
    ? receipt.lineItems
    : (receipt?.items && receipt.items.length > 0)
    ? receipt.items
    : (invoice?.items && invoice.items.length > 0)
    ? invoice.items
    : [{
        id: '1',
        description: invoice?.type ? `${invoice.type.replace(/_/g, ' ')} Subscription` : 'Gym Membership & Services',
        quantity: 1,
        unitPrice: invoice?.amount ?? 0,
        subtotal: invoice?.amount ?? 0,
        total: invoice?.amount ?? 0
      }];

  const subtotal = receipt?.subtotal ?? invoice?.subtotal ?? (invoice?.amount ?? 0);
  const discount = receipt?.discount ?? invoice?.discount ?? 0;
  const tax = receipt?.tax ?? invoice?.tax ?? 0;
  const totalAmount = receipt?.totalAmount ?? invoice?.amount ?? 0;
  const paidAmount = receipt?.amountPaid ?? receipt?.amount ?? invoice?.paidAmount ?? 0;
  const balance = receipt?.remainingBalance ?? invoice?.balance ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2">
            <Printer className="h-4 w-4 text-teal-700" />
            <h3 className="font-bold text-sm text-slate-900">Official Payment Receipt</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Printable Receipt Canvas */}
        <div className="p-6 bg-white text-slate-900 font-mono text-xs space-y-4" id="printable-receipt">
          {/* Header */}
          <div className="text-center border-b border-dashed border-slate-200 pb-4">
            <div className="text-3xl mb-1">{tenant.logo || '🏋️'}</div>
            <h2 className="text-base font-black uppercase text-slate-900 font-sans tracking-tight">{tenant.name}</h2>
            <p className="text-[11px] text-slate-500 font-sans">{tenant.address}</p>
            <p className="text-[11px] text-slate-500 font-sans">Tel: {tenant.phone}</p>
          </div>

          {/* Receipt Info */}
          <div className="space-y-1 text-slate-600 text-[11px] border-b border-dashed border-slate-200 pb-3">
            <div className="flex justify-between">
              <span>Receipt Ref:</span>
              <span className="font-bold text-teal-800">{receiptNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Invoice Ref:</span>
              <span className="font-medium text-slate-700">{invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span>{formatDate(dateStr)} {formatTime(dateStr)}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-bold text-slate-900">{memberName}</span>
            </div>
            <div className="flex justify-between">
              <span>Served By:</span>
              <span className="text-slate-700">{cashierName}</span>
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-2 border-b border-dashed border-slate-200 pb-3">
            <div className="flex justify-between font-bold text-slate-800 text-[11px]">
              <span>Item / Description</span>
              <span>Total</span>
            </div>
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-slate-600">
                <span className="truncate pr-2">
                  {item.quantity > 1 ? `${item.quantity}x ` : ''}{item.description}
                </span>
                <span className="font-medium">${(item.total ?? item.subtotal ?? (item.unitPrice * item.quantity)).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Breakdown & Totals */}
          <div className="space-y-1.5 pt-1 text-[11px]">
            {discount > 0 && (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-amber-700 font-medium">
                  <span>Discount Applied:</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              </>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Tax:</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-slate-900 font-sans border-t border-slate-100 pt-1.5">
              <span>NET TOTAL:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-teal-800 font-bold bg-teal-50/70 px-2 py-1 rounded">
              <span>PAID ({paymentMethod}):</span>
              <span>${paidAmount.toFixed(2)}</span>
            </div>
            {balance > 0 ? (
              <div className="flex justify-between text-amber-800 font-bold bg-amber-50 px-2 py-1 rounded">
                <span>OUTSTANDING BALANCE:</span>
                <span>${balance.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1 text-teal-700 font-bold text-[10px] pt-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PAID IN FULL</span>
              </div>
            )}
          </div>

          {/* Footer message */}
          <div className="text-center pt-3 text-[10px] text-slate-400 font-sans">
            <p>Thank you for training with {tenant.name}!</p>
            <p className="text-[9px] text-slate-300 mt-0.5">Retain this receipt for validation & proof of payment</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 shadow-sm transition-colors"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}

