/**
 * Create Game and Test Chat History Script
 * 
 * This script will:
 * 1. Create a game room
 * 2. Join the game
 * 3. Send a WebSocket chat message
 * 4. Verify the message is saved via getChatHistory API
 */

const axios = require('axios');
const SockJS = require('sockjs-client');
const Stomp = require('@stomp/stompjs');

// Configuration
const BASE_URL = 'http://localhost:20021';
const API_BASE_URL = `${BASE_URL}/api/v1`;
const WS_URL = `${BASE_URL}/ws`;

// Test data
const TEST_MESSAGE = 'Test message for chat history verification';

class GameChatTester {
    constructor() {
        this.stompClient = null;
        this.accessToken = null;
        this.gameNumber = null;
    }

    async authenticate() {
        try {
            console.log('[DEBUG_LOG] Authenticating user...');
            
            const uniqueNickname = `TestUser_${Date.now()}`;
            const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
                nickname: uniqueNickname
            });
            
            this.accessToken = loginResponse.data.accessToken;
            console.log('[DEBUG_LOG] Authentication successful');
            
            return true;
        } catch (error) {
            console.error('[ERROR] Authentication failed:', error.response?.data || error.message);
            return false;
        }
    }

    async createGame() {
        try {
            console.log('[DEBUG_LOG] Creating game room...');
            
            const response = await axios.post(`${API_BASE_URL}/game/create`, {
                gName: 'Test Chat Room',
                gParticipants: 4,
                gTotalRounds: 3,
                gLiarCount: 1,
                useRandomSubjects: true,
                randomSubjectCount: 1
            }, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            });

            this.gameNumber = response.data.gNumber || response.data;
            console.log('[DEBUG_LOG] Game created with number:', this.gameNumber);
            
            return true;
        } catch (error) {
            console.error('[ERROR] Game creation failed:', error.response?.data || error.message);
            return false;
        }
    }

    async joinGame() {
        try {
            console.log('[DEBUG_LOG] Joining game...');
            
            const response = await axios.post(`${API_BASE_URL}/game/join`, {
                gNumber: this.gameNumber
            }, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            });

            console.log('[DEBUG_LOG] Successfully joined game');
            return true;
        } catch (error) {
            console.error('[ERROR] Failed to join game:', error.response?.data || error.message);
            return false;
        }
    }

    async connectWebSocket() {
        return new Promise((resolve, reject) => {
            try {
                console.log('[DEBUG_LOG] Connecting to WebSocket...');
                
                // Create SockJS with proper headers
                const socket = new SockJS(WS_URL, null, {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
                
                this.stompClient = new Stomp.Client({
                    webSocketFactory: () => socket,
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
                    console.log('[DEBUG_LOG] WebSocket connected');
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
                const subscription = this.stompClient.subscribe(`/topic/chat.${this.gameNumber}`, (message) => {
                    console.log('[DEBUG_LOG] Received WebSocket message confirmation:', JSON.parse(message.body));
                    subscription.unsubscribe();
                    resolve();
                });

                // Send chat message via WebSocket
                this.stompClient.publish({
                    destination: '/app/chat.send',
                    body: JSON.stringify({
                        gNumber: this.gameNumber,
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
                    gNumber: this.gameNumber,
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

    async runTest() {
        try {
            console.log('='.repeat(60));
            console.log('GAME CREATION AND CHAT HISTORY TEST');
            console.log('='.repeat(60));

            // Step 1: Authenticate
            const authSuccess = await this.authenticate();
            if (!authSuccess) {
                throw new Error('Authentication failed');
            }

            // Step 2: Create game
            const gameCreated = await this.createGame();
            if (!gameCreated) {
                throw new Error('Game creation failed');
            }

            // Step 3: Join game
            const gameJoined = await this.joinGame();
            if (!gameJoined) {
                throw new Error('Failed to join game');
            }

            // Step 4: Connect WebSocket
            await this.connectWebSocket();

            // Step 5: Send WebSocket message
            await this.sendWebSocketMessage();
            console.log('[SUCCESS] WebSocket message sent successfully');

            // Step 6: Wait a moment for database save
            console.log('[DEBUG_LOG] Waiting 2 seconds for database save...');
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 7: Get chat history via API
            const chatHistory = await this.getChatHistoryViaAPI();

            // Step 8: Analyze results
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
                    console.log('[CONCLUSION] Chat functionality is working correctly');
                } else {
                    console.log('[WARN] Test message not found in chat history');
                    console.log('[INFO] Messages found:', chatHistory.map(msg => msg.content));
                }
            } else {
                console.log('[ISSUE] Chat history is still empty!');
                console.log('[ANALYSIS] Even with valid game, messages are not being saved');
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
const tester = new GameChatTester();
tester.runTest().then(() => {
    console.log('\n[DEBUG_LOG] Test completed');
    process.exit(0);
}).catch((error) => {
    console.error('[ERROR] Test execution failed:', error);
    process.exit(1);
});