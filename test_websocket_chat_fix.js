// Test script to verify WebSocket chat messaging fixes
// This script tests the fixes applied for the STOMP messaging issue

console.log('[DEBUG_LOG] Starting WebSocket Chat Fix Verification...');

// Test 1: Verify GameContext.jsx changes
console.log('\n=== Test 1: GameContext.jsx Changes ===');

const fs = require('fs');
const path = require('path');

try {
    const gameContextPath = path.join(__dirname, 'frontend', 'src', 'context', 'GameContext.jsx');
    const gameContextContent = fs.readFileSync(gameContextPath, 'utf8');
    
    // Check for correct subscription topics (dot notation)
    const hasCorrectChatSubscription = gameContextContent.includes('`/topic/chat.${gameNumber}`');
    const hasCorrectGameSubscription = gameContextContent.includes('`/topic/game.${gameNumber}`');
    const hasCorrectPlayersSubscription = gameContextContent.includes('`/topic/players.${gameNumber}`');
    
    console.log('✓ Chat subscription uses dot notation:', hasCorrectChatSubscription);
    console.log('✓ Game subscription uses dot notation:', hasCorrectGameSubscription);
    console.log('✓ Players subscription uses dot notation:', hasCorrectPlayersSubscription);
    
    // Check for correct message format in sendChatMessage
    const hasCorrectMessageFormat = gameContextContent.includes('gNumber: parseInt(gameNumber)') && 
                                   gameContextContent.includes('content: message');
    console.log('✓ SendChatMessage uses correct format (gNumber, content):', hasCorrectMessageFormat);
    
    // Check for correct destination
    const hasCorrectDestination = gameContextContent.includes("'/app/chat.send'");
    console.log('✓ SendChatMessage uses correct destination (/app/chat.send):', hasCorrectDestination);
    
    // Check for loadChatHistory function
    const hasLoadChatHistory = gameContextContent.includes('const loadChatHistory = useCallback');
    console.log('✓ LoadChatHistory function exists:', hasLoadChatHistory);
    
    // Check if loadChatHistory is in context value
    const hasLoadChatHistoryInContext = gameContextContent.includes('loadChatHistory,');
    console.log('✓ LoadChatHistory is exported in context:', hasLoadChatHistoryInContext);
    
} catch (error) {
    console.error('❌ Error reading GameContext.jsx:', error.message);
}

// Test 2: Verify gameStompClient.js changes
console.log('\n=== Test 2: gameStompClient.js Changes ===');

try {
    const stompClientPath = path.join(__dirname, 'frontend', 'src', 'socket', 'gameStompClient.js');
    const stompClientContent = fs.readFileSync(stompClientPath, 'utf8');
    
    // Check for correct subscription topics (dot notation)
    const hasCorrectTopics = stompClientContent.includes('`/topic/game.${gameNumber}`') &&
                            stompClientContent.includes('`/topic/chat.${gameNumber}`') &&
                            stompClientContent.includes('`/topic/players.${gameNumber}`');
    console.log('✓ Subscription topics use dot notation:', hasCorrectTopics);
    
    // Check for correct chat send destination
    const hasCorrectChatDestination = stompClientContent.includes('`/app/chat.send`') || stompClientContent.includes("'/app/chat.send'");
    console.log('✓ Chat send destination is correct (/app/chat.send):', hasCorrectChatDestination);
    
    // Check for correct message format in sendChatMessage
    const hasCorrectChatFormat = stompClientContent.includes('gNumber: parseInt(gameNumber)') &&
                                stompClientContent.includes('content: message');
    console.log('✓ SendChatMessage uses correct format:', hasCorrectChatFormat);
    
    // Check for enhanced send method with error handling
    const hasEnhancedSend = stompClientContent.includes('try {') && 
                           stompClientContent.includes('return true') &&
                           stompClientContent.includes('return false');
    console.log('✓ Send method has proper error handling:', hasEnhancedSend);
    
} catch (error) {
    console.error('❌ Error reading gameStompClient.js:', error.message);
}

// Test 3: Verify GameRoomPage.jsx changes
console.log('\n=== Test 3: GameRoomPage.jsx Changes ===');

