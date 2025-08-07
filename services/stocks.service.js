const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllStocks = async () => {
  const stocks = await prisma.stock.findMany({
    include: {
      fibre: {
        include: { category: true }
      }
    }
  });

  return stocks.map(item => ({
    id: item.id,
    fibreId: item.fibreId,
    fibreName: item.fibre.fibreName,
    category: item.fibre.category ? item.fibre.category.name : null,
    stockKg: Number(item.stockKg),
    thresholdKg: Number(item.thresholdKg),
    lastUpdated: item.lastUpdated,
    createdAt: item.createdAt
  }));
};

const createStock = async (data) => {
  const { fibreId, categoryId, stockKg, thresholdKg } = data;
  const stock = await prisma.stock.create({
    data: {
      fibreId,
      categoryId, // <-- Add this
      stockKg,
      thresholdKg
    },
    include: {
      fibre: { include: { category: true } },
      category: true // <-- Add this
    }
  });
  return {
    id: stock.id,
    fibreId: stock.fibreId,
    categoryId: stock.categoryId,
    fibreName: stock.fibre.fibreName,
    category: stock.category ? stock.category.name : null,
    stockKg: Number(stock.stockKg),
    thresholdKg: Number(stock.thresholdKg),
    lastUpdated: stock.lastUpdated,
    createdAt: stock.createdAt
  };
};

const updateStock = async (id, data) => {
  const { fibreId, categoryId, stockKg, thresholdKg } = data;
  const stock = await prisma.stock.update({
    where: { id },
    data: {
      fibreId,
      categoryId, // <-- Add this
      stockKg,
      thresholdKg
    },
    include: {
      fibre: { include: { category: true } },
      category: true // <-- Add this
    }
  });
  return {
    id: stock.id,
    fibreId: stock.fibreId,
    categoryId: stock.categoryId,
    fibreName: stock.fibre.fibreName,
    category: stock.category ? stock.category.name : null,
    stockKg: Number(stock.stockKg),
    thresholdKg: Number(stock.thresholdKg),
    lastUpdated: stock.lastUpdated,
    createdAt: stock.createdAt
  };
};

const deleteStock = async (id) => {
  await prisma.stock.delete({ where: { id } });
};

module.exports = { getAllStocks, createStock, updateStock, deleteStock };