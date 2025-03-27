const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.orders.findMany({
      include: {
        yarns: true,
      },
      orderBy: { created_at: 'desc' }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { id: req.params.id },
      include: { yarns: true }
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
};

const createOrder = async (req, res) => {
  const { tenant_id, order_number, buyer_name, yarn_id, quantity_kg, delivery_date, created_by } = req.body;

  try {
    const existing = await prisma.orders.findUnique({ where: { order_number } });
    if (existing) return res.status(409).json({ error: 'Order number already exists' });

    const order = await prisma.orders.create({
      data: {
        tenant_id,
        order_number,
        buyer_name,
        yarn_id,
        quantity_kg,
        delivery_date: new Date(delivery_date),
        status: 'pending',
        created_by
      }
    });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
};

const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'in_progress', 'dispatched'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const updated = await prisma.orders.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};