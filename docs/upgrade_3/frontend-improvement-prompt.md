# 라이어 게임 프론트엔드 개선 프롬프트

## 프로젝트 개요

실시간 채팅 기반 라이어 게임의 프론트엔드 개선 작업입니다. 백엔드 API가 대부분 구현되어 있으므로 기존 API를 활용하여 사용자 경험을 개선하는 것이 주요 목표입니다.

## 현재 백엔드 API 현황 분석

### 구현된 주요 API
- `createGameRoom()`: 게임방 생성
- `joinGame()`: 게임 참여 
- `leaveGame()`: 게임 나가기
- `getGameState()`: 게임 상태 조회
- `getAllGameRooms()`: 전체 게임방 목록
- `kickOwnerAndTransferOwnership()`: 방장 강퇴 및 권한 이양
- `extendGameStartTime()`: 게임 시작 시간 연장
- `handlePlayerDisconnection()`: 플레이어 연결 해제 처리

### 새로 추가된 API
- **플레이어 준비 상태**:
  - `POST /api/v1/game/{gameNumber}/ready`: 준비 상태 토글
  - `GET /api/v1/game/{gameNumber}/ready-status`: 준비 상태 조회
- **게임 카운트다운**:
  - `POST /api/v1/game/{gameNumber}/countdown/start`: 카운트다운 시작
  - `POST /api/v1/game/{gameNumber}/countdown/cancel`: 카운트다운 취소
  - `GET /api/v1/game/{gameNumber}/countdown/status`: 카운트다운 상태 조회
- **투표 현황**:
  - `GET /api/v1/game/{gameNumber}/voting-status`: 실시간 투표 진행 상황
- **연결 상태**:
  - `GET /api/v1/game/{gameNumber}/connection-status`: 플레이어 연결 상태 집계

### 백엔드에서 지원하는 기능
- 세션 관리 및 WebSocket 연결 상태 추적
- **표준화된 WebSocket 재연결 처리** (`x-old-session-id` 헤더 방식)
- **플레이어 준비 상태 시스템** (PlayerReadinessService)
- **게임 카운트다운 시스템** (GameCountdownService - 자동 시작 포함)
- **향상된 연결 관리** (EnhancedConnectionService - 유예 시간, 로그)
- **동적 투표 임계치** (alive 플레이어 수 기반 requiredVotes 계산)
- 플레이어 역할 관리 (CITIZEN, LIAR)
- 게임 상태 관리 (WAITING, IN_PROGRESS, ENDED)
- 플레이어 상태 관리 (WAITING_FOR_HINT, GAVE_HINT, VOTED 등)
- 실시간 채팅 시스템
- 방장 권한 자동 이양 시스템

---

## 🔴 Critical Priority - 프론트엔드 구현 사항

### 1. 게임 시작 조건 명확화 UI

**현재 백엔드 지원 상황:**
- ✅ 최소/최대 인원 제한 로직 구현됨
- ✅ 방장 권한 및 자동 이양 구현됨
- ✅ **플레이어 준비 상태 시스템 구현됨** (PlayerReadinessEntity, API 완성)
- ✅ **카운트다운 시스템 구현됨** (GameCountdownService, 자동 시작 포함)

**프론트엔드 구현 요구사항:**
```typescript
// 백엔드에서 제공되는 API 응답 인터페이스
interface PlayerReadyResponse {
  playerId: Long;
  nickname: string;
  isReady: boolean;
  isOwner: boolean;
}

interface CountdownResponse {
  isActive: boolean;
  startedAt?: string; // ISO timestamp
  endTime?: string; // ISO timestamp
  durationSeconds: number; // 기본 10초
  remainingSeconds?: number;
}

// 프론트엔드 컴포넌트 인터페이스
interface GameStartPanel {
  playerCount: number;
  minPlayers: number; // 3명
  maxPlayers: number; // 15명
  readyPlayers: PlayerReadyResponse[];
  countdown: CountdownResponse;
  canStartGame: boolean;
}
```

**백엔드 API 연동:**
```typescript
// 준비 상태 토글
const toggleReady = async (gameNumber: number) => {
  await fetch(`/api/v1/game/${gameNumber}/ready`, { method: 'POST' });
};

// 준비 상태 조회
const getReadyStatus = async (gameNumber: number): Promise<PlayerReadyResponse[]> => {
  const response = await fetch(`/api/v1/game/${gameNumber}/ready-status`);
  return response.json();
};

// 카운트다운 시작 (방장만)
const startCountdown = async (gameNumber: number) => {
  await fetch(`/api/v1/game/${gameNumber}/countdown/start`, { method: 'POST' });
};

// 카운트다운 취소 (누구나)
const cancelCountdown = async (gameNumber: number) => {
  await fetch(`/api/v1/game/${gameNumber}/countdown/cancel`, { method: 'POST' });
};

// 카운트다운 상태 조회
const getCountdownStatus = async (gameNumber: number): Promise<CountdownResponse> => {
  const response = await fetch(`/api/v1/game/${gameNumber}/countdown/status`);
  return response.json();
};
```

