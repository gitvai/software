const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Adding columns to Material table...');
    await prisma.$executeRawUnsafe(`ALTER TABLE Material ADD COLUMN code TEXT`);
  } catch (e) { console.log('code column might already exist or error:', e.message); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE Material ADD COLUMN reorderLevel REAL DEFAULT 0`);
  } catch (e) { console.log('reorderLevel column might already exist or error:', e.message); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE Material ADD COLUMN expired REAL DEFAULT 0`);
  } catch (e) { console.log('expired column might already exist or error:', e.message); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE Material ADD COLUMN expiring REAL DEFAULT 0`);
  } catch (e) { console.log('expiring column might already exist or error:', e.message); }

  try {
    console.log('Creating InventoryTransaction table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS InventoryTransaction (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        materialId INTEGER NOT NULL,
        quantity REAL NOT NULL,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        supplier TEXT,
        docNumber TEXT,
        notes TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (materialId) REFERENCES Material(id)
      )
    `);
  } catch (e) { console.log('Error creating table:', e.message); }

  console.log('Manual migration completed!');
}

migrate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
