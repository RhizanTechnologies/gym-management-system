import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/storage';

describe('Subscription & Renewal Calculation Engine', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  it('should calculate correct expiration date and active status upon registration', () => {
    const plans = db.getPlans('tenant-1');
    const monthlyPlan = plans.find((p) => p.durationDays === 30) || plans[0];

    const member = db.createMember('tenant-1', {
      firstName: 'Test',
      lastName: 'Athlete',
      phone: '+251 99 999 8888',
      joinDate: new Date().toISOString(),
      planId: monthlyPlan.id,
      dueBalance: 0,
    });

    expect(member.id).toBeDefined();
    expect(member.status).toBe('ACTIVE');
    expect(member.daysRemaining).toBe(monthlyPlan.durationDays);
    expect(member.subscriptionEnd).toBeDefined();
    expect(member.qrCodeToken).toContain(member.memberNumber);
  });

  it('should renew expired member and update daysRemaining to active', () => {
    const plans = db.getPlans('tenant-1');
    const plan = plans[0];

    const renewed = db.renewMemberSubscription('tenant-1', 'mem-103', plan.id, 'CASH');
    expect(renewed).toBeDefined();
    expect(renewed?.status).toBe('ACTIVE');
    expect(renewed?.daysRemaining).toBe(plan.durationDays);
    expect(renewed?.dueBalance).toBe(0);
  });
});