**구현할 UI 컴포넌트:**
1. **플레이어 준비 상태 패널**
   - 각 플레이어별 준비 상태 표시 (체크박스 또는 상태 아이콘)
   - 본인 준비 버튼 토글 (`toggleReady()` API 호출)
   - 방장의 게임 시작 버튼 (모든 플레이어 준비 시 카운트다운 시작)

2. **게임 시작 카운트다운**
   - **백엔드에서 자동 관리되는 카운트다운** (10초 기본값)
   - 실시간 남은 시간 표시 (`CountdownResponse.remainingSeconds`)
   - 취소 버튼 (카운트다운 중 누구나 클릭 가능 - `cancelCountdown()` API)
   - 진행도 바 또는 원형 프로그레스
   - **카운트다운 완료 시 자동 게임 시작** (백엔드에서 처리)

3. **인원 현황 표시**
   - 현재 인원 / 최대 인원 표시
   - 권장 인원 범위 하이라이트
   - 인원 부족 시 대기 메시지

**중요 구현 사항:**
- 준비 상태 변경 시 실시간 WebSocket 브로드캐스트 수신
- 카운트다운 시작/취소 시 실시간 업데이트
- 카운트다운 완료 시 자동 게임 시작 (백엔드 `startGameBySystem()` 처리)

### 2. 실시간 연결 상태 관리 UI

**현재 백엔드 지원 상황:**
- ✅ WebSocket 연결 상태 추적
- ✅ 플레이어 연결 해제/재접속 처리  
- ✅ **표준화된 재연결 헤더 처리** (`x-old-session-id`)
- ✅ **향상된 연결 관리** (EnhancedConnectionService)
- ✅ **연결 이벤트 로그 시스템** (ConnectionLogEntity)
- ✅ **유예 시간 관리 및 알림**
- ✅ 최소 인원 미달 시 게임 종료

**프론트엔드 구현 요구사항:**
```typescript
// 백엔드 연결 상태 API 응답
interface ConnectionStatusResponse {
  connectedCount: number;
  disconnectedCount: number;
  totalCount: number;
  playerStatuses: PlayerConnectionStatus[];
}

interface PlayerConnectionStatus {
  playerId: Long;
  nickname: string;
  connectionState: 'CONNECTED' | 'DISCONNECTED' | 'GRACE_PERIOD';
  lastConnectedAt?: string; // ISO timestamp
  gracePeriodEndsAt?: string; // ISO timestamp (유예 시간 종료)
}

interface GameStateIndicator {
  currentPhase: GamePhase;
  nextPhaseConditions: string[];
  waitingFor: string[]; // 누구를 기다리고 있는지
  canProceed: boolean;
}
```

**백엔드 API 연동:**
```typescript
// 연결 상태 조회
const getConnectionStatus = async (gameNumber: number): Promise<ConnectionStatusResponse> => {
  const response = await fetch(`/api/v1/game/${gameNumber}/connection-status`);
  return response.json();
};
```

**구현할 UI 컴포넌트:**
1. **실시간 플레이어 상태 패널**
   - 각 플레이어별 연결 상태 아이콘 (CONNECTED/DISCONNECTED/GRACE_PERIOD)
   - **유예 시간 카운트다운** (`gracePeriodEndsAt` 기반)
   - 재접속 성공/실패 알림
   - 연결 상태 집계 표시 (`connectedCount/totalCount`)

2. **게임 진행 상태 표시기**
   - 현재 게임 단계 표시
   - 다음 단계로 넘어가기 위한 조건 표시
   - "누구를 기다리고 있나요?" 정보

**중요 구현 사항:**
- 연결/해제/재연결 시 실시간 WebSocket 브로드캐스트 수신
- 유예 시간 종료 카운트다운 UI
- 연결 상태 변경 시 즉시 업데이트

### 3. 게임 종료 조건 UI

