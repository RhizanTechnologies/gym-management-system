import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting JSON -> PostgreSQL database migration...');
  const jsonPath = path.join(process.cwd(), 'data', 'gymos-store.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ Could not find data/gymos-store.json');
    process.exit(1);
  }

  const raw = fs.readFileSync(jsonPath, 'utf-8');
  const data = JSON.parse(raw);

  // 1. Tenants
  if (Array.isArray(data.tenants)) {
    console.log(`📦 Migrating ${data.tenants.length} tenants...`);
    for (const t of data.tenants) {
      await prisma.tenant.upsert({
        where: { id: t.id },
        update: {
          name: t.name,
          slug: t.slug || t.id,
          logo: t.logo,
          address: t.address || '',
          phone: t.phone || '',
          email: t.email || '',
          currency: t.currency || 'USD',
          currencySymbol: t.currencySymbol || '$',
          maxCapacity: t.maxCapacity || 150,
          monthlySubscriptionFee: t.monthlySubscriptionFee || 49,
          planTier: t.planTier || 'PRO',
          isActive: t.isActive !== false,
        },
        create: {
          id: t.id,
          name: t.name,
          slug: t.slug || t.id,
          logo: t.logo,
          address: t.address || '',
          phone: t.phone || '',
          email: t.email || '',
          currency: t.currency || 'USD',
          currencySymbol: t.currencySymbol || '$',
          maxCapacity: t.maxCapacity || 150,
          monthlySubscriptionFee: t.monthlySubscriptionFee || 49,
          planTier: t.planTier || 'PRO',
          isActive: t.isActive !== false,
        },
      });
    }
  }

  // 2. Branches
  if (Array.isArray(data.branches)) {
    console.log(`🏢 Migrating ${data.branches.length} branches...`);
    for (const b of data.branches) {
      await prisma.branch.upsert({
        where: { id: b.id },
        update: {
          name: b.name,
          code: b.code || b.id,
          address: b.address || '',
          phone: b.phone || '',
          isMain: !!b.isMain,
          isActive: b.isActive !== false,
        },
        create: {
          id: b.id,
          tenantId: b.tenantId,
          name: b.name,
          code: b.code || b.id,
          address: b.address || '',
          phone: b.phone || '',
          isMain: !!b.isMain,
          isActive: b.isActive !== false,
        },
      });
    }
  }

  // 3. Users
  if (Array.isArray(data.users)) {
    console.log(`👤 Migrating ${data.users.length} users...`);
    for (const u of data.users) {
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
        },
        create: {
          id: u.id,
          tenantId: u.tenantId,
          name: u.name,
          email: u.email,
          role: u.role,
          phone: u.phone,
          password: 'password123',
        },
      });
    }
  }

  // 4. Plans
  if (Array.isArray(data.plans)) {
    console.log(`📋 Migrating ${data.plans.length} plans...`);
    for (const p of data.plans) {
      await prisma.membershipPlan.upsert({
        where: { id: p.id },
        update: {
          name: p.name,
          description: p.description || '',
          durationDays: p.durationDays || 30,
          price: p.price || 0,
          admissionFee: p.admissionFee || 0,
          maxVisitsPerDay: p.maxVisitsPerDay || 1,
          includesClasses: !!p.includesClasses,
          color: p.color || '#3B82F6',
          isActive: p.isActive !== false,
        },
        create: {
          id: p.id,
          tenantId: p.tenantId,
          name: p.name,
          description: p.description || '',
          durationDays: p.durationDays || 30,
          price: p.price || 0,
          admissionFee: p.admissionFee || 0,
          maxVisitsPerDay: p.maxVisitsPerDay || 1,
          includesClasses: !!p.includesClasses,
          color: p.color || '#3B82F6',
          isActive: p.isActive !== false,
        },
      });
    }
  }

  // 5. Members
  if (Array.isArray(data.members)) {
    console.log(`🏋️ Migrating ${data.members.length} members...`);
    for (const m of data.members) {
      await prisma.member.upsert({
        where: { id: m.id },
        update: {
          memberNumber: m.memberNumber,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          gender: m.gender,
          dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
          address: m.address,
          joinDate: m.joinDate ? new Date(m.joinDate) : new Date(),
          emergencyContactName: m.emergencyContactName,
          emergencyContactRelationship: m.emergencyContactRelationship,
          emergencyContactPhone: m.emergencyContactPhone,
          medicalNotes: m.medicalNotes,
          consentGiven: m.consentGiven !== false,
          consentDate: m.consentDate ? new Date(m.consentDate) : null,
          consentPolicyVersion: m.consentPolicyVersion || 'v1.0',
          qrCodeToken: m.qrCodeToken,
          profileImage: m.profileImage,
          photoIdReference: m.photoIdReference,
          notes: m.notes,
          status: m.status || 'ACTIVE',
          currentPlanId: m.currentPlanId,
          currentPlanName: m.currentPlanName,
          subscriptionStart: m.subscriptionStart ? new Date(m.subscriptionStart) : null,
          subscriptionEnd: m.subscriptionEnd ? new Date(m.subscriptionEnd) : null,
          daysRemaining: m.daysRemaining ?? 0,
          dueBalance: m.dueBalance || 0,
          assignedLockerNumber: m.assignedLockerNumber,
        },
        create: {
          id: m.id,
          tenantId: m.tenantId,
          memberNumber: m.memberNumber,
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email,
          phone: m.phone,
          gender: m.gender,
          dateOfBirth: m.dateOfBirth ? new Date(m.dateOfBirth) : null,
          address: m.address,
          joinDate: m.joinDate ? new Date(m.joinDate) : new Date(),
          emergencyContactName: m.emergencyContactName,
          emergencyContactRelationship: m.emergencyContactRelationship,
          emergencyContactPhone: m.emergencyContactPhone,
          medicalNotes: m.medicalNotes,
          consentGiven: m.consentGiven !== false,
          consentDate: m.consentDate ? new Date(m.consentDate) : null,
          consentPolicyVersion: m.consentPolicyVersion || 'v1.0',
          qrCodeToken: m.qrCodeToken,
          profileImage: m.profileImage,
          photoIdReference: m.photoIdReference,
          notes: m.notes,
          status: m.status || 'ACTIVE',
          currentPlanId: m.currentPlanId,
          currentPlanName: m.currentPlanName,
          subscriptionStart: m.subscriptionStart ? new Date(m.subscriptionStart) : null,
          subscriptionEnd: m.subscriptionEnd ? new Date(m.subscriptionEnd) : null,
          daysRemaining: m.daysRemaining ?? 0,
          dueBalance: m.dueBalance || 0,
          assignedLockerNumber: m.assignedLockerNumber,
        },
      });
    }
  }

  // 6. Invoices
  if (Array.isArray(data.invoices)) {
    console.log(`🧾 Migrating ${data.invoices.length} invoices...`);
    for (const inv of data.invoices) {
      await prisma.invoice.upsert({
        where: { id: inv.id },
        update: {
          invoiceNumber: inv.invoiceNumber,
          memberId: inv.memberId,
          memberName: inv.memberName,
          type: inv.type,
          amount: inv.amount,
          paidAmount: inv.paidAmount,
          balance: inv.balance || 0,
          subtotal: inv.subtotal,
          discount: inv.discount || 0,
          discountReason: inv.discountReason,
          tax: inv.tax || 0,
          receiptId: inv.receiptId,
          receiptNumber: inv.receiptNumber,
          recordedBy: inv.recordedBy,
          recordedById: inv.recordedById,
          notes: inv.notes,
          items: inv.items ? JSON.parse(JSON.stringify(inv.items)) : undefined,
          status: inv.status || 'PAID',
          paymentMethod: inv.paymentMethod || 'CASH',
          createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
        },
        create: {
          id: inv.id,
          tenantId: inv.tenantId,
          invoiceNumber: inv.invoiceNumber,
          memberId: inv.memberId,
          memberName: inv.memberName,
          type: inv.type,
          amount: inv.amount,
          paidAmount: inv.paidAmount,
          balance: inv.balance || 0,
          subtotal: inv.subtotal,
          discount: inv.discount || 0,
          discountReason: inv.discountReason,
          tax: inv.tax || 0,
          receiptId: inv.receiptId,
          receiptNumber: inv.receiptNumber,
          recordedBy: inv.recordedBy,
          recordedById: inv.recordedById,
          notes: inv.notes,
          items: inv.items ? JSON.parse(JSON.stringify(inv.items)) : undefined,
          status: inv.status || 'PAID',
          paymentMethod: inv.paymentMethod || 'CASH',
          createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
        },
      });
    }
  }

  // 7. Receipts
  if (Array.isArray(data.receipts)) {
    console.log(`💳 Migrating ${data.receipts.length} receipts...`);
    for (const r of data.receipts) {
      await prisma.receipt.upsert({
        where: { id: r.id },
        update: {
          receiptNumber: r.receiptNumber,
          invoiceId: r.invoiceId,
          invoiceNumber: r.invoiceNumber,
          memberId: r.memberId,
          memberName: r.memberName,
          amount: r.amount,
          amountPaid: r.amountPaid || r.amount,
          paymentMethod: r.paymentMethod || 'CASH',
          paymentReference: r.paymentReference,
          receivedBy: r.receivedBy || 'Staff',
          receivedById: r.receivedById || 'user-staff-1',
          items: r.items ? JSON.parse(JSON.stringify(r.items)) : undefined,
          notes: r.notes,
        },
        create: {
          id: r.id,
          tenantId: r.tenantId,
          receiptNumber: r.receiptNumber,
          invoiceId: r.invoiceId,
          invoiceNumber: r.invoiceNumber,
          memberId: r.memberId,
          memberName: r.memberName,
          amount: r.amount,
          amountPaid: r.amountPaid || r.amount,
          paymentMethod: r.paymentMethod || 'CASH',
          paymentReference: r.paymentReference,
          receivedBy: r.receivedBy || 'Staff',
          receivedById: r.receivedById || 'user-staff-1',
          items: r.items ? JSON.parse(JSON.stringify(r.items)) : undefined,
          notes: r.notes,
          createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        },
      });
    }
  }

  // 8. Lockers
  if (Array.isArray(data.lockers)) {
    console.log(`🔐 Migrating ${data.lockers.length} lockers...`);
    for (const l of data.lockers) {
      await prisma.locker.upsert({
        where: { tenantId_number: { tenantId: l.tenantId, number: l.number } },
        update: {
          status: l.status,
          memberId: l.memberId,
          memberName: l.memberName,
          memberPhone: l.memberPhone,
          zone: l.zone || 'Main',
        },
        create: {
          id: l.id,
          tenantId: l.tenantId,
          number: l.number,
          zone: l.zone || 'Main',
          status: l.status,
          memberId: l.memberId,
          memberName: l.memberName,
          memberPhone: l.memberPhone,
        },
      });
    }
  }

  // 9. Payment Policies
  if (data.paymentPolicies && typeof data.paymentPolicies === 'object') {
    for (const [tenantId, policy] of Object.entries(data.paymentPolicies as Record<string, any>)) {
      await prisma.paymentPolicy.upsert({
        where: { tenantId },
        update: {
          allowPartialActivation: !!policy.allowPartialActivation,
          minInitialPaymentPercent: policy.minInitialPaymentPercent || 50,
          maxAllowedBalance: policy.maxAllowedBalance || 100,
        },
        create: {
          tenantId,
          allowPartialActivation: !!policy.allowPartialActivation,
          minInitialPaymentPercent: policy.minInitialPaymentPercent || 50,
          maxAllowedBalance: policy.maxAllowedBalance || 100,
        },
      });
    }
  }

  console.log('✅ PostgreSQL database migration completed successfully!');
}

migrate()
  .catch((e) => {
    console.error('❌ Migration error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
