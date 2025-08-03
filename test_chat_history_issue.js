const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:20021/api/v1';
const GAME_NUMBER = 2; // Using gNumber=2 as mentioned in the issue

async function testChatHistoryIssue() {
    console.log('=== Chat History Issue Reproduction Test ===\n');
    
    try {
        // Step 1: Test direct API call to get chat history
        console.log('Step 1: Testing direct API call to get chat history...');
        const historyResponse = await axios.get(`${BASE_URL}/chat/history`, {
            params: {
                gNumber: GAME_NUMBER,
                limit: 50
            }
        });
        
        console.log(`✅ API Response Status: ${historyResponse.status}`);
        console.log(`📊 Chat History Data:`, historyResponse.data);
        console.log(`📈 Number of messages: ${Array.isArray(historyResponse.data) ? historyResponse.data.length : 'Not an array'}\n`);
        
        // Step 2: Check if the game exists
        console.log('Step 2: Checking if game exists...');
        try {
            const gameResponse = await axios.get(`${BASE_URL}/game/${GAME_NUMBER}`);
            console.log(`✅ Game exists - Status: ${gameResponse.status}`);
            console.log(`🎮 Game State: ${gameResponse.data.gState}`);
            console.log(`👥 Players: ${gameResponse.data.players ? gameResponse.data.players.length : 0}\n`);
        } catch (gameError) {
            console.log(`❌ Game not found - Status: ${gameError.response?.status}`);
            console.log(`💡 This might be why chat history is empty\n`);
        }
        
        // Step 3: Test sending a message via REST API (to verify database storage)
        console.log('Step 3: Testing message sending via REST API...');
        try {
            const testMessage = {
                gNumber: GAME_NUMBER,
                content: `Test message from reproduction script - ${new Date().toISOString()}`
            };
            
            const sendResponse = await axios.post(`${BASE_URL}/chat/send`, testMessage);
            console.log(`✅ Message sent via REST API - Status: ${sendResponse.status}`);
            console.log(`📝 Sent message response:`, sendResponse.data);
            
            // Step 4: Immediately check if the message appears in history
            console.log('\nStep 4: Checking if sent message appears in history...');
            const updatedHistoryResponse = await axios.get(`${BASE_URL}/chat/history`, {
                params: {
                    gNumber: GAME_NUMBER,
                    limit: 50
                }
            });
            
            console.log(`📊 Updated Chat History:`, updatedHistoryResponse.data);
            console.log(`📈 Number of messages after sending: ${Array.isArray(updatedHistoryResponse.data) ? updatedHistoryResponse.data.length : 'Not an array'}`);
            
        } catch (sendError) {
            console.log(`❌ Failed to send message via REST API - Status: ${sendError.response?.status}`);
            console.log(`🔍 Error details:`, sendError.response?.data || sendError.message);
        }
        
    } catch (error) {
        console.log(`❌ Failed to get chat history - Status: ${error.response?.status}`);
        console.log(`🔍 Error details:`, error.response?.data || error.message);
    }
    
    console.log('\n=== Test Complete ===');
}

// Additional function to test with different game numbers
async function testMultipleGames() {
    console.log('\n=== Testing Multiple Game Numbers ===\n');
    
    const gameNumbers = [1, 2, 3, 4, 5];
    
    for (const gNumber of gameNumbers) {
        try {
            console.log(`Testing game ${gNumber}...`);
            const response = await axios.get(`${BASE_URL}/chat/history`, {
                params: { gNumber, limit: 10 }
            });
            
            console.log(`  Game ${gNumber}: ${response.data.length} messages`);
            
        } catch (error) {
            console.log(`  Game ${gNumber}: Error - ${error.response?.status || error.message}`);
        }
    }
}

// Run the tests
async function runAllTests() {
    await testChatHistoryIssue();
    await testMultipleGames();
}

runAllTests().catch(console.error);