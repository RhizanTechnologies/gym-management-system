'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { NotificationLog, NotificationSettings, NotificationStatus, Branch } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Bell,
  Send,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Settings,
  Building2,
  Filter,
  ShieldAlert,
  UserX,
  Phone,
  Mail,
  Smartphone,
  Save,
} from 'lucide-react';

export default function NotificationsPage() {
  const { currentTenant, currentUser } = useAuth();

  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    failed: 0,
    optedOut: 0,
    pending: 0,
  });

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Settings editing state
  const [noticeDays, setNoticeDays] = useState<string>('7, 3, 1');
  const [enableSms, setEnableSms] = useState<boolean>(true);
  const [enableEmail, setEnableEmail] = useState<boolean>(true);
  const [enableInApp, setEnableInApp] = useState<boolean>(true);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);

  // Load branches
  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await fetch(`/api/branches?tenantId=${currentTenant.id}`);
        if (res.ok) {
          const data = await res.json();
          setBranches(data.branches || []);
        }
      } catch (e) {
        console.error('Failed to load branches:', e);
      }
    }
    loadBranches();
  }, [currentTenant.id]);

  // Load notifications
  const fetchNotifications = async () => {
    try {
      const params = new URLSearchParams({
        tenantId: currentTenant.id,
      });
      if (selectedBranchId !== 'ALL') params.set('branchId', selectedBranchId);
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/notifications?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setSettings(data.settings);
        setStats(data.stats);

        if (data.settings?.renewalNoticeDaysBefore) {
          setNoticeDays(data.settings.renewalNoticeDaysBefore.join(', '));
        }
        if (data.settings) {
          setEnableSms(data.settings.enableSms ?? true);
          setEnableEmail(data.settings.enableEmail ?? true);
          setEnableInApp(data.settings.enableInApp ?? true);
        }
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [currentTenant.id, selectedBranchId, statusFilter]);

  // Manual Dispatch Trigger
  const handleDispatch = async (previewOnly = false) => {
    setIsDispatching(true);
    setDispatchResult(null);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-role': currentUser?.role || '',
          'x-tenant-id': currentTenant.id,
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          action: 'DISPATCH',
          branchId: selectedBranchId !== 'ALL' ? selectedBranchId : undefined,
          previewOnly,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setDispatchResult(data);
        if (!previewOnly) {
          fetchNotifications();
        }
      }
    } catch (e) {
      console.error('Dispatch failed:', e);
    } finally {
      setIsDispatching(false);
    }
  };

  // Controlled Retry Action
  const handleRetry = async (notificationId: string) => {
    setRetryingId(notificationId);
    setRetryError(null);
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-role': currentUser?.role || '',
          'x-tenant-id': currentTenant.id,
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          action: 'RETRY',
          notificationId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setRetryError(data.error || 'Retry failed.');
      } else {
        fetchNotifications();
      }
    } catch (err: any) {
      setRetryError(err.message || 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsSavedMessage(null);
    try {
      const days = noticeDays
        .split(',')
        .map((d) => parseInt(d.trim(), 10))
        .filter((d) => !isNaN(d));

      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser?.id || '',
          'x-user-role': currentUser?.role || '',
          'x-tenant-id': currentTenant.id,
        },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          settings: {
            renewalNoticeDaysBefore: days.length > 0 ? days : [7, 3, 1],
            enableSms,
            enableEmail,
            enableInApp,
          },
        }),
      });

      if (res.ok) {
        setSettingsSavedMessage('Notification settings updated successfully.');
        setTimeout(() => setSettingsSavedMessage(null), 3000);
        fetchNotifications();
      }
    } catch (e) {
      console.error('Failed to update settings:', e);
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Automated Notifications & Renewal Notices
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                Consent-Gated • Max 3 Retries
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Configured timing notices with strict opt-out consent compliance and controlled retry bounds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Branch Filter */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2">
              <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <select
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Branches</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Run Dispatch Button */}
            <button
              onClick={() => handleDispatch(false)}
              disabled={isDispatching}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isDispatching ? 'Dispatching...' : 'Dispatch Notices Now'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Sent Successfully</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.sent}</div>
          <div className="text-[11px] text-emerald-600 mt-1">Delivered to member</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Failed Notices</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.failed}</div>
          <div className="text-[11px] text-rose-500 mt-1">Retry available (max 3)</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Opted-Out</span>
            <UserX className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.optedOut}</div>
          <div className="text-[11px] text-amber-600 mt-1">Consent respected (never sent)</div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Logged</span>
            <Bell className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Audit log records</div>
        </div>
      </div>

      {/* Dispatch Feedback Alert */}
      {dispatchResult && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-emerald-900 dark:text-emerald-300">Dispatch Complete: </span>
              <span className="text-emerald-800 dark:text-emerald-400">
                {dispatchResult.dispatchedCount} notices sent, {dispatchResult.optedOutCount} opted-out recipients skipped, {dispatchResult.failedCount} failed.
              </span>
            </div>
          </div>
          <button onClick={() => setDispatchResult(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {retryError && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            <span>{retryError}</span>
          </div>
          <button onClick={() => setRetryError(null)} className="text-rose-700 font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Settings & Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Notification Settings Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Notice Schedule & Rules</h2>
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Renewal Timing (Days Before Expiry)
              </label>
              <input
                type="text"
                value={noticeDays}
                onChange={(e) => setNoticeDays(e.target.value)}
                placeholder="7, 3, 1"
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Comma-separated days (e.g. 7, 3, 1 days before expiration)
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Communication Channels
              </span>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableSms}
                  onChange={(e) => setEnableSms(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>SMS Delivery (Ethio Telecom SMPP)</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableEmail}
                  onChange={(e) => setEnableEmail(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Mail className="w-3.5 h-3.5 text-blue-500" />
                <span>Email Notifications</span>
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableInApp}
                  onChange={(e) => setEnableInApp(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <Smartphone className="w-3.5 h-3.5 text-purple-500" />
                <span>In-App Mobile Notices</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <div>Max Retry Bounds: <strong>3 attempts</strong></div>
                <div>Consent Policy: <strong>Opt-out strictly enforced</strong></div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 text-xs font-bold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-xl hover:bg-slate-800 transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingSettings ? 'Saving...' : 'Save Configuration'}</span>
            </button>

            {settingsSavedMessage && (
              <div className="text-xs text-emerald-600 text-center font-medium">
                {settingsSavedMessage}
              </div>
            )}
          </form>
        </div>

        {/* Notifications Activity Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Notification History</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Itemized audit trail of automated communications and failure diagnostics
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent</option>
                <option value="FAILED">Failed</option>
                <option value="OPTED_OUT">Opted Out</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Recipient</th>
                  <th className="px-3 py-2.5">Type & Channel</th>
                  <th className="px-3 py-2.5">Status & Diagnostics</th>
                  <th className="px-3 py-2.5">Time</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      No notification records found matching filters.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const isMaxRetries = log.retryCount >= log.maxRetries;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-3 py-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {log.memberName || log.recipientName || 'Member'}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono">{log.recipientContact}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-medium">{log.type.replace(/_/g, ' ')}</div>
                          <div className="text-[11px] text-slate-400">{log.channel}</div>
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                log.status === 'SENT'
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                  : log.status === 'FAILED'
                                  ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                              }`}
                            >
                              {log.status}
                            </span>
                            {log.status === 'FAILED' && (
                              <span className="text-[11px] text-slate-500">
                                ({log.retryCount}/{log.maxRetries} retries)
                              </span>
                            )}
                          </div>
                          {log.failureReason && (
                            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-0.5 truncate max-w-xs">
                              {log.failureReason}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 text-[11px] text-slate-500">
                          {log.sentAt ? formatDate(log.sentAt) : formatDate(log.createdAt)}
                        </td>

                        <td className="px-3 py-3 text-right">
                          {log.status === 'FAILED' && (
                            <button
                              onClick={() => handleRetry(log.id)}
                              disabled={isMaxRetries || retryingId === log.id}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition inline-flex items-center gap-1 ${
                                isMaxRetries
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                  : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-800'
                              }`}
                              title={isMaxRetries ? 'Maximum retry attempts reached (3)' : 'Retry sending notification'}
                            >
                              <RotateCw className={`w-3 h-3 ${retryingId === log.id ? 'animate-spin' : ''}`} />
                              <span>{isMaxRetries ? 'Limit Reached' : 'Retry'}</span>
                            </button>
                          )}
                          {log.status === 'OPTED_OUT' && (
                            <span className="text-[11px] text-amber-600 font-medium">Consent Blocked</span>
                          )}
                          {log.status === 'SENT' && (
                            <span className="text-[11px] text-emerald-600 font-medium">Delivered</span>
                          )}
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
    </div>
  );
}
