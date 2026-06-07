const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'new-order.html');
const replFile = path.join(process.argv[2], 'repl_submit.txt');

let content = fs.readFileSync(file, 'utf8');
let replacement = fs.readFileSync(replFile, 'utf8');

const regex = /        async function submitOrder\(\) \{[\s\S]*?try \{\n                const res = await fetch/;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Replaced submitOrder.");