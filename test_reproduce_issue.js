const axios = require('axios');

const BASE_URL = 'http://localhost:20021';

// Test user credentials
const testUser = {
    username: 'testuser',
    password: 'testpass',
    nickname: 'TestNickname'
};

let authToken = '';

// Helper function to make authenticated requests
async function makeRequest(method, url, data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {},
            data
        };
        
        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error(`Error in ${method} ${url}:`, error.response?.data || error.message);
        throw error;
    }
}

// Login user (creates user automatically if doesn't exist)
async function setupUser() {
    console.log('[DEBUG_LOG] Logging in user...');
    const loginResponse = await makeRequest('POST', '/api/v1/auth/login', {
        nickname: testUser.nickname
    });
    
    authToken = loginResponse.accessToken;
    console.log('[DEBUG_LOG] User logged in successfully');
}

// Create a game room
async function createGameRoom() {
    console.log('[DEBUG_LOG] Creating game room...');
    const gameRoomData = {
        gName: 'Test Room',
        gPassword: null,
        gParticipants: 5,
        gTotalRounds: 3,
        gLiarCount: 1,
        useRandomSubjects: true,
        randomSubjectCount: 2
    };
    
    const response = await makeRequest('POST', '/api/v1/game/create', gameRoomData);
    console.log('[DEBUG_LOG] Game room created with number:', response);
    return response;
}

// Leave a game room
async function leaveGameRoom(gameNumber) {
    console.log('[DEBUG_LOG] Leaving game room:', gameNumber);
    const response = await makeRequest('POST', '/api/v1/game/leave', {
        gNumber: gameNumber
    });
    console.log('[DEBUG_LOG] Left game room successfully:', response);
    return response;
}

// Main test function
async function testIssueReproduction() {
    try {
        console.log('[DEBUG_LOG] Starting issue reproduction test...');
        
        // Setup user
        await setupUser();
        
        // Create first game room
        const gameNumber1 = await createGameRoom();
        console.log('[DEBUG_LOG] First game room created:', gameNumber1);
        
        // Leave the game room
        await leaveGameRoom(gameNumber1);
        console.log('[DEBUG_LOG] Left the first game room');
        
        // Small delay to simulate real-world timing
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Try to create a second game room immediately
        console.log('[DEBUG_LOG] Attempting to create second game room...');
        try {
            const gameNumber2 = await createGameRoom();
            console.log('[DEBUG_LOG] SUCCESS: Second game room created:', gameNumber2);
            console.log('[DEBUG_LOG] Issue does NOT exist - user can create new room after leaving');
        } catch (error) {
            if (error.response?.data?.message?.includes('이미 진행중인 게임에 참여하고 있습니다')) {
                console.log('[DEBUG_LOG] ISSUE REPRODUCED: Got expected error message');
                console.log('[DEBUG_LOG] Error:', error.response.data.message);
            } else {
                console.log('[DEBUG_LOG] Unexpected error:', error.response?.data || error.message);
            }
        }
        
    } catch (error) {
        console.error('[DEBUG_LOG] Test failed:', error.message);
    }
}

// Run the test
testIssueReproduction().then(() => {
    console.log('[DEBUG_LOG] Test completed');
    process.exit(0);
}).catch(error => {
    console.error('[DEBUG_LOG] Test failed with error:', error);
    process.exit(1);
});