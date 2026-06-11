const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runMigration() {
  console.log('--- Starting Invoice Number Cleanup Migration ---');
  
  // 1. Fetch all invoices from the database
  const invoices = await prisma.invoice.findMany();
  console.log(`Total invoices found: ${invoices.length}`);
  
  // 2. Identify existing valid 4-5 digit numbers
  const existingValidNums = new Set(
    invoices
      .map(i => parseInt(i.invoiceNumber, 10))
      .filter(num => !isNaN(num) && num >= 1000 && num <= 99999 && /^\d{4,5}$/.test(num.toString()))
  );
  
  console.log(`Existing valid 4-5 digit invoice numbers:`, Array.from(existingValidNums));

  // Helper to generate the next unique 4-5 digit number
  let lastUsedCandidate = 1000;
  function getNextUniqueNumber() {
    let candidate = lastUsedCandidate;
    while (candidate <= 99999) {
      if (!existingValidNums.has(candidate)) {
        existingValidNums.add(candidate);
        lastUsedCandidate = candidate;
        return candidate.toString();
      }
      candidate++;
    }
    throw new Error('No more unique 4-5 digit invoice numbers available!');
  }

  // 3. Find non-conforming invoices and fix them
  let updatedCount = 0;
  for (const inv of invoices) {
    const isConforming = /^\d{4,5}$/.test(inv.invoiceNumber);
    const numValue = parseInt(inv.invoiceNumber, 10);
    const isValidRange = !isNaN(numValue) && numValue >= 1000 && numValue <= 99999;
    
    if (!isConforming || !isValidRange) {
      const newInvoiceNumber = getNextUniqueNumber();
      console.log(`Updating Invoice ID ${inv.id}: "${inv.invoiceNumber}" -> "${newInvoiceNumber}"`);
      
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { invoiceNumber: newInvoiceNumber }
      });
      updatedCount++;
    }
  }
  
  console.log(`--- Migration Complete! Updated ${updatedCount} invoices. ---`);
  await prisma.$disconnect();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
