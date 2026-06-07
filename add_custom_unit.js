const fs = require('fs');
const path = require('path');

const fileEdit = path.join(process.argv[2], 'edit-order.html');
let contentEdit = fs.readFileSync(fileEdit, 'utf8');

// Insert custom unit text container after slabs-container
const searchHtml = `                              <div style="font-weight:bold; font-size:14px; color:#b91c1c; border-top:1px dashed #ccc; padding-top:8px;">\r
                                  Total Slab Charge: <span id="slab-total-display">0.00</span>\r
                              </div>\r
                          </div>`;
const replaceHtml = searchHtml + `\n\n                          <div id="custom-unit-text-container" style="display:none; margin-top:10px;">\n                              <label style="font-weight:600; font-size:12px; color:#333;">Unit Description (if no teeth selected)</label>\n                              <textarea id="custom-unit-text" rows="2" style="width:100%; padding:4px; border:1px solid #ccc;" placeholder="E.g. Upper right 3, 4, 5..."></textarea>\n                          </div>`;

contentEdit = contentEdit.replace(searchHtml, replaceHtml);

// Add toggle logic in selectProduct function
const searchJs = `              if (slabsContainer) {\r
                  slabsContainer.style.display = isSlabProduct ? 'block' : 'none';\r
              }`;
const replaceJs = searchJs + `\n              const customUnitTextContainer = document.getElementById('custom-unit-text-container');\n              if (customUnitTextContainer) {\n                  customUnitTextContainer.style.display = isSlabProduct ? 'block' : 'none';\n              }`;

contentEdit = contentEdit.replace(searchJs, replaceJs);

// Add value retrieval in saveOrderEdit
const searchSave = `                  rate: document.getElementById('unit-rate').value,\r
                  total: document.getElementById('total-price').value\r
              };`;
const replaceSave = `                  rate: document.getElementById('unit-rate').value,\n                  total: document.getElementById('total-price').value\n              };\n              const customUnitContainer = document.getElementById('custom-unit-text-container');\n              if (customUnitContainer && customUnitContainer.style.display === 'block') {\n                  const customText = document.getElementById('custom-unit-text').value;\n                  if (customText) job.teethSelection = customText;\n              }`;

contentEdit = contentEdit.replace(searchSave, replaceSave);

fs.writeFileSync(fileEdit, contentEdit, 'utf8');
console.log("Patched edit-order.html with custom unit text");