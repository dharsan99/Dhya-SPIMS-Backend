const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Create Blend
async function createBlend({ blend_code, description }) {
  return await prisma.blend.create({
    data: {
      blendCode: blend_code,
      description,
    },
  });
}

// ✅ Get All Blends with fibres and related shades
async function getAllBlends() {
  return await prisma.blend.findMany({
    include: {
      blendFibres: {
        include: {
          fibre: true,
        },
      },
    },
  });
}

// ✅ Get Blend by ID with fibre and shade composition
async function getBlendById(id) {
  return await prisma.blend.findUnique({
    where: { id },
    include: {
      blendFibres: {
        include: {
          fibre: true,
        },
      },
    },
  });
}

// ✅ Update Blend
async function updateBlend(id, data) {
  return await prisma.blend.update({
    where: { id },
    data: {
      blendCode: data.blend_code,
      description: data.description,
    },
  });
}

// ✅ Delete Blend
async function deleteBlend(id) {
  return await prisma.blend.delete({
    where: { id },
  });
}

// ✅ Blend Summary with calculated stock
async function getBlendSummary() {
  const blends = await prisma.blend.findMany({
    include: {
      blendFibres: {
        include: {
          fibre: true,
        },
      },
    },
  });

  return blends.map((blend) => {
    const fibres = blend.blendFibres
      .map((bf) => ({
        fibre_name: bf.fibre.fibreName,
        fibre_code: bf.fibre.fibreCode,
        percentage: bf.percentage,
        stock_kg: bf.fibre.stockKg.toNumber(),
      }))
      .sort((a, b) => b.percentage - a.percentage); // DESC by percentage

    const total_percentage = fibres.reduce((sum, f) => sum + f.percentage, 0);
    const isValid = total_percentage === 100;

    const possibleStocks = fibres.map((f) => (f.stock_kg * 100) / f.percentage);
    const total_stock_kg = Math.round(Math.min(...possibleStocks) * 100) / 100;

    return {
      blend_id: blend.id,
      blend_code: blend.blendCode,
      description: blend.description,
      total_percentage,
      is_valid: isValid,
      total_stock_kg,
      fibres,
    };
  });
}

// ✅ Fibre Usage Summary
async function getFibreUsageSummary() {
  const blendFibres = await prisma.blendFibre.findMany({
    include: {
      fibre: true,
    },
  });

  const usageMap = {};

  for (const bf of blendFibres) {
    const fibreKey = `${bf.fibre.fibreName} (${bf.fibre.fibreCode})`;

    const stock_kg = bf.fibre.stockKg.toNumber();
    const used_kg = Math.round((stock_kg * bf.percentage) / 100 * 100) / 100;

    if (!usageMap[fibreKey]) {
      usageMap[fibreKey] = {
        fibre_name: bf.fibre.fibreName,
        fibre_code: bf.fibre.fibreCode,
        total_stock: stock_kg,
        used_kg: 0,
      };
    }

    usageMap[fibreKey].used_kg += used_kg;
  }

  return Object.values(usageMap).sort((a, b) => b.used_kg - a.used_kg);
}

module.exports = {
  createBlend,
  getAllBlends,
  getBlendById,
  updateBlend,
  deleteBlend,
  getBlendSummary,
  getFibreUsageSummary,
};