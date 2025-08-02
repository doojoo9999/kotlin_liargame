// Test script to verify room creation fix
const axios = require('axios');

const BASE_URL = 'http://localhost:20021/api/v1';

async function testRoomCreation() {
    console.log('[DEBUG_LOG] Starting room creation test...');
    
    try {
        // Step 1: Login first
        console.log('[DEBUG_LOG] Step 1: Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            nickname: 'TestUser'
        });
        
        const token = loginResponse.data.accessToken;
        console.log('[DEBUG_LOG] Login successful, token received');
        
        // Step 2: Create room
        console.log('[DEBUG_LOG] Step 2: Creating room...');
        const roomData = {
            gName: 'Test Room',
            gParticipants: 8,
            gTotalRounds: 3,
            gPassword: null,
            subjectIds: [1]
        };
        
        const createResponse = await axios.post(`${BASE_URL}/game/create`, roomData, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const gameNumber = createResponse.data;
        console.log(`[DEBUG_LOG] Room created successfully with game number: ${gameNumber}`);
        
        // Step 3: Get room info using the fixed endpoint
        console.log('[DEBUG_LOG] Step 3: Getting room info...');
        const roomInfoResponse = await axios.get(`${BASE_URL}/game/${gameNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('[DEBUG_LOG] Room info retrieved successfully:', roomInfoResponse.data);
        console.log('[DEBUG_LOG] ✅ Room creation and info retrieval test PASSED');
        
    } catch (error) {
        console.error('[DEBUG_LOG] ❌ Test FAILED:', error.response?.data || error.message);
        if (error.response?.status === 404) {
            console.error('[DEBUG_LOG] 404 error - endpoint still not found');
        }
    }
}

testRoomCreation();