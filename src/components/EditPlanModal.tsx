'use client';

import React, { useState } from 'react';
import { MembershipPlan, Tenant } from '@/lib/types';
import { X, Layers, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface EditPlanModalProps {
  plan: MembershipPlan;
  tenant: Tenant;
  onClose: () => void;
  onUpdated: () => void;
}

export function EditPlanModal({ plan, tenant, onClose, onUpdated }: EditPlanModalProps) {
  const [name, setName] = useState(plan.name);
  const [description, setDescription] = useState(plan.description);
  const [billingPeriod, setBillingPeriod] = useState(plan.billingPeriod || 'Monthly');
  const [durationDays, setDurationDays] = useState(plan.durationDays.toString());
  const [price, setPrice] = useState(plan.price.toString());
  const [admissionFee, setAdmissionFee] = useState(plan.admissionFee.toString());
  const [benefits, setBenefits] = useState((plan.benefits || []).join('\n'));
  const [restrictions, setRestrictions] = useState((plan.restrictions || []).join('\n'));
  const [includedServices, setIncludedServices] = useState((plan.includedServices || []).join(', '));
  const [isPopular, setIsPopular] = useState(Boolean(plan.isPopular));
  const [isPublished, setIsPublished] = useState(plan.isPublished !== false && plan.isActive !== false);
  const [includesClasses, setIncludesClasses] = useState(plan.includesClasses);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const parsedBenefits = benefits
        .split('\n')
        .map((b) => b.trim())
        .filter(Boolean);

      const parsedRestrictions = restrictions
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const parsedServices = includedServices
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/plans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          id: plan.id,
          name: name.trim(),
          description: description.trim(),
          billingPeriod: billingPeriod.trim(),
          durationDays: parseInt(durationDays) || 30,
          price: parseFloat(price) || 0,
          admissionFee: parseFloat(admissionFee) || 0,
          benefits: parsedBenefits,
          restrictions: parsedRestrictions,
          includedServices: parsedServices,
          isPopular,
          isPublished,
          isActive: isPublished,
          includesClasses,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update plan');
      }

      onUpdated();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error updating plan';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete the plan "${plan.name}"?`)) return;

    try {
      const res = await fetch('/api/plans', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          id: plan.id,
        }),
      });

      if (res.ok) {
        onUpdated();
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete plan');
      }
    } catch (e) {
      console.error('Delete error', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F8FAFC] px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[#0F766E]" />
            <h3 className="text-[16px] leading-[24px] font-bold text-[#1F2937]">Edit Membership Package</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded text-[#1F2937]/60 hover:bg-[#E5E7EB] hover:text-[#1F2937]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleUpdate} className="p-6 space-y-4 overflow-y-auto text-[14px] leading-[20px]">
          {error && (
            <div className="rounded border border-[#1F2937] bg-[#F8FAFC] p-3 text-[12px] text-[#1F2937] font-semibold flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#1F2937] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Package Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Billing Period</label>
              <input
                type="text"
                placeholder="e.g. Monthly, Quarterly"
                value={billingPeriod}
                onChange={(e) => setBillingPeriod(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Duration (Days) *</label>
              <input
                type="number"
                required
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Price (ETB) *</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none font-bold"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Admission Fee (ETB)</label>
              <input
                type="number"
                min="0"
                step="any"
                value={admissionFee}
                onChange={(e) => setAdmissionFee(e.target.value)}
                className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">
              Included Services (comma-separated)
            </label>
            <input
              type="text"
              placeholder="Gym Floor, Olympic Pool, Sauna & Steam, Lockers"
              value={includedServices}
              onChange={(e) => setIncludedServices(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">
              Benefits List (one per line)
            </label>
            <textarea
              rows={3}
              placeholder="Unlimited gym floor access&#10;Locker room & rain showers&#10;Digital QR turnstile pass"
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">
              Restrictions & Terms (one per line)
            </label>
            <textarea
              rows={2}
              placeholder="Operating hours access only&#10;1 check-in per day"
              value={restrictions}
              onChange={(e) => setRestrictions(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 border-t border-[#E5E7EB]">
            <label className="flex items-center gap-2 text-[14px] text-[#1F2937] cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-[#E5E7EB] text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span className="font-semibold">Published on Public Landing Page</span>
            </label>

            <label className="flex items-center gap-2 text-[14px] text-[#1F2937] cursor-pointer">
              <input
                type="checkbox"
                checked={isPopular}
                onChange={(e) => setIsPopular(e.target.checked)}
                className="h-4 w-4 rounded border-[#E5E7EB] text-[#D97706] focus:ring-[#D97706]"
              />
              <span className="font-semibold">Feature as &ldquo;Most Popular&rdquo; Tier</span>
            </label>

            <label className="flex items-center gap-2 text-[14px] text-[#1F2937] cursor-pointer">
              <input
                type="checkbox"
                checked={includesClasses}
                onChange={(e) => setIncludesClasses(e.target.checked)}
                className="h-4 w-4 rounded border-[#E5E7EB] text-[#0F766E] focus:ring-[#0F766E]"
              />
              <span>Includes Scheduled Group Classes</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-[#1F2937]/70 hover:text-[#1F2937]"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Package</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-[14px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-[#0F766E] px-4 py-2 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
