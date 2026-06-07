const fs = require('fs');
const path = require('path');

const file = path.join(process.argv[2], 'edit-order.html');
let content = fs.readFileSync(file, 'utf8');

const regex = /wrapper\.style\.display = 'none';\s*container\.innerHTML = '';\s*\}\s*\}\s*\}/g;
const replacement = `wrapper.style.display = 'none';
                container.innerHTML = '';
            }
        }`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed extra brace in edit-order.html with regex');
} else {
    console.log('Target not found in edit-order.html');
}
