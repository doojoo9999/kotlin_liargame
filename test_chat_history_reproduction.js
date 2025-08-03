/**
 * Chat History Issue Reproduction Script
 * 
 * This script reproduces the issue described:
 * 1. Real-time chat works (WebSocket messages appear immediately)
 * 2. Chat history fails (API returns empty array after page refresh)
 * 
 * Test Steps:
 * 1. Send a WebSocket chat message
 * 2. Immediately call getChatHistory API
 * 3. Check if the message was saved to database
 * 4. Verify if the API returns the sent message
 */

const axios = require('axios');
const WebSocket = require('ws');
const SockJS = require('sockjs-client');
const Stomp = require('@stomp/stompjs');

// Configuration
const BASE_URL = 'http://localhost:20021';
const API_BASE_URL = `${BASE_URL}/api/v1`;
const WS_URL = `${BASE_URL}/ws`;

// Test data
const TEST_GAME_NUMBER = 2; // Using gNumber=2 as mentioned in the issue
const TEST_MESSAGE = 'Test message for chat history reproduction';
const TEST_USER_ID = 1;

class ChatHistoryTester {
    constructor() {
        this.stompClient = null;
        this.accessToken = null;
    }

    async authenticate() {
        try {
            console.log('[DEBUG_LOG] Authenticating user...');
            
            // Login to get access token
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                nickname: 'TestUser'
            });
            
            this.accessToken = loginResponse.data.accessToken;
            console.log('[DEBUG_LOG] Authentication successful, token:', this.accessToken?.substring(0, 20) + '...');
            
            return true;
        } catch (error) {
            console.error('[ERROR] Authentication failed:', error.response?.data || error.message);
            return false;
        }
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                console.log('[DEBUG_LOG] Connecting to WebSocket...');
                
                // Create STOMP client
                this.stompClient = new Stomp.Client({
                    webSocketFactory: () => new SockJS(WS_URL),
                    connectHeaders: {
                        Authorization: `Bearer ${this.accessToken}`
                    },
                    debug: (str) => {
                        console.log('[STOMP_DEBUG]', str);
                    },
                    reconnectDelay: 5000,
                    heartbeatIncoming: 4000,
                    heartbeatOutgoing: 4000,
                });

                this.stompClient.onConnect = (frame) => {
                    console.log('[DEBUG_LOG] WebSocket connected:', frame);
                    resolve();
                };

                this.stompClient.onStompError = (frame) => {
                    console.error('[ERROR] STOMP error:', frame);
                    reject(new Error('STOMP connection failed'));
                };

                this.stompClient.activate();
                
            } catch (error) {
                console.error('[ERROR] WebSocket connection failed:', error);
                reject(error);
            }
        });
    }

    async sendWebSocketMessage() {
        return new Promise((resolve, reject) => {
            try {
                console.log('[DEBUG_LOG] Sending WebSocket chat message...');
                
                // Subscribe to chat topic to receive confirmation
                const subscription = this.stompClient.subscribe(`/topic/chat.${TEST_GAME_NUMBER}`, (message) => {
                    console.log('[DEBUG_LOG] Received WebSocket message confirmation:', JSON.parse(message.body));
                    subscription.unsubscribe();
                    resolve();
                });

                // Send chat message via WebSocket
                this.stompClient.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify({
                        gNumber: TEST_GAME_NUMBER,
                        content: TEST_MESSAGE
                    })
                });

                // Timeout after 10 seconds
                setTimeout(() => {
                    subscription.unsubscribe();
                    reject(new Error('WebSocket message timeout'));
                }, 10000);
                
            } catch (error) {
                console.error('[ERROR] Failed to send WebSocket message:', error);
                reject(error);
            }
        });
    }

    async getChatHistoryViaAPI() {
        try {
            console.log('[DEBUG_LOG] Calling getChatHistory API...');
            
            const response = await axios.get(`${API_BASE_URL}/chat/history`, {
                params: {
                    gNumber: TEST_GAME_NUMBER,
                    limit: 50
                },
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            });

            console.log('[DEBUG_LOG] Chat history API response:', response.data);
            console.log('[DEBUG_LOG] Number of messages returned:', Array.isArray(response.data) ? response.data.length : 'Not an array');
            
            return response.data;
            
        } catch (error) {
            console.error('[ERROR] Chat history API failed:', error.response?.data || error.message);
            throw error;
        }
    }

    async checkDatabaseDirectly() {
        try {
            console.log('[DEBUG_LOG] Checking if game exists...');
            
            // Check if the game exists
            const gameResponse = await axios.get(`${API_BASE_URL}/game/${TEST_GAME_NUMBER}`, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            });
            
            console.log('[DEBUG_LOG] Game info:', gameResponse.data);
            return true;
            
        } catch (error) {
            console.error('[ERROR] Game check failed:', error.response?.data || error.message);
            return false;
        }
    }

    async runTest() {
        try {
            console.log('='.repeat(60));
            console.log('CHAT HISTORY ISSUE REPRODUCTION TEST');
            console.log('='.repeat(60));

            // Step 1: Authenticate
            const authSuccess = await this.authenticate();
            if (!authSuccess) {
                throw new Error('Authentication failed');
            }

            // Step 2: Check if game exists
            const gameExists = await this.checkDatabaseDirectly();
            if (!gameExists) {
                console.log('[WARN] Game does not exist, this might be the issue');
            }

            // Step 3: Connect WebSocket
            await this.connectWebSocket();

            // Step 4: Send WebSocket message
            await this.sendWebSocketMessage();
            console.log('[SUCCESS] WebSocket message sent successfully');

            // Step 5: Wait a moment for database save
            console.log('[DEBUG_LOG] Waiting 2 seconds for database save...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 6: Get chat history via API
            const chatHistory = await this.getChatHistoryViaAPI();

            // Step 7: Analyze results
            console.log('\n' + '='.repeat(60));
            console.log('TEST RESULTS ANALYSIS');
            console.log('='.repeat(60));

            if (Array.isArray(chatHistory) && chatHistory.length > 0) {
                console.log('[SUCCESS] Chat history loaded successfully!');
                console.log('[INFO] Found', chatHistory.length, 'messages');
                
                const testMessageFound = chatHistory.some(msg => 
                    msg.content && msg.content.includes(TEST_MESSAGE)
                );
                
                if (testMessageFound) {
                    console.log('[SUCCESS] Test message found in chat history!');
                } else {
                    console.log('[WARN] Test message not found in chat history');
                    console.log('[INFO] Messages found:', chatHistory.map(msg => msg.content));
                }
            } else {
                console.log('[ISSUE CONFIRMED] Chat history is empty!');
                console.log('[ANALYSIS] WebSocket message was sent but not saved to database');
                console.log('[RECOMMENDATION] Check ChatService.sendMessage() database save operation');
            }

        } catch (error) {
            console.error('[ERROR] Test failed:', error.message);
        } finally {
            // Cleanup
            if (this.stompClient) {
                this.stompClient.deactivate();
            }
        }
    }
}

// Run the test
const tester = new ChatHistoryTester();
tester.runTest().then(() => {
    console.log('\n[DEBUG_LOG] Test completed');
    process.exit(0);
}).catch((error) => {
    console.error('[ERROR] Test execution failed:', error);
    process.exit(1);
});