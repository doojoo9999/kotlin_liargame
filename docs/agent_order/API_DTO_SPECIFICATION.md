# Backend API DTO 정확한 명세서

## ⚠️ 중요: DTO 불일치 사항 발견

기존 개발 계획에서 백엔드 DTO 요구사항과 **중요한 불일치**가 발견되었습니다. 이를 정정합니다.

## 🔧 주요 DTO 불일치 사항

### 1. 게임 생성 API
```typescript
// ❌ 기존 추정 (잘못됨)
interface GameCreateRequest {
  gameName?: string;
  maxPlayers: number;
  // ...
}

// ✅ 백엔드 실제 요구사항
interface GameCreateRequest {
  gameParticipants: number;        // 참여자 수
  gameLiarCount: number;           // 라이어 수
  gameTotalRounds: number;         // 총 라운드 수
  gameMode: "LIARS_KNOW" | "LIARS_DIFFERENT_WORD";
  subjectIds: number[];            // 주제 ID 배열
  useRandomSubjects: boolean;      // 랜덤 주제 사용 여부
  randomSubjectCount: number;      // 랜덤 주제 개수
  targetPoints: number;            // 목표 점수 (1-50)
}

// Response: 게임방 번호 (number) - 객체가 아닌 숫자!
```

### 2. 투표 API 이중 구조
```typescript
// 🚨 기존 API (사용 가능하지만 권장하지 않음)
POST /api/v1/game/vote
{
  "gameNumber": 123,
  "targetPlayerId": 2
}

// ✅ 신규 API (권장)
POST /api/v1/game/cast-vote
{
  "gameNumber": 123,
  "targetUserId": 2      // ⚠️ targetPlayerId가 아닌 targetUserId!
}
```

### 3. 채팅 메시지 타입 변경
```typescript
// ❌ 기존 (더 이상 사용하지 않음)
type ChatMessageType = "NORMAL" | "HINT" | "DEFENSE" | "SYSTEM";

// ✅ 현재 백엔드 요구사항
type ChatMessageType = "HINT" | "DISCUSSION" | "DEFENSE" | "POST_ROUND" | "SYSTEM";
// NORMAL → DISCUSSION으로 변경됨!
```

## 📋 정확한 API DTO 명세

### 🔐 인증 API

#### 로그인
```typescript
POST /api/v1/auth/login
Request: {
  nickname: string;
  password: string;
}
Response: {
  success: boolean;
  userId?: number;
  nickname?: string;
}
```

#### 세션 갱신
```typescript
POST /api/v1/auth/refresh-session
Request: {} // 빈 body
Response: {
  success: boolean;
  userId?: number;
  nickname?: string;
  message?: string; // 실패 시
}
```

### 🎮 게임 API

#### 게임 생성
```typescript
POST /api/v1/game/create
Request: {
  gameParticipants: number;     // 6
  gameLiarCount: number;        // 1
  gameTotalRounds: number;      // 3
  gameMode: "LIARS_KNOW" | "LIARS_DIFFERENT_WORD";
  subjectIds: number[];         // [1, 2, 3]
  useRandomSubjects: boolean;   // true
  randomSubjectCount: number;   // 2
  targetPoints: number;         // 10 (1-50 범위)
}
Response: number // 게임방 번호 (객체가 아님!)
```

#### 게임 참여
```typescript
POST /api/v1/game/join
Request: {
  gameNumber: number; // 123
}
Response: {
  gameNumber: number;
  gameState: "WAITING" | "IN_PROGRESS" | "ENDED";
  currentPhase: GamePhase;
  players: Player[];
  gameMode: string;
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameCurrentRound: number;
}
```

#### 힌트 제공
```typescript
POST /api/v1/game/hint
Request: {
  gameNumber: number;
  hint: string;
}
Response: {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
  currentTurnIndex: number;
  currentPlayerId: number;
}
```

#### 투표 (신규 방식)
```typescript
POST /api/v1/game/cast-vote
Request: {
  gameNumber: number;
  targetUserId: number;  // ⚠️ targetPlayerId 아님!
}
Response: {
  gameNumber: number;
  voterUserId: number;
  targetUserId: number;
  isSuccessful: boolean;
  message: string;
}
```

#### 변론 제출
```typescript
POST /api/v1/game/submit-defense
Request: {
  gameNumber: number;
  defenseText: string;
}
Response: {
  gameNumber: number;
  playerId: number;
  playerNickname: string;
  defenseText: string;
  success: boolean;
}
```

#### 최종 투표
```typescript
POST /api/v1/game/vote/final
Request: {
  gameNumber: number;
  voteForExecution: boolean; // true: 처형, false: 생존
}
Response: {
  gameNumber: number;
  gameState: string;
  currentPhase: string;
}
```

#### 라이어 추측 (신규 방식)
```typescript
POST /api/v1/game/guess-word
Request: {
  gameNumber: number;
  guess: string;
}
Response: {
  gameNumber: number;
  guess: string;
  isCorrect: boolean;
  actualWord: string;
  success: boolean;
}
```

### 💬 채팅 API

#### 메시지 전송
```typescript
POST /api/v1/chat/send
Request: {
  gameNumber: number;
  content: string;
  type: "HINT" | "DISCUSSION" | "DEFENSE" | "POST_ROUND"; // NORMAL 없음!
}
Response: {
  id: number;
  gameNumber: number;
  playerNickname: string;
  content: string;
  timestamp: string;
  type: ChatMessageType;
}
```

#### 채팅 기록 조회
```typescript
POST /api/v1/chat/history // ⚠️ POST임!
Request: {
  gameNumber: number;
  page: number;
  size: number;
}
Response: {
  messages: ChatMessage[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
}
```

## 🔄 프론트엔드 수정 필요사항

### 1. API 클라이언트 타입 정의 수정
```typescript
// src/shared/api/types.ts
export interface GameCreateRequest {
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameMode: "LIARS_KNOW" | "LIARS_DIFFERENT_WORD";
  subjectIds: number[];
  useRandomSubjects: boolean;
  randomSubjectCount: number;
  targetPoints: number;
}

export type ChatMessageType = "HINT" | "DISCUSSION" | "DEFENSE" | "POST_ROUND" | "SYSTEM";
```

### 2. API 호출 함수 수정
```typescript
// src/shared/api/gameApi.ts
export const createGame = async (request: GameCreateRequest): Promise<number> => {
  const response = await fetch('/api/v1/game/create', {
    method: 'POST',
    body: JSON.stringify(request)
  });
  return response.json(); // 숫자 반환
};

export const castVote = async (gameNumber: number, targetUserId: number) => {
  return fetch('/api/v1/game/cast-vote', {
    method: 'POST',
    body: JSON.stringify({ gameNumber, targetUserId }) // targetUserId 사용!
  });
};
```

### 3. 채팅 타입 수정
```typescript
// 모든 "NORMAL" → "DISCUSSION" 변경 필요
const sendChatMessage = (content: string) => {
  chatApi.send({
    gameNumber,
    content,
    type: "DISCUSSION" // NORMAL이 아닌 DISCUSSION!
  });
};
```

## ⚡ 긴급 수정 계획

1. **1단계에서 즉시 수정**: API 타입 정의 파일 정확히 작성
2. **2단계에서 반영**: 컴포넌트에서 정확한 DTO 사용
3. **4단계에서 검증**: WebSocket 메시지 타입 정확성 확인

이 명세서를 기반으로 모든 개발 단계를 재검토해야 합니다!