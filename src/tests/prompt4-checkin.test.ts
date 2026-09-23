import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/storage';
import { NextRequest } from 'next/server';
import { GET as getCheckIns, POST as postCheckIn } from '../app/api/checkin/route';
import { POST as postQR } from '../app/api/members/qr/route';
import { GET as getMembers } from '../app/api/members/route';

describe('Prompt 4: QR Digital ID and Reception Check-In', () => {
  const tenantId = 'tenant-1';
  const otherTenantId = 'tenant-2';

  beforeEach(() => {
    db.resetDemoData();
  });

  describe('1. Active eligible member is approved and a check-in record is created', () => {
    it('approves active member check-in and records check-in log with occupancy', () => {
      // Yonas is an active member with 60 days left
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1001');
      expect(member).toBeDefined();
      expect(member?.status).toBe('ACTIVE');

      const initialOccupancy = db.getLiveOccupancy(tenantId).current;

      const result = db.processCheckIn(tenantId, member!.qrCodeToken, 'QR_SCAN', {
        actor: { id: 'user-staff-1', name: 'Receptionist Selam', role: 'RECEPTIONIST' },
        branchId: 'branch-central',
        branchName: 'Apex Central',
        deviceInfo: 'Kiosk Terminal 01',
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('GRANTED');
      expect(result.member?.id).toBe(member?.id);
      expect(result.message).toContain('Access granted');

      // Check log creation
      expect(result.log).toBeDefined();
      expect(result.log.memberId).toBe(member?.id);
      expect(result.log.status).toBe('GRANTED');
      expect(result.log.scannerActorName).toBe('Receptionist Selam');
      expect(result.log.branchName).toBe('Apex Central');
      expect(result.log.deviceInfo).toBe('Kiosk Terminal 01');

      // Check that it's persisted in the check-in list
      const logs = db.getCheckIns(tenantId);
      expect(logs.some((l) => l.id === result.log.id)).toBe(true);
    });

    it('approves member via POST /api/checkin with server-side validation and records occupancy', async () => {
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1001');

      const req = new NextRequest('http://localhost:3000/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
          'x-user-name': 'Selam Receptionist',
        },
        body: JSON.stringify({
          tenantId,
          identifier: member!.qrCodeToken,
          method: 'QR_SCAN',
          branchId: 'branch-apex-main',
          branchName: 'Apex Fitness Main HQ',
        }),
      });

      const res = await postCheckIn(req);
      expect(res.status).toBe(200);
      const data = await res.json();

      expect(data.success).toBe(true);
      expect(data.status).toBe('GRANTED');
      expect(data.log.scannerActorName).toContain('Selam');
      expect(data.log.branchName).toBe('Apex Fitness Main HQ');
      expect(data.occupancy).toBeDefined();
    });
  });

  describe('2. Multi-policy denial: Expired, suspended, frozen, debt, branch-restricted, and revoked', () => {
    it('declines expired member and logs failureReason', () => {
      // Elias has an expired membership
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1003');
      expect(member).toBeDefined();
      expect(member?.status).toBe('EXPIRED');

      const result = db.processCheckIn(tenantId, member!.qrCodeToken, 'QR_SCAN');
      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_EXPIRED');
      expect(result.log.failureReason).toContain('Membership expired');
      expect(result.message).toContain('Access Denied: Membership Expired');

      // Verify log was saved even though access was denied
      const logs = db.getCheckIns(tenantId);
      expect(logs.some((l) => l.id === result.log.id && l.status === 'DENIED_EXPIRED')).toBe(true);
    });

    it('declines member with outstanding debt and logs reason', () => {
      // Create an active member with an unpaid balance
      const memberWithDebt = db.createMember(tenantId, {
        firstName: 'Dawit',
        lastName: 'Debt',
        phone: '+251911998877',
        dueBalance: 45.0,
        consentGiven: true,
        joinDate: new Date().toISOString(),
        planId: 'plan-1-monthly',
      });
      // Set end date to future and status to ACTIVE so debt check is evaluated
      memberWithDebt.subscriptionEnd = new Date(Date.now() + 20 * 86400000).toISOString();
      memberWithDebt.daysRemaining = 20;
      memberWithDebt.status = 'ACTIVE';

      const result = db.processCheckIn(tenantId, memberWithDebt.qrCodeToken, 'QR_SCAN');
      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_DEBT');
      expect(result.log.failureReason).toContain('Unpaid balance outstanding: $45.00');
    });

    it('declines suspended member and logs reason', () => {
      const suspended = db.getMembers(tenantId).find((m) => m.status === 'SUSPENDED');
      expect(suspended).toBeDefined();

      const result = db.processCheckIn(tenantId, suspended!.qrCodeToken, 'QR_SCAN');
      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_SUSPENDED');
      expect(result.log.failureReason).toContain('suspended by management policy');
    });

    it('declines frozen member and logs reason', () => {
      const frozen = db.getMembers(tenantId).find((m) => m.status === 'FROZEN');
      expect(frozen).toBeDefined();

      const result = db.processCheckIn(tenantId, frozen!.qrCodeToken, 'QR_SCAN');
      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_FROZEN');
      expect(result.log.failureReason).toContain('frozen');
    });

    it('declines branch-restricted member when scanning at an unpermitted branch', () => {
      // Create member restricted to 'branch-north' only
      const branchMember = db.createMember(tenantId, {
        firstName: 'Branch',
        lastName: 'Only',
        phone: '+251922338899',
        dueBalance: 0,
        consentGiven: true,
        joinDate: new Date().toISOString(),
        planId: 'plan-1-monthly',
      });
      branchMember.allowedBranchIds = ['branch-north'];
      branchMember.subscriptionEnd = new Date(Date.now() + 30 * 86400000).toISOString();
      branchMember.daysRemaining = 30;

      // Scan at 'branch-south'
      const result = db.processCheckIn(tenantId, branchMember.qrCodeToken, 'QR_SCAN', {
        branchId: 'branch-south',
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_BRANCH');
      expect(result.log.failureReason).toContain('Branch access not permitted');

      // Scan at allowed 'branch-north'
      const allowedResult = db.processCheckIn(tenantId, branchMember.qrCodeToken, 'QR_SCAN', {
        branchId: 'branch-north',
      });
      expect(allowedResult.success).toBe(true);
      expect(allowedResult.status).toBe('GRANTED');
    });

    it('declines completely unrecognized token with DENIED_NOT_FOUND', () => {
      const result = db.processCheckIn(tenantId, 'QR-UNKNOWN-FAKE-TOKEN-999', 'QR_SCAN');
      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_NOT_FOUND');
      expect(result.log.failureReason).toContain('No member found');
    });
  });

  describe('3. QR payload is an opaque credential without PII or financial debt', () => {
    it('generates opaque QR tokens free of personal names, phone numbers, or debt values', () => {
      const newMember = db.createMember(tenantId, {
        firstName: 'Solomon',
        lastName: 'Kassa',
        phone: '+251911445566',
        medicalNotes: 'Hypertension and knee stiffness',
        dueBalance: 150.0,
        consentGiven: true,
        joinDate: new Date().toISOString(),
        planId: 'plan-1-monthly',
      });

      const token = newMember.qrCodeToken;
      expect(token).toBeDefined();

      // Check format
      expect(token.startsWith(`QR-${newMember.memberNumber}-`)).toBe(true);

      // Verify NO PII is contained in the QR string
      expect(token.toLowerCase()).not.toContain('solomon');
      expect(token.toLowerCase()).not.toContain('kassa');
      expect(token).not.toContain('251911445566');
      expect(token.toLowerCase()).not.toContain('hypertension');
      expect(token.toLowerCase()).not.toContain('knee');
      expect(token).not.toContain('150');

      // Token has high entropy
      const tokenSuffix = token.replace(`QR-${newMember.memberNumber}-`, '');
      expect(tokenSuffix.length).toBeGreaterThanOrEqual(16);
    });
  });

  describe('4. Credential Revocation and Regeneration', () => {
    it('revokes member QR pass: revoked credential fails immediately while preserving history', () => {
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1001');
      const originalToken = member!.qrCodeToken;

      // Perform a successful check-in with the original token
      const checkIn1 = db.processCheckIn(tenantId, originalToken, 'QR_SCAN');
      expect(checkIn1.success).toBe(true);

      // Revoke the QR pass
      const revokeResult = db.revokeMemberQRCode(tenantId, member!.id, {
        id: 'user-staff-1',
        name: 'Manager Robel',
        role: 'MANAGER',
      });
      expect(revokeResult.success).toBe(true);

      // Verify member state
      const updatedMember = db.getMembers(tenantId).find((m) => m.id === member!.id);
      expect(updatedMember?.qrCodeRevoked).toBe(true);
      expect(updatedMember?.qrCodeRevokedAt).toBeDefined();

      // Verify audit log
      const auditLogs = db.getAuditLogs(tenantId);
      const revokeAudit = auditLogs.find((a) => a.action === 'QR_REVOKED' && a.entityId === member!.id);
      expect(revokeAudit).toBeDefined();
      expect(revokeAudit?.actorName).toBe('Manager Robel');

      // Scan with revoked credential must be denied
      const checkIn2 = db.processCheckIn(tenantId, originalToken, 'QR_SCAN');
      expect(checkIn2.success).toBe(false);
      expect(checkIn2.status).toBe('DENIED_REVOKED');
      expect(checkIn2.log.failureReason).toContain('revoked');

      // Historical check-in log from before revocation must still exist
      const logs = db.getCheckIns(tenantId);
      expect(logs.some((l) => l.id === checkIn1.log.id && l.status === 'GRANTED')).toBe(true);
    });

    it('regenerates member QR pass: blacklists old token and grants new token', () => {
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1001');
      const oldToken = member!.qrCodeToken;

      // Regenerate token
      const regenResult = db.regenerateMemberQRCode(tenantId, member!.id, {
        id: 'user-staff-1',
        name: 'Manager Robel',
        role: 'MANAGER',
      });

      expect(regenResult.success).toBe(true);
      expect(regenResult.newToken).toBeDefined();
      expect(regenResult.newToken).not.toBe(oldToken);

      const newToken = regenResult.newToken!;

      // Old token must fail with DENIED_REVOKED
      const oldScanResult = db.processCheckIn(tenantId, oldToken, 'QR_SCAN');
      expect(oldScanResult.success).toBe(false);
      expect(oldScanResult.status).toBe('DENIED_REVOKED');

      // New token must succeed
      const newScanResult = db.processCheckIn(tenantId, newToken, 'QR_SCAN');
      expect(newScanResult.success).toBe(true);
      expect(newScanResult.status).toBe('GRANTED');

      // Audit log check
      const auditLogs = db.getAuditLogs(tenantId);
      const regenAudit = auditLogs.find((a) => a.action === 'QR_REGENERATED' && a.entityId === member!.id);
      expect(regenAudit).toBeDefined();
    });

    it('revokes and regenerates via POST /api/members/qr API endpoint with RBAC', async () => {
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1001');

      // Test unauthorized access (Trainer cannot regenerate QR codes)
      const unauthReq = new NextRequest('http://localhost:3000/api/members/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'TRAINER',
          'x-user-id': 'user-trainer-1',
        },
        body: JSON.stringify({
          tenantId,
          memberId: member!.id,
          action: 'REGENERATE',
        }),
      });

      const unauthRes = await postQR(unauthReq);
      expect(unauthRes.status).toBe(403);

      // Authorized Receptionist regenerates QR code
      const authReq = new NextRequest('http://localhost:3000/api/members/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
          'x-user-name': 'Selam Front Desk',
        },
        body: JSON.stringify({
          tenantId,
          memberId: member!.id,
          action: 'REGENERATE',
        }),
      });

      const authRes = await postQR(authReq);
      expect(authRes.status).toBe(200);
      const data = await authRes.json();
      expect(data.success).toBe(true);
      expect(data.newToken).toBeDefined();
    });
  });

  describe('5. Manual lookup fallback when scanner/camera fails', () => {
    it('supports check-in by phone number or member number with MANUAL_LOOKUP method', () => {
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1001');
      expect(member).toBeDefined();

      // Check-in using phone number with MANUAL_LOOKUP method
      const phoneResult = db.processCheckIn(tenantId, member!.phone, 'MANUAL_LOOKUP', {
        notes: 'Camera scanner hardware failure - verified by phone',
      });

      expect(phoneResult.success).toBe(true);
      expect(phoneResult.status).toBe('GRANTED');
      expect(phoneResult.log.method).toBe('MANUAL_LOOKUP');
      expect(phoneResult.log.notes).toBe('Camera scanner hardware failure - verified by phone');

      // Check-in using memberNumber
      const memberNumberResult = db.processCheckIn(tenantId, member!.memberNumber, 'MANUAL_LOOKUP', {
        allowReEntry: true,
      });
      expect(memberNumberResult.success).toBe(true);
      expect(memberNumberResult.log.method).toBe('MANUAL_LOOKUP');
    });

    it('allows reception search fallback via /api/members?query=...', async () => {
      const req = new NextRequest('http://localhost:3000/api/members?tenantId=tenant-1&query=Yonas', {
        method: 'GET',
        headers: {
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
        },
      });

      const res = await getMembers(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.members.length).toBeGreaterThan(0);
      expect(data.members[0].firstName).toBe('Yonas');
    });
  });

  describe('6. Scan result is prominent, stable, and understandable without color alone', () => {
    it('returns unambiguous textual status code, reason text, and explicit message', () => {
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1003'); // Expired
      const result = db.processCheckIn(tenantId, member!.qrCodeToken, 'QR_SCAN');

      // Verify explicit non-color indicators
      expect(result.status).toBe('DENIED_EXPIRED');
      expect(result.log.failureReason).toBeDefined();
      expect(typeof result.log.failureReason).toBe('string');
      expect(result.log.failureReason?.length).toBeGreaterThan(5);
      expect(result.message).toContain('Access Denied: Membership Expired');
    });
  });

  describe('7. Duplicate/re-entry anti-passback rule (15-minute window) + Staff Override', () => {
    it('prevents passback: declines immediate second check-in within 15 minutes', () => {
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1001');

      // First check-in
      const firstCheckIn = db.processCheckIn(tenantId, member!.qrCodeToken, 'QR_SCAN');
      expect(firstCheckIn.success).toBe(true);
      expect(firstCheckIn.status).toBe('GRANTED');

      // Second check-in immediately after
      const secondCheckIn = db.processCheckIn(tenantId, member!.qrCodeToken, 'QR_SCAN');
      expect(secondCheckIn.success).toBe(false);
      expect(secondCheckIn.status).toBe('DENIED_RE_ENTRY');
      expect(secondCheckIn.log.failureReason).toContain('Anti-passback restriction');
    });

    it('allows authorized staff override of anti-passback rule with audit trail', () => {
      const member = db.getMembers(tenantId).find((m) => m.memberNumber === 'AF-1001');

      // Initial check-in
      db.processCheckIn(tenantId, member!.qrCodeToken, 'QR_SCAN');

      // Staff manual override
      const overrideResult = db.processCheckIn(
        tenantId,
        member!.qrCodeToken,
        'MANUAL_OVERRIDE',
        {
          actor: { id: 'user-staff-1', name: 'Receptionist Selam', role: 'RECEPTIONIST' },
          allowReEntry: true,
          notes: 'Member stepped out to parking lot to fetch water bottle',
        }
      );

      expect(overrideResult.success).toBe(true);
      expect(overrideResult.status).toBe('GRANTED');
      expect(overrideResult.log.method).toBe('MANUAL_OVERRIDE');
      expect(overrideResult.log.notes).toBe('Member stepped out to parking lot to fetch water bottle');
      expect(overrideResult.log.scannerActorName).toBe('Receptionist Selam');
    });
  });

  describe('8. Role-based server-side access limits on scan history and check-ins', () => {
    it('allows RECEPTIONIST and MANAGER to fetch check-in logs', async () => {
      const req = new NextRequest('http://localhost:3000/api/checkin?tenantId=tenant-1', {
        method: 'GET',
        headers: {
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-staff-1',
        },
      });

      const res = await getCheckIns(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data.checkIns)).toBe(true);
      expect(data.occupancy).toBeDefined();
    });

    it('blocks unauthorized roles (TRAINER, MEMBER) with 403 Forbidden', async () => {
      // Member trying to fetch receptionist checkin history
      const memberReq = new NextRequest('http://localhost:3000/api/checkin?tenantId=tenant-1', {
        method: 'GET',
        headers: {
          'x-user-role': 'MEMBER',
          'x-user-id': 'user-member-1',
        },
      });

      const memberRes = await getCheckIns(memberReq);
      expect(memberRes.status).toBe(403);

      // Trainer trying to process a check-in
      const trainerReq = new NextRequest('http://localhost:3000/api/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'TRAINER',
          'x-user-id': 'user-trainer-1',
        },
        body: JSON.stringify({
          tenantId,
          identifier: 'AF-1001',
        }),
      });

      const trainerRes = await postCheckIn(trainerReq);
      expect(trainerRes.status).toBe(403);
    });

    it('enforces multi-tenant boundary: staff on tenant-2 cannot view tenant-1 logs', async () => {
      const crossTenantReq = new NextRequest('http://localhost:3000/api/checkin?tenantId=tenant-1', {
        method: 'GET',
        headers: {
          'x-user-role': 'RECEPTIONIST',
          'x-user-id': 'user-reception-2',
          'x-user-tenant-id': otherTenantId, // From tenant-2
        },
      });

      const res = await getCheckIns(crossTenantReq);
      expect(res.status).toBe(403);
    });
  });
});
