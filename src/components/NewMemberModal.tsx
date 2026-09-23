'use client';

import React, { useState } from 'react';
import { MembershipPlan, Locker, Tenant } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { X, UserPlus, Sparkles, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

interface NewMemberModalProps {
  tenant: Tenant;
  plans: MembershipPlan[];
  lockers: Locker[];
  initialData?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    planId?: string;
    leadId?: string;
  };
  onClose: () => void;
  onCreated: () => void;
}

export function NewMemberModal({ tenant, plans, lockers, initialData, onClose, onCreated }: NewMemberModalProps) {
  const { currentUser } = useAuth();
  const [firstName, setFirstName] = useState(initialData?.firstName || '');
  const [lastName, setLastName] = useState(initialData?.lastName || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [address, setAddress] = useState('');
  const [planId, setPlanId] = useState<string>(initialData?.planId || plans[0]?.id || '');
  const [assignedLockerNumber, setAssignedLockerNumber] = useState<string>('');
  const [discount, setDiscount] = useState<string>('0');
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER'>('CASH');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [medicalNotes, setMedicalNotes] = useState('');
  const [consentGiven, setConsentGiven] = useState(true);
  const [allowDuplicateOverride, setAllowDuplicateOverride] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedPlan = plans.find((p) => p.id === planId) || plans[0];
  const basePrice = selectedPlan ? selectedPlan.price : 0;
  const admissionFee = selectedPlan?.admissionFee || 0;
  const numDiscount = Math.max(0, parseFloat(discount) || 0);
  const subtotalPrice = basePrice + admissionFee;
  const totalPrice = Math.max(0, subtotalPrice - numDiscount);
  const currentPaid = paidAmount === '' ? totalPrice : Math.max(0, parseFloat(paidAmount) || 0);
  const dueBalance = Math.max(0, totalPrice - currentPaid);

  const availableLockers = lockers.filter((l) => l.status === 'AVAILABLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !phone) {
      setError('Please provide First Name, Last Name, and Phone Number.');
      return;
    }

    if (!consentGiven) {
      setError('Member consent declaration is required for registration and activation.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'RECEPTIONIST',
          'x-user-id': currentUser?.id || 'user-staff-1',
          'x-tenant-id': tenant.id,
        },
        body: JSON.stringify({
          tenantId: tenant.id,
          firstName,
          lastName,
          phone,
          email: email || undefined,
          gender,
          address: address || undefined,
          planId: selectedPlan?.id,
          assignedLockerNumber: assignedLockerNumber || undefined,
          dueBalance,
          paidAmount: currentPaid,
          discount: numDiscount,
          paymentMethod,
          emergencyContactName: emergencyContactName || undefined,
          emergencyContactRelationship: emergencyContactRelationship || undefined,
          emergencyContactPhone: emergencyContactPhone || undefined,
          medicalNotes: medicalNotes || undefined,
          consentGiven: true,
          allowDuplicateOverride,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setIsDuplicate(true);
          setError(data.error || 'Duplicate member profile detected.');
          return;
        }
        throw new Error(data.error || 'Failed to create member');
      }

      if (initialData?.leadId) {
        await fetch('/api/leads', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: tenant.id,
            id: initialData.leadId,
            status: 'CONVERTED',
            notes: `Converted to registered member profile: ${firstName} ${lastName}`,
          }),
        }).catch(() => {});
      }

      onCreated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error creating member';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-900">Register New Gym Member</h2>
              <p className="text-xs text-slate-500">{tenant.name} • Instant Digital Pass</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Duplicate Profile Warning Banner */}
          {isDuplicate && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Duplicate Profile Detected</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {error}
              </p>
              <label className="flex items-center gap-2 font-bold text-amber-950 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={allowDuplicateOverride}
                  onChange={(e) => setAllowDuplicateOverride(e.target.checked)}
                  className="rounded border-amber-400 text-emerald-600 focus:ring-emerald-500"
                />
                <span>Authorized Override: Confirm & Register as separate member account</span>
              </label>
            </div>
          )}

          {/* Member Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Abel"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Tesfaye"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 91 123 4567"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="abel@example.com"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Gender and Membership Plan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Membership Plan *
              </label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-bold"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.durationDays} days) - ${p.price}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Locker Assignment */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Assign Locker (Optional)
            </label>
            <select
              value={assignedLockerNumber}
              onChange={(e) => setAssignedLockerNumber(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            >
              <option value="">No Locker Assigned</option>
              {availableLockers.map((l) => (
                <option key={l.id} value={l.number}>
                  Locker {l.number} ({l.zone}) - Available
                </option>
              ))}
            </select>
          </div>

          {/* Fee & Payment Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Plan Base Fee ({selectedPlan?.name}):</span>
              <span className="font-bold text-slate-900">${basePrice.toFixed(2)}</span>
            </div>
            {admissionFee > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Admission / Registration Fee:</span>
                <span className="font-bold text-slate-900">${admissionFee.toFixed(2)}</span>
              </div>
            )}
            {numDiscount > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700">
                <span>Applied Discount:</span>
                <span className="font-bold">-${numDiscount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs font-extrabold">
              <span className="text-emerald-700">Total Payable:</span>
              <span className="text-base text-emerald-700">${totalPrice.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Discount ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Amount Paid ($)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder={`${totalPrice}`}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                >
                  <option value="CASH">💵 Cash</option>
                  <option value="CARD">💳 Credit/Debit Card</option>
                  <option value="MOBILE_MONEY">📱 Mobile Money / Telebirr</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                </select>
              </div>
            </div>

            {dueBalance > 0 && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800">
                ⚠️ Outstanding Balance: <strong>${dueBalance.toFixed(2)}</strong> will remain on member account.
              </div>
            )}
          </div>

          {/* Emergency Contacts & Address */}
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <p className="text-xs font-bold text-slate-600">Address & Emergency Contact</p>
            <div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Physical Address (e.g. Bole Subcity, Woreda 03)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Contact Name"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <input
                type="text"
                value={emergencyContactRelationship}
                onChange={(e) => setEmergencyContactRelationship(e.target.value)}
                placeholder="Relationship (e.g. Spouse)"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
              <input
                type="tel"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="Contact Phone"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Confidential Medical Notes */}
          <div className="border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-600">
                Medical & Health Notes (Optional)
              </label>
              <span className="text-[10px] font-semibold text-slate-400">
                🔒 Restricted access per policy
              </span>
            </div>
            <textarea
              rows={2}
              value={medicalNotes}
              onChange={(e) => setMedicalNotes(e.target.value)}
              placeholder="e.g. Asthma (carries inhaler), joint injury, heart condition..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
            />
          </div>

          {/* Consent Checkbox */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs text-slate-700 leading-snug">
                <strong>Member Consent & Waiver *</strong>: Member confirms agreement to facility rules, physical exercise liability waiver, and electronic pass terms.
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Registering...</span>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Register & Issue Digital Pass</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

