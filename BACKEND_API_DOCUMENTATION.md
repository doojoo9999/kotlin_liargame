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
11. [최근 업데이트(2025-09-09)](#최근-업데이트2025-09-09)

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

## 최근 업데이트(2025-09-09)
이번 스프린트 반영 사항 요약입니다.
- 준비/카운트다운 기능 추가: 모든 플레이어 준비 완료 후 방장이 카운트다운 시작, 만료 시 자동 시작.
- 연결 관리 고도화: 연결 해제/유예/재연결 로깅 및 브로드캐스트, 연결 상태 조회 API 추가.
- WebSocket 재연결 표준화: STOMP CONNECT 시 `x-old-session-id` 헤더로 재연결 핸드셰이크 지원.
- 투표 현황 조회 API 추가: 현재 득표/필요 표/대기자 목록 등 반환.
- 동적 투표 임계치 실사용: 과반수 즉시 확정(변론 단계 전환) 로직 VotingService에 반영.
- GameEntity 확장: 카운트다운/투표 관련 필드(countdownStartedAt, countdownEndTime, countdownDurationSeconds, requiredVotes, currentVotes, activePlayersCount, votingPhase) 추가.

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
- `SPEECH`: 힌트 제공 단계 (GIVING_HINTS 대신 SPEECH 사용)
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
  "randomSubjectCount": 2,
  "targetPoints": 10
}
```

**새로운 필드:**
- `targetPoints`: 승리를 위한 목표 점수 (기본값: 10점, 범위: 1-50점)

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

#### 5. 라이어 투표 (기존 방식)
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

#### 5-1. 라이어 투표 (새로운 방식) - 추가됨
```http
POST /api/v1/game/cast-vote
```

**Request Body:**
```json
{
  "gameNumber": 123,
  "targetUserId": 2
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "voterUserId": 1,
  "targetUserId": 2,
  "isSuccessful": true,
  "message": "투표가 성공적으로 처리되었습니다."
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
4. 변론 내용 저장
5. 다른 플레이어들에게 변론 내용 브로드캐스트
6. 최종 투표 단계 스케줄링

**상태 변화:**
- 지목된 플레이어 상태: ACCUSED → DEFENDED
- 변론 상태 저장
- 최종 투표 단계로 전환

#### 6-1. 변론 즉시 종료
```http
POST /api/v1/game/defense/end
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
  "gameState": "IN_PROGRESS",
  "currentPhase": "VOTING_FOR_SURVIVAL",
  "players": [...],
  "accusedPlayer": {...}
}
```

**Service 로직:**
1. 변론자(accused) 권한 확인
2. DEFENDING 상태에서만 호출 가능
3. 변론 타이머 즉시 취소
4. 최종 투표 단계로 즉시 전환
5. 중복 호출 방지 처리

**상태 변화:**
- 변론 타이머 중단
- 즉시 VOTING_FOR_SURVIVAL 단계로 전환
- 모든 플레이어에게 단계 전환 브로드캐스트

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
2. 투표 내용 저장
3. 모든 투표 완료 시 결과 계산
4. 과반수에 따라 처형/생존 결정
5. 게임 종료 조건 확인
6. 라이어 추측 단계 또는 게임 종료

**상태 변화:**
- 플레이어 상태: WAITING_FOR_FINAL_VOTE → FINAL_VOTED
- 처형 결정에 따른 게임 진행
- 게임 종료 또는 라이어 추측 단계로 전환

#### 8-1. 라이어 단어 추측 (기존)
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

#### 8-2. 라이어 단어 추측 (새로운 방식) - 추가됨
```http
POST /api/v1/game/guess-word
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

#### 9. 라운드 종료 처리 - 새로 추가됨
```http
POST /api/v1/game/end-of-round
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
  "gameState": "IN_PROGRESS",
  "currentPhase": "WAITING_FOR_PLAYERS",
  "gameCurrentRound": 2,
  "scoreboard": [...]
}
```

**Service 로직:**
1. 라운드 종료 권한 확인
2. 현재 라운드 점수 계산
3. 다음 라운드 준비 또는 게임 종료
4. 점수판 업데이트
5. 게임 상태 반환

### 게임 상태 조회

#### 게임 상태 조회
```http
GET /api/v1/game/{gameNumber}
```

**Response:**
```json
{
  "gameNumber": 123,
  "gameName": "게임방 이름",
  "gameOwner": "player1",
  "gameState": "IN_PROGRESS",
  "currentPhase": "SPEECH",
  "players": [
    {
      "id": 1,
      "userId": 1,
      "nickname": "player1",
      "isAlive": true,
      "state": "GAVE_HINT",
      "hint": "네 다리가 있어요",
      "defense": null,
      "votesReceived": 0,
      "hasVoted": false
    }
  ],
  "gameMode": "LIARS_KNOW",
  "gameParticipants": 6,
  "gameLiarCount": 1,
  "gameTotalRounds": 3,
  "gameCurrentRound": 1,
  "yourRole": "CITIZEN",
  "yourWord": "강아지",
  "accusedPlayer": null,
  "isChatAvailable": true,
  "citizenSubject": "동물",
  "liarSubject": null,
  "subjects": ["동물"],
  "turnOrder": ["player1", "player2"],
  "currentTurnIndex": 1,
  "phaseEndTime": "2025-08-27T17:30:00Z",
  "winner": null,
  "reason": null,
  "targetPoints": 10,
  "scoreboard": [
    {
      "userId": 1,
      "nickname": "player1",
      "isAlive": true,
      "score": 0
    }
  ],
  "finalVotingRecord": null
}
```

#### 게임 상태 복구 - 새로 추가됨
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
    "userId": 1,
    "nickname": "player1",
    "isAlive": true,
    "role": "CITIZEN"
  },
  "timestamp": "2025-08-27T17:30:00Z"
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

### 채팅 메시지 타입 (ChatMessageType) - 업데이트됨
- `HINT`: 힌트 단계에서의 메시지
- `DISCUSSION`: 토론 단계에서의 메시지 (기존 NORMAL 대신)
- `DEFENSE`: 변론 단계에서의 메시지
- `POST_ROUND`: 라운드 종료 후 채팅
- `SYSTEM`: 시스템 메시지 (사회자, 게임 상태 알림 등)

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
  "type": "DISCUSSION"
}
```

