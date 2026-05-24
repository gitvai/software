const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.order.updateMany({
    where: { 
      OR: [
        { status: 'Received' },
        { status: 'General' } // Just in case
      ]
    },
    data: { status: 'New' }
  });
  console.log('Fixed statuses for', result.count, 'orders');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
