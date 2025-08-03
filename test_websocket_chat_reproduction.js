const WebSocket = require('ws');
const SockJS = require('sockjs-client');
const Stomp = require('@stomp/stompjs');

// Test script to reproduce WebSocket chat issue
console.log('[DEBUG_LOG] Starting WebSocket chat reproduction test...');

const BASE_URL = 'http://localhost:8080';
const WEBSOCKET_URL = `${BASE_URL}/ws`;

// Test configuration
const TEST_GAME_NUMBER = 1;
const TEST_MESSAGE = 'Test WebSocket chat message';

async function testWebSocketChat() {
    try {
        console.log('[DEBUG_LOG] Connecting to WebSocket...');
        
        // Create SockJS connection
        const socket = new SockJS(WEBSOCKET_URL);
        const stompClient = Stomp.Stomp.over(socket);
        
        // Disable debug logging from STOMP
        stompClient.debug = null;
        
        return new Promise((resolve, reject) => {
            let messageReceived = false;
            let connectionTimeout;
            
            stompClient.connect({}, 
                // On connect success
                (frame) => {
                    console.log('[DEBUG_LOG] WebSocket connected successfully');
                    console.log('[DEBUG_LOG] Frame:', frame);
                    
                    // Subscribe to chat topic
                    const subscription = stompClient.subscribe(`/topic/chat.${TEST_GAME_NUMBER}`, (message) => {
                        console.log('[DEBUG_LOG] ✅ Received broadcast message:', message.body);
                        messageReceived = true;
                        
                        // Parse the message
                        try {
                            const parsedMessage = JSON.parse(message.body);
                            console.log('[DEBUG_LOG] Parsed message:', parsedMessage);
                        } catch (e) {
                            console.log('[DEBUG_LOG] Failed to parse message:', e.message);
                        }
                        
                        clearTimeout(connectionTimeout);
                        stompClient.disconnect();
                        resolve({ success: true, messageReceived: true });
                    });
                    
                    console.log('[DEBUG_LOG] Subscribed to /topic/chat.' + TEST_GAME_NUMBER);
                    
                    // Send a test message after a short delay
                    setTimeout(() => {
                        console.log('[DEBUG_LOG] Sending test message...');
                        
                        const testMessage = {
                            gNumber: TEST_GAME_NUMBER,
                            content: TEST_MESSAGE
                        };
                        
                        stompClient.send('/app/chat.send', {}, JSON.stringify(testMessage));
                        console.log('[DEBUG_LOG] Message sent to /app/chat.send:', testMessage);
                        
                        // Set timeout to check if message is received
                        connectionTimeout = setTimeout(() => {
                            console.log('[DEBUG_LOG] ❌ Timeout: No broadcast message received within 5 seconds');
                            stompClient.disconnect();
                            resolve({ success: false, messageReceived: false, error: 'No broadcast message received' });
                        }, 5000);
                        
                    }, 1000);
                },
                // On connect error
                (error) => {
                    console.log('[ERROR] WebSocket connection failed:', error);
                    reject({ success: false, error: error.toString() });
                }
            );
        });
        
    } catch (error) {
        console.log('[ERROR] Test setup failed:', error);
        return { success: false, error: error.toString() };
    }
}

async function runTest() {
    console.log('[DEBUG_LOG] =================================');
    console.log('[DEBUG_LOG] WebSocket Chat Reproduction Test');
    console.log('[DEBUG_LOG] =================================');
    
    try {
        const result = await testWebSocketChat();
        
        console.log('[DEBUG_LOG] =================================');
        console.log('[DEBUG_LOG] Test Results:');
        console.log('[DEBUG_LOG] Success:', result.success);
        console.log('[DEBUG_LOG] Message Received:', result.messageReceived);
        if (result.error) {
            console.log('[DEBUG_LOG] Error:', result.error);
        }
        console.log('[DEBUG_LOG] =================================');
        
        if (!result.messageReceived) {
            console.log('[ISSUE CONFIRMED] WebSocket chat messages are not being broadcast to subscribers');
            console.log('[RECOMMENDATION] Check ChatController @MessageMapping("/chat.send") authentication');
        } else {
            console.log('[SUCCESS] WebSocket chat is working correctly');
        }
        
    } catch (error) {
        console.log('[ERROR] Test execution failed:', error);
    }
}

// Run the test
runTest();