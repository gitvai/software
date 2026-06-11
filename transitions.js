// Auto-redirect from file:/// to localhost:5000 to prevent CORS and Origin security errors
if (window.location.protocol === 'file:') {
    const filename = window.location.pathname.split('/').pop() || 'index.html';
    const newUrl = 'https://software-e857.onrender.com/' + filename + window.location.search + window.location.hash;
    window.location.replace(newUrl);
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Create curtain element
    const curtain = document.createElement('div');
    curtain.className = 'page-curtain opening';
    
    const content = document.createElement('div');
    content.className = 'curtain-content';
    curtain.style.color = 'white'; // Explicitly white
    curtain.appendChild(content);
    
    document.body.appendChild(curtain);

    // 2. Prepare body
    document.body.classList.add('curtain-ready');
    
    // 3. Start opening sequence
    setTimeout(() => {
        document.body.classList.add('visible');
    }, 100);

    // Hide curtain after animation to prevent horizontal scrolling
    setTimeout(() => {
        curtain.style.display = 'none';
    }, 900);

    // 4. Intercept link clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;

        const href = link.getAttribute('href');
        const target = link.getAttribute('target');

        // Check if it's an internal link
        if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !target && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
            e.preventDefault();
            
            // Get page name from link text or href or special classes
            let pageName = "";
            
            // 1. Check if it's the logo section (HOME)
            if (link.classList.contains('logo-section') || link.closest('.logo-section')) {
                pageName = "HOME";
            } else {
                // 2. Get from text content
                pageName = link.textContent.trim();
            }

            // Clean up name if it's too complex
            if (!pageName || pageName.length > 20 || pageName.includes('\n')) {
                const parts = href.split('/');
                const filename = parts[parts.length - 1].replace('.html', '');
                if (filename === 'index' || filename === '') {
                    pageName = "HOME";
                } else {
                    pageName = filename.charAt(0).toUpperCase() + filename.slice(1).replace('-', ' ');
                }
            }

            // Set text in curtain
            content.innerText = pageName.toUpperCase();
            
            // Close curtain
            curtain.style.display = 'block';
            curtain.classList.remove('opening');
            curtain.classList.add('closing');

            // Navigate after animation (increased to 800ms for better visibility)
            setTimeout(() => {
                window.location.href = href;
            }, 800);
        }
    });

    // 5. Handle back/forward cache
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            curtain.style.display = 'block';
            curtain.classList.remove('closing');
            curtain.classList.add('opening');
            content.innerText = '';
            
            setTimeout(() => {
                curtain.style.display = 'none';
            }, 900);
        }
    });

    // 6. Backup Reminder Logic
    function checkBackupReminder() {
        const lastBackup = localStorage.getItem('lastBackupDate');
        const fifteenDays = 15 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        if (!lastBackup || (now - lastBackup) > fifteenDays) {
            const reminder = document.createElement('div');
            reminder.id = 'backup-reminder';
            reminder.style.cssText = `
                position: sticky;
                top: 0;
                left: 0;
                width: 100%;
                background: #fef3c7;
                color: #92400e;
                padding: 10px;
                text-align: center;
                font-size: 13px;
                font-weight: 600;
                z-index: 10001;
                border-bottom: 1px solid #f59e0b;
                display: flex;
                justify-content: center;
                align-items: center;
                gap: 15px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            `;
            reminder.innerHTML = `
                <span><i class="fas fa-exclamation-triangle"></i> Reminder: Aapne 15 din se backup nahi liya hai. Kripya suraksha ke liye backup le lein.</span>
                <a href="/api/backup/system" class="backup-now-btn" style="background:#f59e0b; color:white; text-decoration:none; padding:4px 12px; border-radius:4px; font-size:11px;">System Backup Karein</a>
                <button onclick="this.parentElement.remove()" style="background:none; border:none; color:#b45309; cursor:pointer; font-size:16px;">&times;</button>
            `;
            document.body.prepend(reminder);
        }
    }

    checkBackupReminder();

    // 7. Export Modal Logic
    window.showExportModal = function() {
        const modal = document.createElement('div');
        modal.id = 'export-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 20000;
        `;
        modal.innerHTML = `
            <div style="background:white; padding:25px; border-radius:12px; width:400px; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h2 style="margin:0; font-size:18px; color:#111827;">Export Data</h2>
                    <button onclick="this.closest('#export-modal').remove()" style="background:none; border:none; font-size:20px; cursor:pointer;">&times;</button>
                </div>
                <p style="font-size:13px; color:#6b7280; margin-bottom:20px;">Choose your preferred format for downloading lab data.</p>
                <div style="display:grid; gap:12px;">
                    <a href="/api/backup/orders-csv" class="export-opt" onclick="closeExportModal()">
                        <div style="background:#dcfce7; color:#166534; padding:12px; border-radius:8px; display:flex; align-items:center; gap:12px; cursor:pointer;">
                            <i class="fas fa-file-excel" style="font-size:20px;"></i>
                            <div>
                                <div style="font-weight:700; font-size:14px;">Excel Spreadsheet (.csv)</div>
                                <div style="font-size:11px; opacity:0.8;">Best for Orders analysis in Excel</div>
                            </div>
                        </div>
                    </a>
                    <a href="/api/backup/data" class="export-opt" onclick="closeExportModal()">
                        <div style="background:#dbeafe; color:#1e40af; padding:12px; border-radius:8px; display:flex; align-items:center; gap:12px; cursor:pointer;">
                            <i class="fas fa-file-code" style="font-size:20px;"></i>
                            <div>
                                <div style="font-weight:700; font-size:14px;">Raw Data (.json)</div>
                                <div style="font-size:11px; opacity:0.8;">Full technical backup (All tables)</div>
                            </div>
                        </div>
                    </a>
                    <a href="javascript:void(0)" onclick="window.print(); closeExportModal()" class="export-opt">
                        <div style="background:#fee2e2; color:#991b1b; padding:12px; border-radius:8px; display:flex; align-items:center; gap:12px; cursor:pointer;">
                            <i class="fas fa-file-pdf" style="font-size:20px;"></i>
                            <div>
                                <div style="font-weight:700; font-size:14px;">PDF / Print Summary</div>
                                <div style="font-size:11px; opacity:0.8;">Print current screen as PDF</div>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    window.closeExportModal = function() {
        const modal = document.getElementById('export-modal');
        if (modal) modal.remove();
    }

    // Update click listener to catch backup clicks
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (!link) return;
        const href = link.getAttribute('href');
        
        if (href && href.includes('/api/backup/')) {
            localStorage.setItem('lastBackupDate', Date.now());
            const reminder = document.getElementById('backup-reminder');
            if (reminder) reminder.remove();
        }
    }, true);

    // 8. Global Select All Logic for Tables
    document.addEventListener('change', (e) => {
        const target = e.target;
        if (target.tagName.toLowerCase() === 'input' && target.type === 'checkbox') {
            const th = target.closest('th');
            if (th) {
                const table = target.closest('table');
                if (table) {
                    const isChecked = target.checked;
                    const tbodyCheckboxes = table.querySelectorAll('tbody input[type="checkbox"]');
                    tbodyCheckboxes.forEach(cb => {
                        cb.checked = isChecked;
                    });
                }
            }
        }
    });
});


