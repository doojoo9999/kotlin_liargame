/**
 * Test script to reproduce the multiplayer synchronization issue
 * 
 * Issue Description:
 * - Test User 1 sees room title as '테스트 방 #1 - [음식]' but Test User 2 sees '제목 없음 #1'
 * - Test User 1 sees participant count as 1/3 but Test User 2 sees 2/8
 * - Test User 1 sees subject as '음식' but Test User 2 sees '주제 없음'
 * - Test User 1 doesn't recognize that Test User 2 joined the room
 */

const WebSocket = require('ws');
const SockJS = require('sockjs-client');
const { Client } = require('@stomp/stompjs');

// Test configuration
const SERVER_URL = 'http://localhost:20021';
const TEST_ROOM_NUMBER = 1;

class TestUser {
    constructor(userId, nickname) {
        this.userId = userId;
        this.nickname = nickname;
        this.client = null;
        this.isConnected = false;
        this.receivedMessages = [];
        this.currentRoomData = null;
    }

    async connect() {
        return new Promise((resolve, reject) => {
            console.log(`[${this.nickname}] Connecting to WebSocket...`);
            
            this.client = new Client({
                webSocketFactory: () => new SockJS(`${SERVER_URL}/ws`, null, {
                    withCredentials: true
                }),
                debug: (str) => {
                    console.log(`[${this.nickname}] STOMP:`, str);
                },
                reconnectDelay: 5000,
                heartbeatIncoming: 4000,
                heartbeatOutgoing: 4000,
            });

            this.client.onConnect = (frame) => {
                console.log(`[${this.nickname}] ✅ Connected to WebSocket`);
                this.isConnected = true;
                resolve();
            };

            this.client.onStompError = (frame) => {
                console.error(`[${this.nickname}] ❌ STOMP error:`, frame);
                reject(new Error(`STOMP error: ${frame.headers['message']}`));
            };

            this.client.onWebSocketError = (error) => {
                console.error(`[${this.nickname}] ❌ WebSocket error:`, error);
                reject(error);
            };

            this.client.activate();
        });
    }

    subscribeToRoom(gameNumber) {
        if (!this.isConnected) {
            console.error(`[${this.nickname}] ❌ Not connected, cannot subscribe`);
            return;
        }

        console.log(`[${this.nickname}] 🔔 Subscribing to room updates...`);
        
        // Subscribe to the topic that the client currently uses (incorrect)
        this.client.subscribe(`/topic/game.${gameNumber}`, (message) => {
            const data = JSON.parse(message.body);
            console.log(`[${this.nickname}] 📨 Received from /topic/game.${gameNumber}:`, data);
            this.receivedMessages.push({
                topic: `/topic/game.${gameNumber}`,
                data: data,
                timestamp: new Date().toISOString()
            });
            this.processRoomUpdate(data);
        });

        // Also subscribe to the topic that the server actually sends to (correct)
        this.client.subscribe(`/topic/room.${gameNumber}`, (message) => {
            const data = JSON.parse(message.body);
            console.log(`[${this.nickname}] 📨 Received from /topic/room.${gameNumber}:`, data);
            this.receivedMessages.push({
                topic: `/topic/room.${gameNumber}`,
                data: data,
                timestamp: new Date().toISOString()
            });
            this.processRoomUpdate(data);
        });

        // Subscribe to player updates
        this.client.subscribe(`/topic/players.${gameNumber}`, (message) => {
            const data = JSON.parse(message.body);
            console.log(`[${this.nickname}] 👥 Received player update:`, data);
            this.receivedMessages.push({
                topic: `/topic/players.${gameNumber}`,
                data: data,
                timestamp: new Date().toISOString()
            });
        });

        // Subscribe to lobby updates
        this.client.subscribe(`/topic/lobby`, (message) => {
            const data = JSON.parse(message.body);
            console.log(`[${this.nickname}] 🏠 Received lobby update:`, data);
            this.receivedMessages.push({
                topic: `/topic/lobby`,
                data: data,
                timestamp: new Date().toISOString()
            });
        });
    }

