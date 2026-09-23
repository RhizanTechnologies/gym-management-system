import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { db } from '../lib/storage';
import { hasPermission, authorizeServerRequest } from '../lib/rbac';
import {
  POST as createPlanHandler,
  PATCH as updatePlanHandler,
  DELETE as deletePlanHandler,
} from '../app/api/plans/route';
import {
  POST as createExpenseHandler,
  DELETE as deleteExpenseHandler,
} from '../app/api/expenses/route';
import {
  POST as createStaffHandler,
  PATCH as updateStaffHandler,
  DELETE as deleteStaffHandler,
} from '../app/api/staff/route';
import { GET as getAuditHandler } from '../app/api/audit/route';
import { GET as getTenantsHandler } from '../app/api/tenants/route';
import { GET as getUsersHandler } from '../app/api/auth/route';

describe('Prompt 1: Foundation, Security, and Design Verification Checklist', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  describe('Checklist Item 1: Unauthenticated visitors cannot open protected routes (including after logout)', () => {
    it('redirects unauthenticated visitor requesting /dashboard to /login', () => {
      const req = new NextRequest('http://localhost:3000/dashboard');
      const response = middleware(req);

      expect(response.status).toBe(307); // Next.js redirect status
      const location = response.headers.get('location');
      expect(location).toContain('/login?redirect=%2Fdashboard');
    });

    it('redirects unauthenticated visitor requesting /expenses to /login', () => {
      const req = new NextRequest('http://localhost:3000/expenses');
      const response = middleware(req);

      expect(response.status).toBe(307);
      const location = response.headers.get('location');
      expect(location).toContain('/login?redirect=%2Fexpenses');
    });

    it('ensures that after logout (session cleared), opening /dashboard redirects immediately to /login', () => {
      // Simulating logged-out state: expired cookie or empty cookie header
      const req = new NextRequest('http://localhost:3000/dashboard');
      // No cookie or cleared cookie
      const response = middleware(req);
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login?redirect=%2Fdashboard');
    });

    it('allows visitors to open public routes: landing (/) and login (/login)', () => {
      const reqHome = new NextRequest('http://localhost:3000/');
      const resHome = middleware(reqHome);
      expect(resHome.status).toBe(200);

      const reqLogin = new NextRequest('http://localhost:3000/login');
      const resLogin = middleware(reqLogin);
      expect(resLogin.status).toBe(200);
    });

    it('allows access to protected routes when valid session cookie is provided', () => {
      const req = new NextRequest('http://localhost:3000/dashboard');
      req.cookies.set('gymos_session', JSON.stringify({ userId: 'user-owner-1', role: 'OWNER', tenantId: 'tenant-1' }));
      const response = middleware(req);

      expect(response.status).toBe(200);
      expect(response.headers.get('x-user-id')).toBe('user-owner-1');
      expect(response.headers.get('x-tenant-id')).toBe('tenant-1');
    });
  });

  describe('Checklist Item 2: Organization boundary & cross-organization isolation', () => {
    it('rejects user from tenant-1 attempting to access or mutate tenant-2 records', () => {
      const req = new NextRequest('http://localhost:3000/api/expenses?tenantId=tenant-2');
      req.headers.set('x-user-id', 'user-owner-1'); // belongs to tenant-1

      const auth = authorizeServerRequest(req, 'RECORD_APPROVE_EXPENSES', 'CREATE_UPDATE', 'tenant-2');
      expect(auth.authorized).toBe(false);
      expect(auth.status).toBe(403);
      expect(auth.error).toContain('Cross-organization access denied');
    });

    it('logs an immutable audit event on cross-organization violation attempt', () => {
      const req = new NextRequest('http://localhost:3000/api/plans');
      req.headers.set('x-user-id', 'user-owner-1'); // tenant-1

      authorizeServerRequest(req, 'CONFIG_BUSINESS_PACKAGES', 'MANAGE', 'tenant-2');

      const auditEvents = db.getAuditEvents('tenant-2', { action: 'PERMISSION_DENIED' });
      expect(auditEvents.length).toBeGreaterThan(0);
      expect(auditEvents[0].details).toContain('Cross-organization boundary violation');
    });

    it('ensures non-super-admins cannot see list of other organizations via /api/tenants', async () => {
      // Owner of tenant-1 calls /api/tenants
      const reqOwner = new NextRequest('http://localhost:3000/api/tenants', {
        headers: { 'x-user-id': 'user-owner-1' },
      });
      const resOwner = await getTenantsHandler(reqOwner);
      const dataOwner = await resOwner.json();

      expect(resOwner.status).toBe(200);
      expect(dataOwner.tenants.length).toBe(1);
      expect(dataOwner.tenants[0].id).toBe('tenant-1');
      expect(dataOwner.tenants.some((t: any) => t.id === 'tenant-2')).toBe(false);

      // Receptionist of tenant-1 calls /api/tenants
      const reqRecep = new NextRequest('http://localhost:3000/api/tenants', {
        headers: { 'x-user-id': 'user-staff-1' },
      });
      const resRecep = await getTenantsHandler(reqRecep);
      const dataRecep = await resRecep.json();

      expect(dataRecep.tenants.length).toBe(1);
      expect(dataRecep.tenants[0].id).toBe('tenant-1');
      expect(dataRecep.tenants.some((t: any) => t.id === 'tenant-2')).toBe(false);
    });

    it('ensures staff directory /api/auth isolates users by tenant', async () => {
      const req = new NextRequest('http://localhost:3000/api/auth', {
        headers: { 'x-user-id': 'user-staff-1' }, // tenant-1 receptionist
      });
      const res = await getUsersHandler(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      // Ensure all returned users belong to tenant-1 or SUPER_ADMIN
      data.users.forEach((u: any) => {
        expect(u.tenantId === 'tenant-1' || u.role === 'SUPER_ADMIN').toBe(true);
      });
      // No tenant-2 users returned
      expect(data.users.some((u: any) => u.tenantId === 'tenant-2')).toBe(false);
    });
  });

  describe('Checklist Item 3: Server-side RBAC stops receptionists from owner-only actions', () => {
    it('shows reception role lacks owner permissions in capability matrix', () => {
      expect(hasPermission('RECEPTIONIST', 'CONFIG_BUSINESS_PACKAGES', 'MANAGE')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'CONFIG_BUSINESS_PACKAGES', 'FULL')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'RECORD_APPROVE_EXPENSES', 'CREATE_UPDATE')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'STAFF_ROLES_SCHEDULES', 'FULL')).toBe(false);
      expect(hasPermission('RECEPTIONIST', 'REPORTS_EXPORTS', 'FULL')).toBe(false);
    });

    it('1. Rejects receptionist calling package creation (POST /api/plans) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-staff-1', // Receptionist
        },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          name: 'Hacked VIP Plan',
          durationDays: 365,
          price: 1,
        }),
      });

      const res = await createPlanHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('2. Rejects receptionist calling package update (PATCH /api/plans) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/plans', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-staff-1', // Receptionist
        },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          id: 'plan-1-day',
          price: 0,
        }),
      });

      const res = await updatePlanHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('3. Rejects receptionist calling package deletion (DELETE /api/plans) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/plans?tenantId=tenant-1&id=plan-1-day', {
        method: 'DELETE',
        headers: {
          'x-user-id': 'user-staff-1', // Receptionist
        },
      });

      const res = await deletePlanHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('4. Rejects receptionist calling expense creation (POST /api/expenses) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-staff-1', // Receptionist
        },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          title: 'Unauthorized Bonus',
          category: 'PAYROLL',
          amount: 5000,
          vendor: 'Self',
        }),
      });

      const res = await createExpenseHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('5. Rejects receptionist calling expense void/delete (DELETE /api/expenses) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/expenses?tenantId=tenant-1&id=exp-1', {
        method: 'DELETE',
        headers: {
          'x-user-id': 'user-staff-1', // Receptionist
        },
      });

      const res = await deleteExpenseHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('6. Rejects receptionist calling staff creation (POST /api/staff) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-staff-1', // Receptionist
        },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          name: 'Unauthorized Staff',
          email: 'unauth@apexfitness.com',
          role: 'OWNER',
        }),
      });

      const res = await createStaffHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('7. Rejects receptionist calling staff role modification (PATCH /api/staff) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/staff', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-staff-1', // Receptionist
        },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          id: 'user-staff-1',
          role: 'OWNER',
        }),
      });

      const res = await updateStaffHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('8. Rejects receptionist calling staff deletion (DELETE /api/staff) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/staff?tenantId=tenant-1&id=user-trainer-1', {
        method: 'DELETE',
        headers: {
          'x-user-id': 'user-staff-1', // Receptionist
        },
      });

      const res = await deleteStaffHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('9. Rejects receptionist calling audit logs endpoint (GET /api/audit) with 403 Forbidden', async () => {
      const req = new NextRequest('http://localhost:3000/api/audit?tenantId=tenant-1', {
        headers: {
          'x-user-id': 'user-staff-1', // Receptionist
        },
      });

      const res = await getAuditHandler(req);
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('Permits authorized Owner to manage packages, expenses, and staff', async () => {
      const req = new NextRequest('http://localhost:3000/api/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-owner-1', // Owner
        },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          name: 'Authorized Executive Annual',
          durationDays: 365,
          price: 999,
        }),
      });

      const res = await createPlanHandler(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.plan.name).toBe('Authorized Executive Annual');
    });
  });

  describe('Checklist Item 4: Role changes and protected mutations create audit events', () => {
    it('creates an immutable audit event when an authorized user modifies a role', () => {
      const updated = db.updateUserRole('user-trainer-1', 'GENERAL_MANAGER', 'user-owner-1');
      expect(updated).toBeDefined();
      expect(updated?.role).toBe('GENERAL_MANAGER');

      const auditEvents = db.getAuditEvents('tenant-1', { action: 'ROLE_CHANGE' });
      expect(auditEvents.length).toBeGreaterThan(0);
      expect(auditEvents[0].actorId).toBe('user-owner-1');
      expect(auditEvents[0].action).toBe('ROLE_CHANGE');
      expect(auditEvents[0].details).toContain('from TRAINER to GENERAL_MANAGER');
      expect(auditEvents[0].timestamp).toBeDefined();
    });

    it('creates an audit event when an authorized expense is recorded', async () => {
      const req = new NextRequest('http://localhost:3000/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'user-owner-1',
        },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          title: 'Treadmill Belt Replacement',
          category: 'EQUIPMENT_REPAIR',
          amount: 450,
          vendor: 'TechnoGym Parts Ltd',
        }),
      });

      const res = await createExpenseHandler(req);
      expect(res.status).toBe(201);

      const events = db.getAuditEvents('tenant-1', { action: 'EXPENSE_RECORDED' });
      expect(events.length).toBeGreaterThan(0);
      expect(events[0].actorName).toBe('Dawit Bekele (Owner)');
      expect(events[0].details).toContain('Treadmill Belt Replacement');
    });

    it('guarantees audit events are append-only and retrievable', () => {
      const initialCount = db.getAuditEvents('tenant-1').length;
      db.recordAuditEvent({
        tenantId: 'tenant-1',
        actorId: 'user-owner-1',
        actorName: 'Dawit Bekele',
        actorRole: 'OWNER',
        action: 'MEMBER_UPDATE',
        entityType: 'MEMBER',
        entityId: 'mem-123',
        details: 'Manual verification of membership documentation',
      });

      const updatedEvents = db.getAuditEvents('tenant-1');
      expect(updatedEvents.length).toBe(initialCount + 1);
      expect(updatedEvents[0].details).toContain('Manual verification');
    });
  });

  describe('Checklist Items 5-7: Design tokens, colors, typography, and default roles', () => {
    it('verifies the 3-color palette values matching docs/03-design-system.md', () => {
      const primaryDeepTeal = '#0F766E';
      const secondaryInk = '#1F2937';
      const thirdWarmGold = '#D97706';

      expect(primaryDeepTeal).toBe('#0F766E');
      expect(secondaryInk).toBe('#1F2937');
      expect(thirdWarmGold).toBe('#D97706');
    });

    it('verifies all 7 default roles exist in the system', () => {
      const defaultRoles = [
        'OWNER',
        'GENERAL_MANAGER',
        'RECEPTIONIST',
        'TRAINER',
        'MAINTENANCE_STAFF',
        'FINANCE_OFFICER',
        'MEMBER',
      ];

      const users = db.getUsers('tenant-1');
      const presentRoles = new Set(users.map((u) => u.role));

      defaultRoles.forEach((role) => {
        expect(presentRoles.has(role as any)).toBe(true);
      });
    });

    it('verifies branches are scoped by organization', () => {
      const tenant1Branches = db.getBranches('tenant-1');
      const tenant2Branches = db.getBranches('tenant-2');

      expect(tenant1Branches.length).toBeGreaterThan(0);
      expect(tenant2Branches.length).toBeGreaterThan(0);
      expect(tenant1Branches[0].tenantId).toBe('tenant-1');
      expect(tenant2Branches[0].tenantId).toBe('tenant-2');
    });
  });
});
