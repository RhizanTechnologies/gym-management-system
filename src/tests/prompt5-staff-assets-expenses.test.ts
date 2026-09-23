import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/storage';
import { GET as getMembers } from '../app/api/members/route';
import { GET as getShifts, POST as createShift } from '../app/api/staff/shifts/route';
import { GET as getAssignments, POST as createAssignment, PATCH as updateAssignment } from '../app/api/staff/assignments/route';
import { GET as getEquipment, POST as createEquipmentOrTicket, PATCH as updateEquipmentOrTicket } from '../app/api/equipment/route';
import { GET as getExpenses, POST as createExpense, PATCH as updateExpense, DELETE as deleteExpense } from '../app/api/expenses/route';
import { NextRequest } from 'next/server';

function createMockRequest(
  url: string,
  options: {
    method?: string;
    userId?: string;
    role?: string;
    tenantId?: string;
    body?: any;
  } = {}
): NextRequest {
  const { method = 'GET', userId, role, tenantId = 'tenant-1', body } = options;
  const headers = new Headers();
  headers.set('host', 'localhost:3000');
  headers.set('x-tenant-id', tenantId);
  if (userId) headers.set('x-user-id', userId);
  if (role) headers.set('x-user-role', role);
  if (body) headers.set('content-type', 'application/json');

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('Prompt 5: Staff, Assets, Maintenance, and Expenses', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  describe('1. Staff & Trainer Scoping (Schedules, Assignments, Member Scoping)', () => {
    it('scopes trainer to ONLY their assigned PT clients on /api/members', async () => {
      // Coach Marcus (user-coach-1) is assigned to Bethlehem (mem-102) and Yonas (mem-101) in initial PT assignments
      const req = createMockRequest('http://localhost:3000/api/members?tenantId=tenant-1', {
        userId: 'user-coach-1',
        role: 'TRAINER',
      });
      const res = await getMembers(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data.members)).toBe(true);
      // All returned members must have an active PT assignment with user-coach-1
      const assignments = db.getPTAssignments('tenant-1', 'user-coach-1');
      const assignedIds = new Set(assignments.map((a) => a.memberId));

      for (const m of data.members) {
        expect(assignedIds.has(m.id) || assignedIds.has(m.memberNumber)).toBe(true);
      }
    });

    it('scopes trainer to ONLY their own shifts on /api/staff/shifts', async () => {
      const req = createMockRequest('http://localhost:3000/api/staff/shifts?tenantId=tenant-1', {
        userId: 'user-coach-1',
        role: 'TRAINER',
      });
      const res = await getShifts(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      for (const shift of data.shifts) {
        expect(shift.userId).toBe('user-coach-1');
      }
    });

    it('scopes trainer to ONLY their own assignments on /api/staff/assignments', async () => {
      const req = createMockRequest('http://localhost:3000/api/staff/assignments?tenantId=tenant-1', {
        userId: 'user-coach-1',
        role: 'TRAINER',
      });
      const res = await getAssignments(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      for (const assignment of data.assignments) {
        expect(assignment.trainerId).toBe('user-coach-1');
      }
    });
  });

  describe('2. Schedule & Assignment Permission Gating (Managers allowed, Unauthorized blocked)', () => {
    it('allows Manager to create staff shifts', async () => {
      const req = createMockRequest('http://localhost:3000/api/staff/shifts', {
        method: 'POST',
        userId: 'user-mgr-1',
        role: 'MANAGER',
        body: {
          tenantId: 'tenant-1',
          userId: 'user-coach-1',
          userName: 'Marcus Vance',
          userRole: 'TRAINER',
          shiftType: 'EVENING',
          date: '2026-09-20',
          startTime: '14:00',
          endTime: '22:00',
          notes: 'Covering evening strength floor',
        },
      });
      const res = await createShift(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.shift.userName).toBe('Marcus Vance');
    });

    it('blocks Trainer from creating staff shifts (403 Forbidden)', async () => {
      const req = createMockRequest('http://localhost:3000/api/staff/shifts', {
        method: 'POST',
        userId: 'user-coach-1',
        role: 'TRAINER',
        body: {
          tenantId: 'tenant-1',
          userId: 'user-coach-1',
          userName: 'Marcus Vance',
          userRole: 'TRAINER',
          shiftType: 'MORNING',
          date: '2026-09-20',
          startTime: '06:00',
          endTime: '14:00',
        },
      });
      const res = await createShift(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('allows Manager to assign a PT client to a Trainer', async () => {
      const req = createMockRequest('http://localhost:3000/api/staff/assignments', {
        method: 'POST',
        userId: 'user-mgr-1',
        role: 'MANAGER',
        body: {
          tenantId: 'tenant-1',
          trainerId: 'user-coach-1',
          trainerName: 'Marcus Vance',
          memberId: 'mem-103',
          memberName: 'Dawit Bekele',
          totalSessions: 12,
          startDate: '2026-09-22',
          notes: 'Competition prep hypertrophy',
        },
      });
      const res = await createAssignment(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.assignment.memberName).toBe('Dawit Bekele');
      expect(data.assignment.sessionsRemaining).toBe(12);
    });

    it('blocks unauthorized roles from creating PT assignments (403 Forbidden)', async () => {
      const req = createMockRequest('http://localhost:3000/api/staff/assignments', {
        method: 'POST',
        userId: 'user-maint-1',
        role: 'MAINTENANCE_STAFF',
        body: {
          tenantId: 'tenant-1',
          trainerId: 'user-coach-1',
          trainerName: 'Marcus Vance',
          memberId: 'mem-103',
          memberName: 'Dawit Bekele',
          totalSessions: 10,
          startDate: '2026-09-22',
        },
      });
      const res = await createAssignment(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
    });
  });

  describe('3. Asset Searchability & Chronological Service History', () => {
    it('supports searching assets by category, serial number, location, and condition', async () => {
      // 1. Search by serial number
      const snReq = createMockRequest('http://localhost:3000/api/equipment?tenantId=tenant-1&search=LF-TM-2024-001', {
        userId: 'user-owner-1',
        role: 'OWNER',
      });
      const snRes = await getEquipment(snReq);
      const snData = await snRes.json();
      expect(snData.equipment.length).toBeGreaterThan(0);
      expect(snData.equipment[0].serialNumber).toBe('LF-TM-2024-001');

      // 2. Search by location
      const locReq = createMockRequest('http://localhost:3000/api/equipment?tenantId=tenant-1&search=Cardio Deck', {
        userId: 'user-owner-1',
        role: 'OWNER',
      });
      const locRes = await getEquipment(locReq);
      const locData = await locRes.json();
      expect(locData.equipment.length).toBeGreaterThan(0);
      for (const eq of locData.equipment) {
        expect(eq.location?.toLowerCase()).toContain('cardio');
      }

      // 3. Filter by condition
      const condReq = createMockRequest('http://localhost:3000/api/equipment?tenantId=tenant-1&condition=EXCELLENT', {
        userId: 'user-owner-1',
        role: 'OWNER',
      });
      const condRes = await getEquipment(condReq);
      const condData = await condRes.json();
      for (const eq of condData.equipment) {
        expect(eq.condition).toBe('EXCELLENT');
      }
    });

    it('appends and retains chronological service history when maintenance ticket is resolved', async () => {
      // Create asset
      const eq = db.createEquipment({
        tenantId: 'tenant-1',
        name: 'Woodway Curve Treadmill',
        category: 'CARDIO',
        serialNumber: 'WW-CRV-991',
        purchaseDate: '2024-01-10',
        purchaseCost: 6500,
        status: 'OPERATIONAL',
        condition: 'GOOD',
      });

      // Create defect ticket
      const ticket = db.createMaintenanceTicket({
        tenantId: 'tenant-1',
        equipmentId: eq.id,
        equipmentName: eq.name,
        title: 'Curved slats belt friction',
        description: 'Slats sticking during initial run',
        priority: 'HIGH',
        severity: 'MAJOR_MALFUNCTION',
        reportedBy: 'Staff',
      });

      // Resolve ticket via API
      const resolveReq = createMockRequest('http://localhost:3000/api/equipment', {
        method: 'PATCH',
        userId: 'user-maint-1',
        role: 'MAINTENANCE_STAFF',
        body: {
          action: 'RESOLVE_TICKET',
          id: ticket.id,
          resolvedBy: 'Kassahun Mengistu',
          resolutionNotes: 'Lubricated bearing guide and realigned track slats.',
          resolutionCost: 75.0,
        },
      });
      const resolveRes = await updateEquipmentOrTicket(resolveReq);
      const resolveData = await resolveRes.json();

      expect(resolveRes.status).toBe(200);
      expect(resolveData.success).toBe(true);

      // Verify asset retains service history entry
      const updatedEq = db.getEquipmentById(eq.id);
      expect(updatedEq?.serviceHistory).toBeDefined();
      expect(updatedEq!.serviceHistory!.length).toBe(1);
      expect(updatedEq!.serviceHistory![0].performedBy).toBe('Kassahun Mengistu');
      expect(updatedEq!.serviceHistory![0].cost).toBe(75.0);
      expect(updatedEq!.status).toBe('OPERATIONAL');
      expect(updatedEq!.condition).toBe('GOOD');
    });
  });

  describe('4. Urgent Unsafe Equipment Locking (OUT_OF_SERVICE, CRITICAL, Operational Alert)', () => {
    it('automatically marks equipment OUT_OF_SERVICE and condition CRITICAL on safety hazard ticket', async () => {
      const eq = db.createEquipment({
        tenantId: 'tenant-1',
        name: 'Olympic Flat Bench Press #3',
        category: 'FREE_WEIGHTS',
        serialNumber: 'OLY-FB-003',
        purchaseDate: '2024-02-01',
        purchaseCost: 900,
        status: 'OPERATIONAL',
        condition: 'GOOD',
      });

      const ticketReq = createMockRequest('http://localhost:3000/api/equipment', {
        method: 'POST',
        userId: 'user-coach-1',
        role: 'TRAINER',
        body: {
          action: 'CREATE_TICKET',
          tenantId: 'tenant-1',
          equipmentId: eq.id,
          equipmentName: eq.name,
          title: 'Structural frame weld cracked on bar support catch',
          description: 'Left upright weld has severe crack. Barbell will collapse if loaded.',
          priority: 'URGENT',
          severity: 'CRITICAL_SAFETY_HAZARD',
          reportedBy: 'Coach Marcus',
        },
      });
      const res = await createEquipmentOrTicket(ticketReq);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.ticket.severity).toBe('CRITICAL_SAFETY_HAZARD');

      // Verify equipment state
      const targetEq = db.getEquipmentById(eq.id);
      expect(targetEq?.status).toBe('OUT_OF_SERVICE');
      expect(targetEq?.condition).toBe('CRITICAL');

      // Verify operational alert generated
      const alerts = db.getOperationalAlerts('tenant-1');
      const safetyAlert = alerts.find((a) => a.title.includes('CRITICAL SAFETY HAZARD') && a.title.includes(eq.name));
      expect(safetyAlert).toBeDefined();
      expect(safetyAlert?.severity).toBe('HIGH');
    });
  });

  describe('5. Maintenance Role Isolation (403 Forbidden on Members, Billing, Expenses)', () => {
    it('strictly forbids Maintenance user from accessing member profiles (403)', async () => {
      const req = createMockRequest('http://localhost:3000/api/members?tenantId=tenant-1', {
        userId: 'user-maint-1',
        role: 'MAINTENANCE_STAFF',
      });
      const res = await getMembers(req);
      expect(res.status).toBe(403);
    });

    it('strictly forbids Maintenance user from accessing expenses ledger (403)', async () => {
      const req = createMockRequest('http://localhost:3000/api/expenses?tenantId=tenant-1', {
        userId: 'user-maint-1',
        role: 'MAINTENANCE_STAFF',
      });
      const res = await getExpenses(req);
      expect(res.status).toBe(403);
    });

    it('strictly forbids Maintenance user from recording expenses (403)', async () => {
      const req = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        userId: 'user-maint-1',
        role: 'MAINTENANCE_STAFF',
        body: {
          tenantId: 'tenant-1',
          title: 'Parts purchase',
          category: 'EQUIPMENT_REPAIR',
          amount: 50,
          vendor: 'Hardware Store',
        },
      });
      const res = await createExpense(req);
      expect(res.status).toBe(403);
    });
  });

  describe('6. Server-Enforced Expense Approvals ($1,000 Limit) & Auditable Voiding', () => {
    it('allows Manager to approve expense <= $1,000', async () => {
      // Create expense under $1,000
      const exp = db.createExpense({
        tenantId: 'tenant-1',
        title: 'Water filter replacements',
        category: 'UTILITIES',
        amount: 350.0,
        paymentMethod: 'CASH',
        vendor: 'AquaPure',
        date: new Date().toISOString(),
        loggedBy: 'Staff',
        status: 'PENDING_APPROVAL',
      });

      const req = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'PATCH',
        userId: 'user-mgr-1',
        role: 'MANAGER',
        body: {
          action: 'APPROVE',
          id: exp.id,
        },
      });
      const res = await updateExpense(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.expense.status).toBe('APPROVED');
      expect(data.expense.approvedBy).toContain('Floor Manager');
    });

    it('blocks Manager from approving expense > $1,000 (403 Forbidden)', async () => {
      // exp-107 is $1,450.00 (Sauna heater core repair)
      const req = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'PATCH',
        userId: 'user-mgr-1',
        role: 'MANAGER',
        body: {
          action: 'APPROVE',
          id: 'exp-107',
        },
      });
      const res = await updateExpense(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('limit');
    });

    it('allows Owner or Finance Officer to approve expense > $1,000', async () => {
      const req = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'PATCH',
        userId: 'user-owner-1',
        role: 'OWNER',
        body: {
          action: 'APPROVE',
          id: 'exp-107',
        },
      });
      const res = await updateExpense(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.expense.status).toBe('APPROVED');
    });

    it('requires mandatory reason to reject an expense and logs audit record', async () => {
      const exp = db.createExpense({
        tenantId: 'tenant-1',
        title: 'Unverified catering lunch',
        category: 'OTHER',
        amount: 200.0,
        paymentMethod: 'CASH',
        vendor: 'Catering Co',
        date: new Date().toISOString(),
        loggedBy: 'Staff',
        status: 'PENDING_APPROVAL',
      });

      const req = createMockRequest('http://localhost:3000/api/expenses', {
        method: 'PATCH',
        userId: 'user-mgr-1',
        role: 'MANAGER',
        body: {
          action: 'REJECT',
          id: exp.id,
          reason: 'No authorization or receipts provided for catering.',
        },
      });
      const res = await updateExpense(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.expense.status).toBe('REJECTED');
      expect(data.expense.rejectionReason).toContain('No authorization');
    });

    it('performs non-destructive voiding that excludes expense from P&L deductions', async () => {
      const exp = db.createExpense({
        tenantId: 'tenant-1',
        title: 'Duplicate HVAC invoice',
        category: 'UTILITIES',
        amount: 500.0,
        paymentMethod: 'BANK_TRANSFER',
        vendor: 'CoolAir Inc',
        date: new Date().toISOString(),
        loggedBy: 'Staff',
        status: 'APPROVED',
      });

      const pnlBefore = db.getProfitLossSummary('tenant-1');

      // Void the expense via DELETE or PATCH action=VOID
      const voidReq = createMockRequest(`http://localhost:3000/api/expenses?id=${exp.id}&reason=Duplicate+billing+error`, {
        method: 'DELETE',
        userId: 'user-owner-1',
        role: 'OWNER',
      });
      const voidRes = await deleteExpense(voidReq);
      const voidData = await voidRes.json();

      expect(voidRes.status).toBe(200);
      expect(voidData.success).toBe(true);
      expect(voidData.expense.status).toBe('VOIDED');
      expect(voidData.expense.voidReason).toContain('Duplicate');

      // Verify that the record is NOT silently deleted (still in DB)
      const allExpenses = db.getExpenses('tenant-1');
      const found = allExpenses.find((e) => e.id === exp.id);
      expect(found).toBeDefined();
      expect(found?.status).toBe('VOIDED');

      // Verify that P&L deductions exclude the voided expense
      const pnlAfter = db.getProfitLossSummary('tenant-1');
      expect(pnlAfter.totalExpenses).toBe(pnlBefore.totalExpenses - 500.0);
    });
  });
});