**Response:**
```json
{
  "id": 1,
  "gameNumber": 123,
  "playerNickname": "player1",
  "content": "안녕하세요!",
  "timestamp": "2025-08-27T17:30:00Z",
  "type": "DISCUSSION"
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
      "gameNumber": 123,
      "playerNickname": "player1",
      "content": "안녕하세요!",
      "timestamp": "2025-08-27T17:30:00Z",
      "type": "DISCUSSION"
    }
  ],
  "totalElements": 25,
  "totalPages": 1,
  "currentPage": 0
}
```

### 채팅 제한 규칙

**단계별 채팅 가능 여부:**
- `WAITING_FOR_PLAYERS`: 자유 채팅 (DISCUSSION)
- `SPEECH`: 현재 턴 플레이어만 채팅 가능 (HINT)
- `VOTING_FOR_LIAR`: 투표 중 채팅 금지
- `DEFENDING`: 지목된 플레이어만 채팅 가능 (DEFENSE)
- `VOTING_FOR_SURVIVAL`: 투표 중 채팅 금지
- `GUESSING_WORD`: 라이어만 채팅 가능
- `GAME_OVER`: 자유 채팅 (POST_ROUND)

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

---

## 게임 준비 및 카운트다운 시스템

### API 엔드포인트

#### 1. 플레이어 준비 상태 토글
```http
POST /api/v1/game/{gameNumber}/ready
```

**Response:**
```json
{
  "playerId": 1,
  "nickname": "player1",
  "isReady": true,
  "allPlayersReady": true,
  "readyCount": 6,
  "totalPlayers": 6
}
```

**Service 로직:**
1. 플레이어 인증 확인
2. 준비 상태 토글
3. 전체 플레이어 준비 상태 확인
4. 모든 플레이어 준비 완료 시 방장에게 카운트다운 시작 권한 부여
5. WebSocket으로 준비 상태 변경 브로드캐스트

**상태 변화:**
- 플레이어 준비 상태 토글
- 모든 플레이어 준비 완료 시 게임 시작 가능 상태로 전환

#### 2. 준비 상태 조회
```http
GET /api/v1/game/{gameNumber}/ready-status
```

**Response:**
```json
[
  {
    "playerId": 1,
    "nickname": "player1",
    "isReady": true,
    "allPlayersReady": false,
    "readyCount": 3,
    "totalPlayers": 6
  }
]
```

#### 3. 카운트다운 시작 (방장 전용)
```http
POST /api/v1/game/{gameNumber}/countdown/start
```

**Request Body:**
```json
{
  "durationSeconds": 10
}
```

**Response:**
```json
{
  "gameNumber": 123,
  "countdownEndTime": "2025-09-09T12:00:10Z",
  "durationSeconds": 10,
  "canCancel": true
}
```