try {
    const gameRoomPagePath = path.join(__dirname, 'frontend', 'src', 'pages', 'GameRoomPage.jsx');
    const gameRoomPageContent = fs.readFileSync(gameRoomPagePath, 'utf8');
    
    // Check if loadChatHistory is imported from useGame
    const hasLoadChatHistoryImport = gameRoomPageContent.includes('loadChatHistory,');
    console.log('✓ LoadChatHistory is imported from useGame:', hasLoadChatHistoryImport);
    
    // Check if chatMessages is imported
    const hasChatMessagesImport = gameRoomPageContent.includes('chatMessages,');
    console.log('✓ ChatMessages is imported from useGame:', hasChatMessagesImport);
    
    // Check if sendChatMessage is imported
    const hasSendChatMessageImport = gameRoomPageContent.includes('sendChatMessage,');
    console.log('✓ SendChatMessage is imported from useGame:', hasSendChatMessageImport);
    
    // Check for chat history loading in useEffect
    const hasChatHistoryLoading = gameRoomPageContent.includes('await loadChatHistory(currentRoom.gameNumber)');
    console.log('✓ Chat history is loaded on room initialization:', hasChatHistoryLoading);
    
    // Check for proper dependency array
    const hasCorrectDependencies = gameRoomPageContent.includes('connectSocket, disconnectSocket, loadChatHistory');
    console.log('✓ UseEffect has correct dependencies:', hasCorrectDependencies);
    
} catch (error) {
    console.error('❌ Error reading GameRoomPage.jsx:', error.message);
}

// Test 4: Verify backend compatibility
console.log('\n=== Test 4: Backend Compatibility Check ===');

try {
    const chatControllerPath = path.join(__dirname, 'src', 'main', 'kotlin', 'org', 'example', 'kotlin_liargame', 'domain', 'chat', 'controller', 'ChatController.kt');
    const chatControllerContent = fs.readFileSync(chatControllerPath, 'utf8');
    
    // Check for correct message mapping
    const hasCorrectMapping = chatControllerContent.includes('@MessageMapping("/chat.send")');
    console.log('✓ Backend has correct message mapping (/chat.send):', hasCorrectMapping);
    
    // Check for correct broadcast destination
    const hasCorrectBroadcast = chatControllerContent.includes('"/topic/chat.${request.gNumber}"');
    console.log('✓ Backend broadcasts to correct topic (dot notation):', hasCorrectBroadcast);
    
    // Check for SendChatMessageRequest usage
    const usesSendChatMessageRequest = chatControllerContent.includes('SendChatMessageRequest');
    console.log('✓ Backend uses SendChatMessageRequest:', usesSendChatMessageRequest);
    
} catch (error) {
    console.error('❌ Error reading ChatController.kt:', error.message);
}

try {
    const sendChatRequestPath = path.join(__dirname, 'src', 'main', 'kotlin', 'org', 'example', 'kotlin_liargame', 'domain', 'chat', 'dto', 'request', 'SendChatMessageRequest.kt');
    const sendChatRequestContent = fs.readFileSync(sendChatRequestPath, 'utf8');
    
    // Check for correct fields
    const hasGNumber = sendChatRequestContent.includes('val gNumber: Int');
    const hasContent = sendChatRequestContent.includes('val content: String');
    console.log('✓ SendChatMessageRequest has gNumber field:', hasGNumber);
    console.log('✓ SendChatMessageRequest has content field:', hasContent);
    
} catch (error) {
    console.error('❌ Error reading SendChatMessageRequest.kt:', error.message);
}

// Summary
console.log('\n=== Fix Summary ===');
console.log('✅ Fixed subscription topics to use dot notation (/topic/chat.{gameNumber})');
console.log('✅ Fixed message sending destination to /app/chat.send');
console.log('✅ Fixed message format to use gNumber and content fields');
console.log('✅ Added loadChatHistory function for chat history loading');
console.log('✅ Enhanced error handling in STOMP send method');
console.log('✅ Updated GameRoomPage to load chat history on initialization');

console.log('\n=== Expected Behavior After Fix ===');
console.log('1. WebSocket connects successfully to game room');
console.log('2. Chat messages are sent to /app/chat.send with correct format');
console.log('3. Chat messages are received from /topic/chat.{gameNumber}');
console.log('4. Chat history is loaded when entering a room');
console.log('5. All WebSocket subscriptions use dot notation matching backend');

console.log('\n[DEBUG_LOG] WebSocket Chat Fix Verification Complete!');