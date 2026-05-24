const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.pickupReturn.count();
  console.log('PickupReturn count:', count);
}
main().finally(() => prisma.$disconnect());
