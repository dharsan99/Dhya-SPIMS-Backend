const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');
const { startOfMonth, subMonths, format } = require('date-fns');
const fs = require('fs');
const path = require('path');
const pdf = require('html-pdf'); // You may need to install html-pdf or use another PDF lib

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
  let where = {};
  if (status !== 'all') {
    where.status = status.toUpperCase();
  }
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { tenant: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  const [invoices, totalItems] = await Promise.all([
    prisma.billing.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: sortOrder },
      include: {
        tenant: true,
      },
    }),
    prisma.billing.count({ where }),
  ]);
  const mapped = await Promise.all(invoices.map(async (inv) => {
    const subscription = await prisma.subscription.findFirst({
      where: { tenantId: inv.tenantId, isActive: true },
      include: { plan: true }
    });
    const adminUser = await prisma.users.findFirst({
      where: { tenantId: inv.tenantId, role: 'Admin' },
    });
    return {
      id: inv.id,
      tenantName: inv.tenant?.name || '',
      tenantEmail: adminUser?.email || '',
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      currency: 'USD',
      status: inv.status?.toLowerCase() || '',
      dueDate: inv.dueDate?.toISOString().split('T')[0] || '',
      issueDate: inv.createdAt?.toISOString().split('T')[0] || '',
      paidDate: inv.paidDate?.toISOString().split('T')[0] || '',
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

async function sendInvoiceEmail(invoiceNumber) {
  const invoice = await prisma.billing.findUnique({
    where: { invoiceNumber },
    include: { tenant: true },
  });
  if (!invoice) { throw new Error('Invoice not found'); }

  const invoiceUser = await prisma.users.findFirst({
    where: { tenantId: invoice.tenantId },
  });
  if (!invoiceUser) { throw new Error('User not found for this invoice'); }

  const subtotal = invoice.amount;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd;">
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #333;">SPIMS Invoice</h1>
      <p style="color: #666;">Invoice #${invoice.invoiceNumber}</p>
    </div>
    <div style="margin-bottom: 30px;">
      <div style="margin-bottom: 10px;">
        <strong>Bill To:</strong><br>
        ${invoice.tenant?.name || 'N/A'}<br>
        ${invoice.tenant?.address || 'N/A'}
      </div>
      <div style="margin-bottom: 10px;">
        <strong>Date:</strong> ${invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : 'N/A'}<br>
        <strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}
      </div>
    </div>
    <div style="border-top: 2px solid #333; padding-top: 20px; margin-bottom: 20px;">
      <div style="font-size: 14px; margin-bottom: 4px;"><strong>SUBTOTAL</strong> <span style="margin-left: 32px;">$${subtotal}</span></div>
      <div style="font-size: 14px; margin-bottom: 4px;">Tax <span style="margin-left: 64px;">10%</span></div>
      <div style="font-size: 16px; font-weight: bold;">TOTAL <span style="margin-left: 48px;">$${total}</span></div>
    </div>
    <div style="margin-top: 48px; text-align: right;">
      <span style="font-family: cursive; font-size: 20px;">Adeline Palmerston</span>
    </div>
  </div>
  `;

  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email credentials not configured. Skipping invoice email.');
    console.log('📧 Invoice number:', invoiceNumber);
    console.log('👤 Recipient:', invoiceUser.email);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'Gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: invoiceUser.email,
      subject: `Invoice ${invoice.invoiceNumber} from SPIMS`,
      html,
    });

    console.log('✅ Invoice email sent successfully to:', invoiceUser.email);
  } catch (error) {
    console.error('❌ Failed to send invoice email:', error.message);
    console.log('📧 Invoice number:', invoiceNumber);
    console.log('👤 Recipient:', invoiceUser.email);
  }
}

const sendInvoiceBillEmail = sendInvoiceEmail;

async function getPayments({ search = '', status = 'all', plan, page = 1, limit = 20, sortBy = 'paidAt', sortOrder = 'desc', tenantId }) {
  let where = {};
  if (tenantId) {
    where.tenantId = tenantId;
  }
  if (status && status !== 'all') {
    where.status = { equals: status, mode: 'insensitive' };
  }
  if (search) {
    where.OR = [
      { txnId: { contains: search, mode: 'insensitive' } },
      { method: { contains: search, mode: 'insensitive' } },
      { status: { contains: search, mode: 'insensitive' } },
      { billing: { invoiceNumber: { contains: search, mode: 'insensitive' } } },
      { tenant: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }
  let sortField = sortBy;
  if (sortBy === 'paidAt') sortField = 'paidAt';
  if (sortBy === 'billingId') sortField = 'billingId';
  if (sortBy === 'tenantId') sortField = 'tenantId';
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);
  const [payments, totalItems, allPayments] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { billing: true, tenant: true },
      orderBy: { [sortField]: sortOrder },
      skip,
      take,
    }),
    prisma.payment.count({ where }),
    prisma.payment.findMany({ where, include: { billing: true, tenant: true } }),
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
      billingId: p.billingId,
      invoiceNumber: p.billing?.invoiceNumber || '',
      tenantId: p.tenantId,
      tenantName: p.tenant?.name || '',
      amount: p.amount,
      method: p.method,
      status: p.status,
      paidAt: p.paidAt,
      txnId: p.txnId,
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
    include: { billing: true, tenant: true },
  });
  if (!payment) throw new Error('Payment not found');
  return {
    id: payment.id,
    billingId: payment.billingId,
    invoiceNumber: payment.billing?.invoiceNumber || '',
    tenantId: payment.tenantId,
    tenantName: payment.tenant?.name || '',
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    txnId: payment.txnId,
  };
}

async function postPayment({ billingId, tenantId, amount, method, status, txnId }) {
  if (!billingId || !tenantId || !amount || !method || !status) throw new Error('Missing required fields');
  const payment = await prisma.payment.create({
    data: {
      billingId,
      tenantId,
      amount,
      method,
      status,
      txnId: txnId || null,
    },
    include: { billing: true, tenant: true },
  });
  return {
    id: payment.id,
    billingId: payment.billingId,
    invoiceNumber: payment.billing?.invoiceNumber || '',
    tenantId: payment.tenantId,
    tenantName: payment.tenant?.name || '',
    amount: payment.amount,
    method: payment.method,
    status: payment.status,
    paidAt: payment.paidAt,
    txnId: payment.txnId,
  };
}

async function getRevenueTrends(tenantId) {
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
  let where = { status: { in: ['PAID', 'paid'] } };
  if (tenantId) where.tenantId = tenantId;
  const invoices = await prisma.billing.findMany({ where });
  const trends = months.map(({ key, label, start, end }) => {
    const monthInvoices = invoices.filter(inv => inv.createdAt >= start && inv.createdAt <= end);
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

async function downloadInvoice(invoiceNumber) {
  const invoice = await prisma.billing.findUnique({
    where: { invoiceNumber },
    include: { tenant: true },
  });
  if (!invoice) throw new Error('Invoice not found');
  let invoiceUser = await prisma.users.findFirst({
    where: { tenantId: invoice.tenantId, role: 'Admin' },
  });
  if (!invoiceUser) {
    invoiceUser = await prisma.users.findFirst({
      where: { tenantId: invoice.tenantId },
    });
  }
  if (!invoiceUser) throw new Error('No user found for this tenant');

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

  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border-radius: 12px; border: 1px solid #eee; padding: 32px; background: #fff;">
    <h2 style="letter-spacing: 8px; text-align: right; font-weight: 400; margin-bottom: 32px;">INVOICE</h2>
    <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
      <div>
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">ISSUED TO:</div>
        <div style="font-size: 14px; margin-top: 4px;">${invoiceUser.name || ''}<br>${invoice.tenant?.name || ''}<br>${invoice.tenant?.address || ''}</div>
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px; margin-top: 16px;">PAY TO:</div>
        <div style="font-size: 14px; margin-top: 4px;">Borcele Bank<br>Account Name: Adeline Palmerston<br>Account No.: 0123 4567 8901</div>
      </div>
      <div style="text-align: right;">
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">INVOICE NO:</div>
        <div style="font-size: 14px; margin-bottom: 8px;">${invoice.invoiceNumber}</div>
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">DATE:</div>
        <div style="font-size: 14px; margin-bottom: 8px;">${invoice.createdAt?.toISOString().split('T')[0] || ''}</div>
        <div style="font-size: 12px; font-weight: bold; letter-spacing: 1px;">DUE DATE:</div>
        <div style="font-size: 14px;">${invoice.dueDate?.toISOString().split('T')[0] || ''}</div>
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

  return new Promise((resolve, reject) => {
    pdf.create(html).toBuffer((err, buffer) => {
      if (err) return reject(err);
      resolve({
        filename: `Invoice_${invoice.invoiceNumber}.pdf`,
        buffer,
        mimetype: 'application/pdf',
      });
    });
  });
}

async function adminCreateInvoice(tenantId) {
  if (!tenantId) throw new Error('tenantId is required');
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const count = await prisma.billing.count({ where: { createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } } });
  const invoiceNumber = `INV${dateStr}${String(count + 1).padStart(3, '0')}`;
  const amount = 1000;
  const dueDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15);
  const billing = await prisma.billing.create({
    data: {
      tenantId,
      invoiceNumber,
      amount,
      dueDate,
      paidDate: null,
      status: 'PENDING',
    },
    include: { tenant: true },
  });
  let invoiceUser = await prisma.users.findFirst({
    where: { tenantId, role: 'Admin' },
  });
  if (!invoiceUser) {
    invoiceUser = await prisma.users.findFirst({
      where: { tenantId },
    });
  }
  return {
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
  };
}

async function getRecentPaymentActivity() {
  const payments = await prisma.payment.findMany({
    orderBy: { paidAt: 'desc' },
    take: 3,
    include: { tenant: true },
  });
  return payments.map(p => ({
    name: p.tenant?.name || '',
    method: p.method,
    txnId: p.txnId,
    amount: p.amount,
    date: p.paidAt,
  }));
}

module.exports = { getBillingStats, adminGetInvoices, sendInvoiceEmail, sendInvoiceBillEmail, getPayments, getPayment, postPayment, getRevenueTrends, downloadInvoice, adminCreateInvoice, getRecentPaymentActivity }; 