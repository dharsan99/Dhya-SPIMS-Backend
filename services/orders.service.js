const prisma = require('../prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

// 1. Get all orders
exports.getAllOrders = async (tenantId) => {
  try {
    if (!tenantId) {
      throw new Error('Tenant ID is required');
    }

    return await prisma.order.findMany({
      where: { tenantId: tenantId },
      include: {
        buyer: true,
        shade: {
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
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    throw new Error('Failed to fetch orders');
  }
};

// 2. Get order by ID
exports.getOrderById = async (id) => {
  try {
    return await prisma.order.findUnique({
      where: { id },
      include: {
        buyer: true,
        shade: {
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
        }
      }
    });
  } catch (error) {
    throw new Error('Failed to fetch order');
  }
};

// 3. Create a new order
exports.createOrder = async (data) => {
  try {
    const { buyerId, shadeId, tenantId, ...orderData } = data;
    
    // Validate required fields
    if (!buyerId || !shadeId || !tenantId) {
      throw new Error('Missing required fields: buyerId, shadeId, tenantId');
    }

    // Check if buyer and shade exist
    const [buyer, shade] = await Promise.all([
      prisma.buyer.findUnique({
        where: { id: buyerId }
      }),
      prisma.shade.findUnique({
        where: { id: shadeId }
      })
    ]);

    // Optionally: Check if buyer and shade belong to the tenant
    if (!buyer) {
      throw new Error('Buyer not found');
    }
    if (!shade) {
      throw new Error('Shade not found');
    }
    if (buyer.tenantId && buyer.tenantId !== tenantId) {
      throw new Error('Buyer does not belong to this tenant');
    }
    if (shade.tenantId && shade.tenantId !== tenantId) {
      throw new Error('Shade does not belong to this tenant');
    }

    return await prisma.order.create({
      data: {
        ...orderData,
        tenantId: tenantId,
        buyer: { connect: { id: buyerId } },
        shade: { connect: { id: shadeId } },
        totalAmount: orderData.totalAmount !== undefined ? orderData.totalAmount : 0,
        unitPrice: orderData.unitPrice !== undefined ? orderData.unitPrice : 0,
        deliveryDate: orderData.deliveryDate ? new Date(orderData.deliveryDate) : undefined,
      },
      include: {
        
        buyer: true,
        shade: true
      }
    });
  } catch (error) {
    console.error('Create order error:', error);
    if (error.code === 'P2002') {
      throw new Error('Order number already exists');
    }
    if (error.code === 'P2003') {
      throw new Error('Invalid reference: buyer or shade not found');
    }
    throw new Error(error.message || 'Failed to create order');
  }
};
// ...existing code...
// 4. Update full order by ID
exports.updateOrder = async (id, data) => {
  try {
    // Check if order exists
    const existingOrder = await prisma.order.findUnique({
      where: { id },
      include: {
        shade: {
          include: {
            rawCottonCompositions: {
              include: {
                cotton: true
              }
            },
            shadeFibres: {
              include: {
                fibre: true
              }
            }
          }
        }
      }
    });

    if (!existingOrder) {
      throw new Error('Order not found');
    }

    // Validate delivery date
    if (data.deliveryDate && isNaN(Date.parse(data.deliveryDate))) {
      throw new Error('Invalid delivery date format');
    }

    // Validate quantity
    if (data.quantity !== undefined && (isNaN(data.quantity) || Number(data.quantity) <= 0)) {
      throw new Error('Invalid quantity value');
    }

    // Start a transaction to handle both order update and raw cotton compositions
    const updatedOrder = await prisma.$transaction(async (prisma) => {
      // Update the order
      const order = await prisma.order.update({
        where: { id },
        data: {
          orderNumber: data.orderNumber,
          quantity: data.quantity ? new Decimal(data.quantity.toString()) : undefined,
          unitPrice: data.unitPrice ? new Decimal(data.unitPrice.toString()) : undefined,
          totalAmount: data.totalAmount ? new Decimal(data.totalAmount.toString()) : undefined,
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
          status: data.status,
          notes: data.notes,
          buyer: data.buyerId ? {
            connect: {
              id: data.buyerId
            }
          } : undefined,
          shade: data.shadeId ? {
            connect: {
              id: data.shadeId
            }
          } : undefined
        },
        include: {
          buyer: true,
          shade: {
            include: {
              rawCottonCompositions: {
                include: {
                  cotton: true
                }
              },
              shadeFibres: {
                include: {
                  fibre: true
                }
              }
            }
          }
        }
      });

      // Handle raw cotton compositions if provided
      if (data.rawCottonCompositions && Array.isArray(data.rawCottonCompositions)) {
        // Delete existing compositions
        await prisma.rawCottonComposition.deleteMany({
          where: { shadeId: order.shade.id }
        });

        // Create new compositions
        if (data.rawCottonCompositions.length > 0) {
          await prisma.rawCottonComposition.createMany({
            data: data.rawCottonCompositions.map(rc => ({
              shadeId: order.shade.id,
              cottonId: rc.cottonId,
              percentage: new Decimal(rc.percentage.toString())
            }))
          });
        }
      }

      return order;
    });

    return updatedOrder;
  } catch (error) {
    console.error('Order update error:', error);
    if (error.code === 'P2025') {
      throw new Error('Order not found');
    }
    if (error.code === 'P2002') {
      throw new Error('Order number already exists');
    }
    if (error.code === 'P2003') {
      throw new Error('Invalid reference: buyer or shade not found');
    }
    throw error;
  }
};

// 5. Update only the status
exports.updateOrderStatus = async (id, status) => {
  try {
    return await prisma.order.update({
      where: { id },
      data: { status }
    });
  } catch (error) {
    throw new Error('Failed to update order status');
  }
};

// 6. Delete an order
exports.deleteOrder = async (id) => {
  try {
    return await prisma.order.delete({
      where: { id }
    });
  } catch (error) {
    throw new Error('Failed to delete order');
  }
};

// 7. Get orders by buyer ID
exports.getOrdersByBuyerId = async (buyerId) => {
  try {
    return await prisma.order.findMany({
      where: { buyerId },
    include: {
        buyer: true,
      shade: {
        include: {
            shadeFibres: {
              include: {
                fibre: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    throw new Error('Failed to fetch orders for buyer');
  }
};

// 8. Get orders by status
exports.getOrdersByStatus = async (status) => {
  try {
    return await prisma.order.findMany({
      where: { status },
      include: {
        buyer: true,
        shade: true
      },
      orderBy: { createdAt: 'desc' }
    });
  } catch (error) {
    throw new Error('Failed to fetch orders by status');
  }
};

// 9. Get order statistics
exports.getOrderStatistics = async () => {
  try {
    const totalOrders = await prisma.order.count();
    const pendingOrders = await prisma.order.count({
      where: { status: 'pending' }
    });
    const completedOrders = await prisma.order.count({
      where: { status: 'completed' }
    });
    const totalValue = await prisma.order.aggregate({
      _sum: {
        totalAmount: true
      }
    });

      return {
      totalOrders,
      pendingOrders,
      completedOrders,
      totalValue: totalValue._sum.totalAmount || 0
    };
  } catch (error) {
    throw new Error('Failed to fetch order statistics');
  }
};

// 10. Get order progress details
exports.getProgressDetails = async (orderId) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        productions:true
         
      }
    });

    if (!order) {
      throw new Error('Order not found');
    }

    // Calculate progress metrics
    const requiredQty = Number(order.quantity);
    let producedQty = 0;
    let totalEfficiency = 0;
    let efficiencyCount = 0;
    const productionDays = new Set();
    const noProductionDays = new Set();
    let topProductionDay = { date: null, production: 0 };

    // Process production data
    order.productions.forEach(production => {
      const dateKey = production.date.toISOString().split('T')[0];
      productionDays.add(dateKey);
      
      let dailyProduction = 0;
      production.logs.forEach(log => {
        const productionQty = Number(log.outputKg || 0);
        dailyProduction += productionQty;
        producedQty += productionQty;
        
        // Calculate efficiency (assuming 1000kg is the standard daily target)
        const efficiency = (productionQty / 1000) * 100;
        totalEfficiency += efficiency;
        efficiencyCount++;
      });

      // Track top production day
      if (dailyProduction > topProductionDay.production) {
        topProductionDay = {
          date: dateKey,
          production: dailyProduction
        };
      }
    });

    // Calculate average efficiency
    const averageEfficiency = efficiencyCount > 0 ? totalEfficiency / efficiencyCount : 0;

    // Generate list of days with no production (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      const dateKey = d.toISOString().split('T')[0];
      if (!productionDays.has(dateKey)) {
        noProductionDays.add(dateKey);
      }
    }

    return {
      requiredQty,
      producedQty,
      averageEfficiency: Math.round(averageEfficiency * 100) / 100,
      topProductionDay,
      noProductionDays: Array.from(noProductionDays).sort()
    };
  } catch (error) {
    console.error('Order progress details error:', error); // Add this line
    throw new Error('Failed to fetch progress details');
  }
};
