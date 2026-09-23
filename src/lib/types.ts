export type UserRole =
  | 'OWNER'
  | 'GENERAL_MANAGER'
  | 'MANAGER'
  | 'RECEPTIONIST'
  | 'TRAINER'
  | 'MAINTENANCE_STAFF'
  | 'FINANCE_OFFICER'
  | 'MEMBER'
  | 'SUPER_ADMIN'
  | 'GYM_OWNER'; // Backward-compatible alias for OWNER

export type PermissionCapability =
  | 'CONFIG_BUSINESS_PACKAGES'
  | 'MEMBER_PROFILE_MANAGE'
  | 'VIEW_MEDICAL_EMERGENCY'
  | 'MEMBERSHIP_LIFECYCLE'
  | 'CHECKIN_QR'
  | 'RECORD_PAYMENT_RECEIPT'
  | 'VOID_REFUND_TRANSACTION'
  | 'RECORD_APPROVE_EXPENSES'
  | 'STAFF_ROLES_SCHEDULES'
  | 'ASSETS_MAINTENANCE'
  | 'REPORTS_EXPORTS'
  | 'NOTIFICATION_SETTINGS';

export type AuditAction =
  | 'ROLE_CHANGE'
  | 'USER_CREATE'
  | 'USER_DEACTIVATE'
  | 'PACKAGE_CREATE'
  | 'PACKAGE_UPDATE'
  | 'MEMBER_CREATE'
  | 'MEMBER_UPDATE'
  | 'MEMBER_STATUS_CHANGE'
  | 'MEMBER_DELETE'
  | 'PAYMENT_RECORDED'
  | 'RECEIPT_ISSUED'
  | 'TRANSACTION_VOID'
  | 'TRANSACTION_REFUND'
  | 'TRANSACTION_ADJUSTMENT'
  | 'EXPENSE_RECORDED'
  | 'EXPENSE_APPROVED'
  | 'MAINTENANCE_TICKET_CREATE'
  | 'MAINTENANCE_TICKET_UPDATE'
  | 'CHECK_IN_ATTEMPT'
  | 'PERMISSION_DENIED'
  | 'SENSITIVE_DATA_ACCESS'
  | 'EXPORT_EXECUTED'
  | 'QR_REVOKED'
  | 'QR_REGENERATED'
  | 'EXPENSE_REJECTED'
  | 'EXPENSE_VOIDED'
  | 'PT_ASSIGNED'
  | 'SHIFT_ASSIGNED'
  | 'EQUIPMENT_CREATED'
  | 'EQUIPMENT_UPDATED'
  | 'REPORT_EXPORTED'
  | 'NOTIFICATION_SENT'
  | 'NOTIFICATION_FAILED'
  | 'NOTIFICATION_RETRIED'
  | 'NOTIFICATION_SETTINGS_UPDATED';

export interface AuditEvent {
  id: string;
  tenantId: string;
  branchId?: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  details?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  isMain: boolean;
  isActive: boolean;
  createdAt: string;
}

export type PlanTier = 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  currency: string;
  currencySymbol: string;
  maxCapacity: number;
  monthlySubscriptionFee: number;
  planTier: PlanTier;
  isActive: boolean;
  isDemo?: boolean;
  demoSubtitle?: string;
  createdAt: string;
}

export interface User {
  id: string;
  tenantId: string;
  branchId?: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  status?: 'ACTIVE' | 'DEACTIVATED';
  createdAt: string;
}

export interface MembershipPlan {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  durationDays: number;
  price: number;
  admissionFee: number;
  maxVisitsPerDay?: number;
  includesClasses: boolean;
  color: string;
  isActive: boolean;
  billingPeriod?: string;
  benefits?: string[];
  restrictions?: string[];
  includedServices?: string[];
  isPopular?: boolean;
  isPublished?: boolean;
}

export type MemberStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' | 'FROZEN' | 'CANCELLED' | 'SUSPENDED';

export interface Member {
  id: string;
  tenantId: string;
  memberNumber: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: string;
  address?: string;
  joinDate: string;
  emergencyContactName?: string;
  emergencyContactRelationship?: string;
  emergencyContactPhone?: string;
  medicalNotes?: string;
  consentGiven?: boolean;
  consentDate?: string;
  consentPolicyVersion?: string;
  qrCodeToken: string;
  qrCodeRevoked?: boolean;
  qrCodeRevokedAt?: string;
  revokedQRTokens?: string[];
  allowedBranchIds?: string[];
  homeBranchId?: string;
  branchId?: string;
  profileImage?: string;
  photoIdReference?: string;
  notes?: string;
  status: MemberStatus;
  currentPlanId?: string;
  currentPlanName?: string;
  subscriptionStart?: string;
  subscriptionEnd?: string;
  daysRemaining?: number;
  dueBalance: number;
  assignedLockerNumber?: string;
  notificationOptIn?: boolean;
  marketingOptIn?: boolean;
  smsOptOut?: boolean;
  emailOptOut?: boolean;
}

