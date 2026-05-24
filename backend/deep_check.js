const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
    const orderCount = await prisma.order.count();
    const invoiceCount = await prisma.invoice.count();
    console.log('Total Orders:', orderCount);
    console.log('Total Invoices:', invoiceCount);
    
    const orphanInvoices = await prisma.invoice.findMany({
        where: { orders: { none: {} } },
        take: 10
    });
    console.log('Invoices with 0 orders:', orphanInvoices.length);
    orphanInvoices.forEach(i => console.log(`ID: ${i.id}, Num: ${i.invoiceNumber}, Amount: ${i.netAmount}`));
    
    await prisma.$disconnect();
}
check();
