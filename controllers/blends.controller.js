const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllBlends = async (req, res) => {
  const blends = await prisma.blends.findMany();
  res.json(blends);
};

const getBlendById = async (req, res) => {
  const blend = await prisma.blends.findUnique({ where: { id: req.params.id } });
  if (!blend) return res.status(404).json({ error: 'Blend not found' });
  res.json(blend);
};

const createBlend = async (req, res) => {
  const { blend_code, description } = req.body;

  const blend = await prisma.blends.create({
    data: { blend_code, description }
  });

  res.status(201).json(blend);
};

const updateBlend = async (req, res) => {
  const updated = await prisma.blends.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(updated);
};

const deleteBlend = async (req, res) => {
  await prisma.blends.delete({ where: { id: req.params.id } });
  res.json({ message: 'Blend deleted' });
};

module.exports = {
  getAllBlends,
  getBlendById,
  createBlend,
  updateBlend,
  deleteBlend
};