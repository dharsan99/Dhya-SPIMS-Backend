const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

async function signupUser({ name, email, password }) {
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) throw new Error('User already exists');

  const password_hash = await bcrypt.hash(password, 10);
  const verification_token = crypto.randomBytes(32).toString('hex');

  return await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenants.create({
      data: {
        name: `${name}'s Trial`,
        plan: 'TRIAL',
        expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    const user = await tx.users.create({
      data: {
        name,
        email,
        password_hash,
        tenant_id: tenant.id,
        verification_token,
      },
    });

    await sendVerificationEmail(email, verification_token);

    return { user_id: user.id, tenant_id: tenant.id, email };
  });
}

async function verifyEmailToken(token) {
  const user = await prisma.users.findFirst({ where: { verification_token: token } });
  if (!user) throw new Error('Invalid or expired token');

  await prisma.users.update({
    where: { id: user.id },
    data: { is_verified: true, verification_token: null },
  });

  return { message: 'Email verified successfully' };
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