**현재 백엔드 지원 상황:**
- ✅ 투표 완료 및 게임 종료 로직
- ✅ 게임 결과 조회 API
- ✅ **동적 투표 임계치** (alive 플레이어 수 기반 requiredVotes 계산)
- ✅ **실시간 투표 현황 조회** (VotingStatusResponse)
- ✅ **과반 즉시 확정** (임계치 도달 시 즉시 변론 단계 전환)
- ❌ 타이브레이커 로직 미구현

**프론트엔드 구현 요구사항:**
```typescript
// 백엔드 투표 현황 API 응답
interface VotingStatusResponse {
  votingPhase: 'ACCUSATION' | 'DEFENSE' | 'COMPLETED';
  requiredVotes: number; // 동적 임계치 (alive 플레이어 수 기반)
  currentVotes: number;  // 현재 투표 수
  activePlayersCount: number; // 투표 가능한 플레이어 수
  playerVotes: PlayerVoteInfo[];
}

interface PlayerVoteInfo {
  playerId: Long;
  nickname: string;
  targetPlayerId?: Long; // 투표한 대상 (null이면 미투표)
  targetNickname?: string;
  hasVoted: boolean;
}

// 게임 종료 조건
interface GameEndConditions {
  votingComplete: boolean;
  allVotesSubmitted: boolean;
  thresholdReached: boolean; // 과반 임계치 도달
  liarEliminated: boolean;
  tieBreaker?: TieBreakerInfo;
}

interface TieBreakerInfo {
  tiedPlayers: PlayerInfo[];
  method: 'OWNER_DECISION' | 'SUDDEN_DEATH';
  timeLimit: number;
}
```

**백엔드 API 연동:**
```typescript
// 투표 현황 조회
const getVotingStatus = async (gameNumber: number): Promise<VotingStatusResponse> => {
  const response = await fetch(`/api/v1/game/${gameNumber}/voting-status`);
  return response.json();
};
```

**구현할 UI 컴포넌트:**
1. **투표 진행 현황 패널**
   - **동적 임계치 표시** (`currentVotes / requiredVotes`)
   - 실시간 투표 진행률 바 (과반 임계치 기준)
   - 아직 투표하지 않은 플레이어 목록 (`hasVoted: false`)
   - **과반 도달 시 즉시 확정 알림**
   - 투표 단계 표시 (ACCUSATION/DEFENSE/COMPLETED)

2. **플레이어별 투표 현황**
   - 각 플레이어의 투표 상태 (`hasVoted`)
   - 누구에게 투표했는지 표시 (`targetNickname`)
   - 재투표 시 이전 투표 복원 표시

3. **게임 결과 상세 화면**
   - 각 플레이어의 역할 공개
   - 투표 결과 상세 내역
   - 승리 조건 달성 여부
   - 다음 게임 시작 옵션

**중요 구현 사항:**
- 투표할 때마다 실시간 `VOTING_PROGRESS` 브로드캐스트 수신
- 과반 임계치 도달 시 즉시 UI 업데이트 (변론 단계로 전환)
- 재투표 시 이전 대상 표수 감소, 새 대상 표수 증가 반영
- 동적 임계치 계산 표시 (alive 플레이어 수 변경 시 업데이트)

---

## 🟡 High Priority - 프론트엔드 구현 사항

### 4. 사용자 인터페이스 개선

**구현할 UI 컴포넌트:**

1. **실시간 대시보드**
```typescript
interface GameDashboard {
  connectedPlayers: number;
  totalPlayers: number;
  currentPhase: GamePhase;
  phaseTimeRemaining?: number;
  myRole: PlayerRole;
  myStatus: PlayerState;
  actionRequired: boolean;
  actionDescription: string;
}
```

2. **게임 상태 시각화**
```typescript
interface PhaseIndicator {
  phases: GamePhaseInfo[];
  currentPhaseIndex: number;
  progressPercentage: number;
  phaseColors: Record<GamePhase, string>;
}

interface GamePhaseInfo {
  phase: GamePhase;
  name: string;
  description: string;
  isComplete: boolean;
  isCurrent: boolean;
}
```

3. **상황별 안내 패널**
```typescript
interface HelpPanel {
  title: string;
  description: string;
  actionButtons: ActionButton[];
  tips: string[];
  rules: string[];
}

interface ActionButton {
  label: string;
  action: () => void;
  disabled: boolean;
  variant: 'primary' | 'secondary' | 'danger';
}
```

### 5. 모바일 최적화

**구현 요구사항:**
1. **터치 친화적 인터페이스**
   - 최소 44px 터치 타겟 크기
   - 스와이프 제스처 지원
   - 햅틱 피드백 (투표, 중요한 액션 시)

