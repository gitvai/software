const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const orders = await prisma.order.findMany({
        where: {
            productName: { not: null }
        }
    });
    
    let count = 0;
    for (const order of orders) {
        // Check if jobs already exist for this order
        const existingJobs = await prisma.orderJob.findMany({ where: { orderId: order.id } });
        if (existingJobs.length > 0) continue;
        
        await prisma.orderJob.create({
            data: {
                orderId: order.id,
                productType: order.productType || 'General',
                productName: order.productName,
                material: order.material,
                teethSelection: order.teethSelection,
                shade1: order.shade1,
                shade2: order.shade2,
                shade3: order.shade3,
                shadeNotes: order.shadeNotes,
                stumpShade: order.stumpShade,
                units: order.units,
                price: order.price,
                totalAmount: order.totalAmount,
                slab1Rate: order.slab1Rate,
                slab2Rate: order.slab2Rate,
                slab1Units: order.slab1Units,
                slab2Units: order.slab2Units,
            }
        });
        count++;
    }
    console.log('Migrated ' + count + ' orders to OrderJob table');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());