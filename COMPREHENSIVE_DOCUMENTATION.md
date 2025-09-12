# 라이어 게임 - 종합 운영 문서 (Single Source of Truth)

## 목차
1. [개요 및 배경](#1-개요-및-배경)
2. [데이터 스키마](#2-데이터-스키마)
3. [페이즈 및 이벤트 타임라인](#3-페이즈-및-이벤트-타임라인)
4. [득점 및 종료 규칙](#4-득점-및-종료-규칙)
5. [프론트엔드 UI/운영 가이드](#5-프론트엔드-ui운영-가이드)
6. [테스트 및 스모크 체크리스트](#6-테스트-및-스모크-체크리스트)
7. [트러블슈팅](#7-트러블슈팅)
8. [용어집 및 부록](#8-용어집-및-부록)

---

## 1. 개요 및 배경

### 1.1 프로젝트 목적
실시간 라이어 게임 웹 애플리케이션으로, 플레이어들이 주어진 주제에 대한 힌트를 제공하고 숨어있는 라이어를 찾아내는 소셜 추리 게임입니다.

### 1.2 핵심 아키텍처
- **백엔드**: Kotlin + Spring Boot + WebSocket(STOMP) + JPA
- **프론트엔드**: React 18 + Vite + React Query v5 + Zustand + WebSocket
- **실시간 통신**: HTTP REST API + WebSocket STOMP 프로토콜
- **상태 동기화**: 초기 복구(recover-state) + 실시간 업데이트(state 브로드캐스트)

---

## 2. 데이터 스키마

### 2.1 State 페이로드 (GameStateResponse)

#### 기본 구조
```typescript
interface GameStateResponse {
  gameNumber: number;
  gameName: string;
  gameOwner: string;
  gameParticipants: number;
  gameCurrentRound: number;
  gameTotalRounds: number;
  gameLiarCount: number;
  gameMode: "LIARS_KNOW" | "LIARS_DIFFERENT_WORD";
  gameState: "WAITING" | "IN_PROGRESS" | "ENDED" | "TERMINATED";
  players: PlayerResponse[];
  currentPhase: GamePhase;
  yourRole?: string;
  yourWord?: string;
  accusedPlayer?: PlayerResponse;
  isChatAvailable: boolean;
  citizenSubject?: string;
  liarSubject?: string;
  subjects?: string[];
  turnOrder?: string[];
  currentTurnIndex?: number;
  phaseEndTime?: string;                   // ISO 8601 타임스탬프
  winner?: string;
  reason?: string;
  targetPoints: number;                    // 목표 점수 (5-20, 기본값 10)
  scoreboard: ScoreboardEntry[];           // 실시간 점수판
  finalVotingRecord?: Map<string, any>[];  // 최종 투표 기록
}
```

#### GamePhase 열거형
```typescript
type GamePhase = 
  | "WAITING"           // 대기 중
  | "IN_PROGRESS"       // 게임 진행 중
  | "SPEECH"            // 발언 단계
  | "VOTING_FOR_LIAR"   // 라이어 지목 투표
  | "DEFENDING"         // 변론 단계
  | "VOTING_FOR_SURVIVAL" // 최종 투표 (생존/사망)
  | "GUESSING_WORD"     // 라이어의 주제 추측
  | "GAME_OVER";        // 게임 종료
```

### 2.2 Recover-State 페이로드 (GameRecoveryResponse)

```typescript
interface GameRecoveryResponse {
  gameNumber: number;
  gameState: string;
  scoreboard: ScoreboardEntry[];           // 필수 - 현재 점수판
  targetPoints: number;                    // 필수 - 목표 점수
  finalVotingRecord: FinalVoteResponse[];  // 필수 - 최종 투표 기록
  currentPhase: GamePhase;                 // 필수 - 현재 페이즈
  phaseEndTime?: string;                   // 옵션 - 페이즈 종료 시간
  accusedPlayerId?: number;                // 옵션 - 지목된 플레이어 ID
  accusedNickname?: string;                // 옵션 - 지목된 플레이어 닉네임
  currentAccusationTargetId?: number;
  gameCurrentRound: number;
  turnOrder?: string[];
  currentTurnIndex?: number;
  defenseReentryCount: number;             // 필수 - 변론 재입장 횟수
  recentSystemHeadline?: string;           // 옵션 - 최근 시스템 메시지
  defense: DefenseRecoveryResponse;        // 필수 - 변론 상태
  player: PlayerInfo;                      // 필수 - 플레이어 정보
  timestamp: string;                       // 필수 - 타임스탬프
}
```

#### 지원 스키마

**ScoreboardEntry**
```typescript
interface ScoreboardEntry {
  playerId: number;
  nickname: string;
  role: string;        // "CITIZEN" | "LIAR"
  isAlive: boolean;
  score: number;       // 누적 점수
}
```

**PlayerResponse**
```typescript
interface PlayerResponse {
  id: number;
  nickname: string;
  isAlive: boolean;
  state: string;       // "WAITING" | "ACTIVE" | "DEAD"
  hint?: string;
  defense?: string;
  votesReceived?: number;
  hasVoted: boolean;
}
```

**DefenseRecoveryResponse**
```typescript
interface DefenseRecoveryResponse {
  gameNumber: number;
  hasActiveDefense: boolean;
  hasActiveFinalVoting: boolean;
  accusedPlayerId?: number;
  accusedPlayerNickname?: string;
  defenseText?: string;
  isDefenseSubmitted: boolean;
  currentPhase?: GamePhase;
  phaseEndTime?: string;      // Instant 타입 (ISO-8601)
  finalVotingRecord?: Map<string, any>[];
  scoreboard?: ScoreboardEntry[];
  targetPoints?: number;
}
```

**PlayerInfo (GameRecoveryResponse 내부)**
```typescript
interface PlayerInfo {
  id: number;
  nickname: string;
  isAlive: boolean;
  role: string;        // "CITIZEN" | "LIAR" | "NONE"
}
```

### 2.3 에러 및 UNAUTHORIZED 포맷

#### 표준 에러 응답
```typescript
interface ErrorResponse {
  success: false;
  message: string;
  gameNumber?: number;
  timestamp: string;
}
```

#### UNAUTHORIZED 응답 (401)
```typescript
interface UnauthorizedResponse extends GameRecoveryResponse {
  gameState: "UNAUTHORIZED";
  scoreboard: [];
  finalVotingRecord: [];
  player: {
    id: 0;
    nickname: "Unknown";
    isAlive: false;
    role: "NONE";
  };
  // 기타 필드는 기본값으로 설정
}
```

---

## 3. 페이즈 및 이벤트 타임라인

### 3.1 페이즈 전환 시퀀스

```
WAITING → IN_PROGRESS → SPEECH → VOTING_FOR_LIAR → DEFENDING → VOTING_FOR_SURVIVAL 
                                                                        ↓
                                                    ┌─ 생존 ─→ VOTING_FOR_LIAR (회귀)
                                                    ├─ 동률 ─→ VOTING_FOR_LIAR (생존 간주)
                                                    └─ 사망 ─┬─ 라이어 ─→ GUESSING_WORD ─→ GAME_OVER
                                                            └─ 시민 ─→ GAME_OVER (라이어 승리)
```

### 3.2 DEFENDING 페이즈 상세 처리

#### 변론 권한 및 UI 제어
- **변론자 전용 버튼**: `accusedPlayerId === currentUserId`일 때만 "변론 종료" 버튼 노출
- **전원 채팅 허용**: DEFENDING 단계에서는 모든 플레이어가 채팅 가능
- **변론자 메시지 강조**: DEFENSE 타입 메시지에 시각적 강조 (빨간 테두리, 그림자, 볼드체)

#### 동시성 보장
- **멱등성 제어**: `isDefenseSubmitted` 플래그로 중복 실행 방지
- **즉시 전환**: `endDefense()` → `startFinalVoting()` 직접 호출
- **락 기반 처리**: `acquireFinalVotingProcessLock()`으로 동시성 제어

### 3.3 최종 투표 3-Branch 판정 규칙

```kotlin
fun calculateFinalVotingResult(executionVotes: Int, survivalVotes: Int, totalVotes: Int): Boolean {
    val majorityThreshold = totalVotes / 2
    return when {
        executionVotes > majorityThreshold -> true   // 처형
        executionVotes == survivalVotes -> false     // 동률 = 생존
        survivalVotes > majorityThreshold -> false   // 생존
        else -> executionVotes > survivalVotes
    }
}
```

#### 브랜치별 처리
1. **생존 (과반 또는 동률)**: 
   - `votingService.startVotingPhase()`로 VOTING_FOR_LIAR 회귀
   - 투표 기록 초기화 및 타이머 재설정

2. **사망 + 라이어**: 
   - GamePhase.GUESSING_WORD 전환
   - 라이어에게 주제 추측 기회 제공

3. **사망 + 시민**: 
   - `gameResultService.processGameResult()` 즉시 호출
   - 라이어 승리로 게임 종료

---

## 4. 득점 및 종료 규칙

### 4.1 득점 시스템

#### 라이어 득점 조건
- **라이어 생존**: +2점 (`awardLiarVictoryPoints()`)
  - 최종 투표에서 생존 시
  - 라이어 지목 투표에서 과반 득표하지 못한 경우
- **라이어 정답**: +2점
  - GUESSING_WORD 단계에서 주제 정답 시
  - 즉시 게임 종료 및 라이어 승리

#### 시민 득점 조건
- **시민 승리**: +1점 (`awardCitizenVictoryPoints()`)
  - 라이어를 성공적으로 처형한 경우
  - 최종 투표에서 사망표를 던진 시민들에게 부여
  - 라이어가 주제 추측을 실패한 경우

### 4.2 목표 점수 및 종료 규칙

#### targetPoints 규칙
- **기본값**: 10점
- **허용 범위**: 5-20점
- **설정 위치**: 방 생성 시 `CreateGameRoomRequest.targetPoints`

#### 즉시 종료 조건
```kotlin
fun awardPointsAndCheckWin(playerId: Long, points: Int, game: GameEntity): Boolean {
    // 점수 부여 후 목표점수 달성 확인
    if (updatedPlayer.cumulativeScore >= game.targetPoints) {
        endGameWithWinner(game, updatedPlayer, "목표 점수 달성")
        return true
    }
    return false
}
```

#### 종료 시점
1. **목표점수 달성**: 라이어 또는 시민이 targetPoints 달성 시 즉시 종료
2. **라이어 정답**: GUESSING_WORD에서 정답 시 라이어 승리로 즉시 종료
3. **라이어 오답**: GUESSING_WORD에서 오답 시 시민 승리로 즉시 종료
4. **시민 전멸**: 모든 시민이 사망 시 라이어 승리로 즉시 종료

### 4.3 득점 트랜잭션 보장
- **이중 지급 방지**: 게임 상태 확인 후 점수 부여
- **원자성**: `@Transactional`로 점수 부여와 승리 확인을 원자적으로 처리
- **락 기반**: 동시 득점 상황에서 락으로 순차 처리

---

## 5. 프론트엔드 UI/운영 가이드

### 5.1 상태 동기화 원칙

#### 초기화 패턴
```typescript
// 1. recover-state로 초기 상태 복구
const { data: recoveryData } = useQuery({
  queryKey: ['game', 'recovery', gameNumber],
  queryFn: () => gameApi.recoverGameState(gameNumber),
  staleTime: 0
});

// 2. state 구독으로 실시간 업데이트
useSocketEffect({
  topic: `/topic/game/${gameNumber}/state`,
  onMessage: (stateData) => {
    queryClient.setQueryData(['game', 'state', gameNumber], stateData);
  }
});
```

#### 낙관적 업데이트 금지
- **원칙**: 서버 응답 및 WebSocket 브로드캐스트만으로 상태 업데이트
- **이유**: 게임 상태의 권위성 보장 및 동시성 충돌 방지
- **예외**: UI 전용 상태 (다이얼로그 열림, 로딩 상태 등)

### 5.2 DEFENDING UI 가이드

#### 변론자 전용 컨트롤
```tsx
// 변론 종료 버튼 조건부 렌더링
{gameState.accusedPlayer?.id === currentUserId && (
  <Button
    onClick={handleEndDefense}
    aria-label="변론 종료"
    disabled={defenseEnding}
  >
    변론 종료
  </Button>
)}
```

#### 채팅 메시지 강조
```tsx
// DEFENSE 타입 메시지 스타일링
const messageStyle = message.type === 'DEFENSE' ? {
  border: '2px solid #ff4444',
  boxShadow: '0 2px 8px rgba(255, 68, 68, 0.3)',
  fontWeight: 'bold',
  backgroundColor: '#fff5f5'
} : defaultStyle;
```

### 5.3 3-Branch 라우팅 처리

#### 회귀 시 초기화
```typescript
// VOTING_FOR_LIAR 회귀 시 처리
useEffect(() => {
  if (gameState.currentPhase === 'VOTING_FOR_LIAR' && prevPhase === 'VOTING_FOR_SURVIVAL') {
    // 투표 기록 초기화
    setFinalVotingRecord([]);
    // 타이머 재설정
    resetPhaseTimer();
  }
}, [gameState.currentPhase]);
```

### 5.4 점수판 실시간 표시

#### scoreboard 및 targetPoints 표시
```tsx
<Scoreboard>
  {gameState.scoreboard.map(entry => (
    <ScoreEntry key={`scoreboard-${entry.playerId}`}>
      <PlayerName>{entry.nickname}</PlayerName>
      <Score>{entry.score}/{gameState.targetPoints}</Score>
      <Progress value={entry.score} max={gameState.targetPoints} />
    </ScoreEntry>
  ))}
</Scoreboard>
```

#### 재접속 시 초기 표시
- **recover-state 데이터**: 즉시 점수판 렌더링
- **프로그레스 바**: 목표점수 대비 현재 점수 시각화
- **승리 임박 알림**: targetPoints - 1일 때 하이라이트

---

## 6. 테스트 및 스모크 체크리스트

### 6.1 통합 스모크 시나리오

#### A. 기본 흐름 테스트
| 항목 | 기대 결과 | 검증 방법 |
|------|-----------|-----------|
| A1. 방 생성 | targetPoints 필드 지원 (5-20, 기본값 10) | CreateGameRoomRequest 검증 |
| A2. 변론자 전용 버튼 | accusedPlayerId === currentUserId 시에만 표시 | UI 조건부 렌더링 확인 |
| A3. 변론 종료 전환 | DEFENDING → VOTING_FOR_SURVIVAL 즉시 전환 | state 브로드캐스트 수신 확인 |

#### B. 최종 투표 3-Branch 테스트
| 항목 | 기대 결과 | 검증 방법 |
|------|-----------|-----------|
| B1. 생존 과반 | VOTING_FOR_LIAR 회귀, 투표 리셋 | 페이즈 전환 및 finalVotingRecord 초기화 |
| B2. 정확히 절반 | 생존 간주 (false 반환) | calculateFinalVotingResult 로직 |
| B3-1. 사망 + 라이어 | GUESSING_WORD 전환 | 페이즈 전환 및 타이머 설정 |
| B3-2. 사망 + 시민 | 즉시 라이어 승리 | gameResultService.processGameResult 호출 |

#### C. 득점/종료/목표점수 테스트
| 항목 | 기대 결과 | 검증 방법 |
|------|-----------|-----------|
| C1. 라이어 생존 | 라이어 +2점 | scoreboard 반영 확인 |
| C2. 라이어 정답 | 라이어 +2점, 즉시 종료 | 게임 상태 GAME_OVER 전환 |
| C3. 라이어 오답 | 시민 +1점, 시민 승리 | 사망표 투표 시민 점수 증가 |
| C4. 목표점수 달성 | 즉시 종료, 승리 공표 | awardPointsAndCheckWin 결과 |

#### D. 재접속/복구 테스트
| 항목 | 기대 결과 | 검증 방법 |
|------|-----------|-----------|
| D1. recover-state 엔드포인트 | 포괄적 상태 복구 | 모든 필수 필드 포함 확인 |
| D2. 필수 필드 | scoreboard, targetPoints, finalVotingRecord 등 | 스키마 일치성 검증 |
| D3. Defense 상태 복구 | defenseRecoveryResponse 통합 | 변론 상태 정확한 복구 |

### 6.2 회귀 위험 포인트

#### 필수 검증 항목
- [ ] 회귀 시 투표 기록 초기화 (`finalVotingRecord` 리셋)
- [ ] 변론 종료 버튼 중복 클릭 방지 (`isDefenseSubmitted` 체크)
- [ ] 득점 직후 종료 판정 (`awardPointsAndCheckWin` 호출)
- [ ] recover-state 페이로드 누락 필드 없음
- [ ] 타이머 정리 및 메모리 누수 방지 (`cleanupGameState`)

---

## 7. 트러블슈팅

### 7.1 재접속 후 상태 불일치

#### 증상
- 점수판이 표시되지 않음
- 현재 페이즈가 잘못 표시됨
- 변론 버튼이 표시되지 않음

#### 해결 방법
1. **recover-state 재적용**
   ```typescript
   // 강제 재복구
   queryClient.invalidateQueries(['game', 'recovery', gameNumber]);
   ```

2. **타임스탬프/페이즈 비교**
   ```typescript
   // 최신 상태 확인
   if (recoveryData.timestamp > currentStateTimestamp) {
     // 복구 데이터로 상태 갱신
   }
   ```

### 7.2 투표/타이머 경합 오류

#### 증상
- 투표 결과가 중복 처리됨
- 타이머가 중첩 실행됨
- 페이즈 전환이 실패함

#### 해결 방법
1. **멱등성 플래그 확인**
   ```bash
   # 백엔드 로그 확인
   grep "isDefenseSubmitted" application.log
   grep "acquireFinalVotingProcessLock" application.log
   ```

2. **락 상태 검증**
   - Redis 또는 메모리 락 상태 확인
   - 동시성 제어 로직 검증

### 7.3 점수 불일치

#### 증상
- 점수가 중복으로 지급됨
- 목표점수 달성했는데 게임이 계속됨
- scoreboard와 실제 점수가 다름

#### 해결 방법
1. **득점 트랜잭션 확인**
   ```kotlin
   // 이중 지급 방지 플래그 검증
   if (player.hasReceivedPointsThisRound) return
   ```

2. **목표점수 체크 로직**
   ```kotlin
   // 득점 직후 즉시 승리 확인
   awardPointsAndCheckWin(playerId, points, game)
   ```

---

## 8. 용어집 및 부록

### 8.1 페이즈/브랜치 용어

| 용어 | 의미 | 비고 |
|------|------|------|
| WAITING | 게임 대기 상태 | 플레이어 입장/퇴장 가능 |
| IN_PROGRESS | 게임 진행 중 | 일반적인 게임 진행 상태 |
| SPEECH | 발언 단계 | 턴 순서대로 힌트 제공 |
| VOTING_FOR_LIAR | 라이어 지목 투표 | 라이어로 의심되는 플레이어 투표 |
| DEFENDING | 변론 단계 | 지목된 플레이어의 변론 기회 |
| VOTING_FOR_SURVIVAL | 최종 투표 | 생존/사망 결정 투표 |
| GUESSING_WORD | 주제 추측 | 라이어의 주제 맞추기 기회 |
| GAME_OVER | 게임 종료 | 최종 결과 표시 |

### 8.2 득점 규칙 요약

| 상황 | 득점자 | 점수 | 조건 |
|------|--------|------|------|
| 라이어 생존 | 라이어 | +2 | 최종 투표에서 생존 |
| 라이어 정답 | 라이어 | +2 | 주제 추측 성공 |
| 라이어 처형 | 시민 | +1 | 사망표 투표한 시민들 |
| 라이어 오답 | 시민 | +1 | 주제 추측 실패 시 |

### 8.3 targetPoints 규칙

| 항목 | 값 | 설명 |
|------|----|----- |
| 기본값 | 10 | 방 생성 시 기본 목표점수 |
| 최소값 | 5 | 설정 가능한 최소 목표점수 |
| 최대값 | 20 | 설정 가능한 최대 목표점수 |
| 최소 인원 | 3 | 게임 시작 최소 플레이어 수 |

### 8.4 예시 페이로드

#### GameStateResponse 예시 (DEFENDING 페이즈)
```json
{
  "gameNumber": 1,
  "gameName": "Test Game",
  "gameOwner": "Player1",
  "gameParticipants": 4,
  "gameCurrentRound": 1,
  "gameTotalRounds": 3,
  "gameLiarCount": 1,
  "gameMode": "LIARS_KNOW",
  "gameState": "IN_PROGRESS",
  "players": [
    {
      "id": 1,
      "nickname": "Player1",
      "isAlive": true,
      "state": "ACTIVE",
      "hint": "큰 동물",
      "hasVoted": true
    },
    {
      "id": 2,
      "nickname": "Player2",
      "isAlive": true,
      "state": "ACTIVE",
      "defense": "저는 코끼리를 생각했습니다",
      "votesReceived": 2,
      "hasVoted": false
    }
  ],
  "currentPhase": "DEFENDING",
  "yourRole": "CITIZEN",
  "yourWord": "코끼리",
  "accusedPlayer": {
    "id": 2,
    "nickname": "Player2",
    "isAlive": true,
    "state": "ACTIVE"
  },
  "isChatAvailable": true,
  "citizenSubject": "동물",
  "turnOrder": ["Player1", "Player2", "Player3", "Player4"],
  "currentTurnIndex": 0,
  "phaseEndTime": "2025-08-30T17:10:00Z",
  "targetPoints": 10,
  "scoreboard": [
    {
      "playerId": 1,
      "nickname": "Player1",
      "role": "CITIZEN",
      "isAlive": true,
      "score": 2
    },
    {
      "playerId": 2,
      "nickname": "Player2",
      "role": "LIAR",
      "isAlive": true,
      "score": 4
    }
  ],
  "finalVotingRecord": [
    {"playerId": 1, "voteForExecution": false},
    {"playerId": 3, "voteForExecution": true}
  ]
}
```

#### GameRecoveryResponse 예시
```json
{
  "gameNumber": 1,
  "gameState": "IN_PROGRESS",
  "scoreboard": [
    {
      "playerId": 1,
      "nickname": "Player1",
      "role": "CITIZEN",
      "isAlive": true,
      "score": 2
    }
  ],
  "targetPoints": 10,
  "finalVotingRecord": [],
  "currentPhase": "DEFENDING",
  "phaseEndTime": "2025-08-30T17:10:00Z",
  "accusedPlayerId": 2,
  "accusedNickname": "Player2",
  "currentAccusationTargetId": 2,
  "gameCurrentRound": 1,
  "turnOrder": ["Player1", "Player2", "Player3", "Player4"],
  "currentTurnIndex": 0,
  "defenseReentryCount": 0,
  "recentSystemHeadline": null,
  "defense": {
    "gameNumber": 1,
    "hasActiveDefense": true,
    "hasActiveFinalVoting": false,
    "accusedPlayerId": 2,
    "accusedPlayerNickname": "Player2",
    "defenseText": "저는 코끼리를 생각했습니다",
    "isDefenseSubmitted": false,
    "currentPhase": "DEFENDING",
    "phaseEndTime": "2025-08-30T17:10:00Z",
    "finalVotingRecord": null,
    "scoreboard": null,
    "targetPoints": 10
  },
  "player": {
    "id": 1,
    "nickname": "Player1",
    "isAlive": true,
    "role": "CITIZEN"
  },
  "timestamp": "2025-08-30T17:06:00Z"
}
```

### 8.5 주요 API 엔드포인트 요약

#### 게임 상태 관련
- `GET /api/v1/game/{gameNumber}` - 현재 게임 상태 조회
- `GET /api/v1/game/recover-state/{gameNumber}` - 재접속 시 상태 복구
- `POST /api/v1/game/join` - 게임 참가
- `POST /api/v1/game/start` - 게임 시작

#### 게임 진행 관련
- `POST /api/v1/game/give-hint` - 힌트 제공
- `POST /api/v1/game/vote` - 라이어 지목 투표
- `POST /api/v1/game/final-vote` - 최종 투표
- `POST /api/v1/game/submit-defense` - 변론 제출
- `POST /api/v1/game/end-defense` - 변론 종료
- `POST /api/v1/game/submit-liar-guess` - 라이어 추측 제출

#### 에러 코드 정책
- **401 UNAUTHORIZED**: 인증되지 않은 사용자, 자동 로그아웃 처리
- **403 FORBIDDEN**: 권한 없음 (예: 변론자가 아닌데 변론 종료 시도)
- **400 BAD_REQUEST**: 검증 실패 (잘못된 게임 번호, 유효하지 않은 입력값)
- **404 NOT_FOUND**: 리소스 없음 (존재하지 않는 게임방)
- **409 CONFLICT**: 상태 충돌 (이미 시작된 게임, 중복 투표 등)

---

## 변경 이력

### Step 0-6 핵심 결정 사항 요약
- **Step 1-2**: 기본 게임 로직 및 WebSocket 통신 구현
- **Step 3**: DEFENDING 페이즈 및 변론 시스템 추가
- **Step 4**: 3-Branch 최종 투표 로직 구현 (생존/동률/사망 처리)
- **Step 5**: 득점 시스템 및 목표점수 기반 종료 로직 구현
- **Step 6**: 통합 스모크 테스트 및 안정성 검증 완료

### 현재 정책 (옵션 A)
- **state/recover-state 일관성**: scoreboard와 targetPoints 항상 포함
- **에러 메시지 톤**: 간결하고 일관된 사용자 친화적 메시지
- **동시성 제어**: 락 기반 멱등성 보장
- **실시간 동기화**: WebSocket 브로드캐스트 + setQueryData 패턴

---

## 배포 전 품질 가드

### 필수 체크리스트
- [ ] `npm run build` 무오류 통과
- [ ] `npm run lint` 무경고 통과  
- [ ] 주요 시나리오 A~D 스모크 테스트 PASS
- [ ] API 문서와 구현 필드/타입 일치성 검증
- [ ] 재접속 시나리오 정상 동작 확인
- [ ] 목표점수 달성 시 즉시 종료 확인