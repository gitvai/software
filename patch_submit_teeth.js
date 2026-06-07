const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'new-order.html');

let content = fs.readFileSync(file, 'utf8');

const regex = /                  teethSelection: document\.getElementById\('selected-teeth-list'\)\.value,/;

const replacement = \                  teethSelection: (document.getElementById('custom-unit-text-container') && document.getElementById('custom-unit-text-container').style.display === 'block' && document.getElementById('custom-unit-text').value) ? document.getElementById('custom-unit-text').value : document.getElementById('selected-teeth-list').value,\;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Patched submitOrder fallback teeth.");