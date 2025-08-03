// Test script to verify the API response structure fix
console.log('🧪 Testing API response structure fix...')

// Mock the API response structure that backend actually sends
const mockBackendResponse = {
  data: {
    gameRooms: [
      {
        gameNumber: 1,
        gameName: "테스트 방",
        host: "TestHost",
        playerCount: 3,
        maxPlayers: 8,
        hasPassword: false,
        gSubject: "동물",
        gState: "WAITING"
      }
    ]
  }
}

// Mock the old response structure for compatibility test
const mockOldResponse = {
  data: {
    rooms: [
      {
        gameNumber: 2,
        title: "호환성 테스트 방",
        host: "OldHost",
        currentPlayers: 2,
        maxPlayers: 6,
        hasPassword: true,
        subject: "음식",
        state: "WAITING"
      }
    ]
  }
}

// Test the mapping function
const mapBackendRoomToFrontend = (backendRoom) => {
  console.log('[DEBUG] Mapping backend room:', backendRoom)
  
  // 백엔드 필드명 → 프론트엔드 필드명 매핑
  return {
    gameNumber: backendRoom.gameNumber || backendRoom.gNumber,
    title: backendRoom.gameName || backendRoom.gName || backendRoom.title || '제목 없음',
    host: backendRoom.host || backendRoom.hostName || '알 수 없음',
    currentPlayers: backendRoom.playerCount || backendRoom.currentPlayers || 0,
    maxPlayers: backendRoom.maxPlayers || backendRoom.gParticipants || 8,
    hasPassword: backendRoom.hasPassword || backendRoom.isPasswordProtected || false,
    subject: backendRoom.subject || backendRoom.gSubject || '주제 없음',
    state: backendRoom.status || backendRoom.gState || backendRoom.state || 'WAITING',
    // 프론트엔드 추가 필드
    players: backendRoom.players || [],
    password: null,
    playerCount: backendRoom.playerCount || backendRoom.currentPlayers || 0 // LobbyPage에서 사용하는 필드
  }
}

// Test the response handling logic
const testResponseHandling = (response, testName) => {
  console.log(`\n=== ${testName} ===`)
  console.log('Input response.data:', response.data)
  
  let rooms = []

  // ✅ 백엔드 실제 응답 구조에 맞게 수정
  if (response.data && response.data.gameRooms && Array.isArray(response.data.gameRooms)) {
    rooms = response.data.gameRooms  // ✅ "gameRooms" 키 사용
    console.log('[DEBUG] Found gameRooms:', rooms.length, 'rooms')
  } else if (response.data && response.data.rooms && Array.isArray(response.data.rooms)) {
    rooms = response.data.rooms      // ✅ 기존 "rooms" 키도 지원 (호환성)
    console.log('[DEBUG] Found rooms:', rooms.length, 'rooms')
  } else if (Array.isArray(response.data)) {
    rooms = response.data
    console.log('[DEBUG] Response data is direct array:', rooms.length, 'rooms')
  } else {
    console.warn('[DEBUG] Unexpected API response structure:', response.data)
    console.warn('[DEBUG] Available keys:', Object.keys(response.data || {}))
    return []
  }
  
  // ✅ 백엔드 데이터를 프론트엔드 형식으로 변환
  const mappedRooms = rooms.map(mapBackendRoomToFrontend)
  console.log('[DEBUG] Mapped rooms for frontend:', mappedRooms)
  
  return mappedRooms
}

// Run tests
console.log('🔍 Testing new gameRooms key handling...')
const result1 = testResponseHandling(mockBackendResponse, 'New gameRooms Response Test')

console.log('\n🔍 Testing backward compatibility with rooms key...')
const result2 = testResponseHandling(mockOldResponse, 'Backward Compatibility Test')

// Verify results
console.log('\n📊 Test Results Summary:')
console.log('✅ gameRooms test result:', result1.length > 0 ? 'PASS' : 'FAIL')
console.log('✅ rooms compatibility test result:', result2.length > 0 ? 'PASS' : 'FAIL')

if (result1.length > 0) {
  console.log('✅ Successfully extracted room from gameRooms key')
  console.log('   - Title:', result1[0].title)
  console.log('   - Host:', result1[0].host)
  console.log('   - Subject:', result1[0].subject)
}

if (result2.length > 0) {
  console.log('✅ Successfully maintained backward compatibility with rooms key')
  console.log('   - Title:', result2[0].title)
  console.log('   - Host:', result2[0].host)
  console.log('   - Subject:', result2[0].subject)
}

console.log('\n🎉 API response structure fix test completed!')