'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Locker, Member } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { AddLockerModal } from '@/components/AddLockerModal';
import { KeyRound, Plus, X, Trash2, CheckCircle2 } from 'lucide-react';

export default function LockersPage() {
  const { currentTenant } = useAuth();
  const [lockers, setLockers] = useState<Locker[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [zoneFilter, setZoneFilter] = useState('ALL');
  const [selectedLocker, setSelectedLocker] = useState<Locker | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [assignMemberId, setAssignMemberId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const [resLockers, resMembers] = await Promise.all([
        fetch(`/api/lockers?tenantId=${currentTenant.id}`),
        fetch(`/api/members?tenantId=${currentTenant.id}`),
      ]);
      if (resLockers.ok) {
        const data = await resLockers.json();
        setLockers(data.lockers || []);
      }
      if (resMembers.ok) {
        const data = await resMembers.json();
        setMembers(data.members || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTenant.id]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocker || !assignMemberId) return;

    const mem = members.find((m) => m.id === assignMemberId);
    if (!mem) return;

    setIsAssigning(true);
    try {
      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          action: 'ASSIGN',
          lockerNumber: selectedLocker.number,
          memberId: mem.id,
          memberName: `${mem.firstName} ${mem.lastName}`,
          memberPhone: mem.phone,
          expiresAt: mem.subscriptionEnd,
        }),
      });

      if (res.ok) {
        setSelectedLocker(null);
        setAssignMemberId('');
        fetchData();
      }
    } catch (e) {
      console.error('Assign locker failed', e);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRelease = async (lockerNumber: string) => {
    try {
      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          action: 'RELEASE',
          lockerNumber,
        }),
      });

      if (res.ok) {
        setSelectedLocker(null);
        fetchData();
      }
    } catch (e) {
      console.error('Release failed', e);
    }
  };

  const handleDeleteLocker = async (lockerId: string) => {
    if (!confirm('Are you sure you want to delete this locker?')) return;
    try {
      const res = await fetch('/api/lockers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          action: 'DELETE_LOCKER',
          id: lockerId,
        }),
      });

      if (res.ok) {
        setSelectedLocker(null);
        fetchData();
      }
    } catch (e) {
      console.error('Delete locker failed', e);
    }
  };

  const zones = ['ALL', ...Array.from(new Set(lockers.map((l) => l.zone)))];
  const filteredLockers =
    zoneFilter === 'ALL' ? lockers : lockers.filter((l) => l.zone === zoneFilter);

  const availableCount = lockers.filter((l) => l.status === 'AVAILABLE').length;
  const occupiedCount = lockers.filter((l) => l.status === 'OCCUPIED').length;
  const maintenanceCount = lockers.filter((l) => l.status === 'MAINTENANCE').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <KeyRound className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Interactive Locker Matrix</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time locker occupancy, member key assignment, and zone management.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-500 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Locker</span>
          </button>

          {/* Counter Badges */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Available</span>
              <p className="text-sm font-black text-emerald-950">{availableCount}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase">Occupied</span>
              <p className="text-sm font-black text-slate-900">{occupiedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {zones.map((zone) => (
          <button
            key={zone}
            onClick={() => setZoneFilter(zone)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              zoneFilter === zone
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {zone === 'ALL' ? 'All Locker Zones' : zone}
          </button>
        ))}
      </div>

      {/* Locker Matrix Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredLockers.map((locker) => (
          <div
            key={locker.id}
            onClick={() => setSelectedLocker(locker)}
            className={`rounded-2xl border p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between h-40 ${
              locker.status === 'AVAILABLE'
                ? 'border-emerald-200 bg-emerald-50/40 hover:border-emerald-500'
                : locker.status === 'OCCUPIED'
                ? 'border-slate-200 bg-white hover:border-slate-400'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 font-black text-lg text-slate-900">
                <KeyRound
                  className={`h-5 w-5 ${
                    locker.status === 'AVAILABLE'
                      ? 'text-emerald-600'
                      : locker.status === 'OCCUPIED'
                      ? 'text-slate-700'
                      : 'text-slate-400'
                  }`}
                />
                <span>{locker.number}</span>
              </div>
              <span
                className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  locker.status === 'AVAILABLE'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : locker.status === 'OCCUPIED'
                    ? 'bg-slate-100 text-slate-800 border-slate-200'
                    : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}
              >
                {locker.status}
              </span>
            </div>

            <div className="mt-2 text-xs">
              {locker.status === 'OCCUPIED' ? (
                <div>
                  <p className="font-extrabold text-slate-900 truncate">{locker.memberName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{locker.memberPhone}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">Exp: {formatDate(locker.expiresAt)}</p>
                </div>
              ) : locker.status === 'AVAILABLE' ? (
                <div>
                  <p className="text-slate-500 text-[11px]">Ready for assignment</p>
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">Zone: {locker.zone}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-[11px]">Under Maintenance</p>
              )}
            </div>

            <div className="border-t border-slate-100 pt-2 flex items-center justify-between text-[10px] text-slate-500">
              <span>{locker.zone}</span>
              <span className="font-bold underline text-slate-700">Manage</span>
            </div>
          </div>
        ))}
      </div>

      {/* Locker Detail / Assign Modal */}
      {selectedLocker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-4">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-emerald-600" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  Locker {selectedLocker.number} Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedLocker(null)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Locker Zone:</span>
                  <span className="font-bold text-slate-900">{selectedLocker.zone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Status:</span>
                  <span className="font-bold uppercase text-emerald-700">{selectedLocker.status}</span>
                </div>
                {selectedLocker.memberName && (
                  <>
                    <div className="flex justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-500">Assigned Member:</span>
                      <span className="font-bold text-slate-900">{selectedLocker.memberName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Member Phone:</span>
                      <span className="font-bold text-slate-700">{selectedLocker.memberPhone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Expires On:</span>
                      <span className="font-bold text-slate-900">{formatDate(selectedLocker.expiresAt)}</span>
                    </div>
                  </>
                )}
              </div>

              {selectedLocker.status === 'OCCUPIED' ? (
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleRelease(selectedLocker.number)}
                    className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-800 border border-slate-300 hover:bg-slate-200 transition-all"
                  >
                    Release Locker Key
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAssign} className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase text-slate-600">
                    Assign to Member:
                  </label>
                  <select
                    value={assignMemberId}
                    onChange={(e) => setAssignMemberId(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600 font-semibold"
                  >
                    <option value="">Select an active member...</option>
                    {members
                      .filter((m) => !m.assignedLockerNumber)
                      .map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.firstName} {m.lastName} ({m.memberNumber})
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={isAssigning || !assignMemberId}
                    className="w-full rounded-xl bg-emerald-600 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500 shadow-sm transition-all disabled:opacity-40"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign Locker Key'}
                  </button>
                </form>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteLocker(selectedLocker.id)}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Locker</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Locker Modal */}
      {showAddModal && (
        <AddLockerModal
          tenant={currentTenant}
          onClose={() => setShowAddModal(false)}
          onCreated={fetchData}
        />
      )}
    </div>
  );
}