**Service 로직:**
1. 방장 권한 확인
2. 모든 플레이어 준비 상태 확인
3. 카운트다운 타이머 시작
4. 카운트다운 만료 시 자동 게임 시작 스케줄링
5. 카운트다운 상태 브로드캐스트

#### 4. 카운트다운 취소 (방장 전용)
```http
POST /api/v1/game/{gameNumber}/countdown/cancel
```

**Response:**
```json
{
  "gameNumber": 123,
  "countdownEndTime": null,
  "durationSeconds": 0,
  "canCancel": false
}
```

#### 5. 카운트다운 상태 조회
```http
GET /api/v1/game/{gameNumber}/countdown/status
```

**Response:**
```json
{
  "gameNumber": 123,
  "countdownEndTime": "2025-09-09T12:00:10Z",
  "durationSeconds": 10,
  "canCancel": true
}
```

---

## 연결 관리 시스템

### API 엔드포인트

#### 1. 연결 상태 조회
```http
GET /api/v1/game/{gameNumber}/connection-status
```

**Response:**
```json
{
  "gameNumber": 123,
  "players": [
    {
      "userId": 1,
      "nickname": "player1",
      "isConnected": true,
      "hasGracePeriod": false,
      "lastSeenAt": "2025-09-09T12:00:00Z",
      "connectionStability": "STABLE"
    }
  ]
}
```

**Service 로직:**
1. 게임 참여자 연결 상태 조회
2. 연결 안정성 평가 (STABLE, UNSTABLE, POOR)
3. 유예 기간(Grace Period) 상태 확인
4. 마지막 활동 시간 반환

**상태 변화:**
- 연결 상태 실시간 모니터링
- 연결 불안정 시 유예 기간 부여
- 완전 연결 끊김 시 게임에서 제외

---

## 투표 현황 시스템

### API 엔드포인트

#### 1. 투표 현황 조회
```http
GET /api/v1/game/{gameNumber}/voting-status
```

**Response:**
```json
{
  "gameNumber": 123,
  "currentVotes": 3,
  "requiredVotes": 6,
  "totalPlayers": 6,
  "votedPlayers": [
    {
      "userId": 1,
      "nickname": "player1",
      "votedAt": "2025-09-09T12:00:00Z"
    }
  ],
  "pendingPlayers": [
    {
      "userId": 2,
      "nickname": "player2",
      "votedAt": null
    }
  ],
  "votingDeadline": "2025-09-09T12:05:00Z",
  "canChangeVote": false
}
```

**Service 로직:**
1. 현재 투표 단계의 투표 현황 조회
2. 필요 투표 수와 현재 투표 수 비교
3. 투표 완료자와 대기자 목록 제공
4. 투표 마감 시간 확인
5. 투표 변경 가능 여부 확인

**상태 변화:**
- 실시간 투표 진행률 업데이트
- 과반수 달성 시 즉시 단계 전환 가능
- 투표 완료 시 자동으로 다음 단계 진행

---

## 실시간 통신 상세

### WebSocket 연결 관리

#### 연결 설정
```javascript
const socket = new SockJS('/ws');
const stompClient = Stomp.over(socket);

// 재연결 시 이전 세션 ID 포함
const connectHeaders = {};
const oldSessionId = localStorage.getItem('websocket-session-id');
if (oldSessionId) {
    connectHeaders['x-old-session-id'] = oldSessionId;
}

stompClient.connect(connectHeaders, function(frame) {
    console.log('Connected: ' + frame);
    
    // 세션 ID 저장 (재연결에 사용)
    const sessionId = frame.headers['session'];
    if (sessionId) {
        localStorage.setItem('websocket-session-id', sessionId);
    }
    
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

    // 실시간 이벤트 구독 (새로 추가됨)
    stompClient.subscribe(`/topic/game/${gameNumber}/events`, function(message) {
        const event = JSON.parse(message.body);
        handleRealtimeEvent(event);
    });
    
    // 개인 알림 구독
    stompClient.subscribe(`/topic/user/${userId}/notifications`, function(message) {
        const notification = JSON.parse(message.body);
        handleUserNotification(notification);
    });
});
```

