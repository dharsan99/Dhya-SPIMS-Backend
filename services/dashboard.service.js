const { PrismaClient, Decimal } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const billingService = require('./billing.service');

// Helper function to get date ranges
const getDateRanges = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  return {
    today,
    startOfMonth,
    startOfYear,
    lastWeek
  };
};

// Helper function to calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
};

// Helper function to calculate pending fiber shortages
const calculatePendingFiberShortages = async (tenantId) => {
  // Get all pending and in-progress orders
  const activeOrders = await prisma.order.findMany({
    where: {
      tenantId: tenantId,
      status: {
        in: ['pending', 'in_progress']
      }
    },
    include: {
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

  const shortages = new Set();

  for (const order of activeOrders) {
    const requiredQty = new Decimal(order.quantity).div(order.realisation || 100).mul(100);

    for (const sf of order.shade.shade_fibres) {
      const requiredFibreQty = requiredQty.mul(sf.percentage).div(100);
      const availableQty = new Decimal(sf.fibre.stockKg);

      if (availableQty.lessThan(requiredFibreQty)) {
        shortages.add(sf.fibreId);
      }
    }
  }

  return shortages.size;
};

// Helper function to calculate financial metrics
const calculateFinancialMetrics = async (tenantId) => {
  // Get all orders with their payments
  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenantId,
      status: {
        in: ['completed', 'dispatched']
      }
    },
    include: {
      buyer: true
    }
  });

  // Get all purchase orders with their payments
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: {
      tenantId: tenantId,
      status: {
        in: ['verified', 'converted']
      }
    },
    include: {
      items: true
    }
  });

  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Calculate receivables
  const receivables = {
    total: 0,
    overdue: 0
  };

  for (const order of orders) {
    const orderValue = new Decimal(order.quantity).mul(order.unitPrice || 0);
    receivables.total += Number(orderValue);

    if (order.deliveryDate < thirtyDaysAgo) {
      receivables.overdue += Number(orderValue);
    }
  }

  // Calculate payables
  const payables = {
    total: 0,
    overdue: 0
  };

  for (const po of purchaseOrders) {
    const poValue = po.items.reduce((sum, item) => 
      sum + Number(new Decimal(item.quantity).mul(item.rate)), 0);
    payables.total += poValue;

    if (po.poDate < thirtyDaysAgo) {
      payables.overdue += poValue;
    }
  }

  return { receivables, payables };
};

