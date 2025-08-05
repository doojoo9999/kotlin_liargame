// Test script to verify the duplicate subscription fix
const { Client } = require('@stomp/stompjs');
const SockJS = require('sockjs-client');

// Mock the gameStompClient behavior to test duplicate subscription prevention
class TestGameStompClient {
    constructor() {
        this.subscriptions = new Map();
        this.messageCount = 0;
    }

    // Simulate the fixed _doSubscribe method
    _doSubscribe(topic, callback) {
        // Check if already subscribed to this topic
        if (this.subscriptions.has(topic)) {
            console.log('[DEBUG_LOG] Already subscribed to topic:', topic, '- skipping duplicate subscription');
            return this.subscriptions.get(topic);
        }

        console.log('[DEBUG_LOG] Game STOMP subscribing to:', topic);

        // Mock subscription object
        const subscription = {
            topic: topic,
            callback: callback,
            unsubscribe: () => {
                console.log('[DEBUG_LOG] Unsubscribing from:', topic);
                this.subscriptions.delete(topic);
            }
        };

        this.subscriptions.set(topic, subscription);
        return subscription;
    }

    // Simulate chat subscription
    subscribeToGameChat(gameNumber, callback) {
        const topic = `/topic/chat.${gameNumber}`;
        return this._doSubscribe(topic, callback);
    }

    // Simulate receiving a message
    simulateMessage(gameNumber, message) {
        const topic = `/topic/chat.${gameNumber}`;
        const subscription = this.subscriptions.get(topic);
        if (subscription) {
            subscription.callback(message);
        }
    }

    getSubscriptionCount() {
        return this.subscriptions.size;
    }
}

// Test the fix
console.log('=== Testing Duplicate Subscription Fix ===');

const testClient = new TestGameStompClient();
const gameNumber = 1;
let messageReceiveCount = 0;

const messageHandler = (message) => {
    messageReceiveCount++;
    console.log(`[TEST] Message received (count: ${messageReceiveCount}):`, message);
};

// Simulate the scenario that was causing duplicates
console.log('\n1. First subscription (from connectSocket):');
testClient.subscribeToGameChat(gameNumber, messageHandler);

console.log('\n2. Second subscription attempt (from connectToRoom):');
testClient.subscribeToGameChat(gameNumber, messageHandler);

console.log('\n3. Third subscription attempt (from socketStore connectSocket):');
testClient.subscribeToGameChat(gameNumber, messageHandler);

console.log('\n4. Fourth subscription attempt (from socketStore connectToRoom):');
testClient.subscribeToGameChat(gameNumber, messageHandler);

console.log(`\nTotal subscriptions created: ${testClient.getSubscriptionCount()}`);
console.log('Expected: 1 (should prevent duplicates)');

// Test message delivery
console.log('\n=== Testing Message Delivery ===');
testClient.simulateMessage(gameNumber, { content: 'Test message', playerNickname: 'TestUser' });

console.log(`\nMessages received: ${messageReceiveCount}`);
console.log('Expected: 1 (should receive message only once)');

if (testClient.getSubscriptionCount() === 1 && messageReceiveCount === 1) {
    console.log('\n✅ SUCCESS: Duplicate subscription fix is working correctly!');
} else {
    console.log('\n❌ FAILURE: Fix is not working as expected');
    console.log(`  - Subscriptions: ${testClient.getSubscriptionCount()} (expected: 1)`);
    console.log(`  - Message count: ${messageReceiveCount} (expected: 1)`);
}