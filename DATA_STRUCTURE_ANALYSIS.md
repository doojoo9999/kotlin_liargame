# Backend-Frontend Data Structure Analysis

## Current Inconsistencies

### GameRoom Data Structure

**Backend Current Structure (GameRoomListResponse.kt):**
```kotlin
data class GameRoomListResponse(
    val gameRooms: List<GameRoomInfo>
)

data class GameRoomInfo(
    val gameNumber: Int,
    val gameName: String,        // ❌ Frontend expects 'title'
    val hasPassword: Boolean,
    val playerCount: Int,        // ❌ Frontend expects 'currentPlayers'
    val maxPlayers: Int,
    val status: String           // ❌ Frontend expects 'state'
)
```

**Frontend Expected Structure (from gameApi.js):**
```typescript
{
  gameNumber: number
  title: string                // ❌ Backend sends 'gameName'
  host: string                 // ❌ Missing from backend
  currentPlayers: number       // ❌ Backend sends 'playerCount'
  maxPlayers: number
  hasPassword: boolean
  subject: string | null       // ❌ Missing from backend
  state: string               // ❌ Backend sends 'status'
  players: Player[]           // ❌ Missing from backend
}
```

**Available in GameEntity but not exposed:**
- `gOwner` (String) → can be mapped to `host`
- `citizenSubject`/`liarSubject` (SubjectEntity?) → can be mapped to `subject`
- Player information via PlayerRepository → can be mapped to `players`

### Subject Data Structure

**Frontend Expected Structure:**
```typescript
{
  id: number
  name: string
  words: Word[]
}
```

**Current Frontend Mapping Issues (gameApi.js lines 154-160):**
- Complex fallback logic: `name || subjectName || content || title`
- Inconsistent field naming

### Word Data Structure

**Frontend Expected Structure:**
```typescript
{
  id: number
  content: string
  subjectId: number
}
```

## Proposed Standardized Structures

### 1. GameRoom Response
```kotlin
data class GameRoomListResponse(
    val gameRooms: List<GameRoomInfo>
)

data class GameRoomInfo(
    val gameNumber: Int,
    val title: String,           // ✅ Renamed from gameName
    val host: String,            // ✅ Added from gOwner
    val currentPlayers: Int,     // ✅ Renamed from playerCount
    val maxPlayers: Int,
    val hasPassword: Boolean,
    val subject: String?,        // ✅ Added from citizenSubject
    val state: String,           // ✅ Renamed from status
    val players: List<PlayerInfo> // ✅ Added player list
)

data class PlayerInfo(
    val id: Long,
    val nickname: String,
    val isAlive: Boolean
)
```

### 2. Subject Response
```kotlin
data class SubjectResponse(
    val id: Long,
    val name: String,
    val words: List<WordResponse>
)
```

### 3. Word Response
```kotlin
data class WordResponse(
    val id: Long,
    val content: String,
    val subjectId: Long
)
```

## Implementation Plan

1. ✅ Update GameRoomListResponse.kt with new structure
2. ✅ Modify GameService.getAllGameRooms() to include missing data
3. ✅ Remove mapping functions from gameApi.js
4. ✅ Update GameContext.jsx to use direct responses
5. ✅ Add proper error handling and validation