const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const { startOfMonth, subMonths, format } = require('date-fns');

async function getBillingStats(tenantId) {
  // Return mock values as requested
  return {
    totalRevenue: '1,00,000',
    pendingAmount: '58,0000',
    overdueAmount: '20,000',
    paidInvoices: '48',
    totalInvoices: '70',
    paidPercentage: '79%',
    stats: [
      {
        title: 'Total Revenue',
        value: '1,00,000',
        change: '+12%',
        changeType: 'positive',
        description: 'Total revenue collected'
      },
      {
        title: 'Pending Amount',
        value: '58,0000',
        change: '+5%',
        changeType: 'neutral',
        description: 'Amount awaiting payment'
      },
      {
        title: 'Overdue Amount',
        value: '20,000',
        change: '-8%',
        changeType: 'negative',
        description: 'Amount past due date'
      },
      {
        title: 'Payment Rate',
        value: '79%',
        change: '+3%',
        changeType: 'positive',
        description: 'Percentage of paid invoices'
      }
    ]
  };
}

async function adminGetInvoices({ search = '', status = 'all', plan, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' }) {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  // Build where clause for billing
  let where = {};
  if (status !== 'all') {
    where.status = status.toUpperCase();
  }
  if (search) {
    where.OR = [
      { invoice_number: { contains: search, mode: 'insensitive' } },
      { tenants: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  // Join with tenant, subscription, plan
  const [invoices, totalItems] = await Promise.all([
    prisma.billing.findMany({
      where,
      skip,
      take,
      orderBy: { created_at: sortOrder },
      include: {
        tenants: true,
      },
    }),
    prisma.billing.count({ where }),
  ]);
  // Map to response format
  const mapped = await Promise.all(invoices.map(async (inv) => {
    // Get subscription and plan for this tenant
    const subscription = await prisma.subscriptions.findFirst({
      where: { tenant_id: inv.tenant_id, is_active: true },
      include: { plan: true }
    });
    // Get admin user for this tenant
    const adminUser = await prisma.users.findFirst({
      where: { tenant_id: inv.tenant_id, role: 'Admin' },
    });
    return {
      id: inv.id,
      tenantName: inv.tenants?.name || '',
      tenantEmail: adminUser?.email || '',
      invoiceNumber: inv.invoice_number,
      amount: inv.amount,
      currency: 'USD',
      status: inv.status?.toLowerCase() || '',
      dueDate: inv.due_date?.toISOString().split('T')[0] || '',
      issueDate: inv.created_at?.toISOString().split('T')[0] || '',
      paidDate: inv.paid_date?.toISOString().split('T')[0] || '',
      plan: subscription?.plan?.name || '',
      billingCycle: subscription?.plan?.billingCycle || '',
      description: subscription?.plan?.description || '',
    };
  }));
  const totalPages = Math.ceil(totalItems / take);
  return {
    invoices: mapped,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems,
      itemsPerPage: take,
    },
  };
}

async function sendInvoiceEmail(invoiceId) {
  // Fetch invoice, tenant, and user
  const invoice = await prisma.billing.findUnique({
    where: { id: invoiceId },
    include: { tenants: true },
  });
  if (!invoice) throw new Error('Invoice not found');
  let invoiceUser = await prisma.users.findFirst({
    where: { tenant_id: invoice.tenant_id, role: 'Admin' },
  });
  if (!invoiceUser) {
    // Fallback: get any user for this tenant
    invoiceUser = await prisma.users.findFirst({
      where: { tenant_id: invoice.tenant_id },
    });
  }
  if (!invoiceUser) throw new Error('No user found for this tenant');

  // Demo data for line items (replace with real data if available)
  const lineItems = [
    { description: 'Brand consultation', unitPrice: 100, qty: 1, total: 100 },
    { description: 'Logo design', unitPrice: 100, qty: 1, total: 100 },
    { description: 'Website design', unitPrice: 100, qty: 1, total: 100 },
    { description: 'Social media templates', unitPrice: 100, qty: 1, total: 100 },
    { description: 'Brand photography', unitPrice: 100, qty: 1, total: 100 },
    { description: 'Brand guide', unitPrice: 100, qty: 1, total: 100 },
  ];
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.10;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  // Styled HTML invoice (email-friendly)
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 12px; border: 1px solid #eee; padding: 32px; background: #fff;">
    <h2 style="letter-spacing: 8px; text-align: right; font-weight: 400; margin-bottom: 32px;">INVOICE</h2>
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div>
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">ISSUED TO:</div>
        <div style="font-size: 14px; margin-top: 4px;">${invoiceUser.name || ''}<br>${invoice.tenants?.name || ''}<br>${invoice.tenants?.address || ''}</div>
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px; margin-top: 16px;">PAY TO:</div>
        <div style="font-size: 14px; margin-top: 4px;">Borcele Bank<br>Account Name: Adeline Palmerston<br>Account No.: 0123 4567 8901</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">INVOICE NO:</div>
        <div style="font-size: 14px; margin-bottom: 8px;">${invoice.invoice_number}</div>
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">DATE:</div>
        <div style="font-size: 14px; margin-bottom: 8px;">${invoice.created_at?.toISOString().split('T')[0] || ''}</div>
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">DUE DATE:</div>
        <div style="font-size: 14px;">${invoice.due_date?.toISOString().split('T')[0] || ''}</div>
      </div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="border-bottom: 2px solid #222;">
          <th style="text-align: left; font-size: 12px; letter-spacing: 1px; padding: 8px 0;">DESCRIPTION</th>
          <th style="text-align: right; font-size: 12px; letter-spacing: 1px; padding: 8px 0;">UNIT PRICE</th>
          <th style="text-align: right; font-size: 12px; letter-spacing: 1px; padding: 8px 0;">QTY</th>
          <th style="text-align: right; font-size: 12px; letter-spacing: 1px; padding: 8px 0;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems.map(item => `
          <tr>
            <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${item.description}</td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">${item.unitPrice}</td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">${item.qty}</td>
            <td style="text-align: right; padding: 8px 0; border-bottom: 1px solid #eee;">$${item.total}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 32px;">
      <div style="font-size: 14px; margin-bottom: 4px;"><strong>SUBTOTAL</strong> <span style="margin-left: 32px;">$${subtotal}</span></div>
      <div style="font-size: 14px; margin-bottom: 4px;">Tax <span style="margin-left: 64px;">10%</span></div>
      <div style="font-size: 16px; font-weight: bold;">TOTAL <span style="margin-left: 48px;">$${total}</span></div>
    </div>
    <div style="margin-top: 48px; text-align: right;">
      <span style="font-family: cursive; font-size: 20px;">Adeline Palmerston</span>
    </div>
  </div>
  `;

  // Configure nodemailer
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'Gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Send the email
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: invoiceUser.email,
    subject: `Invoice ${invoice.invoice_number} from SPIMS`,
    html,
  });
}

async function getPayments({ search = '', status = 'all', plan, page = 1, limit = 20, sortBy = 'paidAt', sortOrder = 'desc', tenantId }) {
  let where = {};
  if (tenantId) {
    where.tenant_id = tenantId;
  }
  if (status && status !== 'all') {
    where.status = { equals: status, mode: 'insensitive' };
  }
  if (search) {
    where.OR = [
      { txn_id: { contains: search, mode: 'insensitive' } },
      { method: { contains: search, mode: 'insensitive' } },
      { status: { contains: search, mode: 'insensitive' } },
      { billing: { invoice_number: { contains: search, mode: 'insensitive' } } },
      { tenants: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  // Map sortBy to actual DB field
  let sortField = sortBy;
  if (sortBy === 'paidAt') sortField = 'paid_at';
  if (sortBy === 'billingId') sortField = 'billing_id';
  if (sortBy === 'tenantId') sortField = 'tenant_id';
  // Add more mappings as needed
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const [payments, totalItems, allPayments] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { billing: true, tenants: true },
      orderBy: { [sortField]: sortOrder },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
    prisma.payment.findMany({ where, include: { billing: true, tenants: true } }),
  ]);
  const totalAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const Completed = allPayments.filter(p => p.status && p.status.toLowerCase() === 'paid').length;
  const Pending = allPayments.filter(p => p.status && p.status.toLowerCase() === 'pending').length;
  const Failed = allPayments.filter(p => p.status && p.status.toLowerCase() === 'failed').length;
  const totalPages = Math.ceil(totalItems / take);
  return {
    totalAmount,
    Completed,
    Pending,
    Failed,
    payments: payments.map(p => ({
      id: p.id,
      billingId: p.billing_id,
      invoiceNumber: p.billing?.invoice_number || '',
      tenantId: p.tenant_id,
      tenantName: p.tenants?.name || '',
      amount: p.amount,
      method: p.method,
      status: p.status,
      paidAt: p.paid_at,
      txnId: p.txn_id,
    })),
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems,
      itemsPerPage: take,
    },
  };
}

async function getPayment(paymentId) {
  if (!paymentId) throw new Error('paymentId is required');
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { billing: true, tenants: true },
  });
  if (!payment) throw new Error('Payment not found');
  return {
    id: payment.id,
    billingId: payment.billing_id,
    invoiceNumber: payment.billing?.invoice_number || '',
    tenantId: payment.tenant_id,
    tenantName: payment.tenants?.name || '',
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paid_at,
    txnId: payment.txn_id,
  };
}

async function postPayment({ billingId, tenantId, amount, method, status, txnId }) {
  if (!billingId || !tenantId || !amount || !method || !status) throw new Error('Missing required fields');
  const payment = await prisma.payment.create({
    data: {
      billing_id: billingId,
      tenant_id: tenantId,
      amount,
      method,
      status,
      txn_id: txnId || null,
    },
    include: { billing: true, tenants: true },
  });
  return {
    id: payment.id,
    billingId: payment.billing_id,
    invoiceNumber: payment.billing?.invoice_number || '',
    tenantId: payment.tenant_id,
    tenantName: payment.tenants?.name || '',
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paid_at,
    txnId: payment.txn_id,
  };
}

async function getRevenueTrends(tenantId) {
  // Get the last 6 months (including current)
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(startOfMonth(now), i);
    months.push({
      key: format(d, 'yyyy-MM'),
      label: format(d, 'MMM yyyy'),
      start: d,
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    });
  }
  // Query paid invoices from billing table
  let where = { status: { in: ['PAID', 'paid'] } };
  if (tenantId) where.tenant_id = tenantId;
  const invoices = await prisma.billing.findMany({ where });
  // Aggregate by month
  const trends = months.map(({ key, label, start, end }) => {
    const monthInvoices = invoices.filter(inv => inv.created_at >= start && inv.created_at <= end);
    const revenue = monthInvoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    return {
      month: label,
      revenue,
      invoiceCount: monthInvoices.length
    };
  });
  const totalRevenue = trends.reduce((sum, t) => sum + t.revenue, 0);
  const totalInvoices = trends.reduce((sum, t) => sum + t.invoiceCount, 0);
  const averageMonthlyRevenue = trends.length > 0 ? totalRevenue / trends.length : 0;
  // Calculate percent change from last month
  const last = trends[trends.length - 1]?.revenue || 0;
  const prev = trends[trends.length - 2]?.revenue || 0;
  const changeFromLastMonth = prev === 0 ? 0 : ((last - prev) / prev) * 100;
  return {
    revenueTrends: trends,
    totalRevenue,
    averageMonthlyRevenue: Number(averageMonthlyRevenue.toFixed(1)),
    totalInvoices,
    changeFromLastMonth: Number(changeFromLastMonth.toFixed(1))
  };
}

module.exports = { getBillingStats, adminGetInvoices, sendInvoiceEmail, getPayments, getPayment, postPayment, getRevenueTrends }; 