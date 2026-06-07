const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const files = fs.readdirSync(dir);

const searchPattern = /const API_BASE = (window\.location\.protocol === 'file:' \? 'https:\/\/software-e857\.onrender\.com\/api' : '\/api');/g;
const replaceString = "const API_BASE = 'https://software-e857.onrender.com/api';";

for (const file of files) {
    if (file.endsWith('.html') || file.endsWith('.js')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        if (searchPattern.test(content)) {
            content = content.replace(searchPattern, replaceString);
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated", file);
        }
    }
}
console.log("Done");