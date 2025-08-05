const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function signupUser({ name, email, password, tenantId, isSuperadmin }) {
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(32).toString('hex');

  return await prisma.$transaction(async (tx) => {
    let tenant;
    let createdTenant = false;
    if (tenantId) {
      // Check if tenant exists
      tenant = await tx.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) throw new Error('Tenant not found');
    } else {
      // Create new tenant
      tenant = await tx.tenant.create({
        data: {
          name: `${name}'s Trial`,
          plan: 'TRIAL',
          isActive: true,
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      createdTenant = true;
    }

    // Always ensure a subscription exists for the tenant
    const existingSubscription = await tx.subscription.findFirst({
      where: { tenantId: tenant.id }
    });
    if (!existingSubscription) {
      const trialPlan = await tx.plan.findFirst({ where: { billingCycle: 'trial' } });
      console.log('Trial plan found for subscription creation:', trialPlan);
      if (trialPlan) {
        const subscription = await tx.subscription.create({
          data: {
            tenantId: tenant.id,
            planId: trialPlan.id,
            planType: trialPlan.name,
            startDate: new Date(),
            isActive: true,
          }
        });
        console.log('Subscription created for tenant:', subscription);
      } else {
        console.log('No trial plan found for subscription creation.');
      }
    } else {
      console.log('Subscription already exists for tenant:', tenant.id);
    }

    // If we just created a tenant, also create the Admin role for it
    if (createdTenant) {
      const defaultPermissions = {
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

      await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'admin',
          description: 'Default admin role for new tenant',
          permissions: defaultPermissions,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
    }

    // Assign default role to user (lookup by name and tenant or global)
    let defaultRole;
    if (tenantId) {
      // Use the first admin role found (global or seeded)
      defaultRole = await tx.role.findFirst({
        where: {
          name: 'admin',
        },
      });
    } else {
      // For new tenants, use tenant-specific admin role
      defaultRole = await tx.role.findFirst({
        where: {
          tenantId: tenant.id,
          name: 'admin',
        },
      });
    }
    if (!defaultRole) throw new Error('Default role (admin) not found');

    const user = await tx.users.create({
      data: {
        name,
        email,
        role: defaultRole.name,
        passwordHash,
        tenantId: tenantId ? tenantId : tenant.id,
        verificationToken,
        isActive: false,
        isVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const defaultRoleId = defaultRole.id;
    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: defaultRoleId,
      },
    });

    await sendVerificationEmail(email, verificationToken, isSuperadmin);

    return { userId: user.id, tenantId: tenantId ? tenantId : tenant.id, email, assignedRoleId: defaultRoleId };
  });
}

async function verifyEmailToken(token) {
  const user = await prisma.users.findFirst({ where: { verificationToken: token } });
  if (!user) throw new Error('Invalid or expired token');

  await prisma.users.update({
    where: { id: user.id },
    data: { 
      isActive: true, 
      isVerified: true,
      verificationToken: null,
      updatedAt: new Date()
    },
  });

  // Fetch the default role for the user's tenant
  const defaultRole = await prisma.role.findFirst({
    where: {
      tenantId: user.tenantId,
      name: 'admin',
    },
  });

  return {
    message: 'Email verified successfully',
    role: defaultRole || null
  };
}

async function sendVerificationEmail(email, token, isSuperadmin = false) {
  // Check if email credentials are configured
  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
    console.log('⚠️ Email credentials not configured. Skipping email verification.');
    console.log('📧 Verification token:', token);
    console.log('🔗 Manual verification URL:', `${process.env.BASE_URL || 'http://localhost:5173'}/verify-email?token=${token}`);
    return;
  }

  try {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS,
    },
  });

  let verificationUrl;
  if (isSuperadmin) {
    verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/superadmin/verify-email?token=${token}`;
  } else {
      verificationUrl = `${process.env.BASE_URL || 'http://localhost:5173'}/verify-email?token=${token}`;
  }
    
  await transporter.sendMail({
    from: `"TexIntelli SPIMS Support" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify Your Email Address – TexIntelli SPIMS',
    html: `
    <p>Dear User,</p>

      <p>Welcome to <strong>TexIntelli SPIMS</strong> – a smart and reliable information management system tailored for modern spinning mills. We're committed to helping textile operations become more efficient through digital automation and intelligent insights.</p>

    <p>To get started, please verify your email address by clicking the link below:</p>
    
    <p style="word-break:break-all;">Or copy and paste this link into your browser:<br><span>${verificationUrl}</span></p>

    <p>If you did not sign up for TexIntelli SPIMS, please ignore this message.</p>

    <br>
    <p>Thank you,<br>The TexIntelli SPIMS Team</p>
  `,
  });
    
    console.log('✅ Verification email sent successfully to:', email);
  } catch (error) {
    console.error('❌ Failed to send verification email:', error.message);
    console.log('📧 Verification token:', token);
    console.log('🔗 Manual verification URL:', `${process.env.BASE_URL || 'http://localhost:5173'}/verify-email?token=${token}`);
  }
}

module.exports = {
  signupUser,
  verifyEmailToken,
};
