'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { PersonalTrainingAssignment, Member } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Dumbbell,
  Users,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  AlertTriangle,
  Search,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
} from 'lucide-react';

export default function TrainerDashboardPage() {
  const { currentTenant, currentUser } = useAuth();
  const [assignments, setAssignments] = useState<PersonalTrainingAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ACTIVE');
  const [loggingId, setLoggingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<PersonalTrainingAssignment | null>(null);
  const [sessionNotes, setSessionNotes] = useState('');

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/staff/assignments?tenantId=${currentTenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setAssignments(data.assignments || []);
      }
    } catch (e) {
      console.error('Failed to load trainer assignments', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentTenant.id]);

  const handleLogSession = async (assignment: PersonalTrainingAssignment) => {
    try {
      setLoggingId(assignment.id);
      setSuccessMessage(null);

      const res = await fetch('/api/staff/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: assignment.id,
          tenantId: currentTenant.id,
          sessionsCompleted: 1,
          notes: sessionNotes ? `${assignment.notes ? assignment.notes + ' | ' : ''}Session Logged: ${sessionNotes}` : assignment.notes,
        }),
      });

      if (res.ok) {
        setSuccessMessage(`Workout session logged successfully for ${assignment.memberName}!`);
        setSessionNotes('');
        setSelectedAssignment(null);
        await fetchAssignments();
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to log session');
      }
    } catch (e) {
      console.error(e);
      alert('Network error while logging session');
    } finally {
      setLoggingId(null);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.clientPhone && a.clientPhone.includes(searchQuery)) ||
      (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'ACTIVE'
        ? a.status === 'ACTIVE'
        : a.status === 'COMPLETED';

    return matchesSearch && matchesStatus;
  });

  const totalActiveTrainees = assignments.filter((a) => a.status === 'ACTIVE').length;
  const totalSessionsRemaining = assignments
    .filter((a) => a.status === 'ACTIVE')
    .reduce((sum, a) => sum + (a.sessionsRemaining || 0), 0);
  const totalSessionsConducted = assignments.reduce((sum, a) => {
    const total = a.totalSessions ?? a.sessionsTotal ?? 0;
    const remaining = a.remainingSessions ?? a.sessionsRemaining ?? 0;
    return sum + Math.max(0, total - remaining);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-emerald-900 to-teal-800 p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm mb-3">
            <Dumbbell className="h-3.5 w-3.5 text-emerald-300" />
            <span>Personal Trainer Portal</span>
            <span>•</span>
            <span>{currentTenant.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome, Coach {currentUser?.name || 'Trainer'}!
          </h1>
          <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
            Here are the members assigned to you. Track personal training workouts, session counts, and trainee milestones.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 text-center min-w-[90px]">
            <span className="block text-2xl font-black">{totalActiveTrainees}</span>
            <span className="text-[10px] text-emerald-200 uppercase font-semibold">Trainees</span>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 text-center min-w-[90px]">
            <span className="block text-2xl font-black">{totalSessionsRemaining}</span>
            <span className="text-[10px] text-emerald-200 uppercase font-semibold">Sessions Left</span>
          </div>
          <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 p-3 text-center min-w-[90px]">
            <span className="block text-2xl font-black">{totalSessionsConducted}</span>
            <span className="text-[10px] text-emerald-200 uppercase font-semibold">Done</span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-xs text-emerald-800 font-bold animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Trainees Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search trainees by name, phone or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'ACTIVE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Active Trainees ({totalActiveTrainees})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'COMPLETED'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({assignments.length})
          </button>
        </div>
      </div>

      {/* Trainees List / Grid */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
          Loading assigned trainees...
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="font-extrabold text-sm text-slate-900">No trainees found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            {searchQuery
              ? 'No assigned trainees match your current search query.'
              : 'You do not have any active trainees assigned yet. The gym owner can assign members to your personal training roster.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAssignments.map((assignment) => {
            const total = assignment.totalSessions ?? assignment.sessionsTotal ?? 0;
            const remaining = assignment.remainingSessions ?? assignment.sessionsRemaining ?? 0;
            const completed = assignment.completedSessions ?? Math.max(0, total - remaining);
            const percent = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;
            const phone = assignment.clientPhone;

            return (
              <div
                key={assignment.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base shadow-xs">
                        {assignment.memberName.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">
                          {assignment.memberName}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              assignment.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {assignment.status}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            Started {formatDate(assignment.startDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact Actions */}
                    {phone && (
                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${phone}`}
                          title="Call Trainee"
                          className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition-colors"
                        >
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hi ${assignment.memberName}, this is Coach ${currentUser?.name || ''} from ${currentTenant.name}. Looking forward to our next workout session!`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="WhatsApp Trainee"
                          className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Schedule & Notes */}
                  {(assignment.schedule || assignment.notes) && (
                    <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-3 space-y-1.5 text-xs">
                      {assignment.schedule && (
                        <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                          <Clock className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>Schedule: {assignment.schedule}</span>
                        </div>
                      )}
                      {assignment.notes && (
                        <div className="text-slate-600 text-[11px]">
                          <strong>Notes:</strong> {assignment.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Progress Section */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Training Progress</span>
                      <span className="font-extrabold text-slate-900">
                        {completed} / {total} Sessions ({percent}%)
                      </span>
                    </div>

                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>{completed} sessions completed</span>
                      <span className="font-bold text-emerald-700">
                        {remaining} remaining
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500 truncate">
                    Assigned by: <strong>{assignment.assignedBy || 'Owner'}</strong>
                  </span>

                  {assignment.status === 'ACTIVE' && remaining > 0 ? (
                    <button
                      onClick={() => setSelectedAssignment(assignment)}
                      disabled={loggingId === assignment.id}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition-all disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{loggingId === assignment.id ? 'Logging...' : 'Log Session'}</span>
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>All Sessions Completed</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Log Session Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Log Workout Session
                </h3>
              </div>
              <button
                onClick={() => setSelectedAssignment(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-3.5">
                <span className="text-emerald-900 font-extrabold text-sm block">
                  {selectedAssignment.memberName}
                </span>
                <span className="text-emerald-700 text-[11px] block mt-0.5">
                  Remaining: <strong>{selectedAssignment.sessionsRemaining} sessions</strong> • Will become <strong>{Math.max(0, selectedAssignment.sessionsRemaining - 1)}</strong> after logging.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Workout Focus / Trainee Milestone Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="e.g. Chest & triceps press workout, increased bench to 70kg, form improved..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none shadow-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedAssignment(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleLogSession(selectedAssignment)}
                  disabled={loggingId === selectedAssignment.id}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{loggingId === selectedAssignment.id ? 'Saving...' : 'Confirm & Log Session'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
