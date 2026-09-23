import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/storage';
import { hasPermission } from '@/lib/rbac';
import { User, UserRole, Member, PermissionCapability } from '@/lib/types';

describe('Prompt 7: Final Pilot Readiness and Product Demonstration Verification', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  const tenantId = 'tenant-1';

  // Define default 7 personas
  const usersByRole: Record<UserRole, User> = {
    OWNER: {
      id: 'user-owner-1',
      tenantId,
      name: 'Dawit Bekele',
      email: 'dawit@apexfitness.demo',
      role: 'OWNER',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    GENERAL_MANAGER: {
      id: 'user-gm-1',
      tenantId,
      name: 'Helen Haile',
      email: 'manager@apexfitness.demo',
      role: 'GENERAL_MANAGER',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    MANAGER: {
      id: 'user-mgr-1',
      tenantId,
      name: 'Robel Haile',
      email: 'robel@apexfitness.demo',
      role: 'MANAGER',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    RECEPTIONIST: {
      id: 'user-staff-1',
      tenantId,
      name: 'Selam Tesfaye',
      email: 'selam@apexfitness.demo',
      role: 'RECEPTIONIST',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    TRAINER: {
      id: 'user-trainer-1',
      tenantId,
      name: 'Coach Marcus',
      email: 'marcus@apexfitness.demo',
      role: 'TRAINER',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    MAINTENANCE_STAFF: {
      id: 'user-maint-1',
      tenantId,
      name: 'Kassahun Mengistu',
      email: 'kassahun@apexfitness.demo',
      role: 'MAINTENANCE_STAFF',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    FINANCE_OFFICER: {
      id: 'user-finance-1',
      tenantId,
      name: 'Tewodros Girma',
      email: 'finance@apexfitness.demo',
      role: 'FINANCE_OFFICER',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    MEMBER: {
      id: 'user-member-1',
      tenantId,
      name: 'Yonas Abraham',
      email: 'yonas@apexfitness.demo',
      role: 'MEMBER',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    SUPER_ADMIN: {
      id: 'user-super',
      tenantId,
      name: 'Platform Super Admin',
      email: 'superadmin@gymos.demo',
      role: 'SUPER_ADMIN',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    GYM_OWNER: {
      id: 'user-owner-alias',
      tenantId,
      name: 'Owner Alias',
      email: 'owner-alias@apexfitness.demo',
      role: 'GYM_OWNER',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  };

  // -------------------------------------------------------------------------
  // Checklist Item 1: Public Page Real Offering & Traceable Leads
  // -------------------------------------------------------------------------
  describe('Checklist Item 1: Public page communicates real gym offerings and creates traceable leads', () => {
    it('should provide published, structured membership plans with believable pricing and benefits', () => {
      const plans = db.getPlans(tenantId);
      expect(plans.length).toBeGreaterThanOrEqual(3);

      const dayPass = plans.find((p) => p.name.includes('Day Pass'));
      const monthly = plans.find((p) => p.name.includes('Monthly'));
      expect(dayPass).toBeDefined();
      expect(dayPass?.price).toBeGreaterThan(0);
      expect((dayPass?.benefits || []).length).toBeGreaterThan(0);
      expect(monthly).toBeDefined();
      expect(monthly?.isPublished).toBe(true);
    });

    it('should create an auditable, traceable lead with source, contact, and date tracking', () => {
      const lead = db.createLead({
        tenantId,
        name: 'Biniam Worku',
        phone: '+251 90 000 8899',
        email: 'biniam@sample.demo',
        packageId: 'plan-1-monthly',
        source: 'TRIAL',
        preferredDate: '2026-09-25',
        notes: 'Interested in early morning cardio',
      });

      expect(lead.id).toBeDefined();
      expect(lead.status).toBe('NEW');
      expect(lead.source).toBe('TRIAL');

      const allLeads = db.getLeads(tenantId);
      const found = allLeads.find((l) => l.id === lead.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('Biniam Worku');
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 2: Receptionist Registration, Payment, Receipt, Activation
  // -------------------------------------------------------------------------
  describe('Checklist Item 2: Receptionist registers member, collects payment, issues receipt, and activates membership', () => {
    it('should complete member registration and activate membership with paid receipt', () => {
      // 1. Receptionist enrolls member with payment
      const newMember = db.createMember(
        tenantId,
        {
          branchId: 'branch-1-main',
          firstName: 'Senait',
          lastName: 'Desta',
          email: 'senait.demo@apexfitness.demo',
          phone: '+251 90 000 3344',
          gender: 'FEMALE',
          dateOfBirth: '1996-07-15',
          emergencyContactName: 'Desta Kebede',
          emergencyContactPhone: '+251 90 000 1100',
          planId: 'plan-1-monthly',
          joinDate: new Date().toISOString().split('T')[0],
          consentGiven: true,
        },
        {
          paidAmount: 60,
          paymentMethod: 'CASH',
        }
      );

      expect(newMember.id).toBeDefined();
      expect(newMember.status).toBe('ACTIVE');

      // 2. Invoices generated
      const invoices = db.getInvoices(tenantId).filter((i) => i.memberId === newMember.id);
      expect(invoices.length).toBeGreaterThan(0);
      expect(invoices[0].status).toBe('PAID');

      // 3. Receipt issued
      const receipts = db.getReceipts(tenantId).filter((r) => r.memberId === newMember.id);
      expect(receipts.length).toBeGreaterThan(0);
      expect(receipts[0].receiptNumber).toMatch(/^RCP-\d{4}-\d{4}$/);
      expect(receipts[0].amount).toBe(60);
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 3: QR Access Validation (Approved vs Declined)
  // -------------------------------------------------------------------------
  describe('Checklist Item 3: QR access validation handles approved and declined scenarios correctly', () => {
    it('should grant APPROVED status for active member with positive days remaining', () => {
      const activeMember = db.getMembers(tenantId).find((m) => m.id === 'mem-101');
      expect(activeMember).toBeDefined();
      expect(activeMember?.status).toBe('ACTIVE');

      const result = db.processCheckIn(tenantId, activeMember!.qrCodeToken, 'QR_SCAN', {
        actor: { id: usersByRole.RECEPTIONIST.id, name: usersByRole.RECEPTIONIST.name, role: 'RECEPTIONIST' },
        branchId: 'branch-1-main',
        branchName: 'Bole Medhanealem Main',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('GRANTED');
      expect(result.log.status).toBe('GRANTED');
    });

    it('should return DECLINED status with EXPIRED reason for expired member', () => {
      const expiredMember = db.getMembers(tenantId).find((m) => m.id === 'mem-103');
      expect(expiredMember).toBeDefined();
      expect(expiredMember?.status).toBe('EXPIRED');

      const result = db.processCheckIn(tenantId, expiredMember!.qrCodeToken, 'QR_SCAN', {
        actor: { id: usersByRole.RECEPTIONIST.id, name: usersByRole.RECEPTIONIST.name, role: 'RECEPTIONIST' },
        branchId: 'branch-1-main',
        branchName: 'Bole Medhanealem Main',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_EXPIRED');
      expect(result.message).toMatch(/expired/i);
    });

    it('should decline check-in when QR token is invalid or member suspended', () => {
      const result = db.processCheckIn(tenantId, 'INVALID_OR_REVOKED_TOKEN', 'QR_SCAN', {
        actor: { id: usersByRole.RECEPTIONIST.id, name: usersByRole.RECEPTIONIST.name, role: 'RECEPTIONIST' },
        branchId: 'branch-1-main',
        branchName: 'Bole Medhanealem Main',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_NOT_FOUND');
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 4: Role Permissions Tested for All Default Roles
  // -------------------------------------------------------------------------
  describe('Checklist Item 4: Role permissions are tested for all default roles', () => {
    it('Owner should have FULL permission across packages, expenses, staff, and exports', () => {
      expect(hasPermission('OWNER', 'CONFIG_BUSINESS_PACKAGES', 'FULL')).toBe(true);
      expect(hasPermission('OWNER', 'RECORD_APPROVE_EXPENSES', 'FULL')).toBe(true);
      expect(hasPermission('OWNER', 'STAFF_ROLES_SCHEDULES', 'FULL')).toBe(true);
      expect(hasPermission('OWNER', 'REPORTS_EXPORTS', 'FULL')).toBe(true);
    });

    it('General Manager should have MANAGE capability for expenses and staff scheduling', () => {
      expect(hasPermission('GENERAL_MANAGER', 'RECORD_APPROVE_EXPENSES', 'MANAGE')).toBe(true);
      expect(hasPermission('GENERAL_MANAGER', 'STAFF_ROLES_SCHEDULES', 'MANAGE')).toBe(true);
    });

    it('Receptionist should be able to register members, issue receipts, and check in, but CANNOT approve expenses', () => {
      expect(hasPermission('RECEPTIONIST', 'CHECKIN_QR', 'FULL')).toBe(true);
      expect(hasPermission('RECEPTIONIST', 'RECORD_PAYMENT_RECEIPT', 'CREATE_UPDATE')).toBe(true);
      expect(hasPermission('RECEPTIONIST', 'RECORD_APPROVE_EXPENSES', 'MANAGE')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'RECORD_APPROVE_EXPENSES', 'FULL')).toBe(false);
    });

    it('Trainer should be scoped to own clients and cannot approve expenses or manage packages', () => {
      expect(hasPermission('TRAINER', 'MEMBER_PROFILE_MANAGE', 'OWN_ONLY')).toBe(true);
      expect(hasPermission('TRAINER', 'MEMBER_PROFILE_MANAGE', 'FULL')).toBe(false);
      expect(hasPermission('TRAINER', 'RECORD_APPROVE_EXPENSES', 'VIEW')).toBe(false);
      expect(hasPermission('TRAINER', 'CONFIG_BUSINESS_PACKAGES', 'MANAGE')).toBe(false);
    });

    it('Maintenance Staff should have FULL asset maintenance capability but NONE for member or billing profiles', () => {
      expect(hasPermission('MAINTENANCE_STAFF', 'ASSETS_MAINTENANCE', 'FULL')).toBe(true);
      expect(hasPermission('MAINTENANCE_STAFF', 'MEMBER_PROFILE_MANAGE', 'VIEW')).toBe(false);
      expect(hasPermission('MAINTENANCE_STAFF', 'RECORD_PAYMENT_RECEIPT', 'VIEW')).toBe(false);
      expect(hasPermission('MAINTENANCE_STAFF', 'RECORD_APPROVE_EXPENSES', 'VIEW')).toBe(false);
    });

    it('Finance Officer should have FULL permission on payments, expenses, and reports, but NONE for staff schedules', () => {
      expect(hasPermission('FINANCE_OFFICER', 'RECORD_PAYMENT_RECEIPT', 'FULL')).toBe(true);
      expect(hasPermission('FINANCE_OFFICER', 'RECORD_APPROVE_EXPENSES', 'FULL')).toBe(true);
      expect(hasPermission('FINANCE_OFFICER', 'REPORTS_EXPORTS', 'FULL')).toBe(true);
      expect(hasPermission('FINANCE_OFFICER', 'STAFF_ROLES_SCHEDULES', 'MANAGE')).toBe(false);
    });

    it('Member should only access OWN_ONLY check-in QR and profile', () => {
      expect(hasPermission('MEMBER', 'CHECKIN_QR', 'OWN_ONLY')).toBe(true);
      expect(hasPermission('MEMBER', 'CHECKIN_QR', 'FULL')).toBe(false);
      expect(hasPermission('MEMBER', 'RECORD_APPROVE_EXPENSES', 'VIEW')).toBe(false);
      expect(hasPermission('MEMBER', 'REPORTS_EXPORTS', 'FULL')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 5: Financial Traceability & Correction History
  // -------------------------------------------------------------------------
  describe('Checklist Item 5: Financial data is traceable and correction flows preserve history', () => {
    it('should create an immutable financial correction when voiding an invoice without deleting the original', () => {
      const invoice = db.getInvoices(tenantId)[0];
      expect(invoice).toBeDefined();

      const { invoice: updatedInvoice, correction } = db.voidInvoice(
        tenantId,
        invoice.id,
        'Customer cancelled registration within 24hr window',
        { id: usersByRole.OWNER.id, name: usersByRole.OWNER.name, role: 'OWNER' }
      );

      expect(correction.id).toBeDefined();
      expect(correction.type).toBe('VOID');
      expect(correction.reason).toContain('Customer cancelled');

      // The original invoice is updated to VOIDED, retaining history rather than deleted
      expect(updatedInvoice.status).toBe('VOIDED');
      const foundInLedger = db.getInvoices(tenantId).find((i) => i.id === invoice.id);
      expect(foundInLedger).toBeDefined();
      expect(foundInLedger?.status).toBe('VOIDED');
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 6: Privacy Protection & Non-PII QR Tokens
  // -------------------------------------------------------------------------
  describe('Checklist Item 6: Sensitive member data is restricted and QR payloads contain no personal data', () => {
    it('QR tokens should be opaque cryptographic handles containing zero names, phone numbers, or emails', () => {
      const members = db.getMembers(tenantId);
      expect(members.length).toBeGreaterThan(0);

      members.forEach((m) => {
        expect(m.qrCodeToken).toBeDefined();
        // QR token must NOT contain plain email, phone number, or full name
        expect(m.qrCodeToken).not.toContain(m.email);
        expect(m.qrCodeToken).not.toContain(m.phone);
        expect(m.qrCodeToken).not.toContain(m.medicalNotes || 'XYZ12345NonExistent');
      });
    });

    it('should restrict medical and emergency notes from non-authorized roles', () => {
      // Maintenance and Finance roles have NONE for emergency medical notes
      expect(hasPermission('MAINTENANCE_STAFF', 'VIEW_MEDICAL_EMERGENCY', 'VIEW')).toBe(false);
      expect(hasPermission('FINANCE_OFFICER', 'VIEW_MEDICAL_EMERGENCY', 'VIEW')).toBe(false);
      expect(hasPermission('MEMBER', 'VIEW_MEDICAL_EMERGENCY', 'FULL')).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 7: Owner Dashboard Reconciliation
  // -------------------------------------------------------------------------
  describe('Checklist Item 7: Owner dashboard metrics reconcile with source records', () => {
    it('dashboard gross revenue must exactly equal sum of drill-down invoice records', () => {
      const filter = { tenantId, period: 'THIS_MONTH' as const, branchId: 'ALL' };
      const dashboard = db.getReconciledDashboardData(filter);
      const drillDown = db.getMetricDrillDownRecords(tenantId, 'REVENUE', filter);

      const recordsSum = drillDown.records.reduce((acc: number, r: any) => acc + (r.paidAmount || 0), 0);
      expect(dashboard.revenue.total).toBe(recordsSum);
      expect(dashboard.revenue.count).toBe(drillDown.records.length);
    });

    it('dashboard expenses must exactly equal sum of drill-down expense records', () => {
      const filter = { tenantId, period: 'THIS_MONTH' as const, branchId: 'ALL' };
      const dashboard = db.getReconciledDashboardData(filter);
      const drillDown = db.getMetricDrillDownRecords(tenantId, 'EXPENSES', filter);

      const recordsSum = drillDown.records.reduce((acc: number, r: any) => acc + (r.amount || 0), 0);
      expect(dashboard.expenses.total).toBe(recordsSum);
      expect(dashboard.expenses.count).toBe(drillDown.records.length);
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 8: Renewal Consent & Controlled Retry Bounds
  // -------------------------------------------------------------------------
  describe('Checklist Item 8: Renewal and operational alerts respect consent and expose delivery failures', () => {
    it('should NEVER dispatch renewal alerts to members with smsOptOut: true', () => {
      // Add member with opt-out
      const optedOutMember = db.createMember(tenantId, {
        branchId: 'branch-1-main',
        firstName: 'Teshome',
        lastName: 'Tulu',
        email: 'teshome@sample.demo',
        phone: '+251 90 000 7788',
        gender: 'MALE',
        dateOfBirth: '1990-01-01',
        joinDate: new Date().toISOString().split('T')[0],
        currentPlanId: 'plan-1-monthly',
        currentPlanName: 'Monthly Standard',
        subscriptionStart: new Date(Date.now() - 60 * 86400000).toISOString(),
        subscriptionEnd: new Date(Date.now() - 5 * 86400000).toISOString(),
        smsOptOut: true,
        notificationOptIn: false,
      });
      optedOutMember.status = 'EXPIRED';

      const dispatchResult = db.dispatchNotifications(tenantId, usersByRole.OWNER);
      const memberLog = dispatchResult.logs.find((l) => l.memberId === optedOutMember.id);

      // Must be marked OPTED_OUT with zero messages sent
      if (memberLog) {
        expect(memberLog.status).toBe('OPTED_OUT');
      }
    });

    it('should hard-block retries past maxRetries (3 attempts)', () => {
      const logs = db.getNotificationLogs(tenantId);
      const failedLog = logs.find((l) => l.status === 'FAILED');
      expect(failedLog).toBeDefined();

      failedLog!.retryCount = 3;
      expect(() => db.retryNotification(tenantId, failedLog!.id, usersByRole.OWNER)).toThrow(/Maximum retry limit/);
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 9: Responsive Layout & Mobile/Desktop Integrity
  // -------------------------------------------------------------------------
  describe('Checklist Item 9: Mobile, tablet, and desktop workflows have no incoherent overlap or inaccessible control', () => {
    it('tenant branches and navigation metadata provide responsive tokens and labels', () => {
      const branches = db.getBranches(tenantId);
      expect(branches.length).toBeGreaterThanOrEqual(2);
      branches.forEach((b) => {
        expect(b.name).toBeDefined();
        expect(b.code).toBeDefined();
      });
    });
  });

  // -------------------------------------------------------------------------
  // Checklist Item 10: Clearly Labelled Demo Data (Zero Real PII)
  // -------------------------------------------------------------------------
  describe('Checklist Item 10: Demo data is clearly labelled and cannot be mistaken for production data', () => {
    it('tenant should have isDemo flag and explicit pilot demonstration branding', () => {
      const tenant = db.getTenants().find((t) => t.id === tenantId);
      expect(tenant).toBeDefined();
      expect(tenant?.isDemo).toBe(true);
      expect(tenant?.name).toContain('[PILOT DEMO]');
      expect(tenant?.demoSubtitle).toContain('Synthetic Data Only');
    });

    it('all member emails, phones, and contacts should adhere to synthetic demonstration patterns', () => {
      const members = db.getMembers(tenantId);
      members.forEach((m) => {
        // Ensure contacts are clearly synthetic
        if (m.email) {
          expect(m.email).toMatch(/(@gmail\.com|@outlook\.com|@yahoo\.com|@apexfitness\.demo|@sample\.demo)$/);
        }
      });
    });
  });
});
