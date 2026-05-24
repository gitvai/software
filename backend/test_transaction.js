const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repro() {
    // 1. Create a dummy order
    const order = await prisma.order.create({
        data: {
            patientName: 'Test Patient',
            totalAmount: 300,
            clientId: 6,
            status: 'Delivered',
            productType: 'Test'
        }
    });
    console.log('Created Order ID:', order.id);

    // 2. Create invoice using the logic from server.js
    const orderIds = [order.id];
    const invoiceData = {
        invoiceNumber: 'TEST-' + Date.now(),
        invoiceDate: new Date(),
        netAmount: 300,
        clientId: 6
    };

    const invoice = await prisma.$transaction(async (tx) => {
        const created = await tx.invoice.create({
            data: { ...invoiceData }
        });
        
        if (orderIds && orderIds.length > 0) {
            const result = await tx.order.updateMany({
                where: { id: { in: orderIds.map(id => Number(id)) } },
                data: { invoiceId: created.id }
            });
            console.log('Update result:', result);
        }
        return created;
    });

    console.log('Created Invoice ID:', invoice.id);

    // 3. Verify link
    const verifiedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
        include: { orders: true }
    });
    console.log('Linked Orders in Verified Invoice:', verifiedInvoice.orders.length);

    // Cleanup
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.invoice.delete({ where: { id: invoice.id } });
    await prisma.$disconnect();
}

repro().catch(console.error);