// Helper function to calculate production metrics
const calculateProductionMetrics = async (tenantId, startOfMonth) => {
  // Get all productions for the tenant
  const productions = await prisma.production.findMany({
    where: {
      tenantId: tenantId,
      date: {
        gte: startOfMonth
      }
    },
    orderBy: {
      date: 'desc'
    },
    include: {
      logs: true
    }
  });

  // Calculate total production
  const totalProduction = productions.reduce((sum, p) => sum + Number(p.total || 0), 0);

  // Calculate daily averages
  const uniqueDays = new Set(productions.map(p => p.date.toISOString().split('T')[0]));
  const avgDailyProduction = uniqueDays.size > 0 ? totalProduction / uniqueDays.size : 0;

  // Calculate section-wise production and quality metrics
  const sectionMetrics = productions.reduce((acc, p) => {
    const sections = ['blow_room', 'carding', 'drawing', 'framing', 'simplex', 'spinning', 'autoconer'];
    sections.forEach(section => {
      if (!acc[section]) {
        acc[section] = {
          totalProduction: 0,
          totalRequired: 0,
          downtime: 0,
          qualityIssues: 0,
          entries: [],
          efficiency: 0,
          totalEfficiency: 0,
          efficiencyCount: 0
        };
      }

      // Get logs for this section
      const sectionLogs = p.logs.filter(log => log.section.toLowerCase() === section);
      
      sectionLogs.forEach(log => {
        const production = Number(log.outputKg || 0);
          const required = 1000; // Fixed required quantity for other sections
          
          acc[section].totalProduction += production;
          acc[section].totalRequired += required;
        acc[section].entries.push(log);

          // Calculate efficiency for this entry
          const efficiency = (production / required) * 100;
          acc[section].totalEfficiency += efficiency;
          acc[section].efficiencyCount++;

        if (log.remarks?.toLowerCase().includes('downtime')) {
            acc[section].downtime++;
          }
        if (log.remarks?.toLowerCase().includes('quality') || 
            log.remarks?.toLowerCase().includes('defect')) {
            acc[section].qualityIssues++;
        }
      });
    });

    return acc;
  }, {});

  // Calculate final section metrics
  const sectionProduction = {};
  const sectionQuality = {};
  const sectionDowntime = {};
  const sectionEfficiency = {};

  Object.entries(sectionMetrics).forEach(([section, metrics]) => {
    // Production metrics
    sectionProduction[section] = metrics.totalProduction;
    
    // Quality metrics
    const totalEntries = metrics.entries.length;
    sectionQuality[section] = {
      totalIssues: metrics.qualityIssues,
      issueRate: totalEntries > 0 ? (metrics.qualityIssues / totalEntries) * 100 : 0
    };
    
    // Downtime metrics
    sectionDowntime[section] = {
      totalIncidents: metrics.downtime,
      downtimeRate: totalEntries > 0 ? (metrics.downtime / totalEntries) * 100 : 0
    };

    // Efficiency metrics
    const overallEfficiency = (metrics.totalProduction / metrics.totalRequired) * 100;
    const averageEfficiency = metrics.efficiencyCount > 0 ? metrics.totalEfficiency / metrics.efficiencyCount : 0;

    sectionEfficiency[section] = {
      overall: overallEfficiency,
      average: averageEfficiency
    };
  });

  // Calculate machine-wise metrics
  const machineMetrics = productions.reduce((acc, p) => {
    const sections = ['carding', 'drawing', 'framing', 'simplex', 'spinning', 'autoconer'];
    sections.forEach(section => {
      const sectionLogs = p.logs.filter(log => log.section.toLowerCase() === section);

      sectionLogs.forEach(log => {
        const machine = log.machineId;
          if (!acc[machine]) {
            acc[machine] = {
              totalProduction: 0,
              totalRequired: 0,
              downtime: 0,
              qualityIssues: 0,
              days: new Set(),
              shifts: new Set(),
              totalEfficiency: 0,
              efficiencyCount: 0,
              dailyProduction: {} // Track daily production for each machine
            };
          }
          
        const production = Number(log.outputKg || 0);
          const required = 1000; // Fixed required quantity
          const dateKey = p.date.toISOString().split('T')[0];
          
          acc[machine].totalProduction += production;
          acc[machine].totalRequired += required;
          acc[machine].days.add(dateKey);
        acc[machine].shifts.add(log.shift);
          
          // Track daily production
          if (!acc[machine].dailyProduction[dateKey]) {
            acc[machine].dailyProduction[dateKey] = 0;
          }
          acc[machine].dailyProduction[dateKey] += production;
          
          // Calculate efficiency for this entry
          const efficiency = (production / required) * 100;
          acc[machine].totalEfficiency += efficiency;
          acc[machine].efficiencyCount++;
          
        if (log.remarks?.toLowerCase().includes('downtime')) {
            acc[machine].downtime++;
          }
        if (log.remarks?.toLowerCase().includes('quality') || 
            log.remarks?.toLowerCase().includes('defect')) {
            acc[machine].qualityIssues++;
        }
      });
    });
    return acc;
  }, {});

  // Transform machine metrics
  const machineMetricsResult = Object.entries(machineMetrics).map(([machine, data]) => {
    const overallEfficiency = (data.totalProduction / data.totalRequired) * 100;
    const averageEfficiency = data.efficiencyCount > 0 ? data.totalEfficiency / data.efficiencyCount : 0;
    
    // Calculate average daily production from historical data
    const productionDays = Object.keys(data.dailyProduction).length;
    const avgDailyProduction = productionDays > 0 ? data.totalProduction / productionDays : 0;

    return {
      machine,
      total_production: data.totalProduction,
      avg_daily_production: avgDailyProduction,
      production_days: productionDays,
      shifts_operated: data.shifts.size,
      efficiency: {
        overall: overallEfficiency,
        average: averageEfficiency
      },
      downtime_incidents: data.downtime,
      quality_issues: data.qualityIssues
    };
  });

  // Calculate production trends
  const dailyProduction = productions.reduce((acc, p) => {
    const date = p.date.toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + Number(p.total || 0);
    return acc;
  }, {});

  const productionTrend = Object.entries(dailyProduction)
    .map(([date, production]) => ({
      date,
      production
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const metrics = {
    totalProduction,
    avgDailyProduction,
    sectionProduction,
    sectionQuality,
    sectionDowntime,
    machineMetrics: machineMetricsResult,
    productionTrend,
    productionDays: uniqueDays.size
  };

  return metrics;
};

// Helper function to calculate top buyers
const calculateTopBuyers = async (tenantId, startOfMonth) => {
  // Get all orders for the tenant
  const orders = await prisma.order.findMany({
    where: {
      tenantId: tenantId,
      createdAt: {
        gte: startOfMonth
      }
    },
    include: {
      buyer: true
    }
  });

  // Group by buyer and calculate totals
  const buyerTotals = orders.reduce((acc, order) => {
    const buyerId = order.buyerId;
    if (!acc[buyerId]) {
      acc[buyerId] = {
        name: order.buyer.name,
        total: 0,
        orders: 0
      };
    }
    acc[buyerId].total += Number(order.quantity);
    acc[buyerId].orders += 1;
    return acc;
  }, {});

  // Convert to array and sort
  const topBuyers = Object.entries(buyerTotals)
    .map(([id, data]) => ({
      buyerId: id || `unknown-${Date.now()}-${Math.random()}`, // Ensure unique ID
      name: data.name || 'Unknown Buyer',
      total: data.total,
      orders: data.orders
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return topBuyers;
};

// Helper function to calculate order metrics
const calculateOrderMetrics = async (tenantId) => {
  // Get all orders for the tenant
  const orders = await prisma.order.findMany({
    where: { tenantId: tenantId },
    include: {
      buyer: true,
      shade: true
    }
  });

  // Calculate total orders
  const totalOrders = orders.length;

  // Calculate status breakdown
  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  // Calculate pending and overdue orders
  const now = new Date();
  const pendingOrders = orders.filter(order => order.status === 'pending').length;
  const overdueOrders = orders.filter(order => {
    return order.status !== 'completed' && 
           order.status !== 'dispatched' && 
           new Date(order.deliveryDate) < now;
  }).length;

  // Calculate recent orders (last 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentOrders = orders.filter(order => 
    new Date(order.createdAt) >= thirtyDaysAgo
  ).length;

  // Calculate top buyers by order count
  const buyerStats = orders.reduce((acc, order) => {
    const buyerId = order.buyerId;
    if (!acc[buyerId]) {
      acc[buyerId] = {
        name: order.buyer.name,
        count: 0,
        totalQuantity: 0
      };
    }
    acc[buyerId].count++;
    acc[buyerId].totalQuantity += Number(order.quantity);
    return acc;
  }, {});

  const topBuyers = Object.entries(buyerStats)
    .map(([id, stats]) => ({
      buyerId: id || `unknown-${Date.now()}-${Math.random()}`, // Ensure unique ID
      name: stats.name || 'Unknown Buyer',
      order_count: stats.count,
      total_quantity: stats.totalQuantity
    }))
    .sort((a, b) => b.order_count - a.order_count)
    .slice(0, 5);

  const metrics = {
    totalOrders,
    statusBreakdown,
    pendingOrders,
    overdueOrders,
    recentOrders,
    topBuyers
  };

  return metrics;
};

// Helper function to calculate purchase order metrics
const calculatePurchaseOrderMetrics = async (tenantId) => {
  // Get all purchase orders for the tenant
  const purchaseOrders = await prisma.purchaseOrder.findMany({
    where: { tenantId: tenantId },
    include: {
      items: true
    }
  });

  // Calculate total purchase orders
  const totalPOs = purchaseOrders.length;

  // Calculate status breakdown
  const statusBreakdown = purchaseOrders.reduce((acc, po) => {
    acc[po.status] = (acc[po.status] || 0) + 1;
    return acc;
  }, {});

  // Calculate total value
  const totalValue = purchaseOrders.reduce((sum, po) => {
    const poValue = po.items.reduce((itemSum, item) => 
      itemSum + Number(item.quantity) * Number(item.rate), 0);
    return sum + poValue;
  }, 0);

  // Calculate conversion rate
  const convertedPOs = purchaseOrders.filter(po => po.status === 'converted').length;
  const conversionRate = totalPOs > 0 ? (convertedPOs / totalPOs) * 100 : 0;

  const metrics = {
    totalPOs,
    statusBreakdown,
    totalValue,
    conversionRate,
    convertedPOs
  };

  return metrics;
};

// Default dashboard summary structure
const getDefaultDashboardSummary = () => ({
  orders: {
    totalOrders: 0,
    statusBreakdown: {
      pending: 0,
      in_progress: 0,
      completed: 0,
      dispatched: 0
    },
    pendingOrders: 0,
    overdueOrders: 0,
    topBuyers: []
  },
  purchaseOrders: {
    totalPOs: 0,
    statusBreakdown: {
      uploaded: 0,
      converted: 0,
      verified: 0
    },
    totalValue: 0,
    conversionRate: 0,
    convertedPOs: 0
  },
  production: {
    totalProduction: 0,
    avgDailyProduction: 0,
    sectionProduction: {
      blow_room: 0,
      carding: 0,
      drawing: 0,
      framing: 0,
      simplex: 0,
      spinning: 0,
      autoconer: 0
    },
    sectionQuality: {
      blow_room: { totalIssues: 0, issueRate: 0 },
      carding: { totalIssues: 0, issueRate: 0 },
      drawing: { totalIssues: 0, issueRate: 0 },
      framing: { totalIssues: 0, issueRate: 0 },
      simplex: { totalIssues: 0, issueRate: 0 },
      spinning: { totalIssues: 0, issueRate: 0 },
      autoconer: { totalIssues: 0, issueRate: 0 }
    },
    sectionDowntime: {
      blow_room: { totalIncidents: 0, downtimeRate: 0 },
      carding: { totalIncidents: 0, downtimeRate: 0 },
      drawing: { totalIncidents: 0, downtimeRate: 0 },
      framing: { totalIncidents: 0, downtimeRate: 0 },
      simplex: { totalIncidents: 0, downtimeRate: 0 },
      spinning: { totalIncidents: 0, downtimeRate: 0 },
      autoconer: { totalIncidents: 0, downtimeRate: 0 }
    },
    machineMetrics: [],
    productionTrend: [],
    productionDays: 0
  },
  financial: {
    receivables: {
      total: 0,
      overdue: 0
    },
    payables: {
      total: 0,
      overdue: 0
    }
  }
});

// Get all historical production data for the tenant
const getAllHistoricalProductions = async (tenantId) => {
  return await prisma.production.findMany({
    where: { tenantId: tenantId },
    orderBy: { date: 'asc' }
  });
};

// Admin Tenant Management
async function adminCreateTenant(data) {
  // Accept companyDetails object or flat fields
  const companyDetails = data.companyDetails || {};
  const name = data.name;
  const domain = data.domain || companyDetails.domain || null;
  const address = companyDetails.address || data.address || null;
  const industry = companyDetails.industry || data.industry || null;
  const phone = companyDetails.phone || data.phone || null;
  // Validate required fields
  if (!name) throw new Error('Name is required');
  if (!address) throw new Error('Address is required');
  if (!industry) throw new Error('Industry is required');
  // Create tenant
  const tenant = await prisma.tenant.create({
    data: {
      name,
      domain,
      plan: 'TRIAL',
      isActive: true,
      address,
      industry,
      phone,
    },
  });
  // Find the plan with name 'Starter (14-day trial)'
  const trialPlan = await prisma.plan.findFirst({ where: { name: 'Starter (14-day trial)' } });
  let subscription = null;
  if (trialPlan) {
    subscription = await prisma.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: trialPlan.id,
        planType: trialPlan.name,
        startDate: new Date(),
        isActive: true,
      }
    });
  }
  return {
    message: 'successfully tenant is created!',
    id: tenant.id,
    name: tenant.name,
    domain: tenant.domain,
    companyDetails: {
      address: tenant.address || '',
      phone: tenant.phone || '',
      industry: tenant.industry || '',
      domain: tenant.domain || '',
    },
    subscription: subscription ? {
      id: subscription.id,
      plan: trialPlan ? trialPlan.name : null,
      startDate: subscription.startDate,
      isActive: subscription.isActive
    } : null
  };
}

async function verifyAdminMail(token) {
  const user = await prisma.users.findFirst({ where: { verificationToken: token } });
  if (!user) throw new Error('Invalid or expired token');
  await prisma.users.update({
    where: { id: user.id },
    data: { isActive: true, verificationToken: null },
  });
  // Fetch the default role for the user's tenant
  const defaultRole = await prisma.role.findFirst({
    where: {
      tenantId: user.tenantId,
      name: 'Admin',
    },
  });
  return {
    message: 'Email verified successfully',
    role: defaultRole || null
  };
}

async function adminGetTenantById(id) {
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      users: true,
      subscriptions: {
        orderBy: { startDate: 'desc' },
        take: 1,
        include: { plan: true },
      },
    },
  });
  if (!tenant) return null;
  const sub = tenant.subscriptions[0];
  const subscription = sub
    ? {
        plan: sub.planType || tenant.plan,
        startDate: sub.startDate ? sub.startDate.toISOString() : null,
        endDate: (sub.plan && sub.plan.expiry_date)
          ? sub.plan.expiry_date.toISOString()
          : (sub.endDate ? sub.endDate.toISOString() : null),
        status: sub.isActive ? 'active' : 'inactive',
      }
    : null;
  const users = tenant.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    isVerified: u.isVerified,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
    role: u.role,
  }));
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive).length;
  const usage = {
    totalUsers,
    activeUsers,
    storageUsed: 0,
    storageLimit: 0,
  };
  // Group company details
  const companyDetails = {
    address: tenant.address || '',
    phone: tenant.phone || '',
    industry: tenant.industry || '',
    domain: tenant.domain || '',
  };
  return {
    id: tenant.id,
    name: tenant.name,
    domain: tenant.domain || '',
    plan: tenant.plan,
    isActive: tenant.isActive,
    createdAt: tenant.createdAt,
    updatedAt: tenant.updatedAt,
    companyDetails,
    subscription,
    users,
    usage,
  };
}

