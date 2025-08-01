const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authService = {
  async login(email, password) {
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        userRoles: { include: { role: true } },
        tenant: true
      }
    });

    if (!user) throw new Error('User not found');

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error('Invalid credentials');

    if (!user.isActive) throw new Error('Account is deactivated');

    const roleObj = user.userRoles?.[0]?.role || null;

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: roleObj?.name
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: roleObj,
        isActive: user.isActive
      }
    };
  },

  generateInviteToken(data, expiresIn = '72h') {
    return jwt.sign(data, JWT_SECRET, { expiresIn });
  },

  verifyInviteToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  },

  async createUserFromInvite({ token, name, password }) {
    const payload = authService.verifyInviteToken(token);
    if (!payload) throw new Error('Invalid or expired token');

    const { email, tenantId, roleId } = payload;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) throw new Error('User already exists');

    // Get the role information first
    const role = await prisma.role.findUnique({
      where: { id: roleId }
    });
    
    if (!role) {
      throw new Error('Role not found');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.users.create({
      data: {
        name,
        email,
        tenantId,
        passwordHash,
        role: role.name, // Store the role name in users table
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId
      }
    });

    return user;
  },

  async forgotPassword(email) {
    const user = await prisma.users.findUnique({
      where: { email }
    });

    if (!user) {
      // Don't reveal if user exists or not for security
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Store token in database with expiration
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.users.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt
      }
    });

    // Send email
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Check if email credentials are configured
    if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
      console.log('⚠️ Email credentials not configured. Skipping password reset email.');
      console.log('📧 Reset token:', resetToken);
      console.log('🔗 Manual reset URL:', resetUrl);
      return { 
        message: 'Password reset initiated (email not sent due to missing credentials)',
        resetUrl,
        token: resetToken
      };
    }

    try {
      const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.EMAIL_FROM,
          pass: process.env.EMAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"TexIntelli SPIMS Support" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Password Reset Request – TexIntelli SPIMS',
        html: `
          <p>Dear ${user.name || 'User'},</p>
          
          <p>We received a request to reset your password for your TexIntelli SPIMS account.</p>
          
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          
          <p><strong>This link will expire in 24 hours.</strong></p>
          
          <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
          
          <p>For security reasons, this link can only be used once.</p>
          
          <br>
          <p>Thank you,<br>The TexIntelli SPIMS Team</p>
        `
      });

      console.log('✅ Password reset email sent successfully to:', email);
      return { message: 'Password reset link has been sent to your email.' };
    } catch (error) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  },

  async resetPassword(token, newPassword) {
    // Verify token
    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }

    const { userId, email } = payload;

    // Find user and check if token matches
    const user = await prisma.users.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.email !== email) {
      throw new Error('Invalid reset token');
    }

    if (user.resetPasswordToken !== token) {
      throw new Error('Invalid reset token');
    }

    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      throw new Error('Reset token has expired');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.users.update({
      where: { id: userId },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date()
      }
    });

    return { message: 'Password has been reset successfully' };
  }
};

module.exports = authService;
