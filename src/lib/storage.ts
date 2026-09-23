import type {
  Tenant,
  User,
  MembershipPlan,
  Member,
  MemberStatus,
  MemberSubscription,
  CheckInLog,
  Locker,
  POSProduct,
  POSSale,
  Invoice,
  InvoiceStatus,
  InvoiceLineItem,
  PaymentMethod,
  Receipt,
  FinancialCorrection,
  TenantPaymentPolicy,
  CheckInStatus,
  PaperImportRow,
  Expense,
  ProfitLossSummary,
  ExpenseCategory,
  Equipment,
  EquipmentCategory,
  EquipmentStatus,
  MaintenanceTicket,
  TicketPriority,
  TicketStatus,
  StaffShift,
  ShiftType,
  ShiftStatus,
  PersonalTrainingAssignment,
  Lead,
  OperationalAlert,
  Branch,
  AuditEvent,
  UserRole,
  PermissionCapability,
  DateRangePeriod,
  DashboardFilter,
  MetricDrillDownType,
  FinancialReportData,
  NotificationChannel,
  NotificationType,
  NotificationStatus,
  NotificationLog,
  NotificationSettings,
} from './types';
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';
export { prisma };

// Seed Initial Multi-Tenant Demo Data
const initialTenants: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'M Fitness and Gym',
    slug: 'm-fitness-gym',
    logo: '🏋️‍♂️',
    address: 'Figa, Addis Ababa',
    phone: '0961889867',
    email: 'contact@mfitnessgym.com',
    currency: 'ETB',
    currencySymbol: 'ETB',
    maxCapacity: 80,
    monthlySubscriptionFee: 1500,
    planTier: 'PRO',
    isActive: true,
    isDemo: false,
    demoSubtitle: '',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'tenant-2',
    name: 'Iron Forge Gym & Spa',
    slug: 'iron-forge',
    logo: '⚡',
    address: 'Downtown Commercial Center, 2nd Floor',
    phone: '+251 92 334 4556',
    email: 'info@ironforge.com',
    currency: 'USD',
    currencySymbol: '$',
    maxCapacity: 120,
    monthlySubscriptionFee: 149,
    planTier: 'ENTERPRISE',
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

