#!/usr/bin/env node

/**
 * Test script to verify chat connection fixes
 * This script checks that all the implemented fixes are in place
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Testing Chat Connection Fixes');
console.log('================================\n');

// Test 1: Check GameRoomPage.jsx useEffect dependency fix
console.log('📋 Test 1: GameRoomPage.jsx useEffect Dependencies');
try {
  const gameRoomPagePath = path.join(__dirname, 'frontend', 'src', 'pages', 'GameRoomPage.jsx');
  const gameRoomPageContent = fs.readFileSync(gameRoomPagePath, 'utf8');
  
  // Check if the dependency array was fixed
  const hasFixedDependencies = gameRoomPageContent.includes('}, [currentRoom?.gameNumber])');
  const hasOldDependencies = gameRoomPageContent.includes('[currentRoom, connectToRoom, disconnectSocket]');
  
  if (hasFixedDependencies && !hasOldDependencies) {
    console.log('✅ useEffect dependencies fixed - prevents multiple connection attempts');
  } else {
    console.log('❌ useEffect dependencies not properly fixed');
  }
} catch (error) {
  console.log('❌ Error checking GameRoomPage.jsx:', error.message);
}

// Test 2: Check apiClient.js duplicate interceptor removal
console.log('\n📋 Test 2: apiClient.js Duplicate Interceptor Removal');
try {
  const apiClientPath = path.join(__dirname, 'frontend', 'src', 'api', 'apiClient.js');
  const apiClientContent = fs.readFileSync(apiClientPath, 'utf8');
  
  // Count request interceptors
  const interceptorMatches = apiClientContent.match(/apiClient\.interceptors\.request\.use/g);
  const interceptorCount = interceptorMatches ? interceptorMatches.length : 0;
  
  if (interceptorCount === 1) {
    console.log('✅ Duplicate request interceptor removed - prevents duplicate processing');
  } else {
    console.log(`❌ Found ${interceptorCount} request interceptors, should be 1`);
  }
} catch (error) {
  console.log('❌ Error checking apiClient.js:', error.message);
}

// Test 3: Check gameStompClient.js connection management improvements
console.log('\n📋 Test 3: gameStompClient.js Connection Management');
try {
  const stompClientPath = path.join(__dirname, 'frontend', 'src', 'socket', 'gameStompClient.js');
  const stompClientContent = fs.readFileSync(stompClientPath, 'utf8');
  
  const hasConnectionState = stompClientContent.includes('this.isConnecting = false');
  const hasConnectionPromise = stompClientContent.includes('this.connectionPromise = null');
  const hasConnectionCheck = stompClientContent.includes('if (this.isConnected && this.client && this.client.connected)');
  const hasConnectingCheck = stompClientContent.includes('if (this.isConnecting && this.connectionPromise)');
  const hasReconnectCheck = stompClientContent.includes('if (this.isConnected || this.isConnecting)');
  
  const improvements = [
    { name: 'Connection state tracking', check: hasConnectionState },
    { name: 'Connection promise management', check: hasConnectionPromise },
    { name: 'Already connected check', check: hasConnectionCheck },
    { name: 'Already connecting check', check: hasConnectingCheck },
    { name: 'Reconnect state check', check: hasReconnectCheck }
  ];
  
  const passedCount = improvements.filter(imp => imp.check).length;
  
  if (passedCount === improvements.length) {
    console.log('✅ All connection management improvements implemented');
  } else {
    console.log(`❌ Only ${passedCount}/${improvements.length} connection improvements found`);
    improvements.forEach(imp => {
      console.log(`   ${imp.check ? '✅' : '❌'} ${imp.name}`);
    });
  }
} catch (error) {
  console.log('❌ Error checking gameStompClient.js:', error.message);
}

// Test 4: Check GameContext.jsx loadChatHistory loading state
console.log('\n📋 Test 4: GameContext.jsx loadChatHistory Loading State');
try {
  const gameContextPath = path.join(__dirname, 'frontend', 'src', 'context', 'GameContext.jsx');
  const gameContextContent = fs.readFileSync(gameContextPath, 'utf8');
  
  const hasChatHistoryLoading = gameContextContent.includes('chatHistory: false');
  const hasLoadingCheck = gameContextContent.includes('if (state.loading.chatHistory)');
  const hasLoadingSet = gameContextContent.includes("setLoading('chatHistory', true)");
  const hasLoadingReset = gameContextContent.includes("setLoading('chatHistory', false)");
  
  const loadingFeatures = [
    { name: 'chatHistory loading flag in state', check: hasChatHistoryLoading },
    { name: 'Loading check to prevent duplicates', check: hasLoadingCheck },
    { name: 'Loading flag set before API call', check: hasLoadingSet },
    { name: 'Loading flag reset in finally block', check: hasLoadingReset }
  ];
  
  const passedLoadingCount = loadingFeatures.filter(feat => feat.check).length;
  
  if (passedLoadingCount === loadingFeatures.length) {
    console.log('✅ All loading state improvements implemented');
  } else {
    console.log(`❌ Only ${passedLoadingCount}/${loadingFeatures.length} loading improvements found`);
    loadingFeatures.forEach(feat => {
      console.log(`   ${feat.check ? '✅' : '❌'} ${feat.name}`);
    });
  }
} catch (error) {
  console.log('❌ Error checking GameContext.jsx:', error.message);
}

// Summary
console.log('\n🎯 Fix Summary');
console.log('==============');
console.log('The following fixes have been implemented to resolve ERR_INSUFFICIENT_RESOURCES:');
console.log('');
console.log('1. 🔧 GameRoomPage.jsx - Fixed useEffect dependencies');
console.log('   - Changed from [currentRoom, connectToRoom, disconnectSocket]');
console.log('   - To [currentRoom?.gameNumber]');
console.log('   - Prevents multiple connection attempts on function reference changes');
console.log('');
console.log('2. 🔧 apiClient.js - Removed duplicate request interceptor');
console.log('   - Eliminated duplicate token processing');
console.log('   - Reduces request overhead and potential conflicts');
console.log('');
console.log('3. 🔧 gameStompClient.js - Enhanced connection management');
console.log('   - Added connection state tracking (isConnecting, connectionPromise)');
console.log('   - Prevents multiple concurrent connection attempts');
console.log('   - Improved cleanup and error handling');
console.log('   - Enhanced reconnection logic with state checks');
console.log('');
console.log('4. 🔧 GameContext.jsx - Added loadChatHistory loading state');
console.log('   - Prevents multiple simultaneous API calls');
console.log('   - Uses loading flag to skip duplicate requests');
console.log('   - Proper cleanup with finally block');
console.log('');
console.log('These fixes should resolve the ERR_INSUFFICIENT_RESOURCES error by:');
console.log('- Preventing multiple concurrent WebSocket connections');
console.log('- Eliminating duplicate HTTP requests');
console.log('- Improving connection state management');
console.log('- Adding proper loading state checks');