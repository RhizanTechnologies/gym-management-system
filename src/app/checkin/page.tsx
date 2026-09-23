'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Member, CheckInLog, CheckInStatus } from '@/lib/types';
import { sounds } from '@/lib/audio';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { MemberCardModal } from '@/components/MemberCardModal';
import {
  QrCode,
  Search,
  Camera,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Users,
  Sparkles,
  KeyRound,
  DollarSign,
  RefreshCw,
  Maximize2,
  Minimize2,
  MessageCircle,
  Cake,
  AlertOctagon,
  Ban,
  Snowflake,
  Building2,
  RotateCcw,
  ShieldAlert,
  Clock,
  Unlock,
  UserCheck,
  UserX,
  SwitchCamera,
  Video,
  VideoOff,
  PhoneCall,
  Upload,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { getRenewalReminderUrl, getDebtReminderUrl } from '@/lib/whatsapp';
import { decodeQrFromImage } from '@/lib/qr-scanner-helper';

export default function CheckInKioskPage() {
  const { currentTenant } = useAuth();
  const { t, isAmharic } = useLanguage();
  const [identifier, setIdentifier] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCheckInResult, setLastCheckInResult] = useState<{
    success: boolean;
    status: CheckInStatus;
    member?: Member;
    message: string;
    log: CheckInLog;
    dayDeducted?: boolean;
    previousDaysRemaining?: number;
    newDaysRemaining?: number;
  } | null>(null);

  const [checkInLogs, setCheckInLogs] = useState<CheckInLog[]>([]);
  const [occupancy, setOccupancy] = useState({ current: 0, max: 80, percentage: 0 });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const html5QrCodeRef = useRef<any>(null);
  const lastScanTimestampRef = useRef<number>(0);
  const [selectedMemberForModal, setSelectedMemberForModal] = useState<Member | null>(null);
  const [isFullscreenKiosk, setIsFullscreenKiosk] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isPhotoScanning, setIsPhotoScanning] = useState(false);

  // Manual search fallback state (for camera/scanner failure)
  const [showManualLookup, setShowManualLookup] = useState(false);
  const [manualQuery, setManualQuery] = useState('');
  const [manualResults, setManualResults] = useState<Member[]>([]);
  const [isSearchingManual, setIsSearchingManual] = useState(false);

  const isBirthdayToday = (dob?: string) => {
    if (!dob) return false;
    const birth = new Date(dob);
    const today = new Date();
    return birth.getMonth() === today.getMonth() && birth.getDate() === today.getDate();
  };

  const fetchCheckIns = async () => {
    try {
      const res = await fetch(`/api/checkin?tenantId=${currentTenant.id}`);
      if (res.ok) {
        const data = await res.json();
        setCheckInLogs(data.checkIns || []);
        if (data.occupancy) setOccupancy(data.occupancy);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCheckIns();
    const interval = setInterval(fetchCheckIns, 5000);
    return () => clearInterval(interval);
  }, [currentTenant.id]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    try {
      setCameraLoading(true);
      setCameraError(null);
      setIsCameraActive(true);

      const isSecure = typeof window !== 'undefined' && (
        window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );
      const hasMediaDevices = typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia;

      if (!isSecure && !hasMediaDevices) {
        setIsCameraActive(false);
        setCameraLoading(false);
        setCameraError(
          isAmharic
            ? '⚠️ የሞባይል ብሮውዘሮች በኔትወርክ (HTTP) የቀጥታ ቪዲዮ ይከለክላሉ። እባክዎ "በስልክ ካሜራ ፎቶ አንስተው ይቃኙ" የሚለውን አዝራር ይጠቀሙ — በስልክዎ ካሜራ በቀጥታ ይሰራል!'
            : '⚠️ Mobile browsers block live video streams on unencrypted HTTP over local Wi-Fi. Please tap "Snap Photo with Phone" below to use your phone camera!'
        );
        return;
      }

      const { Html5Qrcode } = await import('html5-qrcode');

      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
          html5QrCodeRef.current.clear();
        } catch (e) {
          console.warn('Camera stop error:', e);
        }
      }

      let container = document.getElementById('html5qr-code-reader');
      if (!container) {
        await new Promise((resolve) => setTimeout(resolve, 80));
        container = document.getElementById('html5qr-code-reader');
      }

      if (!container) {
        setCameraLoading(false);
        setIsCameraActive(false);
        return;
      }

      const qrScanner = new Html5Qrcode('html5qr-code-reader');
      html5QrCodeRef.current = qrScanner;

      const scanSuccess = (decodedText: string) => {
        const now = Date.now();
        if (now - lastScanTimestampRef.current < 2500) return;
        lastScanTimestampRef.current = now;

        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        handleCheckIn(decodedText, 'QR_SCAN');
      };

      const scanConfig = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      let started = false;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          const backCam = cameras.find((c) =>
            c.label.toLowerCase().includes('back') ||
            c.label.toLowerCase().includes('rear') ||
            c.label.toLowerCase().includes('environment')
          );
          const frontCam = cameras.find((c) =>
            c.label.toLowerCase().includes('front') ||
            c.label.toLowerCase().includes('user')
          );
          const targetCam = facing === 'environment' ? (backCam || cameras[0]) : (frontCam || cameras[0]);
          await qrScanner.start(targetCam.id, scanConfig, scanSuccess, () => {});
          started = true;
        }
      } catch (camListErr) {
        console.warn('Could not enumerate cameras, falling back to facingMode:', camListErr);
      }

      if (!started) {
        try {
          await qrScanner.start({ facingMode: facing }, scanConfig, scanSuccess, () => {});
          started = true;
        } catch (facingErr) {
          await qrScanner.start({ facingMode: 'user' }, scanConfig, scanSuccess, () => {});
          started = true;
        }
      }

      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Could not start camera:', err);
      const isPermissionDenied = err?.name === 'NotAllowedError' || err?.message?.toLowerCase()?.includes('permission');
      setCameraError(
        isAmharic
          ? (isPermissionDenied
              ? 'የካሜራ ፈቃድ ተከልክሏል። እባክዎ በብሮውዘር ቅንብሮች ውስጥ የካሜራ ፈቃድ ይፍቀዱ ወይም "በስልክ ካሜራ ፎቶ አንስተው ይቃኙ" የሚለውን ይጠቀሙ።'
              : 'የቀጥታ ካሜራ መክፈት አልተቻለም። እባክዎ ከታች ያለውን "በስልክ ካሜራ ፎቶ አንስተው ይቃኙ" የሚለውን ይጠቀሙ ወይም በስልክ ቁጥር ይፈልጉ።')
          : (isPermissionDenied
              ? 'Camera permission denied. Please allow camera access in browser or tap "Snap Photo with Phone".'
              : 'Could not access live camera. Please tap "Snap Photo with Phone" to scan or search by phone.')
      );
      setIsCameraActive(false);
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.warn('Error stopping camera:', err);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
  };

  const toggleCameraFacing = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    if (isCameraActive) {
      await startCamera(nextFacing);
    }
  };

  const triggerPhotoScan = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const triggerGalleryUpload = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.click();
    }
  };

  const handlePhotoScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsPhotoScanning(true);
      setCameraError(null);

      // Multi-strategy QR decoder: jsQR canvas (downscaled to 1000px) + native BarcodeDetector + center crop + contrast boost + html5-qrcode
      const decodedText = await decodeQrFromImage(file);

      if (decodedText) {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        await handleCheckIn(decodedText, 'QR_SCAN');
      } else {
        setCameraError(
          isAmharic
            ? 'ከፎቶው ላይ የQR ኮድ ማንበብ አልተቻለም። እባክዎ ካሜራውን ወደ QR ኮዱ አቅርበው ጥርት ያለ ፎቶ ያንሱ ወይም ከታች በስልክ ቁጥር ይፈልጉ።'
            : 'Could not detect a QR code from this image. Please take a clearer, closer photo or search by phone.'
        );
      }
    } catch (err: any) {
      console.warn('Photo scan error:', err);
      setCameraError(
        isAmharic
          ? 'ከፎቶው ላይ የQR ኮድ ማንበብ አልተቻለም። እባክዎ ካሜራውን ወደ QR ኮዱ አቅርበው እንደገና ያንሱ ወይም በስልክ ቁጥር ይፈልጉ።'
          : 'Could not decode QR code from this image. Please take a clearer picture or search by phone.'
      );
    } finally {
      setIsPhotoScanning(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop();
          }
        } catch (e) {}
      }
    };
  }, []);

  const handleCheckIn = async (
    scanValue?: string,
    methodOverride?: 'QR_SCAN' | 'BARCODE' | 'MANUAL_LOOKUP' | 'MANUAL_OVERRIDE',
    allowReEntry: boolean = false,
    notes?: string
  ) => {
    const valueToScan = scanValue || identifier.trim();
    if (!valueToScan || isProcessing) return;

    setIsProcessing(true);
    try {
      const defaultMethod = valueToScan.startsWith('QR-') ? 'QR_SCAN' : 'MANUAL_LOOKUP';
      const method = methodOverride || (scanValue ? defaultMethod : 'MANUAL_OVERRIDE');

      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          identifier: valueToScan,
          method,
          allowReEntry,
          notes,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setLastCheckInResult(result);
        setIdentifier('');

        // Play appropriate sound & triggers
        if (result.status === 'GRANTED') {
          sounds.playSuccess();
          if (result.member && isBirthdayToday(result.member.dateOfBirth)) {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 },
            });
          }
        } else if (result.status === 'WARNING_EXPIRING') {
          sounds.playWarning();
        } else {
          sounds.playDenied();
        }

        fetchCheckIns();
      } else {
        sounds.playDenied();
        setLastCheckInResult({
          success: false,
          status: 'DENIED_NOT_FOUND',
          message: result.error || 'Check-in validation failed.',
          log: {
            id: `err-${Date.now()}`,
            tenantId: currentTenant.id,
            memberId: 'unknown',
            memberName: 'Unknown Person',
            memberNumber: valueToScan,
            timestamp: new Date().toISOString(),
            status: 'DENIED_NOT_FOUND',
            method: methodOverride || 'MANUAL_OVERRIDE',
            failureReason: result.error || 'Check-in validation failed.',
          },
        });
      }
    } catch (err) {
      console.error(err);
      sounds.playDenied();
    } finally {
      setIsProcessing(false);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  };

  const handleManualSearch = async (q: string) => {
    setManualQuery(q);
    if (!q.trim() || q.trim().length < 2) {
      setManualResults([]);
      return;
    }

    setIsSearchingManual(true);
    try {
      const res = await fetch(`/api/members?tenantId=${currentTenant.id}&query=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setManualResults(data.members || []);
      }
    } catch (err) {
      console.error('Manual search error', err);
    } finally {
      setIsSearchingManual(false);
    }
  };

  const handleRenewMember = async (memberId: string) => {
    try {
      const res = await fetch('/api/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          memberId,
          action: 'RENEW_SUBSCRIPTION',
          planId: lastCheckInResult?.member?.currentPlanId,
          paymentMethod: 'CASH',
        }),
      });

      if (res.ok) {
        sounds.playSuccess();
        alert('Membership successfully renewed for 30 days! Cash payment recorded in financial ledger.');
        fetchCheckIns();
        setLastCheckInResult(null);
      }
    } catch (e) {
      console.error('Renewal failed', e);
    }
  };

  const getStatusBadgeConfig = (status: CheckInStatus) => {
    switch (status) {
      case 'GRANTED':
        return {
          badgeText: isAmharic ? '[መግባት ተፈቅዷል - ፈቃድ ተሰጥቷል]' : '[ENTRY APPROVED]',
          subText: isAmharic ? 'ንቁ አባልነት' : 'ALL ACCESS ACTIVE',
          Icon: ShieldCheck,
          containerClass: 'border-emerald-600 bg-emerald-50 text-emerald-950',
          badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          iconBg: 'bg-emerald-600 text-white',
        };
      case 'WARNING_EXPIRING':
        return {
          badgeText: isAmharic ? '[መግባት ተፈቅዷል - ሊያልቅ የተቃረበ]' : '[ENTRY APPROVED - EXPIRING SOON]',
          subText: isAmharic ? 'በ3 ቀናት ውስጥ ያበቃል' : 'EXPIRING WITHIN 3 DAYS',
          Icon: AlertTriangle,
          containerClass: 'border-amber-500 bg-amber-50 text-amber-950',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
          iconBg: 'bg-amber-500 text-white',
        };
      case 'DENIED_EXPIRED':
        return {
          badgeText: isAmharic ? '[መግባት አልተፈቀደም - ጊዜው ያለቀበት]' : '[ENTRY DECLINED - EXPIRED]',
          subText: isAmharic ? 'የአባልነት ጊዜ አልቋል' : 'SUBSCRIPTION LAPSED',
          Icon: Clock,
          containerClass: 'border-rose-600 bg-rose-50 text-rose-950',
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
          iconBg: 'bg-rose-600 text-white',
        };
      case 'DENIED_DEBT':
        return {
          badgeText: isAmharic ? '[መግባት አልተፈቀደም - ያልተከፈለ ቀሪ ሂሳብ]' : '[ENTRY DECLINED - UNPAID DEBT]',
          subText: isAmharic ? 'ቀሪ ክፍያ አለባቸው' : 'OUTSTANDING BALANCE DUE',
          Icon: DollarSign,
          containerClass: 'border-rose-600 bg-rose-50 text-rose-950',
          badgeClass: 'bg-rose-100 text-rose-900 border-rose-300',
          iconBg: 'bg-rose-600 text-white',
        };
      case 'DENIED_SUSPENDED':
        return {
          badgeText: isAmharic ? '[መግባት አልተፈቀደም - የታገደ]' : '[ENTRY DECLINED - SUSPENDED]',
          subText: isAmharic ? 'በአስተዳደር የታገደ' : 'POLICY / DISCIPLINARY HOLD',
          Icon: Ban,
          containerClass: 'border-red-600 bg-red-50 text-red-950',
          badgeClass: 'bg-red-100 text-red-900 border-red-300',
          iconBg: 'bg-red-600 text-white',
        };
      case 'DENIED_FROZEN':
        return {
          badgeText: isAmharic ? '[መግባት አልተፈቀደም - በጊዜያዊ እገዳ ላይ]' : '[ENTRY DECLINED - FROZEN]',
          subText: isAmharic ? 'በእረፍት ላይ ያለ አባል' : 'MEMBERSHIP ON HOLD',
          Icon: Snowflake,
          containerClass: 'border-blue-600 bg-blue-50 text-blue-950',
          badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
          iconBg: 'bg-blue-600 text-white',
        };
      case 'DENIED_BRANCH':
        return {
          badgeText: isAmharic ? '[መግባት አልተፈቀደም - ሌላ ቅርንጫፍ]' : '[ENTRY DECLINED - BRANCH RESTRICTED]',
          subText: isAmharic ? 'የማይፈቀድ ቅርንጫፍ' : 'INELIGIBLE FACILITY LOCATION',
          Icon: Building2,
          containerClass: 'border-orange-600 bg-orange-50 text-orange-950',
          badgeClass: 'bg-orange-100 text-orange-900 border-orange-300',
          iconBg: 'bg-orange-600 text-white',
        };
      case 'DENIED_RE_ENTRY':
        return {
          badgeText: isAmharic ? '[መግባት አልተፈቀደም - ተደጋጋሚ መግቢያ]' : '[ENTRY DECLINED - ANTI-PASSBACK COOLDOWN]',
          subText: isAmharic ? 'ከ15 ደቂቃ በታች ተቃኝቷል' : 'DUPLICATE ENTRY DETECTED (< 15 MIN)',
          Icon: RotateCcw,
          containerClass: 'border-amber-600 bg-amber-50 text-amber-950',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-400',
          iconBg: 'bg-amber-600 text-white',
        };
      case 'DENIED_REVOKED':
        return {
          badgeText: isAmharic ? '[መግባት አልተፈቀደም - የተሰረዘ QR]' : '[ENTRY DECLINED - CREDENTIAL REVOKED]',
          subText: isAmharic ? 'የተተካ አዲስ ፓስ' : 'DEACTIVATED / REGENERATED PASS',
          Icon: ShieldAlert,
          containerClass: 'border-purple-600 bg-purple-50 text-purple-950',
          badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
          iconBg: 'bg-purple-600 text-white',
        };
      case 'DENIED_NOT_FOUND':
      default:
        return {
          badgeText: isAmharic ? '[መግባት አልተፈቀደም - ያልተገኘ መታወቂያ]' : '[ENTRY DECLINED - CREDENTIAL NOT FOUND]',
          subText: isAmharic ? 'ያልታወቀ QR ወይም ስልክ' : 'UNRECOGNIZED TOKEN OR RECORD',
          Icon: XCircle,
          containerClass: 'border-slate-800 bg-slate-100 text-slate-950',
          badgeClass: 'bg-slate-200 text-slate-900 border-slate-400',
          iconBg: 'bg-slate-900 text-white',
        };
    }
  };

  return (
    <div className={isFullscreenKiosk ? 'fixed inset-0 z-50 bg-slate-50 p-6 overflow-y-auto' : 'space-y-6 pb-12'}>
      {/* Kiosk Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-600 animate-ping" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              {isAmharic ? 'የኤም ፊትነስ ፈጣን መግቢያ ቼክ-ኢን' : 'M Fitness & Gym Front-Desk Check-In'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAmharic
              ? 'ፊጋ፣ አዲስ አበባ • ስልክ: 0961889867 • በስልክ ካሜራ ወይም ስካነር የQR ኮድ ይቃኙ፣ 1 ቀን ይቀንሱ'
              : 'Figa, Addis Ababa • Tel: 0961889867 • Camera scan member passes on phone or printed cards & deduct 1 day'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />

          {/* Fullscreen Kiosk Mode Button */}
          <button
            onClick={() => setIsFullscreenKiosk(!isFullscreenKiosk)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
            title="Toggle Unattended Tablet Podium Mode"
          >
            {isFullscreenKiosk ? (
              <>
                <Minimize2 className="h-4 w-4 text-slate-700" />
                <span>{isAmharic ? 'መደበኛ እይታ' : 'Exit Fullscreen'}</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-4 w-4 text-emerald-600" />
                <span>{isAmharic ? 'የታብሌት ሁነታ' : 'Tablet Mode'}</span>
              </>
            )}
          </button>

          {/* Live Occupancy Meter */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 shadow-sm">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 font-extrabold">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {t.occupancy}
                </span>
                <span className="text-[11px] font-extrabold text-emerald-700">({occupancy.percentage}%)</span>
              </div>
              <p className="text-sm font-black text-slate-900">
                {occupancy.current} <span className="text-xs font-normal text-slate-500">/ {occupancy.max} cap</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Kiosk Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Scan & Input Terminal */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scanner Input Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <QrCode className="h-4 w-4" /> {t.readyToScan}
              </span>
              {/* Hidden file input for native mobile camera snap */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoScan}
              />
              {/* Hidden file input for photo/screenshot file picker */}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoScan}
              />

              <div className="flex flex-wrap items-center gap-2">
                {/* 1. Native Mobile Camera Snap Button */}
                <button
                  type="button"
                  onClick={triggerPhotoScan}
                  disabled={isPhotoScanning}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm disabled:opacity-50"
                  title={isAmharic ? 'የስልክ ካሜራ ክፈትና ፎቶ አንስተህ ፈትሽ' : 'Open phone camera to snap QR'}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span>{isPhotoScanning ? (isAmharic ? 'በማንበብ ላይ...' : 'Scanning...') : t.snapPhoto}</span>
                </button>

                {/* 2. Upload / Gallery File Picker */}
                <button
                  type="button"
                  onClick={triggerGalleryUpload}
                  disabled={isPhotoScanning}
                  className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 shadow-sm disabled:opacity-50"
                  title={isAmharic ? 'የQR ፎቶ ወይም ስክሪንሾት ከስልክዎ ይምረጡ' : 'Upload QR photo or screenshot'}
                >
                  <Upload className="h-3.5 w-3.5 text-emerald-700" />
                  <span>{isAmharic ? 'ፎቶ ይምረጡ / ስቀል' : 'Upload QR Photo'}</span>
                </button>

                {/* 2. Live Video Stream Camera Toggle (Laptop webcam or HTTPS mobile) */}
                {isCameraActive && (
                  <button
                    type="button"
                    onClick={toggleCameraFacing}
                    className="flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-all"
                    title={isAmharic ? 'የኋላ/የፊት ካሜራ ቀይር' : 'Switch rear/front camera'}
                  >
                    <SwitchCamera className="h-3.5 w-3.5 text-emerald-700" />
                    <span>{cameraFacing === 'environment' ? (isAmharic ? 'የፊት' : 'Front') : (isAmharic ? 'የኋላ' : 'Rear')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (isCameraActive) {
                      stopCamera();
                    } else {
                      startCamera();
                    }
                  }}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all border ${
                    isCameraActive
                      ? 'bg-rose-600 text-white border-rose-600 hover:bg-rose-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                  }`}
                  title={isAmharic ? 'የቀጥታ ቪዲዮ ካሜራ' : 'Live video stream'}
                >
                  {isCameraActive ? <VideoOff className="h-3.5 w-3.5" /> : <Video className="h-3.5 w-3.5" />}
                  <span>{isCameraActive ? t.closeCamera : t.useCamera}</span>
                </button>
              </div>
            </div>

            {/* Photo Scanning Progress Banner */}
            {isPhotoScanning && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-800 font-bold flex items-center justify-center gap-2 animate-pulse">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-600" />
                <span>{isAmharic ? 'የQR ኮዱን ከፎቶው ላይ በማንበብ ላይ...' : 'Scanning QR code from photo...'}</span>
              </div>
            )}

            {/* Real HTML5 Camera Live Stream Viewfinder - Always mounted in DOM */}
            <div className={`relative rounded-2xl border-2 border-emerald-600 bg-slate-950 p-4 flex flex-col items-center justify-center text-center overflow-hidden shadow-md animate-in fade-in duration-200 ${isCameraActive ? 'block' : 'hidden'}`}>
              <div className="w-full flex items-center justify-between mb-2 text-white text-xs px-1">
                <div className="flex items-center gap-2 font-bold">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{isAmharic ? 'የስልክ ካሜራ ስካነር ንቁ ነው' : 'Device Camera Active'} ({cameraFacing === 'environment' ? 'Rear' : 'Front'})</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-mono">10 FPS AUTO-SCAN</span>
              </div>

              {/* Html5Qrcode video render container - always in DOM */}
              <div
                id="html5qr-code-reader"
                className="w-full max-w-sm rounded-xl overflow-hidden bg-black min-h-[260px] border border-emerald-500/30 shadow-inner"
              />

              <p className="mt-3 text-xs font-bold text-emerald-200">
                {t.alignQr}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isAmharic
                  ? 'የአባሉን QR ኮድ ሲያሳዩ አባልነታቸውና የቀሩት ቀናት ተረጋግጦ ይፈቀዳል (ቀናት በየቀኑ በጊዜው ይቀንሳሉ)'
                  : 'Scan member phone screen or printed pass to verify plan status & remaining days (time-based daily countdown)'}
              </p>

              {cameraLoading && (
                <p className="text-xs text-amber-300 font-bold mt-1">Initializing camera sensor...</p>
              )}
            </div>

            {cameraError && (
              <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs text-rose-800 font-medium space-y-2">
                <p>{cameraError}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={triggerPhotoScan}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-bold text-xs hover:bg-emerald-700 shadow-sm"
                  >
                    <Camera className="h-3.5 w-3.5" />
                    <span>{t.snapPhoto}</span>
                  </button>
                  <span className="text-[11px] text-slate-600">
                    {isAmharic ? 'በስልክ ካሜራ ፎቶ በማንሳት ወዲያውኑ ይቃኙ' : 'Open phone camera to snap & scan'}
                  </span>
                </div>
              </div>
            )}

            {/* Quick Demo Scan Buttons for Testing */}
            <div className="pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                {isAmharic ? 'ፈጣን የሙከራ ስካን አዝራሮች (Test Scans):' : 'Quick Test Scans (Click to Test Real-Time Rules & Audio):'}
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                <button
                  onClick={() => handleCheckIn('QR-AF-1008-ABEL', 'QR_SCAN')}
                  className="rounded-xl border border-emerald-300 bg-emerald-100/70 p-2 text-left hover:bg-emerald-200 transition-all shadow-sm"
                >
                  <p className="font-extrabold text-[11px] text-emerald-900 truncate">Abel (Active)</p>
                  <p className="text-[10px] text-emerald-800 font-semibold">25d remaining</p>
                </button>
                <button
                  onClick={() => handleCheckIn('QR-AF-1001-YONAS', 'QR_SCAN')}
                  className="rounded-xl border border-emerald-200 bg-emerald-50 p-2 text-left hover:bg-emerald-100 transition-all"
                >
                  <p className="font-extrabold text-[11px] text-emerald-800 truncate">Yonas (Active)</p>
                  <p className="text-[10px] text-emerald-700">60d remaining</p>
                </button>
                <button
                  onClick={() => handleCheckIn('QR-AF-1002-SARA', 'QR_SCAN')}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-2 text-left hover:bg-amber-100 transition-all"
                >
                  <p className="font-extrabold text-[11px] text-amber-800 truncate">Sara (Expiring)</p>
                  <p className="text-[10px] text-amber-700">2d left</p>
                </button>
                <button
                  onClick={() => handleCheckIn('QR-AF-1003-ELIAS', 'QR_SCAN')}
                  className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-left hover:bg-rose-100 transition-all"
                >
                  <p className="font-extrabold text-[11px] text-rose-800 truncate">Elias (Debt)</p>
                  <p className="text-[10px] text-rose-700">Expired + 25 ETB</p>
                </button>
                <button
                  onClick={() => handleCheckIn('QR-AF-1006-DAWIT', 'QR_SCAN')}
                  className="rounded-xl border border-red-200 bg-red-50 p-2 text-left hover:bg-red-100 transition-all"
                >
                  <p className="font-extrabold text-[11px] text-red-800 truncate">Dawit (Suspended)</p>
                  <p className="text-[10px] text-red-700">Policy hold</p>
                </button>
                <button
                  onClick={() => handleCheckIn('QR-AF-1007-TIGIST', 'QR_SCAN')}
                  className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-left hover:bg-blue-100 transition-all"
                >
                  <p className="font-extrabold text-[11px] text-blue-800 truncate">Tigist (Frozen)</p>
                  <p className="text-[10px] text-blue-700">On pause</p>
                </button>
              </div>
            </div>

            {/* Fast Manual Search / USB Barcode Scanner Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCheckIn();
              }}
              className="relative"
            >
              <div className="relative flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Scan QR token, Barcode ID, or type Phone number..."
                  className="w-full rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 text-base font-bold text-slate-900 placeholder-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 shadow-sm"
                />
                <div className="absolute right-2.5 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      if (!identifier.trim()) return;
                      const res = await fetch('/api/checkin', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          tenantId: currentTenant.id,
                          identifier: identifier.trim(),
                          action: 'CHECK_OUT',
                        }),
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setOccupancy(data.occupancy);
                        setIdentifier('');
                        fetchCheckIns();
                        sounds.playWarning();
                      }
                    }}
                    disabled={isProcessing || !identifier.trim()}
                    className="rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all disabled:opacity-40"
                    title="Check out member & decrement occupancy"
                  >
                    Check-Out
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing || !identifier.trim()}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 transition-all disabled:opacity-40 shadow-sm"
                  >
                    {isProcessing ? 'Verifying...' : 'Check-In'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Verification Feedback Result Display (Prominent & High-Contrast, Non-Color-Only) */}
          {lastCheckInResult && (() => {
            const badgeConfig = getStatusBadgeConfig(lastCheckInResult.status);
            const StatusIcon = badgeConfig.Icon;
            return (
              <div
                className={`rounded-2xl border-2 p-6 shadow-md animate-in zoom-in-95 duration-200 ${badgeConfig.containerClass}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl font-black text-xl shadow-sm shrink-0 ${badgeConfig.iconBg}`}
                    >
                      <StatusIcon className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-xs font-black tracking-wider px-2.5 py-0.5 rounded-md border shadow-sm ${badgeConfig.badgeClass}`}
                        >
                          {badgeConfig.badgeText}
                        </span>
                        <span className="text-[11px] font-extrabold uppercase tracking-wide opacity-80">
                          {badgeConfig.subText}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-950 mt-1">
                        {lastCheckInResult.message}
                      </h3>
                      {lastCheckInResult.log.failureReason && (
                        <p className="text-xs font-semibold text-slate-800 mt-1 bg-white/70 p-2 rounded-lg border border-slate-300">
                          <strong>Decision Reason:</strong> {lastCheckInResult.log.failureReason}
                        </p>
                      )}
                    </div>
                  </div>

                  {lastCheckInResult.member && (
                    <button
                      onClick={() => setSelectedMemberForModal(lastCheckInResult.member!)}
                      className="rounded-xl bg-white px-3 py-1.5 text-xs font-bold text-slate-800 border border-slate-300 hover:bg-slate-50 shadow-sm whitespace-nowrap"
                    >
                      {t.viewPass}
                    </button>
                  )}
                </div>

                {/* Active Plan & Days Remaining Verification Banner */}
                {lastCheckInResult.success && lastCheckInResult.member && (
                  <div className="mt-4 rounded-xl border-2 border-emerald-500 bg-emerald-100/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-sm animate-in zoom-in-95">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-black text-base shadow">
                        ✓
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-emerald-950">
                            {isAmharic ? '✅ አባልነቱ ንቁ ነው — መግባት ተፈቅዷል' : '✅ Active Membership — Entry Approved'}
                          </h4>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                            {lastCheckInResult.member.currentPlanName || 'Standard Plan'}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-emerald-900 mt-1">
                          {isAmharic
                            ? `የቀሩት ቀናት: ${lastCheckInResult.member.daysRemaining ?? 0} ቀናት (እስከ ${formatDate(lastCheckInResult.member.subscriptionEnd)} ድረስ ክፍት ነው)`
                            : `Plan Duration: ${lastCheckInResult.member.daysRemaining ?? 0} days remaining (Valid until ${formatDate(lastCheckInResult.member.subscriptionEnd)})`}
                        </p>
                        <p className="text-[11px] text-emerald-700 mt-0.5">
                          {isAmharic
                            ? 'ℹ️ የቀን ቆጣሪ፡ ቀናት በየቀኑ በራሳቸው ይቀንሳሉ (ቢመጡም ባይመጡም ፕላኑ በተወሰነለት ቀን ያልቃል)'
                            : 'ℹ️ Daily countdown: Days reduce daily by calendar date whether attended or not'}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 pl-1">
                      <span className="rounded-xl bg-emerald-700 text-white px-3 py-1.5 text-xs font-black shadow-sm">
                        {lastCheckInResult.member.daysRemaining ?? 0} {isAmharic ? 'ቀናት ይቀራሉ' : 'DAYS LEFT'}
                      </span>
                      {lastCheckInResult.member.assignedLockerNumber && (
                        <span className="text-[11px] font-extrabold text-emerald-900 mt-1">
                          {isAmharic ? 'መቆለፊያ:' : 'Locker:'} {lastCheckInResult.member.assignedLockerNumber}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Anti-Passback Staff Override Section */}
                {lastCheckInResult.status === 'DENIED_RE_ENTRY' && (
                  <div className="mt-4 rounded-xl border-2 border-amber-400 bg-amber-100/90 p-4 space-y-2 text-amber-950">
                    <div className="flex items-center gap-2 font-black text-xs">
                      <RotateCcw className="h-4 w-4 text-amber-800" />
                      <span>{isAmharic ? 'ተደጋጋሚ መግቢያ መቆጣጠሪያ: ከ15 ደቂቃ በታች ተቃኝቷል' : 'Anti-Passback Policy: Duplicate Scan Within 15 Minutes'}</span>
                    </div>
                    <p className="text-xs font-medium text-amber-900">
                      {isAmharic
                        ? 'አባሉ ለአጭር ጊዜ ወጥተው የተመለሱ ከሆነ ወይም በካውንተር ሰራተኛው ፈቃድ የተሰጣቸው ከሆነ፣ የተፈቀደላቸው ሰራተኛ ልዩ ፈቃድ መስጠት ይችላሉ። ይህ እርምጃ በኦዲት መዝገብ ላይ ይመዘገባል።'
                        : 'If this member stepped outside briefly or has legitimate receptionist clearance, authorized staff can override the cooldown window. This action is permanently logged in the audit trail.'}
                    </p>
                    <button
                      onClick={() =>
                        handleCheckIn(
                          lastCheckInResult.member?.memberNumber || lastCheckInResult.log.memberNumber,
                          'MANUAL_OVERRIDE',
                          true,
                          'Staff manual anti-passback re-entry override'
                        )
                      }
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-extrabold text-xs py-2.5 shadow transition-all"
                    >
                      <Unlock className="h-4 w-4" />
                      <span>{isAmharic ? 'መግቢያውን አጽድቅ (ልዩ ፈቃድ መዝግብ)' : 'Authorize Re-Entry Override (Record Exception)'}</span>
                    </button>
                  </div>
                )}

                {/* Member Profile Details & Action If Denied */}
                {lastCheckInResult.member && (
                  <div className="mt-5 rounded-xl bg-white p-4 border border-slate-200 space-y-3 shadow-sm text-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-full bg-slate-900 flex items-center justify-center font-bold text-base text-white">
                          {lastCheckInResult.member.firstName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">
                            {lastCheckInResult.member.firstName} {lastCheckInResult.member.lastName}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {lastCheckInResult.member.memberNumber} • {lastCheckInResult.member.phone}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-xs">
                        <p className="font-bold text-slate-900">{lastCheckInResult.member.currentPlanName}</p>
                        <p className="text-slate-500">Valid: {formatDate(lastCheckInResult.member.subscriptionEnd)}</p>
                      </div>
                    </div>

                    {/* Badges Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <KeyRound className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          {t.lockerNumber}: <strong>{lastCheckInResult.member.assignedLockerNumber || 'None'}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <DollarSign className="h-3.5 w-3.5 text-slate-800" />
                        <span>
                          {t.dueBalance}: <strong>{formatCurrency(lastCheckInResult.member.dueBalance, currentTenant.currencySymbol, currentTenant.currency)}</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <span>
                          {t.daysRemaining}: <strong className="text-emerald-800">{lastCheckInResult.newDaysRemaining ?? lastCheckInResult.member.daysRemaining ?? 0} {t.days}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Birthday Celebration Banner */}
                    {isBirthdayToday(lastCheckInResult.member.dateOfBirth) && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 flex items-center gap-2.5 text-xs text-emerald-900 font-bold">
                        <Cake className="h-5 w-5 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-black text-slate-900">BIRTHDAY WORKOUT ALERT!</p>
                          <p className="text-[11px] text-emerald-800">
                            Wish {lastCheckInResult.member.firstName} a Happy Birthday from {currentTenant.name}!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Medical Note Alert */}
                    {lastCheckInResult.member.medicalNotes &&
                      lastCheckInResult.member.medicalNotes.toLowerCase() !== 'none' && (
                        <div className="rounded-xl border border-slate-300 bg-slate-50 p-2.5 flex items-center gap-2 text-xs text-slate-800 font-semibold">
                          <AlertOctagon className="h-4 w-4 text-slate-700 shrink-0" />
                          <span>
                            Medical Note: <strong>{lastCheckInResult.member.medicalNotes}</strong>
                          </span>
                        </div>
                      )}

                    {/* Immediate Action Buttons if Expired or Debt */}
                    {(lastCheckInResult.status === 'DENIED_EXPIRED' ||
                      lastCheckInResult.status === 'DENIED_DEBT') && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleRenewMember(lastCheckInResult.member!.id)}
                          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-all"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>{isAmharic ? 'አባልነት ያድሱ (ክፍያ ይቀበሉ)' : 'Collect Payment & Renew Pass'}</span>
                        </button>

                        <a
                          href={
                            lastCheckInResult.status === 'DENIED_DEBT'
                              ? getDebtReminderUrl(lastCheckInResult.member, currentTenant)
                              : getRenewalReminderUrl(lastCheckInResult.member, currentTenant)
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all shadow-sm"
                          title="Send reminder directly via WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4 text-emerald-600" />
                          <span>{isAmharic ? 'በዋትስአፕ ላክ' : 'Send WhatsApp'}</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Manual Member Lookup Fallback Section (When Camera/Scanner is Offline or Member has No Pass) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-emerald-700" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  {isAmharic ? 'በስም ወይም በስልክ ቁጥር መፈለጊያ' : 'Manual Reception Lookup Fallback'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowManualLookup(!showManualLookup)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                {showManualLookup
                  ? (isAmharic ? 'መፈለጊያውን ደብቅ' : 'Hide Fallback')
                  : (isAmharic ? 'በእጅ መፈለጊያ ክፈት' : 'Open Fallback Lookup')}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              {isAmharic
                ? 'ስካነሩ ወይም ካሜራው በማይሰራበት ጊዜ፣ ወይም አባሉ ፓሳቸውን በቤት ቢረሱ በዚህ መፈለጊያ ይጠቀሙ።'
                : 'Use this manual search whenever the QR/barcode scanner is unavailable, camera permissions fail, or a member forgot their pass.'}
            </p>

            {showManualLookup && (
              <div className="space-y-3 pt-2">
                <div className="relative">
                  <input
                    type="text"
                    value={manualQuery}
                    onChange={(e) => handleManualSearch(e.target.value)}
                    placeholder={isAmharic ? 'በአባል ስም፣ በስልክ ቁጥር ወይም በመታወቂያ ቁጥር ይፈልጉ...' : 'Search by member name, phone number, or member ID...'}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:bg-white focus:border-emerald-600 focus:outline-none"
                  />
                  {isSearchingManual && (
                    <span className="absolute right-3 top-3 text-[10px] text-slate-400">Searching...</span>
                  )}
                </div>

                {manualResults.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {manualResults.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100 transition-all text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">
                              {m.firstName} {m.lastName}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                m.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : m.status === 'EXPIRING_SOON'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                            >
                              {m.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {m.memberNumber} • {m.phone} • {m.currentPlanName}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedMemberForModal(m)}
                            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-100"
                          >
                            Card
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCheckIn(m.memberNumber, 'MANUAL_LOOKUP')}
                            disabled={isProcessing}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-emerald-700 disabled:opacity-40 shadow-sm"
                          >
                            <UserCheck className="h-3 w-3" />
                            <span>Check-In</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {manualQuery.trim().length >= 2 && manualResults.length === 0 && !isSearchingManual && (
                  <p className="text-xs text-slate-400 text-center py-2">
                    No members found matching &ldquo;{manualQuery}&rdquo;.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Live Check-In Activity Stream */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-600 animate-ping" />
                <h3 className="font-bold text-sm text-slate-900">Today&apos;s Turnstile Feed</h3>
              </div>
              <button
                onClick={fetchCheckIns}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 font-semibold"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {checkInLogs.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-500">
                  No check-ins logged yet today.
                </div>
              ) : (
                checkInLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black ${
                          log.status === 'GRANTED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.status === 'WARNING_EXPIRING'
                            ? 'bg-slate-200 text-slate-800'
                            : 'bg-slate-900 text-white'
                        }`}
                      >
                        {log.status === 'GRANTED' ? '✓' : log.status === 'WARNING_EXPIRING' ? '!' : '✕'}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{log.memberName}</h4>
                        <p className="text-[10px] text-slate-500">
                          {log.memberNumber} • {formatTime(log.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
                          log.status === 'GRANTED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : log.status === 'WARNING_EXPIRING'
                            ? 'bg-slate-100 text-slate-800 border-slate-300'
                            : 'bg-slate-900 text-white border-slate-900'
                        }`}
                      >
                        {log.status === 'GRANTED' ? 'GRANTED' : log.status.replace('_', ' ')}
                      </span>
                      {log.lockerAssigned && (
                        <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">
                          Locker {log.lockerAssigned}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pass Modal */}
      {selectedMemberForModal && (
        <MemberCardModal
          member={selectedMemberForModal}
          tenant={currentTenant}
          onClose={() => setSelectedMemberForModal(null)}
          onRenew={(m) => handleRenewMember(m.id)}
        />
      )}
    </div>
  );
}
