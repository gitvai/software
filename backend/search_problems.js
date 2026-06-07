const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

async function test() {
    try {
        console.log("Searching for problematic invoices...");
        const invoices = await get('https://software-e857.onrender.com/api/invoices');
        if (!invoices) return;
        
        for (const inv of invoices) {
            const data = await get(`https://software-e857.onrender.com/api/invoices/${inv.id}`);
            if (data.netAmount > 0 && (!data.orders || data.orders.length === 0)) {
                console.log(`PROBLEM FOUND: Invoice ID ${data.id} has Amount ${data.netAmount} but 0 orders.`);
            }
        }
        console.log("Search complete.");
    } catch (err) {
        console.error(err);
    }
}
test();