#### 연결 재설정 및 복구
```javascript
// 연결 끊김 감지 및 재연결
stompClient.onDisconnect = function() {
    console.log('WebSocket disconnected');
    // 자동 재연결 로직
    setTimeout(() => {
        connectWebSocket();
    }, 1000);
};

// 게임 상태 복구
async function recoverGameState(gameNumber) {
    try {
        const response = await fetch(`/api/v1/game/recover-state/${gameNumber}`);
        const gameState = await response.json();
        handleGameStateRecovery(gameState);
    } catch (error) {
        console.error('Failed to recover game state:', error);
    }
}
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

#### 준비 상태 변경 알림 (새로 추가됨)
```json
{
  "type": "PLAYER_READY_CHANGED",
  "gameNumber": 123,
  "playerId": 1,
  "nickname": "player1",
  "isReady": true,
  "allPlayersReady": false,
  "readyCount": 3,
  "totalPlayers": 6,
  "timestamp": "2025-09-09T12:00:00Z"
}
```

#### 카운트다운 시작 알림 (새로 추가됨)
```json
{
  "type": "COUNTDOWN_STARTED",
  "gameNumber": 123,
  "countdownEndTime": "2025-09-09T12:00:10Z",
  "durationSeconds": 10,
  "startedBy": "player1",
  "timestamp": "2025-09-09T12:00:00Z"
}
```

#### 카운트다운 취소 알림 (새로 추가됨)
```json
{
  "type": "COUNTDOWN_CANCELLED",
  "gameNumber": 123,
  "cancelledBy": "player1",
  "timestamp": "2025-09-09T12:00:05Z"
}
```

#### 연결 상태 변경 알림 (새로 추가됨)
```json
{
  "type": "PLAYER_DISCONNECTED",
  "gameNumber": 123,
  "playerId": 2,
  "nickname": "player2",
  "hasGracePeriod": true,
  "gracePeriodEndTime": "2025-09-09T12:00:30Z",
  "timestamp": "2025-09-09T12:00:00Z"
}
```

#### 연결 복구 알림 (새로 추가됨)
```json
{
  "type": "PLAYER_RECONNECTED",
  "gameNumber": 123,
  "playerId": 2,
  "nickname": "player2",
  "connectionStability": "STABLE",
  "timestamp": "2025-09-09T12:00:15Z"
}
```

#### 유예 기간 시작 알림 (새로 추가됨)
```json
{
  "type": "GRACE_PERIOD_STARTED",
  "gameNumber": 123,
  "playerId": 2,
  "nickname": "player2",
  "gracePeriodEndTime": "2025-09-09T12:00:30Z",
  "timestamp": "2025-09-09T12:00:00Z"
}
```

#### 유예 기간 만료 알림 (새로 추가됨)
```json
{
  "type": "GRACE_PERIOD_EXPIRED",
  "gameNumber": 123,
  "playerId": 2,
  "nickname": "player2",
  "playerRemoved": true,
  "timestamp": "2025-09-09T12:00:30Z"
}
```

#### 투표 진행률 업데이트 (새로 추가됨)
```json
{
  "type": "VOTING_PROGRESS",
  "gameNumber": 123,
  "currentVotes": 3,
  "requiredVotes": 6,
  "votingPhase": "LIAR_ELIMINATION",
  "canProgressImmediately": false,
  "timestamp": "2025-09-09T12:00:00Z"
}
```

#### 과반수 달성 알림 (새로 추가됨)
```json
{
  "type": "MAJORITY_REACHED",
  "gameNumber": 123,
  "votingPhase": "LIAR_ELIMINATION",
  "topCandidate": {
    "playerId": 2,
    "nickname": "player2",
    "votes": 4
  },
  "proceedingToDefense": true,
  "timestamp": "2025-09-09T12:00:00Z"
}
```

---

## Frontend Integration Guide

### API 요청 형식 매핑

#### 기존 Frontend → Backend 매핑
```typescript
// Frontend의 CreateGameRequest
interface CreateGameRequest {
  maxPlayers: number
  timeLimit: number
  totalRounds: number
}

// 실제 Backend가 요구하는 형식
interface BackendCreateGameRequest {
  gameParticipants: number      // maxPlayers와 매핑
  gameLiarCount: number        // 고정값 또는 계산
  gameTotalRounds: number      // totalRounds와 매핑
  gameMode: "LIARS_KNOW" | "LIARS_DIFFERENT_WORD"
  subjectIds: number[]         // 주제 선택
  useRandomSubjects: boolean   // 랜덤 주제 사용 여부
  randomSubjectCount?: number  // 랜덤 주제 개수
  targetPoints: number         // 목표 점수 (기본값: 10)
}
```

#### 게임 참여 요청 매핑
```typescript
// Frontend의 JoinGameRequest
interface JoinGameRequest {
  sessionCode: string
  nickname: string
}

