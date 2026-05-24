const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Find an order that doesn't have an invoice
  const order = await prisma.order.findFirst({
    where: { invoiceId: null }
  });
  if (!order) {
    console.log("No orders without invoice found.");
    return;
  }
  console.log("Found Order ID:", order.id);

  // 2. Create an invoice for this order
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: 'TEST-' + Date.now(),
      clientId: order.clientId,
      balanceAmount: 0,
      orders: { connect: [{ id: order.id }] }
    }
  });
  console.log("Created Invoice ID:", invoice.id);

  // 3. Fetch it back
  const fetched = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: { orders: true }
  });
  console.log("Fetched Invoice Orders Count:", fetched.orders.length);
  
  // 4. Check order directly
  const fetchedOrder = await prisma.order.findUnique({
    where: { id: order.id }
  });
  console.log("Order's invoiceId:", fetchedOrder.invoiceId);
}

main().catch(console.error).finally(() => prisma.$disconnect());
