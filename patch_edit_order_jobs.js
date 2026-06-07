const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'edit-order.html');

let content = fs.readFileSync(file, 'utf8');

const search = `                const res = await fetch(\`\${API_BASE}/orders/\${id}\`);
                const order = await res.json();

                // Populate client and step`;

const replace = `                const res = await fetch(\`\${API_BASE}/orders/\${id}\`);
                const order = await res.json();
                
                // Map fields from jobs[0] if they exist to support the new schema
                if (order.jobs && order.jobs.length > 0 && (!order.productName || order.productName === '')) {
                    const j = order.jobs[0];
                    order.productName = j.productName;
                    order.productType = j.productType;
                    order.units = j.units;
                    order.unitRate = j.unitRate;
                    order.teethSelection = j.teethSelection;
                    order.shade1 = j.shade1;
                    order.shade2 = j.shade2;
                    order.shade3 = j.shade3;
                    order.shadeNotes = j.shadeNotes;
                }

                // Populate client and step`;

content = content.replace(search, replace);
fs.writeFileSync(file, content, 'utf8');
console.log("Patched edit-order.html");
