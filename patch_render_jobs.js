const fs = require('fs');
const path = require('path');

function patchRenderJobsList(fileName) {
    const file = path.join(process.argv[2], fileName);
    let content = fs.readFileSync(file, 'utf8');

    // Regex to match the renderJobsList function exactly
    const regex = /function renderJobsList\(\)\s*\{[\s\S]*?(?:wrapper\.style\.display = 'none';\s*\}|wrapper\.style\.display = 'none';\s*\}\s*\})/g;

    const replaceRender = `function removeJob(index) {
            orderJobs.splice(index, 1);
            renderJobsList();
        }

        function renderJobsList() {
            const container = document.getElementById('jobs-container');
            const wrapper = document.getElementById('added-jobs-list');
            if (orderJobs.length > 0) {
                wrapper.style.display = 'block';
                let tableHtml = \`
                    <div style="overflow-x:auto;">
                    <table style="width:100%; border-collapse: collapse; font-size: 13px; text-align: left; margin-bottom: 10px; border: 1px solid #e5e7eb;">
                        <thead>
                            <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                                <th style="padding: 8px 12px;">#</th>
                                <th style="padding: 8px 12px;">Product</th>
                                <th style="padding: 8px 12px;">Teeth</th>
                                <th style="padding: 8px 12px; text-align:center;">Units</th>
                                <th style="padding: 8px 12px; text-align:right;">Rate/unit</th>
                                <th style="padding: 8px 12px; text-align:right;">Total</th>
                                <th style="padding: 8px 12px; text-align:center;">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                \`;
                
                orderJobs.forEach((j, idx) => {
                    tableHtml += \`
                        <tr style="border-bottom: 1px solid #e5e7eb; background-color: #ffffff;" onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='#ffffff'">
                            <td style="padding: 8px 12px; color: #6b7280;">\${idx + 1}</td>
                            <td style="padding: 8px 12px; font-weight: 600; color: #1f2937;">\${j.product}</td>
                            <td style="padding: 8px 12px; color: #4b5563;">\${j.teeth ? j.teeth.sort().join(', ') : ''}</td>
                            <td style="padding: 8px 12px; text-align:center; color: #4b5563;">\${j.units}</td>
                            <td style="padding: 8px 12px; text-align:right; color: #4b5563;">\${j.rate}</td>
                            <td style="padding: 8px 12px; text-align:right; font-weight: 600; color: #111827;">\${parseFloat(j.total).toFixed(2)}</td>
                            <td style="padding: 8px 12px; text-align:center;">
                                <button type="button" onclick="removeJob(\${idx})" style="background:none; border:none; color:#ef4444; font-size:14px; cursor:pointer;" title="Remove Job">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    \`;
                });
                
                tableHtml += \`
                        </tbody>
                    </table>
                    </div>
                \`;
                
                container.innerHTML = tableHtml;
            } else {
                wrapper.style.display = 'none';
                container.innerHTML = '';
            }
        }`;

    if (regex.test(content)) {
        content = content.replace(regex, replaceRender);
        fs.writeFileSync(file, content, 'utf8');
        console.log("Patched " + fileName);
    } else {
        console.log("Regex did not match in " + fileName);
    }
}

patchRenderJobsList('new-order.html');
patchRenderJobsList('edit-order.html');
