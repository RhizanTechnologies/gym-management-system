const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting clean owner-only database seeding for M Fitness and Gym...');

  // 1. Clean existing mock/demo members, checkins, invoices, receipts, and old tenants if any
  try {
    console.log('🧹 Purging any old demo data...');
    await prisma.checkInLog.deleteMany({});
    await prisma.receipt.deleteMany({});
    await prisma.invoice.deleteMany({});
    await prisma.memberSubscription.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.locker.deleteMany({});
    await prisma.pOSSale.deleteMany({});
    await prisma.pOSProduct.deleteMany({});
    await prisma.staffShift.deleteMany({});
    await prisma.expense.deleteMany({});
    await prisma.equipment.deleteMany({});
    await prisma.lead.deleteMany({});
    await prisma.auditEvent.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.membershipPlan.deleteMany({});
    await prisma.tenant.deleteMany({});
    console.log('✓ Old demo records purged cleanly.');
  } catch (err) {
    console.log('Note on purge (tables may be empty or unmigrated):', err.message);
  }

  // 2. Tenant: M Fitness and Gym (Figa, Addis Ababa)
  const tenant = await prisma.tenant.create({
    data: {
      id: 'tenant-1',
      name: 'M Fitness and Gym',
      slug: 'm-fitness-gym',
      logo: '🏋️‍♂️',
      address: 'Figa, Addis Ababa',
      phone: '0961889867',
      email: 'contact@mfitnessgym.com',
      currency: 'ETB',
      currencySymbol: 'ETB',
      maxCapacity: 80,
      monthlySubscriptionFee: 1500.0,
      planTier: 'PRO',
      isActive: true,
    },
  });
  console.log('✓ Seeded Facility:', tenant.name, `(${tenant.address}, Currency: ${tenant.currency})`);

  // 3. User: Strictly the Gym Owner
  const owner = await prisma.user.create({
    data: {
      id: 'user-owner-1',
      tenantId: tenant.id,
      name: 'Dawit Bekele (Owner)',
      email: 'owner@mfitnessgym.com',
      role: 'GYM_OWNER',
      phone: '0961889867',
      password: 'password123',
    },
  });
  console.log('✓ Seeded Gym Owner:', owner.name, `(${owner.email}, Role: ${owner.role})`);

  // 4. Membership Plans (Official ETB Pricing)
  const plans = [
    {
      id: 'plan-day-pass',
      tenantId: tenant.id,
      name: 'Day Pass',
      description: 'Single day access with full facility and locker access',
      durationDays: 1,
      price: 150,
      admissionFee: 0,
      maxVisitsPerDay: 1,
      includesClasses: false,
      color: '#6B7280',
    },
    {
      id: 'plan-monthly',
      tenantId: tenant.id,
      name: 'Monthly Standard',
      description: 'Full monthly gym access, cardio & strength zones',
      durationDays: 30,
      price: 1500,
      admissionFee: 0,
      maxVisitsPerDay: 1,
      includesClasses: false,
      color: '#0F766E',
    },
    {
      id: 'plan-quarterly',
      tenantId: tenant.id,
      name: '3-Month Pro Power',
      description: 'Unlimited gym + group fitness training + dedicated locker',
      durationDays: 90,
      price: 4000,
      admissionFee: 0,
      maxVisitsPerDay: 2,
      includesClasses: true,
      color: '#0284C7',
    },
    {
      id: 'plan-annual',
      tenantId: tenant.id,
      name: 'Annual VIP All-Access',
      description: '365 days full access, trainer consultation, shower & VIP locker',
      durationDays: 365,
      price: 14000,
      admissionFee: 0,
      maxVisitsPerDay: 3,
      includesClasses: true,
      color: '#7C3AED',
    },
  ];

  for (const p of plans) {
    await prisma.membershipPlan.create({ data: p });
  }
  console.log(`✓ Seeded ${plans.length} Clean ETB Membership Plans`);

  // 5. Available Lockers (Clean, all ready for assignment)
  const lockers = [
    { id: 'lock-1', tenantId: tenant.id, number: 'L-01', zone: 'Cardio Zone', status: 'AVAILABLE' },
    { id: 'lock-2', tenantId: tenant.id, number: 'L-02', zone: 'Cardio Zone', status: 'AVAILABLE' },
    { id: 'lock-3', tenantId: tenant.id, number: 'L-03', zone: 'Cardio Zone', status: 'AVAILABLE' },
    { id: 'lock-4', tenantId: tenant.id, number: 'L-04', zone: 'Free Weights', status: 'AVAILABLE' },
    { id: 'lock-5', tenantId: tenant.id, number: 'L-05', zone: 'Free Weights', status: 'AVAILABLE' },
    { id: 'lock-6', tenantId: tenant.id, number: 'L-06', zone: 'Free Weights', status: 'AVAILABLE' },
    { id: 'lock-7', tenantId: tenant.id, number: 'L-07', zone: 'Main Floor', status: 'AVAILABLE' },
    { id: 'lock-8', tenantId: tenant.id, number: 'L-08', zone: 'Main Floor', status: 'AVAILABLE' },
    { id: 'lock-9', tenantId: tenant.id, number: 'L-09', zone: 'VIP Locker Room', status: 'AVAILABLE' },
    { id: 'lock-10', tenantId: tenant.id, number: 'L-10', zone: 'VIP Locker Room', status: 'AVAILABLE' },
  ];

  for (const l of lockers) {
    await prisma.locker.create({ data: l });
  }
  console.log(`✓ Seeded ${lockers.length} Available Lockers (0 Occupied)`);

  // 6. POS Products (Clean Starter Inventory in ETB)
  const products = [
    { id: 'pos-1', tenantId: tenant.id, name: 'Mineral Spring Water 500ml', category: 'DRINK', price: 30, stock: 50, sku: 'DRK-WAT-01' },
    { id: 'pos-2', tenantId: tenant.id, name: 'Energy Drink 250ml', category: 'DRINK', price: 120, stock: 30, sku: 'DRK-ENG-01' },
    { id: 'pos-3', tenantId: tenant.id, name: 'Whey Protein Shake', category: 'SUPPLEMENT', price: 250, stock: 20, sku: 'SUP-WHE-01' },
    { id: 'pos-4', tenantId: tenant.id, name: 'Gym Fitness Towel', category: 'ACCESSORY', price: 350, stock: 25, sku: 'ACC-TWL-01' },
  ];

  for (const pr of products) {
    await prisma.pOSProduct.create({ data: pr });
  }
  console.log(`✓ Seeded ${products.length} Clean Starter POS Products in ETB`);

  console.log('✅ Clean owner-seeded site ready! Zero dummy members or fake invoices seeded.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
