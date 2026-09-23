'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, AlertTriangle, PackageX, DollarSign, Clock, ChevronRight } from 'lucide-react';
import { OperationalAlert } from '@/lib/types';

export function OperationalAlertsDropdown({ tenantId }: { tenantId: string }) {
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/equipment?tenantId=${tenantId}&type=alerts`);
      if (res.ok) {
        const data = await res.json();
        if (data.alerts) setAlerts(data.alerts);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, [tenantId]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const urgentCount = alerts.filter((a) => a.severity === 'HIGH').length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition-colors shadow-sm"
        title="Operational Alerts & Actions"
      >
        <Bell className="h-4 w-4" />
        {alerts.length > 0 && (
          <span
            className={`absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white shadow-sm ${
              urgentCount > 0 ? 'bg-emerald-600 animate-pulse' : 'bg-slate-700'
            }`}
          >
            {alerts.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50 text-slate-900">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-600 animate-ping" />
              <h3 className="text-sm font-bold text-slate-900">Operational Alerts</h3>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
              {alerts.length} active
            </span>
          </div>

          <div className="mt-3 max-h-72 overflow-y-auto space-y-2">
            {loading && alerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">Refreshing live alerts...</div>
            ) : alerts.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                All operational systems normal. No equipment repairs or stock alerts.
              </div>
            ) : (
              alerts.map((alert) => (
                <Link
                  key={alert.id}
                  href={alert.link}
                  onClick={() => setIsOpen(false)}
                  className="group block rounded-xl border border-slate-100 p-3 hover:bg-slate-50 hover:border-slate-200 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      {alert.type === 'MAINTENANCE' && <AlertTriangle className="h-3.5 w-3.5" />}
                      {alert.type === 'LOW_STOCK' && <PackageX className="h-3.5 w-3.5" />}
                      {alert.type === 'OVERDUE_DEBT' && <DollarSign className="h-3.5 w-3.5" />}
                      {alert.type === 'EXPIRING_MEMBERS' && <Clock className="h-3.5 w-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{alert.title}</p>
                        {alert.severity === 'HIGH' && (
                          <span className="shrink-0 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold px-1.5 py-0.2">
                            ACTION
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">{alert.message}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 self-center" />
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Auto-synced turnstile & sensors</span>
            <button
              onClick={() => {
                fetchAlerts();
              }}
              className="font-bold text-emerald-600 hover:text-emerald-700"
            >
              Refresh Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
