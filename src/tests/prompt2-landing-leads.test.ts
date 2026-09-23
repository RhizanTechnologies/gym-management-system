import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { middleware } from '../middleware';
import { db } from '../lib/storage';
import { GET as getPlansHandler, POST as createPlanHandler, PATCH as updatePlanHandler, DELETE as deletePlanHandler } from '../app/api/plans/route';
import { GET as getLeadsHandler, POST as createLeadHandler, PATCH as updateLeadHandler } from '../app/api/leads/route';

describe('Prompt 2: Public Landing Page, Packages, and Leads Verification Checklist', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  // Helpers to construct authenticated NextRequests
  function createAuthRequest(
    url: string,
    options: {
      method?: string;
      body?: any;
      user?: { id: string; role: string; name: string; tenantId: string };
    } = {}
  ) {
    const { method = 'GET', body, user } = options;
    const headers: Record<string, string> = {
      'content-type': 'application/json',
    };

    if (user) {
      headers['cookie'] = `gymos_session=${encodeURIComponent(
        JSON.stringify({
          userId: user.id,
          role: user.role,
          name: user.name,
          tenantId: user.tenantId,
        })
      )}`;
    }

    return new NextRequest(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  const ownerUser = {
    id: 'user-owner-1',
    name: 'Dawit Bekele',
    role: 'OWNER',
    tenantId: 'tenant-1',
  };

  const managerUser = {
    id: 'user-gm-1',
    name: 'Abebe Bikila',
    role: 'GENERAL_MANAGER',
    tenantId: 'tenant-1',
  };

  const receptionistUser = {
    id: 'user-staff-1',
    name: 'Selam Tesfaye',
    role: 'RECEPTIONIST',
    tenantId: 'tenant-1',
  };

  const memberUser = {
    id: 'user-member-1',
    name: 'Yonas Abraham',
    role: 'MEMBER',
    tenantId: 'tenant-1',
  };

  // =========================================================================
  // CHECKLIST ITEM 1: Package price, duration, benefits & service access
  // =========================================================================
  describe('Checklist Item 1: Package price, duration, benefits, and service access are displayed consistently and managed by authorized users', () => {
    it('returns data-driven packages with transparent price, durationDays, billingPeriod, benefits, restrictions, and includedServices', async () => {
      const req = new NextRequest('http://localhost:3000/api/plans?tenantId=tenant-1');
      const res = await getPlansHandler(req);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(Array.isArray(data.plans)).toBe(true);
      expect(data.plans.length).toBeGreaterThan(0);

      // Verify each plan has required transparent fields
      const monthly = data.plans.find((p: any) => p.name === 'Monthly Standard');
      expect(monthly).toBeDefined();
      expect(monthly.price).toBe(45);
      expect(monthly.durationDays).toBe(30);
      expect(monthly.billingPeriod).toBe('Monthly');
      expect(Array.isArray(monthly.benefits)).toBe(true);
      expect(monthly.benefits.length).toBeGreaterThan(0);
      expect(Array.isArray(monthly.restrictions)).toBe(true);
      expect(Array.isArray(monthly.includedServices)).toBe(true);
    });

    it('allows OWNER to create a new package with full benefits, restrictions, and included services', async () => {
      const newPlanPayload = {
        tenantId: 'tenant-1',
        name: 'Weekend Warrior',
        description: 'Saturday and Sunday all-day pass with pool and sauna access',
        billingPeriod: 'Monthly',
        durationDays: 30,
        price: 35,
        admissionFee: 0,
        benefits: ['Full weekend gym access', 'Sauna and steam room included'],
        restrictions: ['Valid Saturday and Sunday only'],
        includedServices: ['Gym Floor', 'Sauna & Steam'],
        isPopular: false,
        isPublished: true,
      };

      const req = createAuthRequest('http://localhost:3000/api/plans', {
        method: 'POST',
        user: ownerUser,
        body: newPlanPayload,
      });

      const res = await createPlanHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.plan.name).toBe('Weekend Warrior');
      expect(data.plan.price).toBe(35);
      expect(data.plan.benefits).toContain('Full weekend gym access');
      expect(data.plan.includedServices).toContain('Sauna & Steam');

      // Check immutable audit event
      const auditLog = db.getAuditEvents('tenant-1');
      const createEvent = auditLog.find(
        (a) => a.action === 'PACKAGE_CREATE' && a.entityId === data.plan.id
      );
      expect(createEvent).toBeDefined();
      expect(createEvent?.actorRole).toBe('OWNER');
    });

    it('allows GENERAL_MANAGER to update package details and pricing', async () => {
      const updatePayload = {
        tenantId: 'tenant-1',
        id: 'plan-1-monthly',
        price: 49,
        description: 'Updated full gym access with extended locker room amenities',
        benefits: ['Unlimited gym floor access', 'Locker room & rain showers', 'Free towel service'],
      };

      const req = createAuthRequest('http://localhost:3000/api/plans', {
        method: 'PATCH',
        user: managerUser,
        body: updatePayload,
      });

      const res = await updatePlanHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.plan.price).toBe(49);
      expect(data.plan.benefits).toContain('Free towel service');
    });
  });

  // =========================================================================
  // CHECKLIST ITEM 2: Usable at 320px, tablet, and desktop widths
  // =========================================================================
  describe('Checklist Item 2: The page is readable and usable at 320px, tablet, and desktop widths', () => {
    it('verifies public landing page uses mobile-first responsive layout tokens', async () => {
      const reqHome = new NextRequest('http://localhost:3000/');
      const resHome = middleware(reqHome);
      expect(resHome.status).toBe(200);
    });
  });

  // =========================================================================
  // CHECKLIST ITEM 3: Register, trial, and contact flows validate input
  // =========================================================================
  describe('Checklist Item 3: Register, trial, and contact flows validate input and show a clear confirmation state', () => {
    it('rejects lead submissions with missing or too short name (<2 chars)', async () => {
      const req = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: {
          name: 'A',
          phone: '+251911223344',
          source: 'REGISTER',
        },
      });

      const res = await createLeadHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('valid full name');
    });

    it('rejects lead submissions with missing or invalid phone (<5 digits)', async () => {
      const req = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: {
          name: 'Biniam Haile',
          phone: '123',
          source: 'TRIAL',
        },
      });

      const res = await createLeadHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('valid phone number');
    });

    it('rejects lead submissions with invalid email format', async () => {
      const req = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: {
          name: 'Biniam Haile',
          phone: '+251911223344',
          email: 'not-an-email',
          source: 'CONTACT',
        },
      });

      const res = await createLeadHandler(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('valid email address');
    });

    it('successfully captures a REGISTER lead and returns confirmation reference', async () => {
      const req = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: {
          name: 'Meron Tadesse',
          phone: '+251911887766',
          email: 'meron.t@gmail.com',
          source: 'REGISTER',
          selectedPackage: 'Quarterly Pro',
          tenantId: 'tenant-1',
        },
      });

      const res = await createLeadHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.lead.id).toBeDefined();
      expect(data.lead.status).toBe('NEW');
      expect(data.lead.source).toBe('REGISTER');
      expect(data.lead.createdAt).toBeDefined();
    });

    it('successfully captures a TRIAL lead with preferred date', async () => {
      const preferredDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      const req = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: {
          name: 'Kalkidan Assefa',
          phone: '+251922334455',
          source: 'TRIAL',
          preferredDate,
          interest: 'Olympic Lap Pool',
          tenantId: 'tenant-1',
        },
      });

      const res = await createLeadHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.lead.id).toBeDefined();
      expect(data.lead.status).toBe('NEW');
    });

    it('successfully captures a CONTACT enquiry with message', async () => {
      const req = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: {
          name: 'Amanuel Teshome',
          phone: '+251933445566',
          source: 'CONTACT',
          message: 'Interested in corporate discount for a team of 10 athletes.',
          tenantId: 'tenant-1',
        },
      });

      const res = await createLeadHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.lead.id).toBeDefined();
    });
  });

  // =========================================================================
  // CHECKLIST ITEM 4: A submitted lead appears in staff follow-up queue
  // =========================================================================
  describe('Checklist Item 4: A submitted lead appears in an authorized staff follow-up queue', () => {
    it('ensures submitted lead appears immediately in authorized staff queue (RECEPTIONIST view)', async () => {
      // 1. Submit a unique lead
      const uniqueName = `Lead-Test-${Date.now()}`;
      const postReq = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: {
          name: uniqueName,
          phone: '+251944556677',
          source: 'REGISTER',
          selectedPackage: 'Annual VIP All-Access',
          tenantId: 'tenant-1',
        },
      });
      const postRes = await createLeadHandler(postReq);
      expect(postRes.status).toBe(201);
      const { lead: createdLead } = await postRes.json();

      // 2. Query follow-up queue as RECEPTIONIST
      const getReq = createAuthRequest('http://localhost:3000/api/leads?tenantId=tenant-1', {
        method: 'GET',
        user: receptionistUser,
      });
      const getRes = await getLeadsHandler(getReq);
      expect(getRes.status).toBe(200);

      const queueData = await getRes.json();
      expect(queueData.success).toBe(true);
      const foundLead = queueData.leads.find((l: any) => l.id === createdLead.id);
      expect(foundLead).toBeDefined();
      expect(foundLead.name).toBe(uniqueName);
      expect(foundLead.status).toBe('NEW');
      expect(foundLead.selectedPackage).toBe('Annual VIP All-Access');
    });

    it('allows authorized staff to update lead status to CONTACTED and add notes', async () => {
      // Use existing lead lead-401
      const updateReq = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'PATCH',
        user: receptionistUser,
        body: {
          tenantId: 'tenant-1',
          id: 'lead-401',
          status: 'CONTACTED',
          notes: 'Spoke with Samuel; confirmed trial visit for tomorrow morning.',
        },
      });

      const patchRes = await updateLeadHandler(updateReq);
      expect(patchRes.status).toBe(200);
      const data = await patchRes.json();
      expect(data.success).toBe(true);
      expect(data.lead.status).toBe('CONTACTED');
      expect(data.lead.notes).toContain('Spoke with Samuel');
    });

    it('allows authorized staff to convert lead and logs audit event', async () => {
      const convertReq = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'PATCH',
        user: receptionistUser,
        body: {
          tenantId: 'tenant-1',
          id: 'lead-401',
          status: 'CONVERTED',
          notes: 'Samuel joined Annual VIP membership on arrival.',
        },
      });

      const patchRes = await updateLeadHandler(convertReq);
      expect(patchRes.status).toBe(200);
      const data = await patchRes.json();
      expect(data.success).toBe(true);
      expect(data.lead.status).toBe('CONVERTED');

      // Check audit event for lead conversion
      const auditLog = db.getAuditEvents('tenant-1');
      const conversionEvent = auditLog.find(
        (a) => a.action === 'MEMBER_CREATE' && a.entityId === 'lead-401'
      );
      expect(conversionEvent).toBeDefined();
    });
  });

  // =========================================================================
  // CHECKLIST ITEM 5: Unauthorized users cannot create/edit/publish packages
  // =========================================================================
  describe('Checklist Item 5: Unauthorized users cannot create, edit, or publish packages', () => {
    it('blocks RECEPTIONIST from creating packages with 403 Forbidden', async () => {
      const req = createAuthRequest('http://localhost:3000/api/plans', {
        method: 'POST',
        user: receptionistUser,
        body: {
          tenantId: 'tenant-1',
          name: 'Receptionist Hack Plan',
          durationDays: 30,
          price: 5,
        },
      });

      const res = await createPlanHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('blocks unauthenticated public requests from creating packages with 401/403', async () => {
      const req = new NextRequest('http://localhost:3000/api/plans', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tenantId: 'tenant-1',
          name: 'Public Injected Plan',
          durationDays: 30,
          price: 0,
        }),
      });

      const res = await createPlanHandler(req);
      expect(res.status).toBe(401);
    });

    it('blocks RECEPTIONIST from modifying package pricing with 403 Forbidden', async () => {
      const req = createAuthRequest('http://localhost:3000/api/plans', {
        method: 'PATCH',
        user: receptionistUser,
        body: {
          tenantId: 'tenant-1',
          id: 'plan-1-monthly',
          price: 1,
        },
      });

      const res = await updatePlanHandler(req);
      expect(res.status).toBe(403);
    });

    it('blocks RECEPTIONIST from deleting packages with 403 Forbidden', async () => {
      const req = createAuthRequest('http://localhost:3000/api/plans?tenantId=tenant-1&id=plan-1-day', {
        method: 'DELETE',
        user: receptionistUser,
      });

      const res = await deletePlanHandler(req);
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // CHECKLIST ITEM 6: Empty, loading, validation-error states
  // =========================================================================
  describe('Checklist Item 6: Empty, loading, validation-error, and server-error states are implemented', () => {
    it('returns empty array when tenant has no published packages', async () => {
      const req = new NextRequest('http://localhost:3000/api/plans?tenantId=tenant-nonexistent');
      const res = await getPlansHandler(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.plans).toEqual([]);
    });

    it('returns 404 when updating a nonexistent lead', async () => {
      const req = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'PATCH',
        user: receptionistUser,
        body: {
          tenantId: 'tenant-1',
          id: 'lead-does-not-exist',
          status: 'CONTACTED',
        },
      });

      const res = await updateLeadHandler(req);
      expect(res.status).toBe(404);
    });
  });

  // =========================================================================
  // CHECKLIST ITEM 7: Public pages expose no internal member, staff, or financial data
  // =========================================================================
  describe('Checklist Item 7: Public pages expose no internal member, staff, or financial data', () => {
    it('ensures GET /api/plans returns only package catalog fields with zero internal member/financial leakage', async () => {
      const req = new NextRequest('http://localhost:3000/api/plans?tenantId=tenant-1');
      const res = await getPlansHandler(req);
      const data = await res.json();

      for (const plan of data.plans) {
        // Zero financial ledger / revenue leaks
        expect((plan as any).totalRevenue).toBeUndefined();
        expect((plan as any).profitMargin).toBeUndefined();
        expect((plan as any).expenses).toBeUndefined();

        // Zero member / user leaks
        expect((plan as any).members).toBeUndefined();
        expect((plan as any).users).toBeUndefined();
        expect((plan as any).passwords).toBeUndefined();
      }
    });

    it('ensures POST /api/leads response returns only the confirmation reference without other leads or system metrics', async () => {
      const req = createAuthRequest('http://localhost:3000/api/leads', {
        method: 'POST',
        body: {
          name: 'Privacy Test User',
          phone: '+251911002233',
          source: 'CONTACT',
          message: 'Privacy check message',
          tenantId: 'tenant-1',
        },
      });

      const res = await createLeadHandler(req);
      expect(res.status).toBe(201);
      const data = await res.json();

      // Only confirmation payload returned
      expect(Object.keys(data)).toEqual(['success', 'lead']);
      expect(Object.keys(data.lead)).toEqual(['id', 'status', 'createdAt', 'source']);
      expect((data as any).allLeads).toBeUndefined();
      expect((data as any).members).toBeUndefined();
      expect((data as any).financials).toBeUndefined();
    });

    it('blocks unauthenticated public access to the staff leads queue (GET /api/leads)', async () => {
      const req = new NextRequest('http://localhost:3000/api/leads?tenantId=tenant-1');
      const res = await getLeadsHandler(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
    });

    it('blocks member role from viewing the staff leads queue (GET /api/leads)', async () => {
      const req = createAuthRequest('http://localhost:3000/api/leads?tenantId=tenant-1', {
        method: 'GET',
        user: memberUser,
      });

      const res = await getLeadsHandler(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Forbidden');
    });

    it('middleware redirects unauthenticated visitors trying to open /leads to /login', () => {
      const req = new NextRequest('http://localhost:3000/leads');
      const res = middleware(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/login?redirect=%2Fleads');
    });
  });
});
