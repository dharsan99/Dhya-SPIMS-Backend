const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

// Remove plan_code and use plan.name as the unique key
const planSeedData = [
  {
    name: 'Starter (4-day trial)',
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
    is_active: true
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
    is_active: true
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
    is_active: true
  }
];

// Will hold { planName: uuid }
const planNameToId = {};

async function seedPlans() {
  console.log('🌱 Seeding Plans...');
  for (const plan of planSeedData) {
    let existing = await prisma.plan.findFirst({ where: { name: plan.name } });
    if (!existing) {
      const id = uuidv4();
      const created = await prisma.plan.create({ data: { ...plan, id } });
      planNameToId[plan.name] = created.id;
      console.log(`✅ Created plan: ${plan.name}`);
    } else {
      planNameToId[plan.name] = existing.id;
      console.log(`⚡ Plan already exists: ${plan.name}`);
    }
  }
}

// Modified seedSuperAdmin to return tenantId, userId, roleId
async function seedSuperAdmin() {
  console.log('🌱 Seeding Super Admin User...');
  let tenantId, userId, roleId;
  try {
    // Check if super admin already exists
    const existingUser = await prisma.users.findFirst({
      where: { email: 'dharshan@dhya.in' }
    });
    if (existingUser) {
      const existingTenant = await prisma.tenants.findFirst({ where: { id: existingUser.tenant_id } });
      const existingRole = await prisma.roles.findFirst({ where: { tenant_id: existingUser.tenant_id, name: 'Superadmin' } });
      console.log('✅ Super Admin user already exists, skipping...');
      return { tenantId: existingTenant.id, userId: existingUser.id, roleId: existingRole.id };
    }
    tenantId = crypto.randomUUID();
    userId = crypto.randomUUID();
    roleId = tenantId; // Use tenantId as roleId for superadmin
    const passwordHash = await bcrypt.hash('12345', 10);
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
    await prisma.$transaction(async (tx) => {
      await tx.tenants.create({
        data: {
          id: tenantId,
          name: 'spimsadmin',
          domain: 'farms',
          plan: 'TRIAL',
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      await tx.roles.create({
        data: {
          id: roleId,
          tenant_id: tenantId,
          name: 'Superadmin',
          description: 'Admin role with full access',
          permissions,
        },
      });
      await tx.users.create({
        data: {
          id: userId,
          tenant_id: tenantId,
          name: 'Dharshan',
          email: 'dharshan@dhya.in',
          password_hash: passwordHash,
          role: 'Super admin',
          is_active: true,
          is_verified: true,
        },
      });
      await tx.user_roles.create({
        data: {
          user_id: userId,
          role_id: roleId,
        },
      });
    });
    console.log('✅ Super Admin user, tenant, and role seeded.');
    return { tenantId, userId, roleId };
  } catch (error) {
    console.error('❌ Error seeding Super Admin:', error.message);
    throw error;
  }
}

async function seedAdminRoleAndUser(superTenantId, permissions) {
  console.log('🌱 Seeding Admin role and user for superadmin tenant...');
  const adminRoleId = crypto.randomUUID();
  const adminUserId = crypto.randomUUID();
  const adminEmail = 'admin@dhya.in';
  const passwordHash = await bcrypt.hash('admin123', 10);
  // Check if admin user already exists
  const existingAdmin = await prisma.users.findFirst({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log('✅ Admin user already exists, skipping...');
    return { adminRoleId: existingAdmin.id, adminUserId: existingAdmin.id };
  }
  await prisma.$transaction(async (tx) => {
    await tx.roles.create({
      data: {
        id: adminRoleId,
        tenant_id: superTenantId,
        name: 'Admin',
        description: 'Admin role with full access',
        permissions,
      },
    });
    await tx.users.create({
      data: {
        id: adminUserId,
        tenant_id: superTenantId,
        name: 'Admin',
        email: adminEmail,
        password_hash: passwordHash,
        role: 'Admin',
        is_active: true,
        is_verified: true,
      },
    });
    await tx.user_roles.create({
      data: {
        user_id: adminUserId,
        role_id: adminRoleId,
      },
    });
  });
  console.log('✅ Admin role and user seeded.');
  return { adminRoleId, adminUserId };
}

async function seedPlanSubscriptionsForTenant(tenantId) {
  for (const plan of planSeedData) {
    const planId = planNameToId[plan.name];
    if (!planId) continue;
    const existing = await prisma.subscriptions.findFirst({ where: { tenant_id: tenantId, plan_id: planId } });
    if (!existing) {
      await prisma.subscriptions.create({
        data: {
          tenant_id: tenantId,
          plan_id: planId,
          plan_type: plan.name,
          start_date: new Date(),
          end_date: null,
          is_active: true
        }
      });
      console.log(`✅ Created subscription for tenant ${tenantId} to plan ${plan.name}`);
    } else {
      console.log(`⚡ Subscription already exists for tenant ${tenantId} to plan ${plan.name}`);
    }
  }
}

async function seedFibres() {
  console.log('🌱 Starting fibre seeding...');
  
  try {
    const filePath = path.join(__dirname, 'fibres.xlsx');
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn('⚠️ fibres.xlsx not found, skipping fibre seeding');
      return;
    }

    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    console.log(`📄 Loaded ${rows.length} rows from Excel`);

    if (rows.length === 0) {
      console.log('📄 No data found in Excel file');
      return;
    }

    let fibreCounter = 1;
    const existingFibres = await prisma.fibres.findMany();
    fibreCounter = existingFibres.length + 1;

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        // Safely extract and validate data
        const fibre_name = row.fibre_name?.toString()?.trim();
        let fibre_code = row.fibre_code ? String(row.fibre_code).trim() : '';
        const stock_kg = parseFloat(row.stock_kg) || 0;
        const closing_stock = parseFloat(row.closing_stock) || stock_kg || 0;
        const description = row.description ? String(row.description).trim() : '';
        
        // FIXED: Proper validation for category_id
        let category_id = null;
        if (row.category_id !== null && row.category_id !== undefined && row.category_id !== '') {
          const parsedCategoryId = parseInt(row.category_id);
          if (!isNaN(parsedCategoryId) && parsedCategoryId > 0) {
            category_id = parsedCategoryId;
          }
        }
        
        const category_name = row.category?.toString()?.trim() || null;

        if (!fibre_name) {
          console.warn('⚠️ Missing fibre name, skipping row');
          errorCount++;
          continue;
        }

        // Check for existing fibre
        const existingFibre = await prisma.fibres.findFirst({
          where: {
            fibre_name: {
              equals: fibre_name,
              mode: 'insensitive',
            },
          },
        });

        if (existingFibre) {
          console.log(`⚡ Skipped existing fibre: ${fibre_name}`);
          skipCount++;
          continue;
        }

        // Generate fibre code if not provided
        if (!fibre_code) {
          fibre_code = `FC-${fibreCounter.toString().padStart(4, '0')}`;
          fibreCounter++;
        }

        // Handle category assignment with proper validation
        let finalCategoryId = null;

        // FIXED: Only check category_id if it's a valid number
        if (category_id && category_id > 0) {
          try {
            const categoryExists = await prisma.fibre_categories.findUnique({
              where: { id: category_id }
            });
            if (categoryExists) {
              finalCategoryId = category_id;
              console.log(`✅ Using existing category ID: ${category_id}`);
            } else {
              console.warn(`⚠️ Invalid category_id: ${category_id} for fibre: ${fibre_name}`);
            }
          } catch (catError) {
            console.warn(`⚠️ Error checking category_id ${category_id}:`, catError.message);
          }
        }

        // If no valid category_id, try to find by category_name
        if (!finalCategoryId && category_name) {
          try {
            const category = await prisma.fibre_categories.findFirst({
              where: {
                name: {
                  equals: category_name,
                  mode: 'insensitive',
                },
              },
            });
            
            if (category) {
              finalCategoryId = category.id;
              console.log(`✅ Found category by name: ${category_name} -> ID: ${category.id}`);
            } else {
              console.log(`🆕 Creating new category: ${category_name}`);
              
              // Create the category automatically
              try {
                const newCategory = await prisma.fibre_categories.create({
                  data: {
                    name: category_name,
                    description: `Auto-created category for ${category_name}`
                  }
                });
                finalCategoryId = newCategory.id;
                console.log(`✅ Created new category: ${category_name} -> ID: ${newCategory.id}`);
              } catch (createError) {
                console.error(`❌ Failed to create category ${category_name}:`, createError.message);
              }
            }
          } catch (findError) {
            console.error(`❌ Error finding category ${category_name}:`, findError.message);
          }
        }

        // Create the fibre record with proper data validation
        await prisma.fibres.create({
          data: {
            fibre_name,
            fibre_code,
            stock_kg: Math.max(0, stock_kg),
            closing_stock: Math.max(0, closing_stock),
            inward_stock: 0,
            outward_stock: 0,
            consumed_stock: 0,
            description: description || '',
            category_id: finalCategoryId,
          },
        });

        console.log(`✅ Created fibre: ${fibre_name} (${fibre_code}) - Category ID: ${finalCategoryId || 'None'}`);
        successCount++;

      } catch (error) {
        console.error(`❌ Failed to process fibre:`, error.message);
        errorCount++;
        continue;
      }
    }

    console.log(`\n🌟 Fibre Seeding Summary:`);
    console.log(`   ✅ Created: ${successCount}`);
    console.log(`   ⚡ Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('🌟 Fibre Seeding Complete!\n');

  } catch (error) {
    console.error('❌ Critical error in seedFibres:', error.message);
    throw error;
  }
}

// ========== EMPLOYEE & ATTENDANCE SEEDING ==========
// ========== EMPLOYEE & ATTENDANCE SEEDING ==========
async function seedEmployeesAndAttendance() {
  console.log('👥 Starting employee & attendance seeding...');

  const employees = [
    {
      name: 'John Smith',
      token_no: 'EMP001',
      shift_rate: 25.5,
      aadhar_no: '1234-5678-9012',
      bank_acc_1: 'ACC001234567890',
      bank_acc_2: 'ACC001234567891',
      department: 'Manufacturing',
      join_date: new Date('2024-01-15'),
    },
    {
      name: 'Sarah Johnson',
      token_no: 'EMP002',
      shift_rate: 28.75,
      aadhar_no: '2345-6789-0123',
      bank_acc_1: 'ACC002234567890',
      bank_acc_2: null,
      department: 'Quality Control',
      join_date: new Date('2023-11-20'),
    },
    {
      name: 'Michael Brown',
      token_no: 'EMP003',
      shift_rate: 22.0,
      aadhar_no: '3456-7890-1234',
      bank_acc_1: 'ACC003234567890',
      bank_acc_2: 'ACC003234567891',
      department: 'Maintenance',
      join_date: new Date('2024-03-10'),
    },
    {
      name: 'Emily Davis',
      token_no: 'EMP004',
      shift_rate: 30.25,
      aadhar_no: '4567-8901-2345',
      bank_acc_1: 'ACC004234567890',
      bank_acc_2: null,
      department: 'Supervision',
      join_date: new Date('2023-08-05'),
    },
    {
      name: 'Robert Wilson',
      token_no: 'EMP005',
      shift_rate: 24.0,
      aadhar_no: '5678-9012-3456',
      bank_acc_1: 'ACC005234567890',
      bank_acc_2: 'ACC005234567891',
      department: 'Packaging',
      join_date: new Date('2024-02-28'),
    },
  ];

  const createdEmployees = [];
  for (const emp of employees) {
    try {
      const employee = await prisma.employees.upsert({
        where: { token_no: emp.token_no },
        update: {},
        create: emp,
      });
      createdEmployees.push(employee);
      console.log(`👷 Employee ready: ${employee.name} (${employee.token_no})`);
    } catch (error) {
      console.error(`❌ Failed to create employee ${emp.name}:`, error.message);
    }
  }

  if (createdEmployees.length === 0) {
    console.warn('⚠️ No employees created, skipping attendance seeding');
    return;
  }

  const shifts = ['SHIFT_1', 'SHIFT_2', 'SHIFT_3'];
  const statuses = [
    'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT',
    'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT',
    'HALF_DAY',
  ];

  const enhancedAttendanceRecords = [];

  for (let i = 0; i < 50; i++) {
    const employee = createdEmployees[Math.floor(Math.random() * createdEmployees.length)];
    const day = Math.floor(Math.random() * 30) + 1;
    const date = new Date(2025, 4, day);
    const shift = shifts[Math.floor(Math.random() * shifts.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    const { inTime, outTime } = generateShiftTimes(date, shift);
    const { overtimeHours, totalHours } = calculateHours(inTime, outTime, status);

    const finalInTime = (status === 'ABSENT')
      ? new Date(date.setHours(0, 0, 0, 0))
      : inTime;

    const finalOutTime = (status === 'ABSENT')
      ? new Date(date.setHours(0, 0, 0, 0))
      : outTime;

    enhancedAttendanceRecords.push({
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
      shift,
      in_time: finalInTime,
      out_time: finalOutTime,
      overtime_hours: overtimeHours,
      total_hours: totalHours,
      status,
      employee_id: employee.id,
    });
  }

  try {
    const result = await prisma.attendance.createMany({
      data: enhancedAttendanceRecords,
      skipDuplicates: true,
    });
    console.log(`📅 Created ${result.count} enhanced attendance records`);
  } catch (error) {
    console.warn('⚠️ Bulk insert failed, using individual inserts:', error.message);
    let createdCount = 0;
    for (const record of enhancedAttendanceRecords) {
      try {
        await prisma.attendance.create({ data: record });
        createdCount++;
      } catch (err) {
        if (!err.message.includes('Unique constraint')) {
          console.error('⚠️ Failed attendance record:', err.message);
        }
      }
    }
    console.log(`📆 Individual insert completed: ${createdCount} records`);
  }

  const totalEmployees = await prisma.employees.count();
  const totalAttendance = await prisma.attendance.count();
  console.log(`\n📊 Employee Summary:\nEmployees: ${totalEmployees}, Attendance Records: ${totalAttendance}`);

  try {
    const attendanceByStatus = await prisma.attendance.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    console.log(`\n🧾 Attendance Status Breakdown:`);
    attendanceByStatus.forEach((group) =>
      console.log(`   ${group.status}: ${group._count.id}`)
    );
  } catch (error) {
    console.warn('⚠️ Could not generate attendance breakdown:', error.message);
  }
}

function generateShiftTimes(date, shift) {
  const baseDate = new Date(date);
  let startHour, endHour;

  switch (shift) {
    case 'SHIFT_1':
      startHour = 6;
      endHour = 14;
      break;
    case 'SHIFT_2':
      startHour = 14;
      endHour = 22;
      break;
    case 'SHIFT_3':
      startHour = 22;
      endHour = 6;
      break;
    default:
      startHour = 9;
      endHour = 17;
  }

  const inTime = new Date(baseDate);
  inTime.setHours(startHour, Math.floor(Math.random() * 30), 0, 0);

  const outTime = new Date(baseDate);
  if (shift === 'SHIFT_3') {
    outTime.setDate(outTime.getDate() + 1);
  }
  outTime.setHours(endHour, Math.floor(Math.random() * 30), 0, 0);

  return { inTime, outTime };
}

function calculateHours(inTime, outTime, status) {
  if (status === 'ABSENT') {
    return { overtimeHours: 0, totalHours: 0 };
  }

  if (status === 'HALF_DAY') {
    return { overtimeHours: 0, totalHours: 4 };
  }

  const timeDifference = outTime.getTime() - inTime.getTime();
  const actualHours = Math.round((timeDifference / (1000 * 60 * 60)) * 100) / 100;
  const regularShiftHours = 8;
  const overtimeHours = Math.max(0, actualHours - regularShiftHours);

  return { overtimeHours, totalHours: actualHours };
}

// ========== MAIN FUNCTIONS ==========
async function main() {
  console.log('🌱 Starting Basic Database Seeding...\n');
  await seedFibres();
  await seedEmployeesAndAttendance();
  console.log('\n🌟 Basic Seeding Complete! ✨');
}

async function enhancedMain() {
  console.log('🌱 Starting Enhanced Database Seeding Process...\n');
  
  try {
    await seedPlans();
    const { tenantId, userId, roleId } = await seedSuperAdmin();
    // Get permissions from superadmin role
    const superRole = await prisma.roles.findUnique({ where: { id: roleId } });
    const permissions = superRole ? superRole.permissions : {};
    await seedAdminRoleAndUser(tenantId, permissions);
    await seedPlanSubscriptionsForTenant(tenantId);
    // If you want to create another tenant and map plans, repeat here
    // await seedPlanSubscriptionsForTenant(otherTenantId);
    await seedFibres();
    await seedEmployeesAndAttendance();
    console.log('\n🌟 Enhanced Seeding Complete! ✨');
  } catch (error) {
    console.error('❌ Error in enhancedMain:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
}

// Export functions
module.exports = {
  main,
  enhancedMain,
  seedFibres,
  seedEmployeesAndAttendance,
};

// Execute enhanced seeding
if (require.main === module) {
  enhancedMain()
    .catch((e) => {
      console.error('❌ Critical Error:', e.message);
      process.exit(1);
    })
    .finally(async () => {
      try {
        await prisma.$disconnect();
        console.log('📤 Database connection closed');
      } catch (disconnectError) {
        console.error('⚠️ Error disconnecting:', disconnectError.message);
      }
    });
}