async function adminUpdateTenant(id, data) {
  // Accept companyDetails object or flat fields
  const companyDetails = data.companyDetails || {};
  const name = data.name;
  const status = data.status;
  // Determine isActive from status only
  let isActive;
  if (status === 'active') isActive = true;
  else if (status === 'inactive' || status === 'suspended') isActive = false;
  // Allow updating address, phone, industry, domain via companyDetails or flat fields
  const address = companyDetails.address || data.address;
  const phone = companyDetails.phone || data.phone;
  const industry = companyDetails.industry || data.industry;
  const domain = companyDetails.domain || data.domain;
  const updateData = {
    ...(name && { name }),
    ...(isActive !== undefined && { isActive }),
    ...(address !== undefined && { address }),
    ...(phone !== undefined && { phone }),
    ...(industry !== undefined && { industry }),
    ...(domain !== undefined && { domain }),
  };
  const updated = await prisma.tenant.update({
    where: { id },
    data: updateData,
  });
  // If status is inactive or suspended, deactivate all users for this tenant
  if (status === 'inactive' || status === 'suspended' || isActive === false) {
    await prisma.users.updateMany({
      where: { tenantId: id },
      data: { isActive: false },
    });
  }
  // Return grouped companyDetails and domain at top level
  const companyDetailsResp = {
    address: updated.address || '',
    phone: updated.phone || '',
    industry: updated.industry || '',
    domain: updated.domain || '',
  };
  return {
    ...updated,
    isActive: updated.isActive,
    domain: updated.domain || '',
    companyDetails: companyDetailsResp,
  };
}

