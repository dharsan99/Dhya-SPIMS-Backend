const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ Create a new shade with fibres and raw cotton composition
const createShade = async (data) => {
  try {
    const { fibres = [], rawCottonCompositions = [], ...shadeData } = data;

    // Create the shade with fibres and cotton compositions
    const shade = await prisma.shade.create({
      data: {
        ...shadeData,
        shadeFibres: fibres.length > 0 ? {
          create: fibres.map(fibre => ({
            fibreId: fibre.fibreId,
            percentage: fibre.percentage
          }))
        } : undefined,
        rawCottonCompositions: (() => {
          const validCompositions = rawCottonCompositions.filter(composition => 
            composition.percentage > 0 && 
            composition.cottonId && 
            composition.cottonId.trim() !== ''
          );
          
          return validCompositions.length > 0 ? {
            create: validCompositions.map(composition => ({
              percentage: composition.percentage,
              cotton: {
                connect: { id: composition.cottonId }
              }
            }))
          } : undefined;
        })()
      },
      include: {
        shadeFibres: {
          include: {
            fibre: true
          }
        },
        rawCottonCompositions: {
          include: {
            cotton: true
          }
        }
      }
    });

    return shade;
  } catch (error) {
    console.error('Error creating shade:', error);
    throw new Error(error.message || 'Failed to create shade');
  }
};

// ✅ Update a shade and replace its fibre composition
async function updateShade(id, data) {
  try {
    // Accept blendFibres and filter valid ones
    const fibres = (data.blendFibres || []).filter(
      f => f.percentage > 0 && f.fibreId && f.fibreId.trim() !== ''
    );

    // Filter valid raw cotton compositions
    const validCottons = (data.rawCottonCompositions || []).filter(
      c => c.percentage > 0 && c.cottonId && c.cottonId.trim() !== ''
    );

    // Remove blendFibres and rawCottonCompositions from updateData
    const { blendFibres, rawCottonCompositions, tenantId, ...updateData } = data;

    // Build update object for Prisma
    const prismaUpdate = { ...updateData };
    if (tenantId) {
      prismaUpdate.tenant = { connect: { id: tenantId } };
    }

    // Update the shade main fields (do NOT include fibres/blendFibres/rawCottonCompositions here)
    await prisma.shade.update({
      where: { id },
      data: prismaUpdate
    });

    // Update fibres: delete all, then add new
    await prisma.shadeFibre.deleteMany({ where: { shadeId: id } });
    if (fibres.length > 0) {
      await Promise.all(
        fibres.map(fibre =>
          prisma.shadeFibre.create({
            data: {
              shadeId: id,
              fibreId: fibre.fibreId,
              percentage: fibre.percentage
            }
          })
        )
      );
    }

    // Update raw cotton compositions: delete all, then add new
    await prisma.rawCottonComposition.deleteMany({ where: { shadeId: id } });
    if (validCottons.length > 0) {
      await Promise.all(
        validCottons.map(composition =>
          prisma.rawCottonComposition.create({
            data: {
              shadeId: id,
              percentage: composition.percentage,
              cotton: {
                connect: { id: composition.cottonId }
              },
              lotNumber: composition.lotNumber,
              grade: composition.grade,
              source: composition.source,
              notes: composition.notes
            }
          })
        )
      );
    }

    // Return the updated shade with relations (like POST)
    return await prisma.shade.findUnique({
      where: { id },
      include: {
        shadeFibres: { include: { fibre: true } },
        rawCottonCompositions: { include: { cotton: true } }
      }
    });
  } catch (error) {
    console.error('Error updating shade:', error);
    throw new Error(error.message || 'Failed to update shade');
  }
}

// ✅ Get all shades
const getAllShades = async () => {
  try {
    const shades = await prisma.shade.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        shadeFibres: {
          include: {
            fibre: {
              include: {
                category: true
              }
            }
          }
        },
        rawCottonCompositions: {
          include: {
            cotton: true
          }
        }
      }
    });

    // Transform the response to include blend_composition
    return shades.map(shade => ({
      ...shade,
      blendComposition: shade.shadeFibres.map(fibre => ({
        fibreId: fibre.fibreId,
        percentage: fibre.percentage,
        fibre: fibre.fibre
      }))
    }));
  } catch (error) {
    console.error('Error fetching shades:', error);
    throw new Error('Failed to fetch shades');
  }
};

// ✅ Get shade by ID
const getShadeById = async (id) => {
  try {
    const shade = await prisma.shade.findUnique({
      where: { id },
      include: {
        shadeFibres: {
          include: {
            fibre: true
          }
        },
        rawCottonCompositions: {
          include: {
            cotton: true
          }
        }
      }
    });

    if (!shade) {
      throw new Error('Shade not found');
    }

    // Transform the response to include blend_composition
    return {
      ...shade,
      blendComposition: shade.shadeFibres.map(fibre => ({
        fibreId: fibre.fibreId,
        percentage: fibre.percentage,
        fibre: fibre.fibre
      }))
    };
  } catch (error) {
    console.error('Error fetching shade:', error);
    throw new Error(error.message || 'Failed to fetch shade');
  }
};

// ✅ Delete shade and its composition
const deleteShade = async (id) => {
  try {
    // Delete associated fibres first
    await prisma.shadeFibre.deleteMany({
      where: { shadeId: id }
    });

    // Delete associated raw cotton compositions
    await prisma.rawCottonComposition.deleteMany({
      where: { shadeId: id }
    });

    // Delete the shade
    return await prisma.shade.delete({
      where: { id }
    });
  } catch (error) {
    console.error('Error deleting shade:', error);
    throw new Error(error.message || 'Failed to delete shade');
  }
};

// ✅ Optional: Shade stock summary
const getShadeStockSummary = async () => {
  return await prisma.shade.groupBy({
    by: ['id'],
    _count: {
      id: true,
    },
    orderBy: {
      id: 'desc',
    },
  });
};

module.exports = {
  createShade,
  updateShade,
  getAllShades,
  getShadeById,
  deleteShade,
  getShadeStockSummary,
};