export interface MemberSubscription {
  id: string;
  tenantId: string;
  memberId: string;
  planId: string;
  planName: string;
  startDate: string;
  endDate: string;
  pricePaid: number;
  status: 'ACTIVE' | 'EXPIRED' | 'FROZEN' | 'CANCELLED';
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  paymentReference?: string;
  notes?: string;
}

export type CheckInStatus =
  | 'GRANTED'
  | 'WARNING_EXPIRING'
  | 'DENIED_EXPIRED'
  | 'DENIED_DEBT'
  | 'DENIED_SUSPENDED'
  | 'DENIED_FROZEN'
  | 'DENIED_BRANCH'
  | 'DENIED_RE_ENTRY'
  | 'DENIED_REVOKED'
  | 'DENIED_NOT_FOUND';

export interface CheckInLog {
  id: string;
  tenantId: string;
  memberId: string;
  memberName: string;
  memberNumber: string;
  timestamp: string;
  status: CheckInStatus;
  failureReason?: string;
  method: 'QR_SCAN' | 'BARCODE' | 'MANUAL_LOOKUP' | 'MANUAL_OVERRIDE';
  lockerAssigned?: string;
  scannerActorId?: string;
  scannerActorName?: string;
  branchId?: string;
  branchName?: string;
  deviceInfo?: string;
  notes?: string;
}

export type LockerStatus = 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'OVERDUE';

export interface Locker {
  id: string;
  tenantId: string;
  number: string;
  zone: string;
  status: LockerStatus;
  memberId?: string;
  memberName?: string;
  memberPhone?: string;
  assignedAt?: string;
  expiresAt?: string;
}

export interface POSProduct {
  id: string;
  tenantId: string;
  name: string;
  category: 'DRINK' | 'SUPPLEMENT' | 'ACCESSORY' | 'TRAINING';
  price: number;
  stock: number;
  sku: string;
  image?: string;
}

export interface POSSaleItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

export interface POSSale {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  memberId?: string;
  memberName?: string;
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';
  items: POSSaleItem[];
  createdAt: string;
  cashierName: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  total?: number;
  category?: string;
}

export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'UNPAID' | 'VOIDED' | 'REFUNDED';
export type InvoiceType = 'MEMBERSHIP' | 'POS' | 'LOCKER' | 'SERVICE';
export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER';

export interface Invoice {
  id: string;
  tenantId: string;
  invoiceNumber: string;
  memberId?: string;
  memberName: string;
  type: InvoiceType;
  items?: InvoiceLineItem[];
  subtotal?: number;
  discount?: number;
  discountReason?: string;
  tax?: number;
  amount: number;
  paidAmount: number;
  balance: number;
  status: InvoiceStatus;
  paymentMethod: PaymentMethod;
  receiptId?: string;
  receiptNumber?: string;
  voidedAt?: string;
  voidReason?: string;
  refundedAmount?: number;
  recordedBy?: string;
  recordedById?: string;
  createdAt: string;
  branchId?: string;
  dueDate?: string;
  notes?: string;
}

