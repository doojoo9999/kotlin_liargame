
const axios = require('axios');

const BASE_URL = 'http://localhost:20021/api/v1';
const TEST_USER_NICKNAME = 'TestUser_' + Date.now();

async function testRoomCreation() {
  console.log('[DEBUG_LOG] Starting room creation test...');
  
  try {
    // Step 1: Login to get JWT token
    console.log('[DEBUG_LOG] Step 1: Logging in with nickname:', TEST_USER_NICKNAME);
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      nickname: TEST_USER_NICKNAME
    });
    
    const token = loginResponse.data.accessToken;
    console.log('[DEBUG_LOG] Login successful, token received');
    
    // Step 2: Create room with corrected data structure
    console.log('[DEBUG_LOG] Step 2: Creating room with corrected data structure');
    const roomData = {
      gName: 'Test Room - ' + Date.now(),
      gParticipants: 8,
      gTotalRounds: 3,
      gPassword: null,
      subjectIds: null,
      useRandomSubjects: true,
      randomSubjectCount: 1
    };
    
    console.log('[DEBUG_LOG] Room data being sent:', JSON.stringify(roomData, null, 2));
    
    const createRoomResponse = await axios.post(`${BASE_URL}/game/create`, roomData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[DEBUG_LOG] Room creation successful!');
    console.log('[DEBUG_LOG] Game number:', createRoomResponse.data);
    console.log('[DEBUG_LOG] Response status:', createRoomResponse.status);
    
    return {
      success: true,
      gameNumber: createRoomResponse.data,
      message: 'Room creation test passed'
    };
    
  } catch (error) {
    console.error('[DEBUG_LOG] Room creation test failed:');
    console.error('[DEBUG_LOG] Error status:', error.response?.status);
    console.error('[DEBUG_LOG] Error message:', error.response?.data?.message || error.message);
    console.error('[DEBUG_LOG] Error data:', error.response?.data);
    
    return {
      success: false,
      error: error.response?.data || error.message,
      message: 'Room creation test failed'
    };
  }
}

// Test with old (incorrect) data structure for comparison
async function testOldDataStructure() {
  console.log('\n[DEBUG_LOG] Testing old (incorrect) data structure for comparison...');
  
  try {
    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      nickname: 'TestUser_Old_' + Date.now()
    });
    
    const token = loginResponse.data.accessToken;
    
    // Try with old structure (should fail)
    const oldRoomData = {
      title: 'Test Room Old Structure',
      maxPlayers: 8,
      password: null,
      subjectId: 1
    };
    
    console.log('[DEBUG_LOG] Old room data being sent:', JSON.stringify(oldRoomData, null, 2));
    
    const createRoomResponse = await axios.post(`${BASE_URL}/game/create`, oldRoomData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[DEBUG_LOG] Unexpected success with old structure');
    return { success: true, message: 'Old structure unexpectedly worked' };
    
  } catch (error) {
    console.log('[DEBUG_LOG] Expected failure with old structure:');
    console.log('[DEBUG_LOG] Error status:', error.response?.status);
    console.log('[DEBUG_LOG] Error message:', error.response?.data?.message || error.message);
    
    return {
      success: false,
      expectedFailure: true,
      message: 'Old structure correctly failed as expected'
    };
  }
}

// Run tests
async function runTests() {
  console.log('='.repeat(60));
  console.log('ROOM CREATION API FIX TEST');
  console.log('='.repeat(60));
  
  // Test new structure
  const newStructureResult = await testRoomCreation();
  
  // Test old structure for comparison
  const oldStructureResult = await testOldDataStructure();
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log('New structure test:', newStructureResult.success ? 'PASSED' : 'FAILED');
  console.log('Old structure test:', oldStructureResult.expectedFailure ? 'CORRECTLY FAILED' : 'UNEXPECTED');
  
  if (newStructureResult.success && oldStructureResult.expectedFailure) {
    console.log('\n✅ FIX VERIFICATION: SUCCESS');
    console.log('The corrected data structure works while the old one fails as expected.');
  } else {
    console.log('\n❌ FIX VERIFICATION: NEEDS ATTENTION');
    console.log('Results don\'t match expected behavior.');
  }
}

// Check if axios is available
try {
  runTests();
} catch (error) {
  console.error('Error: axios module not found. Please install it first:');
  console.error('npm install axios');
  console.error('\nOr run this test from the frontend directory where axios should be available.');
}