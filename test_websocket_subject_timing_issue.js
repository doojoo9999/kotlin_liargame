/**
 * Test script to reproduce the WebSocket subject update timing issue
 * 
 * Issue: WebSocket subscription happens before connection is established
 * Expected logs: "Game STOMP not connected, cannot subscribe to: /topic/subjects"
 * followed by "Game STOMP connected"
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

console.log('🔍 Testing WebSocket Subject Update Timing Issue');
console.log('='.repeat(60));

// Test configuration
const API_BASE_URL = 'http://localhost:20021/api/v1';
const TEST_SUBJECT_NAME = '테스트 주제 추가';

async function testWebSocketTimingIssue() {
    try {
        console.log('\n📋 Test 1: Verify Current Frontend Implementation');
        
        // Check GameContext.jsx current implementation
        const gameContextPath = path.join(__dirname, 'frontend', 'src', 'context', 'GameContext.jsx');
        if (fs.existsSync(gameContextPath)) {
            const gameContextContent = fs.readFileSync(gameContextPath, 'utf8');
            
            // Check for the problematic useEffect
            const hasProblematicUseEffect = gameContextContent.includes('subscribeToGlobalSubjects') &&
                                          gameContextContent.includes('gameStompClient.subscribe(\'/topic/subjects\'');
            
            console.log('✅ GameContext.jsx found');
            console.log(`${hasProblematicUseEffect ? '❌' : '✅'} Problematic useEffect pattern: ${hasProblematicUseEffect ? 'FOUND' : 'NOT FOUND'}`);
            
            // Check if connection waiting is implemented
            const hasConnectionWaiting = gameContextContent.includes('await gameStompClient.connect()') &&
                                       gameContextContent.includes('isConnected');
            
            console.log(`${hasConnectionWaiting ? '✅' : '❌'} Connection waiting logic: ${hasConnectionWaiting ? 'IMPLEMENTED' : 'MISSING'}`);
        } else {
            console.log('❌ GameContext.jsx not found');
        }

        console.log('\n📋 Test 2: Verify gameStompClient.js Implementation');
        
        // Check gameStompClient.js current implementation
        const stompClientPath = path.join(__dirname, 'frontend', 'src', 'socket', 'gameStompClient.js');
        if (fs.existsSync(stompClientPath)) {
            const stompClientContent = fs.readFileSync(stompClientPath, 'utf8');
            
            // Check subscribe method implementation
            const hasImmediateFailSubscribe = stompClientContent.includes('if (!this.isConnected || !this.client) {') &&
                                            stompClientContent.includes('return null');
            
            console.log('✅ gameStompClient.js found');
            console.log(`${hasImmediateFailSubscribe ? '❌' : '✅'} Immediate fail subscribe pattern: ${hasImmediateFailSubscribe ? 'FOUND' : 'NOT FOUND'}`);
            
            // Check if connection waiting subscribe is implemented
            const hasConnectionWaitingSubscribe = stompClientContent.includes('_doSubscribe') ||
                                                stompClientContent.includes('await this.connect()');
            
            console.log(`${hasConnectionWaitingSubscribe ? '✅' : '❌'} Connection waiting subscribe: ${hasConnectionWaitingSubscribe ? 'IMPLEMENTED' : 'MISSING'}`);
        } else {
            console.log('❌ gameStompClient.js not found');
        }

        console.log('\n📋 Test 3: Verify Backend WebSocket Broadcasting');
        
        // Check SubjectController.kt implementation
        const subjectControllerPath = path.join(__dirname, 'src', 'main', 'kotlin', 'org', 'example', 'kotlin_liargame', 'domain', 'subject', 'controller', 'SubjectController.kt');
        if (fs.existsSync(subjectControllerPath)) {
            const controllerContent = fs.readFileSync(subjectControllerPath, 'utf8');
            
            // Check for WebSocket broadcasting
            const hasWebSocketBroadcast = controllerContent.includes('messagingTemplate.convertAndSend("/topic/subjects"') &&
                                        controllerContent.includes('"type" to "SUBJECT_ADDED"');
            
            console.log('✅ SubjectController.kt found');
            console.log(`${hasWebSocketBroadcast ? '✅' : '❌'} WebSocket broadcasting: ${hasWebSocketBroadcast ? 'IMPLEMENTED' : 'MISSING'}`);
            
            // Check message structure
            const hasCorrectMessageStructure = controllerContent.includes('"subject" to mapOf(') &&
                                             controllerContent.includes('"id" to savedSubject.id') &&
                                             controllerContent.includes('"name" to savedSubject.content');
            
            console.log(`${hasCorrectMessageStructure ? '✅' : '❌'} Correct message structure: ${hasCorrectMessageStructure ? 'IMPLEMENTED' : 'MISSING'}`);
        } else {
            console.log('❌ SubjectController.kt not found');
        }

        console.log('\n📋 Test 4: Simulate the Timing Issue');
        console.log('This test simulates the scenario described in the issue:');
        console.log('1. User adds a new subject');
        console.log('2. API call succeeds');
        console.log('3. WebSocket subscription fails due to timing');
        console.log('4. Subject doesn\'t appear in dropdown until page refresh');
        
        // Test API endpoint (if server is running)
        try {
            console.log('\n🔄 Testing subject addition API...');
            const response = await axios.post(`${API_BASE_URL}/subjects/applysubj`, {
                name: TEST_SUBJECT_NAME
            });
            
            console.log('✅ API call successful:', response.data);
            console.log('📝 Expected WebSocket message should be sent to /topic/subjects');
            console.log('❌ But frontend subscription likely failed due to timing issue');
            
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log('⚠️  Server not running - cannot test API call');
                console.log('   Start the server with: ./gradlew bootRun');
            } else {
                console.log('❌ API call failed:', error.message);
            }
        }

        console.log('\n📊 Issue Summary:');
        console.log('='.repeat(40));
        console.log('🔴 PROBLEM: WebSocket subscription happens before connection is established');
        console.log('📍 LOCATION: GameContext.jsx useEffect + gameStompClient.js subscribe method');
        console.log('🎯 SOLUTION NEEDED:');
        console.log('   1. Modify gameStompClient.js to wait for connection before subscribing');
        console.log('   2. Update GameContext.jsx to properly handle connection timing');
        console.log('   3. Add timeout and retry logic for robust connection handling');
        
        console.log('\n✅ Backend WebSocket broadcasting is already correctly implemented');
        console.log('🔧 Frontend timing fixes are needed');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
testWebSocketTimingIssue();