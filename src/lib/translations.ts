export type Language = 'en' | 'am';

export interface Translations {
  appName: string;
  gymLocation: string;
  gymPhone: string;
  welcomeMessage: string;
  // Navigation
  dashboard: string;
  checkinKiosk: string;
  members: string;
  billing: string;
  leads: string;
  staff: string;
  maintenance: string;
  reports: string;
  memberPortal: string;
  packages: string;
  // Check-In
  kioskTitle: string;
  kioskSubtitle: string;
  readyToScan: string;
  useCamera: string;
  closeCamera: string;
  switchCamera: string;
  snapPhoto: string;
  snapPhotoDesc: string;
  cameraHttpNotice: string;
  alignQr: string;
  cameraPermissionNeeded: string;
  searchPlaceholder: string;
  checkInBtn: string;
  checkOutBtn: string;
  occupancy: string;
  dayDeductedBanner: string;
  daysRemaining: string;
  days: string;
  lockerNumber: string;
  membershipPlan: string;
  dueBalance: string;
  accessApproved: string;
  accessDeclined: string;
  expiredWarning: string;
  expiringSoonWarning: string;
  suspendedWarning: string;
  frozenWarning: string;
  antiPassbackWarning: string;
  renewNow: string;
  sendWhatsapp: string;
  viewPass: string;
  reason: string;
  // Member Pass
  officialPass: string;
  installPass: string;
  holdToScanner: string;
  streak: string;
  expires: string;
  recentCheckins: string;
  noCheckins: string;
  offlinePass: string;
  active: string;
  expired: string;
  suspended: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'M Fitness and Gym',
    gymLocation: 'Figa, Addis Ababa',
    gymPhone: '0961889867',
    welcomeMessage: 'Welcome to M Fitness and Gym, Figa',
    dashboard: 'Dashboard',
    checkinKiosk: 'Front-Desk Check-In',
    members: 'Members',
    billing: 'Billing & Invoices',
    leads: 'Leads & CRM',
    staff: 'Staff & Shifts',
    maintenance: 'Equipment & Assets',
    reports: 'Reports & Analytics',
    memberPortal: 'Member Digital Pass',
    packages: 'Membership Packages',
    kioskTitle: 'Front-Desk Lightning Check-In',
    kioskSubtitle: 'Scan member QR pass on phone or printed card, camera scanner, auto-deduct days',
    readyToScan: 'Ready for camera scan, barcode card, or phone number',
    useCamera: 'Scan with Camera',
    closeCamera: 'Stop Camera',
    switchCamera: 'Switch Camera',
    snapPhoto: 'Snap Photo with Phone',
    snapPhotoDesc: 'Take photo of member QR pass on phone or card',
    cameraHttpNotice: 'Mobile browsers block live video on plain HTTP over Wi-Fi. Use "Snap Photo with Phone" or localhost.',
    alignQr: 'Align Member QR code inside camera viewfinder',
    cameraPermissionNeeded: 'Please allow camera permission in browser to scan QR passes',
    searchPlaceholder: 'Scan QR token, barcode ID, or type phone number...',
    checkInBtn: 'Check-In',
    checkOutBtn: 'Check-Out',
    occupancy: 'Occupancy',
    dayDeductedBanner: '✅ 1 Day Deducted!',
    daysRemaining: 'Days Remaining',
    days: 'days',
    lockerNumber: 'Locker',
    membershipPlan: 'Plan',
    dueBalance: 'Due Balance',
    accessApproved: 'ENTRY APPROVED',
    accessDeclined: 'ENTRY DECLINED',
    expiredWarning: 'MEMBERSHIP EXPIRED',
    expiringSoonWarning: 'EXPIRING SOON',
    suspendedWarning: 'MEMBERSHIP SUSPENDED',
    frozenWarning: 'MEMBERSHIP FROZEN',
    antiPassbackWarning: 'ANTI-PASSBACK COOLDOWN',
    renewNow: 'Renew Membership (Cash/Transfer)',
    sendWhatsapp: 'Send WhatsApp Reminder',
    viewPass: 'View Pass',
    reason: 'Reason',
    officialPass: 'Official Member Pass',
    installPass: 'Install M Fitness Pass',
    holdToScanner: 'Hold up to front desk camera or scanner',
    streak: 'Streak',
    expires: 'Expires',
    recentCheckins: 'Recent Gym Check-Ins',
    noCheckins: 'No check-ins recorded yet',
    offlinePass: 'OFFLINE PASS',
    active: 'ACTIVE',
    expired: 'EXPIRED',
    suspended: 'SUSPENDED',
  },
  am: {
    appName: 'ኤም ፊትነስ እና ጂም (M Fitness)',
    gymLocation: 'ፊጋ፣ አዲስ አበባ',
    gymPhone: '0961889867',
    welcomeMessage: 'እንኳን ወደ ኤም ፊትነስ እና ጂም (ፊጋ) በደህና መጡ',
    dashboard: 'ዳሽቦርድ',
    checkinKiosk: 'የካውንተር መግቢያ (ቼክ-ኢን)',
    members: 'አባላት',
    billing: 'ክፍያና ደረሰኝ',
    leads: 'አዲስ ተመዝጋቢዎች',
    staff: 'ሰራተኞች',
    maintenance: 'ዕቃዎችና ጥገና',
    reports: 'ሪፖርቶች',
    memberPortal: 'የአባል ዲጂታል ፓስ',
    packages: 'የአባልነት ፓኬጆች',
    kioskTitle: 'የካውንተር ፈጣን መግቢያ ቼክ-ኢን',
    kioskSubtitle: 'የአባላት ስልክ ወይም የታተመ QR ኮድ በካሜራ ይቃኙ፣ 1 ቀን ይቀንሱ፣ መረጃ ይመልከቱ',
    readyToScan: 'QR ኮድ ለመቃኘት ወይም ስልክ ቁጥር ለማስገባት ዝግጁ ነው',
    useCamera: 'በቀጥታ ካሜራ ይቃኙ',
    closeCamera: 'ካሜራ ዝጋ',
    switchCamera: 'ካሜራ ቀይር (የኋላ/የፊት)',
    snapPhoto: 'በስልክ ካሜራ ፎቶ አንስተው ይቃኙ',
    snapPhotoDesc: 'የአባሉን QR ኮድ በስልክ ካሜራ ፎቶ በማንሳት በቀጥታ ይቃኙ',
    cameraHttpNotice: 'ብሮውዘሮች በኔትወርክ IP (HTTP) የቀጥታ ቪዲዮ ሊከለክሉ ይችላሉ። "በስልክ ካሜራ ፎቶ አንስተው ይቃኙ" የሚለውን ይጠቀሙ።',
    alignQr: 'የአባሉን QR ኮድ በካሜራው ሳጥን ውስጥ ያሳዩ',
    cameraPermissionNeeded: 'እባክዎ በብሮውዘርዎ ውስጥ የካሜራ ፈቃድ ይስጡ',
    searchPlaceholder: 'QR ኮድ ይቃኙ ወይም ስልክ ቁጥር ያስገቡ...',
    checkInBtn: 'መግቢያ መዝግብ',
    checkOutBtn: 'መውጫ መዝግብ',
    occupancy: 'ያሉ ሰዎች',
    dayDeductedBanner: '✅ 1 ቀን ተቀንሷል!',
    daysRemaining: 'የቀሩት ቀናት',
    days: 'ቀናት',
    lockerNumber: 'የመቆለፊያ ቁጥር',
    membershipPlan: 'የአባልነት አይነት',
    dueBalance: 'ያልተከፈለ ቀሪ ሂሳብ',
    accessApproved: 'መግባት ተፈቅዷል',
    accessDeclined: 'መግባት አልተፈቀደም',
    expiredWarning: 'የአባልነት ጊዜ አልቋል',
    expiringSoonWarning: 'ሊያልቅ የተቃረበ',
    suspendedWarning: 'አባልነቱ ታግዷል',
    frozenWarning: 'በጊዜያዊ እገዳ ላይ',
    antiPassbackWarning: 'ተደጋጋሚ መግቢያ (15 ደቂቃ አልሞላም)',
    renewNow: 'አባልነት ያድሱ (በጥሬ ገንዘብ/ቴሌብር)',
    sendWhatsapp: 'በዋትስአፕ ማሳሰቢያ ላክ',
    viewPass: 'ፓስ ይመልከቱ',
    reason: 'ምክንያት',
    officialPass: 'ኦፊሴላዊ የአባልነት ዲጂታል ፓስ',
    installPass: 'የኤም ፊትነስ ፓስ በስልክዎ ላይ ይጫኑ',
    holdToScanner: 'ይህንን QR ኮድ በኤም ፊትነስ ካውንተር ላይ ያሳዩ',
    streak: 'ቀጣይነት',
    expires: 'የሚያበቃበት',
    recentCheckins: 'የቅርብ ጊዜ መግቢያዎች',
    noCheckins: 'እስካሁን የተመዘገበ መግቢያ የለም',
    offlinePass: 'ከመስመር ውጭ (OFFLINE)',
    active: 'ንቁ (ACTIVE)',
    expired: 'ያለቀበት (EXPIRED)',
    suspended: 'የታገደ (SUSPENDED)',
  },
};
