import { db } from '../lib/storage';
import { parsePaperCSV } from '../lib/paper-importer';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n======================================================');
console.log('  RUNNING GymOS EXPANDED DYNAMIC, AUTH & STAFF TESTS');
console.log('======================================================\n');

// TEST SUITE 1: Multi-Tenant Data Isolation
console.log('🔹 [1/8] Testing Multi-Tenant Data Isolation...');
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

// TEST SUITE 2: Real Authentication & Credentials
console.log('\n🔹 [2/8] Testing Authentication & Role Verification...');
const validUser = db.verifyCredentials('dawit@apexfitness.com', 'password123');
assert(validUser?.user?.role === 'GYM_OWNER', 'Owner credentials verified successfully');

const receptionist = db.verifyCredentials('selam@apexfitness.com', 'password123');
assert(receptionist?.user?.role === 'RECEPTIONIST', 'Receptionist credentials verified successfully');

const invalidUser = db.verifyCredentials('nonexistent@gym.com', 'wrongpass');
assert(invalidUser === null, 'Rejected invalid login attempt');

// TEST SUITE 3: User & Staff Management with Activation / Deactivation
console.log('\n🔹 [3/8] Testing Staff Management & Account Deactivation...');
const newStaff = db.createUser('tenant-1', {
  name: 'Coach Sarah Worku',
  email: 'sarah@apexfitness.com',
  role: 'TRAINER',
  phone: '+251 91 555 6677',
});
assert(newStaff.id !== undefined && newStaff.isActive === true, 'Created new active staff account');

// Verify new staff can log in
const sarahLogin = db.verifyCredentials('sarah@apexfitness.com', 'password123');
assert(sarahLogin?.user !== undefined, 'New staff user can log in successfully');

// Deactivate Sarah's account
db.toggleUserStatus('tenant-1', newStaff.id, false);
const deactivatedSarah = db.getUserById('tenant-1', newStaff.id);
assert(deactivatedSarah?.isActive === false && deactivatedSarah?.status === 'DEACTIVATED', 'Account marked as DEACTIVATED');

// Verify login is blocked when deactivated
const blockedLogin = db.verifyCredentials('sarah@apexfitness.com', 'password123');
assert(blockedLogin?.error === 'ACCOUNT_DEACTIVATED', 'Deactivated staff member is strictly blocked from logging in');

// Re-activate Sarah's account
db.toggleUserStatus('tenant-1', newStaff.id, true);
const restoredLogin = db.verifyCredentials('sarah@apexfitness.com', 'password123');
assert(restoredLogin?.user !== undefined, 'Re-activated staff member can log in again');

// Update staff details
const updatedStaff = db.updateUser('tenant-1', newStaff.id, { role: 'RECEPTIONIST' });
assert(updatedStaff?.role === 'RECEPTIONIST', 'Successfully updated staff member role to RECEPTIONIST');

// Delete staff account
db.deleteUser('tenant-1', newStaff.id);
assert(db.getUserById('tenant-1', newStaff.id) === undefined, 'Successfully removed staff user account');

// TEST SUITE 4: Dynamic Plan CRUD
console.log('\n🔹 [4/8] Testing Dynamic Plan CRUD Operations...');
const createdPlan = db.createPlan('tenant-1', {
  name: 'Weekend Warrior',
  description: 'Saturday and Sunday access only',
  durationDays: 30,
  price: 25,
  admissionFee: 5,
  includesClasses: false,
  color: '#EC4899',
  isActive: true,
});
assert(createdPlan.id !== undefined, 'Created new dynamic membership plan');

const updatedPlan = db.updatePlan('tenant-1', createdPlan.id, { price: 30 });
assert(updatedPlan?.price === 30, 'Successfully updated membership plan price');

const deletedPlan = db.deletePlan('tenant-1', createdPlan.id);
assert(deletedPlan === true, 'Successfully deleted membership plan');

// TEST SUITE 5: Dynamic Member Lifecycle & Freeze
console.log('\n🔹 [5/8] Testing Member CRUD, Freeze & Expiration Engine...');
const plans = db.getPlans('tenant-1');
const monthlyPlan = plans.find((p) => p.durationDays === 30) || plans[0];

const newMember = db.createMember('tenant-1', {
  firstName: 'Kenenisa',
  lastName: 'Bekele',
  phone: '+251 91 122 3344',
  joinDate: new Date().toISOString(),
  planId: monthlyPlan.id,
  dueBalance: 0,
});
assert(newMember.status === 'ACTIVE', 'Newly registered member is marked ACTIVE');
assert(newMember.daysRemaining === monthlyPlan.durationDays, `Calculated exactly ${monthlyPlan.durationDays} days remaining`);

// Test Member Edit
const editedMember = db.updateMember('tenant-1', newMember.id, { phone: '+251 91 777 8888' });
assert(editedMember?.phone === '+251 91 777 8888', 'Successfully edited member phone number');

