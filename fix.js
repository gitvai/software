const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'new-order.html');

let content = fs.readFileSync(file, 'utf8');

// Restore the deleted block
const regex = /            if \(teethArea\) teethArea\.style\.display = 'block';[\s\S]*?const nameDisplay = document\.getElementById\('selected-product-name'\);/;

const replacement = \            if (productArea) productArea.style.display = 'none';
            if (teethArea) teethArea.style.display = 'block';
            
            // Show slabs only for specific products
            const slabProducts = ['RPD', 'FLEXIBLE RPD', 'CAST PARTIAL', 'RPD REPAIR AND ADD TEETH'];
            const productName = (p.name || '').toUpperCase();
            const isSlabProduct = slabProducts.some(sp => productName.includes(sp));
            
            if (slabsContainer) {
                slabsContainer.style.display = isSlabProduct ? 'block' : 'none';
            }
            
            const customUnitTextContainer = document.getElementById('custom-unit-text-container');
            if (customUnitTextContainer) {
                customUnitTextContainer.style.display = isSlabProduct ? 'block' : 'none';
            }
            
            if (isSlabProduct) {
                const s1 = document.getElementById('slab1-rate');
                if (s1) s1.value = p.charge || 0;
                const s2 = document.getElementById('slab2-rate');
                if (s2) s2.value = 2;
            }

            const nameDisplay = document.getElementById('selected-product-name');\;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Fixed product selection in new-order.html");