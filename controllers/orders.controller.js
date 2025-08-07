const xlsx = require('xlsx');
const fs = require('fs');
const orderService = require('../services/orders.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendOrderConfirmationEmail } = require('../utils/email');


const isUUID = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const bulkImportOrders = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const created = [];
  const errors = [];

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const rowIndex = i + 2;

      const {
        orderNumber,
        buyerId,
        shadeId,
        quantity,
        deliveryDate,
        status = 'pending',
        tenantId,
        realisation,
        count
      } = row;

      // ✅ Validate required fields
      if (!orderNumber || !buyerId || !shadeId || !tenantId || !quantity || !deliveryDate) {
        errors.push({ row: rowIndex, reason: 'Missing required fields' });
        continue;
      }

      if (!isUUID(buyerId)) {
        errors.push({ row: rowIndex, reason: 'Invalid buyerId UUID' });
        continue;
      }

      if (!isUUID(shadeId)) {
        errors.push({ row: rowIndex, reason: 'Invalid shadeId UUID' });
        continue;
      }

      if (!isUUID(tenantId)) {
        errors.push({ row: rowIndex, reason: 'Invalid tenantId UUID' });
        continue;
      }

      if (isNaN(quantity) || Number(quantity) <= 0) {
        errors.push({ row: rowIndex, reason: 'Invalid quantity' });
        continue;
      }

      if (isNaN(Date.parse(deliveryDate))) {
        errors.push({ row: rowIndex, reason: 'Invalid deliveryDate' });
        continue;
      }

      // ✅ Ensure buyer and shade exist
      const [buyer, shade] = await Promise.all([
        prisma.buyers.findUnique({ where: { id: buyerId } }),
        prisma.shades.findUnique({ where: { id: shadeId } }),
      ]);

      if (!buyer) {
        errors.push({ row: rowIndex, reason: 'Buyer not found' });
        continue;
      }

      if (!shade) {
        errors.push({ row: rowIndex, reason: 'Shade not found' });
        continue;
      }

      try {
        const order = await orderService.createOrder({
          orderNumber,
          buyerId,
          shadeId,
          quantity: Number(quantity),
          deliveryDate: new Date(deliveryDate),
          status,
          tenantId,
          realisation: realisation ? parseFloat(realisation) : undefined,
          count: count ? parseInt(count) : undefined
        });

        created.push(order);
      } catch (err) {
        errors.push({ row: rowIndex, reason: `Failed to insert: ${err.message}` });
      }
    }

    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: 'Bulk upload complete',
      createdCount: created.length,
      errorCount: errors.length,
      errors
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process Excel file' });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenant ID in token' });
    }

    const orders = await orderService.getAllOrders(tenantId);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await orderService.getOrderById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: error.message });
  }
};

const createOrder = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: 'Missing tenant ID in token' });
    }

    // Validate required fields
    const { orderNumber, buyerId, shadeId, quantity, deliveryDate } = req.body;
    
    if (
      !orderNumber ||
      !buyerId ||
      !shadeId ||
      quantity === undefined ||
      quantity === null ||
      !deliveryDate
    ) {
      return res.status(400).json({ 
        error: 'Missing required fields: orderNumber, buyerId, shadeId, quantity, deliveryDate' 
      });
    }
    // Validate quantity
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    // Validate delivery date
    if (isNaN(Date.parse(deliveryDate))) {
      return res.status(400).json({ error: 'Invalid delivery date format' });
    }

    const orderData = {
      ...req.body,
      tenantId: tenantId
    };

    const order = await orderService.createOrder(orderData);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
};

const updateOrder = async (req, res) => {
  try {
    const order = await orderService.updateOrder(req.params.id, req.body);
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteOrder = async (req, res) => {
  try {
    await orderService.deleteOrder(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: error.message });
  }
};

const getOrderProgressDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const progress = await orderService.getProgressDetails(id);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress details' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  bulkImportOrders,
  getOrderProgressDetails
};