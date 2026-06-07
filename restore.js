const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'new-order.html');
const replFile = path.join(process.argv[2], 'replacement.txt');

let content = fs.readFileSync(file, 'utf8');
let replacement = fs.readFileSync(replFile, 'utf8');

const regex = /        function addNoteToOrder\(type\) \{[\s\S]*?function cancelTeethSelection\(\) \{/;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Restored completely.");