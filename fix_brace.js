const fs = require('fs');
const path = require('path');

const file = path.join(process.argv[2], 'edit-order.html');
let content = fs.readFileSync(file, 'utf8');

const target = `              } else {
                  wrapper.style.display = 'none';
                  container.innerHTML = '';
              }
          }
          }`;

const replacement = `              } else {
                  wrapper.style.display = 'none';
                  container.innerHTML = '';
              }
          }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed extra brace in edit-order.html');
} else {
    console.log('Target not found in edit-order.html');
}
