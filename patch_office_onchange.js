const fs = require('fs');
const path = require('path');

const file = path.join(process.argv[2], 'office.html');
let content = fs.readFileSync(file, 'utf8');

// Replace all occurrences of oninput="updateInwardItem with onchange="updateInwardItem
content = content.replace(/oninput="updateInwardItem/g, 'onchange="updateInwardItem');

// Replace all occurrences of oninput="updateOutwardItem with onchange="updateOutwardItem
content = content.replace(/oninput="updateOutwardItem/g, 'onchange="updateOutwardItem');

fs.writeFileSync(file, content, 'utf8');
console.log("Patched office.html to use onchange instead of oninput");
