const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const invoiceId = 33; // From my previous test
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { orders: true }
  });
  console.log("Invoice:", JSON.stringify(invoice, null, 2));
  
  const orders = await prisma.order.findMany({
    where: { invoiceId: invoiceId }
  });
  console.log("Orders with invoiceId = 33:", orders.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
