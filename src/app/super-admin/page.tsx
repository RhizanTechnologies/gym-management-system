'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Tenant, PlanTier } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  ShieldCheck,
  Building2,
  Users,
  TrendingUp,
  Plus,
  Sparkles,
  X,
  ExternalLink,
  CheckCircle2,
} from 'lucide-react';

export default function SuperAdminPage() {
  const { allTenants, switchTenant, refreshData } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>(allTenants);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logo, setLogo] = useState('🏋️');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [maxCapacity, setMaxCapacity] = useState(100);
  const [monthlyFee, setMonthlyFee] = useState(99);
  const [planTier, setPlanTier] = useState<PlanTier>('PRO');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setTenants(allTenants);
  }, [allTenants]);

  const handleCreateGym = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug: slug.toLowerCase().replace(/\s+/g, '-'),
          logo,
          address,
          phone,
          email,
          currency,
          currencySymbol,
          maxCapacity: Number(maxCapacity),
          monthlySubscriptionFee: Number(monthlyFee),
          planTier,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setName('');
        setSlug('');
        setAddress('');
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to create gym', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMRR = tenants.reduce((acc, t) => acc + (t.monthlySubscriptionFee || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Super Admin Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Platform Super Admin (SaaS Control)
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global multi-tenant overview, onboarding new fitness centers, and subscription tiers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Onboard New Gym</span>
        </button>
      </div>

      {/* Platform Global KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-500">Onboarded Gyms</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{tenants.length}</span>
            <span className="text-xs text-slate-500">active tenants</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium">100% cloud uptime</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-500">Platform MRR</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-700">${totalMRR}</span>
            <span className="text-xs text-slate-500">/ month</span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-700 font-medium">From gym SaaS subscriptions</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-bold uppercase text-slate-500">Active Tenant Tiers</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">Starter • Pro • VIP</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Multi-currency & isolated schemas</p>
        </div>
      </div>

      {/* Gym Tenants Table */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Tenant Registry</h3>
          </div>
          <span className="text-xs text-slate-500">{tenants.length} total registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Gym Tenant</th>
                <th className="px-4 py-3.5">Contact / Location</th>
                <th className="px-4 py-3.5">Tier</th>
                <th className="px-4 py-3.5">Capacity</th>
                <th className="px-4 py-3.5">Monthly Fee</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{tenant.logo || '🏋️'}</span>
                      <div>
                        <p className="font-extrabold text-slate-900 text-xs">{tenant.name}</p>
                        <p className="text-[10px] font-mono text-emerald-700">/{tenant.slug}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <p className="text-slate-700">{tenant.address}</p>
                    <p className="text-[10px] text-slate-500">{tenant.phone} • {tenant.email}</p>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-800 border border-slate-200">
                      {tenant.planTier}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 font-bold text-slate-700">
                    {tenant.maxCapacity} members
                  </td>

                  <td className="px-4 py-3.5 font-bold text-emerald-700">
                    ${tenant.monthlySubscriptionFee}/mo
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" /> Active
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right">
                    <button
                      onClick={() => {
                        switchTenant(tenant.id);
                        window.location.href = '/dashboard';
                      }}
                      className="flex items-center gap-1 ml-auto rounded-lg bg-slate-100 border border-slate-200 px-3 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      <span>Switch to Gym</span>
                      <ExternalLink className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Gym Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <h2 className="font-bold text-sm text-slate-900">Onboard New Gym Tenant</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGym} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Gym Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                    }}
                    placeholder="e.g. Spartan Fitness Center"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Logo / Emoji</label>
                  <input
                    type="text"
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-lg text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Subdomain Slug *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="spartan-fitness"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 font-mono focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 91 ..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="owner@gym.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Max Capacity</label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">SaaS Fee ($/mo)</label>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Tier</label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value as PlanTier)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-2 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none font-bold"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="PRO">Pro</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-500 shadow-sm transition-all"
                >
                  {isSubmitting ? 'Creating...' : 'Onboard Gym'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
