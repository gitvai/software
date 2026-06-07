const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'new-order.html');

let content = fs.readFileSync(file, 'utf8');

const regex = /                slab2Units: isSlabActive \? Math.max\(0, selectedTeeth.length - 1\) : null\n            \};\n\n            try \{/;

const replacement = \                slab2Units: isSlabActive ? Math.max(0, selectedTeeth.length - 1) : null
            };

            if (orderJobs && orderJobs.length > 0) {
                data.jobs = orderJobs.map(j => ({
                    productName: j.product,
                    productType: j.productType || 'General',
                    teethSelection: j.teeth ? j.teeth.join(',') : '',
                    units: j.units,
                    price: j.rate,
                    totalAmount: j.total,
                    slab1Rate: j.slab1Rate,
                    slab2Rate: j.slab2Rate,
                    slab1Units: j.slab1Units,
                    slab2Units: j.slab2Units
                }));
                // Calculate total price by summing jobs
                data.price = data.jobs.reduce((sum, j) => sum + parseFloat(j.price || 0), 0);
                data.totalAmount = data.jobs.reduce((sum, j) => sum + parseFloat(j.totalAmount || 0), 0);
            }

            try {\;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Patched submitOrder in new-order.html");