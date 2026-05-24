const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const counts = await prisma.order.groupBy({ by: ['status'], _count: true });
  console.log('Statuses in DB:', JSON.stringify(counts));
}
main().finally(() => prisma.$disconnect());
