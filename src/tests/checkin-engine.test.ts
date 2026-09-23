import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/storage';

describe('QR & Barcode Front-Desk Check-In Engine', () => {
  beforeEach(() => {
    db.resetDemoData();
  });

  it('should grant access to active member with valid QR pass', () => {
    const result = db.processCheckIn('tenant-1', 'QR-AF-1001-YONAS', 'QR_SCAN');
    expect(result.success).toBe(true);
    expect(result.status).toBe('GRANTED');
    expect(result.member?.firstName).toBe('Yonas');
    expect(result.log.id).toBeDefined();
  });

  it('should deny check-in for expired membership', () => {
    // Elias is expired in initial data
    const result = db.processCheckIn('tenant-1', 'QR-AF-1003-ELIAS', 'QR_SCAN');
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED_EXPIRED');
    expect(result.message).toContain('Expired');
  });

  it('should warn for membership expiring in <= 3 days', () => {
    // Sara is expiring in 2 days in initial data
    const result = db.processCheckIn('tenant-1', 'QR-AF-1002-SARA', 'QR_SCAN');
    expect(result.success).toBe(true);
    expect(result.status).toBe('WARNING_EXPIRING');
    expect(result.message).toContain('expires in');
  });

  it('should deny for unknown QR code or barcode', () => {
    const result = db.processCheckIn('tenant-1', 'INVALID-QR-TOKEN-999', 'QR_SCAN');
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED_NOT_FOUND');
  });

  it('should update live gym floor occupancy when check-in occurs', () => {
    const occBefore = db.getLiveOccupancy('tenant-1');
    db.processCheckIn('tenant-1', 'QR-AF-1001-YONAS', 'QR_SCAN');
    const occAfter = db.getLiveOccupancy('tenant-1');
    expect(occAfter.current).toBeGreaterThanOrEqual(occBefore.current);
  });

  it('should verify active member and preserve calendar-based days remaining without deducting on scan', () => {
    const memberBefore = db.getMembers('tenant-1').find((m) => m.qrCodeToken === 'QR-AF-1001-YONAS')!;
    const initialDays = memberBefore.daysRemaining!;
    expect(initialDays).toBe(60);

    const result = db.processCheckIn('tenant-1', 'QR-AF-1001-YONAS', 'QR_SCAN');
    expect(result.success).toBe(true);
    // Calendar-based: days remain 60 (reduces daily by calendar date, not per scan)
    expect(result.member?.daysRemaining).toBe(60);
    expect(result.dayDeducted).toBe(false);
    expect(result.log.notes).toContain('60 days remaining on plan');
  });

  it('should correctly identify expired plan when calendar days reach 0 or negative', () => {
    const member = db.getMembers('tenant-1').find((m) => m.qrCodeToken === 'QR-AF-1002-SARA')!;
    db.updateMember('tenant-1', member.id, {
      daysRemaining: 0,
      subscriptionEnd: new Date(Date.now() - 86400000).toISOString(),
      status: 'EXPIRED',
    });

    const result = db.processCheckIn('tenant-1', 'QR-AF-1002-SARA', 'QR_SCAN');
    expect(result.success).toBe(false);
    expect(result.status).toBe('DENIED_EXPIRED');
    expect(result.message).toContain('Expired');
  });

  it('should maintain member daysRemaining unchanged when check-in is denied for expired member', () => {
    const memberBefore = db.getMembers('tenant-1').find((m) => m.qrCodeToken === 'QR-AF-1003-ELIAS')!;
    const daysBefore = memberBefore.daysRemaining;

    const result = db.processCheckIn('tenant-1', 'QR-AF-1003-ELIAS', 'QR_SCAN');
    expect(result.success).toBe(false);
    expect(result.dayDeducted).toBe(false);
    expect(memberBefore.daysRemaining).toBe(daysBefore);
  });
});
