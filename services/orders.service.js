const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Get all orders for a tenant
exports.getAllOrders = async (tenant_id) => {
  return await prisma.orders.findMany({
    where: { tenant_id },
    include: {
      buyer: true,
      shade: {
        include: {
          shade_fibres: {
            include: {
              fibre: true
            }
          }
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });
};

// 2. Get order by ID
exports.getOrderById = async (id) => {
  return await prisma.orders.findUnique({
    where: { id },
    include: {
      buyer: true,
      shade: {
        include: {
          shade_fibres: {
            include: {
              fibre: true
            }
          }
        }
      }
    }
  });
};

// 3. Create a new order
exports.createOrder = async (data) => {
    const { buyer_id, shade_id, realisation, ...rest } = data;
  
    const timestamp = Date.now().toString().slice(-6);
    const order_number = `SO-${timestamp}`;
  
    const existing = await prisma.orders.findUnique({
      where: { order_number },
    });
  
    if (existing) {
      throw new Error('Order number already exists (race condition)');
    }
  
    return await prisma.orders.create({
      data: {
        ...rest,
        buyer_id,
        shade_id,
        order_number,
        delivery_date: new Date(data.delivery_date),
        status: data.status || 'pending',
        realisation: realisation ? new PrismaClient().$decimal(realisation) : undefined, // optional
      },
    });
  };

// 4. Update full order by ID
exports.updateOrder = async (id, data) => {
    const updateData = { ...data };
  
    // ✅ Only parse delivery_date if provided and valid
    if (data.delivery_date) {
      const parsedDate = new Date(data.delivery_date);
      if (!isNaN(parsedDate)) {
        updateData.delivery_date = parsedDate;
      } else {
        delete updateData.delivery_date; // prevent crash from invalid date
      }
    }
  
    return await prisma.orders.update({
      where: { id },
      data: updateData,
    });
  };

// 5. Update only the status
exports.updateOrderStatus = async (id, status) => {
  return await prisma.orders.update({
    where: { id },
    data: { status }
  });
};

// 6. Delete order
exports.deleteOrder = async (id) => {
  return await prisma.orders.delete({
    where: { id }
  });
};