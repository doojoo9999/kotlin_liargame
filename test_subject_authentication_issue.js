const axios = require('axios');

// Test script to reproduce subject API authentication issue
async function testSubjectAPI() {
    console.log('[TEST] Starting subject API authentication test...');
    
    const baseURL = 'http://localhost:20021/api/v1';
    
    // Test 1: Call subject API without authentication
    console.log('\n=== Test 1: Subject API without authentication ===');
    try {
        const response = await axios.get(`${baseURL}/subjects/listsubj`);
        console.log('[SUCCESS] Subject API call without auth succeeded');
        console.log('[RESPONSE]', response.data);
    } catch (error) {
        console.log('[ERROR] Subject API call without auth failed');
        console.log('[STATUS]', error.response?.status);
        console.log('[ERROR_DATA]', error.response?.data);
    }
    
    // Test 2: Try to get a token first (simulate login)
    console.log('\n=== Test 2: Login and get token ===');
    let token = null;
    try {
        const loginResponse = await axios.post(`${baseURL}/auth/login`, {
            nickname: 'TestUser'
        });
        console.log('[SUCCESS] Login succeeded');
        token = loginResponse.data.accessToken;
        console.log('[TOKEN]', token ? `${token.substring(0, 20)}...` : 'No token received');
    } catch (error) {
        console.log('[ERROR] Login failed');
        console.log('[STATUS]', error.response?.status);
        console.log('[ERROR_DATA]', error.response?.data);
    }
    
    // Test 3: Call subject API with authentication
    if (token) {
        console.log('\n=== Test 3: Subject API with authentication ===');
        try {
            const response = await axios.get(`${baseURL}/subjects/listsubj`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            console.log('[SUCCESS] Subject API call with auth succeeded');
            console.log('[RESPONSE]', response.data);
        } catch (error) {
            console.log('[ERROR] Subject API call with auth failed');
            console.log('[STATUS]', error.response?.status);
            console.log('[ERROR_DATA]', error.response?.data);
        }
    }
    
    // Test 4: Try admin token
    console.log('\n=== Test 4: Try admin login ===');
    let adminToken = null;
    try {
        const adminLoginResponse = await axios.post(`${baseURL}/auth/admin/login`, {
            password: 'admin123'
        });
        console.log('[SUCCESS] Admin login succeeded');
        adminToken = adminLoginResponse.data.accessToken;
        console.log('[ADMIN_TOKEN]', adminToken ? `${adminToken.substring(0, 20)}...` : 'No admin token received');
    } catch (error) {
        console.log('[ERROR] Admin login failed');
        console.log('[STATUS]', error.response?.status);
        console.log('[ERROR_DATA]', error.response?.data);
    }
    
    // Test 5: Call subject API with admin token
    if (adminToken) {
        console.log('\n=== Test 5: Subject API with admin token ===');
        try {
            const response = await axios.get(`${baseURL}/subjects/listsubj`, {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            console.log('[SUCCESS] Subject API call with admin token succeeded');
            console.log('[RESPONSE]', response.data);
        } catch (error) {
            console.log('[ERROR] Subject API call with admin token failed');
            console.log('[STATUS]', error.response?.status);
            console.log('[ERROR_DATA]', error.response?.data);
        }
    }
    
    console.log('\n=== Test Summary ===');
    console.log('This test checks if the subject API authentication is working correctly.');
    console.log('Expected behavior: Subject API should work with proper JWT token.');
    console.log('If all tests fail, there might be an issue with JWT authentication filter.');
}

// Run the test
testSubjectAPI().catch(console.error);