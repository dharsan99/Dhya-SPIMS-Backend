const { PrismaClient } = require('@prisma/client');
const { validate: isUUID } = require('uuid');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

/**
 * ✅ Create a new fibre (with optional category_id)
 */
exports.createFibre = async (data) => {
  console.log('📦 Received data for fibre creation:', data);
  
  // Handle both camelCase and snake_case field names
  const fibre_name = data.fibre_name || data.fibreName;
  const fibre_code = data.fibre_code || data.fibreCode;
  const stock_kg = data.stock_kg || data.stockKg;
  const category_id = data.category_id || data.categoryId;
  const description = data.description;
  const closing_stock = data.closing_stock || data.closingStock;
  const consumed_stock = data.consumed_stock || data.consumedStock;
  const inward_stock = data.inward_stock || data.inwardStock;
  const outward_stock = data.outward_stock || data.outwardStock;
  
  console.log('🔍 Processed values:', {
    fibre_name,
    fibre_code,
    stock_kg,
    category_id,
    description,
    closing_stock,
    consumed_stock,
    inward_stock,
    outward_stock
  });

  // Validate required fields
  if (!fibre_code) {
    throw new Error('fibre_code is required');
  }
  if (!fibre_name) {
    throw new Error('fibre_name is required');
  }
  if (stock_kg === undefined || stock_kg === null) {
    throw new Error('stock_kg is required');
  }

  return await prisma.fibre.create({
    data: {
      fibreName: fibre_name,
      fibreCode: fibre_code,
      stockKg: stock_kg,
      categoryId: category_id,
      description: description,
      closingStock: closing_stock,
      consumedStock: consumed_stock,
      inwardStock: inward_stock,
      outwardStock: outward_stock,
    },
  });
};

/**
 * ✅ Get all fibres with category info
 */
exports.getAllFibres = async () => {
  return await prisma.fibre.findMany({
    orderBy: { fibreName: 'asc' },
    include: {
      category: true,
    },
  });
};

/**
 * ✅ Get a single fibre by ID (with category) with UUID validation
 */
exports.getFibreById = async (id) => {
  if (!isUUID(id)) throw new Error(`Invalid UUID for fibre ID: ${id}`);

  return await prisma.fibre.findUnique({
    where: { id },
    include: {
      category: true,
    },
  });
};

/**
 * ✅ Update fibre (with UUID validation)
 */
exports.updateFibre = async (id, data) => {
  if (!isUUID(id)) throw new Error(`Invalid UUID for fibre ID: ${id}`);

  // Handle both camelCase and snake_case field names
  const fibre_name = data.fibre_name || data.fibreName;
  const fibre_code = data.fibre_code || data.fibreCode;
  const stock_kg = data.stock_kg || data.stockKg;
  const category_id = data.category_id || data.categoryId;
  const description = data.description;
  const closing_stock = data.closing_stock || data.closingStock;
  const consumed_stock = data.consumed_stock || data.consumedStock;
  const inward_stock = data.inward_stock || data.inwardStock;
  const outward_stock = data.outward_stock || data.outwardStock;

  const updateData = {};
  
  if (fibre_name !== undefined) updateData.fibreName = fibre_name;
  if (fibre_code !== undefined) updateData.fibreCode = fibre_code;
  if (stock_kg !== undefined) updateData.stockKg = stock_kg;
  if (category_id !== undefined) updateData.categoryId = category_id;
  if (description !== undefined) updateData.description = description;
  if (closing_stock !== undefined) updateData.closingStock = closing_stock;
  if (consumed_stock !== undefined) updateData.consumedStock = consumed_stock;
  if (inward_stock !== undefined) updateData.inwardStock = inward_stock;
  if (outward_stock !== undefined) updateData.outwardStock = outward_stock;

  return await prisma.fibre.update({
    where: { id },
    data: updateData,
  });
};

/**
 * ✅ Delete fibre (with UUID validation)
 */
exports.deleteFibre = async (id) => {
  if (!isUUID(id)) throw new Error(`Invalid UUID for fibre ID: ${id}`);

  return await prisma.fibre.delete({
    where: { id },
  });
};

/**
 * ✅ Get all fibre categories
 */
exports.getAllFibreCategories = async () => {
  return await prisma.fibreCategory.findMany({
    orderBy: { name: 'asc' },
  });
};

/**
 * ✅ Create a new fibre category
 */
exports.createFibreCategory = async (data) => {
  return await prisma.fibreCategory.create({
    data,
  });
};

/**
 * ✅ Update a fibre category by ID
 */
exports.updateFibreCategory = async (id, data) => {
  if (!isUUID(id)) throw new Error(`Invalid UUID for category ID: ${id}`);

  return await prisma.fibreCategory.update({
    where: { id },
    data,
  });
};

/**
 * ✅ Delete a fibre category
 */
exports.deleteFibreCategory = async (id) => {
  if (!isUUID(id)) throw new Error(`Invalid UUID for category ID: ${id}`);

  return await prisma.fibreCategory.delete({
    where: { id },
  });
};

/**
 * ✅ Get low stock fibres (< 200kg)
 */
exports.getLowStockFibres = async () => {
  try {
    return await prisma.fibre.findMany({
      where: {
        stockKg: {
          lt: new Decimal(200),
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        stockKg: 'asc',
      },
    });
  } catch (error) {
    console.error('🔥 Error in getLowStockFibres:', error);
    throw error; // Throw the original error for better debugging
  }
};

/**
 * ✅ Get fibre usage trend data grouped by day
 */
exports.getFiberUsageTrend = async (fibreId) => {
  if (!isUUID(fibreId)) throw new Error(`Invalid UUID for fibre ID: ${fibreId}`);

  return await prisma.fibreUsageLog.groupBy({
    by: ['timestamp'],
    where: { fibreId: fibreId },
    _sum: {
      quantity: true,
    },
    orderBy: {
      timestamp: 'desc',
    },
  });
};