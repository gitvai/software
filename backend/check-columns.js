const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const info = await prisma.$queryRawUnsafe(`PRAGMA table_info(Client)`);
    console.log(JSON.stringify(info, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