async function adminGetAllTenants({ search = '', status = 'all', plan, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) {
  const where = {
    ...(search && {
      name: { contains: search, mode: 'insensitive' },
    }),
    ...((status !== 'all') && {
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
    }),
    ...(plan && { plan: { equals: plan, mode: 'insensitive' } }),
  };
  let orderBy = {};
  if (sortBy === 'name') orderBy = { name: sortOrder };
  else if (sortBy === 'createdAt') orderBy = { createdAt: sortOrder };
  else if (sortBy === 'lastActive') orderBy = { updatedAt: sortOrder };
  else orderBy = { createdAt: sortOrder };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  let tenants = await prisma.tenant.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      users: {
        select: { id: true, updatedAt: true, isActive: true },
      },
    },
  });
  if (sortBy === 'users') {
    tenants = tenants.sort((a, b) => {
      const aCount = a.users.length;
      const bCount = b.users.length;
      return sortOrder === 'asc' ? aCount - bCount : bCount - aCount;
    });
  }
  const mappedTenants = tenants.map(t => {
    const userCount = t.users.length;
    let lastActive = null;
    if (userCount > 0) {
      lastActive = t.users.reduce((latest, u) => {
        if (!u.updatedAt) return latest;
        return !latest || u.updatedAt > latest ? u.updatedAt : latest;
      }, null);
    }
    return {
      id: t.id,
      name: t.name,
      domain: t.domain,
      plan: t.plan,
      isActive: t.isActive,
      status: t.isActive ? 'active' : 'inactive', // <-- add this
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      userCount,
      lastActive,
    };
  });
  const totalItems = await prisma.tenant.count({ where });
  const totalPages = Math.ceil(totalItems / take);
  return {
    tenants: mappedTenants,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems,
      itemsPerPage: take,
    },
  };
}

