const fs = require('fs');
const path = require('path');

function patchFile(fileName) {
    const file = path.join(process.argv[2], fileName);
    let content = fs.readFileSync(file, 'utf8');

    // 1. Fix updateTeethUI to preserve manual unit count
    // In new-order.html and edit-order.html, look for the else block setting unitCount = selectedTeeth.length;
    const regex1 = /} else \{\s*unitCount = selectedTeeth\.length;\s*document\.getElementById\('unit-count'\)\.value = unitCount;\s*\}/g;
    
    content = content.replace(regex1, `} else {
                  if (selectedTeeth.length > 0) {
                      unitCount = selectedTeeth.length;
                  } else {
                      unitCount = parseInt(document.getElementById('unit-count').value) || 0;
                  }
                  document.getElementById('unit-count').value = unitCount;
              }`);

    // 2. Fix saveAndAddNewJob logic
    content = content.replace(
        /slab1Units:\s*isSlabActive\s*\?\s*Math\.min\(selectedTeeth\.length,\s*1\)\s*:\s*null/g,
        "slab1Units: isSlabActive ? Math.min(parseInt(document.getElementById('unit-count').value)||0, 1) : null"
    );
    content = content.replace(
        /slab2Units:\s*isSlabActive\s*\?\s*Math\.max\(0,\s*selectedTeeth\.length\s*-\s*1\)\s*:\s*null/g,
        "slab2Units: isSlabActive ? Math.max(0, (parseInt(document.getElementById('unit-count').value)||0) - 1) : null"
    );

    // 3. Fix saveOrderEdit logic
    content = content.replace(
        /slab1Units:\s*\(document\.getElementById\('slabs-container'\).*?Math\.min\(selectedTeeth\.length,\s*1\)\s*:\s*null/g,
        "slab1Units: (document.getElementById('slabs-container') && document.getElementById('slabs-container').style.display === 'block') ? Math.min(parseInt(document.getElementById('unit-count').value)||0, 1) : null"
    );
    content = content.replace(
        /slab2Units:\s*\(document\.getElementById\('slabs-container'\).*?Math\.max\(0,\s*selectedTeeth\.length\s*-\s*1\)\s*:\s*null/g,
        "slab2Units: (document.getElementById('slabs-container') && document.getElementById('slabs-container').style.display === 'block') ? Math.max(0, (parseInt(document.getElementById('unit-count').value)||0) - 1) : null"
    );

    // 4. Ensure loadOrderData populates unit-count
    content = content.replace(
        /order\.units\s*=\s*j\.units;/g,
        "order.units = j.units;\n                    if (document.getElementById('unit-count')) document.getElementById('unit-count').value = j.units || 0;"
    );

    fs.writeFileSync(file, content, 'utf8');
}

patchFile('new-order.html');
patchFile('edit-order.html');
console.log("Patched both files for manual units using regex");