// 실제 Backend가 요구하는 형식
interface BackendJoinGameRequest {
  gameNumber: number  // sessionCode를 숫자로 변환
}
// 참고: nickname은 이미 세션에 저장되어 있으므로 별도 전송 불필요
```

### 필수 구현 사항

#### 1. 인증 시스템 연동
```typescript
// 로그인 후 세션 관리
const handleLogin = async (nickname: string, password?: string) => {
  const response = await gameApi.login({ nickname, password });
  if (response.success) {
    // 세션에 사용자 정보 저장됨 (쿠키 기반)
    localStorage.setItem('user-id', response.userId.toString());
    localStorage.setItem('nickname', response.nickname);
  }
};

// 세션 갱신 확인
const checkSession = async () => {
  try {
    const response = await fetch('/api/v1/auth/refresh-session');
    return response.ok;
  } catch {
    return false;
  }
};
```

#### 2. 게임 상태 동기화
```typescript
// 게임 상태 조회 및 UI 업데이트
const syncGameState = async (gameNumber: number) => {
  try {
    const gameState = await gameApi.getGameStatus(gameNumber);
    
    // 게임 단계별 UI 업데이트
    switch (gameState.currentPhase) {
      case 'WAITING_FOR_PLAYERS':
        showWaitingUI(gameState);
        break;
      case 'SPEECH':
        showSpeechUI(gameState);
        break;
      case 'VOTING_FOR_LIAR':
        showVotingUI(gameState);
        break;
      case 'DEFENDING':
        showDefenseUI(gameState);
        break;
      case 'VOTING_FOR_SURVIVAL':
        showFinalVotingUI(gameState);
        break;
      case 'GUESSING_WORD':
        showWordGuessUI(gameState);
        break;
      case 'GAME_OVER':
        showGameOverUI(gameState);
        break;
    }
  } catch (error) {
    console.error('Failed to sync game state:', error);
  }
};
```

#### 3. 실시간 이벤트 처리
```typescript
// WebSocket 이벤트 핸들러
const handleRealtimeEvent = (event: any) => {
  switch (event.type) {
    case 'PLAYER_READY_CHANGED':
      updateReadyStatus(event);
      break;
    case 'COUNTDOWN_STARTED':
      startCountdownUI(event.countdownEndTime, event.durationSeconds);
      break;
    case 'COUNTDOWN_CANCELLED':
      stopCountdownUI();
      break;
    case 'PLAYER_DISCONNECTED':
      showDisconnectionNotice(event);
      break;
    case 'PLAYER_RECONNECTED':
      hideDisconnectionNotice(event.playerId);
      break;
    case 'VOTING_PROGRESS':
      updateVotingProgress(event);
      break;
    case 'MAJORITY_REACHED':
      showMajorityReachedNotification(event);
      break;
  }
};
```

#### 4. 게임 액션 구현
```typescript
// 준비 상태 토글
const toggleReady = async (gameNumber: number) => {
  try {
    await gameApi.toggleReady(gameNumber);
    // WebSocket으로 실시간 업데이트 수신됨
  } catch (error) {
    showError('준비 상태 변경에 실패했습니다.');
  }
};

// 힌트 제공
const submitHint = async (gameNumber: number, hint: string) => {
  try {
    await fetch('/api/v1/game/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameNumber, hint })
    });
  } catch (error) {
    showError('힌트 전송에 실패했습니다.');
  }
};

// 투표 제출 (새로운 방식)
const castVote = async (gameNumber: number, targetUserId: number) => {
  try {
    const response = await fetch('/api/v1/game/cast-vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameNumber, targetUserId })
    });
    
    const result = await response.json();
    if (result.isSuccessful) {
      showSuccess('투표가 완료되었습니다.');
    }
  } catch (error) {
    showError('투표에 실패했습니다.');
  }
};
```

### 오류 처리 패턴

#### 네트워크 오류 처리
```typescript
const apiCall = async (endpoint: string, options: RequestInit) => {
  try {
    const response = await fetch(endpoint, {
      ...options,
      credentials: 'include' // 세션 쿠키 포함
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '요청에 실패했습니다.');
    }
    
    return await response.json();
  } catch (error) {
    // 네트워크 오류 또는 서버 오류 처리
    if (error instanceof TypeError) {
      throw new Error('네트워크 연결을 확인해주세요.');
    }
    throw error;
  }
};
```

#### 게임 상태 오류 처리
```typescript
const handleGameError = (error: any) => {
  switch (error.error) {
    case 'GAME_NOT_FOUND':
      showError('게임방을 찾을 수 없습니다.');
      navigateToLobby();
      break;
    case 'ROOM_FULL':
      showError('게임방이 가득 찼습니다.');
      break;
    case 'INVALID_TURN':
      showError('현재 턴이 아닙니다.');
      break;
    case 'SESSION_EXPIRED':
      showError('세션이 만료되었습니다. 다시 로그인해주세요.');
      navigateToLogin();
      break;
    default:
      showError('알 수 없는 오류가 발생했습니다.');
  }
};
```

### 성능 최적화 권장사항

#### 1. API 호출 최적화
```typescript
// 디바운싱을 활용한 상태 조회
const debouncedGameStateCheck = debounce(async (gameNumber: number) => {
  await syncGameState(gameNumber);
}, 1000);

