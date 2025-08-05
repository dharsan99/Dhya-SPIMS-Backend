const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Plan seeding data
const planSeedData = [
  {
    name: 'Starter (14-day trial)',
    price: 0,
    billingCycle: 'trial',
    description: 'Perfect for trying out core features of SPIMS for small mills',
    features: [
      'Up to 5 employees',
      'Basic order management',
      'Production tracking',
      'Email support',
      '500MB storage'
    ],
    maxUsers: 5,
    maxOrders: 50,
    maxStorage: '500MB',
    popular: false,
    isActive: true
  },
  {
    name: 'Growth',
    price: 49,
    billingCycle: 'month',
    description: 'Ideal for growing spinning mills with advanced operations',
    features: [
      'Up to 50 employees',
      'Advanced order management',
      'Inventory control',
      'Email & chat support',
      '5GB storage',
      'Basic analytics dashboard',
      'API access'
    ],
    maxUsers: 50,
    maxOrders: 500,
    maxStorage: '5GB',
    popular: true,
    isActive: true
  },
  {
    name: 'Enterprise',
    price: 199,
    billingCycle: 'month',
    description: 'For large mills with complex operations and custom needs',
    features: [
      'Unlimited employees',
      'Full order management suite',
      'Real-time production & inventory',
      '24/7 phone support',
      'Unlimited storage',
      'Custom analytics dashboard',
      'Full API access',
      'White-label solutions',
      'Dedicated account manager',
      'Custom training sessions'
    ],
    maxUsers: 'Unlimited',
    maxOrders: 'Unlimited',
    maxStorage: 'Unlimited',
    popular: false,
    isActive: true
  }
];

// Will hold { planName: uuid }
const planNameToId = {};

// Utility to calculate expiry and renewal dates
function getPlanDates(billingCycle, createdAt = new Date()) {
  let expiryDate, renewalDate;
  if (billingCycle === 'trial') {
    expiryDate = new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
  } else if (billingCycle === 'month') {
    expiryDate = new Date(createdAt);
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else if (billingCycle === 'year') {
    expiryDate = new Date(createdAt);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }
  if (expiryDate) {
    renewalDate = new Date(expiryDate);
    renewalDate.setDate(renewalDate.getDate() + 1);
  } else {
    renewalDate = createdAt;
  }
  return { expiryDate, renewalDate };
}

async function seedPlans() {
  console.log('🌱 Seeding Plans...');
  for (const plan of planSeedData) {
    let existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      const id = uuidv4();
      const createdAt = new Date();
      const { expiryDate, renewalDate } = getPlanDates(plan.billingCycle, createdAt);
      const created = await prisma.plan.create({ 
        data: { 
          ...plan, 
          id, 
          expiryDate, 
          renewalDate,
          createdAt,
          updatedAt: createdAt
        } 
      });
      planNameToId[plan.name] = created.id;
      console.log(`✅ Created plan: ${plan.name}`);
    } else {
      planNameToId[plan.name] = existing.id;
      console.log(`⚡ Plan already exists: ${plan.name}`);
    }
  }
  console.log('✅ Plans seeding completed');
}