async function adminDeleteTenant(id) {
  return prisma.tenant.delete({ where: { id } });
}

async function adminGetAllSubscriptions({ search = '', status = 'all', plan, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) {
  // Build where clause for filtering
  const where = {
    ...(plan && { planType: { equals: plan, mode: 'insensitive' } }),
    ...(status !== 'all' && {
      isActive: status === 'active' ? true : status === 'inactive' ? false : undefined,
    }),
    // We'll filter by tenant name in-memory after join
  };
  // Sorting
  let orderBy = {};
  if (sortBy === 'planName') orderBy = { planType: sortOrder };
  else if (sortBy === 'createdAt') orderBy = { startDate: sortOrder };
  else if (sortBy === 'updatedAt') orderBy = { endDate: sortOrder };
  else orderBy = { startDate: sortOrder };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  // Query subscriptions with plan and tenant
  const [subscriptions, totalItems] = await Promise.all([
    prisma.subscription.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        plan: true,
        tenant: true,
      },
    }),
    prisma.subscription.count({ where }),
  ]);
  // Filter by tenant name if search is provided
  let filtered = subscriptions;
  if (search) {
    filtered = subscriptions.filter(sub =>
      sub.tenant && sub.tenant.name && sub.tenant.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  // Pagination after filtering
  const paged = filtered.slice(0, take);
  // Map to output format
  const mapped = paged.map(sub => ({
    id: sub.id,
    tenantName: sub.tenant ? sub.tenant.name : '',
    planName: sub.plan ? sub.plan.name : sub.planType,
    description: sub.plan ? sub.plan.description : '',
    price: sub.plan ? sub.plan.price : null,
    billingCycle: sub.plan ? sub.plan.billingCycle : '',
    maxUsers: sub.plan ? sub.plan.maxUsers : null,
    maxOrders: sub.plan ? sub.plan.maxOrders : null,
    maxStorage: sub.plan ? sub.plan.maxStorage : '',
    status: sub.isActive ? 'active' : 'inactive',
    createdAt: sub.startDate,
    updatedAt: sub.endDate,
  }));
  const totalPages = Math.ceil(totalItems / take);
  return {
    subscriptions: mapped,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems,
      itemsPerPage: take,
    },
  };
}