// 캐싱을 활용한 중복 요청 방지
const gameStateCache = new Map<number, { data: any, timestamp: number }>();

const getCachedGameState = async (gameNumber: number) => {
  const cached = gameStateCache.get(gameNumber);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < 5000) { // 5초 캐시
    return cached.data;
  }
  
  const data = await gameApi.getGameStatus(gameNumber);
  gameStateCache.set(gameNumber, { data, timestamp: now });
  return data;
};
```

#### 2. WebSocket 연결 관리
```typescript
// 연결 상태 모니터링
let heartbeatInterval: NodeJS.Timeout;

const startHeartbeat = () => {
  heartbeatInterval = setInterval(() => {
    if (stompClient.connected) {
      stompClient.send('/app/heartbeat', {}, JSON.stringify({ timestamp: Date.now() }));
    }
  }, 30000); // 30초마다 하트비트
};

const stopHeartbeat = () => {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
};
```

### 테스팅 가이드

#### API 연동 테스트
```typescript
// Jest를 사용한 API 테스트 예시
describe('Game API Integration', () => {
  test('should login successfully', async () => {
    const response = await gameApi.login({
      nickname: 'testuser',
      password: 'testpass'
    });
    
    expect(response.success).toBe(true);
    expect(response.userId).toBeDefined();
    expect(response.nickname).toBe('testuser');
  });
  
  test('should create game with correct format', async () => {
    const gameRequest = {
      gameParticipants: 6,
      gameLiarCount: 1,
      gameTotalRounds: 3,
      gameMode: 'LIARS_KNOW' as const,
      subjectIds: [1, 2, 3],
      useRandomSubjects: false,
      targetPoints: 10
    };
    
    const gameNumber = await fetch('/api/v1/game/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(gameRequest)
    }).then(res => res.json());
    
    expect(typeof gameNumber).toBe('number');
    expect(gameNumber).toBeGreaterThan(0);
  });
});
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

### 게임 엔티티 구조(업데이트)
```typescript
interface GameEntity {
  id: number;
  gameNumber: number;
  gameName: string;
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
  targetPoints: number;
  createdAt: string;
  gameEndTime?: string;
  // 새로 추가된 필드
  countdownStartedAt?: string;
  countdownEndTime?: string;
  countdownDurationSeconds?: number;
  requiredVotes?: number;
  currentVotes?: number;
  activePlayersCount?: number;
  votingPhase?: 'LIAR_ELIMINATION' | 'SURVIVAL_VOTE' | 'TIE_BREAKER';
}
```

### 투표 현황 구조 - 새로 추가됨
```typescript
interface VotingStatusResponse {
  gameNumber: number;
  currentVotes: number;
  requiredVotes: number;
  totalPlayers: number;
  votedPlayers: { userId: number; nickname: string; votedAt?: string | null }[];
  pendingPlayers: { userId: number; nickname: string; votedAt?: string | null }[];
  votingDeadline?: string | null;
  canChangeVote: boolean;
}
```

### 연결 상태 구조 - 새로 추가됨
```typescript
type ConnectionStability = 'STABLE' | 'UNSTABLE' | 'POOR';
interface PlayerConnectionStatus {
  userId: number;
  nickname: string;
  isConnected: boolean;
  hasGracePeriod: boolean;
  lastSeenAt: string; // ISO 8601
  connectionStability: ConnectionStability;
}
```

### 준비 상태 구조 - 새로 추가됨
```typescript
interface PlayerReadyResponse {
  playerId: number;
  nickname: string;
  isReady: boolean;
  allPlayersReady: boolean;
  readyCount: number;
  totalPlayers: number;
}
```

### 카운트다운 응답 구조 - 새로 추가됨
```typescript
interface CountdownResponse {
  gameNumber: number;
  countdownEndTime?: string | null; // ISO 8601
  durationSeconds: number;
  canCancel: boolean;
}
```

---

