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
        console.log("Checking Shipment Notes...");
        const notes = await get('http://localhost:5000/api/shipment-notes');
        if (notes && notes.length > 0) {
            const id = notes[0].id;
            console.log(`Testing Shipment Note ID: ${id}`);
            const data = await get(`http://localhost:5000/api/shipment-notes/${id}`);
            console.log("Note Data Keys:", Object.keys(data));
            console.log("Orders count:", data.orders ? data.orders.length : 'N/A');
        } else {
            console.log("No shipment notes found.");
        }
    } catch (err) {
        console.error(err);
    }
}
test();