export interface Receipt {
  id: string;
  tenantId: string;
  branchId?: string;
  receiptNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  memberId?: string;
  memberName: string;
  amount: number;
  amountPaid?: number;
  paymentMethod: PaymentMethod;
  paymentReference?: string;
  receivedBy: string;
  receivedById: string;
  issuedByUserName?: string;
  issuedByUserId?: string;
  items?: InvoiceLineItem[];
  lineItems?: InvoiceLineItem[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  totalAmount?: number;
  remainingBalance?: number;
  notes?: string;
  createdAt: string;
  issuedAt?: string;
}

export type CorrectionType = 'VOID' | 'REFUND' | 'ADJUSTMENT';

export interface FinancialCorrection {
  id: string;
  tenantId: string;
  referenceNumber: string;
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  type: CorrectionType;
  amount: number;
  reason: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  createdAt: string;
}

export interface TenantPaymentPolicy {
  allowPartialActivation: boolean;
  minInitialPaymentPercent: number;
  maxAllowedBalance: number;
}

export interface PaperImportRow {
  fullName: string;
  phone: string;
  email?: string;
  planName: string;
  startDate: string;
  endDate: string;
  amountPaid: number;
  balanceDue: number;
  lockerNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
}

// ================= PILLAR 3: EXPENSE & P&L =================
export type ExpenseCategory =
  | 'UTILITIES'
  | 'EQUIPMENT_REPAIR'
  | 'PAYROLL'
  | 'INVENTORY'
  | 'FACILITY_RENT'
  | 'MARKETING'
  | 'OTHER';

export type ExpenseStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PAID' | 'VOIDED';

export interface Expense {
  id: string;
  tenantId: string;
  branchId?: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
  vendor: string;
  date: string;
  loggedBy: string;
  receiptNumber?: string;
  notes?: string;
  evidenceUrl?: string;
  status?: ExpenseStatus;
  approvedBy?: string;
  approvedById?: string;
  approvedAt?: string;
  rejectionReason?: string;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  isCorrection?: boolean;
  originalExpenseId?: string;
  createdAt: string;
}

export interface ProfitLossSummary {
  grossRevenue: number;
  membershipRevenue: number;
  posRevenue: number;
  lockerRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  categoryExpenses: Record<ExpenseCategory, number>;
  monthlyTrends: {
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
}

// ================= PILLAR 5: EQUIPMENT & MAINTENANCE =================
export type EquipmentCategory = 'CARDIO' | 'STRENGTH' | 'FREE_WEIGHTS' | 'RECOVERY' | 'OTHER';
export type EquipmentStatus = 'OPERATIONAL' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE' | 'DECOMMISSIONED';
export type EquipmentCondition = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';

export interface ServiceHistoryEntry {
  id: string;
  ticketId?: string;
  date: string;
  description: string;
  performedBy: string;
  cost: number;
  notes?: string;
  action?: string;
  technician?: string;
}

export interface Equipment {
  id: string;
  tenantId: string;
  name: string;
  category: EquipmentCategory;
  serialNumber: string;
  purchaseDate: string;
  purchaseCost: number;
  warrantyExpires?: string;
  status: EquipmentStatus;
  condition?: EquipmentCondition;
  location?: string;
  lastServicedAt?: string;
  nextServiceDue?: string;
  serviceHistory?: ServiceHistoryEntry[];
  createdAt: string;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type TicketSeverity = 'CRITICAL_SAFETY_HAZARD' | 'MAJOR_MALFUNCTION' | 'MINOR_DEFECT' | 'ROUTINE_SERVICE';

export interface TicketStatusHistoryEntry {
  status: TicketStatus;
  changedBy: string;
  changedAt: string;
  notes?: string;
}

export interface MaintenanceTicket {
  id: string;
  tenantId: string;
  branchId?: string;
  equipmentId: string;
  equipmentName: string;
  title: string;
  description: string;
  priority: TicketPriority;
  severity?: TicketSeverity;
  status: TicketStatus;
  reportedBy: string;
  reportedAt: string;
  assigneeId?: string;
  assigneeName?: string;
  photoUrl?: string;
  expectedCost?: number;
  resolvedAt?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
  resolutionCost?: number;
  statusHistory?: TicketStatusHistoryEntry[];
}

// ================= PILLAR 4: STAFF SHIFTS, ATTENDANCE & PT ASSIGNMENTS =================
export type ShiftType = 'MORNING' | 'EVENING' | 'CUSTOM';
export type ShiftStatus = 'SCHEDULED' | 'CLOCKED_IN' | 'COMPLETED' | 'ABSENT';

export interface StaffShift {
  id: string;
  tenantId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  shiftType: ShiftType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: ShiftStatus;
  clockedInAt?: string;
  clockedOutAt?: string;
  notes?: string;
}

export interface PersonalTrainingAssignment {
  id: string;
  tenantId: string;
  trainerId: string;
  trainerName: string;
  memberId: string;
  memberName: string;
  memberNumber?: string;
  planName?: string;
  startDate: string;
  endDate?: string;
  totalSessions?: number;
  completedSessions?: number;
  remainingSessions?: number;
  sessionsTotal: number;
  sessionsRemaining: number;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  assignedBy?: string;
  createdAt: string;
}

// ================= PILLAR 1: LEADS & TRIAL BOOKINGS =================
export interface Lead {
  id: string;
  tenantId: string;
  name: string;
  phone: string;
  email?: string;
  source?: 'REGISTER' | 'TRIAL' | 'CONTACT';
  selectedPackage?: string;
  packageId?: string;
  preferredDate?: string;
  interest?: string;
  message?: string;
  notes?: string;
  status: 'NEW' | 'CONTACTED' | 'CONVERTED';
  createdAt: string;
}

// ================= PILLAR 7: OPERATIONAL ALERTS =================
export interface OperationalAlert {
  id: string;
  type: 'MAINTENANCE' | 'LOW_STOCK' | 'OVERDUE_DEBT' | 'EXPIRING_MEMBERS';
  title: string;
  message: string;
  severity: 'HIGH' | 'MEDIUM' | 'INFO';
  timestamp: string;
  link: string;
  isRead?: boolean;
}

// ================= PILLAR 6: DASHBOARD, REPORTS & NOTIFICATIONS =================
export type DateRangePeriod =
  | 'TODAY'
  | 'YESTERDAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_YEAR'
  | 'CUSTOM';

export interface DashboardFilter {
  tenantId: string;
  branchId?: string; // 'ALL' or specific branch
  period: DateRangePeriod;
  startDate?: string;
  endDate?: string;
}

export type MetricDrillDownType =
  | 'REVENUE'
  | 'ACTIVE_MEMBERS'
  | 'NEW_MEMBERS'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'CHECK_INS'
  | 'OUTSTANDING_BALANCES'
  | 'EXPENSES'
  | 'URGENT_TICKETS'
  | 'NET_PROFIT';

export interface FinancialReportData {
  tenantId: string;
  branchId?: string;
  branchName?: string;
  period: DateRangePeriod;
  startDate: string;
  endDate: string;
  revenueByService: {
    memberships: number;
    pos: number;
    lockers: number;
    total: number;
  };
  revenueByPaymentMethod: {
    CASH: number;
    CARD: number;
    BANK_TRANSFER: number;
    MOBILE_MONEY: number;
    total: number;
  };
  expensesByCategory: Record<ExpenseCategory, number>;
  totalExpenses: number;
  grossRevenue: number;
  netProfit: number;
  profitMarginPercent: number;
  outstandingBalances: {
    totalOutstanding: number;
    debtorCount: number;
    aged0To30: number;
    aged31To60: number;
    aged61To90: number;
    aged90Plus: number;
    members: {
      id: string;
      name: string;
      phone: string;
      balance: number;
      daysOverdue: number;
    }[];
  };
  renewalMetrics: {
    expiringOrExpiredTotal: number;
    renewedCount: number;
    conversionRatePercent: number;
    churnedCount: number;
  };
  membershipStatusDistribution: {
    active: number;
    expiringSoon: number;
    expired: number;
    suspended: number;
    frozen: number;
    total: number;
  };
}

export type NotificationChannel = 'SMS' | 'EMAIL' | 'WHATSAPP' | 'IN_APP';
export type NotificationType =
  | 'RENEWAL_REMINDER'
  | 'UNPAID_DUES'
  | 'MAINTENANCE_ALERT'
  | 'WARRANTY_EXPIRY'
  | 'LOW_STOCK'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'PAYMENT_RECEIPT'
  | 'OVERDUE_INVOICE'
  | 'SYSTEM_ALERT';
export type NotificationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RETRIED' | 'OPTED_OUT' | 'PENDING';

export interface NotificationLog {
  id: string;
  tenantId: string;
  branchId?: string;
  type: NotificationType;
  channel: NotificationChannel;
  memberId?: string;
  recipientId?: string;
  recipientName?: string;
  memberName?: string;
  recipientContact: string;
  title?: string;
  subject?: string;
  message: string;
  status: NotificationStatus;
  failureReason?: string;
  retryCount: number;
  maxRetries: number;
  sentAt?: string;
  lastAttemptAt?: string;
  createdAt: string;
}

export interface NotificationSettings {
  tenantId: string;
  renewalNoticeDaysBefore?: number[];
  renewalReminderDaysBefore?: number[];
  enableSms: boolean;
  enableEmail: boolean;
  enableWhatsApp?: boolean;
  enableInApp?: boolean;
  autoNotifyDues?: boolean;
  autoNotifyUnsafeEquipment?: boolean;
  autoNotifyLowStock?: boolean;
  maxRetryAttempts?: number;
  senderName?: string;
  autoDispatchEnabled?: boolean;
  lastRunAt?: string;
}


