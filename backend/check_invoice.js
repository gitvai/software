const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    const inv = await prisma.invoice.findFirst({ 
        where: { invoiceNumber: 'INV-544564-14' }, 
        include: { orders: true } 
    });
    console.log('Invoice Found:', !!inv);
    if (inv) {
        console.log('Invoice ID:', inv.id);
        console.log('Linked Orders Count (via relation):', inv.orders.length);
        const manualOrders = await prisma.order.findMany({ where: { invoiceId: inv.id } });
        console.log('Manual Orders Found (where invoiceId=' + inv.id + '):', manualOrders.length);
        
        if (manualOrders.length > 0) {
            console.log('First Manual Order:', JSON.stringify(manualOrders[0], null, 2));
        }
    } else {
        const all = await prisma.invoice.findMany({ take: 5 });
        console.log('Recent Invoices:', all.map(i => i.invoiceNumber));
    }
    await prisma.$disconnect();
}
check();
