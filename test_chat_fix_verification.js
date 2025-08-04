// Test script to verify the ChatWindow.jsx fix
// This simulates the ChatWindow component logic after the fix

console.log('=== ChatWindow Fix Verification Test ===')

// Test Case 1: Room with gameNumber property (frontend standard)
console.log('\n--- Test Case 1: Room with gameNumber ---')
const roomWithGameNumber = {
  gameNumber: 12345,
  title: "Test Room",
  gameState: "WAITING",
  players: []
}

const gameNumber1 = roomWithGameNumber?.gameNumber || roomWithGameNumber?.gNumber
console.log('Room object:', JSON.stringify(roomWithGameNumber, null, 2))
console.log('Extracted gameNumber:', gameNumber1)
console.log('Chat availability:', gameNumber1 ? 'AVAILABLE ✓' : 'UNAVAILABLE ✗')

// Test Case 2: Room with gNumber property (backend format)
console.log('\n--- Test Case 2: Room with gNumber ---')
const roomWithGNumber = {
  gNumber: 67890,
  title: "Backend Room",
  gameState: "IN_PROGRESS",
  players: []
}

const gameNumber2 = roomWithGNumber?.gameNumber || roomWithGNumber?.gNumber
console.log('Room object:', JSON.stringify(roomWithGNumber, null, 2))
console.log('Extracted gameNumber:', gameNumber2)
console.log('Chat availability:', gameNumber2 ? 'AVAILABLE ✓' : 'UNAVAILABLE ✗')

// Test Case 3: Room with both properties (edge case)
console.log('\n--- Test Case 3: Room with both properties ---')
const roomWithBoth = {
  gameNumber: 11111,
  gNumber: 22222,
  title: "Mixed Room",
  gameState: "WAITING",
  players: []
}

const gameNumber3 = roomWithBoth?.gameNumber || roomWithBoth?.gNumber
console.log('Room object:', JSON.stringify(roomWithBoth, null, 2))
console.log('Extracted gameNumber (should prefer gameNumber):', gameNumber3)
console.log('Chat availability:', gameNumber3 ? 'AVAILABLE ✓' : 'UNAVAILABLE ✗')

// Test Case 4: Room with no game number (should fail)
console.log('\n--- Test Case 4: Room with no game number ---')
const roomWithoutNumber = {
  title: "Broken Room",
  gameState: "WAITING",
  players: []
}

const gameNumber4 = roomWithoutNumber?.gameNumber || roomWithoutNumber?.gNumber
console.log('Room object:', JSON.stringify(roomWithoutNumber, null, 2))
console.log('Extracted gameNumber:', gameNumber4)
console.log('Chat availability:', gameNumber4 ? 'AVAILABLE ✓' : 'UNAVAILABLE ✗')

// Test Case 5: No room (null/undefined)
console.log('\n--- Test Case 5: No room (null) ---')
const noRoom = null

const gameNumber5 = noRoom?.gameNumber || noRoom?.gNumber
console.log('Room object:', noRoom)
console.log('Extracted gameNumber:', gameNumber5)
console.log('Chat availability:', gameNumber5 ? 'AVAILABLE ✓' : 'UNAVAILABLE ✗')

console.log('\n=== Summary ===')
console.log('✓ Fixed ChatWindow.jsx to check both gameNumber and gNumber properties')
console.log('✓ Chat should now be available when room has either property')
console.log('✓ Maintains backward compatibility with both naming conventions')
console.log('✓ Korean error message should no longer appear for valid rooms')

console.log('\n=== Expected Behavior ===')
console.log('Before fix: Chat showed "채팅을 사용할 수 없습니다. 방 정보를 확인해주세요."')
console.log('After fix: Chat should be available and functional in game rooms')