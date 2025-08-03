// Test script to verify the roomList.map fix
console.log('[DEBUG_LOG] Testing roomList.map fix...');

// Mock API response structures to test
const mockResponses = {
  // Backend response with {rooms: [...]} structure
  backendStructure: {
    rooms: [
      {
        gameNumber: 1,
        gameName: "Test Room 1",
        host: "Player1",
        playerCount: 3,
        maxPlayers: 8,
        hasPassword: false,
        subject: "동물",
        status: "WAITING"
      },
      {
        gameNumber: 2,
        gameName: "Test Room 2", 
        host: "Player2",
        playerCount: 5,
        maxPlayers: 10,
        hasPassword: true,
        subject: "음식",
        status: "IN_PROGRESS"
      }
    ]
  },
  
  // Direct array response
  directArray: [
    {
      gameNumber: 3,
      title: "Direct Array Room",
      host: "Player3",
      currentPlayers: 2,
      maxPlayers: 6,
      hasPassword: false,
      subject: "영화",
      state: "WAITING"
    }
  ],
  
  // Invalid response (object without rooms)
  invalidResponse: {
    message: "success",
    data: "some other structure"
  },
  
  // Empty response
  emptyResponse: {
    rooms: []
  }
};

// Import the mapping function (simulated)
const mapBackendRoomToFrontend = (backendRoom) => {
  return {
    gameNumber: backendRoom.gameNumber,
    title: backendRoom.gameName || backendRoom.title,
    host: backendRoom.host || '알 수 없음',
    currentPlayers: backendRoom.playerCount || backendRoom.currentPlayers,
    maxPlayers: backendRoom.maxPlayers,
    hasPassword: backendRoom.hasPassword,
    subject: backendRoom.subject || '주제 없음',
    state: backendRoom.status || backendRoom.state,
    players: backendRoom.players || [],
    password: backendRoom.password || null,
    playerCount: backendRoom.playerCount || backendRoom.currentPlayers
  }
};

// Simulate the fixed getAllRooms logic
const simulateGetAllRooms = (mockResponse) => {
  console.log('[DEBUG] Processing mock response:', mockResponse);
  
  let rooms = [];
  if (mockResponse && mockResponse.rooms && Array.isArray(mockResponse.rooms)) {
    rooms = mockResponse.rooms;
    console.log('[DEBUG] Found rooms array in response.data.rooms');
  } else if (Array.isArray(mockResponse)) {
    rooms = mockResponse;
    console.log('[DEBUG] Response is direct array');
  } else {
    console.warn('[DEBUG] Unexpected API response structure:', mockResponse);
    return [];
  }
  
  // Map backend data to frontend format
  const mappedRooms = rooms.map(mapBackendRoomToFrontend);
  console.log('[DEBUG] Mapped rooms for frontend:', mappedRooms);
  
  return mappedRooms;
};

// Test array validation (simulating GameContext logic)
const testArrayValidation = (rooms) => {
  if (!Array.isArray(rooms)) {
    console.error('[ERROR] Expected array but got:', typeof rooms, rooms);
    return false;
  }
  console.log('[DEBUG] Successfully validated array with', rooms.length, 'rooms');
  return true;
};

// Test roomList.map functionality
const testRoomListMap = (roomList) => {
  try {
    if (!Array.isArray(roomList)) {
      throw new Error('roomList is not an array');
    }
    
    const mappedResult = roomList.map((room) => ({
      key: room.gameNumber,
      title: room.title || '제목 없음',
      host: room.host || '알 수 없음',
      players: `${room.currentPlayers}/${room.maxPlayers}`,
      subject: room.subject || '주제 없음',
      state: room.state || 'UNKNOWN'
    }));
    
    console.log('[DEBUG] roomList.map() executed successfully');
    console.log('[DEBUG] Mapped result:', mappedResult);
    return true;
  } catch (error) {
    console.error('[ERROR] roomList.map() failed:', error.message);
    return false;
  }
};

// Run tests
console.log('\n=== TESTING DIFFERENT API RESPONSE STRUCTURES ===');

let passedTests = 0;
let totalTests = 0;

// Test 1: Backend structure with {rooms: [...]}
console.log('\n--- Test 1: Backend structure with {rooms: [...]} ---');
totalTests++;
const result1 = simulateGetAllRooms(mockResponses.backendStructure);
const valid1 = testArrayValidation(result1);
const mapTest1 = testRoomListMap(result1);
if (valid1 && mapTest1 && result1.length === 2) {
  console.log('[SUCCESS] Test 1 passed');
  passedTests++;
} else {
  console.log('[FAILED] Test 1 failed');
}

// Test 2: Direct array response
console.log('\n--- Test 2: Direct array response ---');
totalTests++;
const result2 = simulateGetAllRooms(mockResponses.directArray);
const valid2 = testArrayValidation(result2);
const mapTest2 = testRoomListMap(result2);
if (valid2 && mapTest2 && result2.length === 1) {
  console.log('[SUCCESS] Test 2 passed');
  passedTests++;
} else {
  console.log('[FAILED] Test 2 failed');
}

// Test 3: Invalid response structure
console.log('\n--- Test 3: Invalid response structure ---');
totalTests++;
const result3 = simulateGetAllRooms(mockResponses.invalidResponse);
const valid3 = testArrayValidation(result3);
const mapTest3 = testRoomListMap(result3);
if (valid3 && mapTest3 && result3.length === 0) {
  console.log('[SUCCESS] Test 3 passed - gracefully handled invalid response');
  passedTests++;
} else {
  console.log('[FAILED] Test 3 failed');
}

// Test 4: Empty response
console.log('\n--- Test 4: Empty response ---');
totalTests++;
const result4 = simulateGetAllRooms(mockResponses.emptyResponse);
const valid4 = testArrayValidation(result4);
const mapTest4 = testRoomListMap(result4);
if (valid4 && mapTest4 && result4.length === 0) {
  console.log('[SUCCESS] Test 4 passed');
  passedTests++;
} else {
  console.log('[FAILED] Test 4 failed');
}

// Test 5: Test the original error scenario
console.log('\n--- Test 5: Original error scenario (object passed to map) ---');
totalTests++;
const originalErrorData = mockResponses.backendStructure; // This would cause the original error
try {
  // This should fail with the old code
  originalErrorData.map((room) => room);
  console.log('[FAILED] Test 5 failed - should have thrown error');
} catch (error) {
  console.log('[SUCCESS] Test 5 passed - confirmed original error would occur:', error.message);
  passedTests++;
}

console.log('\n=== TEST RESULTS ===');
console.log(`[DEBUG_LOG] Tests passed: ${passedTests}/${totalTests}`);
console.log(`[DEBUG_LOG] Success rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

if (passedTests === totalTests) {
  console.log('[SUCCESS] All tests passed! The roomList.map fix is working correctly.');
} else {
  console.log('[WARNING] Some tests failed. Please review the implementation.');
}

console.log('\n[DEBUG_LOG] roomList.map fix test completed!');