2. **반응형 레이아웃**
   - 모바일 세로/가로 모드 대응
   - 태블릿 레이아웃 최적화
   - 플레이어 목록 접기/펼치기

3. **모바일 전용 기능**
   - 화면 꺼짐 방지
   - 백그라운드 알림
   - 진동 패턴으로 턴 알림

### 6. 접근성 개선

**구현 요구사항:**
1. **키보드 네비게이션**
   - Tab 순서 논리적 배치
   - 단축키 지원 (스페이스바로 투표 등)
   - 포커스 인디케이터 명확히 표시

2. **스크린 리더 지원**
   - ARIA 라벨 및 역할 정의
   - 실시간 상태 변경 알림
   - 게임 진행 상황 음성 안내

3. **고대비 모드**
   - 색상 대비 4.5:1 이상 유지
   - 색상 외 다른 방법으로도 정보 전달
   - 다크 모드 지원

---

## 🟢 Medium Priority - 프론트엔드 구현 사항

### 7. 고급 UI/UX 기능

**구현 요구사항:**

1. **애니메이션 및 트랜지션**
```typescript
interface AnimationConfig {
  phaseTransition: TransitionConfig;
  playerJoin: AnimationConfig;
  votingProgress: AnimationConfig;
  gameEnd: AnimationConfig;
}

interface TransitionConfig {
  duration: number;
  easing: string;
  delay?: number;
}
```

2. **실시간 알림 시스템**
```typescript
interface NotificationSystem {
  showToast: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
  showModal: (title: string, content: string, actions: ModalAction[]) => void;
  showBanner: (message: string, persistent?: boolean) => void;
}
```

3. **게임 통계 대시보드**
```typescript
interface GameStats {
  personalStats: PersonalStats;
  gameHistory: GameHistoryEntry[];
  achievements: Achievement[];
}

interface PersonalStats {
  gamesPlayed: number;
  winRate: number;
  averageGameDuration: number;
  favoriteRole: 'CITIZEN' | 'LIAR';
  bestStreak: number;
}
```

---

## 구현 가이드라인

### 기술 스택 활용
- **React 19**: 최신 훅 및 기능 활용
- **TypeScript**: 엄격한 타입 정의
- **Mantine**: UI 컴포넌트 라이브러리
- **WebSocket**: 실시간 통신 (STOMP 프로토콜)

### WebSocket 연결 및 재연결 표준화

백엔드에서는 표준화된 WebSocket 재연결 처리를 지원합니다. 프론트엔드에서는 다음과 같이 구현해야 합니다:

```typescript
interface WebSocketManager {
  connect: () => Promise<void>;
  reconnect: (oldSessionId: string) => Promise<void>;
  disconnect: () => void;
  onConnectionStateChange: (callback: (state: ConnectionState) => void) => void;
  getCurrentSessionId: () => string | null;
}

interface ConnectionState {
  status: 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';
  sessionId?: string;
  lastConnectedAt?: Date;
  reconnectAttempts: number;
  maxReconnectAttempts: number;
}
```

**표준 재연결 헤더 구현:**
```typescript
// WebSocket 재연결 시 x-old-session-id 헤더 전송
const connectWithReconnection = (oldSessionId?: string) => {
  const stompClient = new Client({
    brokerURL: 'ws://localhost:8080/ws',
    connectHeaders: oldSessionId ? {
      'x-old-session-id': oldSessionId
    } : {},
    onConnect: (frame) => {
      console.log('Connected:', frame);
      // 새로운 세션 ID 저장
      const newSessionId = stompClient.webSocket?.url?.split('session=')[1];
      localStorage.setItem('currentSessionId', newSessionId || '');
    },
    onDisconnect: () => {
      console.log('Disconnected');
      handleReconnection();
    }
  });
  
  stompClient.activate();
  return stompClient;
};

// 재연결 로직
const handleReconnection = () => {
  const oldSessionId = localStorage.getItem('currentSessionId');
  if (oldSessionId) {
    setTimeout(() => {
      connectWithReconnection(oldSessionId);
    }, 1000); // 1초 후 재연결 시도
  }
};
```

**구현 요구사항:**
1. **세션 ID 관리**
   - 현재 WebSocket 세션 ID를 localStorage에 저장
   - 재연결 시 이전 세션 ID를 `x-old-session-id` 헤더로 전송
   - 백엔드에서 자동으로 게임 상태 복원 처리

2. **재연결 UI 피드백**
   - 연결 끊김 즉시 "재연결 중..." 표시
   - 재연결 성공 시 "연결 복원됨" 알림
   - 재연결 실패 시 사용자에게 새로고침 안내