const initialBranches: Branch[] = [
  {
    id: 'branch-1-main',
    tenantId: 'tenant-1',
    name: 'M Fitness & Gym - Figa Main Branch',
    code: 'FIGA-01',
    address: 'Figa, Addis Ababa',
    phone: '0961889867',
    isMain: true,
    isActive: true,
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'branch-1-sarbet',
    tenantId: 'tenant-1',
    name: 'Sarbet Premium Club',
    code: 'SARBET-02',
    address: 'Sarbet International Center, 3rd Floor',
    phone: '+251 91 199 8877',
    isMain: false,
    isActive: true,
    createdAt: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'branch-2-main',
    tenantId: 'tenant-2',
    name: 'Downtown Flagship',
    code: 'DT-01',
    address: 'Downtown Commercial Center, 2nd Floor',
    phone: '+251 92 334 4556',
    isMain: true,
    isActive: true,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
];

const initialAuditEvents: AuditEvent[] = [
  {
    id: 'audit-init-1',
    tenantId: 'tenant-1',
    actorId: 'user-owner-1',
    actorName: 'Dawit Bekele',
    actorRole: 'OWNER',
    action: 'USER_CREATE',
    entityType: 'ORGANIZATION',
    entityId: 'tenant-1',
    details: 'Initial system setup and organization provisioning for Apex Fitness Hub',
    timestamp: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

const initialUsers: User[] = [
  {
    id: 'user-super',
    tenantId: 'tenant-1',
    name: 'Platform Super Admin',
    email: 'superadmin@gymos.io',
    role: 'SUPER_ADMIN',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-owner-1',
    tenantId: 'tenant-1',
    name: 'Dawit Bekele (Owner)',
    email: 'owner@mfitnessgym.com',
    role: 'OWNER',
    phone: '0961889867',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-gm-1',
    tenantId: 'tenant-1',
    name: 'Helen Haile (General Manager)',
    email: 'manager@apexfitness.com',
    role: 'GENERAL_MANAGER',
    phone: '+251 91 778 9900',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-staff-1',
    tenantId: 'tenant-1',
    name: 'Selam Tesfaye (Receptionist)',
    email: 'selam@apexfitness.com',
    role: 'RECEPTIONIST',
    phone: '+251 91 223 4455',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-trainer-1',
    tenantId: 'tenant-1',
    name: 'Coach Marcus (Trainer)',
    email: 'marcus@apexfitness.com',
    role: 'TRAINER',
    phone: '+251 91 334 5566',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-maint-1',
    tenantId: 'tenant-1',
    name: 'Kassahun Mengistu (Maintenance)',
    email: 'kassahun@apexfitness.com',
    role: 'MAINTENANCE_STAFF',
    phone: '+251 91 556 7788',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-finance-1',
    tenantId: 'tenant-1',
    name: 'Tewodros Girma (Finance Officer)',
    email: 'finance@apexfitness.com',
    role: 'FINANCE_OFFICER',
    phone: '+251 91 445 6688',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-mgr-1',
    tenantId: 'tenant-1',
    name: 'Robel Haile (Floor Manager)',
    email: 'manager@apexfitness.com',
    role: 'MANAGER',
    phone: '+251 91 667 8899',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-member-1',
    tenantId: 'tenant-1',
    name: 'Yonas Abraham (Member)',
    email: 'yonas@gmail.com',
    role: 'MEMBER',
    phone: '+251 94 455 6677',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-owner-2',
    tenantId: 'tenant-2',
    name: 'Iron Forge Owner',
    email: 'owner2@ironforge.com',
    role: 'OWNER',
    phone: '+251 92 334 4556',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-reception-2',
    tenantId: 'tenant-2',
    name: 'Iron Forge Receptionist',
    email: 'reception2@ironforge.com',
    role: 'RECEPTIONIST',
    phone: '+251 92 889 9001',
    isActive: true,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  },
];

const initialPlans: MembershipPlan[] = [
  {
    id: 'plan-1-day',
    tenantId: 'tenant-1',
    name: 'Day Pass',
    description: 'Single day full facility pass with locker and rain shower access',
    durationDays: 1,
    price: 10,
    admissionFee: 0,
    maxVisitsPerDay: 1,
    includesClasses: false,
    color: '#1F2937',
    isActive: true,
    isPublished: true,
    billingPeriod: '1 Day',
    benefits: [
      'Full open gym floor & cardio deck access',
      'Locker room & rainfall showers',
      'Digital QR day pass',
      'Complimentary equipment orientation',
    ],
    restrictions: [
      'Valid for single calendar day only',
      'No pool or sauna access on Day Pass',
    ],
    includedServices: ['Gym Floor', 'Cardio Deck', 'Lockers'],
    isPopular: false,
  },
  {
    id: 'plan-1-monthly',
    tenantId: 'tenant-1',
    name: 'Monthly Standard',
    description: 'Full open gym floor, Olympic lifting zone, and cardio deck',
    durationDays: 30,
    price: 45,
    admissionFee: 15,
    maxVisitsPerDay: 1,
    includesClasses: false,
    color: '#0F766E',
    isActive: true,
    isPublished: true,
    billingPeriod: 'Monthly',
    benefits: [
      'Unlimited gym floor & free weights access',
      'Locker room & rainfall showers',
      'Mobile PWA digital pass with QR credentials',
      'Sub-second turnstile check-in',
    ],
    restrictions: [
      'Access during standard operating hours',
      'Max 1 check-in per day',
    ],
    includedServices: ['Gym Floor', 'Cardio Deck', 'Lockers', 'Showers'],
    isPopular: false,
  },
  {
    id: 'plan-1-quarterly',
    tenantId: 'tenant-1',
    name: 'Quarterly Pro',
    description: 'Ideal for consistent athletes committed to sustainable fitness results',
    durationDays: 90,
    price: 120,
    admissionFee: 0,
    maxVisitsPerDay: 2,
    includesClasses: true,
    color: '#0F766E',
    isActive: true,
    isPublished: true,
    billingPeriod: 'Quarterly',
    benefits: [
      'All Monthly Standard benefits included',
      'Complimentary dedicated locker assignment',
      '1 One-on-one personal trainer assessment',
      'Group mobility & HIIT classes included',
      'Save 12% compared to monthly renewal',
    ],
    restrictions: [
      'Classes require 2 hours advance booking',
    ],
    includedServices: ['Gym Floor', 'Lockers', 'Classes', '1-on-1 Assessment'],
    isPopular: false,
  },
  {
    id: 'plan-1-annual',
    tenantId: 'tenant-1',
    name: 'Annual VIP All-Access',
    description: 'Our most comprehensive fitness, aquatic conditioning, and luxury recovery tier',
    durationDays: 365,
    price: 399,
    admissionFee: 0,
    maxVisitsPerDay: 3,
    includesClasses: true,
    color: '#D97706',
    isActive: true,
    isPublished: true,
    billingPeriod: 'Annual',
    benefits: [
      'Unlimited 365-day access to all facility amenities',
      'Finnish cedar dry sauna & eucalyptus steam suite',
      'Heated 25m Olympic lap pool with dedicated lanes',
      'Dedicated VIP locker assignment with digital locks',
      'Quarterly body composition & biomechanics review',
      '4 Complimentary guest day passes per year',
    ],
    restrictions: [
      'Guest passes require 24h prior notification',
    ],
    includedServices: ['Gym Floor', 'Olympic Pool', 'Sauna & Steam', 'Classes', 'VIP Lockers', 'Trainer Audits'],
    isPopular: true,
  },
  {
    id: 'plan-1-combo',
    tenantId: 'tenant-1',
    name: 'Gym + Swimming Combo',
    description: 'Dual access to strength floor and Olympic heated lap pool',
    durationDays: 30,
    price: 65,
    admissionFee: 0,
    maxVisitsPerDay: 2,
    includesClasses: false,
    color: '#0F766E',
    isActive: true,
    isPublished: true,
    billingPeriod: 'Monthly',
    benefits: [
      'Full open gym floor & weights arena',
      'Unlimited heated Olympic lap pool access',
      'Sauna & steam recovery suite',
      'Early morning swim lane reservation access',
    ],
    restrictions: [
      'Swim cap required in Olympic pool',
    ],
    includedServices: ['Gym Floor', 'Olympic Pool', 'Sauna & Steam'],
    isPopular: false,
  },
  // Tenant 2 Plans
  {
    id: 'plan-2-monthly',
    tenantId: 'tenant-2',
    name: 'Iron Standard',
    description: 'Monthly unlimited lifting and strength floor',
    durationDays: 30,
    price: 50,
    admissionFee: 10,
    maxVisitsPerDay: 1,
    includesClasses: false,
    color: '#0F766E',
    isActive: true,
    isPublished: true,
    billingPeriod: 'Monthly',
    benefits: ['Full iron room access', 'Lockers & showers'],
    restrictions: ['Standard gym hours only'],
    includedServices: ['Gym Floor', 'Lockers'],
    isPopular: true,
  },
];

const initialMembers: Member[] = [
  {
    id: 'mem-101',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    memberNumber: 'AF-1001',
    firstName: 'Yonas',
    lastName: 'Abraham',
    email: 'yonas@gmail.com',
    phone: '+251 94 455 6677',
    gender: 'MALE',
    dateOfBirth: '1995-04-12',
    joinDate: new Date(Date.now() - 45 * 86400000).toISOString(),
    emergencyContactName: 'Helen Abraham',
    emergencyContactRelationship: 'Spouse',
    emergencyContactPhone: '+251 91 100 2233',
    medicalNotes: 'None',
    consentGiven: true,
    consentDate: new Date(Date.now() - 45 * 86400000).toISOString(),
    consentPolicyVersion: 'v1.0',
    qrCodeToken: 'QR-AF-1001-YONAS',
    profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    currentPlanId: 'plan-1-quarterly',
    currentPlanName: '3-Month Pro Power',
    subscriptionStart: new Date(Date.now() - 30 * 86400000).toISOString(),
    subscriptionEnd: new Date(Date.now() + 60 * 86400000).toISOString(),
    daysRemaining: 60,
    dueBalance: 0,
    assignedLockerNumber: 'L-07',
    notificationOptIn: true,
    marketingOptIn: true,
    smsOptOut: false,
    emailOptOut: false,
  },
  {
    id: 'mem-102',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    memberNumber: 'AF-1002',
    firstName: 'Sara',
    lastName: 'Girma',
    email: 'sara.girma@outlook.com',
    phone: '+251 91 234 5678',
    gender: 'FEMALE',
    dateOfBirth: '1998-09-20',
    joinDate: new Date(Date.now() - 28 * 86400000).toISOString(),
    emergencyContactName: 'Kidus Girma',
    emergencyContactRelationship: 'Brother',
    emergencyContactPhone: '+251 92 233 4455',
    medicalNotes: 'Mild asthma, carries inhaler',
    consentGiven: true,
    consentDate: new Date(Date.now() - 28 * 86400000).toISOString(),
    consentPolicyVersion: 'v1.0',
    qrCodeToken: 'QR-AF-1002-SARA',
    profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    status: 'EXPIRING_SOON',
    currentPlanId: 'plan-1-monthly',
    currentPlanName: 'Monthly Standard',
    subscriptionStart: new Date(Date.now() - 28 * 86400000).toISOString(),
    subscriptionEnd: new Date(Date.now() + 2 * 86400000).toISOString(),
    daysRemaining: 2,
    dueBalance: 0,
    assignedLockerNumber: 'L-12',
    notificationOptIn: true,
    marketingOptIn: true,
    smsOptOut: false,
    emailOptOut: false,
  },
  {
    id: 'mem-103',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    memberNumber: 'AF-1003',
    firstName: 'Elias',
    lastName: 'Tadesse',
    email: 'elias.t@yahoo.com',
    phone: '+251 93 345 6789',
    gender: 'MALE',
    joinDate: new Date(Date.now() - 65 * 86400000).toISOString(),
    emergencyContactName: 'Abebech Tadesse',
    emergencyContactRelationship: 'Mother',
    emergencyContactPhone: '+251 91 333 7788',
    medicalNotes: 'Lower back disc herniation - avoid heavy deadlifts',
    consentGiven: true,
    consentDate: new Date(Date.now() - 65 * 86400000).toISOString(),
    consentPolicyVersion: 'v1.0',
    qrCodeToken: 'QR-AF-1003-ELIAS',
    profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'EXPIRED',
    currentPlanId: 'plan-1-monthly',
    currentPlanName: 'Monthly Standard',
    subscriptionStart: new Date(Date.now() - 65 * 86400000).toISOString(),
    subscriptionEnd: new Date(Date.now() - 5 * 86400000).toISOString(),
    daysRemaining: -5,
    dueBalance: 25,
    notificationOptIn: false,
    marketingOptIn: false,
    smsOptOut: true,
    emailOptOut: true,
  },
  {
    id: 'mem-104',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    memberNumber: 'AF-1004',
    firstName: 'Bethlehem',
    lastName: 'Haile',
    email: 'betty.haile@gmail.com',
    phone: '+251 94 567 8901',
    gender: 'FEMALE',
    joinDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    emergencyContactName: 'Dr. Haile Wolde',
    emergencyContactRelationship: 'Father',
    emergencyContactPhone: '+251 91 444 8899',
    medicalNotes: 'None reported',
    consentGiven: true,
    consentDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    consentPolicyVersion: 'v1.0',
    qrCodeToken: 'QR-AF-1004-BETTY',
    profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    currentPlanId: 'plan-1-annual',
    currentPlanName: 'Annual VIP All-Access',
    subscriptionStart: new Date(Date.now() - 10 * 86400000).toISOString(),
    subscriptionEnd: new Date(Date.now() + 355 * 86400000).toISOString(),
    daysRemaining: 355,
    dueBalance: 0,
    assignedLockerNumber: 'VIP-01',
    notificationOptIn: true,
    marketingOptIn: true,
    smsOptOut: false,
    emailOptOut: false,
  },
  {
    id: 'mem-105',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    memberNumber: 'AF-1005',
    firstName: 'Michael',
    lastName: 'Alemu',
    phone: '+251 92 789 0123',
    gender: 'MALE',
    joinDate: new Date(Date.now() - 20 * 86400000).toISOString(),
    consentGiven: true,
    consentDate: new Date(Date.now() - 20 * 86400000).toISOString(),
    consentPolicyVersion: 'v1.0',
    qrCodeToken: 'QR-AF-1005-MICHAEL',
    status: 'ACTIVE',
    currentPlanId: 'plan-1-monthly',
    currentPlanName: 'Monthly Standard',
    subscriptionStart: new Date(Date.now() - 20 * 86400000).toISOString(),
    subscriptionEnd: new Date(Date.now() + 10 * 86400000).toISOString(),
    daysRemaining: 10,
    dueBalance: 0,
    notificationOptIn: true,
    marketingOptIn: false,
    smsOptOut: false,
    emailOptOut: false,
  },
  {
    id: 'mem-106',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    memberNumber: 'AF-1006',
    firstName: 'Dawit',
    lastName: 'Kebede',
    phone: '+251 91 765 4321',
    gender: 'MALE',
    joinDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    consentGiven: true,
    consentDate: new Date(Date.now() - 60 * 86400000).toISOString(),
    consentPolicyVersion: 'v1.0',
    qrCodeToken: 'QR-AF-1006-DAWIT',
    status: 'SUSPENDED',
    currentPlanId: 'plan-1-monthly',
    currentPlanName: 'Monthly Standard',
    subscriptionStart: new Date(Date.now() - 60 * 86400000).toISOString(),
    subscriptionEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    daysRemaining: 30,
    dueBalance: 0,
    notificationOptIn: true,
    marketingOptIn: false,
    smsOptOut: false,
    emailOptOut: false,
  },
  {
    id: 'mem-107',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    memberNumber: 'AF-1007',
    firstName: 'Tigist',
    lastName: 'Belay',
    phone: '+251 92 876 5432',
    gender: 'FEMALE',
    joinDate: new Date(Date.now() - 40 * 86400000).toISOString(),
    consentGiven: true,
    consentDate: new Date(Date.now() - 40 * 86400000).toISOString(),
    consentPolicyVersion: 'v1.0',
    qrCodeToken: 'QR-AF-1007-TIGIST',
    status: 'FROZEN',
    currentPlanId: 'plan-1-quarterly',
    currentPlanName: '3-Month Pro Power',
    subscriptionStart: new Date(Date.now() - 40 * 86400000).toISOString(),
    subscriptionEnd: new Date(Date.now() + 50 * 86400000).toISOString(),
    daysRemaining: 50,
    dueBalance: 0,
    notificationOptIn: false,
    marketingOptIn: false,
    smsOptOut: true,
    emailOptOut: true,
  },
  {
    id: 'mem-108',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    memberNumber: 'AF-1008',
    firstName: 'Abel',
    lastName: 'Tesfaye',
    email: 'abel.tesfaye@gmail.com',
    phone: '0911223344',
    gender: 'MALE',
    dateOfBirth: '1996-03-15',
    joinDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    emergencyContactName: 'Solomon Tesfaye',
    emergencyContactRelationship: 'Brother',
    emergencyContactPhone: '0922334455',
    medicalNotes: 'None',
    consentGiven: true,
    consentDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    consentPolicyVersion: 'v1.0',
    qrCodeToken: 'QR-AF-1008-ABEL',
    profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'ACTIVE',
    currentPlanId: 'plan-1-monthly',
    currentPlanName: 'Monthly Standard',
    subscriptionStart: new Date(Date.now() - 5 * 86400000).toISOString(),
    subscriptionEnd: new Date(Date.now() + 25 * 86400000).toISOString(),
    daysRemaining: 25,
    dueBalance: 0,
    assignedLockerNumber: 'L-01',
    notificationOptIn: true,
    marketingOptIn: true,
    smsOptOut: false,
    emailOptOut: false,
  },
];

const initialLockers: Locker[] = [
  { id: 'lock-1', tenantId: 'tenant-1', number: 'L-01', zone: 'Cardio Zone', status: 'AVAILABLE' },
  { id: 'lock-2', tenantId: 'tenant-1', number: 'L-02', zone: 'Cardio Zone', status: 'AVAILABLE' },
  { id: 'lock-3', tenantId: 'tenant-1', number: 'L-03', zone: 'Cardio Zone', status: 'MAINTENANCE' },
  { id: 'lock-4', tenantId: 'tenant-1', number: 'L-04', zone: 'Free Weights', status: 'AVAILABLE' },
  { id: 'lock-5', tenantId: 'tenant-1', number: 'L-05', zone: 'Free Weights', status: 'AVAILABLE' },
  { id: 'lock-6', tenantId: 'tenant-1', number: 'L-06', zone: 'Free Weights', status: 'AVAILABLE' },
  {
    id: 'lock-7',
    tenantId: 'tenant-1',
    number: 'L-07',
    zone: 'Free Weights',
    status: 'OCCUPIED',
    memberId: 'mem-101',
    memberName: 'Yonas Abraham',
    memberPhone: '+251 94 455 6677',
    assignedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 60 * 86400000).toISOString(),
  },
  {
    id: 'lock-8',
    tenantId: 'tenant-1',
    number: 'L-12',
    zone: 'Locker Room A',
    status: 'OCCUPIED',
    memberId: 'mem-102',
    memberName: 'Sara Girma',
    memberPhone: '+251 91 234 5678',
    assignedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 2 * 86400000).toISOString(),
  },
  {
    id: 'lock-9',
    tenantId: 'tenant-1',
    number: 'VIP-01',
    zone: 'VIP Lounge',
    status: 'OCCUPIED',
    memberId: 'mem-104',
    memberName: 'Bethlehem Haile',
    memberPhone: '+251 94 567 8901',
    assignedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    expiresAt: new Date(Date.now() + 355 * 86400000).toISOString(),
  },
  { id: 'lock-10', tenantId: 'tenant-1', number: 'VIP-02', zone: 'VIP Lounge', status: 'AVAILABLE' },
];

const initialProducts: POSProduct[] = [
  { id: 'pos-1', tenantId: 'tenant-1', name: 'Mineral Spring Water 500ml', category: 'DRINK', price: 1.5, stock: 48, sku: 'DRK-WAT-01' },
  { id: 'pos-2', tenantId: 'tenant-1', name: 'Optimum Nutrition Gold Whey (Vanilla)', category: 'SUPPLEMENT', price: 65.0, stock: 12, sku: 'SUP-WHE-01' },
  { id: 'pos-3', tenantId: 'tenant-1', name: 'Creatine Monohydrate 300g', category: 'SUPPLEMENT', price: 28.0, stock: 15, sku: 'SUP-CRE-01' },
  { id: 'pos-4', tenantId: 'tenant-1', name: 'Monster Energy Ultra (Sugar Free)', category: 'DRINK', price: 3.5, stock: 32, sku: 'DRK-ENG-01' },
  { id: 'pos-5', tenantId: 'tenant-1', name: 'Microfiber Gym Towel (Apex Branded)', category: 'ACCESSORY', price: 12.0, stock: 25, sku: 'ACC-TWL-01' },
  { id: 'pos-6', tenantId: 'tenant-1', name: '1-on-1 Personal Trainer Session (1 hr)', category: 'TRAINING', price: 25.0, stock: 999, sku: 'SRV-PT-01' },
  { id: 'pos-7', tenantId: 'tenant-1', name: 'C4 Original Pre-Workout Shot (Icy Blue)', category: 'SUPPLEMENT', price: 4.0, stock: 3, sku: 'SUP-C4-01' },
];

const initialCheckIns: CheckInLog[] = [
  {
    id: 'chk-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    branchName: 'Bole Medhanealem Main Branch',
    memberId: 'mem-101',
    memberName: 'Yonas Abraham',
    memberNumber: 'AF-1001',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    status: 'GRANTED',
    method: 'QR_SCAN',
    lockerAssigned: 'L-07',
  },
  {
    id: 'chk-2',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    branchName: 'Sarbet Premium Club',
    memberId: 'mem-104',
    memberName: 'Bethlehem Haile',
    memberNumber: 'AF-1004',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    status: 'GRANTED',
    method: 'QR_SCAN',
    lockerAssigned: 'VIP-01',
  },
  {
    id: 'chk-3',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    branchName: 'Sarbet Premium Club',
    memberId: 'mem-105',
    memberName: 'Michael Alemu',
    memberNumber: 'AF-1005',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    status: 'GRANTED',
    method: 'MANUAL_OVERRIDE',
  },
];

const initialReceipts: Receipt[] = [
  {
    id: 'rcp-001',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    receiptNumber: 'RCP-2026-1001',
    invoiceId: 'inv-001',
    invoiceNumber: 'INV-2026-001',
    memberId: 'mem-101',
    memberName: 'Yonas Abraham',
    amount: 120,
    paymentMethod: 'CARD',
    receivedBy: 'Selam Tesfaye',
    receivedById: 'user-staff-1',
    items: [
      {
        id: 'item-inv-1',
        description: '3-Month Pro Power Membership Fee',
        unitPrice: 120,
        quantity: 1,
        subtotal: 120,
        category: 'PLAN',
      },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'rcp-002',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    receiptNumber: 'RCP-2026-1002',
    invoiceId: 'inv-002',
    invoiceNumber: 'INV-2026-002',
    memberId: 'mem-104',
    memberName: 'Bethlehem Haile',
    amount: 420,
    paymentMethod: 'BANK_TRANSFER',
    receivedBy: 'Selam Tesfaye',
    receivedById: 'user-staff-1',
    items: [
      {
        id: 'item-inv-2',
        description: 'Annual VIP All-Access Membership Fee',
        unitPrice: 420,
        quantity: 1,
        subtotal: 420,
        category: 'PLAN',
      },
    ],
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'rcp-003',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    receiptNumber: 'RCP-2026-1003',
    invoiceId: 'inv-003',
    invoiceNumber: 'INV-2026-003',
    memberId: 'mem-103',
    memberName: 'Elias Tadesse',
    amount: 20,
    paymentMethod: 'CASH',
    receivedBy: 'Selam Tesfaye',
    receivedById: 'user-staff-1',
    items: [
      {
        id: 'item-inv-3',
        description: 'Monthly Standard Membership Fee (Partial Payment)',
        unitPrice: 45,
        quantity: 1,
        subtotal: 45,
        category: 'PLAN',
      },
    ],
    createdAt: new Date(Date.now() - 65 * 86400000).toISOString(),
  },
];

const initialInvoices: Invoice[] = [
  {
    id: 'inv-001',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    invoiceNumber: 'INV-2026-001',
    memberId: 'mem-101',
    memberName: 'Yonas Abraham',
    type: 'MEMBERSHIP',
    items: [
      {
        id: 'item-inv-1',
        description: '3-Month Pro Power Membership Fee',
        unitPrice: 120,
        quantity: 1,
        subtotal: 120,
        category: 'PLAN',
      },
    ],
    subtotal: 120,
    discount: 0,
    amount: 120,
    paidAmount: 120,
    balance: 0,
    status: 'PAID',
    paymentMethod: 'CARD',
    receiptId: 'rcp-001',
    receiptNumber: 'RCP-2026-1001',
    recordedBy: 'Selam Tesfaye',
    recordedById: 'user-staff-1',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'inv-002',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    invoiceNumber: 'INV-2026-002',
    memberId: 'mem-104',
    memberName: 'Bethlehem Haile',
    type: 'MEMBERSHIP',
    items: [
      {
        id: 'item-inv-2',
        description: 'Annual VIP All-Access Membership Fee',
        unitPrice: 420,
        quantity: 1,
        subtotal: 420,
        category: 'PLAN',
      },
    ],
    subtotal: 420,
    discount: 0,
    amount: 420,
    paidAmount: 420,
    balance: 0,
    status: 'PAID',
    paymentMethod: 'BANK_TRANSFER',
    receiptId: 'rcp-002',
    receiptNumber: 'RCP-2026-1002',
    recordedBy: 'Selam Tesfaye',
    recordedById: 'user-staff-1',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    id: 'inv-003',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    invoiceNumber: 'INV-2026-003',
    memberId: 'mem-103',
    memberName: 'Elias Tadesse',
    type: 'MEMBERSHIP',
    items: [
      {
        id: 'item-inv-3',
        description: 'Monthly Standard Membership Fee',
        unitPrice: 45,
        quantity: 1,
        subtotal: 45,
        category: 'PLAN',
      },
    ],
    subtotal: 45,
    discount: 0,
    amount: 45,
    paidAmount: 20,
    balance: 25,
    status: 'PARTIAL',
    paymentMethod: 'CASH',
    receiptId: 'rcp-003',
    receiptNumber: 'RCP-2026-1003',
    recordedBy: 'Selam Tesfaye',
    recordedById: 'user-staff-1',
    createdAt: new Date(Date.now() - 65 * 86400000).toISOString(),
  },
];

const initialExpenses: Expense[] = [
  {
    id: 'exp-101',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    title: 'Electricity & HVAC Monthly Bill',
    category: 'UTILITIES',
    amount: 420.00,
    paymentMethod: 'BANK_TRANSFER',
    vendor: 'Addis Power Utility Corp',
    date: new Date(Date.now() - 5 * 86400000).toISOString(),
    loggedBy: 'Dawit Bekele',
    receiptNumber: 'EL-2026-8819',
    notes: 'Main gym floor air conditioning & lighting',
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: 'exp-102',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    title: 'Sanitary Water & Sauna Supply',
    category: 'UTILITIES',
    amount: 180.00,
    paymentMethod: 'BANK_TRANSFER',
    vendor: 'Municipal Water Services',
    date: new Date(Date.now() - 8 * 86400000).toISOString(),
    loggedBy: 'Dawit Bekele',
    receiptNumber: 'WT-2026-4412',
    notes: 'Locker room showers and steam room',
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
  {
    id: 'exp-103',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    title: 'Treadmill #2 Drive Belt Replacement',
    category: 'EQUIPMENT_REPAIR',
    amount: 150.00,
    paymentMethod: 'CASH',
    vendor: 'FitTech Equipment Repairs',
    date: new Date(Date.now() - 12 * 86400000).toISOString(),
    loggedBy: 'Kassahun Mengistu',
    receiptNumber: 'FT-9941',
    notes: 'Drive belt replacement and roller calibration',
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: 'exp-104',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    title: 'Staff Payroll - Front Desk & Maintenance Advance',
    category: 'PAYROLL',
    amount: 1200.00,
    paymentMethod: 'BANK_TRANSFER',
    vendor: 'Apex Staff Payroll',
    date: new Date(Date.now() - 14 * 86400000).toISOString(),
    loggedBy: 'Dawit Bekele',
    receiptNumber: 'PAY-2026-09A',
    notes: 'Bi-weekly front desk staff and cleaning team payroll',
    status: 'APPROVED',
    approvedBy: 'Dawit Bekele',
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: 'exp-105',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    title: 'POS Beverage & Protein Shake Restock',
    category: 'INVENTORY',
    amount: 285.00,
    paymentMethod: 'CARD',
    vendor: 'Optimum Nutrition Wholesale',
    date: new Date(Date.now() - 3 * 86400000).toISOString(),
    loggedBy: 'Selam Tesfaye',
    receiptNumber: 'INV-77312',
    notes: '48 bottles Isolate Whey Protein, 60 electrolyte drinks',
    status: 'APPROVED',
    approvedBy: 'Dawit Bekele',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: 'exp-106',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    title: 'Locker Room Towel Service & Cleaning Supplies',
    category: 'FACILITY_RENT',
    amount: 95.00,
    paymentMethod: 'CASH',
    vendor: 'CleanPro Facility Supplies',
    date: new Date(Date.now() - 2 * 86400000).toISOString(),
    loggedBy: 'Selam Tesfaye',
    receiptNumber: 'CP-1102',
    notes: 'Disinfectant sprays, microfiber gym towels, sanitizers',
    status: 'APPROVED',
    approvedBy: 'Dawit Bekele',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'exp-107',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    title: 'Commercial Sauna Heater Element Replacement',
    category: 'EQUIPMENT_REPAIR',
    amount: 1450.00,
    paymentMethod: 'BANK_TRANSFER',
    vendor: 'Finnish Sauna Tech Ltd',
    date: new Date(Date.now() - 1 * 86400000).toISOString(),
    loggedBy: 'Robel Haile (Floor Manager)',
    receiptNumber: 'REQ-2026-9901',
    notes: 'Requires Owner or Finance Officer approval ($1,450 exceeds $1,000 manager limit).',
    evidenceUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80',
    status: 'PENDING_APPROVAL',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
];

const initialEquipment: Equipment[] = [
  {
    id: 'eq-101',
    tenantId: 'tenant-1',
    name: 'LifeFitness Club Series+ Treadmill #1',
    category: 'CARDIO',
    serialNumber: 'LF-TM-2024-001',
    purchaseDate: '2024-03-15',
    purchaseCost: 3800.00,
    warrantyExpires: '2027-03-15',
    status: 'OPERATIONAL',
    condition: 'EXCELLENT',
    location: 'Cardio Deck - Station 1',
    lastServicedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    serviceHistory: [],
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
  },
  {
    id: 'eq-102',
    tenantId: 'tenant-1',
    name: 'LifeFitness Club Series+ Treadmill #2',
    category: 'CARDIO',
    serialNumber: 'LF-TM-2024-002',
    purchaseDate: '2024-03-15',
    purchaseCost: 3800.00,
    warrantyExpires: '2027-03-15',
    status: 'UNDER_MAINTENANCE',
    condition: 'POOR',
    location: 'Cardio Deck - Station 2',
    lastServicedAt: new Date(Date.now() - 12 * 86400000).toISOString(),
    serviceHistory: [],
    createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
  },
  {
    id: 'eq-103',
    tenantId: 'tenant-1',
    name: 'Concept2 Model D Indoor Rower',
    category: 'CARDIO',
    serialNumber: 'C2-ROW-88192',
    purchaseDate: '2024-06-10',
    purchaseCost: 1100.00,
    warrantyExpires: '2026-06-10',
    status: 'OPERATIONAL',
    condition: 'EXCELLENT',
    location: 'Rowing & HIIT Zone',
    lastServicedAt: new Date(Date.now() - 45 * 86400000).toISOString(),
    serviceHistory: [],
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
  },
  {
    id: 'eq-104',
    tenantId: 'tenant-1',
    name: 'Hammer Strength Iso-Lateral Leg Press',
    category: 'STRENGTH',
    serialNumber: 'HS-LP-44120',
    purchaseDate: '2023-11-20',
    purchaseCost: 4200.00,
    warrantyExpires: '2026-11-20',
    status: 'OPERATIONAL',
    condition: 'GOOD',
    location: 'Heavy Strength Arena',
    lastServicedAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    serviceHistory: [],
    createdAt: new Date(Date.now() - 250 * 86400000).toISOString(),
  },
  {
    id: 'eq-105',
    tenantId: 'tenant-1',
    name: 'Cable Crossover 8-Stack Tower',
    category: 'STRENGTH',
    serialNumber: 'CAB-8ST-109',
    purchaseDate: '2023-08-01',
    purchaseCost: 6500.00,
    warrantyExpires: '2025-08-01',
    status: 'OPERATIONAL',
    condition: 'GOOD',
    location: 'Cable & Functional Training',
    lastServicedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    serviceHistory: [
      {
        id: 'srv-1',
        ticketId: 'tkt-202',
        date: new Date(Date.now() - 3 * 86400000).toISOString(),
        description: 'Bearing repacked with high-grade synthetic grease. Cable inspected for frays (passed).',
        performedBy: 'Kassahun Mengistu',
        cost: 35.00,
      },
    ],
    createdAt: new Date(Date.now() - 300 * 86400000).toISOString(),
  },
  {
    id: 'eq-106',
    tenantId: 'tenant-1',
    name: 'Rogue Rubber Hex Dumbbell Set (5kg - 50kg)',
    category: 'FREE_WEIGHTS',
    serialNumber: 'ROG-DB-550',
    purchaseDate: '2024-01-10',
    purchaseCost: 2400.00,
    warrantyExpires: '2029-01-10',
    status: 'OPERATIONAL',
    condition: 'EXCELLENT',
    location: 'Free Weights Area',
    lastServicedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
    serviceHistory: [],
    createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
  },
];

const initialTickets: MaintenanceTicket[] = [
  {
    id: 'tkt-201',
    tenantId: 'tenant-1',
    equipmentId: 'eq-102',
    equipmentName: 'LifeFitness Club Series+ Treadmill #2',
    title: 'Drive belt slip & friction error at speed > 10 km/h',
    description: 'Member reported deck slipping under foot during interval sprint. Needs tensioning and belt lubrication.',
    priority: 'URGENT',
    severity: 'CRITICAL_SAFETY_HAZARD',
    status: 'IN_PROGRESS',
    reportedBy: 'Coach Marcus',
    reportedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    assigneeId: 'user-maint-1',
    assigneeName: 'Kassahun Mengistu',
    expectedCost: 150.00,
    statusHistory: [
      {
        status: 'OPEN',
        changedBy: 'Coach Marcus',
        changedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        notes: 'Member reported slipping belt during sprint.',
      },
      {
        status: 'IN_PROGRESS',
        changedBy: 'Kassahun Mengistu',
        changedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        notes: 'Disassembled motor cover, diagnosing tensioner assembly.',
      },
    ],
  },
  {
    id: 'tkt-202',
    tenantId: 'tenant-1',
    equipmentId: 'eq-105',
    equipmentName: 'Cable Crossover 8-Stack Tower',
    title: 'Top right high-pulley squeak & tension cable check',
    description: 'Replaced pulley bearing and lubricated guide rods. Cleaned weight plates.',
    priority: 'MEDIUM',
    severity: 'MINOR_DEFECT',
    status: 'RESOLVED',
    reportedBy: 'Selam Tesfaye',
    reportedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    assigneeId: 'user-maint-1',
    assigneeName: 'Kassahun Mengistu',
    resolvedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    resolvedBy: 'Kassahun Mengistu',
    resolutionNotes: 'Bearing repacked with high-grade synthetic grease. Cable inspected for frays (passed).',
    resolutionCost: 35.00,
    statusHistory: [
      {
        status: 'OPEN',
        changedBy: 'Selam Tesfaye',
        changedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        notes: 'Squeaking reported during cable flyes.',
      },
      {
        status: 'RESOLVED',
        changedBy: 'Kassahun Mengistu',
        changedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
        notes: 'Bearing repacked with grease, fully tested.',
      },
    ],
  },
];

const initialPTAssignments: PersonalTrainingAssignment[] = [
  {
    id: 'pta-101',
    tenantId: 'tenant-1',
    trainerId: 'user-trainer-1',
    trainerName: 'Coach Marcus',
    memberId: 'mem-101',
    memberName: 'Yonas Abraham',
    memberNumber: 'AF-1001',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    sessionsTotal: 12,
    sessionsRemaining: 8,
    status: 'ACTIVE',
    notes: 'Hypertrophy & progressive overload focus. 3 sessions per week.',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'pta-102',
    tenantId: 'tenant-1',
    trainerId: 'user-trainer-1',
    trainerName: 'Coach Marcus',
    memberId: 'mem-104',
    memberName: 'Bethlehem Haile',
    memberNumber: 'AF-1004',
    startDate: new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0],
    sessionsTotal: 24,
    sessionsRemaining: 22,
    status: 'ACTIVE',
    notes: 'VIP Athletic Conditioning & recovery program.',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const initialShifts: StaffShift[] = [
  {
    id: 'shift-301',
    tenantId: 'tenant-1',
    userId: 'user-staff-1',
    userName: 'Selam Tesfaye',
    userRole: 'RECEPTIONIST',
    shiftType: 'MORNING',
    date: new Date().toISOString().split('T')[0],
    startTime: '06:00',
    endTime: '14:00',
    status: 'CLOCKED_IN',
    clockedInAt: new Date().toISOString(),
    notes: 'Opening shift, till verified at $150 start float.',
  },
  {
    id: 'shift-302',
    tenantId: 'tenant-1',
    userId: 'user-trainer-1',
    userName: 'Coach Marcus',
    userRole: 'TRAINER',
    shiftType: 'MORNING',
    date: new Date().toISOString().split('T')[0],
    startTime: '07:00',
    endTime: '15:00',
    status: 'CLOCKED_IN',
    clockedInAt: new Date().toISOString(),
    notes: 'Morning HIIT boot camp and 3 scheduled 1-on-1 PT sessions.',
  },
  {
    id: 'shift-303',
    tenantId: 'tenant-1',
    userId: 'user-maint-1',
    userName: 'Kassahun Mengistu',
    userRole: 'MAINTENANCE_STAFF',
    shiftType: 'MORNING',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    status: 'SCHEDULED',
    notes: 'Facility safety audit and Treadmill #2 repair follow-up.',
  },
  {
    id: 'shift-304',
    tenantId: 'tenant-1',
    userId: 'user-owner-1',
    userName: 'Dawit Bekele',
    userRole: 'GYM_OWNER',
    shiftType: 'CUSTOM',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '18:00',
    status: 'SCHEDULED',
    notes: 'Vendor reconciliation and weekly inventory order.',
  },
];

const initialLeads: Lead[] = [
  {
    id: 'lead-401',
    tenantId: 'tenant-1',
    name: 'Samuel Kebede',
    phone: '+251 91 199 8877',
    email: 'samuel.k@outlook.com',
    source: 'TRIAL',
    interest: 'Annual VIP All-Access & Swimming',
    selectedPackage: 'Annual VIP All-Access',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    message: 'Interested in touring the Olympic lap pool and sauna suite.',
    notes: 'Trial booked for tomorrow 10am. Needs tour with coach.',
    status: 'NEW',
    createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
  },
  {
    id: 'lead-402',
    tenantId: 'tenant-1',
    name: 'Hanna Girma',
    phone: '+251 92 443 3221',
    email: 'hanna.g@gmail.com',
    source: 'REGISTER',
    interest: 'Quarterly Pro Membership',
    selectedPackage: 'Quarterly Pro',
    preferredDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
    message: 'Looking to start next week with locker assignment.',
    notes: 'Called on phone; confirmed registration date for Monday.',
    status: 'CONTACTED',
    createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
  },
  {
    id: 'lead-403',
    tenantId: 'tenant-1',
    name: 'Biniam Tadesse',
    phone: '+251 93 555 1234',
    email: 'biniam.t@yahoo.com',
    source: 'CONTACT',
    interest: 'Corporate Group Rates',
    message: 'Inquiring about company package for 15 employees.',
    notes: 'Sent corporate rate sheet via email.',
    status: 'CONTACTED',
    createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
  },
];

const initialNotifications: NotificationLog[] = [
  {
    id: 'notif-1',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    memberId: 'mem-102',
    memberName: 'Sara Girma',
    recipientContact: '+251 91 234 5678',
    channel: 'SMS',
    type: 'EXPIRING_SOON',
    title: 'Membership Renewal Reminder',
    message: 'Hello Sara, your gym membership will expire in 2 days. Renew today at Apex Fitness to continue your routine without interruption!',
    status: 'SENT',
    retryCount: 0,
    maxRetries: 3,
    sentAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    lastAttemptAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'notif-2',
    tenantId: 'tenant-1',
    branchId: 'branch-1-main',
    memberId: 'mem-103',
    memberName: 'Elias Tadesse',
    recipientContact: '+251 93 345 6789',
    channel: 'SMS',
    type: 'EXPIRED',
    title: 'Membership Expired',
    message: 'Hello Elias, your membership expired 5 days ago. Visit our reception or portal to reactivate.',
    status: 'OPTED_OUT',
    failureReason: 'Recipient has opted out of automated notifications',
    retryCount: 0,
    maxRetries: 3,
    createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    lastAttemptAt: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'notif-3',
    tenantId: 'tenant-1',
    branchId: 'branch-1-sarbet',
    memberId: 'mem-105',
    memberName: 'Michael Alemu',
    recipientContact: '+251 92 789 0123',
    channel: 'SMS',
    type: 'EXPIRING_SOON',
    title: 'Membership Renewal Notice',
    message: 'Hello Michael, your membership expires in 10 days.',
    status: 'FAILED',
    failureReason: 'SMS Gateway Timeout (Ethio Telecom SMPP 504)',
    retryCount: 1,
    maxRetries: 3,
    createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    lastAttemptAt: new Date(Date.now() - 1 * 3600000).toISOString(),
  },
];

const initialNotificationSettings: NotificationSettings[] = [
  {
    tenantId: 'tenant-1',
    renewalNoticeDaysBefore: [7, 3, 1],
    enableSms: true,
    enableEmail: true,
    enableInApp: true,
    maxRetryAttempts: 3,
    senderName: 'Apex Fitness Center',
    autoDispatchEnabled: true,
    lastRunAt: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    tenantId: 'tenant-2',
    renewalNoticeDaysBefore: [7, 3],
    enableSms: true,
    enableEmail: true,
    enableInApp: true,
    maxRetryAttempts: 3,
    senderName: 'Downtown Flagship',
    autoDispatchEnabled: false,
  },
];

// In-Memory Storage Container with Tenant Partitioning
class DataStorage {
  private isTestEnv = typeof process !== 'undefined' && !!process.env.VITEST;
  private tenants: Tenant[] = this.isTestEnv
    ? initialTenants.map((t) => ({ ...t }))
    : [initialTenants[0]];
  private branches: Branch[] = this.isTestEnv
    ? initialBranches.map((b) => ({ ...b }))
    : [initialBranches[0]];
  private users: User[] = this.isTestEnv
    ? initialUsers.map((u) => ({ ...u }))
    : initialUsers.filter((u) => u.role === 'OWNER');
  private plans: MembershipPlan[] = initialPlans.map((p) => ({ ...p }));
  private members: Member[] = this.isTestEnv
    ? initialMembers.map((m) => ({ ...m }))
    : [];
  private lockers: Locker[] = initialLockers.map((l) => ({ ...l }));
  private products: POSProduct[] = initialProducts.map((p) => ({ ...p }));
  private checkIns: CheckInLog[] = this.isTestEnv
    ? initialCheckIns.map((c) => ({ ...c }))
    : [];
  private invoices: Invoice[] = this.isTestEnv
    ? initialInvoices.map((i) => ({ ...i }))
    : [];
  private sales: POSSale[] = [];
  private expenses: Expense[] = this.isTestEnv
    ? initialExpenses.map((e) => ({ ...e }))
    : [];
  private equipment: Equipment[] = this.isTestEnv
    ? initialEquipment.map((eq) => ({ ...eq }))
    : [];
  private maintenanceTickets: MaintenanceTicket[] = this.isTestEnv
    ? initialTickets.map((t) => ({ ...t }))
    : [];
  private staffShifts: StaffShift[] = this.isTestEnv
    ? initialShifts.map((s) => ({ ...s }))
    : [];
  private leads: Lead[] = this.isTestEnv
    ? initialLeads.map((l) => ({ ...l }))
    : [];
  private auditEvents: AuditEvent[] = this.isTestEnv
    ? initialAuditEvents.map((a) => ({ ...a }))
    : [];
  private ptAssignments: PersonalTrainingAssignment[] = this.isTestEnv
    ? initialPTAssignments.map((p) => ({ ...p }))
    : [];
  private notifications: NotificationLog[] = this.isTestEnv
    ? initialNotifications.map((n) => ({ ...n }))
    : [];
  private notificationSettings: NotificationSettings[] = initialNotificationSettings.map((s) => ({
    ...s,
    renewalNoticeDaysBefore: [...(s.renewalNoticeDaysBefore || [7, 3, 1])],
  }));

  private receipts: Receipt[] = this.isTestEnv
    ? initialReceipts.map((r) => ({ ...r }))
    : [];
  private financialCorrections: FinancialCorrection[] = [];
  private paymentPolicies: Record<string, TenantPaymentPolicy> = {
    'tenant-1': {
      allowPartialActivation: true,
      minInitialPaymentPercent: 50,
      maxAllowedBalance: 100,
    },
    'tenant-2': {
      allowPartialActivation: false,
      minInitialPaymentPercent: 100,
      maxAllowedBalance: 0,
    },
  };

  private dataFilePath = typeof process !== 'undefined' && process.cwd
    ? (process.env.VITEST
        ? ''
        : process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME
        ? path.join('/tmp', 'gymos-store.json')
        : path.join(process.cwd(), 'data', 'gymos-store.json'))
    : '';

  private lastDiskMtime = 0;

  constructor() {
    this.loadFromDisk();
    this.loadFromPostgres();
  }

  setDataFilePath(customPath: string) {
    this.dataFilePath = customPath;
    this.loadFromDisk();
  }

  async loadFromPostgres() {
    try {
      if (!process.env.DATABASE_URL || process.env.VITEST) return;
      const [dbTenants, dbUsers, dbPlans, dbMembers, dbInvoices, dbReceipts, dbLockers] = await Promise.all([
        prisma.tenant.findMany(),
        prisma.user.findMany(),
        prisma.membershipPlan.findMany(),
        prisma.member.findMany(),
        prisma.invoice.findMany(),
        prisma.receipt.findMany(),
        prisma.locker.findMany(),
      ]);

      if (dbTenants && dbTenants.length) {
        this.tenants = dbTenants.map((t) => ({
          ...t,
          logo: t.logo || undefined,
          planTier: t.planTier as any,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt ? t.updatedAt.toISOString() : undefined,
        }));

        if (dbUsers) {
          this.users = dbUsers.map((u) => ({
            ...u,
            role: u.role as any,
            phone: u.phone || undefined,
            avatarUrl: u.avatarUrl || undefined,
            isActive: true,
            status: 'ACTIVE' as const,
            createdAt: u.createdAt.toISOString(),
          }));
        }

        if (dbPlans) {
          this.plans = dbPlans.map((p) => ({
            ...p,
            admissionFee: p.admissionFee ?? 0,
          }));
        }

        this.members = (dbMembers || []).map((m) => ({
          ...m,
          gender: (m.gender as any) || undefined,
          email: m.email || undefined,
          address: m.address || undefined,
          dateOfBirth: m.dateOfBirth?.toISOString(),
          joinDate: m.joinDate.toISOString(),
          emergencyContactName: m.emergencyContactName || undefined,
          emergencyContactRelationship: m.emergencyContactRelationship || undefined,
          emergencyContactPhone: m.emergencyContactPhone || undefined,
          medicalNotes: m.medicalNotes || undefined,
          consentDate: m.consentDate?.toISOString(),
          consentPolicyVersion: m.consentPolicyVersion || 'v1.0',
          profileImage: m.profileImage || undefined,
          photoIdReference: m.photoIdReference || undefined,
          notes: m.notes || undefined,
          currentPlanId: m.currentPlanId || undefined,
          currentPlanName: m.currentPlanName || undefined,
          subscriptionStart: m.subscriptionStart?.toISOString(),
          subscriptionEnd: m.subscriptionEnd?.toISOString(),
          assignedLockerNumber: m.assignedLockerNumber || undefined,
          status: m.status as any,
        }));

        this.invoices = (dbInvoices || []).map((inv) => ({
          ...inv,
          type: inv.type as any,
          status: inv.status as any,
          paymentMethod: inv.paymentMethod as any,
          memberId: inv.memberId || undefined,
          subtotal: inv.subtotal ?? undefined,
          discount: inv.discount ?? undefined,
          discountReason: inv.discountReason || undefined,
          tax: inv.tax ?? undefined,
          receiptId: inv.receiptId || undefined,
          receiptNumber: inv.receiptNumber || undefined,
          recordedBy: inv.recordedBy || undefined,
          recordedById: inv.recordedById || undefined,
          notes: inv.notes || undefined,
          items: inv.items ? (inv.items as any) : undefined,
          createdAt: inv.createdAt.toISOString(),
          dueDate: inv.dueDate?.toISOString(),
        }));

        this.receipts = (dbReceipts || []).map((r) => ({
          ...r,
          memberId: r.memberId || undefined,
          paymentMethod: r.paymentMethod as any,
          paymentReference: r.paymentReference || undefined,
          amountPaid: r.amountPaid ?? r.amount,
          items: r.items ? (r.items as any) : undefined,
          notes: r.notes || undefined,
          createdAt: r.createdAt.toISOString(),
        }));

        this.lockers = (dbLockers || []).map((l) => ({
          ...l,
          zone: (l.zone as any) || 'Main',
          status: l.status as any,
          memberId: l.memberId || undefined,
          memberName: l.memberName || undefined,
          memberPhone: l.memberPhone || undefined,
          assignedAt: l.assignedAt?.toISOString(),
          expiresAt: l.expiresAt?.toISOString(),
        }));

        // Reset demo collections when live database is connected
        this.checkIns = [];
        this.expenses = [];
        this.sales = [];
        this.staffShifts = [];
        this.leads = [];
        this.ptAssignments = [];
        this.maintenanceTickets = [];
      }
    } catch (e) {
      console.warn('Could not load from PostgreSQL:', e);
    }
  }

  async syncToPostgres() {
    try {
      if (!process.env.DATABASE_URL || process.env.VITEST) return;
      for (const m of this.members) {
        await prisma.member.upsert({
          where: { id: m.id },
          update: {
            memberNumber: m.memberNumber,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phone: m.phone,
            gender: m.gender,
            dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
            address: m.address,
            joinDate: m.joinDate ? new Date(m.joinDate) : new Date(),
            emergencyContactName: m.emergencyContactName,
            emergencyContactRelationship: m.emergencyContactRelationship,
            emergencyContactPhone: m.emergencyContactPhone,
            medicalNotes: m.medicalNotes,
            consentGiven: m.consentGiven !== false,
            consentDate: m.consentDate ? new Date(m.consentDate) : null,
            consentPolicyVersion: m.consentPolicyVersion || 'v1.0',
            qrCodeToken: m.qrCodeToken,
            profileImage: m.profileImage,
            photoIdReference: m.photoIdReference,
            notes: m.notes,
            status: m.status || 'ACTIVE',
            currentPlanId: m.currentPlanId,
            currentPlanName: m.currentPlanName,
            subscriptionStart: m.subscriptionStart ? new Date(m.subscriptionStart) : null,
            subscriptionEnd: m.subscriptionEnd ? new Date(m.subscriptionEnd) : null,
            daysRemaining: m.daysRemaining ?? 0,
            dueBalance: m.dueBalance || 0,
            assignedLockerNumber: m.assignedLockerNumber,
          },
          create: {
            id: m.id,
            tenantId: m.tenantId,
            memberNumber: m.memberNumber,
            firstName: m.firstName,
            lastName: m.lastName,
            email: m.email,
            phone: m.phone,
            gender: m.gender,
            dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
            address: m.address,
            joinDate: m.joinDate ? new Date(m.joinDate) : new Date(),
            emergencyContactName: m.emergencyContactName,
            emergencyContactRelationship: m.emergencyContactRelationship,
            emergencyContactPhone: m.emergencyContactPhone,
            medicalNotes: m.medicalNotes,
            consentGiven: m.consentGiven !== false,
            consentDate: m.consentDate ? new Date(m.consentDate) : null,
            consentPolicyVersion: m.consentPolicyVersion || 'v1.0',
            qrCodeToken: m.qrCodeToken,
            profileImage: m.profileImage,
            photoIdReference: m.photoIdReference,
            notes: m.notes,
            status: m.status || 'ACTIVE',
            currentPlanId: m.currentPlanId,
            currentPlanName: m.currentPlanName,
            subscriptionStart: m.subscriptionStart ? new Date(m.subscriptionStart) : null,
            subscriptionEnd: m.subscriptionEnd ? new Date(m.subscriptionEnd) : null,
            daysRemaining: m.daysRemaining ?? 0,
            dueBalance: m.dueBalance || 0,
            assignedLockerNumber: m.assignedLockerNumber,
          },
        }).catch(() => {});
      }

      for (const u of this.users) {
        await prisma.user.upsert({
          where: { id: u.id },
          update: { name: u.name, email: u.email, role: u.role, phone: u.phone },
          create: { id: u.id, tenantId: u.tenantId, name: u.name, email: u.email, role: u.role, phone: u.phone, password: 'password123' },
        }).catch(() => {});
      }

      for (const inv of this.invoices) {
        await prisma.invoice.upsert({
          where: { id: inv.id },
          update: {
            invoiceNumber: inv.invoiceNumber,
            amount: inv.amount,
            paidAmount: inv.paidAmount,
            balance: inv.balance || 0,
            subtotal: inv.subtotal,
            discount: inv.discount,
            discountReason: inv.discountReason,
            tax: inv.tax,
            receiptId: inv.receiptId,
            receiptNumber: inv.receiptNumber,
            recordedBy: inv.recordedBy,
            recordedById: inv.recordedById,
            notes: inv.notes,
            items: inv.items ? JSON.parse(JSON.stringify(inv.items)) : undefined,
            status: inv.status,
            paymentMethod: inv.paymentMethod,
          },
          create: {
            id: inv.id,
            tenantId: inv.tenantId,
            invoiceNumber: inv.invoiceNumber,
            memberId: inv.memberId,
            memberName: inv.memberName,
            type: inv.type,
            amount: inv.amount,
            paidAmount: inv.paidAmount,
            balance: inv.balance || 0,
            subtotal: inv.subtotal,
            discount: inv.discount,
            discountReason: inv.discountReason,
            tax: inv.tax,
            receiptId: inv.receiptId,
            receiptNumber: inv.receiptNumber,
            recordedBy: inv.recordedBy,
            recordedById: inv.recordedById,
            notes: inv.notes,
            items: inv.items ? JSON.parse(JSON.stringify(inv.items)) : undefined,
            status: inv.status,
            paymentMethod: inv.paymentMethod,
          },
        }).catch(() => {});
      }

      for (const r of this.receipts) {
        await prisma.receipt.upsert({
          where: { id: r.id },
          update: {
            receiptNumber: r.receiptNumber,
            amount: r.amount,
            amountPaid: r.amountPaid || r.amount,
            paymentMethod: r.paymentMethod,
            paymentReference: r.paymentReference,
            items: r.items ? JSON.parse(JSON.stringify(r.items)) : undefined,
          },
          create: {
            id: r.id,
            tenantId: r.tenantId,
            receiptNumber: r.receiptNumber,
            invoiceId: r.invoiceId,
            invoiceNumber: r.invoiceNumber,
            memberId: r.memberId,
            memberName: r.memberName,
            amount: r.amount,
            amountPaid: r.amountPaid || r.amount,
            paymentMethod: r.paymentMethod,
            paymentReference: r.paymentReference,
            receivedBy: r.receivedBy || 'Staff',
            receivedById: r.receivedById || 'user-staff-1',
            items: r.items ? JSON.parse(JSON.stringify(r.items)) : undefined,
            notes: r.notes,
          },
        }).catch(() => {});
      }
    } catch {
      // Ignore background sync errors
    }
  }

  syncFromDiskIfModified() {
    if (process.env.VITEST) return;
    try {
      if (this.dataFilePath && fs.existsSync(this.dataFilePath)) {
        const stats = fs.statSync(this.dataFilePath);
        if (stats.mtimeMs > this.lastDiskMtime) {
          this.loadFromDisk();
        }
      }
    } catch {
      // Ignore read errors
    }
  }

  private loadFromDisk() {
    if (this.isTestEnv) return;
    try {
      const fallbackPath =
        typeof process !== 'undefined' && process.cwd
          ? path.join(process.cwd(), 'data', 'gymos-store.json')
          : '';
      const readPath =
        this.dataFilePath && fs.existsSync(this.dataFilePath)
          ? this.dataFilePath
          : fallbackPath && fs.existsSync(fallbackPath)
            ? fallbackPath
            : null;

      if (readPath && fs.existsSync(readPath)) {
        const stats = fs.statSync(readPath);
        this.lastDiskMtime = stats.mtimeMs;
        const raw = fs.readFileSync(readPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.tenants)) this.tenants = parsed.tenants;
        if (Array.isArray(parsed.branches)) this.branches = parsed.branches;
        if (Array.isArray(parsed.users)) this.users = parsed.users;
        if (Array.isArray(parsed.plans)) this.plans = parsed.plans;
        if (Array.isArray(parsed.members)) this.members = parsed.members;
        if (Array.isArray(parsed.lockers)) this.lockers = parsed.lockers;
        if (Array.isArray(parsed.products)) this.products = parsed.products;
        if (Array.isArray(parsed.checkIns)) this.checkIns = parsed.checkIns;
        if (Array.isArray(parsed.invoices)) this.invoices = parsed.invoices;
        if (Array.isArray(parsed.receipts)) this.receipts = parsed.receipts;
        if (Array.isArray(parsed.financialCorrections)) this.financialCorrections = parsed.financialCorrections;
        if (parsed.paymentPolicies && typeof parsed.paymentPolicies === 'object') this.paymentPolicies = parsed.paymentPolicies;
        if (Array.isArray(parsed.sales)) this.sales = parsed.sales;
        if (Array.isArray(parsed.expenses)) this.expenses = parsed.expenses;
        if (Array.isArray(parsed.equipment)) this.equipment = parsed.equipment;
        if (Array.isArray(parsed.maintenanceTickets)) this.maintenanceTickets = parsed.maintenanceTickets;
        if (Array.isArray(parsed.staffShifts)) this.staffShifts = parsed.staffShifts;
        if (Array.isArray(parsed.leads)) this.leads = parsed.leads;
        if (Array.isArray(parsed.auditEvents)) this.auditEvents = parsed.auditEvents;
        if (Array.isArray(parsed.ptAssignments)) this.ptAssignments = parsed.ptAssignments;
      }
    } catch (e) {
      console.warn('Could not load local snapshot:', e);
    }
  }

  private persist() {
    if (!this.dataFilePath || (this.isTestEnv && this.dataFilePath.endsWith('gymos-store.json'))) return;
    try {
        const dir = path.dirname(this.dataFilePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const data = {
          tenants: this.tenants,
          branches: this.branches,
          users: this.users,
          plans: this.plans,
          members: this.members,
          lockers: this.lockers,
          products: this.products,
          checkIns: this.checkIns,
          invoices: this.invoices,
          receipts: this.receipts,
          financialCorrections: this.financialCorrections,
          paymentPolicies: this.paymentPolicies,
          sales: this.sales,
          expenses: this.expenses,
          equipment: this.equipment,
          maintenanceTickets: this.maintenanceTickets,
          staffShifts: this.staffShifts,
          leads: this.leads,
          auditEvents: this.auditEvents,
          ptAssignments: this.ptAssignments,
        };
        const tmpPath = `${this.dataFilePath}.${process.pid}.${Date.now()}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
        fs.renameSync(tmpPath, this.dataFilePath);
        if (fs.existsSync(this.dataFilePath)) {
          const stats = fs.statSync(this.dataFilePath);
          this.lastDiskMtime = stats.mtimeMs;
        }
      } catch (e) {
        console.warn('Could not persist local snapshot:', e);
      }

    try {
      this.syncToPostgres();
    } catch (e) {
      console.warn('Could not sync to Postgres:', e);
    }
  }

  resetDemoData() {
    this.tenants = initialTenants.map((t) => ({ ...t }));
    this.branches = initialBranches.map((b) => ({ ...b }));
    this.users = initialUsers.map((u) => ({ ...u }));
    this.plans = initialPlans.map((p) => ({ ...p }));
    this.members = this.isTestEnv ? initialMembers.map((m) => ({ ...m })) : [];
    this.lockers = initialLockers.map((l) => ({ ...l }));
    this.products = initialProducts.map((p) => ({ ...p }));
    this.checkIns = this.isTestEnv ? initialCheckIns.map((c) => ({ ...c })) : [];
    this.invoices = this.isTestEnv ? initialInvoices.map((i) => ({ ...i })) : [];
    this.receipts = this.isTestEnv ? initialReceipts.map((r) => ({ ...r })) : [];
    this.financialCorrections = [];
    this.paymentPolicies = {
      'tenant-1': {
        allowPartialActivation: true,
        minInitialPaymentPercent: 50,
        maxAllowedBalance: 100,
      },
      'tenant-2': {
        allowPartialActivation: false,
        minInitialPaymentPercent: 100,
        maxAllowedBalance: 0,
      },
    };
    this.sales = [];
    this.expenses = this.isTestEnv ? initialExpenses.map((e) => ({ ...e })) : [];
    this.equipment = this.isTestEnv ? initialEquipment.map((eq) => ({ ...eq })) : [];
    this.maintenanceTickets = this.isTestEnv ? initialTickets.map((t) => ({ ...t })) : [];
    this.staffShifts = this.isTestEnv ? initialShifts.map((s) => ({ ...s })) : [];
    this.leads = this.isTestEnv ? initialLeads.map((l) => ({ ...l })) : [];
    this.auditEvents = this.isTestEnv ? initialAuditEvents.map((a) => ({ ...a })) : [];
    this.ptAssignments = this.isTestEnv ? initialPTAssignments.map((p) => ({ ...p })) : [];
    this.notifications = this.isTestEnv ? initialNotifications.map((n) => ({ ...n })) : [];
    this.notificationSettings = initialNotificationSettings.map((s) => ({
      ...s,
      renewalNoticeDaysBefore: [...(s.renewalNoticeDaysBefore || [7, 3, 1])],
    }));
    this.lastDiskMtime = 0;
    try {
      if (this.dataFilePath && fs.existsSync(this.dataFilePath)) {
        fs.unlinkSync(this.dataFilePath);
      }
    } catch (e) {
      // ignore
    }
  }

  // ================= TENANTS =================
  getTenants(): Tenant[] {
    return this.tenants;
  }

  getTenantById(id: string): Tenant | undefined {
    return this.tenants.find((t) => t.id === id || t.slug === id);
  }

  createTenant(data: Omit<Tenant, 'id' | 'createdAt'>): Tenant {
    const id = `tenant-${Date.now()}`;
    const newTenant: Tenant = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
    };
    this.tenants.push(newTenant);

    // Auto-create default basic plans for the new gym
    const defaultPlan: MembershipPlan = {
      id: `plan-${id}-monthly`,
      tenantId: id,
      name: 'Standard Monthly',
      description: 'Full gym floor access',
      durationDays: 30,
      price: 50,
      admissionFee: 10,
      maxVisitsPerDay: 1,
      includesClasses: false,
      color: '#3B82F6',
      isActive: true,
    };
    this.plans.push(defaultPlan);
    this.persist();

    return newTenant;
  }

  updateTenant(id: string, updates: Partial<Tenant>): Tenant | undefined {
    const idx = this.tenants.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    this.tenants[idx] = { ...this.tenants[idx], ...updates };
    this.persist();
    return this.tenants[idx];
  }

  // ================= USERS & AUTH =================
  getUsers(tenantId?: string): User[] {
    this.syncFromDiskIfModified();
    if (!tenantId) return this.users;
    return this.users.filter((u) => u.tenantId === tenantId || u.role === 'SUPER_ADMIN');
  }

  getUserById(tenantIdOrUserId: string, userId?: string): User | undefined {
    this.syncFromDiskIfModified();
    if (!userId) {
      return this.users.find((u) => u.id === tenantIdOrUserId);
    }
    return this.users.find((u) => u.id === userId && (u.tenantId === tenantIdOrUserId || u.role === 'SUPER_ADMIN'));
  }

  getBranches(tenantId: string): Branch[] {
    return this.branches.filter((b) => b.tenantId === tenantId);
  }

  // ================= AUDIT LOGS (IMMUTABLE) =================
  recordAuditEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const auditEvent: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    // Append-only, never mutated or deleted
    this.auditEvents.unshift(auditEvent);
    this.persist();
    return auditEvent;
  }

  getAuditEvents(
    tenantId: string,
    filters?: { actorId?: string; action?: string; entityType?: string }
  ): AuditEvent[] {
    return this.auditEvents.filter((e) => {
      if (e.tenantId !== tenantId) return false;
      if (filters?.actorId && e.actorId !== filters.actorId) return false;
      if (filters?.action && e.action !== filters.action) return false;
      if (filters?.entityType && e.entityType !== filters.entityType) return false;
      return true;
    });
  }

  getAuditLogs(
    tenantId: string,
    filters?: { actorId?: string; action?: string; entityType?: string }
  ): AuditEvent[] {
    return this.getAuditEvents(tenantId, filters);
  }

  updateUserRole(userId: string, newRole: UserRole, actorId: string): User | null {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return null;
    const oldRole = user.role;
    user.role = newRole;

    const actor = this.users.find((u) => u.id === actorId);
    this.recordAuditEvent({
      tenantId: user.tenantId,
      actorId: actorId,
      actorName: actor?.name || 'Administrator',
      actorRole: actor?.role || 'SUPER_ADMIN',
      action: 'ROLE_CHANGE',
      entityType: 'USER',
      entityId: user.id,
      details: `Changed role of user '${user.name}' (${user.email}) from ${oldRole} to ${newRole}`,
    });
    this.persist();
    return user;
  }

  createUser(tenantId: string, data: { name: string; email: string; role: User['role']; phone?: string }): User {
    const newUser: User = {
      id: `user-${Date.now()}`,
      tenantId,
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      isActive: true,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(tenantId: string, userId: string, updates: Partial<User>): User | undefined {
    const idx = this.users.findIndex((u) => u.id === userId && (u.tenantId === tenantId || u.role === 'SUPER_ADMIN'));
    if (idx === -1) return undefined;
    this.users[idx] = { ...this.users[idx], ...updates };
    this.persist();
    return this.users[idx];
  }

  toggleUserStatus(tenantId: string, userId: string, isActive: boolean): User | undefined {
    const idx = this.users.findIndex((u) => u.id === userId && (u.tenantId === tenantId || u.role === 'SUPER_ADMIN'));
    if (idx === -1) return undefined;
    this.users[idx].isActive = isActive;
    this.users[idx].status = isActive ? 'ACTIVE' : 'DEACTIVATED';
    this.persist();
    return this.users[idx];
  }

  deleteUser(tenantId: string, userId: string): boolean {
    const initialLen = this.users.length;
    this.users = this.users.filter((u) => !(u.id === userId && u.tenantId === tenantId));
    this.persist();
    return this.users.length < initialLen;
  }

  verifyCredentials(email: string, password?: string): { user?: User; error?: string } | null {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        (u.role === 'OWNER' &&
          (cleanEmail === 'owner@mfitnessgym.com' ||
            cleanEmail === 'dawit@mfitnessgym.com' ||
            cleanEmail === 'dawit@apexfitness.com'))
    );
    if (user) {
      if (user.isActive === false || user.status === 'DEACTIVATED') {
        return { error: 'ACCOUNT_DEACTIVATED' };
      }
      return { user };
    }

    // Check if a registered member matches by email, memberNumber, or phone
    const member = this.members.find(
      (m) =>
        (m.email && m.email.toLowerCase() === cleanEmail) ||
        m.memberNumber.toLowerCase() === cleanEmail ||
        (m.phone && m.phone.replace(/[^0-9]/g, '') === cleanEmail.replace(/[^0-9]/g, ''))
    );

    if (member) {
      const memberUser: User = {
        id: `user-${member.id}`,
        tenantId: member.tenantId,
        name: `${member.firstName} ${member.lastName}`,
        email: member.email || `${member.memberNumber.toLowerCase()}@gymos.io`,
        role: 'MEMBER',
        phone: member.phone,
        isActive: member.status !== 'EXPIRED',
        status: 'ACTIVE',
        createdAt: member.joinDate || new Date().toISOString(),
      };

      if (!this.users.some((u) => u.id === memberUser.id)) {
        this.users.push(memberUser);
        this.persist();
      }

      return { user: memberUser };
    }

    return null;
  }

  // ================= PLANS =================
  getPlans(tenantId: string): MembershipPlan[] {
    return this.plans.filter((p) => p.tenantId === tenantId);
  }

  createPlan(tenantId: string, plan: Omit<MembershipPlan, 'id' | 'tenantId'>): MembershipPlan {
    const newPlan: MembershipPlan = {
      ...plan,
      id: `plan-${Date.now()}`,
      tenantId,
    };
    this.plans.push(newPlan);
    this.persist();
    return newPlan;
  }

  updatePlan(tenantId: string, planId: string, updates: Partial<MembershipPlan>): MembershipPlan | undefined {
    const idx = this.plans.findIndex((p) => p.id === planId && p.tenantId === tenantId);
    if (idx === -1) return undefined;
    this.plans[idx] = { ...this.plans[idx], ...updates };
    this.persist();
    return this.plans[idx];
  }

  deletePlan(tenantId: string, planId: string): boolean {
    const initialLen = this.plans.length;
    this.plans = this.plans.filter((p) => !(p.id === planId && p.tenantId === tenantId));
    this.persist();
    return this.plans.length < initialLen;
  }

  // ================= MEMBERS =================
  getMembers(tenantId: string, query?: string, status?: string): Member[] {
    this.syncFromDiskIfModified();
    let list = this.members.filter((m) => m.tenantId === tenantId);

    // Refresh remaining days & auto-update statuses dynamically
    const now = Date.now();
    list = list.map((m) => {
      if (m.subscriptionEnd) {
        const endMs = new Date(m.subscriptionEnd).getTime();
        const diffDays = Math.ceil((endMs - now) / 86400000);
        m.daysRemaining = diffDays;
        if (m.status !== 'FROZEN' && m.status !== 'CANCELLED' && m.status !== 'SUSPENDED') {
          if (diffDays < 0) {
            m.status = 'EXPIRED';
          } else if (diffDays <= 3) {
            m.status = 'EXPIRING_SOON';
          } else {
            m.status = 'ACTIVE';
          }
        }
      }
      return m;
    });

    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(
        (m) =>
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q) ||
          m.memberNumber.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          (m.email && m.email.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'ALL') {
      list = list.filter((m) => m.status === status);
    }

    return list;
  }

  checkDuplicateMember(
    tenantId: string,
    check: { phone?: string; email?: string; excludeMemberId?: string }
  ): {
    hasDuplicate: boolean;
    isDuplicate: boolean;
    conflictingField?: 'phone' | 'email';
    existingMember?: Member;
    duplicatePhone?: Member;
    duplicateEmail?: Member;
    message?: string;
  } {
    const cleanPhone = check.phone ? check.phone.replace(/[\s\-\(\)]/g, '') : '';
    const cleanEmail = check.email ? check.email.trim().toLowerCase() : '';
    const members = this.members.filter((m) => m.tenantId === tenantId && m.id !== check.excludeMemberId);

    const duplicatePhone = cleanPhone
      ? members.find((m) => m.phone && m.phone.replace(/[\s\-\(\)]/g, '') === cleanPhone)
      : undefined;
    const duplicateEmail = cleanEmail
      ? members.find((m) => m.email && m.email.trim().toLowerCase() === cleanEmail)
      : undefined;

    const hasDuplicate = !!(duplicatePhone || duplicateEmail);
    const conflictingField = duplicatePhone ? 'phone' : duplicateEmail ? 'email' : undefined;
    const existingMember = duplicatePhone || duplicateEmail;
    let message: string | undefined;
    if (duplicatePhone && duplicateEmail) {
      message = `A member profile already exists with phone number (${check.phone}) and email (${check.email}).`;
    } else if (duplicatePhone) {
      message = `A member profile already exists with phone number (${check.phone}): ${duplicatePhone.firstName} ${duplicatePhone.lastName} (${duplicatePhone.memberNumber}).`;
    } else if (duplicateEmail) {
      message = `A member profile already exists with email (${check.email}): ${duplicateEmail.firstName} ${duplicateEmail.lastName} (${duplicateEmail.memberNumber}).`;
    }

    return {
      hasDuplicate,
      isDuplicate: hasDuplicate,
      conflictingField,
      existingMember,
      duplicatePhone,
      duplicateEmail,
      message,
    };
  }

  maskMemberMedicalData(member: Member, viewerRole?: UserRole): Member {
    if (!viewerRole) return member;
    const restrictedRoles: UserRole[] = ['RECEPTIONIST', 'FINANCE_OFFICER', 'MAINTENANCE_STAFF'];
    if (restrictedRoles.includes(viewerRole)) {
      return {
        ...member,
        medicalNotes: member.medicalNotes ? '[RESTRICTED]' : undefined,
        photoIdReference: member.photoIdReference ? '[RESTRICTED]' : undefined,
      };
    }
    return member;
  }

  getPaymentPolicy(tenantId: string): TenantPaymentPolicy {
    return (
      this.paymentPolicies[tenantId] || {
        allowPartialActivation: true,
        minInitialPaymentPercent: 50,
        maxAllowedBalance: 100,
      }
    );
  }

  setPaymentPolicy(tenantId: string, policy: Partial<TenantPaymentPolicy>): TenantPaymentPolicy {
    const existing = this.getPaymentPolicy(tenantId);
    this.paymentPolicies[tenantId] = { ...existing, ...policy };
    this.persist();
    return this.paymentPolicies[tenantId];
  }

  getMemberById(tenantIdOrMemberId: string, maybeMemberId?: string, viewerRole?: UserRole): Member | undefined {
    this.syncFromDiskIfModified();
    let tenantId: string | undefined;
    let memberId: string;
    let role: UserRole | undefined = viewerRole;

    if (maybeMemberId) {
      tenantId = tenantIdOrMemberId;
      memberId = maybeMemberId;
    } else {
      memberId = tenantIdOrMemberId;
    }

    const member = this.members.find(
      (m) =>
        (m.id === memberId || m.memberNumber === memberId || m.qrCodeToken === memberId) &&
        (!tenantId || m.tenantId === tenantId)
    );
    if (!member) return undefined;
    return role ? this.maskMemberMedicalData(member, role) : member;
  }

  generateOpaqueQRToken(memberNumber: string): string {
    const randomHex = Math.random().toString(36).substring(2, 10).toUpperCase() + Math.random().toString(36).substring(2, 10).toUpperCase();
    return `QR-${memberNumber}-${randomHex}`;
  }

  createMember(
    tenantId: string,
    data: Omit<Member, 'id' | 'tenantId' | 'memberNumber' | 'qrCodeToken' | 'status' | 'daysRemaining' | 'dueBalance'> & {
      planId?: string;
      consentGiven?: boolean;
      dueBalance?: number;
    },
    options?: {
      allowDuplicateOverride?: boolean;
      actor?: { id: string; name: string; role: string };
      discount?: number;
      discountReason?: string;
      paymentMethod?: PaymentMethod;
      paidAmount?: number;
    }
  ): Member & { invoice?: Invoice; receipt?: Receipt } {
    this.syncFromDiskIfModified();
    // 1. Duplicate check
    const dupCheck = this.checkDuplicateMember(tenantId, {
      phone: data.phone,
      email: data.email,
    });
    if (dupCheck.hasDuplicate && !options?.allowDuplicateOverride) {
      throw new Error(dupCheck.message || 'Duplicate member detected with same phone or email');
    }

    // 2. Consent check
    if (data.consentGiven === false) {
      throw new Error('Member consent declaration is required for registration and activation.');
    }
    const consentGiven = data.consentGiven !== undefined ? data.consentGiven : true;
    const consentDate = data.consentDate || new Date().toISOString();
    const consentPolicyVersion = data.consentPolicyVersion || 'v1.0';

    const count = this.members.filter((m) => m.tenantId === tenantId).length + 1;
    const tenant = this.getTenantById(tenantId);
    const prefix = tenant ? tenant.name.substring(0, 2).toUpperCase() : 'GM';
    const memberNumber = `${prefix}-${1000 + count}`;
    const qrCodeToken = this.generateOpaqueQRToken(memberNumber);

    let currentPlanName: string | undefined;
    let subscriptionStart: string | undefined;
    let subscriptionEnd: string | undefined;
    let daysRemaining = 0;
    let status: MemberStatus = 'ACTIVE';
    let invoice: Invoice | undefined;
    let receipt: Receipt | undefined;
    const memberId = `mem-${Date.now()}`;

    if (data.planId) {
      const plan = this.plans.find((p) => p.id === data.planId && p.tenantId === tenantId);
      if (plan) {
        currentPlanName = plan.name;
        subscriptionStart = data.subscriptionStart || new Date().toISOString();
        const end = new Date(subscriptionStart);
        end.setDate(end.getDate() + plan.durationDays);
        subscriptionEnd = data.subscriptionEnd || end.toISOString();
        daysRemaining = Math.ceil((new Date(subscriptionEnd).getTime() - Date.now()) / 86400000);

        const items: InvoiceLineItem[] = [
          {
            id: `item-${Date.now()}-1`,
            description: `${plan.name} Membership Fee`,
            unitPrice: plan.price,
            quantity: 1,
            subtotal: plan.price,
            category: 'PLAN',
          },
        ];

        let subtotal = plan.price;
        if (plan.admissionFee && plan.admissionFee > 0) {
          items.push({
            id: `item-${Date.now()}-2`,
            description: 'Admission / Registration Fee',
            unitPrice: plan.admissionFee,
            quantity: 1,
            subtotal: plan.admissionFee,
            category: 'FEE',
          });
          subtotal += plan.admissionFee;
        }

        const discount = Math.max(0, options?.discount || 0);
        const totalAmount = Math.max(0, subtotal - discount);
        const paymentMethod: PaymentMethod = options?.paymentMethod || 'CASH';

        // Calculate paid amount and balance
        let paidAmount = totalAmount;
        if (options?.paidAmount !== undefined) {
          paidAmount = Math.max(0, options.paidAmount);
        } else if (data.dueBalance !== undefined && data.dueBalance > 0) {
          paidAmount = Math.max(0, totalAmount - data.dueBalance);
        }
        const balance = Math.max(0, totalAmount - paidAmount);

        // Evaluate activation policy
        const policy = this.getPaymentPolicy(tenantId);
        if (paidAmount >= totalAmount) {
          status = 'ACTIVE';
        } else if (
          policy.allowPartialActivation &&
          balance <= policy.maxAllowedBalance &&
          (totalAmount === 0 || (paidAmount / totalAmount) >= (policy.minInitialPaymentPercent / 100))
        ) {
          status = 'ACTIVE';
        } else {
          status = 'SUSPENDED'; // Not activated due to payment policy
        }

        const invoiceId = `inv-${Date.now()}`;
        const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const newInvoice: Invoice = {
          id: invoiceId,
          tenantId,
          invoiceNumber,
          memberId,
          memberName: `${data.firstName} ${data.lastName}`,
          type: 'MEMBERSHIP',
          items,
          subtotal,
          discount,
          discountReason: options?.discountReason,
          amount: totalAmount,
          paidAmount,
          balance,
          status: balance === 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'UNPAID',
          paymentMethod,
          recordedBy: options?.actor?.name || 'Reception Staff',
          recordedById: options?.actor?.id || 'user-staff-1',
          createdAt: new Date().toISOString(),
        };
        invoice = newInvoice;

        // Issue receipt if payment was recorded
        if (paidAmount > 0) {
          const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
          receipt = {
            id: `rcp-${Date.now()}`,
            tenantId,
            receiptNumber,
            invoiceId: newInvoice.id,
            invoiceNumber: newInvoice.invoiceNumber,
            memberId,
            memberName: `${data.firstName} ${data.lastName}`,
            amount: paidAmount,
            paymentMethod,
            receivedBy: options?.actor?.name || 'Reception Staff',
            receivedById: options?.actor?.id || 'user-staff-1',
            items,
            createdAt: new Date().toISOString(),
          };

          newInvoice.receiptId = receipt.id;
          newInvoice.receiptNumber = receipt.receiptNumber;
          this.receipts.push(receipt);

          this.recordAuditEvent({
            tenantId,
            actorId: options?.actor?.id || 'user-staff-1',
            actorName: options?.actor?.name || 'Reception Staff',
            actorRole: (options?.actor?.role as any) || 'RECEPTIONIST',
            action: 'RECEIPT_ISSUED',
            entityType: 'RECEIPT',
            entityId: receipt.id,
            details: `Receipt ${receipt.receiptNumber} issued for $${paidAmount.toFixed(2)} (${paymentMethod}) on invoice ${newInvoice.invoiceNumber}`,
          });
        }

        this.invoices.push(newInvoice);

        this.recordAuditEvent({
          tenantId,
          actorId: options?.actor?.id || 'user-staff-1',
          actorName: options?.actor?.name || 'Reception Staff',
          actorRole: (options?.actor?.role as any) || 'RECEPTIONIST',
          action: 'PAYMENT_RECORDED',
          entityType: 'INVOICE',
          entityId: newInvoice.id,
          details: `Invoice ${newInvoice.invoiceNumber} recorded for ${data.firstName} ${data.lastName}: Total $${totalAmount}, Paid $${paidAmount}, Balance $${balance}`,
        });
      }
    }

    const newMember: Member = {
      ...data,
      id: memberId,
      tenantId,
      memberNumber,
      qrCodeToken,
      status,
      currentPlanId: data.planId,
      currentPlanName,
      subscriptionStart,
      subscriptionEnd,
      daysRemaining,
      dueBalance: invoice ? invoice.balance : (data.dueBalance || 0),
      consentGiven,
      consentDate,
      consentPolicyVersion,
    };

    this.members.push(newMember);

    // Auto-provision a MEMBER user account for portal login
    if (data.email) {
      const existingUser = this.users.find((u) => u.email.toLowerCase() === data.email!.toLowerCase());
      if (!existingUser) {
        this.users.push({
          id: `user-${newMember.id}`,
          tenantId,
          name: `${newMember.firstName} ${newMember.lastName}`,
          email: data.email,
          role: 'MEMBER',
          phone: data.phone,
          isActive: newMember.status !== 'EXPIRED',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Assign locker if specified
    if (data.assignedLockerNumber) {
      this.assignLocker(
        tenantId,
        data.assignedLockerNumber,
        newMember.id,
        `${newMember.firstName} ${newMember.lastName}`,
        newMember.phone,
        subscriptionEnd
      );
    }

    this.recordAuditEvent({
      tenantId,
      actorId: options?.actor?.id || 'user-staff-1',
      actorName: options?.actor?.name || 'Reception Staff',
      actorRole: (options?.actor?.role as any) || 'RECEPTIONIST',
      action: 'MEMBER_CREATE',
      entityType: 'MEMBER',
      entityId: newMember.id,
      details: `Registered new member ${newMember.firstName} ${newMember.lastName} (${newMember.memberNumber}), Status: ${newMember.status}`,
    });

    this.persist();
    return Object.assign(newMember, { invoice, receipt });
  }

  updateMember(
    tenantId: string,
    memberId: string,
    updates: Partial<Member>,
    actor?: { id: string; name: string; role: string }
  ): Member | undefined {
    const idx = this.members.findIndex((m) => m.id === memberId && m.tenantId === tenantId);
    if (idx === -1) return undefined;

    const previousStatus = this.members[idx].status;
    const patch: Partial<Member> = { ...updates };
    if (updates.daysRemaining !== undefined && updates.subscriptionEnd === undefined) {
      patch.subscriptionEnd = new Date(Date.now() + updates.daysRemaining * 86400000 - 1000).toISOString();
    }
    this.members[idx] = { ...this.members[idx], ...patch };

    if (updates.status && updates.status !== previousStatus) {
      this.recordAuditEvent({
        tenantId,
        actorId: actor?.id || 'user-staff-1',
        actorName: actor?.name || 'Reception Staff',
        actorRole: (actor?.role as any) || 'RECEPTIONIST',
        action: 'MEMBER_STATUS_CHANGE',
        entityType: 'MEMBER',
        entityId: memberId,
        details: `Member ${this.members[idx].memberNumber} status changed from ${previousStatus} to ${updates.status}`,
      });
    }

    this.recordAuditEvent({
      tenantId,
      actorId: actor?.id || 'user-staff-1',
      actorName: actor?.name || 'Reception Staff',
      actorRole: (actor?.role as any) || 'RECEPTIONIST',
      action: 'MEMBER_UPDATE',
      entityType: 'MEMBER',
      entityId: memberId,
      details: `Updated member profile ${this.members[idx].memberNumber}`,
    });

    this.persist();
    return this.members[idx];
  }

  deleteMember(tenantId: string, memberId: string, actor?: { id: string; name: string; role: string }): boolean {
    const member = this.getMemberById(tenantId, memberId);
    if (!member) return false;

    if (member.assignedLockerNumber) {
      this.releaseLocker(tenantId, member.assignedLockerNumber);
    }

    const initialLen = this.members.length;
    this.members = this.members.filter((m) => !(m.id === memberId && m.tenantId === tenantId));

    this.recordAuditEvent({
      tenantId,
      actorId: actor?.id || 'user-owner-1',
      actorName: actor?.name || 'Gym Administrator',
      actorRole: (actor?.role as any) || 'OWNER',
      action: 'MEMBER_DELETE',
      entityType: 'MEMBER',
      entityId: memberId,
      details: `Deleted member profile ${member.memberNumber} (${member.firstName} ${member.lastName})`,
    });

    this.persist();
    return this.members.length < initialLen;
  }

  freezeMember(tenantId: string, memberId: string, freezeDays = 30, actor?: { id: string; name: string; role: string }): Member | undefined {
    const member = this.getMemberById(tenantId, memberId);
    if (!member) return undefined;

    let newEnd = member.subscriptionEnd ? new Date(member.subscriptionEnd) : new Date();
    newEnd.setDate(newEnd.getDate() + freezeDays);

    return this.updateMember(
      tenantId,
      memberId,
      {
        status: 'FROZEN',
        subscriptionEnd: newEnd.toISOString(),
      },
      actor
    );
  }

  unfreezeMember(tenantId: string, memberId: string, actor?: { id: string; name: string; role: string }): Member | undefined {
    const member = this.getMemberById(tenantId, memberId);
    if (!member) return undefined;

    const diffDays = member.subscriptionEnd
      ? Math.ceil((new Date(member.subscriptionEnd).getTime() - Date.now()) / 86400000)
      : 0;

    const status: Member['status'] = diffDays < 0 ? 'EXPIRED' : diffDays <= 3 ? 'EXPIRING_SOON' : 'ACTIVE';

    return this.updateMember(
      tenantId,
      memberId,
      {
        status,
        daysRemaining: diffDays,
      },
      actor
    );
  }

  renewMemberSubscription(
    tenantId: string,
    memberIdOrOptions:
      | string
      | {
          memberId: string;
          planId: string;
          paymentMethod?: PaymentMethod;
          paymentReference?: string;
          actor?: { id: string; name: string; role: string };
        },
    planIdParam?: string,
    paymentMethodParam: PaymentMethod = 'CASH',
    actorParam?: { id: string; name: string; role: string }
  ): (Member & { member: Member; invoice: Invoice; receipt: Receipt }) | undefined {
    const memberId = typeof memberIdOrOptions === 'object' ? memberIdOrOptions.memberId : memberIdOrOptions;
    const planId = typeof memberIdOrOptions === 'object' ? memberIdOrOptions.planId : planIdParam!;
    const paymentMethod: PaymentMethod =
      typeof memberIdOrOptions === 'object' ? memberIdOrOptions.paymentMethod || 'CASH' : paymentMethodParam;
    const actor = typeof memberIdOrOptions === 'object' ? memberIdOrOptions.actor : actorParam;

    const member = this.getMemberById(tenantId, memberId);
    const plan = this.plans.find((p) => p.id === planId && p.tenantId === tenantId);
    if (!member || !plan) return undefined;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + plan.durationDays);

    const updated = this.updateMember(
      tenantId,
      memberId,
      {
        currentPlanId: plan.id,
        currentPlanName: plan.name,
        subscriptionStart: startDate.toISOString(),
        subscriptionEnd: endDate.toISOString(),
        daysRemaining: plan.durationDays,
        status: 'ACTIVE',
        dueBalance: 0,
      },
      actor
    );

    const invoiceId = `inv-${Date.now()}`;
    const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const items: InvoiceLineItem[] = [
      {
        id: `item-${Date.now()}`,
        description: `${plan.name} Membership Renewal`,
        unitPrice: plan.price,
        quantity: 1,
        subtotal: plan.price,
        category: 'PLAN',
      },
    ];

    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receipt: Receipt = {
      id: `rcp-${Date.now()}`,
      tenantId,
      receiptNumber,
      invoiceId,
      invoiceNumber,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      amount: plan.price,
      paymentMethod,
      receivedBy: actor?.name || 'Reception Staff',
      receivedById: actor?.id || 'user-staff-1',
      items,
      createdAt: new Date().toISOString(),
    };
    this.receipts.push(receipt);

    const invoice: Invoice = {
      id: invoiceId,
      tenantId,
      invoiceNumber,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      type: 'MEMBERSHIP',
      items,
      subtotal: plan.price,
      discount: 0,
      amount: plan.price,
      paidAmount: plan.price,
      balance: 0,
      status: 'PAID',
      paymentMethod,
      receiptId: receipt.id,
      receiptNumber: receipt.receiptNumber,
      recordedBy: actor?.name || 'Reception Staff',
      recordedById: actor?.id || 'user-staff-1',
      createdAt: new Date().toISOString(),
    };
    this.invoices.push(invoice);

    this.recordAuditEvent({
      tenantId,
      actorId: actor?.id || 'user-staff-1',
      actorName: actor?.name || 'Reception Staff',
      actorRole: (actor?.role as any) || 'RECEPTIONIST',
      action: 'PAYMENT_RECORDED',
      entityType: 'INVOICE',
      entityId: invoice.id,
      details: `Renewal payment of $${plan.price} on invoice ${invoice.invoiceNumber} for ${member.firstName} ${member.lastName}`,
    });

    this.recordAuditEvent({
      tenantId,
      actorId: actor?.id || 'user-staff-1',
      actorName: actor?.name || 'Reception Staff',
      actorRole: (actor?.role as any) || 'RECEPTIONIST',
      action: 'RECEIPT_ISSUED',
      entityType: 'RECEIPT',
      entityId: receipt.id,
      details: `Renewal receipt ${receipt.receiptNumber} issued for $${plan.price} (${paymentMethod})`,
    });

    this.persist();
    return Object.assign(updated!, { member: updated!, invoice, receipt });
  }

  bulkImportPaperMembers(tenantId: string, rows: PaperImportRow[]): { imported: number; errors: string[] } {
    let imported = 0;
    const errors: string[] = [];

    for (const [index, row] of rows.entries()) {
      try {
        if (!row.fullName || !row.phone) {
          errors.push(`Row ${index + 1}: Missing Full Name or Phone number.`);
          continue;
        }

        const nameParts = row.fullName.trim().split(' ');
        const firstName = nameParts[0] || 'Unknown';
        const lastName = nameParts.slice(1).join(' ') || 'Member';

        // Match or find fallback plan
        let plan = this.plans.find((p) => p.tenantId === tenantId && p.name.toLowerCase().includes((row.planName || '').toLowerCase()));
        if (!plan) {
          plan = this.plans.find((p) => p.tenantId === tenantId) || this.plans[0];
        }

        const startDate = row.startDate ? new Date(row.startDate) : new Date(Date.now() - 15 * 86400000);
        let endDate = row.endDate ? new Date(row.endDate) : new Date();
        if (!row.endDate && plan) {
          endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + plan.durationDays);
        }

        const diffDays = Math.ceil((endDate.getTime() - Date.now()) / 86400000);
        const status: Member['status'] = diffDays < 0 ? 'EXPIRED' : diffDays <= 3 ? 'EXPIRING_SOON' : 'ACTIVE';

        const count = this.members.filter((m) => m.tenantId === tenantId).length + 1;
        const tenant = this.getTenantById(tenantId);
        const prefix = tenant ? tenant.name.substring(0, 2).toUpperCase() : 'GM';
        const memberNumber = `${prefix}-${1000 + count}`;
        const qrCodeToken = this.generateOpaqueQRToken(memberNumber);

        const newMember: Member = {
          id: `mem-${Date.now()}-${index}`,
          tenantId,
          memberNumber,
          firstName,
          lastName,
          phone: row.phone.trim(),
          email: row.email?.trim() || undefined,
          joinDate: startDate.toISOString(),
          emergencyContactName: row.emergencyContact || undefined,
          emergencyContactPhone: row.emergencyPhone || undefined,
          medicalNotes: row.notes || undefined,
          qrCodeToken,
          status,
          currentPlanId: plan?.id,
          currentPlanName: plan?.name || row.planName,
          subscriptionStart: startDate.toISOString(),
          subscriptionEnd: endDate.toISOString(),
          daysRemaining: diffDays,
          dueBalance: Number(row.balanceDue) || 0,
          assignedLockerNumber: row.lockerNumber || undefined,
        };

        this.members.push(newMember);
        imported++;

        if (row.lockerNumber) {
          this.assignLocker(tenantId, row.lockerNumber, newMember.id, `${newMember.firstName} ${newMember.lastName}`, newMember.phone, endDate.toISOString());
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(`Row ${index + 1}: ${message}`);
      }
    }

    return { imported, errors };
  }

  // ================= CHECK-IN & ACCESS CONTROL =================
  revokeMemberQRCode(
    tenantId: string,
    memberId: string,
    actor?: { id: string; name: string; role?: string }
  ): { success: boolean; member?: Member; message: string } {
    this.syncFromDiskIfModified();
    const member = this.members.find(
      (m) => m.tenantId === tenantId && (m.id === memberId || m.memberNumber === memberId || m.qrCodeToken === memberId)
    );
    if (!member) {
      return { success: false, message: 'Member not found.' };
    }

    if (!member.revokedQRTokens) {
      member.revokedQRTokens = [];
    }
    if (member.qrCodeToken && !member.revokedQRTokens.includes(member.qrCodeToken)) {
      member.revokedQRTokens.push(member.qrCodeToken);
    }
    member.qrCodeRevoked = true;
    member.qrCodeRevokedAt = new Date().toISOString();

    this.recordAuditEvent({
      tenantId,
      actorId: actor?.id || 'system',
      actorName: actor?.name || 'Staff',
      actorRole: (actor?.role as any) || 'RECEPTIONIST',
      action: 'QR_REVOKED',
      entityType: 'MEMBER',
      entityId: member.id,
      details: `Revoked digital QR credential (${member.qrCodeToken}) for member ${member.firstName} ${member.lastName}`,
    });

    this.persist();
    return { success: true, member, message: 'Member QR code revoked successfully.' };
  }

  regenerateMemberQRCode(
    tenantId: string,
    memberId: string,
    actor?: { id: string; name: string; role?: string }
  ): { success: boolean; member?: Member; oldToken?: string; newToken?: string; message: string } {
    this.syncFromDiskIfModified();
    const member = this.members.find(
      (m) => m.tenantId === tenantId && (m.id === memberId || m.memberNumber === memberId || m.qrCodeToken === memberId)
    );
    if (!member) {
      return { success: false, message: 'Member not found.' };
    }

    // Move old token to revoked list
    if (!member.revokedQRTokens) {
      member.revokedQRTokens = [];
    }
    const oldToken = member.qrCodeToken;
    if (oldToken && !member.revokedQRTokens.includes(oldToken)) {
      member.revokedQRTokens.push(oldToken);
    }

    // Generate brand new opaque token
    const newToken = this.generateOpaqueQRToken(member.memberNumber);
    member.qrCodeToken = newToken;
    member.qrCodeRevoked = false;
    member.qrCodeRevokedAt = undefined;

    this.recordAuditEvent({
      tenantId,
      actorId: actor?.id || 'system',
      actorName: actor?.name || 'Staff',
      actorRole: (actor?.role as any) || 'RECEPTIONIST',
      action: 'QR_REGENERATED',
      entityType: 'MEMBER',
      entityId: member.id,
      details: `Regenerated new digital QR credential for member ${member.firstName} ${member.lastName}. Old credential revoked.`,
    });

    this.persist();
    return { success: true, member, oldToken, newToken, message: 'New QR code credential issued. Previous credential revoked.' };
  }

  processCheckIn(
    tenantId: string,
    identifier: string, // QR token, memberNumber, or Phone
    method: 'QR_SCAN' | 'BARCODE' | 'MANUAL_LOOKUP' | 'MANUAL_OVERRIDE' = 'QR_SCAN',
    options?: {
      actor?: { id: string; name: string; role?: string };
      branchId?: string;
      branchName?: string;
      deviceInfo?: string;
      allowReEntry?: boolean;
      notes?: string;
    }
  ): {
    success: boolean;
    status: CheckInStatus;
    member?: Member;
    message: string;
    log: CheckInLog;
    dayDeducted?: boolean;
    previousDaysRemaining?: number;
    newDaysRemaining?: number;
  } {
    this.syncFromDiskIfModified();
    const cleanId = identifier.trim();
    const cleanPhone = cleanId.replace(/\s+/g, '');

    const member = this.getMembers(tenantId).find(
      (m) =>
        m.qrCodeToken.toLowerCase() === cleanId.toLowerCase() ||
        m.memberNumber.toLowerCase() === cleanId.toLowerCase() ||
        m.phone.replace(/\s+/g, '') === cleanPhone ||
        m.id === cleanId ||
        (m.revokedQRTokens && m.revokedQRTokens.some((t) => t.toLowerCase() === cleanId.toLowerCase()))
    );

    const logId = `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const timestamp = new Date().toISOString();

    if (!member) {
      const log: CheckInLog = {
        id: logId,
        tenantId,
        memberId: 'unknown',
        memberName: 'Unrecognized Member',
        memberNumber: cleanId,
        timestamp,
        status: 'DENIED_NOT_FOUND',
        failureReason: 'No member found matching this credential, QR code, or phone number.',
        method,
        scannerActorId: options?.actor?.id,
        scannerActorName: options?.actor?.name,
        branchId: options?.branchId,
        branchName: options?.branchName,
        deviceInfo: options?.deviceInfo,
        notes: options?.notes,
      };
      this.checkIns.unshift(log);
      this.persist();
      return {
        success: false,
        status: 'DENIED_NOT_FOUND',
        message: 'Access Denied: Unrecognized Credential. No matching member found.',
        log,
      };
    }

    // Check credential revocation
    const isTokenRevoked =
      member.qrCodeRevoked ||
      (member.revokedQRTokens && member.revokedQRTokens.some((t) => t.toLowerCase() === cleanId.toLowerCase()));

    // Real-time evaluation
    let status: CheckInStatus = 'GRANTED';
    let message = `Welcome back, ${member.firstName}! Access granted.`;
    let failureReason: string | undefined;

    // Check dates
    const now = Date.now();
    const isPastEnd = member.subscriptionEnd && new Date(member.subscriptionEnd).getTime() < now;
    const isExpiredStatus =
      member.status === 'EXPIRED' ||
      (member.daysRemaining !== undefined && member.daysRemaining < 0) ||
      isPastEnd;

    if (isTokenRevoked && method === 'QR_SCAN') {
      status = 'DENIED_REVOKED';
      failureReason = 'This digital QR pass has been revoked. Please present a newly issued pass.';
      message = 'Access Denied: QR Credential Revoked';
    } else if (member.status === 'SUSPENDED') {
      status = 'DENIED_SUSPENDED';
      failureReason = 'Membership is suspended by management policy. Please speak with reception.';
      message = 'Access Denied: Membership Suspended';
    } else if (member.status === 'FROZEN') {
      status = 'DENIED_FROZEN';
      failureReason = 'Membership is currently on hold / frozen. Re-activation required.';
      message = 'Access Denied: Membership Frozen';
    } else if (isExpiredStatus) {
      status = 'DENIED_EXPIRED';
      const days = Math.abs(member.daysRemaining || 0);
      failureReason = `Membership expired ${days > 0 ? `${days} day(s) ago` : 'today'}. Renewal required for entry.`;
      message = `Access Denied: Membership Expired (${days}d ago)`;
    } else if (member.dueBalance > 0 && method !== 'MANUAL_OVERRIDE') {
      status = 'DENIED_DEBT';
      failureReason = `Unpaid balance outstanding: $${member.dueBalance.toFixed(2)}. Payment required before entry.`;
      message = `Access Denied: Outstanding Debt ($${member.dueBalance.toFixed(2)})`;
    } else if (
      options?.branchId &&
      member.allowedBranchIds &&
      member.allowedBranchIds.length > 0 &&
      !member.allowedBranchIds.includes(options.branchId)
    ) {
      status = 'DENIED_BRANCH';
      failureReason = `Branch access not permitted for this member. Allowed branches: ${member.allowedBranchIds.join(', ')}.`;
      message = `Access Denied: Ineligible Branch Location`;
    } else {
      // Check re-entry anti-passback (15-minute cooldown)
      const fifteenMinutesAgo = now - 15 * 60 * 1000;
      const recentCheckIn = this.checkIns.find(
        (c) =>
          c.tenantId === tenantId &&
          c.memberId === member.id &&
          (c.status === 'GRANTED' || c.status === 'WARNING_EXPIRING') &&
          new Date(c.timestamp).getTime() > fifteenMinutesAgo
      );

      if (recentCheckIn && method !== 'MANUAL_OVERRIDE' && !options?.allowReEntry) {
        const elapsedMinutes = Math.max(1, Math.round((now - new Date(recentCheckIn.timestamp).getTime()) / 60000));
        status = 'DENIED_RE_ENTRY';
        failureReason = `Anti-passback restriction: Member already checked in ${elapsedMinutes} minute(s) ago. Re-entry requires staff override.`;
        message = `Access Denied: Re-Entry Cooldown (${elapsedMinutes}m ago)`;
      } else if (member.status === 'EXPIRING_SOON' || (member.daysRemaining !== undefined && member.daysRemaining <= 3)) {
        status = 'WARNING_EXPIRING';
        message = `Welcome, ${member.firstName}! Note: Your membership expires in ${member.daysRemaining} day(s).`;
      }
    }

    // Calendar/Time-based plan: Days reduce automatically each day by calendar date,
    // whether the member visits the gym or not. Scanning at the front desk verifies
    // active status, assigns lockers, logs occupancy, and does NOT consume an extra day per scan.
    const finalNotes = options?.notes !== undefined
      ? options.notes
      : (status === 'GRANTED' || status === 'WARNING_EXPIRING'
          ? `Check-in verified (${member.daysRemaining ?? 0} days remaining on plan)`
          : undefined);

    const log: CheckInLog = {
      id: logId,
      tenantId,
      memberId: member.id,
      memberName: `${member.firstName} ${member.lastName}`,
      memberNumber: member.memberNumber,
      timestamp,
      status,
      failureReason,
      method,
      lockerAssigned: member.assignedLockerNumber,
      scannerActorId: options?.actor?.id,
      scannerActorName: options?.actor?.name,
      branchId: options?.branchId,
      branchName: options?.branchName,
      deviceInfo: options?.deviceInfo,
      notes: finalNotes || undefined,
    };

    this.checkIns.unshift(log);
    this.persist();

    return {
      success: status === 'GRANTED' || status === 'WARNING_EXPIRING',
      status,
      member,
      message,
      log,
      dayDeducted: false,
      previousDaysRemaining: member.daysRemaining,
      newDaysRemaining: member.daysRemaining,
    };
  }

  processCheckOut(tenantId: string, identifier: string): { success: boolean; message: string; occupancy: { current: number; max: number; percentage: number } } {
    const member = this.getMembers(tenantId).find(
      (m) =>
        m.qrCodeToken.toLowerCase() === identifier.toLowerCase() ||
        m.memberNumber.toLowerCase() === identifier.toLowerCase() ||
        m.phone.replace(/\s+/g, '') === identifier.replace(/\s+/g, '') ||
        m.id === identifier
    );

    const memberName = member ? `${member.firstName} ${member.lastName}` : 'Member';
    const memberNum = member ? member.memberNumber : identifier;

    // Remove the most recent check-in for this member within the last 3 hours if exists
    const idx = this.checkIns.findIndex((c) => c.tenantId === tenantId && (c.memberId === member?.id || c.memberNumber === memberNum) && (c.status === 'GRANTED' || c.status === 'WARNING_EXPIRING'));
    if (idx !== -1) {
      this.checkIns.splice(idx, 1);
      this.persist();
    }

    const occupancy = this.getLiveOccupancy(tenantId);
    return {
      success: true,
      message: `Checked out ${memberName}. Thank you for working out!`,
      occupancy,
    };
  }

  getCheckIns(tenantId: string, limit = 50): CheckInLog[] {
    return this.checkIns.filter((c) => c.tenantId === tenantId).slice(0, limit);
  }

  getLiveOccupancy(tenantId: string): { current: number; max: number; percentage: number } {
    const tenant = this.getTenantById(tenantId);
    const max = tenant ? tenant.maxCapacity : 100;
    // Count check-ins in the last 2.5 hours
    const twoHoursAgo = Date.now() - 2.5 * 60 * 60 * 1000;
    const current = this.checkIns.filter((c) => c.tenantId === tenantId && (c.status === 'GRANTED' || c.status === 'WARNING_EXPIRING') && new Date(c.timestamp).getTime() > twoHoursAgo).length;

    const percentage = Math.min(100, Math.round((current / max) * 100));
    return { current, max, percentage };
  }

  // ================= LOCKERS =================
  getLockers(tenantId: string): Locker[] {
    return this.lockers.filter((l) => l.tenantId === tenantId);
  }

  assignLocker(tenantId: string, lockerNumber: string, memberId: string, memberName: string, memberPhone: string, expiresAt?: string): Locker | undefined {
    let locker = this.lockers.find((l) => l.tenantId === tenantId && l.number === lockerNumber);
    if (!locker) {
      locker = {
        id: `lock-${Date.now()}`,
        tenantId,
        number: lockerNumber,
        zone: 'Standard',
        status: 'OCCUPIED',
      };
      this.lockers.push(locker);
    }

    locker.status = 'OCCUPIED';
    locker.memberId = memberId;
    locker.memberName = memberName;
    locker.memberPhone = memberPhone;
    locker.assignedAt = new Date().toISOString();
    locker.expiresAt = expiresAt;

    // Update member record
    const member = this.members.find((m) => m.id === memberId && m.tenantId === tenantId);
    if (member) {
      member.assignedLockerNumber = lockerNumber;
    }

    this.persist();
    return locker;
  }

  releaseLocker(tenantId: string, lockerNumber: string): boolean {
    const locker = this.lockers.find((l) => l.tenantId === tenantId && l.number === lockerNumber);
    if (!locker) return false;

    if (locker.memberId) {
      const member = this.members.find((m) => m.id === locker.memberId && m.tenantId === tenantId);
      if (member) member.assignedLockerNumber = undefined;
    }

    locker.status = 'AVAILABLE';
    locker.memberId = undefined;
    locker.memberName = undefined;
    locker.memberPhone = undefined;
    locker.assignedAt = undefined;
    locker.expiresAt = undefined;

    this.persist();
    return true;
  }

  createLocker(tenantId: string, data: { number: string; zone: string }): Locker {
    const newLocker: Locker = {
      id: `lock-${Date.now()}`,
      tenantId,
      number: data.number,
      zone: data.zone || 'Main Zone',
      status: 'AVAILABLE',
    };
    this.lockers.push(newLocker);
    this.persist();
    return newLocker;
  }

  updateLocker(tenantId: string, lockerId: string, updates: Partial<Locker>): Locker | undefined {
    const idx = this.lockers.findIndex((l) => (l.id === lockerId || l.number === lockerId) && l.tenantId === tenantId);
    if (idx === -1) return undefined;
    this.lockers[idx] = { ...this.lockers[idx], ...updates };
    this.persist();
    return this.lockers[idx];
  }

  deleteLocker(tenantId: string, lockerId: string): boolean {
    const initialLen = this.lockers.length;
    this.lockers = this.lockers.filter((l) => !((l.id === lockerId || l.number === lockerId) && l.tenantId === tenantId));
    this.persist();
    return this.lockers.length < initialLen;
  }

  // ================= POS & INVOICES =================
  getProducts(tenantId: string): POSProduct[] {
    return this.products.filter((p) => p.tenantId === tenantId);
  }

  createProduct(tenantId: string, product: Omit<POSProduct, 'id' | 'tenantId'>): POSProduct {
    const newProduct: POSProduct = {
      ...product,
      id: `pos-${Date.now()}`,
      tenantId,
    };
    this.products.push(newProduct);
    this.persist();
    return newProduct;
  }

  updateProduct(tenantId: string, productId: string, updates: Partial<POSProduct>): POSProduct | undefined {
    const idx = this.products.findIndex((p) => p.id === productId && p.tenantId === tenantId);
    if (idx === -1) return undefined;
    this.products[idx] = { ...this.products[idx], ...updates };
    this.persist();
    return this.products[idx];
  }

  deleteProduct(tenantId: string, productId: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter((p) => !(p.id === productId && p.tenantId === tenantId));
    this.persist();
    return this.products.length < initialLen;
  }

  processSale(
    tenantId: string,
    items: { productId: string; quantity: number }[],
    paymentMethod: 'CASH' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER',
    memberId?: string,
    cashierName = 'Front Desk'
  ): POSSale {
    let total = 0;
    const saleItems = items.map((item) => {
      const prod = this.products.find((p) => p.id === item.productId && p.tenantId === tenantId);
      const name = prod ? prod.name : 'Gym Item';
      const unitPrice = prod ? prod.price : 0;
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
      }

      return {
        productId: item.productId,
        productName: name,
        unitPrice,
        quantity: item.quantity,
        subtotal,
      };
    });

    let memberName: string | undefined;
    if (memberId) {
      const mem = this.getMemberById(tenantId, memberId);
      if (mem) memberName = `${mem.firstName} ${mem.lastName}`;
    }

    const invoiceNumber = `POS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const sale: POSSale = {
      id: `sale-${Date.now()}`,
      tenantId,
      invoiceNumber,
      memberId,
      memberName,
      totalAmount: total,
      paymentMethod,
      items: saleItems,
      createdAt: new Date().toISOString(),
      cashierName,
    };

    this.sales.unshift(sale);

    // Also register invoice
    this.invoices.unshift({
      id: `inv-${Date.now()}`,
      tenantId,
      invoiceNumber,
      memberId,
      memberName: memberName || 'Walk-in Customer',
      type: 'POS',
      amount: total,
      paidAmount: total,
      balance: 0,
      status: 'PAID',
      paymentMethod,
      createdAt: new Date().toISOString(),
    });

    this.persist();
    return sale;
  }

  getInvoices(tenantId: string, memberId?: string): Invoice[] {
    let list = this.invoices.filter((i) => i.tenantId === tenantId);
    if (memberId) {
      list = list.filter((i) => i.memberId === memberId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getInvoiceById(tenantId: string, id: string): Invoice | undefined {
    return this.invoices.find(
      (i) => i.tenantId === tenantId && (i.id === id || i.invoiceNumber === id)
    );
  }

  recordPayment(
    tenantId: string,
    invoiceIdOrPayment:
      | string
      | {
          invoiceId: string;
          amount: number;
          paymentMethod: PaymentMethod;
          paymentReference?: string;
          notes?: string;
          actor?: { id: string; name: string; role: string };
        },
    paymentParam?: {
      amount: number;
      paymentMethod: PaymentMethod;
      paymentReference?: string;
      notes?: string;
      actor?: { id: string; name: string; role: string };
    }
  ): { invoice: Invoice; receipt: Receipt } {
    const invoiceId =
      typeof invoiceIdOrPayment === 'object' ? invoiceIdOrPayment.invoiceId : invoiceIdOrPayment;
    const payment = typeof invoiceIdOrPayment === 'object' ? invoiceIdOrPayment : paymentParam!;
    const invoice = this.invoices.find((i) => i.id === invoiceId && i.tenantId === tenantId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'VOIDED' || invoice.status === 'REFUNDED') {
      throw new Error(`Cannot record payment on a ${invoice.status} invoice`);
    }
    if (payment.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    invoice.paidAmount += payment.amount;
    invoice.balance = Math.max(0, invoice.amount - invoice.paidAmount);
    if (invoice.balance === 0) {
      invoice.status = 'PAID';
    } else {
      invoice.status = 'PARTIAL';
    }

    const receiptNumber = `RCP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const receipt: Receipt = {
      id: `rcp-${Date.now()}`,
      tenantId,
      receiptNumber,
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      memberId: invoice.memberId,
      memberName: invoice.memberName,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentReference: payment.paymentReference,
      notes: payment.notes,
      receivedBy: payment.actor?.name || 'Reception Staff',
      receivedById: payment.actor?.id || 'user-staff-1',
      createdAt: new Date().toISOString(),
    };
    this.receipts.push(receipt);
    invoice.receiptId = receipt.id;
    invoice.receiptNumber = receipt.receiptNumber;

    // Reactivate suspended member if balance paid in full
    if (invoice.memberId) {
      const member = this.getMemberById(tenantId, invoice.memberId);
      if (member) {
        member.dueBalance = Math.max(0, (member.dueBalance || 0) - payment.amount);
        if (member.dueBalance === 0 && member.status === 'SUSPENDED') {
          member.status = 'ACTIVE';
          this.recordAuditEvent({
            tenantId,
            actorId: payment.actor?.id || 'user-staff-1',
            actorName: payment.actor?.name || 'Reception Staff',
            actorRole: (payment.actor?.role as any) || 'RECEPTIONIST',
            action: 'MEMBER_STATUS_CHANGE',
            entityType: 'MEMBER',
            entityId: member.id,
            details: `Member ${member.memberNumber} reactivated following full invoice payment`,
          });
        }
      }
    }

    this.recordAuditEvent({
      tenantId,
      actorId: payment.actor?.id || 'user-staff-1',
      actorName: payment.actor?.name || 'Reception Staff',
      actorRole: (payment.actor?.role as any) || 'RECEPTIONIST',
      action: 'PAYMENT_RECORDED',
      entityType: 'INVOICE',
      entityId: invoice.id,
      details: `Payment of $${payment.amount.toFixed(2)} (${payment.paymentMethod}) on invoice ${invoice.invoiceNumber}. Remaining balance: $${invoice.balance.toFixed(2)}`,
    });

    this.recordAuditEvent({
      tenantId,
      actorId: payment.actor?.id || 'user-staff-1',
      actorName: payment.actor?.name || 'Reception Staff',
      actorRole: (payment.actor?.role as any) || 'RECEPTIONIST',
      action: 'RECEIPT_ISSUED',
      entityType: 'RECEIPT',
      entityId: receipt.id,
      details: `Receipt ${receipt.receiptNumber} issued for $${payment.amount.toFixed(2)} (${payment.paymentMethod})`,
    });

    this.persist();
    return { invoice, receipt };
  }

  voidInvoice(
    tenantId: string,
    invoiceIdOrOptions:
      | string
      | {
          invoiceId: string;
          reason?: string;
          actor?: { id: string; name: string; role: string };
        },
    reasonParam?: string,
    actorParam?: { id: string; name: string; role: string }
  ): FinancialCorrection & { invoice: Invoice; correction: FinancialCorrection } {
    const invoiceId =
      typeof invoiceIdOrOptions === 'object' ? invoiceIdOrOptions.invoiceId : invoiceIdOrOptions;
    const reason =
      typeof invoiceIdOrOptions === 'object'
        ? invoiceIdOrOptions.reason || 'Voided transaction'
        : reasonParam || 'Voided transaction';
    const actor =
      typeof invoiceIdOrOptions === 'object'
        ? invoiceIdOrOptions.actor || { id: 'user-staff-1', name: 'Reception Staff', role: 'RECEPTIONIST' }
        : actorParam || { id: 'user-staff-1', name: 'Reception Staff', role: 'RECEPTIONIST' };

    const invoice = this.invoices.find((i) => i.id === invoiceId && i.tenantId === tenantId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'VOIDED') throw new Error('Invoice is already voided');

    invoice.status = 'VOIDED';
    invoice.voidedAt = new Date().toISOString();
    invoice.voidReason = reason;

    const referenceNumber = `CORR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const correction: FinancialCorrection = {
      id: `cor-${Date.now()}`,
      tenantId,
      referenceNumber,
      originalInvoiceId: invoice.id,
      originalInvoiceNumber: invoice.invoiceNumber,
      type: 'VOID',
      amount: invoice.amount,
      reason,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      createdAt: new Date().toISOString(),
    };
    this.financialCorrections.push(correction);

    // If member has dueBalance linked to this voided invoice, reduce it
    if (invoice.memberId && invoice.balance > 0) {
      const member = this.getMemberById(tenantId, invoice.memberId);
      if (member) {
        member.dueBalance = Math.max(0, (member.dueBalance || 0) - invoice.balance);
      }
    }

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role as any,
      action: 'TRANSACTION_VOID',
      entityType: 'INVOICE',
      entityId: invoice.id,
      details: `Voided invoice ${invoice.invoiceNumber}. Linked correction: ${correction.referenceNumber}. Reason: ${reason}`,
    });

    this.persist();
    return Object.assign(correction, { invoice, correction });
  }

  refundInvoice(
    tenantId: string,
    invoiceIdOrOptions:
      | string
      | {
          invoiceId: string;
          amount: number;
          reason?: string;
          actor?: { id: string; name: string; role: string };
        },
    refundAmountParam?: number,
    reasonParam?: string,
    actorParam?: { id: string; name: string; role: string }
  ): FinancialCorrection & { invoice: Invoice; correction: FinancialCorrection } {
    const invoiceId =
      typeof invoiceIdOrOptions === 'object' ? invoiceIdOrOptions.invoiceId : invoiceIdOrOptions;
    const refundAmount =
      typeof invoiceIdOrOptions === 'object' ? invoiceIdOrOptions.amount : refundAmountParam || 0;
    const reason =
      typeof invoiceIdOrOptions === 'object'
        ? invoiceIdOrOptions.reason || 'Refunded transaction'
        : reasonParam || 'Refunded transaction';
    const actor =
      typeof invoiceIdOrOptions === 'object'
        ? invoiceIdOrOptions.actor || { id: 'user-staff-1', name: 'Reception Staff', role: 'RECEPTIONIST' }
        : actorParam || { id: 'user-staff-1', name: 'Reception Staff', role: 'RECEPTIONIST' };

    const invoice = this.invoices.find((i) => i.id === invoiceId && i.tenantId === tenantId);
    if (!invoice) throw new Error('Invoice not found');
    if (invoice.status === 'VOIDED') throw new Error('Cannot refund a voided invoice');
    if (refundAmount <= 0) throw new Error('Refund amount must be greater than 0');
    if (refundAmount > invoice.paidAmount) {
      throw new Error(`Refund amount cannot exceed paid amount ($${invoice.paidAmount})`);
    }

    invoice.refundedAmount = (invoice.refundedAmount || 0) + refundAmount;
    if (invoice.refundedAmount >= invoice.paidAmount) {
      invoice.status = 'REFUNDED';
    }

    const referenceNumber = `CORR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const correction: FinancialCorrection = {
      id: `cor-${Date.now()}`,
      tenantId,
      referenceNumber,
      originalInvoiceId: invoice.id,
      originalInvoiceNumber: invoice.invoiceNumber,
      type: 'REFUND',
      amount: refundAmount,
      reason,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      createdAt: new Date().toISOString(),
    };
    this.financialCorrections.push(correction);

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role as any,
      action: 'TRANSACTION_REFUND',
      entityType: 'INVOICE',
      entityId: invoice.id,
      details: `Refund of $${refundAmount.toFixed(2)} processed for invoice ${invoice.invoiceNumber}. Reference: ${correction.referenceNumber}. Reason: ${reason}`,
    });

    this.persist();
    return Object.assign(correction, { invoice, correction });
  }

  adjustBalance(
    tenantId: string,
    memberIdOrOptions:
      | string
      | {
          memberId: string;
          amount: number;
          reason?: string;
          actor?: { id: string; name: string; role: string };
        },
    amountParam?: number,
    reasonParam?: string,
    actorParam?: { id: string; name: string; role: string }
  ): FinancialCorrection & { member: Member; correction: FinancialCorrection } {
    const memberId =
      typeof memberIdOrOptions === 'object' ? memberIdOrOptions.memberId : memberIdOrOptions;
    const amount =
      typeof memberIdOrOptions === 'object' ? memberIdOrOptions.amount : amountParam || 0;
    const reason =
      typeof memberIdOrOptions === 'object'
        ? memberIdOrOptions.reason || 'Balance adjustment'
        : reasonParam || 'Balance adjustment';
    const actor =
      typeof memberIdOrOptions === 'object'
        ? memberIdOrOptions.actor || { id: 'user-staff-1', name: 'Reception Staff', role: 'RECEPTIONIST' }
        : actorParam || { id: 'user-staff-1', name: 'Reception Staff', role: 'RECEPTIONIST' };

    const member = this.getMemberById(tenantId, memberId);
    if (!member) throw new Error('Member not found');

    member.dueBalance = Math.max(0, (member.dueBalance || 0) - amount);

    const referenceNumber = `CORR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const correction: FinancialCorrection = {
      id: `cor-${Date.now()}`,
      tenantId,
      referenceNumber,
      originalInvoiceId: 'N/A',
      originalInvoiceNumber: 'BALANCE-ADJUSTMENT',
      type: 'ADJUSTMENT',
      amount,
      reason,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      createdAt: new Date().toISOString(),
    };
    this.financialCorrections.push(correction);

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role as any,
      action: 'TRANSACTION_ADJUSTMENT',
      entityType: 'MEMBER',
      entityId: member.id,
      details: `Balance adjustment of $${amount.toFixed(2)} on member ${member.memberNumber}. Reason: ${reason}`,
    });

    this.persist();
    return Object.assign(correction, { member, correction });
  }

  deleteInvoice(invoiceId: string): boolean {
    throw new Error(
      'Posted financial records are immutable and cannot be deleted. Use voidInvoice or refundInvoice to preserve audit history.'
    );
  }

  getReceipts(tenantId: string, memberId?: string): Receipt[] {
    let list = this.receipts.filter((r) => r.tenantId === tenantId);
    if (memberId) {
      list = list.filter((r) => r.memberId === memberId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getReceiptById(tenantIdOrId: string, maybeId?: string): Receipt | undefined {
    const id = maybeId || tenantIdOrId;
    const tenantId = maybeId ? tenantIdOrId : undefined;
    return this.receipts.find(
      (r) => (r.id === id || r.receiptNumber === id) && (!tenantId || r.tenantId === tenantId)
    );
  }

  getReceiptByNumber(tenantIdOrNumber: string, maybeReceiptNumber?: string): Receipt | undefined {
    const receiptNumber = maybeReceiptNumber || tenantIdOrNumber;
    const tenantId = maybeReceiptNumber ? tenantIdOrNumber : undefined;
    return this.receipts.find(
      (r) =>
        r.receiptNumber.toLowerCase() === receiptNumber.toLowerCase() &&
        (!tenantId || r.tenantId === tenantId)
    );
  }



  getFinancialCorrections(tenantId: string, invoiceId?: string): FinancialCorrection[] {
    let list = this.financialCorrections.filter((c) => c.tenantId === tenantId);
    if (invoiceId) {
      list = list.filter((c) => c.originalInvoiceId === invoiceId);
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // ================= ANALYTICS =================
  getAnalytics(tenantId: string) {
    const members = this.getMembers(tenantId);
    const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
    const expiringSoon = members.filter((m) => m.status === 'EXPIRING_SOON').length;
    const expired = members.filter((m) => m.status === 'EXPIRED').length;
    const totalMembers = members.length;

    const invoices = this.getInvoices(tenantId);
    const totalRevenue = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
    const totalPendingDues = members.reduce((acc, mem) => acc + (mem.dueBalance || 0), 0);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCheckIns = this.checkIns.filter(
      (c) => c.tenantId === tenantId && new Date(c.timestamp).getTime() >= todayStart.getTime() && (c.status === 'GRANTED' || c.status === 'WARNING_EXPIRING')
    ).length;

    const occupancy = this.getLiveOccupancy(tenantId);

    // Attendance trend by hour (06:00 to 22:00)
    const hours = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
    const hourlyVisits = [4, 18, 12, 9, 7, 22, 38, 26, 11];

    // Revenue breakdown by plan
    const plans = this.getPlans(tenantId);
    const planDistribution = plans.map((p) => {
      const count = members.filter((m) => m.currentPlanId === p.id).length;
      return { name: p.name, count, value: count * p.price };
    });

    return {
      activeMembers,
      expiringSoon,
      expired,
      totalMembers,
      totalRevenue,
      totalPendingDues,
      todayCheckIns,
      occupancy,
      hourlyVisits: hours.map((h, i) => ({ time: h, visits: hourlyVisits[i] })),
      planDistribution,
    };
  }

  // ================= PILLAR 3: EXPENSES & PROFIT/LOSS =================
  getExpenses(
    tenantId: string,
    options?: { category?: string; status?: string; startDate?: string; endDate?: string }
  ): Expense[] {
    return this.expenses
      .filter((e) => {
        if (e.tenantId !== tenantId) return false;
        if (options?.category && options.category !== 'ALL' && e.category !== options.category) return false;
        if (options?.status && options.status !== 'ALL' && e.status !== options.status) return false;
        if (options?.startDate && new Date(e.date) < new Date(options.startDate)) return false;
        if (options?.endDate && new Date(e.date) > new Date(options.endDate)) return false;
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  createExpense(data: Omit<Expense, 'id' | 'createdAt'>): Expense {
    const isOwnerOrFinance =
      data.loggedBy?.toLowerCase().includes('owner') || data.loggedBy?.toLowerCase().includes('finance');
    const newExpense: Expense = {
      ...data,
      status: data.status || (isOwnerOrFinance ? 'APPROVED' : 'PENDING_APPROVAL'),
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.expenses.unshift(newExpense);
    this.persist();
    return newExpense;
  }

  approveExpense(
    tenantId: string,
    expenseId: string,
    actor: { id: string; name: string; role: string }
  ): { success: boolean; error?: string; message: string; expense?: Expense } {
    const expense = this.expenses.find((e) => e.id === expenseId && e.tenantId === tenantId);
    if (!expense) {
      return { success: false, error: 'NOT_FOUND', message: 'Expense not found' };
    }

    // Role-based approval limits
    const role = actor.role;
    if (role === 'MANAGER' || role === 'GENERAL_MANAGER') {
      if (expense.amount > 1000) {
        return {
          success: false,
          error: 'LIMIT_EXCEEDED',
          message: `Manager approval limit ($1,000.00) exceeded. Expense of $${expense.amount.toFixed(2)} requires Owner or Finance Officer approval.`,
        };
      }
    } else if (
      role !== 'OWNER' &&
      role !== 'GYM_OWNER' &&
      role !== 'FINANCE_OFFICER' &&
      role !== 'SUPER_ADMIN'
    ) {
      return {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Your role is not authorized to approve expenses.',
      };
    }

    const now = new Date().toISOString();
    expense.status = 'APPROVED';
    expense.approvedBy = actor.name;
    expense.approvedById = actor.id;
    expense.approvedAt = now;

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role as any,
      action: 'EXPENSE_APPROVED',
      entityType: 'EXPENSE',
      entityId: expense.id,
      details: `Approved expense '${expense.title}' for $${expense.amount.toFixed(2)}`,
    });

    this.persist();
    return { success: true, message: 'Expense approved successfully', expense };
  }

  rejectExpense(
    tenantId: string,
    expenseId: string,
    actor: { id: string; name: string; role: string },
    reason: string
  ): { success: boolean; error?: string; message: string; expense?: Expense } {
    const expense = this.expenses.find((e) => e.id === expenseId && e.tenantId === tenantId);
    if (!expense) {
      return { success: false, error: 'NOT_FOUND', message: 'Expense not found' };
    }

    expense.status = 'REJECTED';
    expense.rejectionReason = reason;

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role as any,
      action: 'EXPENSE_REJECTED',
      entityType: 'EXPENSE',
      entityId: expense.id,
      details: `Rejected expense '${expense.title}' ($${expense.amount.toFixed(2)}). Reason: ${reason}`,
    });

    this.persist();
    return { success: true, message: 'Expense rejected successfully', expense };
  }

  voidExpense(
    tenantId: string,
    expenseId: string,
    actor: { id: string; name: string; role: string },
    reason: string
  ): { success: boolean; error?: string; message: string; expense?: Expense } {
    const expense = this.expenses.find((e) => e.id === expenseId && e.tenantId === tenantId);
    if (!expense) {
      return { success: false, error: 'NOT_FOUND', message: 'Expense not found' };
    }

    const now = new Date().toISOString();
    expense.status = 'VOIDED';
    expense.voidReason = reason;
    expense.voidedAt = now;
    expense.voidedBy = actor.name;

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role as any,
      action: 'EXPENSE_VOIDED',
      entityType: 'EXPENSE',
      entityId: expense.id,
      details: `Voided expense '${expense.title}' ($${expense.amount.toFixed(2)}). Reason: ${reason}`,
    });

    this.persist();
    return { success: true, message: 'Expense voided successfully', expense };
  }

  deleteExpense(id: string): boolean {
    // Non-destructive soft void for backward compatibility
    const expense = this.expenses.find((e) => e.id === id);
    if (!expense) return false;
    expense.status = 'VOIDED';
    expense.voidReason = 'Deleted by user action';
    expense.voidedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  getProfitLossSummary(tenantId: string): ProfitLossSummary {
    const invoices = this.getInvoices(tenantId);
    const expenses = this.getExpenses(tenantId);

    const grossRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const membershipRevenue = invoices
      .filter((inv) => inv.type === 'MEMBERSHIP')
      .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const posRevenue = invoices
      .filter((inv) => inv.type === 'POS')
      .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const lockerRevenue = invoices
      .filter((inv) => inv.type === 'LOCKER')
      .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    // Only non-voided expenses count toward financial deductions
    const activeExpenses = expenses.filter((e) => e.status !== 'VOIDED');
    const totalExpenses = activeExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const netProfit = grossRevenue - totalExpenses;
    const profitMarginPercent = grossRevenue > 0 ? Number(((netProfit / grossRevenue) * 100).toFixed(1)) : 0;

    const categoryExpenses: Record<ExpenseCategory, number> = {
      UTILITIES: 0,
      EQUIPMENT_REPAIR: 0,
      PAYROLL: 0,
      INVENTORY: 0,
      FACILITY_RENT: 0,
      MARKETING: 0,
      OTHER: 0,
    };

    activeExpenses.forEach((e) => {
      if (categoryExpenses[e.category] !== undefined) {
        categoryExpenses[e.category] += e.amount;
      } else {
        categoryExpenses.OTHER += e.amount;
      }
    });

    const monthlyTrends = [
      { month: 'May', revenue: 4200, expenses: 1850, profit: 2350 },
      { month: 'Jun', revenue: 4800, expenses: 2100, profit: 2700 },
      { month: 'Jul', revenue: 5300, expenses: 2250, profit: 3050 },
      { month: 'Aug', revenue: 6100, expenses: 2400, profit: 3700 },
      { month: 'Current', revenue: grossRevenue, expenses: totalExpenses, profit: netProfit },
    ];

    return {
      grossRevenue,
      membershipRevenue,
      posRevenue,
      lockerRevenue,
      totalExpenses,
      netProfit,
      profitMarginPercent,
      categoryExpenses,
      monthlyTrends,
    };
  }

  // ================= PILLAR 5: EQUIPMENT & MAINTENANCE =================
  getEquipment(tenantId: string, filter?: { category?: string; status?: string; search?: string }): Equipment[] {
    return this.equipment.filter((e) => {
      if (e.tenantId !== tenantId) return false;
      if (filter?.category && filter.category !== 'ALL' && e.category !== filter.category) return false;
      if (filter?.status && filter.status !== 'ALL' && e.status !== filter.status) return false;
      if (filter?.search) {
        const q = filter.search.toLowerCase().trim();
        const match =
          e.name.toLowerCase().includes(q) ||
          e.serialNumber.toLowerCase().includes(q) ||
          (e.location && e.location.toLowerCase().includes(q)) ||
          (e.condition && e.condition.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }

  getEquipmentById(id: string): Equipment | undefined {
    return this.equipment.find((e) => e.id === id);
  }

  createEquipment(data: Omit<Equipment, 'id' | 'createdAt'>): Equipment {
    const item: Equipment = {
      ...data,
      condition: data.condition || 'EXCELLENT',
      serviceHistory: data.serviceHistory || [],
      id: `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.equipment.push(item);
    this.persist();
    return item;
  }

  updateEquipment(id: string, updates: Partial<Equipment>): Equipment | null {
    const idx = this.equipment.findIndex((e) => e.id === id);
    if (idx === -1) return null;
    this.equipment[idx] = { ...this.equipment[idx], ...updates };
    this.persist();
    return this.equipment[idx];
  }

  getMaintenanceTickets(
    tenantId: string,
    filter?: { equipmentId?: string; status?: string; priority?: string }
  ): MaintenanceTicket[] {
    return this.maintenanceTickets
      .filter((t) => {
        if (t.tenantId !== tenantId) return false;
        if (filter?.equipmentId && t.equipmentId !== filter.equipmentId) return false;
        if (filter?.status && filter.status !== 'ALL' && t.status !== filter.status) return false;
        if (filter?.priority && filter.priority !== 'ALL' && t.priority !== filter.priority) return false;
        return true;
      })
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());
  }

  createMaintenanceTicket(
    data: Omit<MaintenanceTicket, 'id' | 'reportedAt' | 'status'> & { status?: TicketStatus }
  ): MaintenanceTicket {
    const reportedAt = new Date().toISOString();
    const isUnsafe = data.severity === 'CRITICAL_SAFETY_HAZARD';

    const ticket: MaintenanceTicket = {
      ...data,
      id: `tkt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      reportedAt,
      status: data.status || 'OPEN',
      statusHistory: [
        {
          status: data.status || 'OPEN',
          changedBy: data.reportedBy || 'Staff',
          changedAt: reportedAt,
          notes: data.description ? `Ticket logged: ${data.description}` : 'Maintenance ticket created',
        },
      ],
    };
    this.maintenanceTickets.unshift(ticket);

    // If ticket is urgent or critical safety hazard, update equipment status to OUT_OF_SERVICE & condition to CRITICAL
    const eqIdx = this.equipment.findIndex((e) => e.id === data.equipmentId);
    if (eqIdx !== -1) {
      if (isUnsafe) {
        this.equipment[eqIdx].status = 'OUT_OF_SERVICE';
        this.equipment[eqIdx].condition = 'CRITICAL';
      } else {
        this.equipment[eqIdx].status = 'UNDER_MAINTENANCE';
        if (this.equipment[eqIdx].condition === 'EXCELLENT') {
          this.equipment[eqIdx].condition = 'FAIR';
        }
      }
    }

    this.persist();
    return ticket;
  }

  updateMaintenanceTicket(
    id: string,
    updates: Partial<MaintenanceTicket>
  ): MaintenanceTicket | null {
    const idx = this.maintenanceTickets.findIndex((t) => t.id === id);
    if (idx === -1) return null;

    const oldStatus = this.maintenanceTickets[idx].status;
    const now = new Date().toISOString();

    if (!this.maintenanceTickets[idx].statusHistory) {
      this.maintenanceTickets[idx].statusHistory = [];
    }

    if (updates.status && updates.status !== oldStatus) {
      this.maintenanceTickets[idx].statusHistory!.push({
        status: updates.status,
        changedBy: updates.resolvedBy || 'Technician',
        changedAt: now,
        notes: updates.resolutionNotes || `Status updated to ${updates.status}`,
      });
    }

    this.maintenanceTickets[idx] = { ...this.maintenanceTickets[idx], ...updates };

    // If resolved, record in serviceHistory and verify if equipment can return to operational
    if (updates.status === 'RESOLVED') {
      const eqId = this.maintenanceTickets[idx].equipmentId;
      const eqIdx = this.equipment.findIndex((e) => e.id === eqId);

      if (eqIdx !== -1) {
        if (!this.equipment[eqIdx].serviceHistory) {
          this.equipment[eqIdx].serviceHistory = [];
        }

        this.equipment[eqIdx].serviceHistory!.unshift({
          id: `srv-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          ticketId: id,
          date: updates.resolvedAt || now,
          description: updates.resolutionNotes || this.maintenanceTickets[idx].title,
          performedBy: updates.resolvedBy || 'Technician',
          cost: updates.resolutionCost || 0,
        });

        this.equipment[eqIdx].lastServicedAt = updates.resolvedAt || now;

        const otherActiveTickets = this.maintenanceTickets.filter(
          (t) => t.equipmentId === eqId && t.id !== id && t.status !== 'RESOLVED'
        );
        if (otherActiveTickets.length === 0) {
          this.equipment[eqIdx].status = 'OPERATIONAL';
          this.equipment[eqIdx].condition = 'GOOD';
        }
      }

      // If resolution cost logged, also create an approved expense log
      if (updates.resolutionCost && updates.resolutionCost > 0) {
        this.createExpense({
          tenantId: this.maintenanceTickets[idx].tenantId,
          title: `Repair: ${this.maintenanceTickets[idx].equipmentName}`,
          category: 'EQUIPMENT_REPAIR',
          amount: updates.resolutionCost,
          paymentMethod: 'CASH',
          vendor: 'Internal / Vendor Maintenance',
          date: now,
          loggedBy: updates.resolvedBy || 'Technician',
          notes: updates.resolutionNotes || 'Maintenance ticket resolution cost',
          status: 'APPROVED',
          approvedBy: updates.resolvedBy || 'Technician',
          approvedAt: now,
        });
      }
    }

    this.persist();
    return this.maintenanceTickets[idx];
  }

  // ================= PILLAR 4: STAFF SHIFTS, ATTENDANCE & PT ASSIGNMENTS =================
  getStaffShifts(
    tenantId: string,
    options?: { date?: string; userId?: string }
  ): StaffShift[] {
    this.syncFromDiskIfModified();
    return this.staffShifts.filter((s) => {
      if (s.tenantId !== tenantId) return false;
      if (options?.date && s.date !== options.date) return false;
      if (options?.userId && s.userId !== options.userId) return false;
      return true;
    });
  }

  createStaffShift(data: Omit<StaffShift, 'id' | 'createdAt'>): StaffShift {
    const shift: StaffShift = {
      ...data,
      id: `shift-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.staffShifts.push(shift);
    this.persist();
    return shift;
  }

  clockInOutShift(shiftId: string, action: 'CLOCK_IN' | 'CLOCK_OUT'): StaffShift | null {
    const idx = this.staffShifts.findIndex((s) => s.id === shiftId);
    if (idx === -1) return null;

    if (action === 'CLOCK_IN') {
      this.staffShifts[idx].status = 'CLOCKED_IN';
      this.staffShifts[idx].clockedInAt = new Date().toISOString();
    } else {
      this.staffShifts[idx].status = 'COMPLETED';
      this.staffShifts[idx].clockedOutAt = new Date().toISOString();
    }
    this.persist();
    return this.staffShifts[idx];
  }

  // Personal Training Assignments
  getPTAssignments(tenantId: string, trainerId?: string): PersonalTrainingAssignment[] {
    this.syncFromDiskIfModified();
    return this.ptAssignments.filter((a) => {
      if (a.tenantId !== tenantId) return false;
      if (trainerId && a.trainerId !== trainerId) return false;
      return true;
    });
  }

  createPTAssignment(
    data: Omit<PersonalTrainingAssignment, 'id' | 'createdAt'>
  ): PersonalTrainingAssignment {
    const assignment: PersonalTrainingAssignment = {
      ...data,
      id: `pta-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };
    this.ptAssignments.unshift(assignment);
    this.persist();
    return assignment;
  }

  updatePTAssignment(
    id: string,
    updates: Partial<PersonalTrainingAssignment>
  ): PersonalTrainingAssignment | null {
    const idx = this.ptAssignments.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    this.ptAssignments[idx] = { ...this.ptAssignments[idx], ...updates };
    this.persist();
    return this.ptAssignments[idx];
  }

  // ================= PILLAR 1: LEADS & TRIAL BOOKINGS =================
  getLeads(tenantId: string): Lead[] {
    return this.leads
      .filter((l) => l.tenantId === tenantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createLead(data: Omit<Lead, 'id' | 'createdAt' | 'status'>): Lead {
    const lead: Lead = {
      ...data,
      id: `lead-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'NEW',
      createdAt: new Date().toISOString(),
    };
    this.leads.unshift(lead);
    this.persist();
    return lead;
  }

  updateLeadStatus(id: string, status: 'NEW' | 'CONTACTED' | 'CONVERTED'): Lead | null {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this.leads[idx].status = status;
    this.persist();
    return this.leads[idx];
  }

  updateLead(id: string, updates: Partial<Lead>): Lead | null {
    const idx = this.leads.findIndex((l) => l.id === id);
    if (idx === -1) return null;
    this.leads[idx] = { ...this.leads[idx], ...updates };
    this.persist();
    return this.leads[idx];
  }

  deleteLead(id: string): boolean {
    const initialLen = this.leads.length;
    this.leads = this.leads.filter((l) => l.id !== id);
    this.persist();
    return this.leads.length < initialLen;
  }

  // ================= PILLAR 7: OPERATIONAL ALERTS =================
  getOperationalAlerts(tenantId: string): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];

    // 1. Check open urgent equipment maintenance tickets
    const openTickets = this.getMaintenanceTickets(tenantId).filter(
      (t) => t.status !== 'RESOLVED'
    );
    openTickets.forEach((ticket) => {
      const isCritical = ticket.severity === 'CRITICAL_SAFETY_HAZARD' || ticket.priority === 'URGENT';
      alerts.push({
        id: `alert-tkt-${ticket.id}`,
        type: 'MAINTENANCE',
        title: isCritical ? `CRITICAL SAFETY HAZARD: ${ticket.equipmentName}` : `Repair Request: ${ticket.equipmentName}`,
        message: `${ticket.title} (${ticket.priority} priority - ${ticket.severity || 'SERVICE'})`,
        severity: isCritical || ticket.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
        timestamp: ticket.reportedAt,
        link: '/equipment',
      });
    });

    // 2. Check low inventory items (< 5 units)
    const lowProducts = this.getProducts(tenantId).filter((p) => p.stock <= 5);
    lowProducts.forEach((prod) => {
      alerts.push({
        id: `alert-stock-${prod.id}`,
        type: 'LOW_STOCK',
        title: `Low Inventory Alert: ${prod.name}`,
        message: `Only ${prod.stock} items remaining in POS stock. Reorder soon.`,
        severity: prod.stock <= 2 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date().toISOString(),
        link: '/pos',
      });
    });

    // 3. Overdue member dues (> $0)
    const membersWithDebt = this.getMembers(tenantId).filter((m) => (m.dueBalance || 0) > 0);
    if (membersWithDebt.length > 0) {
      const totalDebt = membersWithDebt.reduce((sum, m) => sum + m.dueBalance, 0);
      alerts.push({
        id: `alert-debt-summary`,
        type: 'OVERDUE_DEBT',
        title: `Uncollected Member Dues`,
        message: `${membersWithDebt.length} members owe a combined $${totalDebt.toFixed(2)}.`,
        severity: 'MEDIUM',
        timestamp: new Date().toISOString(),
        link: '/members',
      });
    }

    // 4. Expiring soon memberships (next 3 days)
    const expiringSoon = this.getMembers(tenantId).filter((m) => m.status === 'EXPIRING_SOON');
    if (expiringSoon.length > 0) {
      alerts.push({
        id: `alert-expiring-summary`,
        type: 'EXPIRING_MEMBERS',
        title: `Memberships Expiring Soon`,
        message: `${expiringSoon.length} active members expire within 72 hours. Send renewal reminder.`,
        severity: 'INFO',
        timestamp: new Date().toISOString(),
        link: '/members',
      });
    }

    return alerts;
  }

  // ================= PILLAR 6: DASHBOARD, REPORTS & NOTIFICATIONS =================

  resolveDateRange(
    period?: DateRangePeriod,
    customStart?: string,
    customEnd?: string
  ): { start: Date; end: Date; label: string } {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period) {
      case 'TODAY':
        return { start: todayStart, end: todayEnd, label: 'Today' };

      case 'YESTERDAY': {
        const yStart = new Date(todayStart.getTime() - 86400000);
        const yEnd = new Date(todayEnd.getTime() - 86400000);
        return { start: yStart, end: yEnd, label: 'Yesterday' };
      }

      case 'THIS_WEEK': {
        const day = now.getDay();
        const diff = (day === 0 ? -6 : 1) - day;
        const mon = new Date(now);
        mon.setDate(now.getDate() + diff);
        mon.setHours(0, 0, 0, 0);
        return { start: mon, end: todayEnd, label: 'This Week' };
      }

      case 'THIS_MONTH': {
        const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: mStart, end: mEnd, label: 'This Month' };
      }

      case 'THIS_QUARTER': {
        const qMonth = Math.floor(now.getMonth() / 3) * 3;
        const qStart = new Date(now.getFullYear(), qMonth, 1, 0, 0, 0, 0);
        const qEnd = new Date(now.getFullYear(), qMonth + 3, 0, 23, 59, 59, 999);
        return { start: qStart, end: qEnd, label: 'This Quarter' };
      }

      case 'THIS_YEAR': {
        const yStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        const yEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return { start: yStart, end: yEnd, label: 'This Year' };
      }

      case 'CUSTOM': {
        if (customStart && customEnd) {
          const s = new Date(customStart);
          s.setHours(0, 0, 0, 0);
          const e = new Date(customEnd);
          e.setHours(23, 59, 59, 999);
          return { start: s, end: e, label: `${customStart} to ${customEnd}` };
        }
        const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: mStart, end: mEnd, label: 'This Month' };
      }

      default: {
        const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start: mStart, end: mEnd, label: 'This Month' };
      }
    }
  }

  getReconciledDashboardData(filter: DashboardFilter) {
    const { tenantId, branchId, period, startDate, endDate } = filter;
    const { start, end, label } = this.resolveDateRange(period, startDate, endDate);

    // 1. Branch metadata
    let branchName = 'All Branches';
    if (branchId && branchId !== 'ALL') {
      const b = this.branches.find((br) => br.id === branchId && br.tenantId === tenantId);
      if (b) branchName = b.name;
    }

    // 2. Filtered Invoices & Revenue (Excluding VOIDED)
    const invoices = this.invoices.filter((inv) => {
      if (inv.tenantId !== tenantId) return false;
      if (inv.status === 'VOIDED') return false;
      if (branchId && branchId !== 'ALL' && inv.branchId && inv.branchId !== branchId) return false;
      const t = new Date(inv.createdAt).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });

    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

    const breakdownByMethodMap: Record<string, { amount: number; count: number }> = {};
    const breakdownByPlanMap: Record<string, { amount: number; count: number }> = {};

    invoices.forEach((inv) => {
      const method = inv.paymentMethod || 'OTHER';
      if (!breakdownByMethodMap[method]) breakdownByMethodMap[method] = { amount: 0, count: 0 };
      breakdownByMethodMap[method].amount += inv.paidAmount || 0;
      breakdownByMethodMap[method].count += 1;

      const planName = inv.items?.[0]?.description || 'General Invoice';
      if (!breakdownByPlanMap[planName]) breakdownByPlanMap[planName] = { amount: 0, count: 0 };
      breakdownByPlanMap[planName].amount += inv.paidAmount || 0;
      breakdownByPlanMap[planName].count += 1;
    });

    const breakdownByMethod = Object.entries(breakdownByMethodMap).map(([method, data]) => ({
      method,
      amount: Number(data.amount.toFixed(2)),
      count: data.count,
    }));

    const breakdownByPlan = Object.entries(breakdownByPlanMap).map(([planName, data]) => ({
      planName,
      amount: Number(data.amount.toFixed(2)),
      count: data.count,
    }));

    // 3. Filtered Expenses (Excluding VOIDED & REJECTED)
    const expenses = this.expenses.filter((e) => {
      if (e.tenantId !== tenantId) return false;
      if (e.status === 'VOIDED' || e.status === 'REJECTED') return false;
      if (branchId && branchId !== 'ALL' && e.branchId && e.branchId !== branchId) return false;
      const t = new Date(e.date).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

    const expenseCategoryMap: Record<string, number> = {};
    expenses.forEach((e) => {
      expenseCategoryMap[e.category] = (expenseCategoryMap[e.category] || 0) + e.amount;
    });
    const expenseBreakdownByCategory = Object.entries(expenseCategoryMap).map(([category, amount]) => ({
      category,
      amount: Number(amount.toFixed(2)),
    }));

    // 4. Profit & Loss
    const netProfit = totalRevenue - totalExpenses;
    const profitMarginPercent = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    // 5. Members
    const members = this.members.filter((m) => {
      if (m.tenantId !== tenantId) return false;
      if (branchId && branchId !== 'ALL' && m.branchId && m.branchId !== branchId) return false;
      return true;
    });

    const activeMembers = members.filter((m) => m.status === 'ACTIVE').length;
    const newThisPeriod = members.filter((m) => {
      const t = new Date(m.joinDate).getTime();
      return t >= start.getTime() && t <= end.getTime();
    }).length;
    const expiringSoon = members.filter((m) => m.status === 'EXPIRING_SOON').length;
    const expired = members.filter((m) => m.status === 'EXPIRED').length;
    const frozen = members.filter((m) => m.status === 'FROZEN').length;
    const suspended = members.filter((m) => m.status === 'SUSPENDED').length;

    // 6. Outstanding Debts / Balances
    const membersWithDebt = members.filter((m) => (m.dueBalance || 0) > 0);
    const totalOutstandingDebt = membersWithDebt.reduce((sum, m) => sum + (m.dueBalance || 0), 0);

    // 7. Check-ins
    const checkIns = this.checkIns.filter((c) => {
      if (c.tenantId !== tenantId) return false;
      if (branchId && branchId !== 'ALL' && c.branchId && c.branchId !== branchId) return false;
      if (c.status !== 'GRANTED' && c.status !== 'WARNING_EXPIRING') return false;
      const t = new Date(c.timestamp).getTime();
      return t >= start.getTime() && t <= end.getTime();
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayTotalCheckIns = this.checkIns.filter((c) => {
      if (c.tenantId !== tenantId) return false;
      if (branchId && branchId !== 'ALL' && c.branchId && c.branchId !== branchId) return false;
      if (c.status !== 'GRANTED' && c.status !== 'WARNING_EXPIRING') return false;
      return new Date(c.timestamp).getTime() >= todayStart.getTime();
    }).length;

    const occupancy = this.getLiveOccupancy(tenantId);

    const hourlyVisits = [
      { time: '06:00', visits: Math.max(1, Math.floor(checkIns.length * 0.08)) },
      { time: '08:00', visits: Math.max(2, Math.floor(checkIns.length * 0.22)) },
      { time: '10:00', visits: Math.max(1, Math.floor(checkIns.length * 0.12)) },
      { time: '12:00', visits: Math.max(1, Math.floor(checkIns.length * 0.10)) },
      { time: '14:00', visits: Math.max(1, Math.floor(checkIns.length * 0.08)) },
      { time: '16:00', visits: Math.max(2, Math.floor(checkIns.length * 0.18)) },
      { time: '18:00', visits: Math.max(3, Math.floor(checkIns.length * 0.28)) },
      { time: '20:00', visits: Math.max(2, Math.floor(checkIns.length * 0.15)) },
      { time: '22:00', visits: Math.max(1, Math.floor(checkIns.length * 0.05)) },
    ];

    // 8. Maintenance Tickets
    const tickets = this.maintenanceTickets.filter((t) => {
      if (t.tenantId !== tenantId) return false;
      if (branchId && branchId !== 'ALL' && t.branchId && t.branchId !== branchId) return false;
      return t.status !== 'RESOLVED';
    });
    const urgentTickets = tickets.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length;

    // 9. Notifications summary
    const notifs = this.notifications.filter((n) => {
      if (n.tenantId !== tenantId) return false;
      if (branchId && branchId !== 'ALL' && n.branchId && n.branchId !== branchId) return false;
      return true;
    });
    const sentCount = notifs.filter((n) => n.status === 'SENT').length;
    const failedCount = notifs.filter((n) => n.status === 'FAILED').length;
    const optedOutCount = notifs.filter((n) => n.status === 'OPTED_OUT').length;
    const pendingCount = notifs.filter((n) => n.status === 'PENDING').length;

    const isFirstUse = members.length === 0 && invoices.length === 0 && checkIns.length === 0;

    return {
      period: period || 'THIS_MONTH',
      dateRange: {
        start: start.toISOString(),
        end: end.toISOString(),
        label,
      },
      branchId: branchId || 'ALL',
      branchName,
      revenue: {
        total: Number(totalRevenue.toFixed(2)),
        count: invoices.length,
        breakdownByMethod,
        breakdownByPlan,
      },
      expenses: {
        total: Number(totalExpenses.toFixed(2)),
        count: expenses.length,
        breakdownByCategory: expenseBreakdownByCategory,
      },
      profitAndLoss: {
        grossRevenue: Number(totalRevenue.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
        profitMarginPercent,
      },
      members: {
        total: members.length,
        active: activeMembers,
        newThisPeriod,
        expiringSoon,
        expired,
        frozen,
        suspended,
      },
      debts: {
        totalOutstanding: Number(totalOutstandingDebt.toFixed(2)),
        debtorCount: membersWithDebt.length,
      },
      checkIns: {
        total: checkIns.length,
        todayTotal: todayTotalCheckIns,
        occupancy,
        hourlyDistribution: hourlyVisits,
      },
      maintenance: {
        urgentTickets,
        totalOpenTickets: tickets.length,
      },
      notificationsSummary: {
        sentCount,
        failedCount,
        optedOutCount,
        pendingCount,
      },
      isFirstUse,
    };
  }

  getMetricDrillDownRecords(tenantId: string, metricType: MetricDrillDownType, filter: DashboardFilter) {
    const { branchId, period, startDate, endDate } = filter;
    const { start, end, label } = this.resolveDateRange(period, startDate, endDate);

    switch (metricType) {
      case 'REVENUE': {
        const records = this.invoices.filter((inv) => {
          if (inv.tenantId !== tenantId) return false;
          if (inv.status === 'VOIDED') return false;
          if (branchId && branchId !== 'ALL' && inv.branchId && inv.branchId !== branchId) return false;
          const t = new Date(inv.createdAt).getTime();
          return t >= start.getTime() && t <= end.getTime();
        });
        const sum = records.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
        return {
          metric: metricType,
          filter,
          title: `Revenue Invoices (${label})`,
          summary: {
            totalRecords: records.length,
            primaryValue: Number(sum.toFixed(2)),
            unit: '$',
          },
          records: records.map((inv) => ({
            id: inv.id,
            invoiceNumber: inv.invoiceNumber,
            memberName: inv.memberName,
            amount: inv.amount,
            paidAmount: inv.paidAmount,
            balance: inv.balance,
            paymentMethod: inv.paymentMethod,
            status: inv.status,
            createdAt: inv.createdAt,
            branchId: inv.branchId,
          })),
        };
      }

      case 'ACTIVE_MEMBERS': {
        const records = this.members.filter((m) => {
          if (m.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && m.branchId && m.branchId !== branchId) return false;
          return m.status === 'ACTIVE';
        });
        return {
          metric: metricType,
          filter,
          title: `Active Members`,
          summary: {
            totalRecords: records.length,
            primaryValue: records.length,
            unit: 'Members',
          },
          records: records.map((m) => ({
            id: m.id,
            memberNumber: m.memberNumber,
            name: `${m.firstName} ${m.lastName}`,
            phone: m.phone,
            email: m.email,
            status: m.status,
            planName: m.currentPlanName,
            subscriptionEnd: m.subscriptionEnd,
            branchId: m.branchId,
          })),
        };
      }

      case 'NEW_MEMBERS': {
        const records = this.members.filter((m) => {
          if (m.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && m.branchId && m.branchId !== branchId) return false;
          const t = new Date(m.joinDate).getTime();
          return t >= start.getTime() && t <= end.getTime();
        });
        return {
          metric: metricType,
          filter,
          title: `New Members Joined (${label})`,
          summary: {
            totalRecords: records.length,
            primaryValue: records.length,
            unit: 'Members',
          },
          records: records.map((m) => ({
            id: m.id,
            memberNumber: m.memberNumber,
            name: `${m.firstName} ${m.lastName}`,
            phone: m.phone,
            email: m.email,
            status: m.status,
            joinDate: m.joinDate,
            planName: m.currentPlanName,
            branchId: m.branchId,
          })),
        };
      }

      case 'EXPIRING_SOON': {
        const records = this.members.filter((m) => {
          if (m.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && m.branchId && m.branchId !== branchId) return false;
          return m.status === 'EXPIRING_SOON';
        });
        return {
          metric: metricType,
          filter,
          title: `Memberships Expiring Soon`,
          summary: {
            totalRecords: records.length,
            primaryValue: records.length,
            unit: 'Members',
          },
          records: records.map((m) => ({
            id: m.id,
            memberNumber: m.memberNumber,
            name: `${m.firstName} ${m.lastName}`,
            phone: m.phone,
            email: m.email,
            daysRemaining: m.daysRemaining,
            subscriptionEnd: m.subscriptionEnd,
            planName: m.currentPlanName,
            notificationOptIn: m.notificationOptIn,
            smsOptOut: m.smsOptOut,
            branchId: m.branchId,
          })),
        };
      }

      case 'EXPIRED': {
        const records = this.members.filter((m) => {
          if (m.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && m.branchId && m.branchId !== branchId) return false;
          return m.status === 'EXPIRED';
        });
        return {
          metric: metricType,
          filter,
          title: `Expired Memberships`,
          summary: {
            totalRecords: records.length,
            primaryValue: records.length,
            unit: 'Members',
          },
          records: records.map((m) => ({
            id: m.id,
            memberNumber: m.memberNumber,
            name: `${m.firstName} ${m.lastName}`,
            phone: m.phone,
            email: m.email,
            subscriptionEnd: m.subscriptionEnd,
            dueBalance: m.dueBalance,
            planName: m.currentPlanName,
            notificationOptIn: m.notificationOptIn,
            smsOptOut: m.smsOptOut,
            branchId: m.branchId,
          })),
        };
      }

      case 'CHECK_INS': {
        const records = this.checkIns.filter((c) => {
          if (c.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && c.branchId && c.branchId !== branchId) return false;
          if (c.status !== 'GRANTED' && c.status !== 'WARNING_EXPIRING') return false;
          const t = new Date(c.timestamp).getTime();
          return t >= start.getTime() && t <= end.getTime();
        });
        return {
          metric: metricType,
          filter,
          title: `Check-in Logs (${label})`,
          summary: {
            totalRecords: records.length,
            primaryValue: records.length,
            unit: 'Visits',
          },
          records: records.map((c) => ({
            id: c.id,
            memberName: c.memberName,
            memberNumber: c.memberNumber,
            timestamp: c.timestamp,
            method: c.method,
            status: c.status,
            lockerAssigned: c.lockerAssigned,
            branchName: c.branchName,
          })),
        };
      }

      case 'OUTSTANDING_BALANCES': {
        const records = this.members.filter((m) => {
          if (m.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && m.branchId && m.branchId !== branchId) return false;
          return (m.dueBalance || 0) > 0;
        });
        const sum = records.reduce((acc, m) => acc + (m.dueBalance || 0), 0);
        return {
          metric: metricType,
          filter,
          title: `Members with Outstanding Dues`,
          summary: {
            totalRecords: records.length,
            primaryValue: Number(sum.toFixed(2)),
            unit: '$',
          },
          records: records.map((m) => ({
            id: m.id,
            memberNumber: m.memberNumber,
            name: `${m.firstName} ${m.lastName}`,
            phone: m.phone,
            dueBalance: m.dueBalance,
            status: m.status,
            planName: m.currentPlanName,
            branchId: m.branchId,
          })),
        };
      }

      case 'EXPENSES': {
        const records = this.expenses.filter((e) => {
          if (e.tenantId !== tenantId) return false;
          if (e.status === 'VOIDED' || e.status === 'REJECTED') return false;
          if (branchId && branchId !== 'ALL' && e.branchId && e.branchId !== branchId) return false;
          const t = new Date(e.date).getTime();
          return t >= start.getTime() && t <= end.getTime();
        });
        const sum = records.reduce((acc, e) => acc + (e.amount || 0), 0);
        return {
          metric: metricType,
          filter,
          title: `Operating Expenses (${label})`,
          summary: {
            totalRecords: records.length,
            primaryValue: Number(sum.toFixed(2)),
            unit: '$',
          },
          records: records.map((e) => ({
            id: e.id,
            title: e.title,
            category: e.category,
            amount: e.amount,
            vendor: e.vendor,
            paymentMethod: e.paymentMethod,
            date: e.date,
            status: e.status,
            loggedBy: e.loggedBy,
            branchId: e.branchId,
          })),
        };
      }

      case 'URGENT_TICKETS': {
        const records = this.maintenanceTickets.filter((t) => {
          if (t.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && t.branchId && t.branchId !== branchId) return false;
          return t.status !== 'RESOLVED' && (t.priority === 'URGENT' || t.priority === 'HIGH');
        });
        return {
          metric: metricType,
          filter,
          title: `Urgent Maintenance Tickets`,
          summary: {
            totalRecords: records.length,
            primaryValue: records.length,
            unit: 'Tickets',
          },
          records: records.map((t) => ({
            id: t.id,
            title: t.title,
            equipmentName: t.equipmentName,
            priority: t.priority,
            status: t.status,
            reportedAt: t.reportedAt,
            assigneeName: t.assigneeName,
            branchId: t.branchId,
          })),
        };
      }

      case 'NET_PROFIT': {
        const dashboard = this.getReconciledDashboardData(filter);
        return {
          metric: metricType,
          filter,
          title: `Net Profit Summary (${label})`,
          summary: {
            totalRecords: dashboard.revenue.count + dashboard.expenses.count,
            primaryValue: dashboard.profitAndLoss.netProfit,
            secondaryValue: dashboard.profitAndLoss.grossRevenue,
            unit: '$',
          },
          records: [
            { item: 'Gross Revenue', amount: dashboard.profitAndLoss.grossRevenue, count: dashboard.revenue.count },
            { item: 'Total Expenses', amount: -dashboard.profitAndLoss.totalExpenses, count: dashboard.expenses.count },
            { item: 'Net Profit', amount: dashboard.profitAndLoss.netProfit, margin: `${dashboard.profitAndLoss.profitMarginPercent}%` },
          ],
        };
      }

      default:
        throw new Error(`Unsupported drill-down metric type: ${metricType}`);
    }
  }

  getFinancialAndMembershipReport(tenantId: string, filter: DashboardFilter): FinancialReportData {
    const dashboard = this.getReconciledDashboardData(filter);
    const members = this.members.filter((m) => {
      if (m.tenantId !== tenantId) return false;
      if (filter.branchId && filter.branchId !== 'ALL' && m.branchId && m.branchId !== filter.branchId) return false;
      return true;
    });

    const agedReceivables = {
      current: 0,
      days31to60: 0,
      days61to90: 0,
      days90Plus: 0,
      total: 0,
    };

    members.forEach((m) => {
      const debt = m.dueBalance || 0;
      if (debt <= 0) return;
      agedReceivables.total += debt;
      const daysOverdue = m.daysRemaining !== undefined && m.daysRemaining < 0 ? Math.abs(m.daysRemaining) : 15;
      if (daysOverdue <= 30) {
        agedReceivables.current += debt;
      } else if (daysOverdue <= 60) {
        agedReceivables.days31to60 += debt;
      } else if (daysOverdue <= 90) {
        agedReceivables.days61to90 += debt;
      } else {
        agedReceivables.days90Plus += debt;
      }
    });

    const debtorMembers: { id: string; name: string; phone: string; balance: number; daysOverdue: number }[] = [];
    let aged0To30 = 0;
    let aged31To60 = 0;
    let aged61To90 = 0;
    let aged90Plus = 0;
    let totalDebt = 0;

    members.forEach((m) => {
      const debt = m.dueBalance || 0;
      if (debt <= 0) return;
      totalDebt += debt;
      const daysOverdue = m.daysRemaining !== undefined && m.daysRemaining < 0 ? Math.abs(m.daysRemaining) : 15;
      debtorMembers.push({
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        phone: m.phone,
        balance: debt,
        daysOverdue,
      });

      if (daysOverdue <= 30) {
        aged0To30 += debt;
      } else if (daysOverdue <= 60) {
        aged31To60 += debt;
      } else if (daysOverdue <= 90) {
        aged61To90 += debt;
      } else {
        aged90Plus += debt;
      }
    });

    const activeCount = dashboard.members.active;
    const expiredCount = dashboard.members.expired;
    const expiringSoonCount = dashboard.members.expiringSoon;
    const totalRenewalCohort = activeCount + expiredCount;
    const conversionRatePercent =
      totalRenewalCohort > 0 ? Number(((activeCount / totalRenewalCohort) * 100).toFixed(1)) : 100;
    const churnedCount = expiredCount;

    // Revenue by service
    let membershipsRev = 0;
    let posRev = 0;
    let lockersRev = 0;
    dashboard.revenue.breakdownByPlan.forEach((p) => {
      const lower = p.planName.toLowerCase();
      if (lower.includes('pos') || lower.includes('product') || lower.includes('beverage') || lower.includes('shake')) {
        posRev += p.amount;
      } else if (lower.includes('locker')) {
        lockersRev += p.amount;
      } else {
        membershipsRev += p.amount;
      }
    });

    // Revenue by payment method
    const pmMap: Record<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY', number> = {
      CASH: 0,
      CARD: 0,
      BANK_TRANSFER: 0,
      MOBILE_MONEY: 0,
    };
    dashboard.revenue.breakdownByMethod.forEach((m) => {
      const k = m.method as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'MOBILE_MONEY';
      if (pmMap[k] !== undefined) {
        pmMap[k] += m.amount;
      }
    });

    // Expenses by category
    const expCatMap: Record<ExpenseCategory, number> = {
      UTILITIES: 0,
      EQUIPMENT_REPAIR: 0,
      PAYROLL: 0,
      INVENTORY: 0,
      FACILITY_RENT: 0,
      MARKETING: 0,
      OTHER: 0,
    };
    dashboard.expenses.breakdownByCategory.forEach((c) => {
      const cat = c.category as ExpenseCategory;
      if (expCatMap[cat] !== undefined) {
        expCatMap[cat] = c.amount;
      } else {
        expCatMap.OTHER = (expCatMap.OTHER || 0) + c.amount;
      }
    });

    return {
      tenantId,
      branchId: filter.branchId,
      branchName: dashboard.branchName,
      period: filter.period || 'THIS_MONTH',
      startDate: dashboard.dateRange.start,
      endDate: dashboard.dateRange.end,
      revenueByService: {
        memberships: Number(membershipsRev.toFixed(2)),
        pos: Number(posRev.toFixed(2)),
        lockers: Number(lockersRev.toFixed(2)),
        total: dashboard.revenue.total,
      },
      revenueByPaymentMethod: {
        CASH: Number(pmMap.CASH.toFixed(2)),
        CARD: Number(pmMap.CARD.toFixed(2)),
        BANK_TRANSFER: Number(pmMap.BANK_TRANSFER.toFixed(2)),
        MOBILE_MONEY: Number(pmMap.MOBILE_MONEY.toFixed(2)),
        total: dashboard.revenue.total,
      },
      expensesByCategory: expCatMap,
      totalExpenses: dashboard.profitAndLoss.totalExpenses,
      grossRevenue: dashboard.profitAndLoss.grossRevenue,
      netProfit: dashboard.profitAndLoss.netProfit,
      profitMarginPercent: dashboard.profitAndLoss.profitMarginPercent,
      outstandingBalances: {
        totalOutstanding: Number(totalDebt.toFixed(2)),
        debtorCount: debtorMembers.length,
        aged0To30: Number(aged0To30.toFixed(2)),
        aged31To60: Number(aged31To60.toFixed(2)),
        aged61To90: Number(aged61To90.toFixed(2)),
        aged90Plus: Number(aged90Plus.toFixed(2)),
        members: debtorMembers,
      },
      renewalMetrics: {
        expiringOrExpiredTotal: totalRenewalCohort,
        renewedCount: activeCount,
        conversionRatePercent,
        churnedCount,
      },
      membershipStatusDistribution: {
        active: activeCount,
        expiringSoon: expiringSoonCount,
        expired: expiredCount,
        suspended: dashboard.members.suspended,
        frozen: dashboard.members.frozen,
        total: members.length,
      },
    };
  }

  exportReportData(
    tenantId: string,
    branchId: string | undefined,
    reportType: 'FINANCIAL' | 'MEMBERSHIP' | 'CHECK_IN' | 'EXPENSES',
    format: 'CSV' | 'JSON',
    actor: User
  ): { filename: string; contentType: string; data: string } {
    const allowedRoles: UserRole[] = ['SUPER_ADMIN', 'OWNER', 'GYM_OWNER', 'GENERAL_MANAGER', 'FINANCE_OFFICER'];
    if (!allowedRoles.includes(actor.role)) {
      throw new Error(`FORBIDDEN: Role '${actor.role}' is not authorized to export reports.`);
    }

    if (actor.role !== 'SUPER_ADMIN' && actor.tenantId !== tenantId) {
      throw new Error(`FORBIDDEN: Cross-tenant access denied.`);
    }

    const tenant = this.getTenantById(tenantId);
    const tenantName = tenant ? tenant.name : tenantId;
    const branches = this.getBranches(tenantId);
    let branchName = 'All Branches';
    if (branchId && branchId !== 'ALL') {
      const b = branches.find((br) => br.id === branchId);
      if (b) branchName = b.name;
    }

    const timestamp = new Date().toISOString();
    const filter: DashboardFilter = {
      tenantId,
      branchId: branchId || 'ALL',
      period: 'THIS_YEAR',
    };

    let payload: any;
    let csvHeaders: string[] = [];
    let csvRows: string[][] = [];

    switch (reportType) {
      case 'FINANCIAL': {
        const rep = this.getFinancialAndMembershipReport(tenantId, filter);
        payload = rep;
        csvHeaders = ['Metric Category', 'Subcategory / Item', 'Amount / Value ($)', 'Share / Rate (%)'];
        csvRows.push(['Profit & Loss', 'Gross Revenue', rep.grossRevenue.toFixed(2), '100%']);
        csvRows.push(['Profit & Loss', 'Total Expenses', rep.totalExpenses.toFixed(2), '']);
        csvRows.push(['Profit & Loss', 'Net Profit', rep.netProfit.toFixed(2), `${rep.profitMarginPercent}%`]);
        csvRows.push(['Revenue by Service', 'Memberships', rep.revenueByService.memberships.toFixed(2), '']);
        csvRows.push(['Revenue by Service', 'POS Products', rep.revenueByService.pos.toFixed(2), '']);
        csvRows.push(['Revenue by Service', 'Lockers', rep.revenueByService.lockers.toFixed(2), '']);
        csvRows.push(['Revenue by Payment Method', 'CASH', rep.revenueByPaymentMethod.CASH.toFixed(2), '']);
        csvRows.push(['Revenue by Payment Method', 'CARD', rep.revenueByPaymentMethod.CARD.toFixed(2), '']);
        csvRows.push(['Revenue by Payment Method', 'BANK_TRANSFER', rep.revenueByPaymentMethod.BANK_TRANSFER.toFixed(2), '']);
        csvRows.push(['Revenue by Payment Method', 'MOBILE_MONEY', rep.revenueByPaymentMethod.MOBILE_MONEY.toFixed(2), '']);
        Object.entries(rep.expensesByCategory).forEach(([cat, amt]) => {
          if (amt > 0) csvRows.push(['Expenses by Category', cat, amt.toFixed(2), '']);
        });
        csvRows.push(['Aged Receivables', 'Current (0-30 days)', rep.outstandingBalances.aged0To30.toFixed(2), '']);
        csvRows.push(['Aged Receivables', '31-60 days', rep.outstandingBalances.aged31To60.toFixed(2), '']);
        csvRows.push(['Aged Receivables', '61-90 days', rep.outstandingBalances.aged61To90.toFixed(2), '']);
        csvRows.push(['Aged Receivables', '90+ days overdue', rep.outstandingBalances.aged90Plus.toFixed(2), '']);
        csvRows.push(['Aged Receivables', 'Total Overdue Dues', rep.outstandingBalances.totalOutstanding.toFixed(2), '']);
        break;
      }

      case 'MEMBERSHIP': {
        const mems = this.members.filter((m) => {
          if (m.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && m.branchId && m.branchId !== branchId) return false;
          return true;
        });
        payload = mems;
        csvHeaders = ['Member Number', 'Name', 'Phone', 'Email', 'Status', 'Plan', 'Days Remaining', 'Due Balance'];
        csvRows = mems.map((m) => [
          m.memberNumber,
          `${m.firstName} ${m.lastName}`,
          m.phone,
          m.email || '',
          m.status,
          m.currentPlanName || '',
          String(m.daysRemaining ?? ''),
          String(m.dueBalance ?? 0),
        ]);
        break;
      }

      case 'CHECK_IN': {
        const checkins = this.checkIns.filter((c) => {
          if (c.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && c.branchId && c.branchId !== branchId) return false;
          return true;
        });
        payload = checkins;
        csvHeaders = ['Check-in ID', 'Timestamp', 'Member Name', 'Member Number', 'Status', 'Method', 'Branch'];
        csvRows = checkins.map((c) => [
          c.id,
          c.timestamp,
          c.memberName,
          c.memberNumber,
          c.status,
          c.method,
          c.branchName || branchName,
        ]);
        break;
      }

      case 'EXPENSES': {
        const exps = this.expenses.filter((e) => {
          if (e.tenantId !== tenantId) return false;
          if (branchId && branchId !== 'ALL' && e.branchId && e.branchId !== branchId) return false;
          return true;
        });
        payload = exps;
        csvHeaders = ['Expense ID', 'Date', 'Title', 'Category', 'Amount', 'Vendor', 'Payment Method', 'Status'];
        csvRows = exps.map((e) => [
          e.id,
          e.date,
          `"${e.title.replace(/"/g, '""')}"`,
          e.category,
          e.amount.toFixed(2),
          `"${e.vendor.replace(/"/g, '""')}"`,
          e.paymentMethod,
          e.status || 'APPROVED',
        ]);
        break;
      }

      default:
        throw new Error(`Unsupported report type: ${reportType}`);
    }

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'REPORT_EXPORTED',
      entityType: 'REPORT',
      entityId: `${reportType}-${Date.now()}`,
      metadata: {
        reportType,
        format,
        branchId: branchId || 'ALL',
        branchName,
      },
    });

    const filenameBase = `${tenantName.toLowerCase().replace(/\s+/g, '_')}_${reportType.toLowerCase()}_${new Date().toISOString().split('T')[0]}`;

    if (format === 'JSON') {
      const output = {
        metadata: {
          organization: tenantName,
          tenantId,
          branch: branchName,
          branchId: branchId || 'ALL',
          reportType,
          format: 'JSON',
          generatedAt: timestamp,
          generatedBy: {
            id: actor.id,
            name: actor.name,
            role: actor.role,
          },
        },
        data: payload,
      };
      return {
        filename: `${filenameBase}.json`,
        contentType: 'application/json',
        data: JSON.stringify(output, null, 2),
      };
    }

    const metadataLines = [
      `# Organization: ${tenantName} (ID: ${tenantId})`,
      `# Branch: ${branchName} (ID: ${branchId || 'ALL'})`,
      `# Report Type: ${reportType}`,
      `# Generated At: ${timestamp}`,
      `# Generated By: ${actor.name} (${actor.role})`,
      '',
    ];
    const csvContent = [
      ...metadataLines,
      csvHeaders.join(','),
      ...csvRows.map((row) => row.join(',')),
    ].join('\n');

    return {
      filename: `${filenameBase}.csv`,
      contentType: 'text/csv; charset=utf-8',
      data: csvContent,
    };
  }

  // ================= NOTIFICATIONS ENGINE =================

  getNotificationLogs(
    tenantId: string,
    options?: { branchId?: string; status?: NotificationStatus; type?: NotificationType }
  ): NotificationLog[] {
    return this.notifications
      .filter((n) => {
        if (n.tenantId !== tenantId) return false;
        if (options?.branchId && options.branchId !== 'ALL' && n.branchId && n.branchId !== options.branchId) return false;
        if (options?.status && n.status !== options.status) return false;
        if (options?.type && n.type !== options.type) return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getNotificationSettings(tenantId: string): NotificationSettings {
    const existing = this.notificationSettings.find((s) => s.tenantId === tenantId);
    if (existing) return existing;

    const defaultSettings: NotificationSettings = {
      tenantId,
      renewalNoticeDaysBefore: [7, 3, 1],
      enableSms: true,
      enableEmail: true,
      enableInApp: true,
      maxRetryAttempts: 3,
      senderName: 'Apex Fitness Center',
      autoDispatchEnabled: true,
    };
    this.notificationSettings.push(defaultSettings);
    this.persist();
    return defaultSettings;
  }

  updateNotificationSettings(
    tenantId: string,
    updates: Partial<NotificationSettings>,
    actor: User
  ): NotificationSettings {
    const idx = this.notificationSettings.findIndex((s) => s.tenantId === tenantId);
    if (idx === -1) {
      const newSettings: NotificationSettings = {
        tenantId,
        renewalNoticeDaysBefore: updates.renewalNoticeDaysBefore || [7, 3, 1],
        enableSms: updates.enableSms ?? true,
        enableEmail: updates.enableEmail ?? true,
        enableInApp: updates.enableInApp ?? true,
        maxRetryAttempts: updates.maxRetryAttempts ?? 3,
        senderName: updates.senderName || 'Apex Fitness Center',
        autoDispatchEnabled: updates.autoDispatchEnabled ?? true,
        lastRunAt: updates.lastRunAt,
      };
      this.notificationSettings.push(newSettings);
      this.persist();
      return newSettings;
    }

    this.notificationSettings[idx] = {
      ...this.notificationSettings[idx],
      ...updates,
    };

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'NOTIFICATION_SETTINGS_UPDATED',
      entityType: 'NOTIFICATION',
      entityId: `settings-${tenantId}`,
      metadata: updates,
    });

    this.persist();
    return this.notificationSettings[idx];
  }

  dispatchNotifications(
    tenantId: string,
    actor: User,
    options?: { previewOnly?: boolean; branchId?: string }
  ): { dispatchedCount: number; optedOutCount: number; failedCount: number; logs: NotificationLog[] } {
    const settings = this.getNotificationSettings(tenantId);
    const configuredDays = settings.renewalNoticeDaysBefore || [7, 3, 1];

    const members = this.members.filter((m) => {
      if (m.tenantId !== tenantId) return false;
      if (options?.branchId && options.branchId !== 'ALL' && m.branchId && m.branchId !== options.branchId) return false;
      if (m.status === 'EXPIRING_SOON' || m.status === 'EXPIRED') return true;
      if (m.daysRemaining !== undefined && configuredDays.includes(m.daysRemaining)) return true;
      return false;
    });

    const createdLogs: NotificationLog[] = [];
    let dispatchedCount = 0;
    let optedOutCount = 0;
    let failedCount = 0;

    members.forEach((member) => {
      const isExpiring = member.status === 'EXPIRING_SOON' || (member.daysRemaining !== undefined && member.daysRemaining > 0);
      const notifType: NotificationType = isExpiring ? 'EXPIRING_SOON' : 'EXPIRED';
      const daysText = member.daysRemaining !== undefined ? `${member.daysRemaining} days` : 'soon';
      const title = isExpiring ? 'Membership Renewal Reminder' : 'Membership Expired Notice';
      const message = isExpiring
        ? `Hello ${member.firstName}, your gym membership expires in ${daysText}. Please renew with Apex Fitness to avoid service interruption.`
        : `Hello ${member.firstName}, your gym membership has expired. Visit the front desk or mobile portal to reactivate.`;

      // 1. Consent check
      const hasOptedOut = member.smsOptOut === true || member.notificationOptIn === false;
      const recipientContact = member.phone || member.email || '';

      if (hasOptedOut) {
        optedOutCount += 1;
        const log: NotificationLog = {
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          tenantId,
          branchId: member.branchId,
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          recipientContact,
          channel: 'SMS',
          type: notifType,
          title,
          message,
          status: 'OPTED_OUT',
          failureReason: 'Recipient has opted out of automated notifications',
          retryCount: 0,
          maxRetries: settings.maxRetryAttempts || 3,
          createdAt: new Date().toISOString(),
          lastAttemptAt: new Date().toISOString(),
        };
        createdLogs.push(log);
        if (!options?.previewOnly) this.notifications.unshift(log);
        return;
      }

      // 2. Validate contact details
      if (!recipientContact || recipientContact.trim().length < 5) {
        failedCount += 1;
        const log: NotificationLog = {
          id: `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          tenantId,
          branchId: member.branchId,
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          recipientContact: 'UNKNOWN',
          channel: 'SMS',
          type: notifType,
          title,
          message,
          status: 'FAILED',
          failureReason: 'Invalid or missing phone number / contact info',
          retryCount: 0,
          maxRetries: settings.maxRetryAttempts || 3,
          createdAt: new Date().toISOString(),
          lastAttemptAt: new Date().toISOString(),
        };
        createdLogs.push(log);
        if (!options?.previewOnly) this.notifications.unshift(log);
        return;
      }

      // 3. Successful dispatch
      dispatchedCount += 1;
      const log: NotificationLog = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        tenantId,
        branchId: member.branchId,
        memberId: member.id,
        memberName: `${member.firstName} ${member.lastName}`,
        recipientContact,
        channel: 'SMS',
        type: notifType,
        title,
        message,
        status: 'SENT',
        retryCount: 0,
        maxRetries: settings.maxRetryAttempts || 3,
        sentAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        lastAttemptAt: new Date().toISOString(),
      };
      createdLogs.push(log);
      if (!options?.previewOnly) this.notifications.unshift(log);
    });

    if (!options?.previewOnly) {
      settings.lastRunAt = new Date().toISOString();
      this.recordAuditEvent({
        tenantId,
        actorId: actor.id,
        actorName: actor.name,
        actorRole: actor.role,
        action: 'NOTIFICATION_SENT',
        entityType: 'NOTIFICATION',
        entityId: `dispatch-${Date.now()}`,
        metadata: {
          dispatchedCount,
          optedOutCount,
          failedCount,
          branchId: options?.branchId || 'ALL',
        },
      });
      this.persist();
    }

    return {
      dispatchedCount,
      optedOutCount,
      failedCount,
      logs: createdLogs,
    };
  }

  retryNotification(tenantId: string, notificationId: string, actor: User): NotificationLog {
    const idx = this.notifications.findIndex((n) => n.id === notificationId && n.tenantId === tenantId);
    if (idx === -1) {
      throw new Error(`Notification record '${notificationId}' not found.`);
    }

    const log = this.notifications[idx];

    // Check maximum retry limit (max 3)
    if (log.retryCount >= log.maxRetries) {
      throw new Error(`Maximum retry limit (${log.maxRetries}) exceeded. Further retries are blocked.`);
    }

    // Check if member opted out in the meantime
    if (log.memberId) {
      const member = this.getMemberById(log.memberId);
      if (member && (member.smsOptOut === true || member.notificationOptIn === false)) {
        log.status = 'OPTED_OUT';
        log.failureReason = 'Recipient has opted out of automated notifications';
        log.lastAttemptAt = new Date().toISOString();
        this.persist();
        throw new Error(`Cannot retry: Recipient has opted out of automated notifications.`);
      }
    }

    log.retryCount += 1;
    log.lastAttemptAt = new Date().toISOString();

    if (!log.recipientContact || log.recipientContact === 'UNKNOWN') {
      log.status = 'FAILED';
      log.failureReason = 'Invalid or missing phone number / contact info';
      this.persist();
      throw new Error(`Retry failed: recipient contact is still missing.`);
    }

    log.status = 'SENT';
    log.sentAt = new Date().toISOString();
    log.failureReason = undefined;

    this.recordAuditEvent({
      tenantId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'NOTIFICATION_RETRIED',
      entityType: 'NOTIFICATION',
      entityId: log.id,
      metadata: {
        attempt: log.retryCount,
        recipient: log.recipientContact,
      },
    });

    this.persist();
    return { ...log };
  }
}

// Global Singleton Instance
declare global {
  // eslint-disable-next-line no-var
  var __gymOSStorage: DataStorage | undefined;
}

export const db = global.__gymOSStorage || new DataStorage();
if (process.env.NODE_ENV !== 'production') {
  global.__gymOSStorage = db;
}
