const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'orders.html');

let content = fs.readFileSync(file, 'utf8');

const search = `                try {
                    const res = await fetch(\`\${API_BASE}/orders/\${id}\`);
                    const order = await res.json();`;
const replace = `                try {
                    const res = await fetch(\`\${API_BASE}/orders/\${id}\`);
                    const order = await res.json();
                    
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
                    }`;

content = content.replace(search, replace);
fs.writeFileSync(file, content, 'utf8');
console.log("Patched orders.html");