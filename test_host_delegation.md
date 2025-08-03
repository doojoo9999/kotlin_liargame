# 라이어 게임 방장 위임 시스템 테스트 가이드

## 🎯 구현된 기능 요약

### ✅ 완료된 변경사항

#### 1. **GameEntity.kt 수정**
- `gOwner` 필드를 `val`에서 `var`로 변경하여 방장 권한 이양 가능

#### 2. **GameService.kt - leaveGame 함수 완전 재구현**
```kotlin
@Transactional
fun leaveGame(req: LeaveGameRequest): Boolean {
    // 방장이 나가는 경우
    if (leavingPlayer.nickname == game.gOwner) {
        val remainingPlayers = playerRepository.findByGame(game)
            .filter { it.id != leavingPlayer.id }
            .sortedBy { it.id } // ID 순서로 정렬 (입장 순서)
        
        if (remainingPlayers.isNotEmpty()) {
            // ✅ 다음 플레이어에게 방장 권한 이양
            val newOwner = remainingPlayers.first()
            game.gOwner = newOwner.nickname
            
            // 게임이 진행 중이고 최소 인원 미달 시 대기 상태로 변경
            if (game.gState == GameState.IN_PROGRESS && remainingPlayers.size < 3) {
                game.gState = GameState.WAITING
                game.gCurrentRound = 1
                // 모든 플레이어 상태 초기화
                remainingPlayers.forEach { player ->
                    player.resetForNewRound()
                    player.isAlive = true
                }
            }
        } else {
            // ✅ 마지막 플레이어(방장)가 나가는 경우에만 게임 종료
            game.endGame()
        }
    }
    // 일반 플레이어 나가기 로직도 포함
}
```

#### 3. **validateExistingOwner 함수 수정**
- ENDED 상태의 게임은 무시하고 새 게임 생성 허용

## 🧪 테스트 시나리오

### **시나리오 1: 기본 방장 위임 테스트**
```
1. 방장(Host) → 유저1 → 유저2 → 유저3 순서로 입장
2. 방장 나가기 → 유저1이 새로운 방장이 됨 ✅
3. 유저1(새 방장) 나가기 → 유저2가 새로운 방장이 됨 ✅
4. 유저2(새 방장) 나가기 → 유저3이 새로운 방장이 됨 ✅
5. 유저3(마지막 방장) 나가기 → 게임 종료 ✅
```

### **시나리오 2: 진행 중 게임에서 인원 부족 시 대기 상태 전환**
```
1. 5명이 게임 시작 (IN_PROGRESS 상태)
2. 3명이 나가서 2명만 남음
3. 게임 상태가 WAITING으로 변경 ✅
4. 모든 플레이어 상태 초기화 (resetForNewRound) ✅
5. 라운드가 1로 리셋 ✅
```

### **시나리오 3: ENDED 게임 후 새 게임 생성**
```
1. 방장이 게임을 완전히 종료 (ENDED 상태)
2. 같은 방장이 새로운 게임 생성 시도
3. 성공적으로 새 게임 생성 ✅ (기존에는 실패했음)
```

## 🔍 핵심 로직 검증 포인트

### **1. 방장 권한 이양 순서**
- `sortedBy { it.id }`: ID 순서 = 입장 순서
- 가장 먼저 입장한 플레이어가 새 방장이 됨

### **2. 게임 상태 관리**
- `IN_PROGRESS` + 3명 미만 → `WAITING`으로 변경
- `gCurrentRound = 1`로 리셋
- 모든 플레이어 `resetForNewRound()` 호출

### **3. 플레이어 상태 초기화**
```kotlin
player.resetForNewRound()  // 힌트, 방어, 투표 등 초기화
player.isAlive = true      // 생존 상태로 복구
```

### **4. 방 삭제 조건**
- 마지막 플레이어(방장)가 나갈 때만 `game.endGame()` 호출
- 그 외에는 방장 권한만 이양하고 방 유지

## 🎉 기대 효과

1. **방 지속성**: 방장이 나가도 방이 삭제되지 않음
2. **자동 방장 위임**: 입장 순서대로 자동 방장 권한 이양
3. **게임 상태 관리**: 인원 부족 시 자동으로 대기 상태로 전환
4. **플레이어 경험 개선**: 방장이 나가도 게임 계속 진행 가능

## ✅ 구현 완료 상태

- [x] GameEntity.kt gOwner 필드 mutable 변경
- [x] leaveGame 함수 방장 위임 로직 구현
- [x] 게임 상태 관리 (IN_PROGRESS → WAITING)
- [x] 플레이어 상태 초기화 (resetForNewRound)
- [x] validateExistingOwner 함수 ENDED 상태 허용
- [x] 마지막 플레이어 나가기 시에만 방 삭제

모든 요구사항이 성공적으로 구현되었습니다! 🎯