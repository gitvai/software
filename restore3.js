const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'new-order.html');
const replFile = path.join(process.argv[2], 'repl3.txt');

let content = fs.readFileSync(file, 'utf8');
let replacement = fs.readFileSync(replFile, 'utf8');

const regex = /        function saveAndAddNewJob\(\) \{[\s\S]*?console\.log\("Current Jobs:", orderJobs\);\n        \}/;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Replaced saveAndAddNewJob block.");