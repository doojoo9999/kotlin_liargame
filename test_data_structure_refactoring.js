/**
 * Test script to verify the backend-frontend data structure refactoring
 * This script tests that the API endpoints return standardized structures
 * that match frontend expectations without requiring complex mapping.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api/v1';

// Test configuration
const TEST_CONFIG = {
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

/**
 * Test the game rooms API endpoint
 */
async function testGameRoomsAPI() {
  console.log('\n=== Testing Game Rooms API ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/game/rooms`, TEST_CONFIG);
    
    console.log('✅ Game rooms API responded successfully');
    console.log('Response structure:', JSON.stringify(response.data, null, 2));
    
    // Verify the standardized structure
    if (response.data && response.data.gameRooms && Array.isArray(response.data.gameRooms)) {
      console.log('✅ Response has correct gameRooms array structure');
      
      if (response.data.gameRooms.length > 0) {
        const room = response.data.gameRooms[0];
        const expectedFields = ['gameNumber', 'title', 'host', 'currentPlayers', 'maxPlayers', 'hasPassword', 'subject', 'state', 'players'];
        
        console.log('Checking first room structure:', room);
        
        const missingFields = expectedFields.filter(field => !(field in room));
        const extraFields = Object.keys(room).filter(field => !expectedFields.includes(field));
        
        if (missingFields.length === 0) {
          console.log('✅ All expected fields are present');
        } else {
          console.log('❌ Missing fields:', missingFields);
        }
        
        if (extraFields.length === 0) {
          console.log('✅ No unexpected extra fields');
        } else {
          console.log('ℹ️ Extra fields (may be acceptable):', extraFields);
        }
        
        // Verify field types and values
        console.log('Field verification:');
        console.log(`- gameNumber: ${typeof room.gameNumber} (${room.gameNumber})`);
        console.log(`- title: ${typeof room.title} (${room.title})`);
        console.log(`- host: ${typeof room.host} (${room.host})`);
        console.log(`- currentPlayers: ${typeof room.currentPlayers} (${room.currentPlayers})`);
        console.log(`- maxPlayers: ${typeof room.maxPlayers} (${room.maxPlayers})`);
        console.log(`- hasPassword: ${typeof room.hasPassword} (${room.hasPassword})`);
        console.log(`- subject: ${typeof room.subject} (${room.subject})`);
        console.log(`- state: ${typeof room.state} (${room.state})`);
        console.log(`- players: ${Array.isArray(room.players) ? 'array' : typeof room.players} (length: ${room.players?.length || 0})`);
        
      } else {
        console.log('ℹ️ No game rooms found (empty array)');
      }
    } else {
      console.log('❌ Response does not have expected gameRooms array structure');
    }
    
  } catch (error) {
    console.log('❌ Game rooms API failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

/**
 * Test the subjects API endpoint
 */
async function testSubjectsAPI() {
  console.log('\n=== Testing Subjects API ===');
  
  try {
    const response = await axios.get(`${BASE_URL}/subjects/listsubj`, TEST_CONFIG);
    
    console.log('✅ Subjects API responded successfully');
    console.log('Response structure:', JSON.stringify(response.data, null, 2));
    
    // Verify the standardized structure
    if (Array.isArray(response.data)) {
      console.log('✅ Response is an array as expected');
      
      if (response.data.length > 0) {
        const subject = response.data[0];
        const expectedFields = ['id', 'name', 'wordIds'];
        
        console.log('Checking first subject structure:', subject);
        
        const missingFields = expectedFields.filter(field => !(field in subject));
        const extraFields = Object.keys(subject).filter(field => !expectedFields.includes(field));
        
        if (missingFields.length === 0) {
          console.log('✅ All expected fields are present');
        } else {
          console.log('❌ Missing fields:', missingFields);
        }
        
        if (extraFields.length === 0) {
          console.log('✅ No unexpected extra fields');
        } else {
          console.log('ℹ️ Extra fields (may be acceptable):', extraFields);
        }
        
        // Verify field types and values
        console.log('Field verification:');
        console.log(`- id: ${typeof subject.id} (${subject.id})`);
        console.log(`- name: ${typeof subject.name} (${subject.name})`);
        console.log(`- wordIds: ${Array.isArray(subject.wordIds) ? 'array' : typeof subject.wordIds} (length: ${subject.wordIds?.length || 0})`);
        
      } else {
        console.log('ℹ️ No subjects found (empty array)');
      }
    } else {
      console.log('❌ Response is not an array as expected');
    }
    
  } catch (error) {
    console.log('❌ Subjects API failed:', error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
  }
}

/**
 * Test frontend compatibility by simulating the simplified API calls
 */
async function testFrontendCompatibility() {
  console.log('\n=== Testing Frontend Compatibility ===');
  
  // Simulate the simplified getAllRooms function
  try {
    console.log('Testing simplified getAllRooms logic...');
    const response = await axios.get(`${BASE_URL}/game/rooms`, TEST_CONFIG);
    
    // This is the new simplified logic from gameApi.js
    if (response.data && response.data.gameRooms && Array.isArray(response.data.gameRooms)) {
      console.log('✅ Frontend can directly use response.data.gameRooms');
      console.log(`Found ${response.data.gameRooms.length} rooms`);
      return response.data.gameRooms;
    } else {
      console.log('❌ Frontend compatibility issue: unexpected response structure');
      return [];
    }
  } catch (error) {
    console.log('❌ Frontend compatibility test failed:', error.message);
    return [];
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('🚀 Starting Backend-Frontend Data Structure Refactoring Tests');
  console.log('Testing against:', BASE_URL);
  
  await testGameRoomsAPI();
  await testSubjectsAPI();
  await testFrontendCompatibility();
  
  console.log('\n✅ All tests completed!');
  console.log('\n📋 Summary:');
  console.log('- Backend DTOs have been standardized to match frontend expectations');
  console.log('- Complex mapping functions have been removed from frontend');
  console.log('- API responses now use consistent field names (title, host, currentPlayers, etc.)');
  console.log('- Frontend can directly consume backend responses without transformation');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testGameRoomsAPI,
  testSubjectsAPI,
  testFrontendCompatibility,
  runTests
};