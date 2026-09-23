'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { MembershipPlan } from '@/lib/types';
import { EditPlanModal } from '@/components/EditPlanModal';
import {
  Layers,
  Plus,
  Check,
  X,
  Edit,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Shield,
  Info,
} from 'lucide-react';

export default function PlansPage() {
  const { currentTenant, currentUser } = useAuth();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<MembershipPlan | null>(null);

  // Form states for creating a plan
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('Monthly');
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(50);
  const [admissionFee, setAdmissionFee] = useState(0);
  const [includedServices, setIncludedServices] = useState('Gym Floor, Cardio Deck, Lockers');
  const [benefits, setBenefits] = useState('Unlimited gym floor access\nLocker room & rainfall showers\nDigital QR turnstile pass');
  const [restrictions, setRestrictions] = useState('Access during operating hours');
  const [isPopular, setIsPopular] = useState(false);
  const [isPublished, setIsPublished] = useState(true);
  const [includesClasses, setIncludesClasses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check authorization
  const role = currentUser?.role || 'RECEPTIONIST';
  const canManagePackages = ['SUPER_ADMIN', 'OWNER', 'GYM_OWNER', 'GENERAL_MANAGER'].includes(role);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plans?tenantId=${currentTenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [currentTenant.id]);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const parsedBenefits = benefits.split('\n').map((b) => b.trim()).filter(Boolean);
      const parsedRestrictions = restrictions.split('\n').map((r) => r.trim()).filter(Boolean);
      const parsedServices = includedServices.split(',').map((s) => s.trim()).filter(Boolean);

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          name: name.trim(),
          description: description.trim(),
          billingPeriod: billingPeriod.trim(),
          durationDays: Number(durationDays),
          price: Number(price),
          admissionFee: Number(admissionFee),
          benefits: parsedBenefits,
          restrictions: parsedRestrictions,
          includedServices: parsedServices,
          isPopular,
          isPublished,
          isActive: isPublished,
          includesClasses,
          color: isPopular ? '#D97706' : '#0F766E',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create plan');
      }

      setShowCreateModal(false);
      setName('');
      setDescription('');
      fetchPlans();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Plan creation failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#0F766E]">
              <Layers className="h-4 w-4" />
            </span>
            <h1 className="text-[22px] leading-[30px] font-bold text-[#1F2937]">Membership Packages & Pricing</h1>
          </div>
          <p className="text-[14px] leading-[20px] text-[#1F2937]/70 mt-1">
            Configure flexible day passes, monthly access tiers, and VIP combinations for {currentTenant.name}.
          </p>
        </div>

        {canManagePackages ? (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#0F766E] px-4 py-2 text-[14px] leading-[20px] font-semibold text-[#FFFFFF] shadow-sm hover:bg-[#0F766E]/90 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Package</span>
          </button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-1.5 text-[12px] leading-[16px] text-[#1F2937]/70">
            <Shield className="h-3.5 w-3.5 text-[#0F766E]" />
            <span>Read-Only Directory (Manager/Owner Access Required to Edit)</span>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-6 space-y-4 animate-pulse">
              <div className="h-5 w-24 bg-[#E5E7EB] rounded" />
              <div className="h-8 w-32 bg-[#E5E7EB] rounded" />
              <div className="h-4 w-full bg-[#E5E7EB] rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Plans Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-lg border bg-[#FFFFFF] p-6 flex flex-col justify-between relative transition-all ${
                plan.isPopular ? 'border-2 border-[#D97706]' : 'border-[#E5E7EB]'
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-4 rounded bg-[#D97706] px-2.5 py-0.5 text-[10px] font-bold uppercase text-[#FFFFFF]">
                  Most Popular
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded border border-[#E5E7EB] bg-[#F8FAFC] text-[12px] leading-[16px] font-semibold text-[#1F2937]">
                    {plan.billingPeriod || `${plan.durationDays} Days`}
                  </span>

                  <div className="flex items-center gap-2">
                    {plan.isPublished !== false && plan.isActive !== false ? (
                      <span className="flex items-center gap-1 text-[12px] text-[#0F766E] font-semibold">
                        <Eye className="h-3.5 w-3.5" />
                        <span>Public</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[12px] text-[#1F2937]/50 font-semibold">
                        <EyeOff className="h-3.5 w-3.5" />
                        <span>Draft</span>
                      </span>
                    )}

                    {canManagePackages && (
                      <button
                        onClick={() => setPlanToEdit(plan)}
                        className="flex items-center gap-1 text-[12px] font-semibold text-[#1F2937] bg-[#F8FAFC] border border-[#E5E7EB] px-2.5 py-1 rounded hover:bg-[#E5E7EB] transition-colors"
                      >
                        <Edit className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-[18px] leading-[26px] font-bold text-[#1F2937]">{plan.name}</h3>
                  <p className="text-[14px] leading-[20px] text-[#1F2937]/70 mt-1">{plan.description}</p>
                </div>

                <div className="pt-2 flex items-baseline gap-1">
                  <span className="text-[32px] font-bold text-[#1F2937]">${plan.price}</span>
                  <span className="text-[14px] text-[#1F2937]/70">/ {plan.billingPeriod || `${plan.durationDays}d`}</span>
                </div>

                {/* Included services */}
                {plan.includedServices && plan.includedServices.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {plan.includedServices.map((svc, idx) => (
                      <span
                        key={idx}
                        className="rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-0.5 text-[10px] font-semibold text-[#1F2937]"
                      >
                        {svc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Benefits */}
                <div className="border-t border-[#E5E7EB] pt-3">
                  <span className="text-[12px] font-bold uppercase text-[#1F2937] block mb-1.5">Benefits</span>
                  <ul className="space-y-1.5 text-[12px] leading-[16px] text-[#1F2937]">
                    {(plan.benefits && plan.benefits.length > 0
                      ? plan.benefits
                      : ['Standard gym access', 'Locker & shower facilities']
                    ).map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <Check className="h-3.5 w-3.5 text-[#0F766E] shrink-0 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Restrictions */}
                {plan.restrictions && plan.restrictions.length > 0 && (
                  <div className="border-t border-[#E5E7EB] pt-2">
                    <span className="text-[12px] font-bold uppercase text-[#1F2937]/70 block mb-1">Restrictions</span>
                    <ul className="space-y-1 text-[12px] leading-[16px] text-[#1F2937]/70">
                      {plan.restrictions.map((r, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <Info className="h-3 w-3 text-[#1F2937]/50 shrink-0 mt-0.5" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Plan Modal */}
      {planToEdit && (
        <EditPlanModal
          plan={planToEdit}
          tenant={currentTenant}
          onClose={() => setPlanToEdit(null)}
          onUpdated={fetchPlans}
        />
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] bg-[#F8FAFC] px-6 py-4">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-[#0F766E]" />
                <h3 className="text-[16px] leading-[24px] font-bold text-[#1F2937]">Create New Package</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded text-[#1F2937]/60 hover:bg-[#E5E7EB]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="p-6 space-y-4 overflow-y-auto text-[14px] leading-[20px]">
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
                  placeholder="e.g. Monthly Standard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Brief summary of tier access..."
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
                    placeholder="e.g. Monthly, Annual"
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
                    onChange={(e) => setDurationDays(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Price ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3.5 py-2 text-[#1F2937] focus:border-[#0F766E] focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold uppercase text-[#1F2937]/80 mb-1">Admission Fee ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={admissionFee}
                    onChange={(e) => setAdmissionFee(Number(e.target.value))}
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
                  <span className="font-semibold">Publish to Public Landing Page</span>
                </label>

                <label className="flex items-center gap-2 text-[14px] text-[#1F2937] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E5E7EB] text-[#D97706] focus:ring-[#D97706]"
                  />
                  <span className="font-semibold">Highlight as &ldquo;Most Popular&rdquo; Tier</span>
                </label>

                <label className="flex items-center gap-2 text-[14px] text-[#1F2937] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includesClasses}
                    onChange={(e) => setIncludesClasses(e.target.checked)}
                    className="h-4 w-4 rounded border-[#E5E7EB] text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <span>Includes Group Fitness Classes</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-[14px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-[#0F766E] px-4 py-2 text-[14px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90 disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
