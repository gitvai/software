const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const generateId = (prefix) => `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)}`;

async function main() {
  console.log('Starting data generation...');

  // 1. Create 10 Clients
  console.log('Creating 10 clients...');
  const clients = [];
  for (let i = 0; i < 10; i++) {
    const client = await prisma.client.create({
      data: {
        code: `CL-GEN-${i}-${Date.now()}`,
        name: `Generated Client ${i + 1}`,
        contactPerson: `Contact ${i + 1}`,
        email: `client${i + 1}@example.com`,
        phone: `98765432${i.toString().padStart(2, '0')}`,
        city: randomElement(['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata']),
        status: 'Active',
      }
    });
    clients.push(client);
  }

  // 2. Create 45 Orders
  console.log('Creating 45 orders...');
  const statuses = ['Completed', 'Hold', 'Cancelled', 'Received', 'In Progress'];
  const orders = [];
  for (let i = 0; i < 45; i++) {
    const client = randomElement(clients);
    const status = randomElement(statuses);
    const price = randomInt(500, 5000);
    const order = await prisma.order.create({
      data: {
        orderNumber: `ORD-GEN-${i}-${Date.now()}`,
        clientId: client.id,
        patientName: `Patient ${i + 1}`,
        productType: randomElement(['Crown', 'Bridge', 'Denture', 'Implant']),
        status: status,
        price: price,
        totalAmount: price,
        grossAmount: price,
        netAmount: price,
        holdReason: status === 'Hold' ? 'Waiting for doctor approval' : null,
        cancelledReason: status === 'Cancelled' ? 'Patient cancelled' : null,
        holdFrom: status === 'Hold' ? new Date() : null,
        cancelledOn: status === 'Cancelled' ? new Date() : null,
      }
    });
    orders.push(order);
  }

  // 3. Create 15 Shipment Notes
  console.log('Creating 15 shipment notes...');
  for (let i = 0; i < 15; i++) {
    const client = randomElement(clients);
    await prisma.shipmentNote.create({
      data: {
        noteNumber: `SN-GEN-${i}-${Date.now()}`,
        clientId: client.id,
        type: randomElement(['Final', 'TryIn']),
        status: randomElement(['Created', 'Printed', 'Dispatched', 'Delivered']),
      }
    });
  }

  // 4. Create 20 Invoices
  console.log('Creating 20 invoices...');
  for (let i = 0; i < 20; i++) {
    const client = randomElement(clients);
    const amount = randomInt(1000, 10000);
    await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-GEN-${i}-${Date.now()}`,
        clientId: client.id,
        grossAmount: amount,
        netAmount: amount,
        balanceAmount: amount, // unpaid
        status: 'Unpaid',
      }
    });
  }

  console.log('Data generation completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
