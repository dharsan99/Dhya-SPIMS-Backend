const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function signupUser({ name, email, password, tenant_id, isSuperadmin }) {
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const password_hash = await bcrypt.hash(password, 10);
  const verification_token = crypto.randomBytes(32).toString('hex');

  return await prisma.$transaction(async (tx) => {
    let tenant;
    let createdTenant = false;
    if (tenant_id) {
      // Check if tenant exists
      tenant = await tx.tenants.findUnique({ where: { id: tenant_id } });
      if (!tenant) throw new Error('Tenant not found');
    } else {
      // Create new tenant
      tenant = await tx.tenants.create({
        data: {
          name: `${name}'s Trial`,
          plan: 'TRIAL',
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });
      createdTenant = true;
    }

    // Always ensure a subscription exists for the tenant
    const existingSubscription = await tx.subscriptions.findFirst({
      where: { tenant_id: tenant.id }
    });
    if (!existingSubscription) {
      const trialPlan = await tx.plan.findFirst({ where: { billingCycle: 'trial' } });
      console.log('Trial plan found for subscription creation:', trialPlan);
      if (trialPlan) {
        const subscription = await tx.subscriptions.create({
          data: {
            tenant_id: tenant.id,
            plan_id: trialPlan.id,
            plan_type: trialPlan.name,
            start_date: new Date(),
            is_active: true,
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
      await tx.roles.create({
        data: {
          tenant_id: tenant.id,
          name: 'Admin',
          description: 'Default admin role for new tenant',
          permissions: {}, // You can use your default permissions object here
        }
      });
    }

    const user = await tx.users.create({
      data: {
        name,
        email,
        password_hash,
        tenant_id: tenant_id ? tenant_id : tenant.id,
        verification_token,
      },
    });

    // Assign default role to user (lookup by name and tenant or global)
    let defaultRole;
    if (tenant_id) {
      // Use the first Admin role found (global or seeded)
      defaultRole = await tx.roles.findFirst({
        where: {
          name: 'Admin',
        },
      });
    } else {
      // For new tenants, use tenant-specific Admin role
      defaultRole = await tx.roles.findFirst({
        where: {
          tenant_id: tenant.id,
          name: 'Admin',
        },
      });
    }
    if (!defaultRole) throw new Error('Default role (Admin) not found');
    const defaultRoleId = defaultRole.id;
    await tx.user_roles.create({
      data: {
        user_id: user.id,
        role_id: defaultRoleId,
      },
    });

    await sendVerificationEmail(email, verification_token, isSuperadmin);

    return { user_id: user.id, tenant_id: tenant_id ? tenant_id : tenant.id, email, assigned_role_id: defaultRoleId };
  });
}

async function verifyEmailToken(token) {
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

async function sendVerificationEmail(email, token, isSuperadmin = false) {
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
    verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
  }
  await transporter.sendMail({
    from: `"TexIntelli SPIMS Support" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify Your Email Address – TexIntelli SPIMS',
    html: `
    <p>Dear User,</p>

    <p>Welcome to <strong>TexIntelli SPIMS</strong> – a smart and reliable information management system tailored for modern spinning mills. We’re committed to helping textile operations become more efficient through digital automation and intelligent insights.</p>

    <p>To get started, please verify your email address by clicking the link below:</p>
    
    <p style="word-break:break-all;">Or copy and paste this link into your browser:<br><span>${verificationUrl}</span></p>

    <p>If you did not sign up for TexIntelli SPIMS, please ignore this message.</p>

    <br>
    <p>Thank you,<br>The TexIntelli SPIMS Team</p>
  `,
  });
}

module.exports = {
  signupUser,
  verifyEmailToken,
};
