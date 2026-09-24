'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Member, CheckInLog } from '@/lib/types';
import { formatDate, formatTime } from '@/lib/utils';
import {
  Smartphone,
  QrCode,
  Flame,
  ShieldCheck,
  KeyRound,
  Calendar,
  Clock,
  Sparkles,
  Download,
  AlertTriangle,
} from 'lucide-react';

export default function MemberPortalPage() {
  const { currentTenant, currentUser } = useAuth();
  const { t, isAmharic } = useLanguage();
  const [member, setMember] = useState<Member | null>(null);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [logs, setLogs] = useState<CheckInLog[]>([]);
  const [isOffline, setIsOffline] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const promptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', promptHandler);
    return () => window.removeEventListener('beforeinstallprompt', promptHandler);
  }, []);

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const res = await fetch(`/api/members?tenantId=${currentTenant.id}`);
        if (res.ok) {
          const data = await res.json();
          const currentMem =
            (currentUser
              ? data.members?.find(
                  (m: Member) =>
                    (currentUser.email && m.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
                    m.id === currentUser.id ||
                    `user-${m.id}` === currentUser.id ||
                    (currentUser.phone && m.phone === currentUser.phone)
                )
              : null) ||
            data.members?.[0] ||
            null;
          setMember(currentMem);

          if (currentMem?.qrCodeToken) {
            const url = await QRCode.toDataURL(currentMem.qrCodeToken, {
              width: 280,
              margin: 2,
              color: { dark: '#0f172a', light: '#ffffff' },
            });
            setQrUrl(url);

            // Cache in localStorage for offline turnstile check-in
            if (typeof window !== 'undefined') {
              localStorage.setItem(`gymos_pass_${currentTenant.id}`, JSON.stringify(currentMem));
              localStorage.setItem(`gymos_qr_${currentTenant.id}`, url);
            }
          }
        }

        const resCheckins = await fetch(`/api/checkin?tenantId=${currentTenant.id}`);
        if (resCheckins.ok) {
          const data = await resCheckins.json();
          setLogs(data.checkIns?.slice(0, 5) || []);
        }
      } catch (e) {
        console.warn('Network offline, restoring cached pass...', e);
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem(`gymos_pass_${currentTenant.id}`);
          const cachedQr = localStorage.getItem(`gymos_qr_${currentTenant.id}`);
          if (cached) {
            setMember(JSON.parse(cached));
            setIsOffline(true);
          }
          if (cachedQr) setQrUrl(cachedQr);
        }
      }
    };

    fetchMemberData();
  }, [currentTenant.id]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
    } else {
      alert('To install on phone: Tap browser Share/Options menu > "Add to Home Screen"');
    }
  };

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm text-slate-400">Loading Member Digital Pass...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-5 pb-16">
      {/* Top Bar with Language Toggle & PWA Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-bold text-slate-700">
            {isAmharic ? 'ኤም ፊትነስ እና ጂም (ፊጋ)' : 'M Fitness & Gym (Figa)'}
          </span>
        </div>
        <LanguageToggle />
      </div>

      {/* PWA Install & Offline Status Banner */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-xs">
            PWA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold text-slate-900">
                {isAmharic ? 'የኤም ፊትነስ ዲጂታል ፓስ ይጫኑ' : `Install ${currentTenant.name} Pass`}
              </p>
              {isOffline && (
                <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                  {t.offlinePass}
                </span>
              )}
            </div>
            <p className="text-[10px] text-emerald-700">
              {isAmharic ? 'በስልክዎ ላይ በቀጥታ ተቀምጧል • ያለ ኢንተርኔት ይሰራል' : 'Instant offline pass saved on phone homescreen'}
            </p>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          className="rounded-lg bg-emerald-600 px-3 py-1 text-[11px] font-extrabold text-white hover:bg-emerald-500 transition-colors shadow-sm"
        >
          {deferredPrompt ? (isAmharic ? 'ጫን' : 'Add to Home') : (isAmharic ? 'ጫን' : 'Install')}
        </button>
      </div>

      {/* Digital Membership Pass Card */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
        {/* Pass Top Ribbon */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl">🏋️‍♂️</span>
              <div>
                <h3 className="font-extrabold text-base tracking-tight">M Fitness and Gym</h3>
                <p className="text-[11px] font-medium text-emerald-100">
                  {isAmharic ? 'ፊጋ፣ አዲስ አበባ • 0961889867' : 'Figa, Addis Ababa • 0961889867'}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-black uppercase backdrop-blur-sm border border-white/30">
              {member.memberNumber}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 bg-white">
          {/* Member Name & Expiry Countdown */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                {member.firstName} {member.lastName}
              </h2>
              <p className="text-xs text-slate-500 font-semibold">{member.currentPlanName}</p>
            </div>
            <div className="text-right">
              {member.status === 'ACTIVE' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 sm:px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>{isAmharic ? 'ንቁ (ACTIVE)' : 'ACTIVE'}</span>
                </span>
              ) : member.status === 'EXPIRED' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 sm:px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{isAmharic ? 'ጊዜው ያለቀበት (EXPIRED)' : 'EXPIRED'}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 sm:px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200">
                  <span>{member.status}</span>
                </span>
              )}
              <p className="text-[11px] font-bold text-emerald-800 mt-1">
                {isAmharic
                  ? `የቀሩት ቀናት: ${member.daysRemaining ?? 0} ቀን`
                  : `${member.daysRemaining ?? 0} days remaining`}
              </p>
            </div>
          </div>

          {/* High-Contrast QR Code for Front Desk Scanner */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5 shadow-inner">
            <div className="rounded-2xl bg-white p-2.5 sm:p-3.5 border-2 border-slate-300 shadow-md">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="QR Member Pass" className="h-48 w-48 sm:h-56 sm:w-56 object-contain" />
              ) : (
                <div className="h-56 w-56 flex items-center justify-center text-xs text-slate-400">
                  Generating Pass...
                </div>
              )}
            </div>
            <p className="mt-3 text-sm font-mono font-black text-slate-900 tracking-wider">
              {member.qrCodeToken}
            </p>
            <p className="text-xs font-bold text-emerald-700 mt-1 text-center">
              {isAmharic
                ? 'ይህንን QR ኮድ በኤም ፊትነስ ካውንተር ስካነር ላይ ያሳዩ'
                : 'Show this QR code at M Fitness front desk'}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {isAmharic
                ? 'በስልክዎ ወይም በታተመ ወረቀት ላይ ይቃኛል • 1 ቀን ይቀነሳል'
                : 'Scannable on phone screen or printed card • Deducts 1 day'}
            </p>
          </div>

          {/* Member Quick Stats */}
          <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <Flame className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500 uppercase font-bold">{t.streak}</p>
              <p className="font-extrabold text-slate-900">{isAmharic ? '12 ቀናት' : '12 Days'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <KeyRound className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500 uppercase font-bold">{t.lockerNumber}</p>
              <p className="font-extrabold text-emerald-700">{member.assignedLockerNumber || 'None'}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
              <Calendar className="h-4 w-4 text-emerald-600 mx-auto mb-1" />
              <p className="text-[10px] text-slate-500 uppercase font-bold">{t.expires}</p>
              <p className="font-extrabold text-slate-900 text-[11px] truncate">{formatDate(member.subscriptionEnd)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-600" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Recent Gym Check-Ins
          </h3>
        </div>

        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs"
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                <span className="font-medium text-slate-900">{formatDate(log.timestamp)}</span>
              </div>
              <span className="font-mono text-slate-500">{formatTime(log.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
