const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    select: { id: true, status: true, patientName: true }
  });
  console.log(orders);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