// Test Member Freeze
const frozenMember = db.freezeMember('tenant-1', newMember.id, 30);
assert(frozenMember?.status === 'FROZEN', 'Successfully froze membership for 30 days');

// Test Member Delete
const deletedMember = db.deleteMember('tenant-1', newMember.id);
assert(deletedMember === true, 'Successfully deleted member');

// TEST SUITE 6: POS Products CRUD & Inventory Depletion
console.log('\n🔹 [6/8] Testing POS Products & Inventory Engine...');
const newProd = db.createProduct('tenant-1', {
  name: 'Electrolyte Hydration Drink',
  category: 'DRINK',
  price: 4.0,
  stock: 20,
  sku: 'DRK-ELE-01',
});
assert(newProd.id !== undefined, 'Created new POS product with initial stock');

const updatedProd = db.updateProduct('tenant-1', newProd.id, { price: 4.5 });
assert(updatedProd?.price === 4.5, 'Successfully updated product price');

// Sell 2 units via POS
db.processSale('tenant-1', [{ productId: newProd.id, quantity: 2 }], 'CASH');
const stockAfterSale = db.getProducts('tenant-1').find((p) => p.id === newProd.id)?.stock;
assert(stockAfterSale === 18, `Stock depleted correctly from 20 to 18 (Current: ${stockAfterSale})`);

db.deleteProduct('tenant-1', newProd.id);
assert(!db.getProducts('tenant-1').some((p) => p.id === newProd.id), 'Successfully deleted POS product');

// TEST SUITE 7: Lockers CRUD
console.log('\n🔹 [7/8] Testing Dynamic Locker Matrix...');
const newLocker = db.createLocker('tenant-1', { number: 'L-99', zone: 'Cardio Zone' });
assert(newLocker.number === 'L-99' && newLocker.status === 'AVAILABLE', 'Created new available locker');

db.assignLocker('tenant-1', 'L-99', 'mem-101', 'Yonas Abraham', '+251 94 455 6677');
const assignedLocker = db.getLockers('tenant-1').find((l) => l.number === 'L-99');
assert(assignedLocker?.status === 'OCCUPIED', 'Locker status changed to OCCUPIED upon assignment');

db.releaseLocker('tenant-1', 'L-99');
const releasedLocker = db.getLockers('tenant-1').find((l) => l.number === 'L-99');
assert(releasedLocker?.status === 'AVAILABLE', 'Locker successfully released back to AVAILABLE');

db.deleteLocker('tenant-1', newLocker.id);
assert(!db.getLockers('tenant-1').some((l) => l.number === 'L-99'), 'Successfully deleted locker from matrix');

// TEST SUITE 8: Check-In, Check-Out & Paper Importer
console.log('\n🔹 [8/8] Testing QR Check-In, Check-Out & Paper Migration...');
const checkinValid = db.processCheckIn('tenant-1', 'QR-AF-1001-YONAS', 'QR_SCAN');
assert(checkinValid.success === true, 'Access GRANTED for valid active QR pass');

const checkinExpired = db.processCheckIn('tenant-1', 'QR-AF-1003-ELIAS', 'QR_SCAN');
assert(checkinExpired.success === false, 'Access DENIED for expired member');

const checkinWarning = db.processCheckIn('tenant-1', 'QR-AF-1002-SARA', 'QR_SCAN');
assert(checkinWarning.status === 'WARNING_EXPIRING', 'Warning triggered for membership expiring in <= 3 days');

// Test Check-Out
const checkoutResult = db.processCheckOut('tenant-1', 'QR-AF-1001-YONAS');
assert(checkoutResult.success === true, 'Successfully processed member check-out and decremented occupancy');

// Test Paper Importer
const samplePaperSheet = `Full Name,Phone,Email,Plan,Start Date,End Date,Amount Paid,Balance Due,Locker
Haile Gebrselassie,+251911555555,haile@olympics.com,Monthly Standard,2026-08-01,2026-08-31,45,0,L-04
Meseret Defar,+251922666666,,3-Month Pro Power,2026-07-15,2026-10-15,120,0,VIP-02`;

const parsed = parsePaperCSV(samplePaperSheet);
assert(parsed.rows.length === 2, 'Parsed exactly 2 member rows from paper log CSV');

const importResult = db.bulkImportPaperMembers('tenant-1', parsed.rows);
assert(importResult.imported === 2, 'Bulk imported 2 paper members into gym database');

const importedMember = db.getMembers('tenant-1', 'Gebrselassie')[0];
assert(importedMember && importedMember.assignedLockerNumber === 'L-04', 'Locker correctly linked to imported member');

console.log('\n======================================================');
console.log(`  RESULTS: ${passed} PASSED | ${failed} FAILED`);
console.log('======================================================\n');

if (failed > 0) process.exit(1);
