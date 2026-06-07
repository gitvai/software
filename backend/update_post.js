const fs = require('fs');
const path = require('path');
const serverFile = path.join(process.argv[2], 'backend', 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// The replacement for POST /api/orders
const newPostOrders = pp.post('/api/orders', async (req, res) => {
  try {
    const data = { ...req.body };
    data.clientId = Number(data.clientId);
    
    // Extract jobs array if provided
    const jobsData = data.jobs || [];
    delete data.jobs;

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

    const allowedFields = [
      'orderNumber', 'orderType', 'clientId', 'doctorName', 'patientName', 'gender', 'age',
      'priority', 'status', 'receivedDate', 'dueDate', 'trialDate',
      'finishDate', 'hasUpperImpression', 'hasLowerImpression', 'hasBite', 'hasWaxUp',
      'hasOldRestoration', 'hasArticulator', 'hasPhotos', 'notes', 'price', 'discount', 'tax',
      'totalAmount', 'grossAmount', 'discountAmount', 'taxAmount', 'netAmount', 'technician',
      'department', 'modelNumber', 'panTrayNumber', 'deliveryMethod', 'articulatorTag',
      'manufacturer', 'subDoctor', 'dropLocation', 'timeSlot', 'shippingStatus',
      'shipmentNoteId', 'invoiceId', 'holdFrom', 'holdReason', 'cancelledOn', 'cancelledReason'
    ];

    const cleanData = {};
    allowedFields.forEach(f => {
      if (data[f] !== undefined) cleanData[f] = data[f];
    });

    // Handle nested jobs creation
    if (jobsData.length > 0) {
      cleanData.jobs = {
        create: jobsData.map(job => ({
          productType: job.productType || 'General',
          productName: job.productName,
          material: job.material,
          teethSelection: job.teethSelection,
          shade1: job.shade1,
          shade2: job.shade2,
          shade3: job.shade3,
          shadeNotes: job.shadeNotes,
          stumpShade: job.stumpShade,
          units: toNum(job.units) || 1,
          price: toNum(job.price) || 0,
          totalAmount: toNum(job.totalAmount) || 0,
          slab1Rate: toNum(job.slab1Rate),
          slab2Rate: toNum(job.slab2Rate),
          slab1Units: toNum(job.slab1Units),
          slab2Units: toNum(job.slab2Units)
        }))
      };
    } else {
        // Fallback for old requests that send single product data on the root
        if (data.productName) {
            cleanData.jobs = {
                create: [{
                  productType: data.productType || 'General',
                  productName: data.productName,
                  material: data.material,
                  teethSelection: data.teethSelection,
                  shade1: data.shade1,
                  shade2: data.shade2,
                  shade3: data.shade3,
                  shadeNotes: data.shadeNotes,
                  stumpShade: data.stumpShade,
                  units: toNum(data.units) || 1,
                  price: toNum(data.unitRate) || toNum(data.price) || 0,
                  totalAmount: toNum(data.totalAmount) || 0,
                  slab1Rate: toNum(data.slab1Rate),
                  slab2Rate: toNum(data.slab2Rate),
                  slab1Units: toNum(data.slab1Units),
                  slab2Units: toNum(data.slab2Units)
                }]
            };
        }
    }

    const order = await prisma.order.create({ 
        data: cleanData,
        include: { jobs: true }
    });
    res.status(201).json(order);
  } catch (error) { 
    console.error("Error creating order:", error);
    res.status(500).json({ error: error.message }); 
  }
});;

// Find the start and end of app.post('/api/orders', ...)
const startIdx = content.indexOf("app.post('/api/orders'");
const nextRouteIdx = content.indexOf("app.get('/api/orders/:id'", startIdx);

if (startIdx !== -1 && nextRouteIdx !== -1) {
    content = content.substring(0, startIdx) + newPostOrders + "\n\n  " + content.substring(nextRouteIdx);
    fs.writeFileSync(serverFile, content, 'utf8');
    console.log("Updated POST /api/orders");
} else {
    console.error("Could not find POST /api/orders bounds");
}