# 백엔드 API 및 Service 로직 상세 문서

## 목차
1. [개요](#개요)
2. [인증 시스템 (Auth)](#인증-시스템-auth)
3. [게임 시스템 (Game)](#게임-시스템-game)
4. [채팅 시스템 (Chat)](#채팅-시스템-chat)
5. [주제/단어 시스템 (Subject/Word)](#주제단어-시스템-subjectword)
6. [사용자 관리 (User)](#사용자-관리-user)
7. [관리자 시스템 (Admin)](#관리자-시스템-admin)
8. [비속어 관리 (Profanity)](#비속어-관리-profanity)
9. [WebSocket 통신](#websocket-통신)
10. [데이터 플로우 및 상태 관리](#데이터-플로우-및-상태-관리)

---

## 개요

### 프로젝트 구조
```
kotlin_liargame/
├── domain/
│   ├── auth/          # 인증 및 로그인
│   ├── game/          # 게임 핵심 로직
│   ├── chat/          # 채팅 시스템
│   ├── subject/       # 주제 관리
│   ├── word/          # 단어 관리
│   ├── user/          # 사용자 관리
│   └── profanity/     # 비속어 관리
├── global/            # 전역 설정 및 유틸리티
└── tools/             # WebSocket, Swagger 등
```

### 핵심 개념
- **라이어 게임**: 플레이어들이 주제에 대한 힌트를 말하고, 라이어를 찾아내는 게임
- **게임 모드**: 
  - `LIARS_KNOW`: 라이어가 자신이 라이어임을 아는 모드
  - `LIARS_DIFFERENT_WORD`: 라이어가 다른 주제의 단어를 받는 모드
- **게임 단계**: 대기 → 힌트 제공 → 투표 → 변론 → 최종 투표 → 결과

---

## 인증 시스템 (Auth)

### API 엔드포인트

#### 1. 로그인
```http
POST /api/v1/auth/login
```

**Request Body:**
```json
{
  "nickname": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "success": true,
  "userId": 1,
  "nickname": "playerName"
}
```

**Service 로직:**
1. `UserService.authenticate()` 호출
2. 사용자 인증 확인
3. 세션에 `userId`와 `nickname` 저장
4. 성공 응답 반환

**상태 변화:**
- 세션에 사용자 정보 저장
- 클라이언트는 로그인 상태로 전환

#### 2. 로그아웃
```http
POST /api/v1/auth/logout
```

**Response:**
```json
{
  "success": true
}
```

**Service 로직:**
1. 현재 세션 무효화
2. 성공 응답 반환

**상태 변화:**
- 세션 정보 삭제
- 사용자 로그아웃 상태로 전환

#### 3. 세션 갱신
```http
POST /api/v1/auth/refresh-session
```

**Response (성공):**
```json
{
  "success": true,
  "userId": 1,
  "nickname": "playerName"
}
```

**Response (실패):**
```json
{
  "success": false,
  "message": "세션이 유효하지 않습니다."
}
```

**Service 로직:**
1. 세션에서 `userId`와 `nickname` 확인
2. 유효하면 사용자 정보 반환
3. 무효하면 오류 메시지 반환

---

## 게임 시스템 (Game)

### 게임 상태 및 단계

#### 게임 상태 (GameState)
- `WAITING`: 플레이어 대기 중
- `IN_PROGRESS`: 게임 진행 중
- `ENDED`: 게임 종료

#### 게임 단계 (GamePhase)
- `WAITING_FOR_PLAYERS`: 플레이어 대기
- `SPEECH`: 힌트 제공 단계
- `VOTING_FOR_LIAR`: 라이어 투표 단계
- `DEFENDING`: 변론 단계
- `VOTING_FOR_SURVIVAL`: 최종 투표 단계
- `GUESSING_WORD`: 단어 추측 단계
- `GAME_OVER`: 게임 종료

#### 플레이어 상태 (PlayerState)
- `WAITING_FOR_HINT`: 힌트 대기
- `GAVE_HINT`: 힌트 제공 완료
- `WAITING_FOR_VOTE`: 투표 대기
- `VOTED`: 투표 완료
- `ACCUSED`: 지목당함
- `DEFENDED`: 변론 완료
- `WAITING_FOR_FINAL_VOTE`: 최종 투표 대기
- `FINAL_VOTED`: 최종 투표 완료
- `SURVIVED` : 라이어 생존
- `ELIMINATED`: 시민 사망
- `DISCONNECTED`: 연결 끊김

### API 엔드포인트

#### 1. 게임방 생성
```http
POST /api/v1/game/create
```

**Request Body:**
```json
{
  "gameParticipants": 6,
  "gameLiarCount": 1,
  "gameTotalRounds": 3,
  "gameMode": "LIARS_KNOW",
  "subjectIds": [1, 2, 3],
  "useRandomSubjects": true,
  "randomSubjectCount": 2
}
```

**Response:**
```json
게임방 번호 (int)
```

**Service 로직:**
1. 사용자 인증 확인
2. 기존 게임방 참여 여부 확인
3. 사용 가능한 방 번호 생성 (1-999)
4. 주제 선택 및 할당
5. 게임 엔티티 생성 및 저장
6. 게임방 번호 반환

**상태 변화:**
- 새 게임 엔티티 생성 (상태: WAITING)
- 방장으로 설정
- 선택된 주제들이 게임에 할당

#### 2. 게임 참여
```http
POST /api/v1/game/join
```

**Request Body:**
```json
{
  "gameNumber": 123
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "WAITING",
  "currentPhase": "WAITING_FOR_PLAYERS",
  "players": [...],
  "gameMode": "LIARS_KNOW",
  "gameParticipants": 6,
  "gameLiarCount": 1,
  "gameTotalRounds": 3,
  "gameCurrentRound": 0
}
```

**Service 로직:**
1. 게임방 존재 여부 확인
2. 게임 상태가 WAITING인지 확인
3. 인원 제한 확인
4. 중복 참여 확인
5. 플레이어 엔티티 생성
6. WebSocket 세션 등록
7. 다른 플레이어들에게 참여 알림
8. 게임 상태 반환

**상태 변화:**
- 새 플레이어 엔티티 생성
- 게임 참여자 수 증가
- WebSocket 그룹에 플레이어 추가

#### 3. 게임 시작
```http
POST /api/v1/game/start
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "currentPhase": "SPEECH",
  "players": [...],
  "turnOrder": ["player1", "player2"],
  "currentTurnIndex": 0,
  "currentPlayerId": 1
}
```

**Service 로직:**
1. 방장 권한 확인
2. 플레이어 수 확인 (최소/최대 인원)
3. 주제 및 단어 선택
4. 역할 할당 (시민/라이어)
5. 턴 순서 무작위 설정
6. 게임 상태를 IN_PROGRESS로 변경
7. 첫 번째 턴 시작
8. 사회자 메시지 전송

**상태 변화:**
- 게임 상태: WAITING → IN_PROGRESS
- 플레이어들에게 역할 및 단어 할당
- 턴 시스템 활성화
- 타이머 시작

#### 4. 힌트 제공
```http
POST /api/v1/game/hint
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "hint": "네 다리가 있어요"
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "currentPhase": "SPEECH",
  "currentTurnIndex": 1,
  "currentPlayerId": 2
}
```

**Service 로직:**
1. 플레이어 인증 확인
2. 현재 턴인지 확인
3. 플레이어 상태를 GAVE_HINT로 변경
4. 턴 인덱스 증가
5. 다음 플레이어로 턴 이동
6. 모든 플레이어가 힌트를 제공했으면 투표 단계로 전환

**상태 변화:**
- 플레이어 상태: WAITING_FOR_HINT → GAVE_HINT
- 턴 인덱스 증가
- 모든 힌트 완료 시 VOTING_FOR_LIAR 단계로 전환

#### 5. 라이어 투표
```http
POST /api/v1/game/vote
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "targetPlayerId": 2
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "currentPhase": "VOTING_FOR_LIAR"
}
```

**Service 로직:**
1. 투표 권한 확인
2. 대상 플레이어 유효성 확인
3. 투표 기록 및 카운트 증가
4. 플레이어 상태를 VOTED로 변경
5. 모든 투표 완료 시 결과 처리
6. 최다 득표자가 1명이면 변론 단계로 전환
7. 동점이면 힌트 단계 재시작

**상태 변화:**
- 플레이어 상태: WAITING_FOR_VOTE → VOTED
- 투표 카운트 증가
- 최다 득표자 변론 단계로 전환 또는 재투표

#### 6. 변론 제출
```http
POST /api/v1/game/submit-defense
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "defenseText": "저는 라이어가 아닙니다. 제가 말한 힌트는..."
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "playerId": 2,
  "playerNickname": "player2",
  "defenseText": "저는 라이어가 아닙니다...",
  "success": true
}
```

**Service 로직:**
1. 지목된 플레이어인지 확인
2. 변론 시간 내인지 확인
3. 이미 변론했는지 확인
4. Redis에 변론 내용 저장
5. 다른 플레이어들에게 변론 내용 브로드캐스트
6. 최종 투표 단계 스케줄링

**상태 변화:**
- 지목된 플레이어 상태: ACCUSED → DEFENDED
- Redis에 변론 상태 저장
- 최종 투표 단계로 전환

#### 7. 최종 투표 (처형/생존)
```http
POST /api/v1/game/vote/final
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "voteForExecution": true
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "currentPhase": "VOTING_FOR_SURVIVAL"
}
```

**Service 로직:**
1. 최종 투표 권한 확인
2. 투표 내용 Redis에 저장
3. 모든 투표 완료 시 결과 계산
4. 과반수에 따라 처형/생존 결정
5. 게임 종료 조건 확인
6. 라이어 추측 단계 또는 게임 종료

**상태 변화:**
- 플레이어 상태: WAITING_FOR_FINAL_VOTE → FINAL_VOTED
- 처형 결정에 따른 게임 진행
- 게임 종료 또는 라이어 추측 단계로 전환

#### 8. 라이어 단어 추측
```http
POST /api/v1/game/submit-liar-guess
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "guess": "강아지"
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "guess": "강아지",
  "isCorrect": true,
  "actualWord": "강아지",
  "success": true
}
```

**Service 로직:**
1. 라이어 권한 확인
2. 추측 단어와 실제 단어 비교
3. 정답 여부에 따른 게임 결과 결정
4. 게임 종료 처리
5. 최종 결과 브로드캐스트

**상태 변화:**
- 게임 상태: IN_PROGRESS → ENDED
- 승리 팀 결정 (라이어 승리 or 시민 승리)
- 게임 결과 저장

### 게임 상태 조회

#### 게임 상태 조회
```http
GET /api/v1/game/{gameNumber}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "currentPhase": "SPEECH",
  "players": [
    {
      "id": 1,
      "nickname": "player1",
      "isAlive": true,
      "role": "CITIZEN",
      "state": "GAVE_HINT",
      "isCurrentTurn": false,
      "assignedWord": "강아지"
    }
  ],
  "gameMode": "LIARS_KNOW",
  "gameParticipants": 6,
  "gameLiarCount": 1,
  "gameTotalRounds": 3,
  "gameCurrentRound": 1,
  "turnOrder": ["player1", "player2"],
  "currentTurnIndex": 1,
  "currentPlayerId": 2,
  "phaseEndTime": "2025-08-27T17:30:00Z",
  "isChatAvailable": true
}
```

### 게임방 목록 조회

#### 활성 게임방 목록
```http
GET /api/v1/game/rooms
```

**Response:**
```json
{
  "gameRooms": [
    {
      "gameNumber": 123,
      "gameOwner": "player1",
      "gameState": "WAITING",
      "gameParticipants": 6,
      "currentPlayerCount": 3,
      "gameLiarCount": 1,
      "gameTotalRounds": 3,
      "gameMode": "LIARS_KNOW",
      "createdAt": "2025-08-27T17:00:00Z",
      "subjects": ["동물", "과일"]
    }
  ]
}
```

---

## 채팅 시스템 (Chat)

### API 엔드포인트

#### 1. 채팅 메시지 전송
```http
POST /api/v1/chat/send
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "content": "안녕하세요!",
  "type": "NORMAL"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": 1,
  "content": "안녕하세요!",
  "senderNickname": "player1",
  "timestamp": "2025-08-27T17:30:00Z",
  "type": "NORMAL"
}
```

**Service 로직:**
1. 채팅 권한 확인 (게임 단계별 제한)
2. 비속어 필터링
3. 메시지 DB 저장
4. WebSocket으로 브로드캐스트
5. 메시지 응답 반환

**상태 변화:**
- 새 채팅 메시지 DB 저장
- 게임 참여자들에게 실시간 메시지 전송

#### 2. 채팅 기록 조회
```http
POST /api/v1/chat/history
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "page": 0,
  "size": 50
}
```

**Response:**
```json
{
  "messages": [
    {
      "id": 1,
      "content": "안녕하세요!",
      "senderNickname": "player1",
      "timestamp": "2025-08-27T17:30:00Z",
      "type": "NORMAL"
    }
  ],
  "totalElements": 25,
  "totalPages": 1,
  "currentPage": 0
}
```

### 채팅 제한 규칙

**단계별 채팅 가능 여부:**
- `WAITING_FOR_PLAYERS`: 자유 채팅
- `SPEECH`: 현재 턴 플레이어만 채팅 가능
- `VOTING_FOR_LIAR`: 투표 중 채팅 금지
- `DEFENDING`: 지목된 플레이어만 채팅 가능
- `VOTING_FOR_SURVIVAL`: 투표 중 채팅 금지
- `GUESSING_WORD`: 라이어만 채팅 가능
- `GAME_OVER`: 자유 채팅

---

## 주제/단어 시스템 (Subject/Word)

### 주제 관리

#### 1. 주제 목록 조회
```http
GET /api/v1/subjects
```

**Response:**
```json
{
  "subjects": [
    {
      "id": 1,
      "content": "동물",
      "status": "APPROVED",
      "wordCount": 15,
      "words": ["강아지", "고양이", "토끼"]
    }
  ]
}
```

#### 2. 주제 제안
```http
POST /api/v1/subjects
```

**Request Body:**
```json
{
  "content": "과일"
}
```

### 단어 관리

#### 1. 단어 목록 조회
```http
GET /api/v1/words?subjectId=1
```

**Response:**
```json
{
  "words": [
    {
      "id": 1,
      "content": "강아지",
      "subjectId": 1,
      "subjectContent": "동물",
      "status": "APPROVED"
    }
  ]
}
```

#### 2. 단어 제안
```http
POST /api/v1/words
```

**Request Body:**
```json
{
  "content": "햄스터",
  "subjectId": 1
}
```

---

## 사용자 관리 (User)

### API 엔드포인트

#### 1. 사용자 등록
```http
POST /api/v1/users
```

**Request Body:**
```json
{
  "nickname": "newUser",
  "password": "password123"
}
```

#### 2. 사용자 통계 조회
```http
GET /api/v1/users/stats
```

**Response:**
```json
{
  "totalGames": 10,
  "winRate": 65.0,
  "totalPlayTime": 7200,
  "favoriteRole": "CITIZEN"
}
```

---

## 관리자 시스템 (Admin)

### API 엔드포인트

#### 1. 관리자 로그인
```http
POST /api/v1/admin/login
```

**Request Body:**
```json
{
  "adminKey": "admin123"
}
```

#### 2. 게임 통계 조회
```http
GET /api/v1/admin/stats
```

**Response:**
```json
{
  "totalGames": 500,
  "activeGames": 12,
  "totalUsers": 1000,
  "pendingSubjects": 5,
  "pendingWords": 15
}
```

#### 3. 플레이어 강퇴
```http
POST /api/v1/admin/kick-player
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "playerId": 2,
  "reason": "부적절한 행동"
}
```

---

## 비속어 관리 (Profanity)

### API 엔드포인트

#### 1. 비속어 제안
```http
POST /api/v1/profanity/suggest
```

**Request Body:**
```json
{
  "content": "부적절한단어"
}
```

**Response:**
```json
{
  "success": true,
  "message": "비속어 제안이 접수되었습니다."
}
```

**Service 로직:**
1. 중복 제안 확인
2. 비속어 제안 엔티티 생성
3. 관리자 승인 대기 상태로 저장
4. 성공 응답 반환

---

## 추가 게임 API 엔드포인트

### 게임 방 관리

#### 1. 게임 나가기
```http
POST /api/v1/game/leave
```

**Request Body:**
```json
{
  "gameNumber": 123
}
```

**Response:**
```json
true
```

**Service 로직:**
1. 플레이어 인증 확인
2. 게임에서 플레이어 제거
3. WebSocket 세션 해제
4. 방장인 경우 권한 이양
5. 빈 방인 경우 게임 삭제
6. 다른 플레이어들에게 퇴장 알림

#### 2. 게임 결과 조회
```http
GET /api/v1/game/result/{gameNumber}
```

**Response:**
```json
{
  "gameNumber": 123,
  "winningTeam": "CITIZENS",
  "players": [
    {
      "id": 1,
      "nickname": "player1",
      "role": "CITIZEN",
      "isAlive": true,
      "isWinner": true
    }
  ],
  "gameStatistics": {
    "totalRounds": 3,
    "currentRound": 3,
    "totalDuration": 1800,
    "averageRoundDuration": 600
  }
}
```

#### 3. 방장 권한 연장
```http
POST /api/v1/game/{gameNumber}/extend-time
```

**Response:**
```json
{
  "success": true,
  "message": "게임 시작 시간이 5분 연장되었습니다.",
  "extendedUntil": "2025-08-27T18:00:00Z"
}
```

#### 4. 방장 강퇴 및 권한 이양
```http
POST /api/v1/game/{gameNumber}/kick-owner
```

**Response:**
```json
{
  "success": true,
  "message": "방장이 강퇴되고 권한이 이양되었습니다.",
  "newOwner": "player2",
  "kickedPlayer": "player1"
}
```

### 게임 상태 복구

#### 게임 상태 복구
```http
GET /api/v1/game/recover-state/{gameNumber}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameState": "IN_PROGRESS",
  "defense": {
    "hasActiveDefense": true,
    "hasActiveFinalVoting": false,
    "accusedPlayerId": 2,
    "defenseText": "저는 라이어가 아닙니다...",
    "isDefenseSubmitted": true
  },
  "player": {
    "id": 1,
    "nickname": "player1",
    "isAlive": true,
    "role": "CITIZEN"
  },
  "timestamp": "2025-08-27T17:30:00Z"
}
```

---

## 실시간 통신 상세

### WebSocket 연결 관리

#### 연결 설정
```javascript
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

stompClient.connect({}, function(frame) {
    console.log('Connected: ' + frame);
    
    // 게임 상태 구독
    stompClient.subscribe(`/topic/game/${gameNumber}/state`, function(message) {
        const gameState = JSON.parse(message.body);
        handleGameStateUpdate(gameState);
    });
    
    // 채팅 메시지 구독
    stompClient.subscribe(`/topic/game/${gameNumber}/chat`, function(message) {
        const chatMessage = JSON.parse(message.body);
        handleChatMessage(chatMessage);
    });
});
```

### WebSocket 메시지 유형

#### 플레이어 투표 알림
```json
{
  "type": "PLAYER_VOTED",
  "gameNumber": 123,
  "voterPlayerId": 1,
  "targetPlayerId": 2,
  "voterNickname": "player1",
  "targetNickname": "player2",
  "remainingVotes": 3,
  "timestamp": "2025-08-27T17:30:00Z"
}
```

#### 변론 시작 알림
```json
{
  "type": "DEFENSE_START",
  "gameNumber": 123,
  "accusedPlayerId": 2,
  "accusedPlayerNickname": "player2",
  "defenseTimeLimit": 120,
  "timestamp": "2025-08-27T17:30:00Z"
}
```

#### 최종 투표 결과
```json
{
  "type": "FINAL_VOTING_RESULT",
  "gameNumber": 123,
  "accusedPlayerId": 2,
  "accusedPlayerNickname": "player2",
  "executionVotes": 4,
  "survivalVotes": 2,
  "totalVotes": 6,
  "isExecuted": true,
  "defenseText": "저는 라이어가 아닙니다..."
}
```

#### 게임 종료 알림
```json
{
  "type": "GAME_END",
  "gameNumber": 123,
  "winningTeam": "CITIZENS",
  "gameStatistics": {
    "totalRounds": 3,
    "totalDuration": 1800
  },
  "finalResults": [
    {
      "playerId": 1,
      "nickname": "player1",
      "role": "CITIZEN",
      "isWinner": true
    }
  ]
}
```

---

## 오류 처리 및 상태 코드

### HTTP 상태 코드
- `200 OK`: 성공적인 요청
- `400 Bad Request`: 잘못된 요청 데이터
- `401 Unauthorized`: 인증 필요
- `403 Forbidden`: 권한 없음
- `404 Not Found`: 리소스를 찾을 수 없음
- `409 Conflict`: 리소스 충돌 (이미 참여 중인 게임 등)
- `500 Internal Server Error`: 서버 오류

### 표준 오류 응답 형식
```json
{
  "success": false,
  "error": "GAME_NOT_FOUND",
  "message": "게임을 찾을 수 없습니다.",
  "timestamp": "2025-08-27T17:30:00Z",
  "path": "/api/v1/game/123"
}
```

### 일반적인 오류 시나리오

#### 게임 참여 실패
```json
{
  "success": false,
  "error": "ROOM_FULL",
  "message": "방이 가득 찼습니다.",
  "details": {
    "currentPlayers": 6,
    "maxPlayers": 6
  }
}
```

#### 권한 오류
```json
{
  "success": false,
  "error": "INVALID_TURN",
  "message": "현재 턴이 아닙니다.",
  "details": {
    "currentPlayerId": 2,
    "yourPlayerId": 1
  }
}
```

---

## 데이터 모델 상세

### 게임 엔티티 구조
```typescript
interface GameEntity {
  id: number;
  gameNumber: number;
  gameOwner: string;
  gameState: 'WAITING' | 'IN_PROGRESS' | 'ENDED';
  currentPhase: GamePhase;
  gameParticipants: number;
  gameLiarCount: number;
  gameTotalRounds: number;
  gameCurrentRound: number;
  gameMode: 'LIARS_KNOW' | 'LIARS_DIFFERENT_WORD';
  turnOrder?: string;
  currentTurnIndex: number;
  currentPlayerId?: number;
  accusedPlayerId?: number;
  phaseEndTime?: string;
  gameStartDeadline?: string;
  timeExtensionCount?: number;
  createdAt: string;
  gameEndTime?: string;
}
```

### 플레이어 엔티티 구조
```typescript
interface PlayerEntity {
  id: number;
  userId: number;
  nickname: string;
  isAlive: boolean;
  role: 'CITIZEN' | 'LIAR';
  state: PlayerState;
  assignedWord?: string;
  hint?: string;
  defense?: string;
  votedFor?: number;
  votesReceived: number;
  finalVote?: boolean;
  joinedAt: string;
}
```

### 채팅 메시지 구조
```typescript
interface ChatMessage {
  id: number;
  gameNumber: number;
  senderId: number;
  senderNickname: string;
  content: string;
  type: 'NORMAL' | 'SYSTEM' | 'HINT' | 'DEFENSE';
  timestamp: string;
}
```

---

## 성능 고려사항

### 데이터베이스 쿼리 최적화
- 게임별 락킹으로 동시성 제어
- 인덱스 활용: `gameNumber`, `userId`, `gameState`
- 배치 업데이트로 여러 플레이어 상태 동시 변경

### Redis 캐시 전략
- 게임 진행 상태는 Redis에 임시 저장
- 세션 정보 캐싱으로 빠른 인증
- WebSocket 연결 정보 관리

### WebSocket 최적화
- 게임별 메시지 그룹핑
- 불필요한 브로드캐스트 최소화
- 연결 풀 관리로 메모리 효율성

---

## 보안 고려사항

### 인증 및 권한
- HTTP 세션 기반 인증
- WebSocket 연결 시 세션 검증
- API별 권한 체크

### 데이터 검증
- 모든 입력 데이터 유효성 검증
- 비속어 필터링
- SQL 인젝션 방지

### 게임 무결성
- 턴 순서 서버 측 검증
- 투표 중복 방지
- 게임 상태 일관성 보장

---

## 모니터링 및 로깅

### 로그 레벨
- `ERROR`: 시스템 오류, 예외 상황
- `WARN`: 비정상적이지만 처리 가능한 상황
- `INFO`: 중요한 비즈니스 이벤트
- `DEBUG`: 상세한 실행 추적

### 모니터링 포인트
- 활성 게임 수
- 동시 접속자 수
- 평균 게임 진행 시간
- 오류 발생률
- 메모리 사용량

---

## 배포 및 환경 설정

### 환경별 설정
```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:h2:mem:testdb
  jpa:
    show-sql: true

# application-prod.yml
spring:
  datasource:
    url: jdbc:postgresql://119.201.53.4:5432/liargame
  jpa:
    show-sql: false
```

### Docker 컨테이너화
```dockerfile
FROM openjdk:17-jdk-slim
COPY build/libs/kotlin_liargame-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

이 문서는 프론트엔드 개발자가 백엔드 API를 완전히 이해하고 활용할 수 있도록 모든 필요한 정보를 포함하고 있습니다.
