const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding for GymOS...');

  // 1. Tenants
  const tenant1 = await prisma.tenant.upsert({
    where: { slug: 'apex-fitness' },
    update: {},
    create: {
      id: 'tenant-1',
      name: 'Apex Fitness Hub',
      slug: 'apex-fitness',
      logo: '🏋️‍♂️',
      address: 'Bole Medhanealem Road, Suite 400',
      phone: '+251 91 122 3344',
      email: 'contact@apexfitness.com',
      currency: 'USD',
      currencySymbol: '$',
      maxCapacity: 80,
      monthlySubscriptionFee: 99.0,
      planTier: 'PRO',
      isActive: true,
    },
  });

  const tenant2 = await prisma.tenant.upsert({
    where: { slug: 'iron-forge' },
    update: {},
    create: {
      id: 'tenant-2',
      name: 'Iron Forge Gym & Spa',
      slug: 'iron-forge',
      logo: '⚡',
      address: 'Downtown Commercial Center, 2nd Floor',
      phone: '+251 92 334 4556',
      email: 'info@ironforge.com',
      currency: 'USD',
      currencySymbol: '$',
      maxCapacity: 120,
      monthlySubscriptionFee: 149.0,
      planTier: 'ENTERPRISE',
      isActive: true,
    },
  });

  console.log('✓ Seeded Tenants:', tenant1.name, ',', tenant2.name);

  // 2. Users
  const users = [
    {
      id: 'user-super',
      tenantId: 'tenant-1',
      name: 'Platform Super Admin',
      email: 'superadmin@gymos.io',
      role: 'SUPER_ADMIN',
    },
    {
      id: 'user-owner-1',
      tenantId: 'tenant-1',
      name: 'Dawit Bekele (Owner)',
      email: 'dawit@apexfitness.com',
      role: 'GYM_OWNER',
      phone: '+251 91 122 3344',
    },
    {
      id: 'user-staff-1',
      tenantId: 'tenant-1',
      name: 'Selam Tesfaye (Receptionist)',
      email: 'selam@apexfitness.com',
      role: 'RECEPTIONIST',
      phone: '+251 91 223 4455',
    },
    {
      id: 'user-trainer-1',
      tenantId: 'tenant-1',
      name: 'Coach Marcus',
      email: 'marcus@apexfitness.com',
      role: 'TRAINER',
      phone: '+251 91 334 5566',
    },
    {
      id: 'user-member-1',
      tenantId: 'tenant-1',
      name: 'Yonas Abraham',
      email: 'yonas@gmail.com',
      role: 'MEMBER',
      phone: '+251 94 455 6677',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { id: u.id },
      update: {},
      create: {
        id: u.id,
        tenantId: u.tenantId,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone || null,
        password: 'password123',
      },
    });
  }
  console.log(`✓ Seeded ${users.length} Users`);

  // 3. Membership Plans
  const plans = [
    {
      id: 'plan-1-day',
      tenantId: 'tenant-1',
      name: 'Day Pass',
      description: 'Single day access with locker and shower access',
      durationDays: 1,
      price: 10,
      admissionFee: 0,
      maxVisitsPerDay: 1,
      includesClasses: false,
      color: '#6B7280',
    },
    {
      id: 'plan-1-monthly',
      tenantId: 'tenant-1',
      name: 'Monthly Standard',
      description: 'Full gym access, cardio & strength zones',
      durationDays: 30,
      price: 45,
      admissionFee: 15,
      maxVisitsPerDay: 1,
      includesClasses: false,
      color: '#3B82F6',
    },
    {
      id: 'plan-1-quarterly',
      tenantId: 'tenant-1',
      name: '3-Month Pro Power',
      description: 'Unlimited gym + group fitness classes + free locker',
      durationDays: 90,
      price: 120,
      admissionFee: 0,
      maxVisitsPerDay: 2,
      includesClasses: true,
      color: '#10B981',
    },
    {
      id: 'plan-1-annual',
      tenantId: 'tenant-1',
      name: 'Annual VIP All-Access',
      description: 'Full gym, classes, sauna, personal trainer assessment & free towel',
      durationDays: 365,
      price: 420,
      admissionFee: 0,
      maxVisitsPerDay: 3,
      includesClasses: true,
      color: '#8B5CF6',
    },
    {
      id: 'plan-2-monthly',
      tenantId: 'tenant-2',
      name: 'Iron Standard',
      description: 'Monthly unlimited lifting',
      durationDays: 30,
      price: 50,
      admissionFee: 10,
      maxVisitsPerDay: 1,
      includesClasses: false,
      color: '#F59E0B',
    },
  ];

  for (const p of plans) {
    await prisma.membershipPlan.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }
  console.log(`✓ Seeded ${plans.length} Membership Plans`);

  // 4. Members
  const members = [
    {
      id: 'mem-101',
      tenantId: 'tenant-1',
      memberNumber: 'AF-1001',
      firstName: 'Yonas',
      lastName: 'Abraham',
      email: 'yonas@gmail.com',
      phone: '+251 94 455 6677',
      gender: 'MALE',
      dateOfBirth: new Date('1995-04-12'),
      emergencyContactName: 'Helen Abraham',
      emergencyContactPhone: '+251 91 100 2233',
      medicalNotes: 'None',
      qrCodeToken: 'QR-AF-1001-YONAS',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      dueBalance: 0,
      assignedLockerNumber: 'L-07',
    },
    {
      id: 'mem-102',
      tenantId: 'tenant-1',
      memberNumber: 'AF-1002',
      firstName: 'Sara',
      lastName: 'Girma',
      email: 'sara.girma@outlook.com',
      phone: '+251 91 234 5678',
      gender: 'FEMALE',
      dateOfBirth: new Date('1998-09-20'),
      emergencyContactName: 'Kidus Girma',
      emergencyContactPhone: '+251 92 233 4455',
      qrCodeToken: 'QR-AF-1002-SARA',
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      status: 'EXPIRING_SOON',
      dueBalance: 0,
      assignedLockerNumber: 'L-12',
    },
    {
      id: 'mem-103',
      tenantId: 'tenant-1',
      memberNumber: 'AF-1003',
      firstName: 'Elias',
      lastName: 'Tadesse',
      email: 'elias.t@yahoo.com',
      phone: '+251 93 345 6789',
      gender: 'MALE',
      qrCodeToken: 'QR-AF-1003-ELIAS',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      status: 'EXPIRED',
      dueBalance: 25,
    },
    {
      id: 'mem-104',
      tenantId: 'tenant-1',
      memberNumber: 'AF-1004',
      firstName: 'Bethlehem',
      lastName: 'Haile',
      email: 'betty.haile@gmail.com',
      phone: '+251 94 567 8901',
      gender: 'FEMALE',
      qrCodeToken: 'QR-AF-1004-BETTY',
      profileImage: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      dueBalance: 0,
      assignedLockerNumber: 'VIP-01',
    },
  ];

  for (const m of members) {
    await prisma.member.upsert({
      where: { id: m.id },
      update: {},
      create: m,
    });
  }
  console.log(`✓ Seeded ${members.length} Members`);

  // 5. Lockers
  const lockers = [
    { id: 'lock-1', tenantId: 'tenant-1', number: 'L-01', zone: 'Cardio Zone', status: 'AVAILABLE' },
    { id: 'lock-2', tenantId: 'tenant-1', number: 'L-02', zone: 'Cardio Zone', status: 'AVAILABLE' },
    { id: 'lock-3', tenantId: 'tenant-1', number: 'L-03', zone: 'Cardio Zone', status: 'MAINTENANCE' },
    { id: 'lock-4', tenantId: 'tenant-1', number: 'L-04', zone: 'Free Weights', status: 'AVAILABLE' },
    { id: 'lock-5', tenantId: 'tenant-1', number: 'L-05', zone: 'Free Weights', status: 'AVAILABLE' },
    { id: 'lock-6', tenantId: 'tenant-1', number: 'L-06', zone: 'Free Weights', status: 'AVAILABLE' },
    {
      id: 'lock-7',
      tenantId: 'tenant-1',
      number: 'L-07',
      zone: 'Free Weights',
      status: 'OCCUPIED',
      memberId: 'mem-101',
      memberName: 'Yonas Abraham',
      memberPhone: '+251 94 455 6677',
      assignedAt: new Date(Date.now() - 30 * 86400000),
      expiresAt: new Date(Date.now() + 60 * 86400000),
    },
    {
      id: 'lock-8',
      tenantId: 'tenant-1',
      number: 'L-12',
      zone: 'Locker Room A',
      status: 'OCCUPIED',
      memberId: 'mem-102',
      memberName: 'Sara Girma',
      memberPhone: '+251 91 234 5678',
      assignedAt: new Date(Date.now() - 28 * 86400000),
      expiresAt: new Date(Date.now() + 2 * 86400000),
    },
    {
      id: 'lock-9',
      tenantId: 'tenant-1',
      number: 'VIP-01',
      zone: 'VIP Lounge',
      status: 'OCCUPIED',
      memberId: 'mem-104',
      memberName: 'Bethlehem Haile',
      memberPhone: '+251 94 567 8901',
      assignedAt: new Date(Date.now() - 10 * 86400000),
      expiresAt: new Date(Date.now() + 355 * 86400000),
    },
    { id: 'lock-10', tenantId: 'tenant-1', number: 'VIP-02', zone: 'VIP Lounge', status: 'AVAILABLE' },
  ];

  for (const l of lockers) {
    await prisma.locker.upsert({
      where: {
        tenantId_number: {
          tenantId: l.tenantId,
          number: l.number,
        },
      },
      update: {},
      create: l,
    });
  }
  console.log(`✓ Seeded ${lockers.length} Lockers`);

  // 6. POS Products
  const products = [
    { id: 'pos-1', tenantId: 'tenant-1', name: 'Mineral Spring Water 500ml', category: 'DRINK', price: 1.5, stock: 48, sku: 'DRK-WAT-01' },
    { id: 'pos-2', tenantId: 'tenant-1', name: 'Optimum Nutrition Gold Whey (Vanilla)', category: 'SUPPLEMENT', price: 65.0, stock: 12, sku: 'SUP-WHE-01' },
    { id: 'pos-3', tenantId: 'tenant-1', name: 'Creatine Monohydrate 300g', category: 'SUPPLEMENT', price: 28.0, stock: 15, sku: 'SUP-CRE-01' },
    { id: 'pos-4', tenantId: 'tenant-1', name: 'Monster Energy Ultra (Sugar Free)', category: 'DRINK', price: 3.5, stock: 32, sku: 'DRK-ENG-01' },
    { id: 'pos-5', tenantId: 'tenant-1', name: 'Microfiber Gym Towel (Apex Branded)', category: 'ACCESSORY', price: 12.0, stock: 25, sku: 'ACC-TWL-01' },
    { id: 'pos-6', tenantId: 'tenant-1', name: '1-on-1 Personal Trainer Session (1 hr)', category: 'TRAINING', price: 25.0, stock: 999, sku: 'SRV-PT-01' },
  ];

  for (const p of products) {
    await prisma.pOSProduct.upsert({
      where: { id: p.id },
      update: {},
      create: p,
    });
  }
  console.log(`✓ Seeded ${products.length} POS Products`);

  console.log('🚀 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
