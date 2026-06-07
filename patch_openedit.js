const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'orders.html');

let content = fs.readFileSync(file, 'utf8');

const regex = /                if \(order\.teethSelection\) \{\n                    const teeth = order\.teethSelection\.split\(\',\'\)\.map\(t => t\.trim\(\)\);/;

const replacement = \                if (order.teethSelection) {
                    const customUnitTextEl = document.getElementById('eo-custom-unit-text');
                    if (customUnitTextEl) customUnitTextEl.value = order.teethSelection;
                    const teeth = order.teethSelection.split(',').map(t => t.trim());\;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Patched openEditModal to load teethSelection into custom text.");