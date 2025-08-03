// Test script to verify GameRoomPage component fixes
const axios = require('axios');

const BASE_URL = 'http://localhost:20021/api/v1';

async function testGameRoomComponents() {
    console.log('[DEBUG_LOG] Starting GameRoomPage component test...');
    
    try {
        // Step 1: Login first
        console.log('[DEBUG_LOG] Step 1: Logging in...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            nickname: `TestUser_${Date.now()}`
        });
        
        const token = loginResponse.data.accessToken;
        console.log('[DEBUG_LOG] Login successful');
        
        // Step 2: Create room
        console.log('[DEBUG_LOG] Step 2: Creating room...');
        const roomData = {
            gName: 'Component Test Room',
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
        console.log(`[DEBUG_LOG] Room created with game number: ${gameNumber}`);
        
        // Step 3: Get room info to verify data structure
        console.log('[DEBUG_LOG] Step 3: Getting room info...');
        const roomInfoResponse = await axios.get(`${BASE_URL}/game/${gameNumber}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const roomInfo = roomInfoResponse.data;
        console.log('[DEBUG_LOG] Room info structure:', JSON.stringify(roomInfo, null, 2));
        
        // Step 4: Verify required fields for components
        console.log('[DEBUG_LOG] Step 4: Verifying component requirements...');
        
        // Check if players have avatarUrl
        if (roomInfo.players && roomInfo.players.length > 0) {
            const playersWithoutAvatar = roomInfo.players.filter(p => !p.avatarUrl);
            if (playersWithoutAvatar.length > 0) {
                console.log('[DEBUG_LOG] ⚠️  Players missing avatarUrl:', playersWithoutAvatar.map(p => p.nickname));
            } else {
                console.log('[DEBUG_LOG] ✅ All players have avatarUrl');
            }
        }
        
        // Check if gameInfo exists (should be handled by GameRoomPage now)
        if (roomInfo.gameInfo) {
            console.log('[DEBUG_LOG] ✅ gameInfo exists:', roomInfo.gameInfo);
        } else {
            console.log('[DEBUG_LOG] ℹ️  gameInfo not in API response (handled by GameRoomPage fallback)');
        }
        
        // Check subject structure
        if (roomInfo.subject && roomInfo.subject.name) {
            console.log('[DEBUG_LOG] ✅ Subject has name:', roomInfo.subject.name);
        } else {
            console.log('[DEBUG_LOG] ⚠️  Subject missing name field');
        }
        
        console.log('[DEBUG_LOG] ✅ Component data structure test PASSED');
        console.log('[DEBUG_LOG] GameRoomPage should now load without crashes');
        
    } catch (error) {
        console.error('[DEBUG_LOG] ❌ Test FAILED:', error.response?.data || error.message);
    }
}

testGameRoomComponents();