3. **게임 상태 동기화**
   - 재연결 후 최신 게임 상태 자동 조회
   - 놓친 메시지나 이벤트 복원
   - 플레이어 목록 및 투표 상태 업데이트

### WebSocket 브로드캐스트 메시지

백엔드에서 다음 WebSocket 브로드캐스트 메시지들을 수신해야 합니다:

```typescript
// 새로 추가된 브로드캐스트 메시지 타입
interface WebSocketMessage {
  type: 'PLAYER_READY_UPDATE' | 'COUNTDOWN_STARTED' | 'COUNTDOWN_CANCELLED' | 
        'CONNECTION_STATUS_UPDATE' | 'VOTING_PROGRESS' | 'PLAYER_RECONNECTED' | 
        // 기존 메시지들...
        'GAME_STATE_UPDATE' | 'PLAYER_JOINED' | 'PLAYER_LEFT';
  payload: any;
  gameNumber: number;
  timestamp: string;
}

// 각 메시지별 payload 타입
interface PlayerReadyUpdatePayload {
  playerId: Long;
  nickname: string;
  isReady: boolean;
}

interface CountdownPayload {
  isActive: boolean;
  startedAt?: string;
  endTime?: string;
  durationSeconds: number;
}

interface VotingProgressPayload {
  votingPhase: 'ACCUSATION' | 'DEFENSE' | 'COMPLETED';
  requiredVotes: number;
  currentVotes: number;
  activePlayersCount: number;
}
```

### 상태 관리 패턴
```typescript
// Context API 활용한 게임 상태 관리
interface GameContextValue {
  gameState: GameStateResponse;
  players: PlayerInfo[];
  currentUser: PlayerInfo | null;
  connectionStatus: ConnectionStatus;
  actions: GameActions;
}

interface GameActions {
  // 기존 API
  joinGame: (gameNumber: number) => Promise<void>;
  leaveGame: () => Promise<void>;
  startGame: () => Promise<void>;
  vote: (targetPlayerId: string) => Promise<void>;
  
  // 새로 추가된 API
  toggleReady: () => Promise<void>;
  startCountdown: () => Promise<void>;
  cancelCountdown: () => Promise<void>;
  
  // 상태 조회 API
  getReadyStatus: () => Promise<PlayerReadyResponse[]>;
  getCountdownStatus: () => Promise<CountdownResponse>;
  getVotingStatus: () => Promise<VotingStatusResponse>;
  getConnectionStatus: () => Promise<ConnectionStatusResponse>;
}
```

### 에러 처리
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

interface GameErrorHandler {
  handleConnectionError: (error: WebSocketError) => void;
  handleAPIError: (error: APIError) => void;
  handleGameStateError: (error: GameStateError) => void;
  showFallbackUI: (errorType: string) => JSX.Element;
}
```

### 성능 최적화
1. **React.memo 활용**
   - PlayerCard 컴포넌트
   - GameTimer 컴포넌트
   - ChatMessage 컴포넌트

2. **useMemo/useCallback**
   - 복잡한 계산 결과 메모이제이션
   - 이벤트 핸들러 최적화

3. **가상화**
   - 긴 채팅 메시지 목록
   - 대량의 게임 히스토리

### 테스트 전략
```typescript
// 컴포넌트 테스트 예시
describe('GameStartPanel', () => {
  it('should show ready button for non-owner players', () => {
    render(<GameStartPanel players={mockPlayers} currentUser={mockUser} />);
    expect(screen.getByText('준비')).toBeInTheDocument();
  });

  it('should show start game button for owner when all ready', () => {
    const allReadyPlayers = mockPlayers.map(p => ({ ...p, isReady: true }));
    render(<GameStartPanel players={allReadyPlayers} currentUser={mockOwner} />);
    expect(screen.getByText('게임 시작')).toBeEnabled();
  });
});
```

### 배포 고려사항
- Bundle 크기 최적화
- 브라우저 호환성 (최신 2개 버전)
- PWA 기능 (오프라인 대응)
- CDN을 통한 정적 자산 배포

### 완료 기준
- [ ] 모든 Critical Priority 기능 구현
- [ ] High Priority 기능 80% 이상 구현
- [ ] 모바일 반응형 테스트 통과
- [ ] 접근성 표준 준수 (WCAG 2.1 AA)
- [ ] Cross-browser 테스트 통과
- [ ] 성능 점수 90점 이상 (Lighthouse)
- [ ] E2E 테스트 시나리오 통과