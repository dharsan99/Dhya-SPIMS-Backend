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
  const activeOrders = await prisma.orders.findMany({
    where: {
      tenant_id: tenantId,
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
    const requiredQty = new Decimal(order.quantity_kg).div(order.realisation || 100).mul(100);

    for (const sf of order.shade.shade_fibres) {
      const requiredFibreQty = requiredQty.mul(sf.percentage).div(100);
      const availableQty = new Decimal(sf.fibre.stock_kg);

      if (availableQty.lessThan(requiredFibreQty)) {
        shortages.add(sf.fibre_id);
      }
    }
  }

  return shortages.size;
};

// Helper function to calculate financial metrics
const calculateFinancialMetrics = async (tenantId) => {
  // Get all orders with their payments
  const orders = await prisma.orders.findMany({
    where: {
      tenant_id: tenantId,
      status: {
        in: ['completed', 'dispatched']
      }
    },
    include: {
      buyer: true
    }
  });

  // Get all purchase orders with their payments
  const purchaseOrders = await prisma.purchase_orders.findMany({
    where: {
      tenant_id: tenantId,
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
    const orderValue = new Decimal(order.quantity_kg).mul(order.rate || 0);
    receivables.total += Number(orderValue);

    if (order.delivery_date < thirtyDaysAgo) {
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

    if (po.po_date < thirtyDaysAgo) {
      payables.overdue += poValue;
    }
  }

  return { receivables, payables };
};

// Helper function to calculate production metrics
const calculateProductionMetrics = async (tenantId, startOfMonth) => {
  // Get all productions for the tenant
  const productions = await prisma.productions.findMany({
    where: {
      tenant_id: tenantId,
      date: {
        gte: startOfMonth
      }
    },
    orderBy: {
      date: 'desc'
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

      const sectionData = p[section];
      if (!sectionData) {
        return;
      }

      sectionData.forEach(entry => {
        if (entry) {
          const production = Number(entry.production_kg || 0);
          const required = 1000; // Fixed required quantity for other sections
          
          acc[section].totalProduction += production;
          acc[section].totalRequired += required;
          acc[section].entries.push(entry);

          // Calculate efficiency for this entry
          const efficiency = (production / required) * 100;
          acc[section].totalEfficiency += efficiency;
          acc[section].efficiencyCount++;

          if (entry.remarks?.toLowerCase().includes('downtime')) {
            acc[section].downtime++;
          }
          if (entry.remarks?.toLowerCase().includes('quality') || 
              entry.remarks?.toLowerCase().includes('defect')) {
            acc[section].qualityIssues++;
          }
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
      const sectionData = p[section];
      if (!sectionData || !Array.isArray(sectionData)) return;

      sectionData.forEach(entry => {
        if (entry && entry.machine) {
          const machine = entry.machine;
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
          
          const production = Number(entry.production_kg || 0);
          const required = 1000; // Fixed required quantity
          const dateKey = p.date.toISOString().split('T')[0];
          
          acc[machine].totalProduction += production;
          acc[machine].totalRequired += required;
          acc[machine].days.add(dateKey);
          acc[machine].shifts.add(entry.shift);
          
          // Track daily production
          if (!acc[machine].dailyProduction[dateKey]) {
            acc[machine].dailyProduction[dateKey] = 0;
          }
          acc[machine].dailyProduction[dateKey] += production;
          
          // Calculate efficiency for this entry
          const efficiency = (production / required) * 100;
          acc[machine].totalEfficiency += efficiency;
          acc[machine].efficiencyCount++;
          
          if (entry.remarks?.toLowerCase().includes('downtime')) {
            acc[machine].downtime++;
          }
          if (entry.remarks?.toLowerCase().includes('quality') || 
              entry.remarks?.toLowerCase().includes('defect')) {
            acc[machine].qualityIssues++;
          }
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
  const orders = await prisma.orders.findMany({
    where: {
      tenant_id: tenantId,
      created_at: {
        gte: startOfMonth
      }
    },
    include: {
      buyer: true
    }
  });

  // Group by buyer and calculate totals
  const buyerTotals = orders.reduce((acc, order) => {
    const buyerId = order.buyer_id;
    if (!acc[buyerId]) {
      acc[buyerId] = {
        name: order.buyer.name,
        total: 0,
        orders: 0
      };
    }
    acc[buyerId].total += Number(order.quantity_kg);
    acc[buyerId].orders += 1;
    return acc;
  }, {});

  // Convert to array and sort
  const topBuyers = Object.entries(buyerTotals)
    .map(([id, data]) => ({
      buyer_id: id || `unknown-${Date.now()}-${Math.random()}`, // Ensure unique ID
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
  const orders = await prisma.orders.findMany({
    where: { tenant_id: tenantId },
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
           new Date(order.delivery_date) < now;
  }).length;

  // Calculate recent orders (last 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentOrders = orders.filter(order => 
    new Date(order.created_at) >= thirtyDaysAgo
  ).length;

  // Calculate top buyers by order count
  const buyerStats = orders.reduce((acc, order) => {
    const buyerId = order.buyer_id;
    if (!acc[buyerId]) {
      acc[buyerId] = {
        name: order.buyer.name,
        count: 0,
        totalQuantity: 0
      };
    }
    acc[buyerId].count++;
    acc[buyerId].totalQuantity += Number(order.quantity_kg);
    return acc;
  }, {});

  const topBuyers = Object.entries(buyerStats)
    .map(([id, stats]) => ({
      buyer_id: id || `unknown-${Date.now()}-${Math.random()}`, // Ensure unique ID
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
  const purchaseOrders = await prisma.purchase_orders.findMany({
    where: { tenant_id: tenantId },
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
  return await prisma.productions.findMany({
    where: { tenant_id: tenantId },
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
  const tenant = await prisma.tenants.create({
    data: {
      name,
      domain,
      plan: 'TRIAL',
      is_active: true,
      address,
      industry,
      phone,
    },
  });
  // Find the plan with name 'Starter (14-day trial)'
  const trialPlan = await prisma.plan.findFirst({ where: { name: 'Starter (14-day trial)' } });
  let subscription = null;
  if (trialPlan) {
    subscription = await prisma.subscriptions.create({
      data: {
        tenant_id: tenant.id,
        plan_id: trialPlan.id,
        plan_type: trialPlan.name,
        start_date: new Date(),
        is_active: true,
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
      start_date: subscription.start_date,
      is_active: subscription.is_active
    } : null
  };
}

async function verifyAdminMail(token) {
  const user = await prisma.users.findFirst({ where: { verification_token: token } });
  if (!user) throw new Error('Invalid or expired token');
  await prisma.users.update({
    where: { id: user.id },
    data: { is_verified: true, verification_token: null },
  });
  // Fetch the default role for the user's tenant
  const defaultRole = await prisma.roles.findFirst({
    where: {
      tenant_id: user.tenant_id,
      name: 'Admin',
    },
  });
  return {
    message: 'Email verified successfully',
    role: defaultRole || null
  };
}

async function adminGetTenantById(id) {
  const tenant = await prisma.tenants.findUnique({
    where: { id },
    include: {
      users: true,
      subscriptions: {
        orderBy: { start_date: 'desc' },
        take: 1,
        include: { plan: true },
      },
    },
  });
  if (!tenant) return null;
  const sub = tenant.subscriptions[0];
  const subscription = sub
    ? {
        plan: sub.plan_type || tenant.plan,
        startDate: sub.start_date ? sub.start_date.toISOString() : null,
        endDate: (sub.plan && sub.plan.expiry_date)
          ? sub.plan.expiry_date.toISOString()
          : (sub.end_date ? sub.end_date.toISOString() : null),
        status: sub.is_active ? 'active' : 'inactive',
      }
    : null;
  const users = tenant.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    is_active: u.is_active,
    is_verified: u.is_verified,
    created_at: u.created_at,
    updated_at: u.updated_at,
    role: u.role,
  }));
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
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
    is_active: tenant.is_active,
    created_at: tenant.created_at,
    updated_at: tenant.updated_at,
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
  // Determine is_active from status only
  let is_active;
  if (status === 'active') is_active = true;
  else if (status === 'inactive' || status === 'suspended') is_active = false;
  // Allow updating address, phone, industry, domain via companyDetails or flat fields
  const address = companyDetails.address || data.address;
  const phone = companyDetails.phone || data.phone;
  const industry = companyDetails.industry || data.industry;
  const domain = companyDetails.domain || data.domain;
  const updateData = {
    ...(name && { name }),
    ...(is_active !== undefined && { is_active }),
    ...(address !== undefined && { address }),
    ...(phone !== undefined && { phone }),
    ...(industry !== undefined && { industry }),
    ...(domain !== undefined && { domain }),
  };
  const updated = await prisma.tenants.update({
    where: { id },
    data: updateData,
  });
  // If status is inactive or suspended, deactivate all users for this tenant
  if (status === 'inactive' || status === 'suspended' || is_active === false) {
    await prisma.users.updateMany({
      where: { tenant_id: id },
      data: { is_active: false },
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
    is_active: updated.is_active,
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
      is_active: status === 'active' ? true : status === 'inactive' ? false : undefined,
    }),
    ...(plan && { plan: { equals: plan, mode: 'insensitive' } }),
  };
  let orderBy = {};
  if (sortBy === 'name') orderBy = { name: sortOrder };
  else if (sortBy === 'createdAt') orderBy = { created_at: sortOrder };
  else if (sortBy === 'lastActive') orderBy = { updated_at: sortOrder };
  else orderBy = { created_at: sortOrder };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  let tenants = await prisma.tenants.findMany({
    where,
    orderBy,
    skip,
    take,
    include: {
      users: {
        select: { id: true, updated_at: true, is_active: true },
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
        if (!u.updated_at) return latest;
        return !latest || u.updated_at > latest ? u.updated_at : latest;
      }, null);
    }
    return {
      id: t.id,
      name: t.name,
      domain: t.domain,
      plan: t.plan,
      is_active: t.is_active,
      status: t.is_active ? 'active' : 'inactive', // <-- add this
      created_at: t.created_at,
      updated_at: t.updated_at,
      userCount,
      lastActive,
    };
  });
  const totalItems = await prisma.tenants.count({ where });
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
  return prisma.tenants.delete({ where: { id } });
}

async function adminGetAllSubscriptions({ search = '', status = 'all', plan, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) {
  // Build where clause for filtering
  const where = {
    ...(plan && { plan_type: { equals: plan, mode: 'insensitive' } }),
    ...(status !== 'all' && {
      is_active: status === 'active' ? true : status === 'inactive' ? false : undefined,
    }),
    // We'll filter by tenant name in-memory after join
  };
  // Sorting
  let orderBy = {};
  if (sortBy === 'planName') orderBy = { plan_type: sortOrder };
  else if (sortBy === 'createdAt') orderBy = { start_date: sortOrder };
  else if (sortBy === 'updatedAt') orderBy = { end_date: sortOrder };
  else orderBy = { start_date: sortOrder };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  // Query subscriptions with plan and tenant
  const [subscriptions, totalItems] = await Promise.all([
    prisma.subscriptions.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        plan: true,
        tenants: true,
      },
    }),
    prisma.subscriptions.count({ where }),
  ]);
  // Filter by tenant name if search is provided
  let filtered = subscriptions;
  if (search) {
    filtered = subscriptions.filter(sub =>
      sub.tenants && sub.tenants.name && sub.tenants.name.toLowerCase().includes(search.toLowerCase())
    );
  }
  // Pagination after filtering
  const paged = filtered.slice(0, take);
  // Map to output format
  const mapped = paged.map(sub => ({
    id: sub.id,
    tenantName: sub.tenants ? sub.tenants.name : '',
    planName: sub.plan ? sub.plan.name : sub.plan_type,
    description: sub.plan ? sub.plan.description : '',
    price: sub.plan ? sub.plan.price : null,
    billingCycle: sub.plan ? sub.plan.billingCycle : '',
    maxUsers: sub.plan ? sub.plan.maxUsers : null,
    maxOrders: sub.plan ? sub.plan.maxOrders : null,
    maxStorage: sub.plan ? sub.plan.maxStorage : '',
    status: sub.is_active ? 'active' : 'inactive',
    createdAt: sub.start_date,
    updatedAt: sub.end_date,
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
  const tenant = await prisma.tenants.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error('Tenant not found');
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) throw new Error('Plan not found');
  // Deactivate all previous subscriptions for this tenant (regardless of is_active)
  await prisma.subscriptions.updateMany({
    where: { tenant_id: tenantId },
    data: { is_active: false },
  });
  // Create new subscription
  const now = new Date();
  // Calculate end_date using plan billingCycle
  let end_date = null;
  if (plan.billingCycle === 'trial') {
    end_date = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  } else if (plan.billingCycle === 'month') {
    end_date = new Date(now);
    end_date.setMonth(end_date.getMonth() + 1);
  } else if (plan.billingCycle === 'year') {
    end_date = new Date(now);
    end_date.setFullYear(end_date.getFullYear() + 1);
  }
  const newSubscription = await prisma.subscriptions.create({
    data: {
      tenant_id: tenantId,
      plan_id: planId,
      plan_type: plan.name,
      start_date: now,
      end_date,
      is_active: true,
    },
    include: {
      plan: true,
      tenants: true,
    },
  });

  // Create billing invoice for this subscription
  // Generate invoice number: INV+YYYYMMDD+last 3 auto increment
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.billing.count({ where: { created_at: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } } });
  const invoiceNumber = `INV${dateStr}${String(count + 1).padStart(3, '0')}`;
  const billing = await prisma.billing.create({
    data: {
      tenant_id: tenantId,
      invoice_number: invoiceNumber,
      amount: plan.price,
      due_date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
      paid_date: null,
      status: 'PAID', // since subscription is_active==true
    },
    include: { tenants: true },
  });
  // Send the invoice email using the styled template
  await billingService.sendInvoiceEmail(billing.id);
  // Create payment for this invoice (full amount, creditcard, paid)
  const payment = await billingService.postPayment({
    billingId: billing.id,
    tenantId: tenantId,
    amount: plan.price,
    method: 'creditcard',
    status: 'paid',
    txnId: null
  });
  // Get user for this tenant (prefer Admin, fallback to any user)
  let invoiceUser = await prisma.users.findFirst({
    where: { tenant_id: tenantId, role: 'Admin' },
  });
  if (!invoiceUser) {
    invoiceUser = await prisma.users.findFirst({
      where: { tenant_id: tenantId },
    });
  }
  if (!invoiceUser) throw new Error('No user found for this tenant');
  // Format invoice response as in adminGetInvoices
  const invoiceResponse = {
    id: billing.id,
    tenantName: billing.tenants?.name || '',
    tenantEmail: invoiceUser?.email || '',
    invoiceNumber: billing.invoice_number,
    amount: billing.amount,
    currency: 'USD',
    status: billing.status?.toLowerCase() || '',
    dueDate: billing.due_date?.toISOString().split('T')[0] || '',
    issueDate: billing.created_at?.toISOString().split('T')[0] || '',
    paidDate: billing.paid_date?.toISOString().split('T')[0] || '',
    plan: plan.name,
    billingCycle: plan.billingCycle,
    description: plan.description,
  };

  // Fetch all subscriptions for this tenant (most recent first)
  const allSubscriptions = await prisma.subscriptions.findMany({
    where: { tenant_id: tenantId },
    orderBy: { start_date: 'desc' },
    include: { plan: true, tenants: true },
  });
  // Format response as in adminGetAllSubscriptions
  const mapped = allSubscriptions.map(sub => ({
    id: sub.id,
    tenantName: sub.tenants ? sub.tenants.name : '',
    planName: sub.plan ? sub.plan.name : sub.plan_type,
    description: sub.plan ? sub.plan.description : '',
    price: sub.plan ? sub.plan.price : null,
    billingCycle: sub.plan ? sub.plan.billingCycle : '',
    maxUsers: sub.plan ? sub.plan.maxUsers : null,
    maxOrders: sub.plan ? sub.plan.maxOrders : null,
    maxStorage: sub.plan ? sub.plan.maxStorage : '',
    status: sub.is_active ? 'active' : 'inactive',
    createdAt: sub.start_date,
    updatedAt: sub.end_date,
  }));
  return {
    subscriptions: mapped,
    invoice: invoiceResponse,
    payment,
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
  const sub = await prisma.subscriptions.findUnique({
    where: { id },
    include: { tenants: true, plan: true },
  });
  if (!sub) throw new Error('Subscription not found');
  if (status === 'inactive') {
    const updated = await prisma.subscriptions.update({
      where: { id },
      data: { is_active: false },
      include: { tenants: true, plan: true },
    });
    return {
      id: updated.id,
      tenantName: updated.tenants ? updated.tenants.name : '',
      planName: updated.plan ? updated.plan.name : updated.plan_type,
      description: updated.plan ? updated.plan.description : '',
      price: updated.plan ? updated.plan.price : null,
      billingCycle: updated.plan ? updated.plan.billingCycle : '',
      maxUsers: updated.plan ? updated.plan.maxUsers : null,
      maxOrders: updated.plan ? updated.plan.maxOrders : null,
      maxStorage: updated.plan ? updated.plan.maxStorage : '',
      status: updated.is_active ? 'active' : 'inactive',
      createdAt: updated.start_date,
      updatedAt: updated.end_date,
    };
  } else if (status === 'active') {
    // Check if another active subscription exists for this tenant
    const activeCount = await prisma.subscriptions.count({
      where: {
        tenant_id: sub.tenant_id,
        is_active: true,
        NOT: { id },
      },
    });
    if (activeCount > 0) {
      throw new Error('Another active subscription already exists for this tenant.');
    }
    const updated = await prisma.subscriptions.update({
      where: { id },
      data: { is_active: true },
      include: { tenants: true, plan: true },
    });
    return {
      id: updated.id,
      tenantName: updated.tenants ? updated.tenants.name : '',
      planName: updated.plan ? updated.plan.name : updated.plan_type,
      description: updated.plan ? updated.plan.description : '',
      price: updated.plan ? updated.plan.price : null,
      billingCycle: updated.plan ? updated.plan.billingCycle : '',
      maxUsers: updated.plan ? updated.plan.maxUsers : null,
      maxOrders: updated.plan ? updated.plan.maxOrders : null,
      maxStorage: updated.plan ? updated.plan.maxStorage : '',
      status: updated.is_active ? 'active' : 'inactive',
      createdAt: updated.start_date,
      updatedAt: updated.end_date,
    };
  } else {
    throw new Error('Invalid status value. Must be "active" or "inactive".');
  }
}

async function adminGetAllUsers(query) {
  const { tenant_id, page = 1, limit = 10, search = '' } = query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const where = {
    ...(tenant_id && { tenant_id }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const [users, count] = await prisma.$transaction([
    prisma.users.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        tenants: true,
        user_roles: { include: { role: true } },
      },
    }),
    prisma.users.count({ where }),
  ]);
  const transformedUsers = users.map(user => {
    const roleObj = user.user_roles && user.user_roles.length > 0
      ? user.user_roles[0].role
      : null;
    const { user_roles, ...rest } = user;
    return {
      ...rest,
      role: roleObj,
      is_verified: user.is_verified,
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
  if (updateData.role_id) {
    await prisma.user_roles.deleteMany({ where: { user_id: userId } });
    await prisma.user_roles.create({
      data: {
        user_id: userId,
        role_id: updateData.role_id,
      },
    });
    const role = await prisma.roles.findUnique({
      where: { id: updateData.role_id },
      select: { id: true, name: true, permissions: true, tenant_id: true },
    });
    await prisma.users.update({
      where: { id: userId },
      data: { role: role.name },
    });
  }
  // Remove email and is_verified if present
  const { role_id, email, is_verified, ...otherFields } = updateData;
  // Only include is_active if present in updateData
  const updateObj = { ...otherFields };
  if (updateData.hasOwnProperty('is_active')) {
    updateObj.is_active = updateData.is_active;
  }
  await prisma.users.update({
    where: { id: userId },
    data: updateObj,
  });
  const user = await prisma.users.findUnique({ where: { id: userId } });
  const userRole = await prisma.user_roles.findFirst({
    where: { user_id: userId },
    include: { role: true },
  });
  return {
    ...user,
    role: userRole ? {
      id: userRole.role.id,
      name: userRole.role.name,
      permissions: userRole.role.permissions,
      tenant_id: userRole.role.tenant_id,
    } : null,
    is_verified: user.is_verified,
  };
}

async function adminInviteUser({ email, tenant_id, role_id }) {
  if (!email || !tenant_id || !role_id) {
    throw new Error('Missing required fields');
  }
  // Generate invite token
  const token = jwt.sign({ email, tenant_id, role_id }, JWT_SECRET, { expiresIn: '72h' });
  const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/superadmin/accept-invite?token=${token}`;
  // Send email
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS
    }
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
  return { message: 'Invitation sent, check your email' };
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
  const { email, tenant_id, role_id } = payload;
  // Check if user exists
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');
  // Hash password
  const bcrypt = require('bcrypt');
  const password_hash = await bcrypt.hash(password, 10);
  // Create user
  const user = await prisma.users.create({
    data: {
      name,
      email,
      tenant_id,
      password_hash,
      is_verified: true
    }
  });
  // Assign role
  await prisma.user_roles.create({
    data: {
      user_id: user.id,
      role_id
    }
  });
  return user;
}

async function adminDeleteUser(userId) {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  await prisma.users.update({
    where: { id: userId },
    data: { is_active: false },
  });
  return { is_active: false, message: 'This user successfully deactivated' };
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
    const orders = await prisma.orders.findMany({
      where: { tenant_id: user.tenantId },
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
          const deliveryDate = new Date(o.delivery_date);
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
    const purchaseOrders = await prisma.purchase_orders.findMany({
      where: { tenant_id: user.tenantId },
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
        totalValue: purchaseOrders.reduce((sum, po) => sum + Number(po.grand_total || 0), 0),
        conversionRate: (convertedPOs / purchaseOrders.length) * 100,
        convertedPOs
      };
    }

    // Calculate financial metrics
    const receivables = await prisma.orders.findMany({
      where: {
        tenant_id: user.tenantId,
        status: { in: ['completed', 'dispatched'] }
      }
    });

    if (receivables.length > 0) {
      summary.financial.receivables = {
        total: receivables.reduce((sum, order) => sum + Number(order.quantity_kg || 0), 0),
        overdue: receivables.filter(order => {
          const deliveryDate = new Date(order.delivery_date);
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
    const currTenants = await prisma.tenants.count({
      where: { created_at: { gte: currStart, lte: currEnd }, is_active: true }
    });
    const prevTenants = await prisma.tenants.count({
      where: { created_at: { gte: prevStart, lte: prevEnd }, is_active: true }
    });
    const totalTenants = await prisma.tenants.count({ where: { is_active: true } });

    // Users
    const currUsers = await prisma.users.count({
      where: { is_active: true, created_at: { gte: currStart, lte: currEnd } }
    });
    const prevUsers = await prisma.users.count({
      where: { is_active: true, created_at: { gte: prevStart, lte: prevEnd } }
    });
    const totalUsers = await prisma.users.count({ where: { is_active: true } });

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