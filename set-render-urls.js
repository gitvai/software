const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
const files = fs.readdirSync(dir);

const old_api_1 = "https://software-e857.onrender.com/api";
const old_api_2 = "const API_BASE = 'https://software-e857.onrender.com/api';";
const new_api = "https://software-e857.onrender.com/api";
const new_api_2 = "const API_BASE = 'https://software-e857.onrender.com/api';";

for (const file of files) {
    if (file.endsWith('.html') || file.endsWith('.js')) {
        const filePath = path.join(dir, file);
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        if (content.includes(old_api_1)) {
            content = content.split(old_api_1).join(new_api);
            modified = true;
        }
        if (content.includes(old_api_2)) {
            content = content.split(old_api_2).join(new_api_2);
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log("Updated", file);
        }
    }
}
console.log("Done");