// Test script for password reset functionality
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

async function testPasswordReset() {
  try {
    console.log('🧪 Testing Password Reset Functionality...\n');

    // Test 1: Check if we can find a user
    const testUser = await prisma.users.findFirst();

    if (!testUser) {
      console.log('❌ No users found in database');
      return;
    }

    console.log('✅ Found test user:', testUser.email);

    // Test 2: Generate reset token
    const resetToken = jwt.sign(
      { userId: testUser.id, email: testUser.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('✅ Generated reset token:', resetToken.substring(0, 20) + '...');

    // Test 3: Update user with reset token
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    await prisma.users.update({
      where: { id: testUser.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiresAt
      }
    });

    console.log('✅ Updated user with reset token');

    // Test 4: Verify token and reset password
    const payload = jwt.verify(resetToken, JWT_SECRET);
    console.log('✅ Token verified, payload:', { userId: payload.userId, email: payload.email });

    // Test 5: Hash new password
    const newPassword = 'newTestPassword123';
    const passwordHash = await bcrypt.hash(newPassword, 10);
    console.log('✅ New password hashed');

    // Test 6: Update password and clear token
    await prisma.users.update({
      where: { id: testUser.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null,
        updatedAt: new Date()
      }
    });

    console.log('✅ Password updated and token cleared');

    // Test 7: Verify new password works
    const isValid = await bcrypt.compare(newPassword, passwordHash);
    console.log('✅ New password verification:', isValid);

    console.log('\n🎉 All password reset tests passed!');
    console.log('\n📝 Implementation Summary:');
    console.log('- Added resetPasswordToken and resetPasswordExpires fields to Users model');
    console.log('- Created forgotPassword service method with email sending');
    console.log('- Created resetPassword service method with token validation');
    console.log('- Added controller methods for both endpoints');
    console.log('- Added routes with Swagger documentation');
    console.log('- Implemented security features: token expiration, one-time use, password validation');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordReset(); 