async function seedSuperAdmin() {
  console.log('🌱 Seeding Super Admin User...');
    // Check if super admin already exists
  const existingUser = await prisma.users.findFirst({ where: { email: 'dharshan@dhya.in' } });
    if (existingUser) {
      console.log('✅ Super Admin user already exists, skipping...');
    // Fetch the existing tenant and role for further seeding
    const userRole = await prisma.userRole.findFirst({ where: { userId: existingUser.id } });
    return { tenantId: existingUser.tenantId, userId: existingUser.id, roleId: userRole ? userRole.roleId : null };
  }
  const tenantId = uuidv4();
  const userId = uuidv4();
  const roleId = uuidv4();
  const passwordHash = await bcrypt.hash('admin123', 10);
    const permissions = {
      Orders: ["Add Order", "Update Order", "Delete Order", "View Order"],
      Shades: ["Add Shade", "Update Shade", "Delete Shade", "View Shade"],
      Fibres: ["Add Fibre", "Update Fibre", "Delete Fibre", "View Fibre"],
      Production: ["Add Production", "Update Production", "Delete Production", "View Production"],
      Buyers: ["Add Buyer", "Update Buyer", "Delete Buyer", "View Buyer"],
      Employees: ["Add Employee", "Update Employee", "Delete Employee", "View Employee"],
      Attendance: ["Add Attendance", "Update Attendance", "Delete Attendance", "View Attendance"],
      Suppliers: ["Add Supplier", "Update Supplier", "Delete Supplier", "View Supplier"],
      Settings: ["Add Settings", "Update Setting", "Delete Settings", "View Settings"],
      Roles: ["Add Role", "Update Role", "Delete Role", "View Role"],
      Users: ["Add User", "Update User", "Delete User", "View User"],
      Stocks: ["Add Stock", "Update Stock", "Delete Stock", "View Stock"]
    };
  await prisma.tenant.create({
        data: {
          id: tenantId,
      name: 'SuperTenant',
      domain: 'supertenant.com',
          plan: 'TRIAL',
      isActive: true,
      storage_path: '/mnt/storage',
      address: '123 Super St',
      phone: '1234567890',
      industry: 'Textiles',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      logo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
        },
      });
  await prisma.role.create({
        data: {
          id: roleId,
      tenantId: tenantId,
      name: 'superadmin',
      description: 'Superadmin role',
          permissions,
      createdAt: new Date(),
      updatedAt: new Date(),
        },
      });
  await prisma.users.create({
        data: {
          id: userId,
      tenantId: tenantId,
          name: 'Dharshan',
          email: 'dharshan@dhya.in',
      passwordHash,
      role: 'superadmin',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
        },
      });
  await prisma.userRole.create({
        data: {
      id: uuidv4(),
      userId: userId,
      roleId: roleId,
        },
      });
    return { tenantId, userId, roleId };
}