    processRoomUpdate(data) {
        if (data.type === 'PLAYER_JOINED' || data.type === 'PLAYER_LEFT') {
            if (data.roomData) {
                this.currentRoomData = data.roomData;
                console.log(`[${this.nickname}] 🏠 Updated room data:`, {
                    title: data.roomData.title,
                    currentPlayers: data.roomData.currentPlayers,
                    maxPlayers: data.roomData.maxPlayers,
                    subject: data.roomData.subject,
                    playersCount: data.roomData.players ? data.roomData.players.length : 0
                });
            }
        }
    }

    async joinRoom(gameNumber) {
        if (!this.isConnected) {
            console.error(`[${this.nickname}] ❌ Not connected, cannot join room`);
            return;
        }

        console.log(`[${this.nickname}] 🚪 Joining room ${gameNumber}...`);
        
        try {
            // Simulate API call to join room
            const response = await fetch(`${SERVER_URL}/api/v1/game/join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    gameNumber: gameNumber
                })
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`[${this.nickname}] ✅ Successfully joined room:`, result);
                return result;
            } else {
                console.error(`[${this.nickname}] ❌ Failed to join room:`, response.status);
                return null;
            }
        } catch (error) {
            console.error(`[${this.nickname}] ❌ Error joining room:`, error);
            return null;
        }
    }

    printCurrentState() {
        console.log(`\n[${this.nickname}] 📊 CURRENT STATE:`);
        console.log(`  Connected: ${this.isConnected}`);
        console.log(`  Messages received: ${this.receivedMessages.length}`);
        
        if (this.currentRoomData) {
            console.log(`  Room Title: ${this.currentRoomData.title || '제목 없음'}`);
            console.log(`  Participants: ${this.currentRoomData.currentPlayers || 0}/${this.currentRoomData.maxPlayers || 0}`);
            console.log(`  Subject: ${this.currentRoomData.subject || '주제 없음'}`);
            console.log(`  Players: ${this.currentRoomData.players ? this.currentRoomData.players.length : 0}`);
        } else {
            console.log(`  Room Data: Not available`);
        }
        
        console.log(`  Recent messages:`);
        this.receivedMessages.slice(-3).forEach((msg, index) => {
            console.log(`    ${index + 1}. [${msg.topic}] ${msg.data.type || 'Unknown'}`);
        });
    }

    disconnect() {
        if (this.client && this.isConnected) {
            console.log(`[${this.nickname}] 🔌 Disconnecting...`);
            this.client.deactivate();
            this.isConnected = false;
        }
    }
}

async function runSynchronizationTest() {
    console.log('🧪 Starting Multiplayer Synchronization Test\n');
    
    // Create test users
    const testUser1 = new TestUser(1, 'TestUser1');
    const testUser2 = new TestUser(2, 'TestUser2');
    
    try {
        // Step 1: Connect both users
        console.log('📡 Step 1: Connecting users to WebSocket...');
        await testUser1.connect();
        await testUser2.connect();
        
        // Step 2: Subscribe to room updates
        console.log('\n🔔 Step 2: Setting up subscriptions...');
        testUser1.subscribeToRoom(TEST_ROOM_NUMBER);
        testUser2.subscribeToRoom(TEST_ROOM_NUMBER);
        
        // Wait a bit for subscriptions to be established
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: TestUser1 joins the room
        console.log('\n🚪 Step 3: TestUser1 joining room...');
        await testUser1.joinRoom(TEST_ROOM_NUMBER);
        
        // Wait for messages to propagate
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 4: TestUser2 joins the room
        console.log('\n🚪 Step 4: TestUser2 joining room...');
        await testUser2.joinRoom(TEST_ROOM_NUMBER);
        
        // Wait for messages to propagate
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Step 5: Compare states
        console.log('\n📊 Step 5: Comparing user states...');
        testUser1.printCurrentState();
        testUser2.printCurrentState();
        
        // Step 6: Analyze synchronization issues
        console.log('\n🔍 Step 6: Analyzing synchronization issues...');
        analyzeSynchronizationIssues(testUser1, testUser2);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        // Cleanup
        console.log('\n🧹 Cleaning up...');
        testUser1.disconnect();
        testUser2.disconnect();
    }
}

function analyzeSynchronizationIssues(user1, user2) {
    console.log('🔍 SYNCHRONIZATION ANALYSIS:');
    
    // Check if both users received messages
    console.log(`\n📨 Message Reception:`);
    console.log(`  ${user1.nickname}: ${user1.receivedMessages.length} messages`);
    console.log(`  ${user2.nickname}: ${user2.receivedMessages.length} messages`);
    
    // Check room data consistency
    if (user1.currentRoomData && user2.currentRoomData) {
        console.log(`\n🏠 Room Data Comparison:`);
        console.log(`  Title: ${user1.nickname}="${user1.currentRoomData.title}" vs ${user2.nickname}="${user2.currentRoomData.title}"`);
        console.log(`  Participants: ${user1.nickname}="${user1.currentRoomData.currentPlayers}/${user1.currentRoomData.maxPlayers}" vs ${user2.nickname}="${user2.currentRoomData.currentPlayers}/${user2.currentRoomData.maxPlayers}"`);
        console.log(`  Subject: ${user1.nickname}="${user1.currentRoomData.subject}" vs ${user2.nickname}="${user2.currentRoomData.subject}"`);
        
        // Identify issues
        const issues = [];
        if (user1.currentRoomData.title !== user2.currentRoomData.title) {
            issues.push('❌ Room titles are different');
        }
        if (user1.currentRoomData.currentPlayers !== user2.currentRoomData.currentPlayers) {
            issues.push('❌ Participant counts are different');
        }
        if (user1.currentRoomData.subject !== user2.currentRoomData.subject) {
            issues.push('❌ Subjects are different');
        }
        
        if (issues.length > 0) {
            console.log(`\n🚨 ISSUES FOUND:`);
            issues.forEach(issue => console.log(`  ${issue}`));
        } else {
            console.log(`\n✅ No synchronization issues found`);
        }
    } else {
        console.log(`\n❌ Cannot compare room data - one or both users have no room data`);
        console.log(`  ${user1.nickname} room data: ${user1.currentRoomData ? 'Available' : 'Missing'}`);
        console.log(`  ${user2.nickname} room data: ${user2.currentRoomData ? 'Available' : 'Missing'}`);
    }
    
    // Check subscription topics
    console.log(`\n📡 Subscription Analysis:`);
    const user1Topics = [...new Set(user1.receivedMessages.map(msg => msg.topic))];
    const user2Topics = [...new Set(user2.receivedMessages.map(msg => msg.topic))];
    
    console.log(`  ${user1.nickname} received from topics: ${user1Topics.join(', ')}`);
    console.log(`  ${user2.nickname} received from topics: ${user2Topics.join(', ')}`);
    
    // Check if messages were received from the correct topic
    const correctTopic = `/topic/room.${TEST_ROOM_NUMBER}`;
    const incorrectTopic = `/topic/game.${TEST_ROOM_NUMBER}`;
    
    const user1CorrectMessages = user1.receivedMessages.filter(msg => msg.topic === correctTopic).length;
    const user1IncorrectMessages = user1.receivedMessages.filter(msg => msg.topic === incorrectTopic).length;
    const user2CorrectMessages = user2.receivedMessages.filter(msg => msg.topic === correctTopic).length;
    const user2IncorrectMessages = user2.receivedMessages.filter(msg => msg.topic === incorrectTopic).length;
    
    console.log(`\n📊 Topic Message Count:`);
    console.log(`  Correct topic (${correctTopic}): ${user1.nickname}=${user1CorrectMessages}, ${user2.nickname}=${user2CorrectMessages}`);
    console.log(`  Incorrect topic (${incorrectTopic}): ${user1.nickname}=${user1IncorrectMessages}, ${user2.nickname}=${user2IncorrectMessages}`);
    
    if (user1CorrectMessages === 0 && user2CorrectMessages === 0) {
        console.log(`  🚨 CRITICAL: No messages received on correct topic - this explains the synchronization issue!`);
    }
}

// Run the test
if (require.main === module) {
    runSynchronizationTest().catch(console.error);
}

module.exports = { TestUser, runSynchronizationTest };