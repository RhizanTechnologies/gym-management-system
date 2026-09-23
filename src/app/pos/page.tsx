'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { POSProduct, Invoice, Member } from '@/lib/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { ReceiptModal } from '@/components/ReceiptModal';
import { AddProductModal } from '@/components/AddProductModal';
import { ShiftCloseoutModal } from '@/components/ShiftCloseoutModal';
import {
  Store,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Search,
  Dumbbell,
  Package,
  Receipt,
  PackagePlus,
} from 'lucide-react';

export default function POSBillingPage() {
  const { currentTenant, currentUser } = useAuth();
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [checkInCount, setCheckInCount] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'POS' | 'INVOICES'>('POS');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [cart, setCart] = useState<{ product: POSProduct; quantity: number }[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER'>('CASH');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [receiptInvoice, setReceiptInvoice] = useState<Invoice | null>(null);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);

  const fetchData = async () => {
    try {
      const [resBilling, resMembers, resCheckins] = await Promise.all([
        fetch(`/api/billing?tenantId=${currentTenant.id}`),
        fetch(`/api/members?tenantId=${currentTenant.id}`),
        fetch(`/api/checkin?tenantId=${currentTenant.id}`),
      ]);
      if (resBilling.ok) {
        const data = await resBilling.json();
        setProducts(data.products || []);
        setInvoices(data.invoices || []);
      }
      if (resMembers.ok) {
        const data = await resMembers.json();
        setMembers(data.members || []);
      }
      if (resCheckins.ok) {
        const data = await resCheckins.json();
        setCheckInCount(data.checkIns?.length || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTenant.id]);

  const addToCart = (product: POSProduct) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as { product: POSProduct; quantity: number }[]
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0 || isCheckingOut) return;

    setIsCheckingOut(true);
    try {
      const customer = members.find((m) => m.id === selectedMemberId);
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          memberId: selectedMemberId || undefined,
          memberName: customer ? `${customer.firstName} ${customer.lastName}` : 'Walk-in Customer',
          items: cart.map((item) => ({
            productId: item.product.id,
            productName: item.product.name,
            unitPrice: item.product.price,
            quantity: item.quantity,
          })),
          paymentMethod,
          cashierName: currentUser?.name || 'Front Desk',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const newInvoice: Invoice = {
          id: data.sale.id,
          tenantId: currentTenant.id,
          invoiceNumber: data.sale.invoiceNumber,
          memberName: data.sale.memberName || 'Walk-in Customer',
          type: 'POS',
          amount: data.sale.totalAmount,
          paidAmount: data.sale.totalAmount,
          balance: 0,
          status: 'PAID',
          paymentMethod,
          createdAt: data.sale.createdAt,
        };
        setReceiptInvoice(newInvoice);
        clearCart();
        fetchData();
      }
    } catch (e) {
      console.error('Checkout failed', e);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const filteredProducts =
    categoryFilter === 'ALL'
      ? products
      : products.filter((p) => p.category === categoryFilter);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Store className="h-4 w-4" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Point of Sale & Retail Billing</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sell beverages, supplements, personal training, and issue digital thermal receipts for {currentTenant.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
          >
            <Receipt className="h-4 w-4 text-emerald-600" />
            <span>Shift Closeout (Z-Report)</span>
          </button>

          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('POS')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'POS'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              POS Register
            </button>
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === 'INVOICES'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Past Invoices
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'POS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Product Catalog */}
          <div className="lg:col-span-8 space-y-4">
            {/* Category Filter Tabs & Add Item Action */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              <div className="flex items-center gap-2">
                {['ALL', 'DRINK', 'SUPPLEMENT', 'ACCESSORY', 'TRAINING'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                      categoryFilter === cat
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {cat === 'ALL'
                      ? 'All Items'
                      : cat === 'DRINK'
                      ? 'Energy & Water'
                      : cat === 'SUPPLEMENT'
                      ? 'Supplements'
                      : cat === 'ACCESSORY'
                      ? 'Towels & Gear'
                      : 'Personal Training'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAddProductModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors whitespace-nowrap shadow-sm"
              >
                <PackagePlus className="h-3.5 w-3.5 text-emerald-600" />
                <span>+ Add Item</span>
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredProducts.map((prod) => (
                <button
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-600 transition-all flex flex-col justify-between group shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600 uppercase">
                        {prod.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Stock: {prod.stock}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 mt-2 group-hover:text-emerald-700 transition-colors line-clamp-2">
                      {prod.name}
                    </h4>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="font-black text-sm text-slate-900">{formatCurrency(prod.price, currentTenant.currencySymbol, currentTenant.currency)}</span>
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Current Cart</h3>
                </div>
                {cart.length > 0 && (
                  <button onClick={clearCart} className="text-[11px] font-semibold text-slate-500 hover:text-slate-900">
                    Clear
                  </button>
                )}
              </div>

              {/* Customer Selector */}
              <div className="pt-3 pb-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer / Member</label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  <option value="">Walk-in Customer (Guest)</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.memberNumber})
                    </option>
                  ))}
                </select>
              </div>

              {/* Cart Items List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 my-2">
                {cart.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-500">
                    Cart is empty. Tap any product on the left to add.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100 text-xs"
                    >
                      <div className="overflow-hidden max-w-[130px]">
                        <p className="font-bold text-slate-900 truncate">{item.product.name}</p>
                        <p className="text-[10px] text-slate-500">{formatCurrency(item.product.price, currentTenant.currencySymbol, currentTenant.currency)} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="font-bold text-slate-900 w-4 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="font-extrabold text-slate-900">
                        {formatCurrency(item.product.price * item.quantity, currentTenant.currencySymbol, currentTenant.currency)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Total & Checkout */}
            <div className="border-t border-slate-100 pt-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total Items:</span>
                <span className="font-bold text-slate-900">
                  {cart.reduce((a, b) => a + b.quantity, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-black">
                <span className="text-slate-900">Subtotal:</span>
                <span className="text-emerald-700 text-lg font-extrabold">{formatCurrency(subtotal, currentTenant.currencySymbol, currentTenant.currency)}</span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER')}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  <option value="CASH">Cash Drawer</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="MOBILE_MONEY">Mobile Money / Telebirr</option>
                  <option value="BANK_TRANSFER">Bank Direct Transfer</option>
                </select>
              </div>

              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all disabled:opacity-40"
              >
                {isCheckingOut ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Complete Sale & Print Receipt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Invoices & Past Transactions Table */
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-5 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Paid</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-500">
                      No invoices recorded yet.
                    </td>
                  </tr>
                ) : (
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3.5 font-semibold text-slate-800">{inv.memberName}</td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 uppercase">
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{formatCurrency(inv.amount, currentTenant.currencySymbol, currentTenant.currency)}</td>
                      <td className="px-4 py-3.5 font-extrabold text-emerald-700">{formatCurrency(inv.paidAmount, currentTenant.currencySymbol, currentTenant.currency)}</td>
                      <td className="px-4 py-3.5 text-slate-600 uppercase">{inv.paymentMethod}</td>
                      <td className="px-4 py-3.5 text-slate-500">{formatDate(inv.createdAt)}</td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setReceiptInvoice(inv)}
                          className="flex items-center gap-1 ml-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                        >
                          <Printer className="h-3 w-3 text-emerald-600" />
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {receiptInvoice && (
        <ReceiptModal
          invoice={receiptInvoice}
          tenant={currentTenant}
          onClose={() => setReceiptInvoice(null)}
        />
      )}

      {/* Add Product Modal */}
      {showAddProductModal && (
        <AddProductModal
          tenant={currentTenant}
          onClose={() => setShowAddProductModal(false)}
          onCreated={fetchData}
        />
      )}

      {/* Shift Closeout Modal */}
      {showShiftModal && (
        <ShiftCloseoutModal
          tenant={currentTenant}
          currentUser={currentUser}
          invoices={invoices}
          checkInCount={checkInCount}
          onClose={() => setShowShiftModal(false)}
        />
      )}
    </div>
  );
}
