// Test script to verify WebSocket authentication fix
const axios = require('axios');
const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

const SERVER_URL = 'http://localhost:20021';
const API_BASE_URL = `${SERVER_URL}/api/v1`;

// Create axios client with credentials (similar to frontend)
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

async function testWebSocketAuth() {
    console.log('[TEST] Starting WebSocket authentication test...');
    
    try {
        // Step 1: Login to establish session
        console.log('[TEST] Step 1: Logging in...');
        const loginResponse = await apiClient.post('/auth/login', { nickname: 'TestUser' });
        console.log('[TEST] Login successful:', loginResponse.data);
        
        // Step 2: Use existing game room
        console.log('[TEST] Step 2: Using existing game room...');
        const gameNumber = 1; // Use the existing game room
        console.log('[TEST] Using game number:', gameNumber);
        
        // Try to join the game if not already in it
        try {
            await apiClient.post('/game/join', { gameNumber: gameNumber, password: '' });
            console.log('[TEST] Joined game successfully');
        } catch (error) {
            console.log('[TEST] Already in game or join failed (this is okay):', error.response?.status);
        }
        
        // Step 3: Connect to WebSocket with credentials
        console.log('[TEST] Step 3: Connecting to WebSocket...');
        const client = new Client({
            webSocketFactory: () => new SockJS(`${SERVER_URL}/ws`, null, {
                withCredentials: true // This is the fix we applied
            }),
            debug: (str) => {
                console.log('[STOMP DEBUG]', str);
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
        });
        
        return new Promise((resolve, reject) => {
            client.onConnect = (frame) => {
                console.log('[TEST] WebSocket connected successfully!');
                
                // Step 4: Subscribe to chat messages
                console.log('[TEST] Step 4: Subscribing to chat messages...');
                client.subscribe(`/topic/chat.${gameNumber}`, (message) => {
                    const data = JSON.parse(message.body);
                    console.log('[TEST] Received chat message:', data);
                    
                    // Step 6: Verify message was saved by getting chat history
                    setTimeout(async () => {
                        try {
                            console.log('[TEST] Step 6: Getting chat history...');
                            const historyResponse = await apiClient.get('/chat/history', {
                                params: { gameNumber: gameNumber, limit: 10 }
                            });
                            console.log('[TEST] Chat history:', historyResponse.data);
                            
                            if (historyResponse.data.length > 0) {
                                console.log('[TEST] ✅ SUCCESS: Chat message was saved and retrieved!');
                            } else {
                                console.log('[TEST] ❌ ISSUE: No chat messages found in history');
                            }
                            
                            client.deactivate();
                            resolve();
                        } catch (error) {
                            console.error('[TEST] Error getting chat history:', error.message);
                            client.deactivate();
                            reject(error);
                        }
                    }, 1000);
                });
                
                // Subscribe to error messages
                client.subscribe(`/topic/chat.error.${gameNumber}`, (message) => {
                    const errorData = JSON.parse(message.body);
                    console.error('[TEST] ❌ Chat error received:', errorData);
                    client.deactivate();
                    reject(new Error(`Chat error: ${errorData.message}`));
                });
                
                // Step 5: Send a test message
                console.log('[TEST] Step 5: Sending test message...');
                client.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify({
                        gameNumber: gameNumber,
                        content: 'Hello, this is a test message!'
                    }),
                    headers: {
                        'content-type': 'application/json'
                    }
                });
            };
            
            client.onStompError = (frame) => {
                console.error('[TEST] ❌ STOMP error:', frame);
                reject(new Error(`STOMP error: ${frame.headers['message']}`));
            };
            
            client.onWebSocketError = (error) => {
                console.error('[TEST] ❌ WebSocket error:', error);
                reject(error);
            };
            
            client.activate();
        });
        
    } catch (error) {
        console.error('[TEST] ❌ Test failed:', error.message);
        if (error.response) {
            console.error('[TEST] Response data:', error.response.data);
            console.error('[TEST] Response status:', error.response.status);
        }
        throw error;
    }
}

// Run the test
if (require.main === module) {
    testWebSocketAuth()
        .then(() => {
            console.log('[TEST] 🎉 All tests completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('[TEST] 💥 Test suite failed:', error.message);
            process.exit(1);
        });
}

module.exports = { testWebSocketAuth };