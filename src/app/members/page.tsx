'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Member, MembershipPlan, Locker, User } from '@/lib/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { MemberCardModal } from '@/components/MemberCardModal';
import { NewMemberModal } from '@/components/NewMemberModal';
import { EditMemberModal } from '@/components/EditMemberModal';
import {
  Users,
  Search,
  UserPlus,
  QrCode,
  FileSpreadsheet,
  AlertTriangle,
  ShieldCheck,
  Filter,
  Sparkles,
  Download,
  KeyRound,
  RotateCw,
  Edit,
  MessageCircle,
  Dumbbell,
  Plus,
  X,
  Clock,
  Calendar,
} from 'lucide-react';
import { getRenewalReminderUrl, getDebtReminderUrl, getWelcomePassUrl } from '@/lib/whatsapp';

export default function MembersPage() {
  const { currentTenant, currentUser } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [trainerFilter, setTrainerFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Book Trainer Modal states
  const [showBookTrainerModal, setShowBookTrainerModal] = useState(false);
  const [bookingMember, setBookingMember] = useState<Member | null>(null);
  const [bookingForm, setBookingForm] = useState({
    trainerId: '',
    sessionsTotal: 10,
    feeETB: 2000,
    schedule: 'Mon, Wed, Fri 06:30 AM',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const canExport = currentUser && ['OWNER', 'MANAGER', 'FINANCE_OFFICER'].includes(currentUser.role);
  const canManagePT = currentUser && ['OWNER', 'MANAGER', 'GENERAL_MANAGER'].includes(currentUser.role);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      let url = `/api/members?tenantId=${currentTenant.id}`;
      if (searchQuery) url += `&query=${encodeURIComponent(searchQuery)}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (trainerFilter !== 'ALL') url += `&trainerId=${trainerFilter}`;

      const res = await fetch(url, {
        headers: {
          'x-user-role': currentUser?.role || 'RECEPTIONIST',
          'x-user-id': currentUser?.id || 'staff',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error('Failed to fetch members', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlansLockersAndTrainers = async () => {
    try {
      const [resPlans, resLockers, resStaff] = await Promise.all([
        fetch(`/api/plans?tenantId=${currentTenant.id}`),
        fetch(`/api/lockers?tenantId=${currentTenant.id}`),
        fetch(`/api/staff?tenantId=${currentTenant.id}`),
      ]);
      if (resPlans.ok) {
        const data = await resPlans.json();
        setPlans(data.plans || []);
      }
      if (resLockers.ok) {
        const data = await resLockers.json();
        setLockers(data.lockers || []);
      }
      if (resStaff.ok) {
        const data = await resStaff.json();
        const trainerUsers = (data.users || []).filter((u: User) => u.role === 'TRAINER');
        setTrainers(trainerUsers);
        if (trainerUsers.length > 0) {
          setBookingForm((prev) => ({ ...prev, trainerId: trainerUsers[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentTenant.id, searchQuery, statusFilter, trainerFilter, currentUser?.role]);

  useEffect(() => {
    fetchPlansLockersAndTrainers();
  }, [currentTenant.id]);

  const handleRenewMember = async (memberId: string) => {
    try {
      const defaultPlan = plans[0]?.id || 'plan-1-monthly';
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': currentUser?.role || 'RECEPTIONIST',
          'x-user-id': currentUser?.id || 'staff',
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          action: 'RENEW',
          planId: defaultPlan,
          paymentMethod: 'CASH',
        }),
      });

      if (res.ok) {
        alert('Membership renewed for 30 days!');
        fetchMembers();
      }
    } catch (e) {
      console.error('Renewal error', e);
    }
  };

  const handleOpenBooking = (member: Member) => {
    setBookingMember(member);
    setBookingError('');
    setBookingSuccess('');
    if (trainers.length > 0 && !bookingForm.trainerId) {
      setBookingForm((prev) => ({ ...prev, trainerId: trainers[0].id }));
    }
    setShowBookTrainerModal(true);
  };

  const handleBookTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingMember || !bookingForm.trainerId) return;
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    const trainer = trainers.find((t) => t.id === bookingForm.trainerId);
    if (!trainer) {
      setBookingError('Please select a personal trainer');
      setBookingLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/staff/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          trainerId: trainer.id,
          trainerName: trainer.name,
          memberId: bookingMember.id,
          memberName: `${bookingMember.firstName} ${bookingMember.lastName}`,
          memberNumber: bookingMember.memberNumber,
          clientPhone: bookingMember.phone,
          sessionsTotal: bookingForm.sessionsTotal,
          feeETB: bookingForm.feeETB,
          schedule: bookingForm.schedule,
          startDate: bookingForm.startDate,
          notes: bookingForm.notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setBookingSuccess(`Coach ${trainer.name} successfully booked for ${bookingMember.firstName}!`);
        await fetchMembers();
        setTimeout(() => {
          setShowBookTrainerModal(false);
          setBookingMember(null);
          setBookingSuccess('');
        }, 1500);
      } else {
        setBookingError(data.error || 'Failed to book trainer');
      }
    } catch {
      setBookingError('Network error while booking personal trainer');
    } finally {
      setBookingLoading(false);
    }
  };

  const exportCSV = async () => {
    if (!canExport) {
      alert('Access Denied: Member directory export requires Manager, Finance, or Owner privileges.');
      return;
    }
    try {
      const res = await fetch(`/api/members/export?tenantId=${currentTenant.id}`, {
        headers: {
          'x-user-role': currentUser?.role || 'RECEPTIONIST',
          'x-user-id': currentUser?.id || 'staff',
        },
      });

      if (!res.ok) {
        if (res.status === 403) {
          alert('Access Denied: Your role is not authorized to export member directory data.');
          return;
        }
        throw new Error('Export request failed');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `members-${currentTenant.slug}-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error', e);
      alert('Failed to generate export file.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-800">
              <Users className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Members Directory</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage membership plans, digital QR access tokens, and locker allocations for {currentTenant.name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-teal-800 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Register Member</span>
          </button>
          <Link
            href="/import"
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet className="h-4 w-4 text-teal-700" />
            <span className="hidden sm:inline">Import Paper List</span>
          </Link>
          {canExport && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
              title="Export Member Directory CSV"
            >
              <Download className="h-4 w-4 text-teal-700" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
          <button
            onClick={() => setStatusFilter(statusFilter === 'EXPIRING_SOON' ? 'ALL' : 'EXPIRING_SOON')}
            className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-bold transition-all shadow-sm ${
              statusFilter === 'EXPIRING_SOON'
                ? 'border-amber-600 bg-amber-600 text-white'
                : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
            }`}
            title="Filter members needing renewal"
          >
            <MessageCircle className="h-4 w-4 text-amber-600" />
            <span>Renewal Reminders</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, phone, member #..."
            className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-700/20"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          {['ALL', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'SUSPENDED', 'FROZEN'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                statusFilter === tab
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {tab === 'ALL'
                ? 'All Members'
                : tab === 'ACTIVE'
                ? 'Active'
                : tab === 'EXPIRING_SOON'
                ? 'Expiring Soon'
                : tab === 'EXPIRED'
                ? 'Expired'
                : tab === 'SUSPENDED'
                ? 'Suspended'
                : 'Frozen'}
            </button>
          ))}
        </div>

        {/* Filter by Trainer */}
        <div className="flex items-center gap-1.5 w-full md:w-auto">
          <Dumbbell className="h-4 w-4 text-emerald-600 shrink-0" />
          <select
            value={trainerFilter}
            onChange={(e) => setTrainerFilter(e.target.value)}
            className="w-full md:w-auto rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 focus:border-teal-700 focus:outline-none"
          >
            <option value="ALL">All Trainers</option>
            <option value="UNASSIGNED">No Trainer Assigned</option>
            {trainers.map((t) => (
              <option key={t.id} value={t.id}>
                Coach: {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Member</th>
                <th className="px-4 py-3.5">Phone / Contact</th>
                <th className="px-4 py-3.5">Membership Plan</th>
                <th className="px-4 py-3.5">Personal Trainer</th>
                <th className="px-4 py-3.5">Expires On</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Locker</th>
                <th className="px-4 py-3.5">Balance</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    Loading member database...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-500">
                    No members found matching your filter.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Member Profile & Number */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs overflow-hidden shadow-sm">
                          {member.profileImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={member.profileImage} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span>{member.firstName.charAt(0)}{member.lastName.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 text-xs">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">{member.memberNumber}</p>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-4 py-3.5 text-slate-800 font-medium">
                      <p>{member.phone}</p>
                      {member.email && <p className="text-[10px] text-slate-500">{member.email}</p>}
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3.5">
                      <span className="font-semibold text-slate-900">{member.currentPlanName || 'No Plan'}</span>
                    </td>

                    {/* Personal Trainer */}
                    <td className="px-4 py-3.5">
                      {member.assignedTrainerName ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
                            <Dumbbell className="h-3 w-3 text-emerald-600" />
                            <span>{member.assignedTrainerName}</span>
                          </span>
                          {canManagePT && (
                            <button
                              onClick={() => handleOpenBooking(member)}
                              title="Reassign or Manage Trainer"
                              className="text-slate-400 hover:text-emerald-700 transition-colors"
                            >
                              <Edit className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : canManagePT ? (
                        <button
                          onClick={() => handleOpenBooking(member)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 transition-colors shadow-2xs"
                        >
                          <Plus className="h-3 w-3 text-emerald-600" />
                          <span>Book Trainer</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>

                    {/* Expiration */}
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-slate-800">{formatDate(member.subscriptionEnd)}</p>
                      {member.daysRemaining !== undefined && (
                        <p
                          className={`text-[10px] font-bold ${
                            member.daysRemaining < 0
                              ? 'text-slate-900 font-black'
                              : member.daysRemaining <= 3
                              ? 'text-slate-700'
                              : 'text-slate-500'
                          }`}
                        >
                          {member.daysRemaining < 0
                            ? `${Math.abs(member.daysRemaining)}d overdue`
                            : `${member.daysRemaining} days left`}
                        </p>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5">
                      {member.status === 'ACTIVE' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                          <ShieldCheck className="h-3 w-3" /> Active
                        </span>
                      ) : member.status === 'EXPIRING_SOON' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300">
                          <AlertTriangle className="h-3 w-3" /> Soon ({member.daysRemaining}d)
                        </span>
                      ) : member.status === 'SUSPENDED' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 border border-rose-200">
                          <AlertTriangle className="h-3 w-3" /> Suspended
                        </span>
                      ) : member.status === 'FROZEN' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 border border-slate-300">
                          Frozen
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-bold text-white">
                          Expired
                        </span>
                      )}
                    </td>

                    {/* Locker */}
                    <td className="px-4 py-3.5">
                      {member.assignedLockerNumber ? (
                        <span className="flex items-center gap-1 font-semibold text-emerald-700">
                          <KeyRound className="h-3 w-3" /> {member.assignedLockerNumber}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="px-4 py-3.5">
                      {member.dueBalance > 0 ? (
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(member.dueBalance, currentTenant?.currencySymbol, currentTenant?.currency)}
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {formatCurrency(0, currentTenant?.currencySymbol, currentTenant?.currency)}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedMember(member)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-50 shadow-sm"
                          title="View Digital QR Pass"
                        >
                          <QrCode className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Pass</span>
                        </button>

                        <button
                          onClick={() => setMemberToEdit(member)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
                          title="Edit Member"
                        >
                          <Edit className="h-3.5 w-3.5 text-slate-500" />
                          <span>Edit</span>
                        </button>

                        <a
                          href={
                            member.status === 'EXPIRED' || member.status === 'EXPIRING_SOON'
                              ? getRenewalReminderUrl(member, currentTenant)
                              : member.dueBalance > 0
                              ? getDebtReminderUrl(member, currentTenant)
                              : getWelcomePassUrl(
                                  member,
                                  currentTenant,
                                  typeof window !== 'undefined' ? window.location.origin : ''
                                )
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                          title="Send WhatsApp message"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="hidden lg:inline">WhatsApp</span>
                        </a>

                        {(member.status === 'EXPIRED' || member.status === 'EXPIRING_SOON') && (
                          <button
                            onClick={() => handleRenewMember(member.id)}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                            title="Quick Renew"
                          >
                            <RotateCw className="h-3 w-3" />
                            <span>Renew</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {selectedMember && (
        <MemberCardModal
          member={selectedMember}
          tenant={currentTenant}
          onClose={() => setSelectedMember(null)}
          onRenew={(m) => handleRenewMember(m.id)}
        />
      )}

      {memberToEdit && (
        <EditMemberModal
          member={memberToEdit}
          tenant={currentTenant}
          plans={plans}
          lockers={lockers}
          onClose={() => setMemberToEdit(null)}
          onUpdated={fetchMembers}
          onDeleted={fetchMembers}
        />
      )}

      {showNewModal && (
        <NewMemberModal
          tenant={currentTenant}
          plans={plans}
          lockers={lockers}
          onClose={() => setShowNewModal(false)}
          onCreated={fetchMembers}
        />
      )}

      {/* Book Trainer Modal for Owner */}
      {showBookTrainerModal && bookingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Book Personal Trainer</h3>
                  <p className="text-[11px] text-slate-500">Executive booking management for members</p>
                </div>
              </div>
              <button
                onClick={() => setShowBookTrainerModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {bookingError && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-semibold">
                {bookingError}
              </div>
            )}
            {bookingSuccess && (
              <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 font-semibold">
                {bookingSuccess}
              </div>
            )}

            <form onSubmit={handleBookTrainer} className="mt-4 space-y-3.5 text-xs">
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100">
                <span className="text-slate-500 text-[10px] uppercase font-bold block">Selected Trainee</span>
                <span className="font-extrabold text-slate-900 text-sm block">
                  {bookingMember.firstName} {bookingMember.lastName}
                </span>
                <span className="text-slate-500 text-[11px]">
                  ID: {bookingMember.memberNumber} • Phone: {bookingMember.phone}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Personal Trainer *</label>
                {trainers.length === 0 ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                    No trainers registered yet. Go to Staff & Shifts to add a trainer first.
                  </p>
                ) : (
                  <select
                    value={bookingForm.trainerId}
                    onChange={(e) => setBookingForm({ ...bookingForm, trainerId: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none font-semibold"
                  >
                    {trainers.map((t) => (
                      <option key={t.id} value={t.id}>
                        Coach: {t.name} ({t.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Session Count *</label>
                  <select
                    value={bookingForm.sessionsTotal}
                    onChange={(e) => setBookingForm({ ...bookingForm, sessionsTotal: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none font-semibold"
                  >
                    <option value={5}>5 Sessions</option>
                    <option value={10}>10 Sessions</option>
                    <option value={15}>15 Sessions</option>
                    <option value={20}>20 Sessions</option>
                    <option value={30}>30 Sessions (Monthly VIP)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Booking Fee ({currentTenant?.currencySymbol || 'ETB'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={bookingForm.feeETB}
                    onChange={(e) => setBookingForm({ ...bookingForm, feeETB: Number(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingForm.startDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Training Schedule</label>
                  <input
                    type="text"
                    placeholder="e.g. Mon, Wed, Fri 06:30"
                    value={bookingForm.schedule}
                    onChange={(e) => setBookingForm({ ...bookingForm, schedule: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Training Goals & Medical Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Weight loss, lower back rehab, competition prep"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookTrainerModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading || trainers.length === 0}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
                >
                  {bookingLoading ? 'Booking...' : 'Confirm Trainer Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
