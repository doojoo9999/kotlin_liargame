const axios = require('axios');
const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

// Base URL for the server
const BASE_URL = 'http://localhost:20021';

// Test users
const TEST_USERS = [
    { nickname: '테스트01', password: 'password' },
    { nickname: '제발', password: 'password' }
];

async function testUserWebSocketAuth(user) {
    console.log(`\n=== Testing WebSocket Auth for user: ${user.nickname} ===`);
    
    try {
        // Create axios instance with cookie jar
        const axiosInstance = axios.create({
            baseURL: BASE_URL,
            withCredentials: true,
            timeout: 10000
        });

        // Step 1: Login
        console.log(`[${user.nickname}] Step 1: Logging in...`);
        const loginResponse = await axiosInstance.post('/api/v1/auth/login', {
            nickname: user.nickname,
            password: user.password
        });
        
        console.log(`[${user.nickname}] Login response:`, loginResponse.data);
        
        // Step 2: Check session
        console.log(`[${user.nickname}] Step 2: Checking session...`);
        const meResponse = await axiosInstance.get('/api/v1/auth/me');
        console.log(`[${user.nickname}] Session info:`, meResponse.data);
        
        // Step 3: Create WebSocket connection
        console.log(`[${user.nickname}] Step 3: Creating WebSocket connection...`);
        
        return new Promise((resolve, reject) => {
            const sockjs = new SockJS(`${BASE_URL}/ws`, null, {
                withCredentials: true
            });
            
            const client = new Client({
                webSocketFactory: () => sockjs,
                debug: (str) => {
                    console.log(`[${user.nickname}] STOMP:`, str);
                },
                connectHeaders: {},
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            client.onConnect = (frame) => {
                console.log(`[${user.nickname}] WebSocket connected:`, frame.headers);
                
                // Test sending a chat message
                setTimeout(() => {
                    console.log(`[${user.nickname}] Sending test chat message...`);
                    client.publish({
                        destination: '/app/chat.send',
                        body: JSON.stringify({
                            gameNumber: 1,
                            content: 'Test message from ' + user.nickname
                        }),
                        headers: {
                            'content-type': 'application/json'
                        }
                    });
                    
                    // Disconnect after sending message
                    setTimeout(() => {
                        client.deactivate();
                        resolve(`[${user.nickname}] Test completed successfully`);
                    }, 2000);
                }, 1000);
            };

            client.onStompError = (frame) => {
                console.error(`[${user.nickname}] STOMP error:`, frame);
                client.deactivate();
                reject(new Error(`STOMP error: ${frame.headers['message']}`));
            };

            client.onWebSocketError = (error) => {
                console.error(`[${user.nickname}] WebSocket error:`, error);
                client.deactivate();
                reject(error);
            };

            client.activate();
        });
        
    } catch (error) {
        console.error(`[${user.nickname}] Error:`, error.message);
        if (error.response) {
            console.error(`[${user.nickname}] Response data:`, error.response.data);
        }
        throw error;
    }
}

async function runTests() {
    console.log('Starting WebSocket Authentication Debug Tests...');
    
    for (const user of TEST_USERS) {
        try {
            await testUserWebSocketAuth(user);
            console.log(`✅ Test passed for ${user.nickname}`);
        } catch (error) {
            console.log(`❌ Test failed for ${user.nickname}:`, error.message);
        }
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    console.log('\n=== All tests completed ===');
}

// Run the tests
runTests().catch(console.error);