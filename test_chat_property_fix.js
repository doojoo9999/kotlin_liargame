// Test script to reproduce and fix the chat property issue
// The issue: ChatWindow.jsx is looking for currentRoom?.gNumber but the room object has gameNumber

console.log('=== Chat Property Issue Test ===')

// Simulate the room object structure as it appears in the frontend
const mockCurrentRoom = {
  gameNumber: 12345,  // This is what the frontend uses
  title: "Test Room",
  gameState: "WAITING",
  players: []
}

// Simulate what ChatWindow.jsx is currently doing (BROKEN)
const gameNumberBroken = mockCurrentRoom?.gNumber
console.log('Current broken approach - gameNumber from gNumber:', gameNumberBroken) // undefined

// Simulate what it should be doing (FIXED)
const gameNumberFixed = mockCurrentRoom?.gameNumber
console.log('Fixed approach - gameNumber from gameNumber:', gameNumberFixed) // 12345

// Test both properties for compatibility
const gameNumberCompatible = mockCurrentRoom?.gameNumber || mockCurrentRoom?.gNumber
console.log('Compatible approach - try both properties:', gameNumberCompatible) // 12345

console.log('\n=== Test Results ===')
console.log('Broken approach result:', gameNumberBroken ? 'WORKS' : 'FAILS - Chat unavailable')
console.log('Fixed approach result:', gameNumberFixed ? 'WORKS' : 'FAILS - Chat unavailable')
console.log('Compatible approach result:', gameNumberCompatible ? 'WORKS' : 'FAILS - Chat unavailable')

console.log('\n=== Recommended Fix ===')
console.log('Change in ChatWindow.jsx line 17:')
console.log('FROM: const gameNumber = currentRoom?.gNumber')
console.log('TO:   const gameNumber = currentRoom?.gameNumber || currentRoom?.gNumber')
console.log('This ensures compatibility with both property names.')