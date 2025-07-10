const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function signupUser({ name, email, password, tenant_id }) {
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const password_hash = await bcrypt.hash(password, 10);
  const verification_token = crypto.randomBytes(32).toString('hex');

  return await prisma.$transaction(async (tx) => {
    let tenant;
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

    // Assign default role to user
    const defaultRoleId = '611e24f3-856f-471e-9d24-959f8b2e3dc1';
    await tx.user_roles.create({
      data: {
        user_id: user.id,
        role_id: defaultRoleId,
      },
    });

    await sendVerificationEmail(email, verification_token);

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

  // Fetch the default role
  const roleId = '611e24f3-856f-471e-9d24-959f8b2e3dc1';
  const role = await prisma.roles.findUnique({ where: { id: roleId } });

  return {
    message: 'Email verified successfully',
    role: role || null
  };
}

async function sendVerificationEmail(email, token) {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS,
    },
  });

  const verificationUrl = `${process.env.BASE_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: `"TexIntelli" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify your TexIntelli Email',
    html: `<p>Click the link to verify your email:</p><a href="${verificationUrl}">${verificationUrl}</a>`,
  });
}

module.exports = {
  signupUser,
  verifyEmailToken,
};
