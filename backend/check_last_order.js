const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { id: 'desc' }
  });
  console.log("LAST ORDER:", JSON.stringify(lastOrder, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
