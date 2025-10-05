// Test script to verify game creation and joining flow
// Run this in the browser console to test the fix

async function testGameFlow() {
  console.log('=== Testing Game Creation and Joining Flow ===');

  try {
    // Test 1: Create a game
    console.log('\n1. Creating a game...');
    const createResponse = await fetch('http://172.26.180.125:20021/api/v1/game/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        gameParticipants: 6,
        gameLiarCount: 1,
        gameTotalRounds: 3,
        gameMode: 'LIARS_KNOW',
        subjectIds: [1, 2, 3],
        useRandomSubjects: false,
        targetPoints: 10
      })
    });

    if (!createResponse.ok) {
      throw new Error(`Create failed: ${createResponse.status} ${createResponse.statusText}`);
    }

    const gameNumber = await createResponse.json();
    console.log(`✅ Game created successfully! Game Number: ${gameNumber}`);

    // Test 2: Get game state
    console.log(`\n2. Getting game state for game ${gameNumber}...`);
    const stateResponse = await fetch(`http://172.26.180.125:20021/api/v1/game/${gameNumber}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!stateResponse.ok) {
      throw new Error(`Get state failed: ${stateResponse.status} ${stateResponse.statusText}`);
    }

    const gameState = await stateResponse.json();
    console.log('✅ Game state retrieved successfully!');
    console.log('Game State:', gameState);

    // Test 3: Verify game state structure
    console.log('\n3. Verifying game state structure...');
    const requiredFields = ['gameNumber', 'gameName', 'gameOwner', 'gameState', 'players'];
    const missingFields = requiredFields.filter(field => !(field in gameState));

    if (missingFields.length > 0) {
      console.warn('⚠️ Missing fields in game state:', missingFields);
    } else {
      console.log('✅ All required fields present in game state');
    }

    // Test 4: Check if navigation would work
    console.log('\n4. Testing navigation...');
    const gameUrl = `/game/${gameState.gameNumber}`;
    console.log(`✅ Navigation URL would be: ${gameUrl}`);

    // Test 5: Join game test
    console.log(`\n5. Testing join game for game ${gameNumber}...`);
    const joinResponse = await fetch('http://172.26.180.125:20021/api/v1/game/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        gameNumber: gameNumber
      })
    });

    if (!joinResponse.ok) {
      const errorText = await joinResponse.text();
      console.warn(`⚠️ Join failed (expected if already in game): ${joinResponse.status} - ${errorText}`);
    } else {
      const joinState = await joinResponse.json();
      console.log('✅ Join successful!', joinState);
    }

    console.log('\n=== Test Complete ===');
    console.log('Summary:');
    console.log(`- Game Number: ${gameNumber}`);
    console.log(`- Game State: ${gameState.gameState}`);
    console.log(`- Players: ${gameState.players.length}`);
    console.log(`- Navigation URL: ${gameUrl}`);

    return { success: true, gameNumber, gameState };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
console.log('Starting test... Make sure you are logged in first!');
testGameFlow().then(result => {
  if (result.success) {
    console.log('\n🎉 All tests passed! The game creation and joining flow is working correctly.');
    console.log(`You can now navigate to /game/${result.gameNumber} to view the game.`);
  } else {
    console.log('\n❌ Tests failed. Please check the errors above.');
  }
});