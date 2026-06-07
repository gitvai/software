const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Fixing seeded statuses...');

  await prisma.order.updateMany({
    where: { status: 'Completed' },
    data: { status: 'Complete' }
  });

  await prisma.order.updateMany({
    where: { status: 'Hold' },
    data: { status: 'On Hold' }
  });

  await prisma.order.updateMany({
    where: { status: 'In Progress' },
    data: { status: 'In Production' }
  });

  console.log('Statuses fixed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
