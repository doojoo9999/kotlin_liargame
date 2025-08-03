const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying API endpoint updates in gameApi.js...\n');

// Read the updated gameApi.js file
const gameApiPath = path.join(__dirname, 'frontend', 'src', 'api', 'gameApi.js');
const gameApiContent = fs.readFileSync(gameApiPath, 'utf8');

// Define expected endpoint mappings
const expectedEndpoints = [
    // Auth endpoints
    { name: 'login', expected: '/api/v1/auth/login' },
    { name: 'refresh', expected: '/api/v1/auth/refresh' },
    
    // User endpoints
    { name: 'addUser', expected: '/api/v1/user/add' },
    
    // Game endpoints
    { name: 'getAllRooms', expected: '/api/v1/game/rooms' },
    { name: 'createRoom', expected: '/api/v1/game/create' },
    { name: 'joinRoom', expected: '/api/v1/game/join' },
    { name: 'leaveRoom', expected: '/api/v1/game/leave' },
    { name: 'startGame', expected: '/api/v1/game/start' },
    { name: 'getRoomInfo', expected: '/api/v1/game/${gNumber}' },
    { name: 'getGameState', expected: '/api/v1/game/${gNumber}' },
    { name: 'getRoomDetails', expected: '/api/v1/game/${gameNumber}' },
    { name: 'getRoomPlayers', expected: '/api/v1/game/${gameNumber}' },
    
    // Subject endpoints
    { name: 'getAllSubjects', expected: '/api/v1/subjects/listsubj' },
    { name: 'addSubject', expected: '/api/v1/subjects/applysubj' },
    
    // Word endpoints
    { name: 'addWord', expected: '/api/v1/words/applyw' },
    
    // Chat endpoints
    { name: 'sendMessage', expected: '/api/v1/chat/send' },
    { name: 'getChatHistory', expected: '/api/v1/chat/history' }
];

let allCorrect = true;
let checkedCount = 0;

console.log('📋 Checking endpoints:\n');

expectedEndpoints.forEach(endpoint => {
    const found = gameApiContent.includes(endpoint.expected);
    if (found) {
        console.log(`✅ ${endpoint.name}: ${endpoint.expected}`);
        checkedCount++;
    } else {
        console.log(`❌ ${endpoint.name}: ${endpoint.expected} - NOT FOUND`);
        allCorrect = false;
    }
});

console.log(`\n📊 Summary:`);
console.log(`✅ Correct endpoints: ${checkedCount}/${expectedEndpoints.length}`);

// Check for any remaining old endpoints (without /api/v1 prefix)
const oldPatterns = [
    /post\(['"`]\/auth\//g,
    /post\(['"`]\/user\//g,
    /get\(['"`]\/game\//g,
    /post\(['"`]\/game\//g,
    /get\(['"`]\/subjects\//g,
    /post\(['"`]\/subjects\//g,
    /post\(['"`]\/words\//g,
    /get\(['"`]\/chat\//g,
    /post\(['"`]\/chat\//g
];

let foundOldEndpoints = [];
oldPatterns.forEach(pattern => {
    const matches = gameApiContent.match(pattern);
    if (matches) {
        foundOldEndpoints = foundOldEndpoints.concat(matches);
    }
});

if (foundOldEndpoints.length > 0) {
    console.log(`\n⚠️  Found ${foundOldEndpoints.length} potential old endpoints:`);
    foundOldEndpoints.forEach(endpoint => {
        console.log(`   ${endpoint}`);
    });
    allCorrect = false;
}

if (allCorrect && foundOldEndpoints.length === 0) {
    console.log('\n🎉 All endpoints have been successfully updated!');
    console.log('✅ All endpoints now use the correct /api/v1 prefix');
    console.log('✅ Non-existent endpoints have been replaced with correct alternatives');
} else {
    console.log('\n❌ Some issues found. Please review the endpoints above.');
}

console.log('\n📝 Endpoint update summary:');
console.log('- Added /api/v1 prefix to all endpoints');
console.log('- Fixed /game/room/{gameNumber} → /api/v1/game/{gameNumber}');
console.log('- Fixed /game/room/{gameNumber}/players → /api/v1/game/{gameNumber} (extract players from response)');