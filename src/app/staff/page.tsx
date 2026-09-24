'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  User,
  UserRole,
  StaffShift,
  ShiftType,
  PersonalTrainingAssignment,
  Member,
} from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { AddStaffModal } from '@/components/AddStaffModal';
import { EditStaffModal } from '@/components/EditStaffModal';
import {
  Users2,
  UserPlus,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Edit,
  Mail,
  Phone,
  Calendar,
  Clock,
  Check,
  Plus,
  Dumbbell,
  AlertCircle,
  RefreshCw,
  X,
  UserCheck,
  CalendarCheck,
  Trash2,
} from 'lucide-react';

export default function StaffManagementPage() {
  const { currentTenant, currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [shifts, setShifts] = useState<StaffShift[]>([]);
  const [assignments, setAssignments] = useState<PersonalTrainingAssignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);

  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'SHIFTS' | 'ASSIGNMENTS'>('DIRECTORY');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showPTModal, setShowPTModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [clockingShiftId, setClockingShiftId] = useState<string | null>(null);
  const [completingPTId, setCompletingPTId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Permissions
  const canManageSchedules =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.role === 'OWNER' ||
    currentUser?.role === 'GYM_OWNER' ||
    currentUser?.role === 'MANAGER' ||
    currentUser?.role === 'GENERAL_MANAGER';

  // Shift form state
  const [shiftForm, setShiftForm] = useState({
    userId: '',
    shiftType: 'MORNING' as ShiftType,
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '14:00',
    notes: '',
  });

  // PT assignment form state
  const [ptForm, setPtForm] = useState({
    trainerId: '',
    memberId: '',
    totalSessions: 10,
    feeETB: 2000,
    schedule: 'Mon, Wed, Fri 06:30 AM',
    startDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const [usersRes, shiftsRes, ptRes, memRes] = await Promise.all([
        fetch(`/api/staff?tenantId=${currentTenant.id}`),
        fetch(`/api/staff/shifts?tenantId=${currentTenant.id}`),
        fetch(`/api/staff/assignments?tenantId=${currentTenant.id}`),
        fetch(`/api/members?tenantId=${currentTenant.id}`),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
        if (data.users && data.users.length > 0 && !shiftForm.userId) {
          setShiftForm((prev) => ({ ...prev, userId: data.users[0].id }));
        }
      }

      if (shiftsRes.ok) {
        const sData = await shiftsRes.json();
        setShifts(sData.shifts || []);
      }

      if (ptRes.ok) {
        const ptData = await ptRes.json();
        setAssignments(ptData.assignments || []);
      }

      if (memRes.ok) {
        const mData = await memRes.json();
        setMembers(mData.members || []);
      }
    } catch (e: any) {
      console.error('Failed to fetch staff data', e);
      setFetchError(e.message || 'Error loading staff records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTenant.id]);

  const handleToggleStatus = async (user: User) => {
    const newActiveState = !(user.isActive !== false);
    const actionText = newActiveState ? 'Activate' : 'Deactivate';

    if (user.id === currentUser?.id) {
      alert('You cannot deactivate your own currently active account.');
      return;
    }

    if (!confirm(`Are you sure you want to ${actionText} ${user.name}'s account?`)) {
      return;
    }

    setTogglingId(user.id);
    try {
      const res = await fetch('/api/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          id: user.id,
          action: 'TOGGLE_STATUS',
          isActive: newActiveState,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Failed to toggle status', e);
    } finally {
      setTogglingId(null);
    }
  };

  const handleClockAction = async (shiftId: string, action: 'CLOCK_IN' | 'CLOCK_OUT') => {
    setClockingShiftId(shiftId);
    try {
      const res = await fetch('/api/staff/shifts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftId, action }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Clock action failed', e);
    } finally {
      setClockingShiftId(null);
    }
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const assignedUser = users.find((u) => u.id === shiftForm.userId);
    if (!assignedUser) return;

    try {
      setSubmitting(true);
      setActionError(null);
      const res = await fetch('/api/staff/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          userName: assignedUser.name,
          userRole: assignedUser.role,
          ...shiftForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowShiftModal(false);
        setShiftForm({
          userId: users[0]?.id || '',
          shiftType: 'MORNING',
          date: new Date().toISOString().split('T')[0],
          startTime: '06:00',
          endTime: '14:00',
          notes: '',
        });
        fetchData();
      } else {
        setActionError(data.error || 'Failed to create shift schedule');
      }
    } catch (e: any) {
      setActionError(e.message || 'Shift creation error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePTAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trainer = users.find((u) => u.id === ptForm.trainerId);
    const member = members.find((m) => m.id === ptForm.memberId);

    if (!trainer || !member) {
      setActionError('Please select both a trainer and a client member.');
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);
      const res = await fetch('/api/staff/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          trainerId: trainer.id,
          trainerName: trainer.name,
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          clientPhone: member.phone,
          planName: (member as any).planName || (member as any).planId || 'Personal Training',
          totalSessions: Number(ptForm.totalSessions),
          feeETB: ptForm.feeETB,
          schedule: ptForm.schedule,
          startDate: ptForm.startDate,
          notes: ptForm.notes,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowPTModal(false);
        setPtForm({
          trainerId: '',
          memberId: '',
          totalSessions: 10,
          feeETB: 2000,
          schedule: 'Mon, Wed, Fri 06:30 AM',
          startDate: new Date().toISOString().split('T')[0],
          notes: '',
        });
        fetchData();
      } else {
        setActionError(data.error || 'Failed to assign trainer to member');
      }
    } catch (e: any) {
      setActionError(e.message || 'PT assignment error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogPTSession = async (assignmentId: string) => {
    setCompletingPTId(assignmentId);
    try {
      const res = await fetch('/api/staff/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assignmentId,
          tenantId: currentTenant.id,
          sessionsCompleted: 1,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('PT session log failed', e);
    } finally {
      setCompletingPTId(null);
    }
  };

  const handleCancelPTAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to cancel / remove this personal trainer booking?')) return;
    try {
      const res = await fetch(`/api/staff/assignments?id=${assignmentId}&tenantId=${currentTenant.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchData();
      }
    } catch (e) {
      console.error('Cancel PT assignment error', e);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-[10px] font-bold">Super Admin</span>;
      case 'OWNER':
      case 'GYM_OWNER':
        return <span className="rounded-full bg-emerald-600 text-white px-2.5 py-0.5 text-[10px] font-bold">Gym Owner</span>;
      case 'MANAGER':
      case 'GENERAL_MANAGER':
        return <span className="rounded-full bg-blue-600 text-white px-2.5 py-0.5 text-[10px] font-bold">Floor Manager</span>;
      case 'FINANCE_OFFICER':
        return <span className="rounded-full bg-purple-600 text-white px-2.5 py-0.5 text-[10px] font-bold">Finance Officer</span>;
      case 'RECEPTIONIST':
        return <span className="rounded-full bg-slate-100 text-slate-800 border border-slate-300 px-2.5 py-0.5 text-[10px] font-semibold">Receptionist</span>;
      case 'TRAINER':
        return <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold">Trainer / Coach</span>;
      case 'MAINTENANCE_STAFF':
        return <span className="rounded-full bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 text-[10px] font-semibold">Maintenance</span>;
      default:
        return <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[10px] font-medium">Member</span>;
    }
  };

  const trainersList = users.filter((u) => u.role === 'TRAINER');

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const activeCount = users.filter((u) => u.isActive !== false).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Users2 className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Staff & Roster Management</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Scoped access control, shift schedules, clock-in punctuality, and trainer personal coaching assignments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canManageSchedules && (
            <>
              <button
                onClick={() => {
                  setActionError(null);
                  if (trainersList.length > 0 && !ptForm.trainerId) {
                    setPtForm((prev) => ({ ...prev, trainerId: trainersList[0].id }));
                  }
                  if (members.length > 0 && !ptForm.memberId) {
                    setPtForm((prev) => ({ ...prev, memberId: members[0].id }));
                  }
                  setShowPTModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Dumbbell className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Assign PT Client</span>
              </button>

              <button
                onClick={() => {
                  setActionError(null);
                  setShowShiftModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 shadow-sm hover:bg-slate-50 transition-colors"
              >
                <Calendar className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Schedule Shift</span>
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Add Staff</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Team Directory</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{users.length} Employees</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Active Shifts</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{shifts.length} Scheduled</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">PT Client Assignments</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{assignments.length} Active</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'DIRECTORY'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Staff Directory ({users.length})
        </button>

        <button
          onClick={() => setActiveTab('SHIFTS')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'SHIFTS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Shift Roster & Attendance</span>
          <span className="rounded-full bg-slate-900 px-2 py-0.2 text-[10px] text-white">
            {shifts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('ASSIGNMENTS')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'ASSIGNMENTS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Personal Trainers & Bookings</span>
          <span className="rounded-full bg-emerald-600 px-2 py-0.2 text-[10px] text-white font-bold">
            {assignments.length}
          </span>
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-xs font-semibold">Loading staff directory and shift roster...</p>
        </div>
      )}

      {fetchError && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Failed to Load Staff Data</h3>
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

      {/* TAB 1: DIRECTORY */}
      {!loading && !fetchError && activeTab === 'DIRECTORY' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
              {['ALL', 'OWNER', 'MANAGER', 'TRAINER', 'RECEPTIONIST', 'MAINTENANCE_STAFF'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all whitespace-nowrap ${
                    roleFilter === r
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {r === 'ALL'
                    ? 'All Roles'
                    : r === 'OWNER'
                    ? 'Owners'
                    : r === 'MANAGER'
                    ? 'Managers'
                    : r === 'TRAINER'
                    ? 'Trainers'
                    : r === 'RECEPTIONIST'
                    ? 'Receptionists'
                    : 'Maintenance'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff by name or email..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-4 py-4">Role Permission</th>
                    <th className="px-4 py-4">Contact Info</th>
                    <th className="px-4 py-4">Status</th>
                    <th className="px-4 py-4 text-center">Login Access</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No team accounts found matching your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isActive = u.isActive !== false;
                      const isMe = u.id === currentUser?.id;

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-slate-900 flex items-center justify-center font-black text-xs text-white uppercase shadow-sm">
                                {u.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isMe && (
                                    <span className="rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500">Added {formatDate(u.createdAt)}</div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">{getRoleBadge(u.role)}</td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-slate-700">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                              {u.phone && (
                                <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                  <Phone className="h-3 w-3 text-slate-400" />
                                  <span>{u.phone}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {isActive ? (
                                <>
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span className="font-bold text-emerald-700">Active</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 text-slate-400" />
                                  <span className="font-bold text-slate-500">Suspended</span>
                                </>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={isMe || togglingId === u.id}
                              title={isMe ? 'You cannot deactivate your own active session' : isActive ? 'Click to deactivate' : 'Click to activate'}
                              className={`transition-all ${isMe ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105'}`}
                            >
                              {isActive ? (
                                <ToggleRight className="h-6 w-6 text-emerald-600 inline" />
                              ) : (
                                <ToggleLeft className="h-6 w-6 text-slate-400 inline" />
                              )}
                            </button>
                          </td>

                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setUserToEdit(u)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                              <Edit className="h-3.5 w-3.5 text-slate-500" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SHIFTS */}
      {!loading && !fetchError && activeTab === 'SHIFTS' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Shift Schedule & Punctuality Ledger</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Staff work hours and clock-in/out timestamps (trainers and receptionists view their own roster)
              </p>
            </div>
            {canManageSchedules && (
              <button
                onClick={() => {
                  setActionError(null);
                  setShowShiftModal(true);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Shift</span>
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {shifts.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <CalendarCheck className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No shifts scheduled for this period.</p>
                <p className="mt-0.5">Managers can schedule staff shifts using the "Schedule Shift" button.</p>
              </div>
            ) : (
              shifts.map((shift) => (
                <div key={shift.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">{shift.userName}</span>
                          {getRoleBadge(shift.userRole)}
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                            {shift.shiftType} SHIFT
                          </span>
                        </div>

                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <span>Date: <strong>{shift.date}</strong></span>
                          <span>•</span>
                          <span>Hours: <strong>{shift.startTime} – {shift.endTime}</strong></span>
                          {shift.clockedInAt && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">
                                Clocked In: {new Date(shift.clockedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                          {shift.clockedOutAt && (
                            <>
                              <span>•</span>
                              <span className="text-slate-500">
                                Clocked Out: {new Date(shift.clockedOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </>
                          )}
                        </div>

                        {shift.notes && <p className="text-[11px] text-slate-500 mt-1">{shift.notes}</p>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {shift.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleClockAction(shift.id, 'CLOCK_IN')}
                          disabled={clockingShiftId === shift.id}
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                          Clock In
                        </button>
                      )}

                      {shift.status === 'CLOCKED_IN' && (
                        <button
                          onClick={() => handleClockAction(shift.id, 'CLOCK_OUT')}
                          disabled={clockingShiftId === shift.id}
                          className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          Clock Out
                        </button>
                      )}

                      {shift.status === 'COMPLETED' && (
                        <span className="flex items-center gap-1 rounded bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700">
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Shift Completed</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: PERSONAL TRAINERS & BOOKINGS */}
      {!loading && !fetchError && activeTab === 'ASSIGNMENTS' && (
        <div className="space-y-6">
          {/* Section 1: Active Personal Trainers Grid for Owner */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Dumbbell className="h-5 w-5 text-emerald-600" />
                  <span>Personal Trainers Roster</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Overview of all personal trainers, active trainee counts, and total completed workout sessions.
                </p>
              </div>

              {canManageSchedules && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-slate-800 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Add New Trainer</span>
                </button>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {trainersList.length === 0 ? (
                <div className="col-span-full py-8 text-center text-xs text-slate-500">
                  No personal trainers registered yet. Click &quot;Add New Trainer&quot; to onboard a coach.
                </div>
              ) : (
                trainersList.map((t) => {
                  const activeTrainees = assignments.filter((a) => a.trainerId === t.id && a.status === 'ACTIVE').length;
                  const totalSessionsGiven = assignments
                    .filter((a) => a.trainerId === t.id)
                    .reduce((sum, a) => {
                      const total = a.totalSessions ?? a.sessionsTotal ?? 0;
                      const remaining = a.remainingSessions ?? a.sessionsRemaining ?? 0;
                      return sum + Math.max(0, total - remaining);
                    }, 0);

                  return (
                    <div
                      key={t.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 hover:bg-slate-50 hover:border-slate-200 transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm shrink-0">
                          {t.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">Coach {t.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{t.email}</p>
                          {t.phone && <p className="text-[11px] text-slate-600 font-mono mt-0.5">{t.phone}</p>}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/60 grid grid-cols-2 gap-2 text-center text-xs">
                        <div className="bg-white rounded-xl p-2 border border-slate-100">
                          <span className="block font-black text-slate-900 text-sm">{activeTrainees}</span>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Active Clients</span>
                        </div>
                        <div className="bg-white rounded-xl p-2 border border-slate-100">
                          <span className="block font-black text-emerald-700 text-sm">{totalSessionsGiven}</span>
                          <span className="text-[10px] text-slate-500 font-semibold uppercase">Workouts Done</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Section 2: Trainer-Member Pairings Matrix */}
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Trainer & Member Bookings</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live pairings of members with their assigned trainers, session packages, and workout progress.
                </p>
              </div>
              {canManageSchedules && (
                <button
                  onClick={() => {
                    setActionError(null);
                    if (trainersList.length > 0 && !ptForm.trainerId) {
                      setPtForm((prev) => ({ ...prev, trainerId: trainersList[0].id }));
                    }
                    if (members.length > 0 && !ptForm.memberId) {
                      setPtForm((prev) => ({ ...prev, memberId: members[0].id }));
                    }
                    setShowPTModal(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>+ Book Personal Trainer</span>
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-100">
              {assignments.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  <Dumbbell className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700">No personal training bookings found.</p>
                  <p className="mt-0.5">
                    {canManageSchedules
                      ? 'Click "Book Personal Trainer" to book a trainer for a member.'
                      : 'You currently have no assigned PT clients.'}
                  </p>
                </div>
              ) : (
                assignments.map((assignment) => {
                  const total = assignment.totalSessions ?? assignment.sessionsTotal ?? 0;
                  const remaining = assignment.remainingSessions ?? assignment.sessionsRemaining ?? 0;
                  const completed = assignment.completedSessions ?? Math.max(0, total - remaining);
                  const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
                  const feeText = assignment.feeETB ? formatCurrency(assignment.feeETB, currentTenant.currencySymbol, currentTenant.currency) : null;

                  return (
                    <div key={assignment.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 font-extrabold text-sm shadow-xs">
                            {assignment.memberName.charAt(0)}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-sm text-slate-900">{assignment.memberName}</span>
                              <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 flex items-center gap-1">
                                <Dumbbell className="h-3 w-3 text-emerald-600" />
                                <span>Coach {assignment.trainerName}</span>
                              </span>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                  assignment.status === 'ACTIVE'
                                    ? 'bg-teal-100 text-teal-800'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {assignment.status}
                              </span>
                              {feeText && (
                                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                                  {feeText}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                              <span>
                                Progress: <strong>{completed} / {total} Sessions ({percent}%)</strong>
                              </span>
                              <span>•</span>
                              <span className="font-semibold text-emerald-700">
                                {remaining} Remaining
                              </span>
                              <span>•</span>
                              <span>Started: {formatDate(assignment.startDate)}</span>
                              {assignment.schedule && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-slate-700">
                                    <Clock className="inline h-3 w-3 text-emerald-600 mr-1" />
                                    {assignment.schedule}
                                  </span>
                                </>
                              )}
                              {assignment.assignedBy && (
                                <>
                                  <span>•</span>
                                  <span>Booked by: {assignment.assignedBy}</span>
                                </>
                              )}
                            </div>

                            {assignment.notes && <p className="text-[11px] text-slate-500 mt-1">{assignment.notes}</p>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-center">
                          {assignment.status === 'ACTIVE' && remaining > 0 && (
                            <button
                              onClick={() => handleLogPTSession(assignment.id)}
                              disabled={completingPTId === assignment.id}
                              className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                              title="Log 1 completed PT workout session"
                            >
                              {completingPTId === assignment.id ? 'Saving...' : 'Log Completed Session'}
                            </button>
                          )}
                          {canManageSchedules && (
                            <button
                              onClick={() => handleCancelPTAssignment(assignment.id)}
                              className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Cancel / Remove Booking"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Schedule Shift Modal */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Schedule Staff Work Shift</h3>
              <button
                onClick={() => setShowShiftModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreateShift} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Staff Member *</label>
                <select
                  value={shiftForm.userId}
                  onChange={(e) => setShiftForm({ ...shiftForm, userId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shift Type</label>
                  <select
                    value={shiftForm.shiftType}
                    onChange={(e) => {
                      const type = e.target.value as ShiftType;
                      setShiftForm({
                        ...shiftForm,
                        shiftType: type,
                        startTime: type === 'MORNING' ? '06:00' : type === 'EVENING' ? '14:00' : '09:00',
                        endTime: type === 'MORNING' ? '14:00' : type === 'EVENING' ? '22:00' : '18:00',
                      });
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="MORNING">Morning (06:00 - 14:00)</option>
                    <option value="EVENING">Evening (14:00 - 22:00)</option>
                    <option value="CUSTOM">Custom Hours</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Shift Date</label>
                  <input
                    type="date"
                    required
                    value={shiftForm.date}
                    onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.startTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={shiftForm.endTime}
                    onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Shift Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Turnstile desk monitoring or morning floor inspection"
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign / Book Personal Trainer Modal */}
      {showPTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Dumbbell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Book Personal Trainer</h3>
                  <p className="text-[11px] text-slate-500">Assign trainer and setup session package</p>
                </div>
              </div>
              <button
                onClick={() => setShowPTModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {actionError && (
              <div className="mt-3 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800 font-semibold">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCreatePTAssignment} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Coach / Trainer *</label>
                <select
                  value={ptForm.trainerId}
                  onChange={(e) => setPtForm({ ...ptForm, trainerId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  {trainersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Select Member Client *</label>
                <select
                  value={ptForm.memberId}
                  onChange={(e) => setPtForm({ ...ptForm, memberId: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.firstName} {m.lastName} ({m.memberNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Session Count *</label>
                  <select
                    value={ptForm.totalSessions}
                    onChange={(e) => setPtForm({ ...ptForm, totalSessions: parseInt(e.target.value) || 1 })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value={5}>5 Sessions</option>
                    <option value={10}>10 Sessions</option>
                    <option value={15}>15 Sessions</option>
                    <option value={20}>20 Sessions</option>
                    <option value={30}>30 Sessions (Monthly VIP)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fee ({currentTenant.currencySymbol || 'ETB'})</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={ptForm.feeETB}
                    onChange={(e) => setPtForm({ ...ptForm, feeETB: Number(e.target.value) || 0 })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 font-bold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={ptForm.startDate}
                    onChange={(e) => setPtForm({ ...ptForm, startDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Schedule</label>
                  <input
                    type="text"
                    placeholder="Mon, Wed, Fri 06:30"
                    value={ptForm.schedule}
                    onChange={(e) => setPtForm({ ...ptForm, schedule: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Training Focus / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Hypertrophy, rehab mobility, competition prep"
                  value={ptForm.notes}
                  onChange={(e) => setPtForm({ ...ptForm, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPTModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : 'Assign PT Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          tenant={currentTenant}
          onClose={() => setShowAddModal(false)}
          onCreated={() => fetchData()}
        />
      )}

      {/* Edit Staff Modal */}
      {userToEdit && (
        <EditStaffModal
          user={userToEdit}
          tenant={currentTenant}
          onClose={() => setUserToEdit(null)}
          onUpdated={() => fetchData()}
          onDeleted={() => fetchData()}
        />
      )}
    </div>
  );
}
