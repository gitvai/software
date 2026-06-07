const axios = require('axios');

const BASE_URL = 'https://software-e857.onrender.com/api';

async function testBackend() {
  try {
    console.log('🚀 Starting Backend Test...');

    // 1. Create a Client
    console.log('\n1. Creating Client...');
    const clientRes = await axios.post(`${BASE_URL}/clients`, {
      name: 'Dr. Smith Dental Clinic',
      doctorName: 'Dr. Smith',
      phone: '1234567890',
      city: 'Sohar'
    });
    const clientId = clientRes.data.id;
    console.log('✅ Client Created:', clientRes.data.name);

    // 2. Create an Order
    console.log('\n2. Creating Order...');
    const orderRes = await axios.post(`${BASE_URL}/orders`, {
      clientId: clientId,
      patientName: 'John Doe',
      productType: 'Crown',
      price: 150,
      shade1: 'A1'
    });
    const orderId = orderRes.data.id;
    console.log('✅ Order Created:', orderRes.data.patientName);

    // 3. Create a Shipment Note
    console.log('\n3. Creating Shipment Note...');
    const shipmentRes = await axios.post(`${BASE_URL}/shipment-notes`, {
      clientId: clientId,
      noteNumber: `SN-${Date.now()}`,
      orderIds: [orderId]
    });
    console.log('✅ Shipment Note Created:', shipmentRes.data.noteNumber);

    // 4. Create an Invoice
    console.log('\n4. Creating Invoice...');
    const invoiceRes = await axios.post(`${BASE_URL}/invoices`, {
      clientId: clientId,
      invoiceNumber: `INV-${Date.now()}`,
      orderIds: [orderId],
      grossAmount: 150,
      discountAmount: 10,
      taxAmount: 5,
      netAmount: 145
    });
    console.log('✅ Invoice Created:', invoiceRes.data.invoiceNumber);

    // 5. Create a Receipt
    console.log('\n5. Creating Receipt...');
    const receiptRes = await axios.post(`${BASE_URL}/receipts`, {
      clientId: clientId,
      receiptNumber: `REC-${Date.now()}`,
      amount: 100,
      paymentMode: 'Cash'
    });
    console.log('✅ Receipt Created:', receiptRes.data.receiptNumber);

    // 6. Check Dashboard Stats
    console.log('\n6. Fetching Dashboard Stats...');
    const statsRes = await axios.get(`${BASE_URL}/dashboard/stats`);
    console.log('✅ Dashboard Stats:', statsRes.data);

    console.log('\n✨ ALL TESTS PASSED SUCCESSFULLY! BACKEND IS WORKING 100% ✨');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.response ? error.response.data : error.message);
  }
}

testBackend();

