const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllShades = async (req, res) => {
  try {
    const shades = await prisma.shades.findMany({
      include: {
        brands: true,
        blends: true
      },
      orderBy: { shade_name: 'asc' }
    });
    res.json(shades);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shades' });
  }
};

const getShadeById = async (req, res) => {
  try {
    const shade = await prisma.shades.findUnique({
      where: { id: req.params.id },
      include: {
        brands: true,
        blends: true
      }
    });
    if (!shade) return res.status(404).json({ error: 'Shade not found' });
    res.json(shade);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch shade' });
  }
};

const createShade = async (req, res) => {
  const {
    shade_code,
    brand_id,
    blend_id,
    shade_name,
    percentage,
    available_stock_kg
  } = req.body;

  try {
    const shade = await prisma.shades.create({
      data: {
        shade_code,
        brand_id,
        blend_id,
        shade_name,
        percentage,
        available_stock_kg
      }
    });
    res.status(201).json(shade);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create shade' });
  }
};

const updateShade = async (req, res) => {
  try {
    const updated = await prisma.shades.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update shade' });
  }
};

const deleteShade = async (req, res) => {
  try {
    await prisma.shades.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Shade deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete shade' });
  }
};

module.exports = {
  getAllShades,
  getShadeById,
  createShade,
  updateShade,
  deleteShade
};