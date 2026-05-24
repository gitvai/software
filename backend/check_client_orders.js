const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    // Client 6 is 'ram medical' based on the 00006 code in screenshot
    const orders = await prisma.order.findMany({ 
        where: { clientId: 6 },
        orderBy: { id: 'desc' }
    });
    console.log('Orders for Client 6:', orders.length);
    orders.forEach(o => {
        console.log(`Order ID: ${o.id}, Status: ${o.status}, Amount: ${o.totalAmount}, InvoiceID: ${o.invoiceId}`);
    });
    await prisma.$disconnect();
}
check();
