import { describe, it, expect } from 'vitest';
import { parsePaperCSV } from '../lib/paper-importer';
import { db } from '../lib/storage';

describe('Paper-to-Digital Importer Engine', () => {
  it('should parse CSV lines with full details from paper log sheet', () => {
    const rawCSV = `Full Name,Phone,Email,Plan,Start Date,End Date,Amount Paid,Balance Due,Locker
Abebe Bikila,+251911000111,abebe@run.com,Monthly Standard,2026-08-01,2026-08-31,45,0,L-01
Derartu Tulu,+251922000222,,3-Month Pro Power,2026-07-15,2026-10-15,120,0,VIP-02`;

    const result = parsePaperCSV(rawCSV);
    expect(result.rows.length).toBe(2);
    expect(result.rows[0].fullName).toBe('Abebe Bikila');
    expect(result.rows[0].phone).toBe('+251911000111');
    expect(result.rows[0].email).toBe('abebe@run.com');
    expect(result.rows[0].lockerNumber).toBe('L-01');
    expect(result.rows[1].fullName).toBe('Derartu Tulu');
    expect(result.rows[1].lockerNumber).toBe('VIP-02');
  });

  it('should bulk import parsed paper rows into tenant storage and auto-assign lockers', () => {
    const rawCSV = `Full Name,Phone,Email,Plan,Start Date,End Date,Amount Paid,Balance Due,Locker
Kenenisa Bekele,+251933000333,kenenisa@run.com,Monthly Standard,2026-08-01,2026-08-31,45,0,L-05`;

    const parsed = parsePaperCSV(rawCSV);
    const importResult = db.bulkImportPaperMembers('tenant-1', parsed.rows);

    expect(importResult.imported).toBe(1);
    const member = db.getMembers('tenant-1', 'Kenenisa')[0];
    expect(member).toBeDefined();
    expect(member.firstName).toBe('Kenenisa');
    expect(member.assignedLockerNumber).toBe('L-05');
  });
});
