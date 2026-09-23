import { describe, it, expect } from 'vitest';
import { db } from '../lib/storage';

describe('Multi-Tenant Data Isolation', () => {
  it('should strictly isolate members between Gym A and Gym B', () => {
    const tenant1Members = db.getMembers('tenant-1');
    const tenant2Members = db.getMembers('tenant-2');

    expect(tenant1Members.length).toBeGreaterThan(0);
    // Ensure all tenant 1 members have tenantId 'tenant-1'
    tenant1Members.forEach((m) => {
      expect(m.tenantId).toBe('tenant-1');
    });

    // Ensure none of tenant 1 members are present in tenant 2 list
    const tenant1Ids = new Set(tenant1Members.map((m) => m.id));
    tenant2Members.forEach((m) => {
      expect(tenant1Ids.has(m.id)).toBe(false);
    });
  });

  it('should isolate membership plans per tenant', () => {
    const tenant1Plans = db.getPlans('tenant-1');
    const tenant2Plans = db.getPlans('tenant-2');

    expect(tenant1Plans.length).toBeGreaterThan(0);
    tenant1Plans.forEach((p) => {
      expect(p.tenantId).toBe('tenant-1');
    });
    tenant2Plans.forEach((p) => {
      expect(p.tenantId).toBe('tenant-2');
    });
  });

  it('should create new tenant with independent isolated default plan', () => {
    const newTenant = db.createTenant({
      name: 'Olympus Gym',
      slug: 'olympus-gym',
      address: 'Athens Blvd 44',
      phone: '+1 555 0199',
      email: 'admin@olympus.com',
      currency: 'EUR',
      currencySymbol: '€',
      maxCapacity: 150,
      monthlySubscriptionFee: 120,
      planTier: 'PRO',
      isActive: true,
    });

    expect(newTenant.id).toBeDefined();
    const plans = db.getPlans(newTenant.id);
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0].tenantId).toBe(newTenant.id);
  });
});