async function seedAdminRoleAndUser(tenantId, permissions) {
  console.log('🌱 Seeding Admin role and user...');
  // Check if admin role already exists for this tenant
  let role = await prisma.role.findFirst({ where: { tenantId, name: 'admin' } });
  let roleId;
  if (!role) {
    roleId = uuidv4();
    role = await prisma.role.create({
      data: {
        id: roleId,
        tenantId: tenantId,
        name: 'admin',
        description: 'Admin role',
        permissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } else {
    roleId = role.id;
  }
  // Check if admin user already exists for this tenant
  let user = await prisma.users.findFirst({ where: { tenantId, email: 'admin@dhya.in' } });
  let userId;
  if (!user) {
    userId = uuidv4();
    user = await prisma.users.create({
      data: {
        id: userId,
        tenantId: tenantId,
        name: 'Admin User',
        email: 'admin@dhya.in',
        passwordHash: await bcrypt.hash('admin123', 10),
        role: 'admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  } else {
    userId = user.id;
  }
  // Check if userRole link already exists
  const userRole = await prisma.userRole.findFirst({ where: { userId, roleId } });
  if (!userRole) {
    await prisma.userRole.create({
      data: {
        id: uuidv4(),
        userId: userId,
        roleId: roleId,
      },
    });
  }
}

async function seedFibres() {
  console.log('🌱 Seeding Fibres...');
  await prisma.fibre.create({
    data: {
      id: uuidv4(),
      fibreName: 'Cotton',
      fibreCode: 'COT001',
      stockKg: 1000,
      description: 'High quality cotton',
      createdAt: new Date(),
      updatedAt: new Date(),
          },
        });
  await prisma.fibre.create({
                  data: {
      id: uuidv4(),
      fibreName: 'Polyester',
      fibreCode: 'POLY001',
      stockKg: 500,
      description: 'Durable polyester',
      createdAt: new Date(),
      updatedAt: new Date(),
          },
        });
}

async function seedEmployeesAndAttendance() {
  console.log('🌱 Seeding Employees and Attendance...');
  const emp1 = await prisma.employee.create({
    data: {
      id: uuidv4(),
      name: 'John Smith',
      tokenNo: 'EMP001',
      shiftRate: 25.5,
      aadharNo: '1234-5678-9012',
      bankAcc1: 'ACC001234567890',
      bankAcc2: 'ACC001234567891',
      department: 'Manufacturing',
      joinDate: new Date('2024-01-15'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const emp2 = await prisma.employee.create({
    data: {
      id: uuidv4(),
      name: 'Sarah Johnson',
      tokenNo: 'EMP002',
      shiftRate: 28.75,
      aadharNo: '2345-6789-0123',
      bankAcc1: 'ACC002234567890',
      bankAcc2: null,
      department: 'Quality Control',
      joinDate: new Date('2023-11-20'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await prisma.attendance.create({
    data: {
      id: uuidv4(),
      date: new Date('2025-07-01'),
      shift: 'SHIFT_1',
      overtimeHours: 2,
      totalHours: 10,
      status: 'PRESENT',
      employeeId: emp1.id,
      inTime: new Date('2025-07-01T06:00:00Z'),
      outTime: new Date('2025-07-01T16:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  await prisma.attendance.create({
    data: {
      id: uuidv4(),
      date: new Date('2025-07-02'),
      shift: 'SHIFT_2',
      overtimeHours: 0,
      totalHours: 8,
      status: 'PRESENT',
      employeeId: emp2.id,
      inTime: new Date('2025-07-02T14:00:00Z'),
      outTime: new Date('2025-07-02T22:00:00Z'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
}

async function enhancedMain() {
  try {
    await seedPlans(); // Seed plans first
    const { tenantId, userId, roleId } = await seedSuperAdmin();
    let permissions = {
      Orders: ["Add Order", "Update Order", "Delete Order", "View Order"],
      Shades: ["Add Shade", "Update Shade", "Delete Shade", "View Shade"],
      Fibres: ["Add Fibre", "Update Fibre", "Delete Fibre", "View Fibre"],
      Production: ["Add Production", "Update Production", "Delete Production", "View Production"],
      Buyers: ["Add Buyer", "Update Buyer", "Delete Buyer", "View Buyer"],
      Employees: ["Add Employee", "Update Employee", "Delete Employee", "View Employee"],
      Attendance: ["Add Attendance", "Update Attendance", "Delete Attendance", "View Attendance"],
      Suppliers: ["Add Supplier", "Update Supplier", "Delete Supplier", "View Supplier"],
      Settings: ["Add Settings", "Update Setting", "Delete Settings", "View Settings"],
      Roles: ["Add Role", "Update Role", "Delete Role", "View Role"],
      Users: ["Add User", "Update User", "Delete User", "View User"],
      Stocks: ["Add Stock", "Update Stock", "Delete Stock", "View Stock"]
    };
    if (roleId) {
      const superRole = await prisma.role.findUnique({ where: { id: roleId } });
      if (superRole && superRole.permissions) permissions = superRole.permissions;
    } else {
      console.warn('⚠️  No super admin roleId found, using default permissions for admin role.');
    }
    await seedAdminRoleAndUser(tenantId, permissions);
    await seedFibres();
    await seedEmployeesAndAttendance();
    console.log('✅ Seeding complete!');
    console.log('\n--- Seed Data Summary ---');
    console.log('Super Admin Tenant: SuperTenant');
    console.log('Super Admin User: dharshan@dhya.in');
    console.log('Admin User: admin@dhya.in');
    console.log('Roles: superadmin, admin');
    console.log('Fibres: Cotton, Polyester');
    console.log('Employees: John Smith, Sarah Johnson');
    console.log('Attendance: 2 records (one for each employee)');
    console.log('-------------------------\n');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

module.exports = { main: enhancedMain, enhancedMain };

if (require.main === module) {
  enhancedMain();
}