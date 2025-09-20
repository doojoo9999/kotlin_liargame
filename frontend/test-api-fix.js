// Test script to verify the game list API fix
// Run this in the browser console after the app loads

async function testGameListAPI() {
  console.log('🔍 Testing Game List API Fix...');
  
  try {
    // Test the raw backend response
    console.log('1️⃣ Testing raw backend response...');
    const rawResponse = await fetch('http://localhost:20021/api/v1/game/rooms?page=0&size=10', {
      credentials: 'include'
    });
    
    const rawData = await rawResponse.json();
    console.log('Raw backend response:', rawData);
    
    // Test our API client transformation
    console.log('2️⃣ Testing API client transformation...');
    
    // Import and test the game service (assuming it's available globally or through import)
    if (window.gameService) {
      const transformedResponse = await window.gameService.getGameList(0, 10);
      console.log('Transformed response:', transformedResponse);
      
      if (transformedResponse.games !== undefined) {
        console.log('✅ API transformation working correctly');
        console.log('📊 Game list:', transformedResponse.games);
      } else {
        console.log('❌ API transformation failed - games property not found');
      }
    } else {
      console.log('⚠️ gameService not available globally, checking store...');
      
      // Check if the store's fetchGameList works
      if (window.useGameStore && window.useGameStore.getState) {
        const store = window.useGameStore.getState();
        console.log('Store state:', store);
        await store.fetchGameList();
        console.log('After fetchGameList:', window.useGameStore.getState().gameList);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Also expose for manual testing
window.testGameListAPI = testGameListAPI;

// Auto-run after a delay
setTimeout(testGameListAPI, 1000);

console.log('🚀 Game API test script loaded. Run testGameListAPI() to test manually.');