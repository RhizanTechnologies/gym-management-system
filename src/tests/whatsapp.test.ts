import { describe, it, expect } from 'vitest';
import {
  formatPhoneForWhatsApp,
  getRenewalReminderUrl,
  getDebtReminderUrl,
  getWelcomePassUrl,
} from '../lib/whatsapp';
import { Member, Tenant } from '../lib/types';

describe('WhatsApp Automation Link Generator', () => {
  const sampleTenant: Tenant = {
    id: 'tenant-1',
    name: 'Apex Fitness Hub',
    slug: 'apex-fitness',
    address: 'Bole Road',
    phone: '+251 91 122 3344',
    email: 'contact@apexfitness.com',
    currency: 'USD',
    currencySymbol: '$',
    maxCapacity: 80,
    monthlySubscriptionFee: 99,
    planTier: 'PRO',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const sampleMember: Member = {
    id: 'mem-1',
    tenantId: 'tenant-1',
    memberNumber: 'AF-1001',
    firstName: 'Yonas',
    lastName: 'Abraham',
    phone: '+251 94 455 6677',
    joinDate: new Date().toISOString(),
    qrCodeToken: 'QR-TEST',
    status: 'ACTIVE',
    dueBalance: 25.5,
    daysRemaining: 2,
    currentPlanName: 'Monthly Standard',
    subscriptionEnd: new Date(Date.now() + 2 * 86400000).toISOString(),
  };

  it('should clean and format phone numbers for wa.me links', () => {
    expect(formatPhoneForWhatsApp('+251 91 122 3344')).toBe('251911223344');
    expect(formatPhoneForWhatsApp('0911223344')).toBe('251911223344');
    expect(formatPhoneForWhatsApp('251-91-122-3344')).toBe('251911223344');
  });

  it('should generate a renewal reminder URL with encoded greeting and gym name', () => {
    const url = getRenewalReminderUrl(sampleMember, sampleTenant);
    expect(url).toContain('https://wa.me/251944556677?text=');
    expect(url).toContain(encodeURIComponent('Yonas'));
    expect(url).toContain(encodeURIComponent('Apex Fitness Hub'));
  });

  it('should generate a debt balance reminder URL', () => {
    const url = getDebtReminderUrl(sampleMember, sampleTenant);
    expect(url).toContain('https://wa.me/251944556677?text=');
    expect(url).toContain(encodeURIComponent('25.50'));
  });

  it('should generate a welcome digital pass URL', () => {
    const url = getWelcomePassUrl(sampleMember, sampleTenant, 'https://gymos.app');
    expect(url).toContain('https://wa.me/251944556677?text=');
    expect(url).toContain(encodeURIComponent('https://gymos.app/member-portal'));
  });
});
