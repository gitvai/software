const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function repair() {
    console.log('--- Database Repair Tool ---');
    const orphanInvoices = await prisma.invoice.findMany({
        where: { orders: { none: {} }, netAmount: { gt: 0 } },
        include: { client: true }
    });
    
    console.log(`Found ${orphanInvoices.length} orphan invoices with Amount > 0.`);
    
    for (const inv of orphanInvoices) {
        console.log(`\nProcessing Invoice ID: ${inv.id}, Num: ${inv.invoiceNumber}, Amount: ${inv.netAmount}, Client: ${inv.client.name}`);
        
        // Find potential orders
        const potentialOrders = await prisma.order.findMany({
            where: { 
                clientId: inv.clientId,
                invoiceId: null,
                totalAmount: { gt: 0 }
            }
        });
        
        console.log(`  Found ${potentialOrders.length} potential unlinked orders for this client.`);
        
        // Simple case: One order matches the amount exactly
        const matchingSingle = potentialOrders.find(o => o.totalAmount === inv.netAmount);
        if (matchingSingle) {
            console.log(`  MATCH FOUND: Order ID ${matchingSingle.id} matches Amount ${inv.netAmount}. Linking...`);
            await prisma.order.update({
                where: { id: matchingSingle.id },
                data: { invoiceId: inv.id }
            });
            continue;
        }
        
        // Complex case: Sum of multiple orders matches?
        // (Just logging for now to be safe)
        const totalPotential = potentialOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
        if (totalPotential === inv.netAmount) {
            console.log(`  MATCH FOUND: All unlinked orders (${potentialOrders.length}) sum to ${inv.netAmount}. Linking all...`);
            await prisma.order.updateMany({
                where: { id: { in: potentialOrders.map(o => o.id) } },
                data: { invoiceId: inv.id }
            });
        } else {
            console.log(`  No exact match found. Total potential: ${totalPotential}`);
        }
    }
    
    console.log('\n--- Repair Complete ---');
    await prisma.$disconnect();
}

repair().catch(console.error);
