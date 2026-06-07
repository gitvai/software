const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'backend', 'server.js');

let content = fs.readFileSync(file, 'utf8');

const search = `      const order = await prisma.order.update({
        where: { id: Number(req.params.id) },
        data: cleanData
      });
      res.json(order);`;
const replace = `      const order = await prisma.order.update({
        where: { id: Number(req.params.id) },
        data: cleanData
      });
      
      // Update the first job to keep it in sync with the order's flat fields
      try {
        const existingJobs = await prisma.orderJob.findMany({ where: { orderId: order.id } });
        if (existingJobs.length > 0) {
           await prisma.orderJob.update({
               where: { id: existingJobs[0].id },
               data: {
                   productName: cleanData.productName !== undefined ? cleanData.productName : undefined,
                   productType: cleanData.productType !== undefined ? cleanData.productType : undefined,
                   units: cleanData.units !== undefined ? cleanData.units : undefined,
                   unitRate: cleanData.unitRate !== undefined ? cleanData.unitRate : undefined,
                   teethSelection: cleanData.teethSelection !== undefined ? cleanData.teethSelection : undefined,
                   shade1: cleanData.shade1 !== undefined ? cleanData.shade1 : undefined,
                   shade2: cleanData.shade2 !== undefined ? cleanData.shade2 : undefined,
                   shade3: cleanData.shade3 !== undefined ? cleanData.shade3 : undefined,
                   shadeNotes: cleanData.shadeNotes !== undefined ? cleanData.shadeNotes : undefined
               }
           });
        }
      } catch (e) {
          console.error("Error updating synced job:", e);
      }
      
      res.json(order);`;

content = content.replace(search, replace);
fs.writeFileSync(file, content, 'utf8');
console.log("Patched server.js");
