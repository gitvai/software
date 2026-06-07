const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function test() {
    try {
        const invoices = await get('https://software-e857.onrender.com/api/invoices');
        if (!invoices || invoices.length === 0) {
            console.log("No invoices found.");
            return;
        }
        const id = invoices[0].id;
        console.log(`Testing Invoice ID: ${id}`);
        const data = await get(`https://software-e857.onrender.com/api/invoices/${id}`);
        console.log("Invoice Data Keys:", Object.keys(data));
        console.log("Orders count:", data.orders ? data.orders.length : 'N/A');
        if (data.orders && data.orders.length > 0) {
            console.log("First Order:", data.orders[0].id);
        }
    } catch (err) {
        console.error(err);
    }
}
test();

