const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'new-order.html');
const replFile = path.join(process.argv[2], 'repl2.txt');

let content = fs.readFileSync(file, 'utf8');
let replacement = fs.readFileSync(replFile, 'utf8');

const regex = /            if \(teethArea\) teethArea\.style\.display = 'block';[\s\S]*?const nameDisplay = document\.getElementById\('selected-product-name'\);/;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Replaced block 2.");