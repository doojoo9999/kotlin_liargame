// Test script to reproduce WebSocket authentication issue
const SockJS = require('sockjs-client');
const Stomp = require('stompjs');

console.log('Testing WebSocket authentication issue...');

// First, let's simulate a login to get session
const axios = require('axios');

async function testWebSocketAuth() {
    try {
        console.log('1. Attempting to login...');
        
        // Login to get session
        const loginResponse = await axios.post('http://localhost:8080/api/v1/auth/login', {
            nickname: 'testuser',
            password: 'testpass'
        }, {
            withCredentials: true
        });
        
        console.log('Login response:', loginResponse.data);
        
        // Get session cookies
        const cookies = loginResponse.headers['set-cookie'];
        console.log('Session cookies:', cookies);
        
        console.log('2. Connecting to WebSocket...');
        
        // Connect to WebSocket with session
        const socket = new SockJS('http://localhost:8080/ws');
        const stompClient = Stomp.over(socket);
        
        stompClient.connect({}, function(frame) {
            console.log('Connected to WebSocket:', frame);
            
            console.log('3. Sending chat message...');
            
            // Send a test message
            stompClient.send('/app/chat.send', {}, JSON.stringify({
                gameNumber: 1,
                content: 'Test message from script'
            }));
            
            setTimeout(() => {
                stompClient.disconnect();
                console.log('Disconnected from WebSocket');
            }, 2000);
            
        }, function(error) {
            console.error('WebSocket connection error:', error);
        });
        
    } catch (error) {
        console.error('Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

testWebSocketAuth();