## 종합적인 Frontend 통합 체크리스트

### 🔐 인증 시스템 (Auth)
- [ ] **로그인 API 연동** - POST `/api/v1/auth/login` 구현
- [ ] **로그아웃 API 연동** - POST `/api/v1/auth/logout` 구현
- [ ] **세션 갱신 API 연동** - POST `/api/v1/auth/refresh-session` 구현
- [ ] **세션 기반 쿠키 인증** - `credentials: 'include'` 설정
- [ ] **토큰 없이 세션만 사용** - localStorage 토큰 제거
- [ ] **자동 세션 갱신** - 페이지 로드 시 세션 확인

### 🎮 게임 시스템 (Game)
- [ ] **게임 생성 API 수정** - 올바른 Backend 요청 형식 매핑
  - [ ] `maxPlayers` → `gameParticipants`
  - [ ] `gameLiarCount`, `gameMode`, `subjectIds` 추가
  - [ ] `targetPoints` 필드 포함
- [ ] **게임 참여 API 수정** - `sessionCode` → `gameNumber` 변환
- [ ] **게임 상태 조회** - GET `/api/v1/game/{gameNumber}` 완전 활용
- [ ] **게임 상태 복구** - GET `/api/v1/game/recover-state/{gameNumber}` 구현
- [ ] **준비 상태 토글** - POST `/api/v1/game/{gameNumber}/ready` 연동
- [ ] **준비 상태 조회** - GET `/api/v1/game/{gameNumber}/ready-status` 연동
- [ ] **카운트다운 시작** - POST `/api/v1/game/{gameNumber}/countdown/start` 연동
- [ ] **카운트다운 취소** - POST `/api/v1/game/{gameNumber}/countdown/cancel` 연동
- [ ] **카운트다운 상태 조회** - GET `/api/v1/game/{gameNumber}/countdown/status` 연동

### 🎯 게임플레이 API 연동
- [ ] **힌트 제공** - POST `/api/v1/game/hint` 구현
- [ ] **투표 제출 (새 방식)** - POST `/api/v1/game/cast-vote` 구현
- [ ] **변론 제출** - POST `/api/v1/game/submit-defense` 구현
- [ ] **변론 즉시 종료** - POST `/api/v1/game/defense/end` 구현
- [ ] **최종 투표** - POST `/api/v1/game/vote/final` 구현
- [ ] **단어 추측 (새 방식)** - POST `/api/v1/game/guess-word` 구현
- [ ] **라운드 종료** - POST `/api/v1/game/end-of-round` 구현
- [ ] **투표 현황 조회** - GET `/api/v1/game/{gameNumber}/voting-status` 연동

### 💬 채팅 시스템 (Chat)
- [ ] **채팅 전송 API** - POST `/api/v1/chat/send` 연동
- [ ] **채팅 기록 조회** - POST `/api/v1/chat/history` 연동
- [ ] **단계별 채팅 제한** - 게임 단계에 따른 채팅 권한 구현
- [ ] **채팅 메시지 타입** - HINT, DISCUSSION, DEFENSE, POST_ROUND, SYSTEM 구분

### 🌐 실시간 통신 (WebSocket/STOMP)
- [ ] **SockJS + STOMP 연결** - 네이티브 WebSocket 대신 STOMP 사용
- [ ] **재연결 헤더** - `x-old-session-id` 헤더 포함한 재연결 구현
- [ ] **세션 ID 저장** - 재연결을 위한 세션 ID localStorage 저장
- [ ] **하트비트** - 30초마다 `/app/heartbeat` 전송
- [ ] **구독 채널 설정**:
  - [ ] `/topic/game/{gameNumber}/state` - 게임 상태 변경
  - [ ] `/topic/game/{gameNumber}/chat` - 채팅 메시지
  - [ ] `/topic/game/{gameNumber}/events` - 실시간 이벤트
  - [ ] `/topic/user/{userId}/notifications` - 개인 알림

### 📡 실시간 이벤트 처리
- [ ] **준비 상태 변경** - `PLAYER_READY_CHANGED` 이벤트 처리
- [ ] **카운트다운 관련** - `COUNTDOWN_STARTED`, `COUNTDOWN_CANCELLED` 이벤트 처리
- [ ] **연결 상태 관리** - `PLAYER_DISCONNECTED`, `PLAYER_RECONNECTED` 이벤트 처리
- [ ] **유예 기간 관리** - `GRACE_PERIOD_STARTED`, `GRACE_PERIOD_EXPIRED` 이벤트 처리
- [ ] **투표 진행률** - `VOTING_PROGRESS`, `MAJORITY_REACHED` 이벤트 처리
- [ ] **게임 단계 전환** - 각 단계별 이벤트에 따른 UI 업데이트

