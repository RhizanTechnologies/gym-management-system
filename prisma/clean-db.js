const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
  console.log('🧹 Purging all demo and test records from connected database...');
  try {
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
    console.log('✅ Database is completely clean.');
  } catch (err) {
    console.error('Error during cleanup:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

clean();
