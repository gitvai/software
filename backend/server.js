const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

const path = require('path');
const multer = require('multer');
const fs = require('fs');

app.use(cors());
app.use(express.json());

// --- MANUAL MIGRATION FOR CLIENTS ---
async function runClientMigration() {
  const columns = [
    { name: 'defaultDeliveryAgent', type: 'TEXT' },
    { name: 'collectionCentre', type: 'TEXT' },
    { name: 'regularVisits', type: 'TEXT' },
    { name: 'taxExemption', type: 'BOOLEAN DEFAULT 0' },
    { name: 'isDentalLab', type: 'BOOLEAN DEFAULT 0' },
    { name: 'billTo', type: 'TEXT DEFAULT "Self"' },
    { name: 'pinCode', type: 'TEXT' }
  ];

  for (const col of columns) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Client ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to Client`);
    } catch (e) { }
  }

  const expColumns = [
    { name: 'voucherNo', type: 'TEXT' },
    { name: 'paidTo', type: 'TEXT' },
    { name: 'paymentMode', type: 'TEXT' },
    { name: 'reference', type: 'TEXT' },
    { name: 'notes', type: 'TEXT' },
    { name: 'category', type: 'TEXT DEFAULT "General"' }
  ];

  for (const col of expColumns) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE Expense ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Added column ${col.name} to Expense`);
    } catch (e) { }
  }
}
runClientMigration();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './uploads';
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- RECEIPTS ---
app.get('/api/receipts', async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany({ include: { client: true }, orderBy: { id: 'desc' } });
    res.json(receipts);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/receipts/next-number', async (req, res) => {
  try {
    const count = await prisma.receipt.count();
    res.json({ nextNumber: (count + 1).toString().padStart(5, '0') });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/receipts', async (req, res) => {
  try {
    const data = { ...req.body };
    data.clientId = Number(data.clientId);
    data.amount = Number(data.amount);
    data.appliedAmount = Number(data.appliedAmount || 0);
    data.receiptDate = toDate(data.receiptDate) || new Date();
    
    const receipt = await prisma.receipt.create({ data });
    res.status(201).json(receipt);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- EXPENSES ---
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany({ orderBy: { id: 'desc' } });
    res.json(expenses);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/expenses/next-number', async (req, res) => {
  try {
    const count = await prisma.expense.count();
    res.json({ nextNumber: (count + 1).toString().padStart(5, '0') });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const data = { ...req.body };
    data.amount = Number(data.amount);
    data.date = toDate(data.date) || new Date();
    
    const expense = await prisma.expense.create({ data });
    res.status(201).json(expense);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));
// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Helper for numeric fields
const toNum = (val) => (val !== undefined && val !== null && val !== "" ? Number(val) : null);
const toDate = (val) => (val && val !== "" ? new Date(val) : null);

// --- CLIENTS ---
app.get('/api/clients', async (req, res) => {
  try {
    const { search } = req.query;
    let where = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { code: { contains: search } },
        { phone: { contains: search } },
        { cellPhone: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const clients = await prisma.client.findMany({ 
      where,
      include: { orders: { include: { shipmentNote: true } }, invoices: true, receipts: true, shipmentNotes: true },
      orderBy: { name: 'asc' }
    });
    res.json(clients);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/clients', async (req, res) => {
  try {
    const data = { ...req.body };
    
    // Auto-generate code if missing
    if (!data.code) {
      const count = await prisma.client.count();
      data.code = (count + 1).toString().padStart(5, '0');
    }

    data.discountPercentage = toNum(data.discountPercentage) || 0;
    data.creditLimit = toNum(data.creditLimit) || 0;
    data.openingBalance = toNum(data.openingBalance) || 0;
    data.paymentTermsDays = toNum(data.paymentTermsDays) || 0;
    data.advanceBalance = toNum(data.advanceBalance) || 0;
    
    const client = await prisma.client.create({ data });
    res.status(201).json(client);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/clients/:id', async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: Number(req.params.id) },
      include: { 
        orders: { include: { shipmentNote: true } }, 
        shipmentNotes: {
          include: { orders: true }
        }, 
        invoices: true, 
        receipts: true 
      }
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/clients/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.discountPercentage !== undefined) data.discountPercentage = toNum(data.discountPercentage);
    if (data.creditLimit !== undefined) data.creditLimit = toNum(data.creditLimit);
    if (data.advanceBalance !== undefined) data.advanceBalance = toNum(data.advanceBalance);
    const client = await prisma.client.update({ where: { id: Number(req.params.id) }, data });
    res.json(client);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/clients/:id', async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ORDERS ---
app.get('/api/orders', async (req, res) => {
  try {
    const { status, search, clientSearch, clientId, invoiceStatus, invoiceId, shippingStatus, dateFrom, dateTo } = req.query;
    let where = { AND: [] };
    
    if (status && status !== 'all') {
      if (status === 'overdue') {
        where.AND.push({ dueDate: { lt: new Date() } });
        where.AND.push({ status: { notIn: ['Delivered', 'Cancelled'] } });
      } else if (status === 'repeat') {
        where.AND.push({ orderType: { in: ['Repeat', 'Repair'] } });
      } else {
        where.AND.push({ status: status });
      }
    }

    if (shippingStatus) {
      where.AND.push({ shippingStatus: shippingStatus });
    }

    if (dateFrom || dateTo) {
      let dateFilter = {};
      if (dateFrom) {
        let fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        dateFilter.gte = fromDate;
      }
      if (dateTo) {
        let toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        dateFilter.lte = toDate;
      }
      const dateField = req.query.dateField || 'receivedDate';
      where.AND.push({ [dateField]: dateFilter });
    }

    if (clientId) {
      where.AND.push({ clientId: Number(clientId) });
    }
    if (invoiceId) {
      where.AND.push({ invoiceId: Number(invoiceId) });
    }

    if (search) {
      where.AND.push({
        OR: [
          { patientName: { contains: search } },
          { orderNumber: { contains: search } },
          { modelNumber: { contains: search } },
          { id: isNaN(Number(search)) ? undefined : Number(search) }
        ].filter(Boolean)
      });
    }

    if (clientSearch) {
      where.AND.push({
        client: {
          OR: [
            { name: { contains: clientSearch } },
            { code: { contains: clientSearch } },
            { cellPhone: { contains: clientSearch } },
            { email: { contains: clientSearch } }
          ]
        }
      });
    }

    const orders = await prisma.order.findMany({ 
      where,
      include: { client: true, shipmentNote: true, invoice: true },
      orderBy: { id: 'desc' }
    });
    res.json(orders);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/orders', async (req, res) => {
  try {
    const data = { ...req.body };
    data.clientId = Number(data.clientId);
    
    // Map frontend fields to Prisma schema
    if (data.workType !== undefined) {
      data.productType = data.workType;
      delete data.workType;
    } 
    
    if (!data.productType) {
      data.productType = 'General'; // Fallback
    }

    if (data.instructions !== undefined) {
      data.notes = data.instructions;
      delete data.instructions;
    }

    data.age = toNum(data.age);
    data.price = toNum(data.price) || 0;
    data.discountAmount = toNum(data.discountAmount) || 0;
    data.taxAmount = toNum(data.taxAmount) || 0;
    data.netAmount = toNum(data.netAmount) || (data.price - data.discountAmount + data.taxAmount);
    data.totalAmount = data.netAmount;
    
    data.receivedDate = toDate(data.receivedDate) || new Date();
    data.dueDate = toDate(data.dueDate);
    data.trialDate = toDate(data.trialDate);
    data.finishDate = toDate(data.finishDate);
    data.holdFrom = toDate(data.holdFrom);
    data.cancelledOn = toDate(data.cancelledOn);
    
    // Ensure boolean types
    if (data.hasUpperImpression !== undefined) data.hasUpperImpression = !!data.hasUpperImpression;
    if (data.hasLowerImpression !== undefined) data.hasLowerImpression = !!data.hasLowerImpression;
    if (data.hasBite !== undefined) data.hasBite = !!data.hasBite;
    if (data.hasWaxUp !== undefined) data.hasWaxUp = !!data.hasWaxUp;
    if (data.hasOldRestoration !== undefined) data.hasOldRestoration = !!data.hasOldRestoration;
    if (data.hasArticulator !== undefined) data.hasArticulator = !!data.hasArticulator;
    if (data.hasPhotos !== undefined) data.hasPhotos = !!data.hasPhotos;

    // Define allowed fields to prevent Prisma errors
    const allowedFields = [
      'orderNumber', 'orderType', 'clientId', 'doctorName', 'patientName', 'gender', 'age',
      'productType', 'productName', 'material', 'teethSelection', 'shade1', 'shade2', 'shade3',
      'shadeNotes', 'stumpShade', 'priority', 'status', 'receivedDate', 'dueDate', 'trialDate',
      'finishDate', 'hasUpperImpression', 'hasLowerImpression', 'hasBite', 'hasWaxUp',
      'hasOldRestoration', 'hasArticulator', 'hasPhotos', 'notes', 'price', 'discount', 'tax',
      'totalAmount', 'grossAmount', 'discountAmount', 'taxAmount', 'netAmount', 'technician',
      'department', 'modelNumber', 'panTrayNumber', 'deliveryMethod', 'articulatorTag',
      'manufacturer', 'subDoctor', 'dropLocation', 'timeSlot', 'shippingStatus',
      'shipmentNoteId', 'invoiceId', 'slab1Rate', 'slab2Rate', 'slab1Units', 'slab2Units', 'units',
      'holdFrom', 'holdReason', 'cancelledOn', 'cancelledReason'
    ];

    const cleanData = {};
    allowedFields.forEach(f => {
      if (data[f] !== undefined) cleanData[f] = data[f];
    });

    const order = await prisma.order.create({ data: cleanData });
    res.status(201).json(order);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: Number(req.params.id) },
      include: { client: true, invoice: true, shipmentNote: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.clientId) data.clientId = Number(data.clientId);
    if (data.age) data.age = toNum(data.age);
    if (data.price) data.price = toNum(data.price);
    if (data.discountAmount) data.discountAmount = toNum(data.discountAmount);
    if (data.taxAmount) data.taxAmount = toNum(data.taxAmount);
    if (data.netAmount) data.netAmount = toNum(data.netAmount);
    if (data.totalAmount) data.totalAmount = toNum(data.totalAmount);
    
    if (data.receivedDate !== undefined) data.receivedDate = toDate(data.receivedDate);
    if (data.dueDate !== undefined) data.dueDate = toDate(data.dueDate);
    if (data.trialDate !== undefined) data.trialDate = toDate(data.trialDate);
    if (data.finishDate !== undefined) data.finishDate = toDate(data.finishDate);
    if (data.holdFrom !== undefined) data.holdFrom = toDate(data.holdFrom);
    if (data.cancelledOn !== undefined) data.cancelledOn = toDate(data.cancelledOn);

    // Define allowed fields for update
    const allowedFields = [
      'orderNumber', 'orderType', 'clientId', 'doctorName', 'patientName', 'gender', 'age',
      'productType', 'productName', 'material', 'teethSelection', 'shade1', 'shade2', 'shade3',
      'shadeNotes', 'stumpShade', 'priority', 'status', 'receivedDate', 'dueDate', 'trialDate',
      'finishDate', 'hasUpperImpression', 'hasLowerImpression', 'hasBite', 'hasWaxUp',
      'hasOldRestoration', 'hasArticulator', 'hasPhotos', 'notes', 'price', 'discount', 'tax',
      'totalAmount', 'grossAmount', 'discountAmount', 'taxAmount', 'netAmount', 'technician',
      'department', 'modelNumber', 'panTrayNumber', 'deliveryMethod', 'articulatorTag',
      'manufacturer', 'subDoctor', 'dropLocation', 'timeSlot', 'shippingStatus',
      'shipmentNoteId', 'invoiceId', 'slab1Rate', 'slab2Rate', 'slab1Units', 'slab2Units', 'units',
      'holdFrom', 'holdReason', 'cancelledOn', 'cancelledReason'
    ];

    const cleanData = {};
    allowedFields.forEach(f => {
      if (data[f] !== undefined) cleanData[f] = data[f];
    });

    if (data.status === 'Complete') {
      cleanData.shippingStatus = 'Pending';
    }

    const order = await prisma.order.update({
      where: { id: Number(req.params.id) },
      data: cleanData
    });
    res.json(order);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    
    // First, delete related OrderMedia to avoid foreign key constraints
    await prisma.orderMedia.deleteMany({
      where: { orderId: id }
    });
    
    // Then delete the order
    await prisma.order.delete({
      where: { id: id }
    });
    res.json({ success: true });
  } catch (error) { 
    console.error("Delete order error:", error);
    res.status(500).json({ error: error.message }); 
  }
});

// --- ORDER IMAGES ---
app.post('/api/orders/:id/images', upload.array('files'), async (req, res) => {
  try {
    const orderId = Number(req.params.id);
    const files = req.files;
    if (!files || files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

    const mediaEntries = files.map(f => ({
      orderId,
      url: `/backend/uploads/${f.filename}`, // Adjust based on your serving path
      filename: f.originalname,
      mimetype: f.mimetype
    }));

    await prisma.media.createMany({ data: mediaEntries });
    res.json({ message: 'Files uploaded successfully', count: files.length });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/orders/:id/images', async (req, res) => {
  try {
    const media = await prisma.media.findMany({
      where: { orderId: Number(req.params.id) }
    });
    res.json(media);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- SHIPMENT NOTES ---
// Removed duplicate GET /api/shipment-notes
app.post('/api/shipment-notes', async (req, res) => {
  try {
    const { orderIds, ...rest } = req.body;
    const data = { ...rest };
    data.clientId = Number(data.clientId);
    data.noteDate = toDate(data.noteDate) || new Date();
    
    // Clean data for Prisma
    const cleanData = {
      noteNumber: data.noteNumber,
      clientId: data.clientId,
      noteDate: data.noteDate,
      type: data.type || 'Final',
      status: data.status || 'Created',
      deliveryMode: data.deliveryMode,
      notes: data.notes
    };

    const note = await prisma.$transaction(async (tx) => {
      const created = await tx.shipmentNote.create({
        data: {
          ...cleanData
        }
      });
      
      if (orderIds && orderIds.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: orderIds.map(id => Number(id)) } },
          data: { shippingStatus: 'Dispatched', shipmentNoteId: created.id }
        });
      }
      return created;
    });

    res.status(201).json(note);
  } catch (error) { 
    console.error("Shipment Note Creation Error:", error);
    res.status(500).json({ error: error.message }); 
  }
});

// --- DELIVERY PLANS ---
app.get('/api/delivery-plans', async (req, res) => {
  try {
    const plans = await prisma.deliveryPlan.findMany({ include: { driver: true, shipmentNotes: true } });
    res.json(plans);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/delivery-plans', async (req, res) => {
  try {
    const { shipmentNoteIds, ...rest } = req.body;
    const data = { ...rest };
    if (data.driverId) data.driverId = Number(data.driverId);
    data.planDate = toDate(data.planDate) || new Date();
    
    const plan = await prisma.deliveryPlan.create({
      data: {
        ...data,
        shipmentNotes: { connect: (shipmentNoteIds || []).map(id => ({ id: Number(id) })) }
      }
    });
    
    res.status(201).json(plan);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- PICKUP & RETURNS ---
app.get('/api/pickup-returns', async (req, res) => {
  try {
    const items = await prisma.pickupReturn.findMany({ include: { order: { include: { client: true } } } });
    res.json(items);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pickup-returns', async (req, res) => {
  try {
    const data = { ...req.body };
    data.orderId = Number(data.orderId);
    data.pickupDate = toDate(data.pickupDate);
    const item = await prisma.pickupReturn.create({ data });
    res.status(201).json(item);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- INVOICES ---
app.get('/api/invoices', async (req, res) => {
  try {
    const { status, search, clientId } = req.query;
    let where = {};

    if (status) where.status = status;
    if (clientId) where.clientId = Number(clientId);
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { client: { name: { contains: search } } },
        { client: { code: { contains: search } } },
        { client: { cellPhone: { contains: search } } },
        { client: { email: { contains: search } } }
      ];
    }

    const invoices = await prisma.invoice.findMany({ 
      where,
      include: { client: true, orders: true, adjustments: true },
      orderBy: { invoiceDate: 'desc' }
    });
    res.json(invoices);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/invoices', async (req, res) => {
  try {
    const { orderIds, ...rest } = req.body;
    const data = { ...rest };
    
    // If clientId is missing, get it from the first order
    if (!data.clientId && orderIds && orderIds.length > 0) {
      const firstOrder = await prisma.order.findUnique({ where: { id: Number(orderIds[0]) } });
      if (firstOrder) data.clientId = firstOrder.clientId;
    } else {
      data.clientId = Number(data.clientId);
    }

    if (!data.invoiceNumber) {
      const count = await prisma.invoice.count();
      data.invoiceNumber = (count + 1001).toString();
    }

    let computedGross = 0;
    if (orderIds && orderIds.length > 0) {
      const ordersToInvoice = await prisma.order.findMany({
        where: { id: { in: orderIds.map(id => Number(id)) } }
      });
      computedGross = ordersToInvoice.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    }

    data.grossAmount = toNum(data.grossAmount) || computedGross;
    data.discountAmount = toNum(data.discountAmount) || 0;
    data.taxAmount = toNum(data.taxAmount) || 0;
    data.netAmount = toNum(data.netAmount) || (data.grossAmount - data.discountAmount + data.taxAmount);
    data.paidAmount = toNum(data.paidAmount) || 0;
    data.balanceAmount = data.netAmount - data.paidAmount;
    data.invoiceDate = toDate(data.invoiceDate) || new Date();
    data.dueDate = toDate(data.dueDate) || data.invoiceDate;
    
    const invoice = await prisma.$transaction(async (tx) => {
      const created = await tx.invoice.create({
        data: {
          ...data
        }
      });
      
      if (orderIds && orderIds.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: orderIds.map(id => Number(id)) } },
          data: { invoiceId: created.id }
        });
      }
      return created;
    });
    
    res.status(201).json(invoice);
  } catch (error) { 
    console.error("Invoice Creation Error:", error);
    res.status(500).json({ error: error.message }); 
  }
});

app.get('/api/invoices/:id/pdf', async (req, res) => {
  try {
    const { exec } = require('child_process');
    const fs = require('fs');
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    const invoice = await prisma.invoice.findUnique({
      where: { id: Number(req.params.id) },
      include: { client: true, orders: true }
    });

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Recovery logic: If orders array is empty, explicitly fetch orders by invoiceId
    if (invoice.orders.length === 0) {
      const recoveredOrders = await prisma.order.findMany({
        where: { invoiceId: invoice.id }
      });
      if (recoveredOrders.length > 0) {
        invoice.orders = recoveredOrders;
      }
    }

    // Format dates for the Python script
    const formattedInvoice = {
      ...invoice,
      invoiceDate: invoice.invoiceDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      dueDate: invoice.dueDate ? invoice.dueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
    };

    const jsonPath = path.join(tempDir, `invoice_${invoice.id}.json`);
    const pdfPath = path.join(tempDir, `invoice_${invoice.id}.pdf`);
    
    fs.writeFileSync(jsonPath, JSON.stringify(formattedInvoice));

    const pythonCmd = `py "${path.join(__dirname, '..', 'generate_invoice.py')}" "${jsonPath}" "${pdfPath}"`;
    
    exec(pythonCmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Python Error:', error);
        console.error('Stderr:', stderr);
        return res.status(500).json({ error: 'Failed to generate PDF' });
      }
      
      if (fs.existsSync(pdfPath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.id}.pdf`);
        const stream = fs.createReadStream(pdfPath);
        stream.pipe(res);
        
        // Cleanup after stream ends
        stream.on('end', () => {
          try {
            fs.unlinkSync(jsonPath);
            fs.unlinkSync(pdfPath);
          } catch (e) { console.error('Cleanup error:', e); }
        });
      } else {
        res.status(500).json({ error: 'PDF file not created' });
      }
    });

  } catch (error) { 
    console.error("PDF Generation Error:", error);
    res.status(500).json({ error: error.message }); 
  }
});


app.get('/api/invoices/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    const invoice = await prisma.invoice.findFirst({
      where: {
        OR: [
          { id: isNaN(Number(idParam)) ? -1 : Number(idParam) },
          { invoiceNumber: idParam }
        ]
      },
      include: { client: true, orders: true, adjustments: true }
    });
    
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Recovery logic: If orders array is empty, explicitly fetch orders linked to this invoice
    if (!invoice.orders || invoice.orders.length === 0) {
      const recoveredOrders = await prisma.order.findMany({
        where: { invoiceId: invoice.id },
        include: { client: true }
      });
      if (recoveredOrders.length > 0) {
        invoice.orders = recoveredOrders;
      }
    }

    res.json(invoice);
  } catch (error) { 
    console.error("Invoice Fetch Error:", error);
    res.status(500).json({ error: error.message }); 
  }
});

app.put('/api/invoices/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.clientId) data.clientId = Number(data.clientId);
    if (data.invoiceDate) data.invoiceDate = toDate(data.invoiceDate);
    if (data.dueDate) data.dueDate = toDate(data.dueDate);
    if (data.netAmount) {
      data.netAmount = toNum(data.netAmount);
      data.balanceAmount = data.netAmount - (toNum(data.paidAmount) || 0);
    }
    const invoice = await prisma.invoice.update({
      where: { id: Number(req.params.id) },
      data
    });
    res.json(invoice);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- RECEIPTS ---
app.get('/api/receipts', async (req, res) => {
  try {
    const { status, search, clientId } = req.query;
    let where = {};

    if (status) where.status = status;
    if (clientId) where.clientId = Number(clientId);
    if (search) {
      where.OR = [
        { receiptNumber: { contains: search } },
        { client: { name: { contains: search } } },
        { client: { code: { contains: search } } },
        { client: { cellPhone: { contains: search } } },
        { client: { email: { contains: search } } }
      ];
    }

    const receipts = await prisma.receipt.findMany({ 
      where,
      include: { client: true },
      orderBy: { receiptDate: 'desc' }
    });
    res.json(receipts);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/receipts/:id', async (req, res) => {
  try {
    const receipt = await prisma.receipt.findUnique({
      where: { id: Number(req.params.id) },
      include: { client: true }
    });
    if (!receipt) return res.status(404).json({ error: 'Receipt not found' });
    res.json(receipt);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/receipts', async (req, res) => {
  try {
    const data = { ...req.body };
    data.clientId = Number(data.clientId);
    data.amount = toNum(data.amount) || 0;
    data.appliedAmount = toNum(data.appliedAmount) || 0;
    data.creditAmount = data.amount - data.appliedAmount;
    data.receiptDate = toDate(data.receiptDate) || new Date();
    data.chequeDate = toDate(data.chequeDate);
    data.isAdvance = !!data.isAdvance;
    
    const receipt = await prisma.receipt.create({ data });
    
    if (data.isAdvance) {
      await prisma.client.update({
        where: { id: data.clientId },
        data: { advanceBalance: { increment: data.creditAmount } }
      });
    }

    res.status(201).json(receipt);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/receipts/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.clientId) data.clientId = Number(data.clientId);
    if (data.receiptDate) data.receiptDate = toDate(data.receiptDate);
    if (data.chequeDate) data.chequeDate = toDate(data.chequeDate);
    if (data.amount) data.amount = toNum(data.amount);
    if (data.appliedAmount) data.appliedAmount = toNum(data.appliedAmount);
    
    const receipt = await prisma.receipt.update({
      where: { id: Number(req.params.id) },
      data
    });
    res.json(receipt);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/receipts/:id', async (req, res) => {
  try {
    await prisma.receipt.delete({ where: { id: Number(req.params.id) } });
    res.status(204).end();
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- ADJUSTMENTS ---
app.get('/api/adjustments', async (req, res) => {
  try {
    const items = await prisma.adjustment.findMany({ include: { client: true, invoice: true } });
    res.json(items);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/adjustments', async (req, res) => {
  try {
    const data = { ...req.body };
    data.clientId = Number(data.clientId);
    if (data.invoiceId) data.invoiceId = Number(data.invoiceId);
    data.amount = toNum(data.amount);
    data.date = toDate(data.date) || new Date();
    
    const item = await prisma.adjustment.create({ data });
    res.status(201).json(item);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- STAFF ---
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany();
    res.json(staff);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/staff', async (req, res) => {
  try {
    const staff = await prisma.staff.create({ data: req.body });
    res.status(201).json(staff);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- EXPENSES ---
app.get('/api/expenses', async (req, res) => {
  try {
    const expenses = await prisma.expense.findMany();
    res.json(expenses);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const data = { ...req.body };
    data.amount = toNum(data.amount);
    data.date = toDate(data.date) || new Date();
    const expense = await prisma.expense.create({ data });
    res.status(201).json(expense);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
  try {
    const { search, type } = req.query;
    const where = {};
    if (search) where.name = { contains: search };
    if (type && type !== 'All Product Types') where.type = type;
    const products = await prisma.product.findMany({ where });
    res.json(products);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const data = { ...req.body };
    data.charge = toNum(data.charge) || 0;
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/product-types', async (req, res) => {
  try {
    const types = await prisma.productType.findMany();
    res.json(types);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/product-types', async (req, res) => {
  try {
    const data = { ...req.body };
    const type = await prisma.productType.create({ data });
    res.status(201).json(type);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- PICKUP REQUESTS ---
app.get('/api/pickups', async (req, res) => {
  try {
    const { status, clientId, search } = req.query;
    const where = {};
    if (status && status !== 'Ignore') where.status = status;
    if (clientId) where.clientId = Number(clientId);
    if (search) {
      where.OR = [
        { patientName: { contains: search } },
        { doctorName: { contains: search } }
      ];
    }
    const pickups = await prisma.pickupRequest.findMany({
      where,
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(pickups);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pickups', async (req, res) => {
  try {
    const data = { ...req.body };
    data.clientId = Number(data.clientId);
    data.requestDate = toDate(data.requestDate) || new Date();
    data.pickupDate = toDate(data.pickupDate);
    const pickup = await prisma.pickupRequest.create({ data });
    res.status(201).json(pickup);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/pickups/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.clientId) data.clientId = Number(data.clientId);
    if (data.requestDate) data.requestDate = toDate(data.requestDate);
    if (data.pickupDate) data.pickupDate = toDate(data.pickupDate);
    const pickup = await prisma.pickupRequest.update({
      where: { id: Number(req.params.id) },
      data
    });
    res.json(pickup);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/pickups/:id', async (req, res) => {
  try {
    await prisma.pickupRequest.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- DAY BOOK ---
app.get('/api/day-book', async (req, res) => {
  try {
    const { date } = req.query;
    const searchDate = date ? new Date(date) : new Date();
    
    // Set start and end of the day
    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const [orders, invoices, receipts, expenses] = await Promise.all([
      prisma.order.findMany({
        where: { receivedDate: { gte: startOfDay, lte: endOfDay } },
        include: { client: true }
      }),
      prisma.invoice.findMany({
        where: { invoiceDate: { gte: startOfDay, lte: endOfDay } },
        include: { client: true }
      }),
      prisma.receipt.findMany({
        where: { receiptDate: { gte: startOfDay, lte: endOfDay } },
        include: { client: true }
      }),
      prisma.expense.findMany({
        where: { date: { gte: startOfDay, lte: endOfDay } }
      })
    ]);

    // Combine into a single list
    const entries = [];

    orders.forEach(o => entries.push({
      id: o.id,
      time: o.createdAt,
      type: 'Order',
      number: o.orderNumber || o.id,
      particulars: o.client.name + ' (Patient: ' + o.patientName + ')',
      in: 0,
      out: 0,
      ref: 'Order'
    }));

    invoices.forEach(i => entries.push({
      id: i.id,
      time: i.createdAt,
      type: 'Invoice',
      number: i.invoiceNumber || i.id,
      particulars: i.client.name,
      in: i.netAmount,
      out: 0,
      ref: 'Invoice'
    }));

    receipts.forEach(r => entries.push({
      id: r.id,
      time: r.createdAt,
      type: 'Receipt',
      number: r.receiptNumber || r.id,
      particulars: r.client.name + (r.paymentMode ? ' [' + r.paymentMode + ']' : ''),
      in: r.amount,
      out: 0,
      ref: 'Receipt'
    }));

    expenses.forEach(e => entries.push({
      id: e.id,
      time: e.createdAt,
      type: 'Expense',
      number: e.id,
      particulars: e.category + (e.description ? ': ' + e.description : ''),
      in: 0,
      out: e.amount,
      ref: 'Expense'
    }));

    // Sort by time
    entries.sort((a, b) => new Date(a.time) - new Date(b.time));

    res.json(entries);
  } catch (error) { 
    console.error("Day Book Error:", error);
    res.status(500).json({ error: error.message }); 
  }
});

// --- PICKUP RETURNS (TryIn History) ---
app.get('/api/pickup-returns', async (req, res) => {
  try {
    const returns = await prisma.pickupReturn.findMany({
      include: { order: { include: { client: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(returns);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/pickup-returns', async (req, res) => {
  try {
    const data = { ...req.body };
    data.orderId = Number(data.orderId);
    if (data.pickupDate) data.pickupDate = toDate(data.pickupDate);
    if (data.receivedDate) data.receivedDate = toDate(data.receivedDate);
    const ret = await prisma.pickupReturn.create({ data });
    res.status(201).json(ret);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- SHIPMENT NOTES ---
app.get('/api/shipment-notes', async (req, res) => {
  try {
    const { clientId, search } = req.query;
    const where = {};
    if (clientId) where.clientId = Number(clientId);
    if (search) {
      where.OR = [
        { noteNumber: { contains: search } },
        { client: { name: { contains: search } } },
        { client: { code: { contains: search } } },
        { client: { cellPhone: { contains: search } } },
        { client: { email: { contains: search } } }
      ];
    }
    const notes = await prisma.shipmentNote.findMany({
      where,
      include: { client: true, orders: true, deliveryPlan: true },
      orderBy: { noteDate: 'desc' }
    });
    res.json(notes);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/shipment-notes/:id', async (req, res) => {
  try {
    const note = await prisma.shipmentNote.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        client: true,
        orders: {
          include: {
            invoice: true
          }
        }
      }
    });
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (error) { res.status(500).json({ error: error.message }); }
});


app.put('/api/shipment-notes/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.clientId) data.clientId = Number(data.clientId);
    if (data.noteDate) data.noteDate = toDate(data.noteDate);
    const note = await prisma.shipmentNote.update({
      where: { id: Number(req.params.id) },
      data
    });
    res.json(note);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/shipment-notes', async (req, res) => {
  try {
    const { clientId, orderIds, noteNumber, noteDate, deliveryMode, notes } = req.body;
    const note = await prisma.shipmentNote.create({
      data: {
        noteNumber: noteNumber || ('SN-' + Date.now().toString().slice(-6)),
        noteDate: noteDate ? new Date(noteDate) : new Date(),
        deliveryMode: deliveryMode || 'Courier',
        notes: notes || '',
        client: { connect: { id: Number(clientId) } },
        orders: { connect: (orderIds || []).map(id => ({ id: Number(id) })) }
      },
      include: { client: true, orders: true }
    });
    // Update status of orders to Delivered
    if (orderIds && orderIds.length > 0) {
      await prisma.order.updateMany({
        where: { id: { in: orderIds.map(id => Number(id)) } },
        data: { status: 'Delivered' }
      });
    }
    res.status(201).json(note);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/delivery-plans', async (req, res) => {
  try {
    const plans = await prisma.deliveryPlan.findMany({
      include: { driver: true, shipmentNotes: true }
    });
    res.json(plans);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/delivery-plans', async (req, res) => {
  try {
    const { planDate, route, driverId } = req.body;
    const plan = await prisma.deliveryPlan.create({
      data: {
        planDate: planDate ? new Date(planDate) : new Date(),
        route: route || '',
        driver: { connect: { id: Number(driverId) } },
        status: 'Active'
      }
    });
    res.status(201).json(plan);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- DASHBOARD ---
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      newClients, newOrders, deliveries, invoiced, collection, expenses,
      newW, productionW, completeW, holdW, tryinW, deliveredW, repeatW,
      pendingTryIns, pendingOnHold, overdueInvoices,
      finalDeliveriesPendingToday, finalDeliveriesExpectedToday, tryInDeliveriesToday,
      tryInsDispatchedToday, tryInsReturnedToday
    ] = await Promise.all([
      prisma.client.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      prisma.order.count({ where: { receivedDate: { gte: today, lt: tomorrow } } }),
      prisma.shipmentNote.count({ where: { noteDate: { gte: today, lt: tomorrow } } }),
      prisma.invoice.aggregate({ where: { invoiceDate: { gte: today, lt: tomorrow } }, _sum: { netAmount: true } }),
      prisma.receipt.aggregate({ where: { receiptDate: { gte: today, lt: tomorrow } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { date: { gte: today, lt: tomorrow } }, _sum: { amount: true } }),
      
      prisma.order.count({ where: { status: 'New' } }),
      prisma.order.count({ where: { status: 'In Production' } }),
      prisma.order.count({ where: { status: 'Complete' } }),
      prisma.order.count({ where: { status: 'On Hold' } }),
      prisma.order.count({ where: { status: 'Try In' } }),
      prisma.order.count({ where: { status: 'Delivered' } }),
      prisma.order.count({ where: { orderType: { in: ['Repeat', 'Repair'] } } }),
      
      prisma.order.count({ where: { status: 'Try In' } }),
      prisma.order.count({ where: { status: 'On Hold' } }),
      prisma.invoice.count({ where: { status: 'Unpaid', dueDate: { lt: new Date() } } }),

      // Today's Deliveries
      prisma.order.count({ where: { dueDate: { gte: today, lt: tomorrow }, status: { notIn: ['Delivered', 'Cancelled'] } } }),
      prisma.order.count({ where: { dueDate: { gte: today, lt: tomorrow } } }),
      prisma.order.count({ where: { trialDate: { gte: today, lt: tomorrow }, status: { notIn: ['Delivered', 'Cancelled'] } } }),

      // Try-ins Today
      prisma.order.count({ where: { status: 'Try In', updatedAt: { gte: today, lt: tomorrow } } }),
      prisma.order.count({ where: { status: { not: 'Try In' }, updatedAt: { gte: today, lt: tomorrow }, trialDate: { lte: today } } }) // Simple heuristic for returned
    ]);

    const overdueCount = await prisma.order.count({
      where: {
        dueDate: { lt: new Date() },
        status: { notIn: ['Delivered', 'Cancelled'] }
      }
    });

    res.json({
      performance: {
        newClients,
        newOrders,
        deliveries,
        collection: collection._sum.amount || 0,
        invoiced: invoiced._sum.netAmount || 0,
        expenses: expenses._sum.amount || 0,
        profit: (invoiced._sum.netAmount || 0) - (expenses._sum.amount || 0),
        tryInsDispatched: tryInsDispatchedToday,
        tryInsReturned: tryInsReturnedToday
      },
      workflow: {
        new: newW,
        production: productionW,
        complete: completeW,
        hold: holdW,
        tryin: tryinW,
        delivered: deliveredW,
        repeat: repeatW,
        overdue: overdueCount,
        finalPendingToday: finalDeliveriesPendingToday,
        finalExpectedToday: finalDeliveriesExpectedToday,
        tryInToday: tryInDeliveriesToday
      },
      alerts: {
        pendingTryIns,
        pendingOnHold,
        overdueInvoices
      },
      dueSchedule: [] 
    });


  } catch (error) { res.status(500).json({ error: error.message }); }
});


// --- CALENDAR ---
app.get('/api/calendar/stats', async (req, res) => {
  try {
    const { month, year, criteria } = req.query;
    const dateField = criteria === 'Due Date' ? 'dueDate' : 
                      criteria === 'Order Date' ? 'receivedDate' : 
                      criteria === 'Date In' ? 'receivedDate' : 'updatedAt';

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, Number(month) + 1, 1);

    const orders = await prisma.order.findMany({
      where: {
        [dateField]: { gte: startDate, lt: endDate }
      },
      select: { [dateField]: true, status: true }
    });

    const stats = {};
    orders.forEach(o => {
      if (!o[dateField]) return;
      const d = new Date(o[dateField]);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      if (!stats[dateKey]) stats[dateKey] = {};
      stats[dateKey][o.status] = (stats[dateKey][o.status] || 0) + 1;
      stats[dateKey]['Total'] = (stats[dateKey]['Total'] || 0) + 1;
    });

    res.json(stats);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/calendar/orders', async (req, res) => {
  try {
    const { date, criteria } = req.query;
    const dateField = criteria === 'Due Date' ? 'dueDate' : 
                      criteria === 'Order Date' ? 'receivedDate' : 
                      criteria === 'Date In' ? 'receivedDate' : 'updatedAt';

    const d = new Date(date);
    const dNext = new Date(d);
    dNext.setDate(dNext.getDate() + 1);

    const orders = await prisma.order.findMany({
      where: {
        [dateField]: { gte: d, lt: dNext }
      },
      include: { client: true }
    });
    res.json(orders);
  } catch (error) { res.status(500).json({ error: error.message }); }
});



app.get('/api/dashboard/calendar', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      select: { id: true, receivedDate: true, dueDate: true, patientName: true, status: true, client: { select: { name: true } } }
    });
    const shipments = await prisma.shipmentNote.findMany({
      select: { id: true, noteDate: true, noteNumber: true, client: { select: { name: true } } }
    });

    const events = [];
    orders.forEach(o => {
      if (o.receivedDate) events.push({ type: 'start', date: o.receivedDate, title: `Start: ${o.patientName}`, client: o.client?.name, id: o.id });
      if (o.dueDate) events.push({ type: 'due', date: o.dueDate, title: `Due: ${o.patientName}`, client: o.client?.name, id: o.id });
    });
    shipments.forEach(s => {
      if (s.noteDate) events.push({ type: 'ship', date: s.noteDate, title: `Ship: ${s.noteNumber}`, client: s.client?.name, id: s.id });
    });

    res.json(events);
  } catch (error) { res.status(500).json({ error: error.message }); }
});
// --- MATERIALS / STOCK ---
app.get('/api/materials', async (req, res) => {
  try {
    const { search, category } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search } }
      ];
    }
    if (category && category !== 'All') where.category = category;
    
    let materials = await prisma.material.findMany({ where, orderBy: { name: 'asc' } });
    
    // Auto-seed if empty for demo purposes
    if (materials.length === 0 && !search && category === 'All') {
        const demo = [
            { name: '3D EXPANSION SCREW', category: 'ORTHO', stock: 2, unit: 'pc', minStock: 0 },
            { name: '3D PRINTER FILM', category: 'RESINS', stock: 11, unit: 'pc', minStock: 0 },
            { name: '3D PRINTER TANK', category: 'ZIRCON', stock: 1, unit: 'pc', minStock: 0 },
            { name: 'ACRYLIC POWDER - BLACK 40 GM', category: 'ORTHO', stock: 1, unit: 'Bottle', minStock: 0 },
            { name: 'ALGINATE ALGINPLUS (453 GM)', category: 'ACRYLIC', stock: 0, unit: 'Packet', minStock: 0 },
            { name: 'BASE PASTE TUBE', category: 'CERAMIC', stock: 17, unit: 'Tube', minStock: 0 },
            { name: 'BASE PLATE', category: 'ACRYLIC', stock: 17, unit: 'Box', minStock: 0 },
        ];
        for (const m of demo) await prisma.material.create({ data: m });
        materials = await prisma.material.findMany({ where, orderBy: { name: 'asc' } });
    }
    // Map minStock to reorderLevel for UI parity
    const mapped = materials.map(m => ({ ...m, reorderLevel: m.minStock || 0 }));
    res.json(mapped);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/materials', async (req, res) => {
  try {
    const data = { ...req.body };
    data.stock = toNum(data.stock) || 0;
    data.minStock = toNum(data.reorderLevel) || toNum(data.minStock) || 0;
    const material = await prisma.material.create({ data });
    res.status(201).json(material);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// --- INVENTORY TRANSACTIONS (JSON Fallback) ---
const TRANSACTIONS_FILE = path.join(__dirname, 'inventory_transactions.json');

function getTransactions() {
  if (!fs.existsSync(TRANSACTIONS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(TRANSACTIONS_FILE, 'utf8'));
  } catch (e) { return []; }
}

app.get('/api/inventory/transactions', async (req, res) => {
  try {
    const { type, search } = req.query;
    let transactions = getTransactions();
    
    if (type) transactions = transactions.filter(t => t.type === type);
    if (search) {
      const q = search.toLowerCase();
      transactions = transactions.filter(t => 
        (t.docNumber && t.docNumber.toLowerCase().includes(q)) ||
        (t.supplier && t.supplier.toLowerCase().includes(q)) ||
        (t.materialName && t.materialName.toLowerCase().includes(q))
      );
    }
    
    res.json(transactions.reverse()); // Newest first
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/inventory/transactions', async (req, res) => {
  try {
    const { type, materialId, quantity, date, supplier, docNumber, notes } = req.body;
    
    const material = await prisma.material.findUnique({ where: { id: Number(materialId) } });
    if (!material) return res.status(404).json({ error: 'Material not found' });

    const newTransaction = {
      id: Date.now(),
      type,
      materialId: Number(materialId),
      materialName: material.name,
      quantity: Number(quantity),
      date: date || new Date().toISOString(),
      supplier,
      docNumber,
      notes,
      createdAt: new Date().toISOString()
    };

    // Save to JSON
    const transactions = getTransactions();
    transactions.push(newTransaction);
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(transactions, null, 2));

    // Update Prisma stock
    const updateQty = type === 'Inward' ? Number(quantity) : -Number(quantity);
    await prisma.material.update({
      where: { id: Number(materialId) },
      data: { stock: { increment: updateQty } }
    });

    res.status(201).json(newTransaction);
  } catch (error) { res.status(500).json({ error: error.message }); }
});


// --- STAFF / OFFICE ---
app.get('/api/staff', async (req, res) => {
  try {
    const staff = await prisma.staff.findMany();
    res.json(staff);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/staff', async (req, res) => {
  try {
    const data = { ...req.body };
    data.salary = toNum(data.salary) || 0;
    const staff = await prisma.staff.create({ data });
    res.status(201).json(staff);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/staff/:id', async (req, res) => {
  try {
    await prisma.staff.delete({ where: { id: parseInt(req.params.id) } });
    res.status(204).send();
  } catch (error) { res.status(500).json({ error: error.message }); }
});


// --- BACKUP & EXPORT ---
app.get('/api/backup/system', (req, res) => {
  const { exec } = require('child_process');
  const tempDir = path.join(__dirname, 'temp');
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
  const backupFile = path.join(tempDir, 'system_backup.zip');
  const dbFile = path.join(__dirname, 'prisma', 'dev.db');
  const envFile = path.join(__dirname, '.env');
  
  const cmd = `powershell -Command "Compress-Archive -Path '${dbFile}', '${envFile}' -DestinationPath '${backupFile}' -Force"`;
  exec(cmd, (error) => {
    if (error) return res.status(500).json({ error: error.message });
    res.download(backupFile, 'SoharDental_SystemBackup.zip');
  });
});

app.get('/api/backup/data', async (req, res) => {
  try {
    const data = {
      clients: await prisma.client.findMany(),
      orders: await prisma.order.findMany(),
      invoices: await prisma.invoice.findMany(),
      receipts: await prisma.receipt.findMany(),
      expenses: await prisma.expense.findMany(),
      staff: await prisma.staff.findMany(),
      materials: await prisma.material.findMany(),
      products: await prisma.product.findMany()
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=SoharDental_DataExport.json');
    res.send(JSON.stringify(data, null, 2));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/backup/orders-csv', async (req, res) => {
  try {
    const orders = await prisma.order.findMany({ include: { client: true } });
    const headers = ['Order #', 'Order Date', 'Client Name', 'Patient Name', 'Product Type', 'Product Name', 'Model #', 'Status', 'Due Date', 'Total Amount', 'Discount', 'Tax', 'Net Amount'];
    const rows = orders.map(o => [
      o.orderNumber || o.id,
      o.receivedDate ? new Date(o.receivedDate).toISOString().split('T')[0] : 'N/A',
      o.client ? `"${o.client.name.replace(/"/g, '""')}"` : 'N/A',
      `"${(o.patientName || '').replace(/"/g, '""')}"`,
      `"${(o.productType || '').replace(/"/g, '""')}"`,
      `"${(o.productName || '').replace(/"/g, '""')}"`,
      `"${(o.modelNumber || '').replace(/"/g, '""')}"`,
      o.status,
      o.dueDate ? new Date(o.dueDate).toISOString().split('T')[0] : 'N/A',
      o.totalAmount || 0,
      o.discountAmount || 0,
      o.taxAmount || 0,
      o.netAmount || 0
    ]);
    const csvContent = [headers, ...rows].map(r => r.join(',')).join('\n');
    // Add UTF-8 BOM for Excel
    const BOM = '\uFEFF';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=SoharDental_Orders_Full.csv');
    res.send(BOM + csvContent);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