async function adminCreateSubscription({ tenantId, planId }) {
  // Validate input
  if (!tenantId || !planId) throw new Error('tenantId and planId are required');
  // Fetch tenant and plan
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant not found');
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error('Plan not found');
  // Deactivate all previous subscriptions for this tenant (regardless of isActive)
  await prisma.subscription.updateMany({
    where: { tenantId: tenantId },
    data: { isActive: false },
  });
  // Create new subscription
  const now = new Date();
  // Calculate endDate using plan billingCycle
  let endDate = null;
  if (plan.billingCycle === 'trial') {
    endDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  } else if (plan.billingCycle === 'month') {
    endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);
  } else if (plan.billingCycle === 'year') {
    endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);
  }
  const newSubscription = await prisma.subscription.create({
    data: {
      tenantId: tenantId,
      planId: planId,
      planType: plan.name,
      startDate: now,
      endDate,
      isActive: true,
    },
    include: {
      plan: true,
      tenant: true,
    },
  });

  // Create billing invoice for this subscription
  // Generate invoice number: INV+YYYYMMDD+last 3 auto increment
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.billing.count({ where: { createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } } });
  const invoiceNumber = `INV${dateStr}${String(count + 1).padStart(3, '0')}`;
  const billing = await prisma.billing.create({
    data: {
      tenantId: tenantId,
      invoiceNumber: invoiceNumber,
      amount: plan.price,
      dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
      paidDate: null,
      status: 'PENDING',
    },
    include: { tenant: true },
  });
  // Create payment for this invoice (full amount, creditcard, paid)
  const payment = await billingService.postPayment({
    billingId: billing.id,
    tenantId: tenantId,
    amount: plan.price,
    method: 'creditcard',
    status: 'paid',
    txnId: null
  });
  // Send the invoice email immediately (same API)
  await billingService.sendInvoiceBillEmail(invoiceNumber);
  // Get user for this tenant (prefer Admin, fallback to any user)
  let invoiceUser = await prisma.users.findFirst({
    where: { tenantId: tenantId, role: 'Admin' },
  });
  if (!invoiceUser) {
    invoiceUser = await prisma.users.findFirst({
      where: { tenantId: tenantId },
    });
  }
  if (!invoiceUser) throw new Error('No user found for this tenant');
  // Format invoice response as in adminGetInvoices
  const invoiceResponse = {
    id: billing.id,
    tenantName: billing.tenant?.name || '',
    tenantEmail: invoiceUser?.email || '',
    invoiceNumber: billing.invoiceNumber,
    amount: billing.amount,
    currency: 'USD',
    status: billing.status?.toLowerCase() || '',
    dueDate: billing.dueDate?.toISOString().split('T')[0] || '',
    issueDate: billing.createdAt?.toISOString().split('T')[0] || '',
    paidDate: billing.paidDate?.toISOString().split('T')[0] || '',
    plan: plan.name,
    billingCycle: plan.billingCycle,
    description: plan.description,
  };

  // Fetch all subscriptions for this tenant (most recent first)
  const allSubscriptions = await prisma.subscription.findMany({
    where: { tenantId: tenantId },
    orderBy: { startDate: 'desc' },
    include: { plan: true, tenant: true },
  });
  // Format response as in adminGetAllSubscriptions
  const mapped = allSubscriptions.map(sub => ({
    id: sub.id,
    tenantName: sub.tenant ? sub.tenant.name : '',
    planName: sub.plan ? sub.plan.name : sub.planType,
    description: sub.plan ? sub.plan.description : '',
    price: sub.plan ? sub.plan.price : null,
    billingCycle: sub.plan ? sub.plan.billingCycle : '',
    maxUsers: sub.plan ? sub.plan.maxUsers : null,
    maxOrders: sub.plan ? sub.plan.maxOrders : null,
    maxStorage: sub.plan ? sub.plan.maxStorage : '',
    status: sub.isActive ? 'active' : 'inactive',
    createdAt: sub.startDate,
    updatedAt: sub.endDate,
  }));
  return {
    subscriptions: mapped,
    invoice: invoiceResponse,
    payment,
    invoice_number: billing.invoiceNumber, // for separate email API
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalItems: mapped.length,
      itemsPerPage: mapped.length,
    },
  };
}

async function adminUpdateSubscription(id, { status }) {
  if (!id || !status) throw new Error('subscription id and status are required');
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: { tenant: true, plan: true },
  });
  if (!sub) throw new Error('Subscription not found');
  if (status === 'inactive') {
    const updated = await prisma.subscription.update({
      where: { id },
      data: { isActive: false },
      include: { tenant: true, plan: true },
    });
    return {
      id: updated.id,
      tenantName: updated.tenant ? updated.tenant.name : '',
      planName: updated.plan ? updated.plan.name : updated.planType,
      description: updated.plan ? updated.plan.description : '',
      price: updated.plan ? updated.plan.price : null,
      billingCycle: updated.plan ? updated.plan.billingCycle : '',
      maxUsers: updated.plan ? updated.plan.maxUsers : null,
      maxOrders: updated.plan ? updated.plan.maxOrders : null,
      maxStorage: updated.plan ? updated.plan.maxStorage : '',
      status: updated.isActive ? 'active' : 'inactive',
      createdAt: updated.startDate,
      updatedAt: updated.endDate,
    };
  } else if (status === 'active') {
    // Check if another active subscription exists for this tenant
    const activeCount = await prisma.subscription.count({
      where: {
        tenantId: sub.tenantId,
        isActive: true,
        NOT: { id },
      },
    });
    if (activeCount > 0) {
      throw new Error('Another active subscription already exists for this tenant.');
    }
    const updated = await prisma.subscription.update({
      where: { id },
      data: { isActive: true },
      include: { tenant: true, plan: true },
    });
    return {
      id: updated.id,
      tenantName: updated.tenant ? updated.tenant.name : '',
      planName: updated.plan ? updated.plan.name : updated.planType,
      description: updated.plan ? updated.plan.description : '',
      price: updated.plan ? updated.plan.price : null,
      billingCycle: updated.plan ? updated.plan.billingCycle : '',
      maxUsers: updated.plan ? updated.plan.maxUsers : null,
      maxOrders: updated.plan ? updated.plan.maxOrders : null,
      maxStorage: updated.plan ? updated.plan.maxStorage : '',
      status: updated.isActive ? 'active' : 'inactive',
      createdAt: updated.startDate,
      updatedAt: updated.endDate,
    };
  } else {
    throw new Error('Invalid status value. Must be "active" or "inactive".');
  }
}

async function adminGetAllUsers(query) {
  let { tenantId, tenantname, status, page = 1, limit = 10, search = '' } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  let where = {};
  if (tenantId) {
    where.tenantId = tenantId;
  } else if (tenantname) {
    where.tenant = { name: { contains: tenantname, mode: 'insensitive' } };
  }
  if (status && status !== 'all') {
    where.isActive = status === 'active' ? true : false;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  const [users, count] = await prisma.$transaction([
    prisma.users.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        tenant: true,
        userRoles: { include: { role: true } },
      },
    }),
    prisma.users.count({ where }),
  ]);
  const transformedUsers = users.map(user => {
    const roleObj = user.userRoles && user.userRoles.length > 0
      ? user.userRoles[0].role
      : null;
    const { userRoles, ...rest } = user;
    return {
      ...rest,
      role: roleObj,
      isVerified: user.isVerified,
    };
  });
  const totalPages = Math.ceil(count / parseInt(limit));
  return {
    users: transformedUsers,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit),
    },
  };
}

