/**
 * Test script to reproduce the leave game issues mentioned in the problem description
 * 
 * Issues to reproduce:
 * 1. POST http://localhost:20021/api/v1/game/leave 400 (Bad Request)
 * 2. RuntimeException: 이미 진행중인 게임을 보유하고 있습니다.
 */

const BASE_URL = 'http://localhost:20021';

// Test data
const testUsers = [
    { username: 'host_user', password: 'password123' },
    { username: 'user1', password: 'password123' },
    { username: 'user2', password: 'password123' },
    { username: 'user3', password: 'password123' }
];

let authTokens = {};
let gameNumber = null;

async function makeRequest(url, method = 'GET', body = null, token = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    console.log(`[DEBUG_LOG] Making ${method} request to ${url}`);
    if (body) console.log(`[DEBUG_LOG] Request body:`, body);
    
    try {
        const response = await fetch(url, options);
        const responseText = await response.text();
        
        console.log(`[DEBUG_LOG] Response status: ${response.status}`);
        console.log(`[DEBUG_LOG] Response body: ${responseText}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${responseText}`);
        }
        
        return responseText ? JSON.parse(responseText) : null;
    } catch (error) {
        console.error(`[DEBUG_LOG] Request failed:`, error.message);
        throw error;
    }
}

async function registerUser(username, password) {
    try {
        return await makeRequest(`${BASE_URL}/api/v1/auth/register`, 'POST', {
            username,
            password,
            nickname: username
        });
    } catch (error) {
        // User might already exist, that's okay
        console.log(`[DEBUG_LOG] Registration failed for ${username}, might already exist`);
        return null;
    }
}

async function loginUser(username, password) {
    try {
        const response = await makeRequest(`${BASE_URL}/api/v1/auth/login`, 'POST', {
            username,
            password
        });
        return response.accessToken;
    } catch (error) {
        console.error(`[DEBUG_LOG] Login failed for ${username}:`, error.message);
        throw error;
    }
}

async function createGameRoom(token) {
    return await makeRequest(`${BASE_URL}/api/v1/game/create`, 'POST', {
        gName: 'Test Game Room',
        gPassword: null,
        gParticipants: 4,
        gTotalRounds: 3,
        gLiarCount: 1,
        useRandomSubjects: true,
        randomSubjectCount: 2
    }, token);
}

async function joinGame(token, gNumber) {
    return await makeRequest(`${BASE_URL}/api/v1/game/join`, 'POST', {
        gNumber,
        gPassword: null
    }, token);
}

async function leaveGame(token, gNumber) {
    return await makeRequest(`${BASE_URL}/api/v1/game/leave`, 'POST', {
        gNumber
    }, token);
}

async function testLeaveGameIssues() {
    console.log('[DEBUG_LOG] Starting leave game issues test...');
    
    try {
        // Step 1: Register and login all users
        console.log('[DEBUG_LOG] Step 1: Registering and logging in users...');
        for (const user of testUsers) {
            await registerUser(user.username, user.password);
            const token = await loginUser(user.username, user.password);
            authTokens[user.username] = token;
            console.log(`[DEBUG_LOG] User ${user.username} logged in successfully`);
        }
        
        // Step 2: Host creates a game room
        console.log('[DEBUG_LOG] Step 2: Host creating game room...');
        gameNumber = await createGameRoom(authTokens['host_user']);
        console.log(`[DEBUG_LOG] Game room created with number: ${gameNumber}`);
        
        // Step 3: Other users join the game
        console.log('[DEBUG_LOG] Step 3: Other users joining game...');
        for (const username of ['user1', 'user2', 'user3']) {
            await joinGame(authTokens[username], gameNumber);
            console.log(`[DEBUG_LOG] User ${username} joined game ${gameNumber}`);
        }
        
        // Step 4: Test Issue 1 - Try to leave game (should reproduce 400 error)
        console.log('[DEBUG_LOG] Step 4: Testing leave game (Issue 1 - 400 error)...');
        try {
            const result = await leaveGame(authTokens['host_user'], gameNumber);
            console.log(`[DEBUG_LOG] Host left game successfully:`, result);
        } catch (error) {
            console.error(`[DEBUG_LOG] Issue 1 reproduced - Leave game failed:`, error.message);
        }
        
        // Step 5: Test Issue 2 - Try to create another game (should reproduce validation error)
        console.log('[DEBUG_LOG] Step 5: Testing create game after leave (Issue 2 - validation error)...');
        try {
            const newGameNumber = await createGameRoom(authTokens['host_user']);
            console.log(`[DEBUG_LOG] New game created successfully: ${newGameNumber}`);
        } catch (error) {
            console.error(`[DEBUG_LOG] Issue 2 reproduced - Create game failed:`, error.message);
        }
        
    } catch (error) {
        console.error('[DEBUG_LOG] Test failed:', error.message);
    }
}

// Run the test
testLeaveGameIssues().then(() => {
    console.log('[DEBUG_LOG] Test completed');
}).catch(error => {
    console.error('[DEBUG_LOG] Test failed with error:', error.message);
});