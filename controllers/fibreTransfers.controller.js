const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /fibreTransfers
exports.getAllFibreTransfers = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};
    
    const [transfers, total] = await Promise.all([
      prisma.fibreTransfer.findMany({
        where,
        include: {
          fibre: true,
          supplier: true,
        },
        orderBy: {
          sentDate: 'desc',
        },
        skip: Number(skip),
        take: Number(limit),
      }),
      prisma.fibreTransfer.count({ where })
    ]);

    res.status(200).json({
      data: transfers,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching fibre transfers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /fibreTransfers/:id
exports.getFibreTransferById = async (req, res) => {
  try {
    const { id } = req.params;
    const transfer = await prisma.fibreTransfer.findUnique({
      where: { id },
      include: {
        fibre: true,
        supplier: true,
      },
    });

    if (!transfer) {
      return res.status(404).json({ error: 'Fibre transfer not found' });
    }

    res.status(200).json(transfer);
  } catch (error) {
    console.error('❌ Error fetching fibre transfer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /fibreTransfers
exports.createFibreTransfer = async (req, res) => {
  try {
    const {
      fibreId,
      supplierId,
      sentKg,
      sentDate = new Date().toISOString(),
      expectedReturn = null,
      notes = '',
    } = req.body;

    if (!fibreId || !supplierId || !sentKg) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const created = await prisma.fibreTransfer.create({
      data: {
        fibreId,
        supplierId,
        sentKg: Number(sentKg),
        sentDate: new Date(sentDate),
        expectedReturn: expectedReturn ? new Date(expectedReturn) : null,
        notes,
        status: 'pending'
      },
      include: {
        fibre: true,
        supplier: true,
      }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('❌ Error creating fibre transfer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// PUT /fibreTransfers/:id
exports.updateFibreTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, returnedKg, returnDate, notes } = req.body;

    const updated = await prisma.fibreTransfer.update({
      where: { id },
      data: {
        status,
        returnedKg: returnedKg ? Number(returnedKg) : undefined,
        returnDate: returnDate ? new Date(returnDate) : undefined,
        notes
      },
      include: {
        fibre: true,
        supplier: true,
      }
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error('❌ Error updating fibre transfer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// DELETE /fibreTransfers/:id
exports.deleteFibreTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.fibreTransfer.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error) {
    console.error('❌ Error deleting fibre transfer:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
