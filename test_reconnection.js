// Test script to verify reconnection subscription restoration
// This script simulates the reconnection behavior

console.log('[DEBUG_LOG] Testing STOMP client reconnection subscription restoration...')

// Mock test for GameStompClient
class MockGameStompClient {
    constructor() {
        this.subscriptions = new Map()      // topic -> Subscription (세션 종속)
        this.topicHandlers = new Map()      // topic -> handler (논리적 구독)
        this.isConnected = false
    }
    
    // Simulate subscribe method
    subscribe(topic, handler) {
        console.log('[DEBUG_LOG] Subscribing to topic:', topic)
        
        // 논리적 구독 보관
        if (!this.topicHandlers.has(topic)) {
            this.topicHandlers.set(topic, handler)
        }
        
        // 연결되어 있으면 즉시 물리적 구독
        if (this.isConnected) {
            const mockSubscription = { topic, unsubscribe: () => console.log('Unsubscribed from', topic) }
            this.subscriptions.set(topic, mockSubscription)
            return mockSubscription
        }
        
        return null
    }
    
    // Simulate connection
    connect() {
        console.log('[DEBUG_LOG] Connecting...')
        this.isConnected = true
        this.onConnect()
    }
    
    // Simulate onConnect callback
    onConnect() {
        console.log('[DEBUG_LOG] Connected - restoring subscriptions...')
        
        // 세션마다 재구독
        this.subscriptions.clear()
        this.topicHandlers.forEach((handler, topic) => {
            console.log('[DEBUG_LOG] Restoring subscription for topic:', topic)
            const mockSubscription = { topic, unsubscribe: () => console.log('Unsubscribed from', topic) }
            this.subscriptions.set(topic, mockSubscription)
        })
    }
    
    // Simulate disconnection
    disconnect() {
        console.log('[DEBUG_LOG] Disconnecting (intentional)...')
        this.isConnected = false
        this.subscriptions.clear()
        this.topicHandlers.clear()
    }
    
    // Simulate unexpected disconnection
    onDisconnect() {
        console.log('[DEBUG_LOG] Disconnected unexpectedly - preserving topic handlers...')
        this.isConnected = false
        this.subscriptions.clear() // Only clear subscriptions, keep topicHandlers
    }
}

// Test the functionality
const client = new MockGameStompClient()

console.log('\n=== Test 1: Subscribe while disconnected ===')
client.subscribe('/topic/test1', (data) => console.log('Handler 1:', data))
client.subscribe('/topic/test2', (data) => console.log('Handler 2:', data))

console.log('TopicHandlers size:', client.topicHandlers.size)
console.log('Subscriptions size:', client.subscriptions.size)

console.log('\n=== Test 2: Connect and restore subscriptions ===')
client.connect()

console.log('TopicHandlers size:', client.topicHandlers.size)
console.log('Subscriptions size:', client.subscriptions.size)

console.log('\n=== Test 3: Unexpected disconnection ===')
client.onDisconnect()

console.log('TopicHandlers size:', client.topicHandlers.size)
console.log('Subscriptions size:', client.subscriptions.size)

console.log('\n=== Test 4: Reconnect and restore ===')
client.connect()

console.log('TopicHandlers size:', client.topicHandlers.size)
console.log('Subscriptions size:', client.subscriptions.size)

console.log('\n=== Test 5: Intentional disconnect ===')
client.disconnect()

console.log('TopicHandlers size:', client.topicHandlers.size)
console.log('Subscriptions size:', client.subscriptions.size)

console.log('\n[DEBUG_LOG] Test completed! Both Maps should be empty after intentional disconnect.')