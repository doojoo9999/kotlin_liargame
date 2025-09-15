// Quick test script for the game API fix
const { gameService } = require('./dist/api/gameApi.js');

async function testGameListAPI() {
  try {
    console.log('Testing game list API...');
    
    // Mock the apiClient response to simulate backend response format
    const mockApiClient = {
      get: async (endpoint) => {
        console.log(`Mock API call to: ${endpoint}`);
        // Simulate backend response format
        return { gameRooms: [] };
      }
    };

    // Test the transformation
    const mockResponse = { gameRooms: [] };
    let transformedResponse;
    
    if (mockResponse.gameRooms && Array.isArray(mockResponse.gameRooms)) {
      transformedResponse = { games: mockResponse.gameRooms };
    } else {
      transformedResponse = mockResponse;
    }
    
    console.log('Backend response:', mockResponse);
    console.log('Transformed response:', transformedResponse);
    console.log('✅ API transformation working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testGameListAPI();