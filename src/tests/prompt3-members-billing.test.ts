import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/storage';
import { Member, TenantPaymentPolicy } from '../lib/types';
import { NextRequest } from 'next/server';
import { GET as getMembers, POST as postMembers } from '../app/api/members/route';
import { GET as exportMembers } from '../app/api/members/export/route';
import { GET as getBilling, POST as postBilling } from '../app/api/billing/route';

describe('Prompt 3: Members, Memberships, Payments, and Receipts', () => {
  const tenantId = 'tenant-1';

  beforeEach(() => {
    db.resetDemoData();
  });

  describe('1. Duplicate Phone & Email Prevention + Authorized Resolution', () => {
    it('detects duplicate phone within the same tenant', () => {
      // Seed a member
      const memberA = db.createMember(tenantId, {
        firstName: 'Abebe',
        lastName: 'Bikila',
        phone: '+251911223344',
        email: 'abebe@example.com',
        joinDate: '2026-03-01',
        dueBalance: 0,
        consentGiven: true,
      });
      expect(memberA.id).toBeDefined();

      // Check duplicate by phone
      const dupByPhone = db.checkDuplicateMember(tenantId, { phone: '+251911223344' });
      expect(dupByPhone.isDuplicate).toBe(true);
      expect(dupByPhone.conflictingField).toBe('phone');
      expect(dupByPhone.existingMember?.firstName).toBe('Abebe');

      // Check duplicate by email
      const dupByEmail = db.checkDuplicateMember(tenantId, { email: 'abebe@example.com' });
      expect(dupByEmail.isDuplicate).toBe(true);
      expect(dupByEmail.conflictingField).toBe('email');

      // Check same phone on different tenant is allowed (tenant isolation)
      const otherTenantDup = db.checkDuplicateMember('tenant-2', { phone: '+251911223344' });
      expect(otherTenantDup.isDuplicate).toBe(false);
    });

    it('rejects duplicate member creation via API with 409 Conflict when not overridden', async () => {
      db.createMember(tenantId, {
        firstName: 'Derartu',
        lastName: 'Tulu',
        phone: '+251922334455',
        email: 'derartu@example.com',
        joinDate: '2026-03-01',
        dueBalance: 0,
        consentGiven: true,
      });

      const req = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
        },
        body: JSON.stringify({
          tenantId,
          firstName: 'Derartu',
          lastName: 'Duplicate',
          phone: '+251922334455',
          email: 'derartu-new@example.com',
          consentGiven: true,
          planId: 'plan-1-monthly',
        }),
      });

      const res = await postMembers(req);
      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.error).toBe('DUPLICATE_PROFILE');
      expect(data.conflictingField).toBe('phone');
    });

    it('allows authorized override of duplicate warning when allowDuplicateOverride is set', async () => {
      db.createMember(tenantId, {
        firstName: 'Haile',
        lastName: 'Gebrselassie',
        phone: '+251933445566',
        email: 'haile@example.com',
        joinDate: '2026-03-01',
        dueBalance: 0,
        consentGiven: true,
      });

      const req = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'MANAGER',
          'x-user-id': 'user-mgr-1',
        },
        body: JSON.stringify({
          tenantId,
          firstName: 'Haile',
          lastName: 'Junior',
          phone: '+251933445566',
          email: 'haile.jr@example.com',
          consentGiven: true,
          allowDuplicateOverride: true,
          planId: 'plan-1-monthly',
        }),
      });

      const res = await postMembers(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.member).toBeDefined();
      expect(data.member.firstName).toBe('Haile');
      expect(data.member.lastName).toBe('Junior');
    });
  });

  describe('2. Required Consent Capture Before Activation', () => {
    it('rejects member creation via API if consent is not granted', async () => {
      const req = new NextRequest('http://localhost:3000/api/members', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
        },
        body: JSON.stringify({
          tenantId,
          firstName: 'Sileshi',
          lastName: 'Sihine',
          phone: '+251944556677',
          consentGiven: false,
          planId: 'plan-1-monthly',
        }),
      });

      const res = await postMembers(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('CONSENT_REQUIRED');
    });

    it('captures consent policy version, date, and marks consentGiven upon registration', () => {
      const result = db.createMember(
        tenantId,
        {
          firstName: 'Tirunesh',
          lastName: 'Dibaba',
          phone: '+251955667788',
          joinDate: '2026-03-01',
          dueBalance: 0,
          consentGiven: true,
          consentPolicyVersion: 'v2026.1',
          planId: 'plan-1-monthly',
        }
      );

      expect(result.consentGiven).toBe(true);
      expect(result.consentPolicyVersion).toBe('v2026.1');
      expect(result.consentDate).toBeDefined();
      expect(result.status).toBe('ACTIVE');
    });
  });

  describe('3. Full Payment Workflow: Invoice, Payment Record, Receipt & Status', () => {
    it('creates an invoice, receipt, and activates member on full payment', () => {
      const plans = db.getPlans(tenantId);
      const plan = plans[0]; // e.g., Monthly Plan ($45 + $10 admission = $55)
      const expectedTotal = plan.price + (plan.admissionFee || 0);

      const member = db.createMember(
        tenantId,
        {
          firstName: 'Kenenisa',
          lastName: 'Bekele',
          phone: '+251966778899',
          joinDate: '2026-03-01',
          dueBalance: 0,
          consentGiven: true,
          planId: plan.id,
        },
        {
          paidAmount: expectedTotal,
          paymentMethod: 'CARD',
          actor: { id: 'user-staff-1', name: 'Almaz Ayana', role: 'RECEPTIONIST' },
        }
      );

      // Status should be ACTIVE with 0 balance
      expect(member.status).toBe('ACTIVE');
      expect(member.dueBalance).toBe(0);

      // Verify invoice was created
      const invoices = db.getInvoices(tenantId).filter((inv) => inv.memberId === member.id);
      expect(invoices.length).toBe(1);
      const invoice = invoices[0];
      expect(invoice.amount).toBe(expectedTotal);
      expect(invoice.paidAmount).toBe(expectedTotal);
      expect(invoice.balance).toBe(0);
      expect(invoice.status).toBe('PAID');
      expect(invoice.paymentMethod).toBe('CARD');
      expect(invoice.receiptNumber).toMatch(/^RCP-\d{4}-\d{4}$/);

      // Verify receipt was created
      expect(invoice.receiptId).toBeDefined();
      const receipt = db.getReceiptById(invoice.receiptId!);
      expect(receipt).toBeDefined();
      expect(receipt?.receiptNumber).toBe(invoice.receiptNumber);
      expect(receipt?.amount).toBe(expectedTotal);
      expect(receipt?.receivedBy).toBe('Almaz Ayana');
      expect(receipt?.items?.length).toBeGreaterThanOrEqual(1);

      // Check audit events
      const audits = db.getAuditLogs(tenantId);
      const receiptAudit = audits.find((a) => a.action === 'RECEIPT_ISSUED' && a.entityId === receipt?.id);
      expect(receiptAudit).toBeDefined();
    });
  });

  describe('4. Partial Payment & Activation Policy Evaluation', () => {
    it('suspends membership if partial payment violates strict activation policy', () => {
      // Set strict policy: no partial activation allowed
      db.setPaymentPolicy(tenantId, {
        allowPartialActivation: false,
        minInitialPaymentPercent: 100,
        maxAllowedBalance: 0,
      });

      const plan = db.getPlans(tenantId).find((p) => p.id === 'plan-1-monthly') || db.getPlans(tenantId)[1];
      const totalCost = plan.price + (plan.admissionFee || 0);

      const member = db.createMember(
        tenantId,
        {
          firstName: 'Meseret',
          lastName: 'Defar',
          phone: '+251977889900',
          joinDate: '2026-03-01',
          consentGiven: true,
          planId: plan.id,
        },
        {
          paidAmount: 20,
          paymentMethod: 'CASH',
        }
      );

      expect(member.status).toBe('SUSPENDED');
      expect(member.dueBalance).toBe(totalCost - 20);

      const invoices = db.getInvoices(tenantId).filter((inv) => inv.memberId === member.id);
      expect(invoices[0].status).toBe('PARTIAL');
      expect(invoices[0].balance).toBe(totalCost - 20);
    });

    it('activates membership if partial payment meets allowed policy threshold', () => {
      // Allow partial activation if at least 50% paid and balance <= $50
      db.setPaymentPolicy(tenantId, {
        allowPartialActivation: true,
        minInitialPaymentPercent: 50,
        maxAllowedBalance: 50,
      });

      const member = db.createMember(
        tenantId,
        {
          firstName: 'Gudaf',
          lastName: 'Tsegay',
          phone: '+251988990011',
          joinDate: '2026-03-01',
          consentGiven: true,
          planId: 'plan-1-monthly', // $45 + $15 = $60
        },
        {
          paidAmount: 40, // 40 / 60 = 66% (> 50%) and balance $20 <= $50
          paymentMethod: 'MOBILE_MONEY',
        }
      );

      expect(member.status).toBe('ACTIVE');
      expect(member.dueBalance).toBe(20);
    });

    it('reactivates suspended member when outstanding balance is paid in full', () => {
      db.setPaymentPolicy(tenantId, {
        allowPartialActivation: false,
        minInitialPaymentPercent: 100,
        maxAllowedBalance: 0,
      });

      const member = db.createMember(
        tenantId,
        {
          firstName: 'Selemon',
          lastName: 'Barega',
          phone: '+251999001122',
          joinDate: '2026-03-01',
          consentGiven: true,
          planId: 'plan-1-monthly', // $45 + $15 = $60
        },
        {
          paidAmount: 30, // leaves $30 balance
          paymentMethod: 'CASH',
        }
      );
      expect(member.status).toBe('SUSPENDED');
      expect(member.dueBalance).toBe(30);

      const invoices = db.getInvoices(tenantId).filter((i) => i.memberId === member.id);
      const partialInvoice = invoices[0];

      // Now pay the remaining balance of $30
      const paymentResult = db.recordPayment(tenantId, {
        invoiceId: partialInvoice.id,
        amount: 30,
        paymentMethod: 'CASH',
        actor: { id: 'staff-1', name: 'Cashier Staff', role: 'RECEPTIONIST' },
      });

      expect(paymentResult.invoice.status).toBe('PAID');
      expect(paymentResult.invoice.balance).toBe(0);
      expect(paymentResult.receipt.receiptNumber).toMatch(/^RCP-\d{4}-\d{4}$/);

      // Verify member status is now ACTIVE and balance is 0
      const updatedMember = db.getMemberById(member.id);
      expect(updatedMember?.status).toBe('ACTIVE');
      expect(updatedMember?.dueBalance).toBe(0);
    });
  });

  describe('5. Receipt Identifier Uniqueness & Retrievability', () => {
    it('generates unique receipt numbers and persists them for retrieval', () => {
      const receipts = db.getReceipts(tenantId);
      const receiptNumbers = new Set(receipts.map((r) => r.receiptNumber));
      expect(receiptNumbers.size).toBe(receipts.length);

      // Add a payment and check retrieval
      const invoices = db.getInvoices(tenantId);
      const invoice = invoices[0];
      const result = db.recordPayment(tenantId, {
        invoiceId: invoice.id,
        amount: 15,
        paymentMethod: 'CASH',
        actor: { id: 'u1', name: 'Staff', role: 'RECEPTIONIST' },
      });

      const fetchedByNumber = db.getReceiptByNumber(tenantId, result.receipt.receiptNumber);
      expect(fetchedByNumber).toBeDefined();
      expect(fetchedByNumber?.id).toBe(result.receipt.id);
      expect(fetchedByNumber?.amount).toBe(15);
    });

    it('retrieves receipt via API query by receiptNumber', async () => {
      const receipts = db.getReceipts(tenantId);
      const targetReceipt = receipts[0];

      const req = new NextRequest(`http://localhost:3000/api/billing?tenantId=${tenantId}&receiptNumber=${targetReceipt.receiptNumber}`, {
        headers: {
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
        },
      });

      const res = await getBilling(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.receipt).toBeDefined();
      expect(data.receipt.receiptNumber).toBe(targetReceipt.receiptNumber);
      expect(data.receipt.invoiceNumber).toBe(targetReceipt.invoiceNumber);
    });
  });

  describe('6. Financial Immutability, Voiding, Refunding, and Adjustments', () => {
    it('prohibits silent deletion of posted invoices', () => {
      const invoices = db.getInvoices(tenantId);
      const targetInvoice = invoices[0];

      expect(() => {
        db.deleteInvoice(targetInvoice.id);
      }).toThrow(/cannot be deleted/);
    });

    it('voids an invoice, creates a linked financial correction record, and logs audit', () => {
      const invoices = db.getInvoices(tenantId);
      const target = invoices[0];

      const correction = db.voidInvoice(tenantId, {
        invoiceId: target.id,
        reason: 'Issued with incorrect plan type by mistake',
        actor: { id: 'user-mgr-1', name: 'Manager Sarah', role: 'MANAGER' },
      });

      expect(correction.type).toBe('VOID');
      expect(correction.originalInvoiceId).toBe(target.id);
      expect(correction.originalInvoiceNumber).toBe(target.invoiceNumber);
      expect(correction.referenceNumber).toMatch(/^CORR-\d{4}-\d{4}$/);

      // Verify invoice is marked VOIDED
      const updated = db.getInvoices(tenantId).find((i) => i.id === target.id);
      expect(updated?.status).toBe('VOIDED');
      expect(updated?.voidReason).toBe('Issued with incorrect plan type by mistake');

      // Verify audit trail
      const audit = db.getAuditLogs(tenantId).find((a) => a.action === 'TRANSACTION_VOID' && a.entityId === target.id);
      expect(audit).toBeDefined();
    });

    it('processes refunds, links correction, updates invoice refundedAmount, and records audit', () => {
      const invoices = db.getInvoices(tenantId).filter((i) => i.paidAmount > 0);
      const target = invoices[0];
      const initialPaid = target.paidAmount;

      const correction = db.refundInvoice(tenantId, {
        invoiceId: target.id,
        amount: initialPaid,
        reason: 'Member relocated before start date',
        actor: { id: 'user-owner-1', name: 'Owner Boss', role: 'OWNER' },
      });

      expect(correction.type).toBe('REFUND');
      expect(correction.amount).toBe(initialPaid);

      const updated = db.getInvoices(tenantId).find((i) => i.id === target.id);
      expect(updated?.status).toBe('REFUNDED');
      expect(updated?.refundedAmount).toBe(initialPaid);

      const audit = db.getAuditLogs(tenantId).find((a) => a.action === 'TRANSACTION_REFUND' && a.entityId === target.id);
      expect(audit).toBeDefined();
    });

    it('adjusts member balance with linked correction record', () => {
      const members = db.getMembers(tenantId);
      const member = members[0];
      const originalBalance = member.dueBalance;

      const correction = db.adjustBalance(tenantId, {
        memberId: member.id,
        amount: 25,
        reason: 'Promotional loyalty credit applied',
        actor: { id: 'user-mgr-1', name: 'Manager Sarah', role: 'MANAGER' },
      });

      expect(correction.type).toBe('ADJUSTMENT');
      expect(correction.amount).toBe(25);

      const updated = db.getMemberById(member.id);
      expect(updated?.dueBalance).toBe(Math.max(0, originalBalance - 25));
    });
  });

  describe('7. Role-Based Sensitive Data Protection & Export Boundaries', () => {
    it('masks medicalNotes and photoIdReference as [RESTRICTED] for RECEPTIONIST, FINANCE_OFFICER, and MAINTENANCE_STAFF', () => {
      const sensitiveMember: Member = {
        id: 'mem-sensitive-1',
        tenantId,
        memberNumber: 'GYM-9999',
        firstName: 'Private',
        lastName: 'Patient',
        phone: '+251900000000',
        joinDate: '2026-03-01',
        status: 'ACTIVE',
        dueBalance: 0,
        consentGiven: true,
        qrCodeToken: 'token-priv-1',
        medicalNotes: 'Severe asthma, requires inhaler access at all times',
        photoIdReference: 'PASSPORT-ET-987654321',
      };

      // Receptionist: masked
      const forReception = db.maskMemberMedicalData(sensitiveMember, 'RECEPTIONIST');
      expect(forReception.medicalNotes).toBe('[RESTRICTED]');
      expect(forReception.photoIdReference).toBe('[RESTRICTED]');

      // Finance officer: masked
      const forFinance = db.maskMemberMedicalData(sensitiveMember, 'FINANCE_OFFICER');
      expect(forFinance.medicalNotes).toBe('[RESTRICTED]');

      // Maintenance: masked
      const forMaint = db.maskMemberMedicalData(sensitiveMember, 'MAINTENANCE_STAFF');
      expect(forMaint.medicalNotes).toBe('[RESTRICTED]');

      // Trainer: allowed (trainers need medical cautions for workout safety)
      const forTrainer = db.maskMemberMedicalData(sensitiveMember, 'TRAINER');
      expect(forTrainer.medicalNotes).toBe('Severe asthma, requires inhaler access at all times');

      // Manager: allowed
      const forManager = db.maskMemberMedicalData(sensitiveMember, 'MANAGER');
      expect(forManager.medicalNotes).toBe('Severe asthma, requires inhaler access at all times');

      // Owner: allowed
      const forOwner = db.maskMemberMedicalData(sensitiveMember, 'OWNER');
      expect(forOwner.medicalNotes).toBe('Severe asthma, requires inhaler access at all times');
    });

    it('GET /api/members masks medical data for RECEPTIONIST requests', async () => {
      // Seed a member with confidential medical data
      db.createMember(tenantId, {
        firstName: 'Confidential',
        lastName: 'Client',
        phone: '+251911998877',
        joinDate: '2026-03-01',
        dueBalance: 0,
        consentGiven: true,
        medicalNotes: 'Heart arrhythmia condition',
        photoIdReference: 'NATIONAL-ID-112233',
      });

      const req = new NextRequest(`http://localhost:3000/api/members?tenantId=${tenantId}&query=Confidential`, {
        headers: {
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
        },
      });

      const res = await getMembers(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      const member = data.members.find((m: Member) => m.firstName === 'Confidential');
      expect(member).toBeDefined();
      expect(member.medicalNotes).toBe('[RESTRICTED]');
      expect(member.photoIdReference).toBe('[RESTRICTED]');
    });

    it('GET /api/members/export denies RECEPTIONIST and TRAINER with 403 Forbidden', async () => {
      // Receptionist test
      const reqReception = new NextRequest(`http://localhost:3000/api/members/export?tenantId=${tenantId}`, {
        headers: {
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
        },
      });
      const resReception = await exportMembers(reqReception);
      expect(resReception.status).toBe(403);
      const dataReception = await resReception.json();
      expect(dataReception.error).toBe('FORBIDDEN');

      // Trainer test
      const reqTrainer = new NextRequest(`http://localhost:3000/api/members/export?tenantId=${tenantId}`, {
        headers: {
          'x-user-role': 'TRAINER',
          'x-user-id': 'user-coach-1',
        },
      });
      const resTrainer = await exportMembers(reqTrainer);
      expect(resTrainer.status).toBe(403);
    });

    it('GET /api/members/export permits MANAGER and generates CSV with audit logging', async () => {
      const reqManager = new NextRequest(`http://localhost:3000/api/members/export?tenantId=${tenantId}`, {
        headers: {
          'x-user-role': 'MANAGER',
          'x-user-id': 'user-mgr-1',
        },
      });
      const resManager = await exportMembers(reqManager);
      expect(resManager.status).toBe(200);
      expect(resManager.headers.get('content-type')).toContain('text/csv');

      const csvContent = await resManager.text();
      expect(csvContent).toContain('MemberNumber,FirstName,LastName,Phone,Email,Status,Plan,DaysRemaining,DueBalance');

      // Check audit event
      const audits = db.getAuditLogs(tenantId);
      const exportAudit = audits.find((a) => a.action === 'EXPORT_EXECUTED');
      expect(exportAudit).toBeDefined();
      expect(exportAudit?.actorRole).toBe('MANAGER');
    });
  });

  describe('8. Edge Cases & Robustness', () => {
    it('rejects recording zero or negative payment on an invoice', () => {
      const invoices = db.getInvoices(tenantId);
      const invoice = invoices[0];

      expect(() => {
        db.recordPayment(tenantId, {
          invoiceId: invoice.id,
          amount: 0,
          paymentMethod: 'CASH',
        });
      }).toThrow(/Payment amount must be greater than 0/);

      expect(() => {
        db.recordPayment(tenantId, {
          invoiceId: invoice.id,
          amount: -50,
          paymentMethod: 'CASH',
        });
      }).toThrow(/Payment amount must be greater than 0/);
    });

    it('rejects refunding more than the total paid amount on an invoice', () => {
      const invoices = db.getInvoices(tenantId).filter((i) => i.paidAmount > 0);
      const invoice = invoices[0];

      expect(() => {
        db.refundInvoice(tenantId, {
          invoiceId: invoice.id,
          amount: invoice.paidAmount + 500,
          reason: 'Excessive refund test',
        });
      }).toThrow(/Refund amount cannot exceed/);
    });

    it('rejects voiding an already voided invoice', () => {
      const invoices = db.getInvoices(tenantId);
      const invoice = invoices[0];

      db.voidInvoice(tenantId, {
        invoiceId: invoice.id,
        reason: 'First void',
      });

      expect(() => {
        db.voidInvoice(tenantId, {
          invoiceId: invoice.id,
          reason: 'Second void attempt',
        });
      }).toThrow(/Invoice is already voided/);
    });

    it('issues a new receipt when renewing a member subscription', () => {
      const members = db.getMembers(tenantId);
      const member = members[0];
      const initialReceiptsCount = db.getReceipts(tenantId).length;

      const renewal = db.renewMemberSubscription(tenantId, {
        memberId: member.id,
        planId: 'plan-1-monthly',
        paymentMethod: 'MOBILE_MONEY',
        paymentReference: 'TXN-998877',
      });

      expect(renewal).toBeDefined();
      expect(renewal!.member.status).toBe('ACTIVE');
      expect(renewal!.receipt).toBeDefined();
      expect(renewal!.receipt.receiptNumber).toMatch(/^RCP-\d{4}-\d{4}$/);
      expect(renewal!.receipt.paymentMethod).toBe('MOBILE_MONEY');
      expect(db.getReceipts(tenantId).length).toBe(initialReceiptsCount + 1);
    });
  });
});
