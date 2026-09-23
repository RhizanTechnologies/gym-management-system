'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Member, Tenant } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  X,
  Printer,
  Download,
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Dumbbell,
  AlertTriangle,
  AlertOctagon,
  RefreshCw,
  MessageCircle,
} from 'lucide-react';
import { getRenewalReminderUrl, getDebtReminderUrl, getWelcomePassUrl } from '@/lib/whatsapp';

interface MemberCardModalProps {
  member: Member;
  tenant: Tenant;
  onClose: () => void;
  onRenew?: (member: Member) => void;
  onMemberUpdated?: (updated: Member) => void;
}

export function MemberCardModal({ member, tenant, onClose, onRenew, onMemberUpdated }: MemberCardModalProps) {
  const [currentMember, setCurrentMember] = useState<Member>(member);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isUpdatingQR, setIsUpdatingQR] = useState(false);
  const [qrMessage, setQrMessage] = useState<string | null>(null);

  useEffect(() => {
    setCurrentMember(member);
  }, [member]);

  useEffect(() => {
    if (!currentMember.qrCodeToken) return;
    QRCode.toDataURL(currentMember.qrCodeToken, {
      width: 260,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then(setQrDataUrl)
      .catch((err) => console.error('QR code generation failed', err));
  }, [currentMember.qrCodeToken]);

  const handleRegenerateQR = async () => {
    if (isUpdatingQR) return;
    setIsUpdatingQR(true);
    setQrMessage(null);
    try {
      const res = await fetch('/api/members/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          memberId: currentMember.id,
          action: 'REGENERATE',
        }),
      });
      const data = await res.json();
      if (res.ok && data.member) {
        setCurrentMember(data.member);
        setQrMessage('New QR credential issued. Prior pass revoked.');
        if (onMemberUpdated) onMemberUpdated(data.member);
      } else {
        alert(data.error || 'Failed to regenerate QR credential.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setIsUpdatingQR(false);
    }
  };

  const handleRevokeQR = async () => {
    if (isUpdatingQR) return;
    if (!confirm('Are you sure you want to revoke this digital QR pass? Member check-in will be denied.')) return;
    setIsUpdatingQR(true);
    setQrMessage(null);
    try {
      const res = await fetch('/api/members/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          memberId: currentMember.id,
          action: 'REVOKE',
        }),
      });
      const data = await res.json();
      if (res.ok && data.member) {
        setCurrentMember(data.member);
        setQrMessage('Credential revoked immediately.');
        if (onMemberUpdated) onMemberUpdated(data.member);
      } else {
        alert(data.error || 'Failed to revoke QR credential.');
      }
    } catch {
      alert('Error connecting to server.');
    } finally {
      setIsUpdatingQR(false);
    }
  };

  const isExpired = currentMember.status === 'EXPIRED' || (currentMember.daysRemaining !== undefined && currentMember.daysRemaining < 0);
  const isExpiringSoon = currentMember.status === 'EXPIRING_SOON';
  const isSuspended = currentMember.status === 'SUSPENDED';
  const isRevoked = currentMember.qrCodeRevoked === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100/90 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Decorative Banner */}
        <div className="relative bg-emerald-600 px-6 pt-6 pb-12 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{tenant.logo || '🏋️'}</span>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">{tenant.name}</h3>
                <p className="text-[11px] text-emerald-100 uppercase tracking-wider font-semibold">Official Member Pass</p>
              </div>
            </div>
            <div className="rounded-full bg-white/20 px-2.5 py-1 text-[10px] font-black uppercase backdrop-blur-sm">
              {currentMember.memberNumber}
            </div>
          </div>
        </div>

        {/* Card Body with Overlapping Profile Avatar */}
        <div className="relative -mt-8 px-6 pb-6 bg-white">
          <div className="flex items-end justify-between">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 font-extrabold text-2xl text-slate-800 shadow-md overflow-hidden">
              {currentMember.profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentMember.profileImage} alt={currentMember.firstName} className="h-full w-full object-cover" />
              ) : (
                <span>{currentMember.firstName.charAt(0)}{currentMember.lastName.charAt(0)}</span>
              )}
            </div>

            {/* Status Badges */}
            <div className="flex flex-col items-end gap-1">
              {isRevoked ? (
                <span className="flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-300">
                  <AlertOctagon className="h-3 w-3" /> CREDENTIAL REVOKED
                </span>
              ) : isSuspended ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-300">
                  <AlertOctagon className="h-3 w-3" /> SUSPENDED
                </span>
              ) : isExpired ? (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700 border border-red-200">
                  <AlertTriangle className="h-3 w-3" /> EXPIRED
                </span>
              ) : isExpiringSoon ? (
                <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
                  <AlertTriangle className="h-3 w-3" /> Dues Soon ({currentMember.daysRemaining}d)
                </span>
              ) : (
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3 w-3" /> ACTIVE PASS
                </span>
              )}
            </div>
          </div>

          {/* Member Name and Details */}
          <div className="mt-3">
            <h2 className="text-xl font-extrabold text-slate-900">
              {currentMember.firstName} {currentMember.lastName}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{currentMember.phone} • {currentMember.email || 'No email'}</p>
          </div>

          {/* QR Feedback Alert */}
          {qrMessage && (
            <div className="mt-3 rounded-xl bg-emerald-50 border border-emerald-200 p-2 text-center text-xs font-bold text-emerald-800">
              {qrMessage}
            </div>
          )}

          {/* QR Code Container */}
          <div className="mt-4 flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-inner">
            <div className={`rounded-xl bg-white p-3 border shadow-sm relative ${isRevoked ? 'opacity-40 border-rose-300' : 'border-slate-200'}`}>
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Member QR Pass" className="h-40 w-40 object-contain" />
              ) : (
                <div className="h-40 w-40 flex items-center justify-center text-slate-400 text-xs font-medium">
                  Generating QR Code...
                </div>
              )}
              {isRevoked && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <span className="rounded bg-rose-600 px-3 py-1 text-xs font-black text-white tracking-widest uppercase rotate-[-12deg] shadow">
                    REVOKED
                  </span>
                </div>
              )}
            </div>
            <p className="mt-2 text-center font-mono text-[11px] font-bold text-slate-700 tracking-wider">
              {currentMember.qrCodeToken}
            </p>
            <p className="text-[10px] text-slate-500">Scan at gym turnstile / front desk kiosk</p>

            {/* Staff QR Credential Management Controls */}
            <div className="mt-3 flex items-center gap-2 w-full pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={handleRegenerateQR}
                disabled={isUpdatingQR}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                title="Invalidate old token and issue fresh QR credential"
              >
                <RefreshCw className={`h-3 w-3 text-emerald-600 ${isUpdatingQR ? 'animate-spin' : ''}`} />
                <span>Regenerate QR</span>
              </button>

              {!isRevoked ? (
                <button
                  type="button"
                  onClick={handleRevokeQR}
                  disabled={isUpdatingQR}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                  title="Immediately revoke credential"
                >
                  <ShieldAlert className="h-3 w-3 text-rose-600" />
                  <span>Revoke Pass</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleRegenerateQR}
                  disabled={isUpdatingQR}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  title="Issue new active pass"
                >
                  <ShieldCheck className="h-3 w-3" />
                  <span>Re-Issue Active Pass</span>
                </button>
              )}
            </div>
          </div>

          {/* Plan & Locker Info Grid */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-500">Plan Tier</span>
              <p className="font-extrabold text-slate-900 truncate">{member.currentPlanName || 'Standard'}</p>
              <p className="text-[10px] text-slate-500">Valid to: {formatDate(member.subscriptionEnd)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-[10px] font-bold uppercase text-slate-500">Assigned Locker</span>
              <p className="font-extrabold text-emerald-700">{member.assignedLockerNumber || 'None Assigned'}</p>
              <p className="text-[10px] text-slate-500">
                {member.dueBalance > 0 ? `Unpaid: $${member.dueBalance}` : 'Balance: $0.00'}
              </p>
            </div>
          </div>

          {/* WhatsApp Direct Action Bar */}
          <div className="mt-4 space-y-2">
            {isExpired || isExpiringSoon ? (
              <a
                href={getRenewalReminderUrl(member, tenant)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-emerald-50 border border-emerald-200 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                <span>Send WhatsApp Renewal Reminder</span>
              </a>
            ) : null}

            {member.dueBalance > 0 ? (
              <a
                href={getDebtReminderUrl(member, tenant)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-amber-50 border border-amber-200 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-all"
              >
                <MessageCircle className="h-4 w-4 text-amber-600" />
                <span>Send WhatsApp Due Balance Alert</span>
              </a>
            ) : null}

            <a
              href={getWelcomePassUrl(member, tenant, typeof window !== 'undefined' ? window.location.origin : '')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all"
            >
              <MessageCircle className="h-4 w-4 text-emerald-600" />
              <span>Send Digital Pass via WhatsApp</span>
            </a>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 transition-all shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Pass</span>
            </button>

            {onRenew && isExpired && (
              <button
                onClick={() => onRenew(member)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 transition-all shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Renew Plan</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