async function adminUpdateUser(userId, updateData) {
  if (updateData.roleId) {
    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.userRole.create({
      data: {
        userId: userId,
        roleId: updateData.roleId,
      },
    });
    const role = await prisma.role.findUnique({
      where: { id: updateData.roleId },
      select: { id: true, name: true, permissions: true, tenantId: true },
    });
    await prisma.users.update({
      where: { id: userId },
      data: { role: role.name },
    });
  }
  // Remove email and isVerified if present
  const { roleId, email, isVerified, ...otherFields } = updateData;
  // Only include isActive if present in updateData
  const updateObj = { ...otherFields };
  if (updateData.hasOwnProperty('isActive')) {
    updateObj.isActive = updateData.isActive;
  }
  await prisma.users.update({
    where: { id: userId },
    data: updateObj,
  });
  const user = await prisma.users.findUnique({ where: { id: userId } });
  const userRole = await prisma.userRole.findFirst({
    where: { userId: userId },
    include: { role: true },
  });
  return {
    ...user,
    role: userRole ? {
      id: userRole.role.id,
      name: userRole.role.name,
      permissions: userRole.role.permissions,
      tenantId: userRole.role.tenantId,
    } : null,
    isVerified: user.isVerified,
  };
}

async function adminInviteUser({ email, tenantId, roleId }) {
  if (!email || !tenantId || !roleId) {
    throw new Error('Missing fields: email, tenantId, roleId');
  }
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const token = jwt.sign({ email, tenantId, roleId }, JWT_SECRET, { expiresIn: '72h' });
  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/superadmin/accept-invite?token=${token}`;

  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email credentials not configured. Skipping invitation email.');
    console.log('📧 Invitation token:', token);
    console.log('🔗 Manual invitation URL:', inviteLink);
    return {
      message: 'Invitation created successfully (email not sent due to missing credentials)',
      inviteLink,
      token
    };
  }
  try {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
      auth: { user: process.env.EMAIL_FROM, pass: process.env.EMAIL_PASS }
  });
  await transporter.sendMail({
    from: `"TexIntelli" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'You are invited to join TexIntelli',
    html: `
      <p>Hello,</p>
      <p>You have been invited to join TexIntelli. Click below to accept the invitation:</p>
      <a href="${inviteLink}">${inviteLink}</a>
      <p>This link will expire in 72 hours.</p>
    `
  });
    console.log('✅ Invitation email sent successfully to:', email);
  return { message: 'Invitation sent, check your email' };
  } catch (error) {
    console.error('❌ Failed to send invitation email:', error.message);
    console.log('📧 Invitation token:', token);
    console.log('🔗 Manual invitation URL:', inviteLink);
    return {
      message: 'Invitation created but email failed to send',
      inviteLink,
      token
    };
  }
}

async function adminAcceptInvite({ token, name, password }) {
  if (!token || !name || !password) {
    throw new Error('Missing fields: token, name, password');
  }
  // Verify token
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error('Invalid or expired token');
  }
  const { email, tenantId, roleId } = payload;
  // Check if user exists
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');
  // Hash password
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash(password, 10);
  // Create user
  const user = await prisma.users.create({
    data: {
      name,
      email,
      tenantId,
      passwordHash: passwordHash,
      isVerified: true
    }
  });
  // Assign role
  await prisma.userRole.create({
    data: {
      userId: user.id,
      roleId
    }
  });
  return { message: 'User created successfully from invite' };
}

async function adminDeleteUser(userId) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  await prisma.users.update({
    where: { id: userId },
    data: { isActive: false },
  });
  return { isActive: false, message: 'This user successfully deactivated' };
}

