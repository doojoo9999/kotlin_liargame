const axios = require('axios');
const SockJS = require('sockjs-client');
const Stomp = require('stompjs');

const BASE_URL = 'http://localhost:8080';

async function testWebSocketConnection() {
    console.log('[DEBUG] Testing WebSocket connection before configuration changes...');
    
    try {
        // Test if server is running
        console.log('[DEBUG] Checking if server is running...');
        const healthCheck = await axios.get(`${BASE_URL}/actuator/health`).catch(() => null);
        if (!healthCheck) {
            console.log('[DEBUG] Server is not running, starting test anyway...');
        } else {
            console.log('[DEBUG] Server is running');
        }
        
        // Test WebSocket connection
        console.log('[DEBUG] Attempting WebSocket connection...');
        const socket = new SockJS(`${BASE_URL}/ws`);
        const stompClient = Stomp.over(socket);
        
        // Disable debug logging for cleaner output
        stompClient.debug = null;
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.log('[DEBUG] WebSocket connection timeout');
                reject(new Error('Connection timeout'));
            }, 5000);
            
            stompClient.connect({}, 
                function(frame) {
                    clearTimeout(timeout);
                    console.log('[DEBUG] WebSocket connected successfully:', frame);
                    
                    // Test subscribing to a topic
                    stompClient.subscribe('/topic/test', function(message) {
                        console.log('[DEBUG] Received message:', message.body);
                    });
                    
                    // Test sending a message
                    stompClient.send('/app/test', {}, JSON.stringify({
                        message: 'Test message',
                        timestamp: new Date().toISOString()
                    }));
                    
                    setTimeout(() => {
                        stompClient.disconnect();
                        console.log('[DEBUG] WebSocket disconnected');
                        resolve('WebSocket test completed successfully');
                    }, 2000);
                },
                function(error) {
                    clearTimeout(timeout);
                    console.log('[DEBUG] WebSocket connection error:', error);
                    reject(error);
                }
            );
        });
        
    } catch (error) {
        console.error('[DEBUG] WebSocket test failed:', error.message);
        throw error;
    }
}

// Run the test
testWebSocketConnection()
    .then(result => {
        console.log('[DEBUG] Test result:', result);
        process.exit(0);
    })
    .catch(error => {
        console.error('[DEBUG] Test failed:', error.message);
        process.exit(1);
    });