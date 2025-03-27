const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllProduction = async (req, res) => {
  try {
    const records = await prisma.production.findMany({
      include: {
        orders: true
      },
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch production data' });
  }
};

const getProductionById = async (req, res) => {
  try {
    const record = await prisma.production.findUnique({
      where: { id: req.params.id }
    });
    if (!record) return res.status(404).json({ error: 'Not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Error retrieving production record' });
  }
};

const addProductionEntry = async (req, res) => {
  const {
    tenant_id,
    date,
    section,
    shift,
    value,
    linked_order_id,
    entered_by
  } = req.body;

  try {
    const entry = await prisma.production.create({
      data: {
        tenant_id,
        date: new Date(date),
        section,
        shift,
        value,
        linked_order_id,
        entered_by
      }
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create production entry' });
  }
};

const updateProductionEntry = async (req, res) => {
  try {
    const updated = await prisma.production.update({
      where: { id: req.params.id },
      data: req.body
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update production entry' });
  }
};

module.exports = {
  getAllProduction,
  getProductionById,
  addProductionEntry,
  updateProductionEntry
};