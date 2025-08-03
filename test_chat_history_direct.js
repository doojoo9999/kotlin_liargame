/**
 * Direct Chat History Test Script
 * 
 * This script will:
 * 1. Create a game room
 * 2. Join the game
 * 3. Send a chat message via REST API (not WebSocket)
 * 4. Verify the message is saved via getChatHistory API
 * 
 * This bypasses WebSocket authentication issues to test core chat functionality
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:20021';
const API_BASE_URL = `${BASE_URL}/api/v1`;

// Test data
const TEST_MESSAGE = 'Test message via REST API for chat history verification';

class DirectChatTester {
    constructor() {
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

    async sendChatMessageViaAPI() {
        try {
            console.log('[DEBUG_LOG] Sending chat message via REST API...');
            
            const response = await axios.post(`${API_BASE_URL}/chat/send`, {
                gNumber: this.gameNumber,
                content: TEST_MESSAGE
            }, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`
                }
            });

            console.log('[DEBUG_LOG] Chat message sent via API:', response.data);
            return response.data;
            
        } catch (error) {
            console.error('[ERROR] Failed to send chat message via API:', error.response?.data || error.message);
            throw error;
        }
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
            console.log('DIRECT CHAT HISTORY TEST (REST API ONLY)');
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

            // Step 4: Send chat message via REST API
            const sentMessage = await this.sendChatMessageViaAPI();
            console.log('[SUCCESS] Chat message sent via REST API successfully');

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
                    console.log('[CONCLUSION] Chat functionality is working correctly via REST API');
                    console.log('[ANALYSIS] The issue is likely with WebSocket authentication, not core chat functionality');
                } else {
                    console.log('[WARN] Test message not found in chat history');
                    console.log('[INFO] Messages found:', chatHistory.map(msg => msg.content));
                }
            } else {
                console.log('[ISSUE] Chat history is still empty!');
                console.log('[ANALYSIS] Core chat functionality has issues even with REST API');
            }

        } catch (error) {
            console.error('[ERROR] Test failed:', error.message);
        }
    }
}

// Run the test
const tester = new DirectChatTester();
tester.runTest().then(() => {
    console.log('\n[DEBUG_LOG] Test completed');
    process.exit(0);
}).catch((error) => {
    console.error('[ERROR] Test execution failed:', error);
    process.exit(1);
});