async function getDashboardSummary(user) {
  // Initialize with default structure
  const summary = getDefaultDashboardSummary();
  
  if (!user || !user.tenantId) {
    return summary;
  }

  try {
    // Get all historical productions
    const allProductions = await getAllHistoricalProductions(user.tenantId);

    // Calculate production metrics
    if (allProductions.length > 0) {
      const { totalProduction, avgDailyProduction, sectionProduction, sectionQuality, sectionDowntime, machineMetrics, productionTrend, productionDays } = await calculateProductionMetrics(user.tenantId, getDateRanges().startOfMonth);
      summary.production = {
        totalProduction,
        avgDailyProduction,
        sectionProduction,
        sectionQuality,
        sectionDowntime,
        machineMetrics,
        productionTrend,
        productionDays
      };
    }

    // Calculate order metrics
    const orders = await prisma.order.findMany({
      where: { tenantId: user.tenantId },
      include: { buyer: true }
    });

    if (orders.length > 0) {
      summary.orders = {
        totalOrders: orders.length,
        statusBreakdown: orders.reduce((acc, order) => {
          acc[order.status] = (acc[order.status] || 0) + 1;
          return acc;
        }, { pending: 0, in_progress: 0, completed: 0, dispatched: 0 }),
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        overdueOrders: orders.filter(o => {
          const deliveryDate = new Date(o.deliveryDate);
          return o.status !== 'completed' && deliveryDate < new Date();
        }).length,
        topBuyers: Object.entries(
          orders.reduce((acc, order) => {
            acc[order.buyer.name] = (acc[order.buyer.name] || 0) + 1;
            return acc;
          }, {})
        )
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }))
      };
    }

    // Calculate purchase order metrics
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: { tenantId: user.tenantId },
      include: { items: true }
    });

    if (purchaseOrders.length > 0) {
      const convertedPOs = purchaseOrders.filter(po => po.status === 'converted').length;
      summary.purchaseOrders = {
        totalPOs: purchaseOrders.length,
        statusBreakdown: purchaseOrders.reduce((acc, po) => {
          acc[po.status] = (acc[po.status] || 0) + 1;
          return acc;
        }, { uploaded: 0, converted: 0, verified: 0 }),
        totalValue: purchaseOrders.reduce((sum, po) => sum + Number(po.grandTotal || 0), 0),
        conversionRate: (convertedPOs / purchaseOrders.length) * 100,
        convertedPOs
      };
    }

    // Calculate financial metrics
    const receivables = await prisma.order.findMany({
      where: {
        tenantId: user.tenantId,
        status: { in: ['completed', 'dispatched'] }
      }
    });

    if (receivables.length > 0) {
      summary.financial.receivables = {
        total: receivables.reduce((sum, order) => sum + Number(order.quantity || 0), 0),
        overdue: receivables.filter(order => {
          const deliveryDate = new Date(order.deliveryDate);
          return order.status === 'dispatched' && deliveryDate < new Date();
        }).length
      };
    }

    return summary;
  } catch (error) {
    return summary;
  }
};

/**
 * Get admin dashboard summary with system-wide statistics
 * @returns {Object} Admin dashboard summary
 */
async function getAdminDashboardSummary() {
  try {
    // Helper to get month range
    function getMonthRange(date) {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }

    const now = new Date();
    const { start: currStart, end: currEnd } = getMonthRange(now);
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const { start: prevStart, end: prevEnd } = getMonthRange(prevMonth);

    // Tenants
    const currTenants = await prisma.tenant.count({
      where: { createdAt: { gte: currStart, lte: currEnd }, isActive: true }
    });
    const prevTenants = await prisma.tenant.count({
      where: { createdAt: { gte: prevStart, lte: prevEnd }, isActive: true }
    });
    const totalTenants = await prisma.tenant.count({ where: { isActive: true } });

    // Users
    const currUsers = await prisma.users.count({
      where: { isActive: true, createdAt: { gte: currStart, lte: currEnd } }
    });
    const prevUsers = await prisma.users.count({
      where: { isActive: true, createdAt: { gte: prevStart, lte: prevEnd } }
    });
    const totalUsers = await prisma.users.count({ where: { isActive: true } });

    // For now, orders and revenue are 0
    const currOrders = 0, prevOrders = 0;
    const currRevenue = 0, prevRevenue = 0;

    // Helper for change
    const getChange = (curr, prev) => ({
      change: curr - prev,
      change_type: curr - prev >= 0 ? "positive" : "negative"
    });

    return {
      dashboard_stats: [
        {
          id: uuidv4(),
          key: "total_tenants",
          title: "Total Tenants",
          value: totalTenants,
          ...getChange(currTenants, prevTenants)
        },
        {
          id: uuidv4(),
          key: "active_users",
          title: "Active Users",
          value: totalUsers,
          ...getChange(currUsers, prevUsers)
        },
        {
          id: uuidv4(),
          key: "total_orders",
          title: "Total Orders",
          value: currOrders,
          ...getChange(currOrders, prevOrders)
        },
        {
          id: uuidv4(),
          key: "revenue",
          title: "Revenue",
          value: currRevenue,
          ...getChange(currRevenue, prevRevenue)
        }
      ]
    };
  } catch (error) {
    console.error('Error fetching admin dashboard summary:', error);
    // Return default values in case of error
    return {
      dashboard_stats: [
        {
          id: uuidv4(),
          key: "total_tenants",
          title: "Total Tenants",
          value: 0,
          change: 0,
          change_type: "positive"
        },
        {
          id: uuidv4(),
          key: "active_users",
          title: "Active Users",
          value: 0,
          change: 0,
          change_type: "positive"
        },
        {
          id: uuidv4(),
          key: "total_orders",
          title: "Total Orders",
          value: 0,
          change: 0,
          change_type: "positive"
        },
        {
          id: uuidv4(),
          key: "revenue",
          title: "Revenue",
          value: 0,
          change: 0,
          change_type: "positive"
        }
      ]
    };
  }
}; 

module.exports = {
  getDashboardSummary,
  getAdminDashboardSummary,
  adminCreateTenant,
  adminGetTenantById,
  adminUpdateTenant,
  adminGetAllTenants,
  adminDeleteTenant,
  verifyAdminMail,
  adminGetAllSubscriptions,
  adminCreateSubscription,
  adminUpdateSubscription,
  adminGetAllUsers,
  adminUpdateUser,
  adminInviteUser,
  adminAcceptInvite,
  adminDeleteUser,
}; 