### 🎨 UI/UX 개선 사항
- [ ] **게임 단계별 UI** - 7개 게임 단계에 맞는 UI 컴포넌트 구현
- [ ] **실시간 카운트다운 타이머** - 서버 시간 기반 정확한 타이머
- [ ] **투표 진행률 표시** - 실시간 투표 현황 및 프로그레스 바
- [ ] **연결 상태 표시** - 플레이어별 연결 상태 및 안정성 표시
- [ ] **준비 상태 표시** - 각 플레이어의 준비 상태 실시간 업데이트
- [ ] **과반수 달성 알림** - 투표 과반수 달성 시 즉시 알림 및 단계 전환

### 🔧 연결 관리 시스템
- [ ] **연결 상태 조회** - GET `/api/v1/game/{gameNumber}/connection-status` 연동
- [ ] **연결 모니터링** - 플레이어별 연결 상태 실시간 추적
- [ ] **유예 기간 UI** - 연결 끊김 시 유예 기간 타이머 표시
- [ ] **재연결 처리** - 자동 재연결 및 게임 상태 복구

### 🛡️ 오류 처리 및 복구
- [ ] **네트워크 오류 처리** - 적절한 에러 메시지 및 재시도 로직
- [ ] **게임 상태 오류 처리** - 게임 상태 불일치 시 자동 동기화
- [ ] **세션 만료 처리** - 자동 로그아웃 및 로그인 페이지 리디렉션
- [ ] **WebSocket 연결 실패** - 폴백 메커니즘 및 수동 새로고침 안내

### 🎯 주제 및 단어 시스템
- [ ] **주제 목록 조회** - GET `/api/v1/subjects` 연동
- [ ] **주제 제안** - POST `/api/v1/subjects` 연동
- [ ] **단어 목록 조회** - GET `/api/v1/words` 연동
- [ ] **단어 제안** - POST `/api/v1/words` 연동

### 📊 통계 및 관리
- [ ] **게임방 목록** - GET `/api/v1/game/rooms` 연동
- [ ] **게임 결과 조회** - GET `/api/v1/game/result/{gameNumber}` 연동
- [ ] **사용자 통계** - GET `/api/v1/users/stats` 연동

### 🧪 테스트 및 검증
- [ ] **API 연동 테스트** - 각 엔드포인트별 단위 테스트
- [ ] **WebSocket 테스트** - 실시간 통신 안정성 테스트
- [ ] **게임 플로우 테스트** - 전체 게임 진행 E2E 테스트
- [ ] **오류 시나리오 테스트** - 네트워크 끊김, 세션 만료 등

### 🚀 성능 최적화
- [ ] **API 호출 캐싱** - 중복 요청 방지 및 캐시 전략
- [ ] **디바운싱 적용** - 빈번한 상태 조회 최적화
- [ ] **메모리 관리** - WebSocket 이벤트 리스너 정리
- [ ] **번들 최적화** - 코드 스플리팅 및 레이지 로딩

---

## 빠른 시작 가이드

### 1단계: 인증 시스템 우선 구현
```bash
# 가장 중요한 기본 기능
1. 로그인/로그아웃 API 연동
2. 세션 기반 인증으로 변경
3. 자동 세션 갱신 구현
```

### 2단계: 게임 생성/참여 수정
```bash
# 기존 API 형식을 Backend 형식에 맞게 수정
1. CreateGameRequest 인터페이스 수정
2. JoinGameRequest에서 gameNumber 변환 로직 추가
3. 게임 상태 조회 API 완전 활용
```

### 3단계: WebSocket 업그레이드
```bash
# 실시간 통신 안정화
1. SockJS + STOMP로 전환
2. 재연결 로직 구현 (`x-old-session-id` 포함)
3. 새로운 실시간 이벤트 처리 추가
```

### 4단계: 게임플레이 API 연동
```bash
# 게임 진행 관련 모든 API 연동
1. 준비/카운트다운 시스템 구현
2. 새로운 투표 방식 (cast-vote) 적용
3. 투표 현황 실시간 표시
```

### 5단계: UI/UX 개선 및 테스트
```bash
# 사용자 경험 최적화
1. 게임 단계별 UI 완성
2. 실시간 피드백 강화
3. 전체 게임 플로우 테스트
```

이 체크리스트를 통해 Frontend와 Backend 간의 완벽한 통합을 달성할 수 있습니다.
