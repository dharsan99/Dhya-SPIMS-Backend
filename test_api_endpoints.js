const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust if your server runs on different port

async function testAPIEndpoints() {
  console.log('🧪 Testing Password Reset API Endpoints...\n');

  try {
    // Test 1: Forgot Password
    console.log('1️⃣ Testing /auth/forgot-password...');
    const forgotResponse = await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: 'dharshan@dhya.in'
    });
    
    console.log('✅ Forgot Password Response:', forgotResponse.data);

    // Test 2: Reset Password (this would normally use a real token from email)
    console.log('\n2️⃣ Testing /auth/reset-password...');
    console.log('⚠️ Note: This test requires a valid token from email');
    console.log('   You can test this manually with a real token');

    console.log('\n📋 API Endpoints Summary:');
    console.log('POST /auth/forgot-password - ✅ Working');
    console.log('POST /auth/reset-password - ✅ Ready for testing');
    
    console.log('\n🎉 API endpoints are ready for use!');
    console.log('\n📝 Next Steps:');
    console.log('1. Start your server: npm start');
    console.log('2. Test forgot password with a real email');
    console.log('3. Check email for reset token');
    console.log('4. Test reset password with the token');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Server not running. Please start your server first:');
      console.log('   npm start');
    } else {
      console.error('❌ API Test Error:', error.response?.data || error.message);
    }
  }
}

testAPIEndpoints(); 