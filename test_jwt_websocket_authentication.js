/**
 * JWT WebSocket Authentication Test Script
 * Tests the new JWT token parsing implementation for WebSocket chat connections
 */

const axios = require('axios');
const WebSocket = require('ws');
const { Client } = require('@stomp/stompjs');

const BASE_URL = 'http://localhost:8080';
const WS_URL = 'ws://localhost:8080/ws';

// Test configuration
const TEST_CONFIG = {
    nickname: 'JwtTestUser',
    gameNumber: null,
    accessToken: null,
    userId: null
};

/**
 * Step 1: Login to get JWT token
 */
async function loginAndGetToken() {
    console.log('[DEBUG_LOG] Step 1: Logging in to get JWT token...');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/v1/auth/login`, {
            nickname: TEST_CONFIG.nickname
        });

        if (response.data && response.data.accessToken) {
            TEST_CONFIG.accessToken = response.data.accessToken;
            TEST_CONFIG.userId = response.data.userId;
            console.log(`[DEBUG_LOG] ✅ Login successful - UserId: ${TEST_CONFIG.userId}`);
            console.log(`[DEBUG_LOG] ✅ JWT Token obtained: ${TEST_CONFIG.accessToken.substring(0, 20)}...`);
            return true;
        } else {
            console.error('[DEBUG_LOG] ❌ Login failed - No access token received');
            return false;
        }
    } catch (error) {
        console.error('[DEBUG_LOG] ❌ Login error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 2: Create a game room
 */
async function createGameRoom() {
    console.log('[DEBUG_LOG] Step 2: Creating game room...');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/v1/games`, {
            gName: 'JWT Test Game',
            maxPlayers: 4
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_CONFIG.accessToken}`
            }
        });

        if (response.data && response.data.gNumber) {
            TEST_CONFIG.gameNumber = response.data.gNumber;
            console.log(`[DEBUG_LOG] ✅ Game created - Game Number: ${TEST_CONFIG.gameNumber}`);
            return true;
        } else {
            console.error('[DEBUG_LOG] ❌ Game creation failed');
            return false;
        }
    } catch (error) {
        console.error('[DEBUG_LOG] ❌ Game creation error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Step 3: Test WebSocket connection with JWT authentication
 */
function testWebSocketWithJWT() {
    return new Promise((resolve, reject) => {
        console.log('[DEBUG_LOG] Step 3: Testing WebSocket connection with JWT...');
        
        const client = new Client({
            brokerURL: WS_URL,
            connectHeaders: {
                'Authorization': `Bearer ${TEST_CONFIG.accessToken}`
            },
            debug: function (str) {
                console.log('[DEBUG_LOG] STOMP Debug:', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = function (frame) {
            console.log('[DEBUG_LOG] ✅ WebSocket connected successfully');
            console.log('[DEBUG_LOG] Connection frame:', frame.headers);

            // Subscribe to chat topic
            const subscription = client.subscribe(`/topic/chat.${TEST_CONFIG.gameNumber}`, function (message) {
                console.log('[DEBUG_LOG] ✅ Received chat message:', JSON.parse(message.body));
                
                // Clean up and resolve
                subscription.unsubscribe();
                client.deactivate();
                resolve(true);
            });

            // Send a test message
            setTimeout(() => {
                console.log('[DEBUG_LOG] Sending test chat message...');
                client.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify({
                        gNumber: TEST_CONFIG.gameNumber,
                        content: 'JWT Authentication Test Message'
                    })
                });
            }, 1000);
        };

        client.onStompError = function (frame) {
            console.error('[DEBUG_LOG] ❌ STOMP error:', frame.headers['message']);
            console.error('[DEBUG_LOG] Error details:', frame.body);
            client.deactivate();
            reject(new Error('STOMP connection failed'));
        };

        client.onWebSocketError = function (error) {
            console.error('[DEBUG_LOG] ❌ WebSocket error:', error);
            reject(error);
        };

        client.onDisconnect = function () {
            console.log('[DEBUG_LOG] WebSocket disconnected');
        };

        // Set timeout for test
        setTimeout(() => {
            console.error('[DEBUG_LOG] ❌ WebSocket test timeout');
            client.deactivate();
            reject(new Error('WebSocket test timeout'));
        }, 15000);

        client.activate();
    });
}

/**
 * Step 4: Test WebSocket connection without JWT (should use fallback)
 */
function testWebSocketWithoutJWT() {
    return new Promise((resolve, reject) => {
        console.log('[DEBUG_LOG] Step 4: Testing WebSocket connection without JWT...');
        
        const client = new Client({
            brokerURL: WS_URL,
            // No Authorization header
            debug: function (str) {
                console.log('[DEBUG_LOG] STOMP Debug (No JWT):', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });

        client.onConnect = function (frame) {
            console.log('[DEBUG_LOG] ✅ WebSocket connected without JWT (using fallback)');
            
            // Subscribe to chat topic
            const subscription = client.subscribe(`/topic/chat.${TEST_CONFIG.gameNumber}`, function (message) {
                console.log('[DEBUG_LOG] ✅ Received chat message (no JWT):', JSON.parse(message.body));
                
                // Clean up and resolve
                subscription.unsubscribe();
                client.deactivate();
                resolve(true);
            });

            // Send a test message
            setTimeout(() => {
                console.log('[DEBUG_LOG] Sending test chat message without JWT...');
                client.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify({
                        gNumber: TEST_CONFIG.gameNumber,
                        content: 'No JWT Test Message (should use fallback user)'
                    })
                });
            }, 1000);
        };

        client.onStompError = function (frame) {
            console.error('[DEBUG_LOG] ❌ STOMP error (no JWT):', frame.headers['message']);
            client.deactivate();
            reject(new Error('STOMP connection failed without JWT'));
        };

        client.onWebSocketError = function (error) {
            console.error('[DEBUG_LOG] ❌ WebSocket error (no JWT):', error);
            reject(error);
        };

        // Set timeout for test
        setTimeout(() => {
            console.error('[DEBUG_LOG] ❌ WebSocket test timeout (no JWT)');
            client.deactivate();
            reject(new Error('WebSocket test timeout without JWT'));
        }, 15000);

        client.activate();
    });
}

/**
 * Step 5: Test REST API compatibility
 */
async function testRestApiCompatibility() {
    console.log('[DEBUG_LOG] Step 5: Testing REST API compatibility...');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/v1/chat/send`, {
            gNumber: TEST_CONFIG.gameNumber,
            content: 'REST API Test Message'
        }, {
            headers: {
                'Authorization': `Bearer ${TEST_CONFIG.accessToken}`
            }
        });

        if (response.status === 200) {
            console.log('[DEBUG_LOG] ✅ REST API chat message sent successfully');
            console.log('[DEBUG_LOG] Response:', response.data);
            return true;
        } else {
            console.error('[DEBUG_LOG] ❌ REST API test failed');
            return false;
        }
    } catch (error) {
        console.error('[DEBUG_LOG] ❌ REST API error:', error.response?.data || error.message);
        return false;
    }
}

