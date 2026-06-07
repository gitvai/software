const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'orders.html');

let content = fs.readFileSync(file, 'utf8');

const regex = /                  doctorName: document\.getElementById\('eo-sub-doctor'\) \? \n?document\.getElementById\('eo-sub-doctor'\)\.value : null,\n                  teethSelection: selectedTeeth\.join\(\', \'\),/;

const replacement = \                  doctorName: document.getElementById('eo-sub-doctor') ? document.getElementById('eo-sub-doctor').value : null,
                  teethSelection: (document.getElementById('eo-custom-unit-text-container') && document.getElementById('eo-custom-unit-text-container').style.display === 'block' && document.getElementById('eo-custom-unit-text').value) ? document.getElementById('eo-custom-unit-text').value : selectedTeeth.join(', '),\;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Patched saveOrderEdit teeth selection fallback.");