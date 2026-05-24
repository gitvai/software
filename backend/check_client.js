const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClient(id) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: Number(id) },
      include: { 
        orders: true, 
        shipmentNotes: { include: { orders: true } }, 
        invoices: true, 
        receipts: true 
      }
    });
    console.log(JSON.stringify(client, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkClient(process.argv[2] || 5);
