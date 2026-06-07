const fs = require('fs');
const path = require('path');
const file = path.join(process.argv[2], 'new-order.html');
let content = fs.readFileSync(file, 'utf8');

const regex = /        async function submitOrder\(\) \{[\s\S]*?try \{\n                const res = await fetch/;

const replacement = \        async function submitOrder() {
            if (!selectedClientId) {
                alert("Please select a client first!");
                return;
            }
            const patientName = document.getElementById('patient-name-detail').value || document.getElementById('patient-name').value;
            
            const slabsContainer = document.getElementById('slabs-container');
            const isSlabActive = slabsContainer && slabsContainer.style.display === 'block';

            const customUnitContainer = document.getElementById('custom-unit-text-container');
            let customTeethText = '';
            if (customUnitContainer && customUnitContainer.style.display === 'block') {
                customTeethText = document.getElementById('custom-unit-text').value;
            }

            const data = {
                clientId: selectedClientId,
                patientName: patientName,
                productName: document.getElementById('selected-product-name').textContent,
                productType: selectedProductType,
                teethSelection: customTeethText ? customTeethText : document.getElementById('selected-teeth-list').value,
                units: parseInt(document.getElementById('unit-count').value) || 0,
                price: parseFloat(document.getElementById('total-price').value) || 0,
                status: document.getElementById('order-status') ? document.getElementById('order-status').value : 'New',
                receivedDate: document.getElementById('order-date-input') ? new Date(document.getElementById('order-date-input').value).toISOString() : new Date().toISOString(),
                dueDate: document.getElementById('due-date-input') && document.getElementById('due-date-input').value ? new Date(document.getElementById('due-date-input').value).toISOString() : null,
                shade1: document.getElementById('shade1') ? document.getElementById('shade1').value : null,
                shade2: document.getElementById('shade2') ? document.getElementById('shade2').value : null,
                shade3: document.getElementById('shade3') ? document.getElementById('shade3').value : null,
                shadeNotes: document.getElementById('shade-notes') ? document.getElementById('shade-notes').value : null,
                priority: document.getElementById('priority') ? document.getElementById('priority').value : 'Normal',
                doctorName: document.getElementById('sub-doctor') ? document.getElementById('sub-doctor').value : null,
                notes: document.getElementById('order-notes') ? document.getElementById('order-notes').value : null,
                articulatorTag: document.getElementById('articulator-tag') ? document.getElementById('articulator-tag').value : null,
                orderType: document.querySelector('input[name="workType"]:checked') ? document.querySelector('input[name="workType"]:checked').value : 'New',
                department: document.getElementById('department') ? document.getElementById('department').value : null,
                modelNumber: document.getElementById('model-number-input') ? document.getElementById('model-number-input').value : null,
                assignTo: document.getElementById('assign-to') ? document.getElementById('assign-to').value : null,
                deliveryMethod: document.getElementById('delivery-method') ? document.getElementById('delivery-method').value : null,
                dropLocation: document.getElementById('drop-location') ? document.getElementById('drop-location').value : null,
                panTray: document.getElementById('pan-tray') ? document.getElementById('pan-tray').value : null,
                
                // Slabs data
                slab1Rate: isSlabActive ? parseFloat(document.getElementById('slab1-rate').value) : null,
                slab2Rate: isSlabActive ? parseFloat(document.getElementById('slab2-rate').value) : null,
                slab1Units: isSlabActive ? Math.min(selectedTeeth.length, 1) : null,
                slab2Units: isSlabActive ? Math.max(0, selectedTeeth.length - 1) : null
            };

            if (orderJobs && orderJobs.length > 0) {
                data.jobs = orderJobs.map(j => ({
                    productName: j.product,
                    productType: j.productType || 'General',
                    teethSelection: j.teeth ? j.teeth.join(',') : '',
                    units: j.units,
                    price: j.rate,
                    totalAmount: j.total,
                    slab1Rate: j.slab1Rate,
                    slab2Rate: j.slab2Rate,
                    slab1Units: j.slab1Units,
                    slab2Units: j.slab2Units
                }));
                // Calculate total price by summing jobs
                data.price = data.jobs.reduce((sum, j) => sum + parseFloat(j.price || 0), 0);
                data.totalAmount = data.jobs.reduce((sum, j) => sum + parseFloat(j.totalAmount || 0), 0);
            }

            try {
                const res = await fetch\;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Restored submitOrder function data block");