const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  const columns = [
    { name: 'defaultDeliveryAgent', type: 'TEXT' },
    { name: 'collectionCentre', type: 'TEXT' },
    { name: 'regularVisits', type: 'TEXT' },
    { name: 'taxExemption', type: 'BOOLEAN DEFAULT 0' },
    { name: 'isDentalLab', type: 'BOOLEAN DEFAULT 0' },
    { name: 'billTo', type: 'TEXT DEFAULT "Self"' }
  ];

  for (const col of columns) {
    try {
      console.log(`Adding column ${col.name} to Client table...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE Client ADD COLUMN ${col.name} ${col.type}`);
    } catch (e) {
      console.log(`${col.name} column might already exist or error:`, e.message);
    }
  }

  console.log('Client migration completed!');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
