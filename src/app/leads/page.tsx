'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Lead, MembershipPlan, Locker } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import { NewMemberModal } from '@/components/NewMemberModal';
import {
  UserCheck,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Send,
  RefreshCw,
  Tag,
} from 'lucide-react';

export default function LeadsPage() {
  const { currentTenant, currentUser } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Conversion to member modal
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'CONTACTED' | 'CONVERTED'>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'REGISTER' | 'TRIAL' | 'CONTACT'>('ALL');

  // Lead modal for notes / status update
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [leadNotes, setLeadNotes] = useState('');
  const [leadStatus, setLeadStatus] = useState<'NEW' | 'CONTACTED' | 'CONVERTED'>('NEW');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads?tenantId=${currentTenant.id}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to load leads follow-up queue');
      }
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error fetching leads';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlansAndLockers = async () => {
    try {
      const [resPlans, resLockers] = await Promise.all([
        fetch(`/api/plans?tenantId=${currentTenant.id}`),
        fetch(`/api/lockers?tenantId=${currentTenant.id}`),
      ]);
      if (resPlans.ok) {
        const data = await resPlans.json();
        setPlans(data.plans || []);
      }
      if (resLockers.ok) {
        const data = await resLockers.json();
        setLockers(data.lockers || []);
      }
    } catch {
      // Ignore background fetch error
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchPlansAndLockers();
  }, [currentTenant.id]);

  const handleOpenConvertModal = (lead: Lead) => {
    setLeadToConvert(lead);
    setShowRegisterModal(true);
  };

  const handleUpdateStatus = async (leadId: string, newStatus: 'NEW' | 'CONTACTED' | 'CONVERTED', notes?: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          id: leadId,
          status: newStatus,
          notes: notes !== undefined ? notes : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update lead');
      }

      fetchLeads();
      if (activeLead && activeLead.id === leadId) {
        setActiveLead(null);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const handleSaveNotesModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLead) return;
    setIsUpdating(true);
    try {
      await handleUpdateStatus(activeLead.id, leadStatus, leadNotes);
    } finally {
      setIsUpdating(false);
    }
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      searchQuery === '' ||
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.email && lead.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.selectedPackage && lead.selectedPackage.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    const matchesSource = sourceFilter === 'ALL' || lead.source === sourceFilter;

    return matchesSearch && matchesStatus && matchesSource;
  });

  // Metrics
  const totalCount = leads.length;
  const newCount = leads.filter((l) => l.status === 'NEW').length;
  const contactedCount = leads.filter((l) => l.status === 'CONTACTED').length;
  const convertedCount = leads.filter((l) => l.status === 'CONVERTED').length;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F8FAFC] border border-[#E5E7EB] text-[#0F766E]">
              <UserCheck className="h-4 w-4" />
            </span>
            <h1 className="text-[22px] leading-[30px] font-bold text-[#1F2937]">Prospect Leads & Follow-Up Queue</h1>
          </div>
          <p className="text-[14px] leading-[20px] text-[#1F2937]/70 mt-1">
            Real-time prospective member registrations, trial requests, and admin inquiries for {currentTenant.name}.
          </p>
        </div>

        <button
          onClick={fetchLeads}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 py-2 text-[14px] font-semibold text-[#1F2937] hover:bg-[#E5E7EB] transition-colors"
        >
          <RefreshCw className="h-4 w-4 text-[#0F766E]" />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4">
          <span className="text-[12px] font-semibold uppercase text-[#1F2937]/70">Total Submissions</span>
          <p className="text-[24px] font-bold text-[#1F2937] mt-1">{totalCount}</p>
          <p className="text-[12px] text-[#1F2937]/60">All captured prospects</p>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4">
          <span className="text-[12px] font-semibold uppercase text-[#D97706]">Awaiting Contact</span>
          <p className="text-[24px] font-bold text-[#D97706] mt-1">{newCount}</p>
          <p className="text-[12px] text-[#1F2937]/60">Action required</p>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4">
          <span className="text-[12px] font-semibold uppercase text-[#1F2937]/80">Contacted</span>
          <p className="text-[24px] font-bold text-[#1F2937] mt-1">{contactedCount}</p>
          <p className="text-[12px] text-[#1F2937]/60">In conversation</p>
        </div>

        <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4">
          <span className="text-[12px] font-semibold uppercase text-[#0F766E]">Converted</span>
          <p className="text-[24px] font-bold text-[#0F766E] mt-1">{convertedCount}</p>
          <p className="text-[12px] text-[#1F2937]/60">Joined memberships</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1F2937]/50" />
            <input
              type="text"
              placeholder="Search by prospect name, phone, email, or package..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] pl-9 pr-4 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New Awaiting Contact</option>
              <option value="CONTACTED">Contacted</option>
              <option value="CONVERTED">Converted</option>
            </select>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
            >
              <option value="ALL">All Sources</option>
              <option value="REGISTER">Registration</option>
              <option value="TRIAL">Trial Booking</option>
              <option value="CONTACT">Contact Inquiry</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-[#1F2937] bg-[#FFFFFF] p-4 text-[#1F2937] flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-[#1F2937] shrink-0" />
          <div className="flex-1">
            <h4 className="text-[14px] font-bold">Failed to load leads</h4>
            <p className="text-[12px] text-[#1F2937]/70">{error}</p>
          </div>
          <button
            onClick={fetchLeads}
            className="rounded border border-[#1F2937] px-3 py-1 text-[12px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-6 space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-[#F8FAFC] rounded-lg border border-[#E5E7EB]" />
          ))}
        </div>
      )}

      {/* Leads Follow-Up Table */}
      {!loading && !error && (
        <div className="rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] overflow-hidden shadow-sm">
          {filteredLeads.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <UserCheck className="h-10 w-10 text-[#1F2937]/40 mx-auto" />
              <h3 className="text-[16px] font-bold text-[#1F2937]">No Leads Found</h3>
              <p className="text-[14px] text-[#1F2937]/70 max-w-sm mx-auto">
                {searchQuery || statusFilter !== 'ALL' || sourceFilter !== 'ALL'
                  ? 'No prospective leads match your filter criteria. Try clearing search filters.'
                  : 'New public enquiries and registrations from the landing page will appear here in real time.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[14px] leading-[20px]">
                <thead className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[12px] font-semibold uppercase text-[#1F2937]/70">
                  <tr>
                    <th className="py-3 px-4">Prospect Details</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Package / Interest</th>
                    <th className="py-3 px-4">Preferred Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Received At</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#F8FAFC] transition-colors">
                      {/* Name & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#1F2937]">{lead.name}</div>
                        <div className="flex items-center gap-3 text-[12px] text-[#1F2937]/70 mt-0.5">
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 hover:text-[#0F766E]">
                            <Phone className="h-3 w-3" />
                            <span>{lead.phone}</span>
                          </a>
                          {lead.email && (
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-1 hover:text-[#0F766E]">
                              <Mail className="h-3 w-3" />
                              <span>{lead.email}</span>
                            </a>
                          )}
                        </div>
                        {lead.message && (
                          <p className="text-[12px] text-[#1F2937]/60 italic mt-1 max-w-xs truncate">
                            &ldquo;{lead.message}&rdquo;
                          </p>
                        )}
                        {lead.notes && (
                          <p className="text-[11px] text-[#0F766E] font-medium mt-0.5">
                            Staff Note: {lead.notes}
                          </p>
                        )}
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-semibold ${
                            lead.source === 'REGISTER'
                              ? 'border-[#0F766E]/30 bg-[#F0FDFA] text-[#0F766E]'
                              : lead.source === 'TRIAL'
                              ? 'border-[#D97706]/30 bg-[#FFFBEB] text-[#D97706]'
                              : 'border-[#1F2937]/20 bg-[#F8FAFC] text-[#1F2937]'
                          }`}
                          title={`Lead Source: ${lead.source || 'REGISTER'}`}
                        >
                          <Tag className="h-3 w-3 shrink-0" />
                          <span>
                            {lead.source === 'REGISTER'
                              ? 'Web Registration'
                              : lead.source === 'TRIAL'
                              ? 'Free Trial Request'
                              : 'Staff Inquiry'}
                          </span>
                        </span>
                      </td>

                      {/* Package / Interest */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#1F2937]">
                          {lead.selectedPackage || lead.interest || 'General Membership'}
                        </span>
                      </td>

                      {/* Preferred Date */}
                      <td className="py-3.5 px-4 text-[12px] text-[#1F2937]/80">
                        {lead.preferredDate ? formatDate(lead.preferredDate) : 'Flexible'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold ${
                            lead.status === 'NEW'
                              ? 'border border-[#D97706] bg-[#FFFFFF] text-[#D97706]'
                              : lead.status === 'CONTACTED'
                              ? 'border border-[#1F2937] bg-[#FFFFFF] text-[#1F2937]'
                              : 'border border-[#0F766E] bg-[#FFFFFF] text-[#0F766E]'
                          }`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-[12px] text-[#1F2937]/70 font-mono">
                        {formatDate(lead.createdAt)} {formatTime(lead.createdAt)}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenConvertModal(lead)}
                          className="inline-flex items-center gap-1 rounded bg-[#0F766E] px-2.5 py-1 text-[11px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90 shadow-sm"
                          title="Register this prospect into an official gym member with receipt and legal consent"
                        >
                          <UserPlus className="h-3 w-3" />
                          <span>Register Member</span>
                        </button>

                        {lead.status === 'NEW' && (
                          <button
                            onClick={() => handleUpdateStatus(lead.id, 'CONTACTED')}
                            className="rounded border border-[#1F2937] bg-[#FFFFFF] px-2.5 py-1 text-[11px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC]"
                          >
                            Mark Contacted
                          </button>
                        )}

                        {lead.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleUpdateStatus(lead.id, 'CONVERTED')}
                            className="rounded border border-[#0F766E] bg-[#FFFFFF] px-2 py-1 text-[11px] font-semibold text-[#0F766E] hover:bg-[#F0FDFA]"
                          >
                            Mark Converted
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveLead(lead);
                            setLeadNotes(lead.notes || '');
                            setLeadStatus(lead.status);
                          }}
                          className="rounded border border-[#E5E7EB] bg-[#F8FAFC] px-2 py-1 text-[11px] font-semibold text-[#1F2937] hover:bg-[#E5E7EB]"
                        >
                          Details & Notes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Details & Notes Modal */}
      {activeLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1F2937]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB]">
              <div>
                <h3 className="text-[16px] font-bold text-[#1F2937]">Lead Follow-Up Details</h3>
                <p className="text-[12px] text-[#1F2937]/70 font-mono">ID: {activeLead.id}</p>
              </div>
              <button
                onClick={() => setActiveLead(null)}
                className="text-[#1F2937]/50 hover:text-[#1F2937]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-[14px]">
              <div>
                <span className="text-[12px] font-semibold text-[#1F2937]/70 uppercase">Prospect:</span>
                <p className="font-bold text-[#1F2937]">{activeLead.name}</p>
              </div>
              <div>
                <span className="text-[12px] font-semibold text-[#1F2937]/70 uppercase">Phone & Email:</span>
                <p className="text-[#1F2937]">
                  {activeLead.phone} {activeLead.email ? `• ${activeLead.email}` : ''}
                </p>
              </div>
              <div>
                <span className="text-[12px] font-semibold text-[#1F2937]/70 uppercase">Package / Interest:</span>
                <p className="text-[#1F2937] font-medium">
                  {activeLead.selectedPackage || activeLead.interest || 'Not Specified'}
                </p>
              </div>
              {activeLead.message && (
                <div>
                  <span className="text-[12px] font-semibold text-[#1F2937]/70 uppercase">Submitted Message:</span>
                  <p className="text-[13px] text-[#1F2937]/80 italic bg-[#F8FAFC] p-2.5 rounded border border-[#E5E7EB]">
                    {activeLead.message}
                  </p>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveNotesModal} className="space-y-3 pt-2 border-t border-[#E5E7EB]">
              <div>
                <label className="block text-[12px] font-bold uppercase text-[#1F2937] mb-1">Update Status</label>
                <select
                  value={leadStatus}
                  onChange={(e) => setLeadStatus(e.target.value as any)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
                >
                  <option value="NEW">NEW (Awaiting Contact)</option>
                  <option value="CONTACTED">CONTACTED (Follow-Up in Progress)</option>
                  <option value="CONVERTED">CONVERTED (Registered as Member)</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold uppercase text-[#1F2937] mb-1">Staff Notes</label>
                <textarea
                  rows={3}
                  placeholder="Record outcome of phone call, scheduled tour, or payment details..."
                  value={leadNotes}
                  onChange={(e) => setLeadNotes(e.target.value)}
                  className="w-full rounded-lg border border-[#E5E7EB] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#1F2937] focus:outline-none focus:border-[#0F766E]"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => {
                    const l = activeLead;
                    setActiveLead(null);
                    if (l) handleOpenConvertModal(l);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F766E] px-3.5 py-2 text-[13px] font-semibold text-[#FFFFFF] hover:bg-[#0F766E]/90"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Register as Member</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveLead(null)}
                    className="rounded-lg border border-[#E5E7EB] px-4 py-2 text-[14px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="rounded-lg border border-[#1F2937] bg-[#FFFFFF] px-4 py-2 text-[14px] font-semibold text-[#1F2937] hover:bg-[#F8FAFC] disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save Notes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Convert Lead to Registered Member Modal */}
      {showRegisterModal && leadToConvert && (
        <NewMemberModal
          tenant={currentTenant}
          plans={plans}
          lockers={lockers}
          initialData={{
            firstName: leadToConvert.name.trim().split(/\s+/)[0] || '',
            lastName: leadToConvert.name.trim().split(/\s+/).slice(1).join(' ') || '',
            phone: leadToConvert.phone,
            email: leadToConvert.email,
            planId:
              plans.find(
                (p) =>
                  p.id === leadToConvert.packageId ||
                  p.name.toLowerCase() === (leadToConvert.selectedPackage || '').toLowerCase()
              )?.id || plans[0]?.id,
            leadId: leadToConvert.id,
          }}
          onClose={() => {
            setShowRegisterModal(false);
            setLeadToConvert(null);
          }}
          onCreated={() => {
            setShowRegisterModal(false);
            setLeadToConvert(null);
            fetchLeads();
          }}
        />
      )}
    </div>
  );
}
