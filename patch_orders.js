const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'orders.html');

let content = fs.readFileSync(file, 'utf8');

// First replace for openEditOrderModal
content = content.replace(/                  if \(slabsContainer\) \{\n                      slabsContainer.style.display = isSlabProduct \? 'block' : 'none';\n                  \}/g, \                  if (slabsContainer) {
                      slabsContainer.style.display = isSlabProduct ? 'block' : 'none';
                  }
                  const customUnitContainer = document.getElementById('eo-custom-unit-text-container');
                  if (customUnitContainer) {
                      customUnitContainer.style.display = isSlabProduct ? 'block' : 'none';
                  }\);

fs.writeFileSync(file, content, 'utf8');
console.log("Patched orders.html isSlabProduct display logic.");