/**
 * Main test execution
 */
async function runJwtWebSocketTests() {
    console.log('[DEBUG_LOG] ========== JWT WebSocket Authentication Tests ==========');
    
    try {
        // Step 1: Login
        const loginSuccess = await loginAndGetToken();
        if (!loginSuccess) {
            throw new Error('Login failed');
        }

        // Step 2: Create game
        const gameSuccess = await createGameRoom();
        if (!gameSuccess) {
            throw new Error('Game creation failed');
        }

        // Step 3: Test WebSocket with JWT
        await testWebSocketWithJWT();
        console.log('[DEBUG_LOG] ✅ WebSocket with JWT test passed');

        // Step 4: Test WebSocket without JWT
        await testWebSocketWithoutJWT();
        console.log('[DEBUG_LOG] ✅ WebSocket without JWT test passed');

        // Step 5: Test REST API compatibility
        const restApiSuccess = await testRestApiCompatibility();
        if (!restApiSuccess) {
            throw new Error('REST API compatibility test failed');
        }

        console.log('[DEBUG_LOG] ========== All Tests Passed! ==========');
        console.log('[DEBUG_LOG] ✅ JWT token parsing implemented successfully');
        console.log('[DEBUG_LOG] ✅ WebSocket authentication working correctly');
        console.log('[DEBUG_LOG] ✅ REST API compatibility maintained');
        
    } catch (error) {
        console.error('[DEBUG_LOG] ========== Test Failed ==========');
        console.error('[DEBUG_LOG] ❌ Error:', error.message);
        process.exit(1);
    }
}

// Run tests
if (require.main === module) {
    runJwtWebSocketTests();
}

module.exports = {
    runJwtWebSocketTests,
    loginAndGetToken,
    createGameRoom,
    testWebSocketWithJWT,
    testWebSocketWithoutJWT,
    testRestApiCompatibility
};