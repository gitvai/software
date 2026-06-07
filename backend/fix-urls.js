const fs = require('fs');
const path = require('path');

const dir = 'c:\\Users\\vaibh_1mm1mpt\\Desktop\\ ';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const oldApi = 'https://software-e857.onrender.com/api';
const newApi = 'http://localhost:5000/api';

files.forEach(f => {
    const filePath = path.join(dir, f);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(oldApi)) {
        content = content.replace(new RegExp(oldApi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newApi);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated ' + f);
    }
});

console.log('Done.');
