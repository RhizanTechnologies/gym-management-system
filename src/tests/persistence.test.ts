import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../lib/storage';
import fs from 'fs';
import path from 'path';

describe('Data Persistence & Demo Reset Engine', () => {
  const storePath = path.join(process.cwd(), 'data', 'test-persistence-store.json');

  beforeEach(() => {
    (db as any).setDataFilePath(storePath);
  });

  it('should persist new member creations to disk snapshot', () => {
    const uniquePhone = `+251 99 ${Math.floor(100000 + Math.random() * 900000)}`;
    const newMem = db.createMember('tenant-1', {
      firstName: 'TestPersistence',
      lastName: 'User',
      phone: uniquePhone,
      joinDate: new Date().toISOString(),
      dueBalance: 0,
    });

    expect(newMem.id).toBeDefined();
    expect(fs.existsSync(storePath)).toBe(true);

    const savedRaw = fs.readFileSync(storePath, 'utf-8');
    const parsed = JSON.parse(savedRaw);
    const found = parsed.members?.some((m: any) => m.phone === uniquePhone);
    expect(found).toBe(true);
  });

  it('should reset all data back to pristine demo state on resetDemoData', () => {
    // Add dummy member
    db.createMember('tenant-1', {
      firstName: 'Disposable',
      lastName: 'Person',
      phone: '+251 90 000 0000',
      joinDate: new Date().toISOString(),
      dueBalance: 0,
    });

    // Reset
    db.resetDemoData();

    // Verify
    const members = db.getMembers('tenant-1');
    const disposable = members.find((m) => m.firstName === 'Disposable');
    expect(disposable).toBeUndefined();
    expect(members.length).toBe(8); // Original seed members (including Abel Tesfaye)
  });
});
