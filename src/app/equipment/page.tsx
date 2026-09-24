'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Search,
  Check,
  Building,
  Tag,
  Calendar,
  DollarSign,
  AlertCircle,
  History,
  Filter,
  RefreshCw,
  X,
  FileText,
  User,
} from 'lucide-react';
import {
  Equipment,
  MaintenanceTicket,
  EquipmentCategory,
  EquipmentStatus,
  EquipmentCondition,
  TicketPriority,
  TicketSeverity,
} from '@/lib/types';

export default function EquipmentPage() {
  const { currentTenant, currentUser } = useAuth();
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'EQUIPMENT' | 'TICKETS'>('EQUIPMENT');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [conditionFilter, setConditionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [showAddTicketModal, setShowAddTicketModal] = useState(false);
  const [selectedEquipmentForHistory, setSelectedEquipmentForHistory] = useState<Equipment | null>(null);
  const [resolvingTicket, setResolvingTicket] = useState<MaintenanceTicket | null>(null);

  // Form states
  const [eqForm, setEqForm] = useState({
    name: '',
    category: 'CARDIO' as EquipmentCategory,
    serialNumber: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseCost: '',
    warrantyExpires: '',
    location: '',
    condition: 'GOOD' as EquipmentCondition,
  });

  const [ticketForm, setTicketForm] = useState({
    equipmentId: '',
    equipmentName: '',
    title: '',
    description: '',
    priority: 'MEDIUM' as TicketPriority,
    severity: 'ROUTINE_SERVICE' as TicketSeverity,
    assigneeName: '',
    expectedCost: '',
  });

  const [resolveForm, setResolveForm] = useState({
    resolvedBy: currentUser?.name || 'Maintenance Staff',
    resolutionNotes: '',
    resolutionCost: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const res = await fetch(`/api/equipment?tenantId=${currentTenant.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.equipment) setEquipmentList(data.equipment);
        if (data.tickets) setTickets(data.tickets);
      } else {
        const errData = await res.json().catch(() => ({}));
        setFetchError(errData.error || `Failed to load equipment (${res.status})`);
      }
    } catch (e: any) {
      console.error(e);
      setFetchError(e.message || 'Network error loading equipment.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentTenant.id]);

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eqForm.name || !eqForm.serialNumber || !eqForm.purchaseCost) return;

    try {
      setSubmitting(true);
      setActionError(null);
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_EQUIPMENT',
          tenantId: currentTenant.id,
          ...eqForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddEquipmentModal(false);
        setEqForm({
          name: '',
          category: 'CARDIO',
          serialNumber: '',
          purchaseDate: new Date().toISOString().split('T')[0],
          purchaseCost: '',
          warrantyExpires: '',
          location: '',
          condition: 'GOOD',
        });
        fetchData();
      } else {
        setActionError(data.error || 'Failed to create equipment');
      }
    } catch (e: any) {
      setActionError(e.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.equipmentId || !ticketForm.title || !ticketForm.description) return;

    try {
      setSubmitting(true);
      setActionError(null);
      const res = await fetch('/api/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_TICKET',
          tenantId: currentTenant.id,
          reportedBy: currentUser?.name || 'Staff',
          ...ticketForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddTicketModal(false);
        setTicketForm({
          equipmentId: '',
          equipmentName: '',
          title: '',
          description: '',
          priority: 'MEDIUM',
          severity: 'ROUTINE_SERVICE',
          assigneeName: '',
          expectedCost: '',
        });
        fetchData();
      } else {
        setActionError(data.error || 'Failed to create ticket');
      }
    } catch (e: any) {
      setActionError(e.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    try {
      setSubmitting(true);
      setActionError(null);
      const res = await fetch('/api/equipment', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'RESOLVE_TICKET',
          id: resolvingTicket.id,
          tenantId: currentTenant.id,
          ...resolveForm,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResolvingTicket(null);
        setResolveForm({
          resolvedBy: currentUser?.name || 'Maintenance Staff',
          resolutionNotes: '',
          resolutionCost: '',
        });
        fetchData();
      } else {
        setActionError(data.error || 'Failed to resolve ticket');
      }
    } catch (e: any) {
      setActionError(e.message || 'Submission error');
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketModalForMachine = (eq: Equipment) => {
    setTicketForm({
      equipmentId: eq.id,
      equipmentName: eq.name,
      title: '',
      description: '',
      priority: 'HIGH',
      severity: 'MAJOR_MALFUNCTION',
      assigneeName: '',
      expectedCost: '',
    });
    setActionError(null);
    setShowAddTicketModal(true);
  };

  const getStatusBadge = (status: EquipmentStatus) => {
    switch (status) {
      case 'OPERATIONAL':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold';
      case 'UNDER_MAINTENANCE':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      case 'OUT_OF_SERVICE':
        return 'bg-rose-100 text-rose-800 border-rose-400 font-extrabold animate-pulse';
      case 'DECOMMISSIONED':
        return 'bg-slate-200 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getConditionBadge = (condition?: EquipmentCondition) => {
    switch (condition) {
      case 'EXCELLENT':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'GOOD':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FAIR':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'POOR':
        return 'bg-orange-100 text-orange-800 border-orange-300 font-bold';
      case 'CRITICAL':
        return 'bg-rose-600 text-white font-black';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-600 text-white font-black';
      case 'HIGH':
        return 'bg-orange-600 text-white font-bold';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-900 font-semibold';
      case 'LOW':
        return 'bg-slate-100 text-slate-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const getSeverityBadge = (severity?: TicketSeverity) => {
    switch (severity) {
      case 'CRITICAL_SAFETY_HAZARD':
        return 'bg-rose-600 text-white font-black';
      case 'MAJOR_MALFUNCTION':
        return 'bg-orange-500 text-white font-bold';
      case 'MINOR_DEFECT':
        return 'bg-amber-100 text-amber-800';
      case 'ROUTINE_SERVICE':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Critical hazard tickets currently open
  const criticalHazards = tickets.filter(
    (t) =>
      t.status !== 'RESOLVED' &&
      (t.severity === 'CRITICAL_SAFETY_HAZARD' || t.priority === 'URGENT')
  );

  const openTicketsCount = tickets.filter((t) => t.status !== 'RESOLVED').length;

  // Filtered Equipment List
  const filteredEquipment = equipmentList.filter((e) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      e.name.toLowerCase().includes(q) ||
      (e.serialNumber && e.serialNumber.toLowerCase().includes(q)) ||
      (e.location && e.location.toLowerCase().includes(q)) ||
      e.category.toLowerCase().includes(q) ||
      (e.condition && e.condition.toLowerCase().includes(q));

    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchesCondition = conditionFilter === 'ALL' || e.condition === conditionFilter;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;

    return matchesSearch && matchesCategory && matchesCondition && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
              <Wrench className="h-5 w-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Equipment Assets & Maintenance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Searchable asset catalog, condition monitoring, safety hazard locking, and maintenance service history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setTicketForm({
                equipmentId: equipmentList[0]?.id || '',
                equipmentName: equipmentList[0]?.name || '',
                title: '',
                description: '',
                priority: 'HIGH',
                severity: 'MAJOR_MALFUNCTION',
                assigneeName: '',
                expectedCost: '',
              });
              setActionError(null);
              setShowAddTicketModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-800 shadow-sm hover:bg-rose-100 transition-colors"
          >
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            <span className="hidden sm:inline">Report Defect / Hazard</span>
            <span className="sm:hidden">Report Defect</span>
          </button>

          <button
            onClick={() => {
              setActionError(null);
              setShowAddEquipmentModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 sm:px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Register Equipment</span>
            <span className="sm:hidden">Register</span>
          </button>
        </div>
      </div>

      {/* Critical Safety Hazard Alert Banner */}
      {criticalHazards.length > 0 && (
        <div className="rounded-2xl border-2 border-rose-400 bg-rose-50 p-4 shadow-sm animate-pulse">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600 text-white">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded bg-rose-600 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                  Operational Safety Hazard
                </span>
                <span className="text-xs font-bold text-rose-900">
                  {criticalHazards.length} Machine(s) Automatically Locked OUT_OF_SERVICE
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-1">
                To prevent member injury, unsafe equipment has been marked <strong>OUT_OF_SERVICE</strong> with condition <strong>CRITICAL</strong>. Operational alerts have been generated for staff and technicians.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {criticalHazards.map((h) => (
                  <span
                    key={h.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-bold text-rose-900 border border-rose-200 shadow-xs"
                  >
                    <span>{h.equipmentName}:</span>
                    <span className="font-normal">{h.title}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Registered Assets</span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">{equipmentList.length} Machines</h2>
          <p className="text-[11px] text-slate-500 mt-1">Cardio, strength towers, rowers & recovery assets</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Repair Tickets</span>
            {openTicketsCount > 0 && (
              <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-white">
                {openTicketsCount} Action Required
              </span>
            )}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-2">{openTicketsCount} Tickets</h2>
          <p className="text-[11px] text-slate-500 mt-1">Pending maintenance technician inspections</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Floor Operational Health</span>
          <h2 className="text-3xl font-extrabold text-emerald-700 mt-2">
            {equipmentList.length > 0
              ? `${Math.round(((equipmentList.length - openTicketsCount) / equipmentList.length) * 100)}%`
              : '100%'}
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">Equipment readiness for member workouts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('EQUIPMENT')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 ${
            activeTab === 'EQUIPMENT'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Asset Inventory Catalog ({equipmentList.length})
        </button>

        <button
          onClick={() => setActiveTab('TICKETS')}
          className={`pb-3 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
            activeTab === 'TICKETS'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Maintenance Tickets ({tickets.length})</span>
          {openTicketsCount > 0 && (
            <span className="rounded-full bg-slate-900 px-1.5 py-0.2 text-[10px] text-white">
              {openTicketsCount}
            </span>
          )}
        </button>
      </div>

      {/* Loading & Error States */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <RefreshCw className="h-8 w-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-xs font-semibold">Loading gym asset inventory & maintenance records...</p>
        </div>
      )}

      {fetchError && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-rose-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-rose-900">Failed to Load Equipment</h3>
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

      {/* TAB 1: Asset Catalog */}
      {!loading && !fetchError && activeTab === 'EQUIPMENT' && (
        <div className="space-y-4">
          {/* Search and Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative sm:col-span-2 md:col-span-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search machine, S/N, location, condition..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-600 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="CARDIO">Cardio Theater</option>
                <option value="STRENGTH">Strength Towers</option>
                <option value="FREE_WEIGHTS">Free Weights</option>
                <option value="RECOVERY">Recovery / Sauna</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <select
                value={conditionFilter}
                onChange={(e) => setConditionFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Conditions</option>
                <option value="EXCELLENT">Excellent</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
                <option value="POOR">Poor</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3 py-2 text-xs text-slate-700 focus:border-emerald-600 focus:bg-white focus:outline-none"
              >
                <option value="ALL">All Operational Statuses</option>
                <option value="OPERATIONAL">Operational</option>
                <option value="UNDER_MAINTENANCE">Under Maintenance</option>
                <option value="OUT_OF_SERVICE">Out of Service</option>
                <option value="DECOMMISSIONED">Decommissioned</option>
              </select>
            </div>
          </div>

          {/* Empty State */}
          {filteredEquipment.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Wrench className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-900">No Equipment Assets Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || categoryFilter !== 'ALL' || conditionFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'No machines matched your active filters. Try clearing search terms or selecting "All".'
                  : 'No gym equipment registered yet. Click "Register Equipment" above to add your first machine.'}
              </p>
              {(searchQuery || categoryFilter !== 'ALL' || conditionFilter !== 'ALL' || statusFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('ALL');
                    setConditionFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                  className="mt-4 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Asset Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map((eq) => (
              <div
                key={eq.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 ${
                  eq.status === 'OUT_OF_SERVICE'
                    ? 'border-rose-300 ring-2 ring-rose-200'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {eq.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {eq.condition && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${getConditionBadge(eq.condition)}`}>
                          {eq.condition}
                        </span>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusBadge(eq.status)}`}>
                        {eq.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 mt-2">{eq.name}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">SN: {eq.serialNumber}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-600 border-t border-slate-100 pt-2.5">
                    <div>
                      <span className="text-slate-500 block">Location:</span>
                      <span className="font-semibold text-slate-800 truncate block">{eq.location || 'Main Floor'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Purchase Cost:</span>
                      <span className="font-semibold text-slate-800 block">
                        {currentTenant.currencySymbol}{eq.purchaseCost.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Last Serviced:</span>
                      <span className="font-medium text-slate-800">
                        {eq.lastServicedAt ? new Date(eq.lastServicedAt).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Next Service Due:</span>
                      <span className="font-medium text-slate-800">
                        {eq.nextServiceDue ? new Date(eq.nextServiceDue).toLocaleDateString() : 'None Scheduled'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEquipmentForHistory(eq)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <History className="h-3.5 w-3.5 text-slate-500" />
                    <span>History ({eq.serviceHistory?.length || 0})</span>
                  </button>

                  <button
                    onClick={() => openTicketModalForMachine(eq)}
                    className="flex-1 flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Report Issue</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Maintenance Ticketing */}
      {!loading && !fetchError && activeTab === 'TICKETS' && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Equipment Repair & Maintenance Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">{tickets.length} total recorded maintenance tickets</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {tickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold text-slate-700">No maintenance tickets filed.</p>
                <p className="mt-0.5">All gym assets are currently inspected and operational.</p>
              </div>
            ) : (
              tickets.map((ticket) => (
                <div key={ticket.id} className="p-5 hover:bg-slate-50/70 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                        <Wrench className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded ${getPriorityBadge(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          {ticket.severity && (
                            <span className={`text-[10px] px-2 py-0.5 rounded ${getSeverityBadge(ticket.severity)}`}>
                              {ticket.severity.replace(/_/g, ' ')}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              ticket.status === 'RESOLVED'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-slate-900 text-white'
                            }`}
                          >
                            {ticket.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs font-bold text-slate-900">{ticket.equipmentName}</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">{ticket.title}</h4>
                        <p className="text-xs text-slate-600 mt-1 max-w-2xl">{ticket.description}</p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2">
                          <span>Reported by: <strong>{ticket.reportedBy}</strong></span>
                          <span>•</span>
                          <span>Reported on: {new Date(ticket.reportedAt).toLocaleDateString()}</span>
                          {ticket.assigneeName && (
                            <>
                              <span>•</span>
                              <span>Assigned to: <strong>{ticket.assigneeName}</strong></span>
                            </>
                          )}
                          {ticket.resolvedAt && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-semibold">
                                Resolved by: {ticket.resolvedBy} on {new Date(ticket.resolvedAt).toLocaleDateString()}
                              </span>
                            </>
                          )}
                          {ticket.resolutionCost !== undefined && ticket.resolutionCost > 0 && (
                            <>
                              <span>•</span>
                              <span>Cost: {currentTenant.currencySymbol}{ticket.resolutionCost.toFixed(2)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {ticket.status !== 'RESOLVED' && (
                      <button
                        onClick={() => {
                          setActionError(null);
                          setResolvingTicket(ticket);
                        }}
                        className="shrink-0 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors self-start sm:self-center"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Resolve Ticket</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Register Equipment */}
      {showAddEquipmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Register Gym Equipment Asset</h3>
              <button
                onClick={() => setShowAddEquipmentModal(false)}
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

            <form onSubmit={handleCreateEquipment} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipment Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LifeFitness Treadmill T5 or Precor Elliptical"
                  value={eqForm.name}
                  onChange={(e) => setEqForm({ ...eqForm, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category *</label>
                  <select
                    value={eqForm.category}
                    onChange={(e) => setEqForm({ ...eqForm, category: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="CARDIO">Cardio Theater</option>
                    <option value="STRENGTH">Strength Towers & Machines</option>
                    <option value="FREE_WEIGHTS">Free Weights & Barbells</option>
                    <option value="RECOVERY">Recovery / Sauna</option>
                    <option value="OTHER">Other Gym Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SN-88192-LF"
                    value={eqForm.serialNumber}
                    onChange={(e) => setEqForm({ ...eqForm, serialNumber: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Cost ({currentTenant.currencySymbol}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2500.00"
                    value={eqForm.purchaseCost}
                    onChange={(e) => setEqForm({ ...eqForm, purchaseCost: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Purchase Date *</label>
                  <input
                    type="date"
                    required
                    value={eqForm.purchaseDate}
                    onChange={(e) => setEqForm({ ...eqForm, purchaseDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Condition</label>
                  <select
                    value={eqForm.condition}
                    onChange={(e) => setEqForm({ ...eqForm, condition: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="EXCELLENT">Excellent (Brand New)</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Warranty Expiration</label>
                  <input
                    type="date"
                    value={eqForm.warrantyExpires}
                    onChange={(e) => setEqForm({ ...eqForm, warrantyExpires: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Floor Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Cardio Bay 3"
                    value={eqForm.location}
                    onChange={(e) => setEqForm({ ...eqForm, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEquipmentModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Report Damage Ticket with Urgent Safety Severity */}
      {showAddTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">Submit Equipment Maintenance Ticket</h3>
              </div>
              <button
                onClick={() => setShowAddTicketModal(false)}
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

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Gym Equipment *</label>
                <select
                  value={ticketForm.equipmentId}
                  onChange={(e) => {
                    const found = equipmentList.find((eq) => eq.id === e.target.value);
                    setTicketForm({
                      ...ticketForm,
                      equipmentId: e.target.value,
                      equipmentName: found ? found.name : '',
                    });
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                >
                  {equipmentList.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.serialNumber}) - {eq.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Issue Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken cable snap / frayed belt / overheating motor"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Classification *</label>
                  <select
                    value={ticketForm.severity}
                    onChange={(e) => {
                      const sev = e.target.value as TicketSeverity;
                      setTicketForm({
                        ...ticketForm,
                        severity: sev,
                        priority: sev === 'CRITICAL_SAFETY_HAZARD' ? 'URGENT' : ticketForm.priority,
                      });
                    }}
                    className={`w-full rounded-xl border px-3 py-2 text-slate-900 focus:outline-none ${
                      ticketForm.severity === 'CRITICAL_SAFETY_HAZARD'
                        ? 'border-rose-500 bg-rose-50 font-bold text-rose-900'
                        : 'border-slate-300 bg-white'
                    }`}
                  >
                    <option value="CRITICAL_SAFETY_HAZARD">Critical Safety Hazard (Immediate Lockout)</option>
                    <option value="MAJOR_MALFUNCTION">Major Malfunction</option>
                    <option value="MINOR_DEFECT">Minor Defect</option>
                    <option value="ROUTINE_SERVICE">Routine Service / Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Operational Priority *</label>
                  <select
                    value={ticketForm.priority}
                    onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value as any })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              {ticketForm.severity === 'CRITICAL_SAFETY_HAZARD' && (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-rose-900">
                  <p className="font-bold flex items-center gap-1">
                    <ShieldAlert className="h-4 w-4 text-rose-600" />
                    Automatic Asset Lockout Warning:
                  </p>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Submitting this ticket will immediately mark this machine as <strong>OUT_OF_SERVICE</strong> with condition <strong>CRITICAL</strong> and raise an emergency operational alert across reception and management boards.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Detailed Defect Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe observed physical failure, noises, safety concerns, or member reports..."
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assign Technician (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Dave Tech or Service Vendor"
                    value={ticketForm.assigneeName}
                    onChange={(e) => setTicketForm({ ...ticketForm, assigneeName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Estimated Cost ({currentTenant.currencySymbol})</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150.00"
                    value={ticketForm.expectedCost}
                    onChange={(e) => setTicketForm({ ...ticketForm, expectedCost: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddTicketModal(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'File Ticket & Flag Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Service History Modal */}
      {selectedEquipmentForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Service & Maintenance History: {selectedEquipmentForHistory.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Serial Number: {selectedEquipmentForHistory.serialNumber} | Location: {selectedEquipmentForHistory.location || 'Main Floor'}
                </p>
              </div>
              <button
                onClick={() => setSelectedEquipmentForHistory(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 max-h-96 overflow-y-auto space-y-3">
              {!selectedEquipmentForHistory.serviceHistory || selectedEquipmentForHistory.serviceHistory.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">No service history records found.</p>
                  <p className="mt-0.5">Service logs are created automatically when maintenance tickets are resolved.</p>
                </div>
              ) : (
                selectedEquipmentForHistory.serviceHistory.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{item.action}</span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">{item.notes}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      <span>Technician: <strong>{item.technician}</strong></span>
                      {item.cost !== undefined && item.cost > 0 && (
                        <span className="font-semibold text-slate-800">
                          Cost: {currentTenant.currencySymbol}{item.cost.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-6 flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedEquipmentForHistory(null)}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Resolve Ticket */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Resolve Equipment Repair</h3>
                <p className="text-xs text-slate-500 mt-0.5">{resolvingTicket.equipmentName}</p>
              </div>
              <button
                onClick={() => setResolvingTicket(null)}
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

            <form onSubmit={handleResolveTicket} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Technician / Inspector Name *</label>
                <input
                  type="text"
                  required
                  value={resolveForm.resolvedBy}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolvedBy: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resolution & Repair Actions *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Replaced roller bearing, recalibrated tension to 80 lbs, full safety check passed."
                  value={resolveForm.resolutionNotes}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionNotes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Repair Cost / Parts Expense ({currentTenant.currencySymbol})</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00 (optional - logged to expense ledger)"
                  value={resolveForm.resolutionCost}
                  onChange={(e) => setResolveForm({ ...resolveForm, resolutionCost: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-emerald-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Resolving this ticket updates the asset's service history, restores condition to GOOD, and marks the machine OPERATIONAL.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Mark Resolved & Restore Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
