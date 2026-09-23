// Standalone Zero-Dependency Test Suite for GymOS
const { db } = require('../lib/storage.ts');
const { parsePaperCSV } = require('../lib/paper-importer.ts');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n========================================');
console.log('  RUNNING GymOS AUTOMATED TEST SUITE');
console.log('========================================\n');

// TEST SUITE 1: Multi-Tenant Data Isolation
console.log('🔹 [1/4] Testing Multi-Tenant Data Isolation...');
const tenant1Members = db.getMembers('tenant-1');
const tenant2Members = db.getMembers('tenant-2');

assert(tenant1Members.length > 0, 'Gym A (Apex Fitness) has active seeded members');
assert(tenant1Members.every((m) => m.tenantId === 'tenant-1'), 'All Gym A members are strictly scoped to tenant-1');

const tenant1Ids = new Set(tenant1Members.map((m) => m.id));
assert(!tenant2Members.some((m) => tenant1Ids.has(m.id)), 'Gym B cannot view or leak Gym A members');

const newGym = db.createTenant({
  name: 'Spartan Strength Club',
  slug: 'spartan-strength',
  address: 'Bole Road 10',
  phone: '+251911998877',
  email: 'spartan@gym.com',
  currency: 'USD',
  currencySymbol: '$',
  maxCapacity: 150,
  monthlySubscriptionFee: 120,
  planTier: 'PRO',
  isActive: true,
});
assert(newGym.id !== undefined, 'Successfully onboarded new gym tenant');
assert(db.getPlans(newGym.id).length > 0, 'New gym automatically initialized with default isolated plan');

// TEST SUITE 2: Subscription & Expiration Calculation
console.log('\n🔹 [2/4] Testing Subscription Calculation Engine...');
const plans = db.getPlans('tenant-1');
const monthlyPlan = plans.find((p) => p.durationDays === 30) || plans[0];

const newMember = db.createMember('tenant-1', {
  firstName: 'Kenenisa',
  lastName: 'Bekele',
  phone: '+251 91 122 3344',
  planId: monthlyPlan.id,
  dueBalance: 0,
});
assert(newMember.status === 'ACTIVE', 'Newly registered member is marked ACTIVE');
assert(newMember.daysRemaining === monthlyPlan.durationDays, `Calculated exactly ${monthlyPlan.durationDays} days remaining`);
assert(newMember.qrCodeToken.startsWith('QR-'), 'Generated unique tamper-proof QR code token');

const renewed = db.renewMemberSubscription('tenant-1', 'mem-103', monthlyPlan.id, 'CASH');
assert(renewed && renewed.status === 'ACTIVE', 'Expired member successfully renewed to ACTIVE status');
assert(renewed && renewed.dueBalance === 0, 'Renewed member cleared outstanding debt');

// TEST SUITE 3: Lightning QR & Barcode Front-Desk Check-In
console.log('\n🔹 [3/4] Testing QR Check-In Kiosk & Access Control...');
const checkinValid = db.processCheckIn('tenant-1', 'QR-AF-1001-YONAS', 'QR_SCAN');
assert(checkinValid.success === true, 'Access GRANTED for valid active QR pass');
assert(checkinValid.status === 'GRANTED', 'Status is GRANTED');

const checkinExpired = db.processCheckIn('tenant-1', 'QR-AF-1003-ELIAS', 'QR_SCAN');
assert(checkinExpired.success === false, 'Access DENIED for expired member');
assert(checkinExpired.status.includes('DENIED'), 'Status properly flagged as DENIED');

const checkinWarning = db.processCheckIn('tenant-1', 'QR-AF-1002-SARA', 'QR_SCAN');
assert(checkinWarning.status === 'WARNING_EXPIRING', 'Warning triggered for membership expiring in <= 3 days');

const checkinUnknown = db.processCheckIn('tenant-1', 'NON-EXISTENT-BARCODE', 'BARCODE');
assert(checkinUnknown.status === 'DENIED_NOT_FOUND', 'Denied for unrecognized barcode or QR code');

const occupancy = db.getLiveOccupancy('tenant-1');
assert(occupancy.current >= 0 && occupancy.max > 0, 'Real-time floor occupancy correctly computed');

// TEST SUITE 4: Paper-to-Digital CSV Migration Importer
console.log('\n🔹 [4/4] Testing Paper-to-Digital CSV Migration...');
const samplePaperSheet = `Full Name,Phone,Email,Plan,Start Date,End Date,Amount Paid,Balance Due,Locker
Haile Gebrselassie,+251911555555,haile@olympics.com,Monthly Standard,2026-08-01,2026-08-31,45,0,L-04
Meseret Defar,+251922666666,,3-Month Pro Power,2026-07-15,2026-10-15,120,0,VIP-02`;

const parsed = parsePaperCSV(samplePaperSheet);
assert(parsed.rows.length === 2, 'Parsed exactly 2 member rows from paper log CSV');
assert(parsed.rows[0].fullName === 'Haile Gebrselassie', 'Parsed member name correctly');
assert(parsed.rows[0].lockerNumber === 'L-04', 'Parsed locker assignment correctly');

const importResult = db.bulkImportPaperMembers('tenant-1', parsed.rows);
assert(importResult.imported === 2, 'Bulk imported 2 paper members into gym database');

const importedMember = db.getMembers('tenant-1', 'Haile')[0];
assert(importedMember && importedMember.assignedLockerNumber === 'L-04', 'Locker correctly linked to imported member');

console.log('\n========================================');
console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('========================================\n');

if (failed > 0) process.exit(1);
