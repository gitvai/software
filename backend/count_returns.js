const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.pickupReturn.count()
  .then(c => console.log('PickupReturn count:', c))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
