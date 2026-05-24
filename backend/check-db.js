const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clientsCount = await prisma.client.count();
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const invoicesCount = await prisma.invoice.count();

  console.log('--- DATABASE STATUS ---');
  console.log('Clients:', clientsCount);
  console.log('Orders:', ordersCount);
  console.log('Products:', productsCount);
  console.log('Invoices:', invoicesCount);
  
  if (ordersCount > 0) {
    const latestOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { id: 'desc' },
      include: { client: true }
    });
    console.log('\nLatest 5 Orders:');
    latestOrders.forEach(o => {
      console.log(`ID: ${o.id}, Patient: ${o.patientName}, Client: ${o.client?.name}, Date: ${o.createdAt}`);
    });
  }
}

main().finally(() => prisma.$disconnect());
