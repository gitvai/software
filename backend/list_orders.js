const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listOrders() {
  try {
    const orders = await prisma.order.findMany({
      include: { client: true, shipmentNote: true, invoice: true }
    });
    console.log(JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

listOrders();
