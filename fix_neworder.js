const fs = require('fs');
const path = require('path');
const newOrderFile = path.join(process.argv[2], 'new-order.html');
let content = fs.readFileSync(newOrderFile, 'utf8');

const regex = /function saveAndAddNewJob\(\) \{[\s\S]*?function handleStatusChange\(\) \{/;

const replacement = unction saveAndAddNewJob() {
            if (!selectedProduct) {
                alert('Please select a product first.');
                return;
            }
            
            const slabsContainer = document.getElementById('slabs-container');
            const isSlabActive = slabsContainer && slabsContainer.style.display === 'block';

            const job = {
                product: selectedProduct.name,
                productType: selectedProductType || 'General',
                teeth: [...selectedTeeth],
                units: document.getElementById('unit-count').value,
                rate: document.getElementById('unit-rate').value,
                total: document.getElementById('total-price').value,
                slab1Rate: isSlabActive ? parseFloat(document.getElementById('slab1-rate').value) : null,
                slab2Rate: isSlabActive ? parseFloat(document.getElementById('slab2-rate').value) : null,
                slab1Units: isSlabActive ? Math.min(selectedTeeth.length, 1) : null,
                slab2Units: isSlabActive ? Math.max(0, selectedTeeth.length - 1) : null
            };
            orderJobs.push(job);
            
            // Show jobs list
            renderJobsList();
            
            // Clear selection
            selectedTeeth = [];
            document.querySelectorAll('.tooth-num.selected').forEach(el => el.classList.remove('selected'));
            updateTeethUI();
            
            // Back to product selection
            cancelTeethSelection();
            
            alert('Job saved! You can now select another product.');
            console.log("Current Jobs:", orderJobs);
        }

        function renderJobsList() {
            const container = document.getElementById('jobs-container');
            const wrapper = document.getElementById('added-jobs-list');
            if (orderJobs.length > 0) {
                wrapper.style.display = 'block';
                container.innerHTML = orderJobs.map((j, idx) => \
                    <div style="display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid #eee;">
                        <span>\. <strong>\</strong> (\)</span>
                        <span>\ units @ \ = <strong>\</strong></span>
                    </div>
                \).join('');
            } else {
                wrapper.style.display = 'none';
            }
        }

        function handleStatusChange() {;

content = content.replace(regex, replacement);
fs.writeFileSync(newOrderFile, content, 'utf8');
console.log("Fixed saveAndAddNewJob and renderJobsList in new-order.html");