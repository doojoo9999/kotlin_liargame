# Phase 3: 통합 및 버전 관리 단계

> **목표**: Light Version과 Main Version 간의 완벽한 통합 시스템을 구축하고 효율적인 버전 전환을 구현합니다.

**예상 소요시간**: 4-5일  
**선행 조건**: [Phase 2: 핵심 컴포넌트 개발](./phase-2-components.md) 완료  
**다음 단계**: [Phase 4: 고급 기능 및 완성도](./phase-4-advanced.md)

---

## 🔄 Step 3.1: 공통 모듈 분리 및 추출

### 📋 프롬프트

```markdown
# 공통 모듈 분리 및 추출

## 목표
Light Version과 Main Version에서 공통으로 사용되는 비즈니스 로직, API 클라이언트, 타입 정의 등을 완전히 분리하여 재사용 가능한 공통 모듈로 추출합니다.

## 공통 모듈 아키텍처

### A. 공통 모듈 디렉토리 구조
```
src/shared/
├── api/                    # API 클라이언트 및 엔드포인트
│   ├── clients/           # HTTP 클라이언트 설정
│   ├── endpoints/         # API 엔드포인트 정의
│   ├── types/            # API 응답 타입
│   └── hooks/            # API 관련 커스텀 훅
├── stores/               # Zustand 상태 관리
│   ├── auth.store.ts     # 인증 상태
│   ├── game.store.ts     # 게임 상태
│   ├── user.store.ts     # 사용자 상태
│   └── websocket.store.ts # WebSocket 상태
├── types/                # 공통 타입 정의
│   ├── auth.types.ts
│   ├── game.types.ts
│   ├── user.types.ts
│   └── websocket.types.ts
├── utils/                # 순수 함수 유틸리티
│   ├── game-logic/       # 게임 로직 유틸리티
│   ├── validation/       # 검증 로직
│   ├── formatting/       # 포매팅 유틸리티
│   └── constants/        # 상수 정의
├── hooks/                # 공통 커스텀 훅
│   ├── useGameLogic.ts
│   ├── useAuth.ts
│   ├── useWebSocket.ts
│   └── useLocalStorage.ts
└── websocket/            # WebSocket 관리
    ├── client.ts         # WebSocket 클라이언트
    ├── handlers/         # 메시지 핸들러
    ├── types.ts          # WebSocket 타입
    └── utils.ts          # WebSocket 유틸리티
```

### B. API 클라이언트 통합
```typescript
// shared/api/clients/base.client.ts
import { QueryClient } from '@tanstack/react-query';

export class BaseApiClient {
  private baseURL: string;
  private queryClient: QueryClient;

  constructor(baseURL: string, queryClient: QueryClient) {
    this.baseURL = baseURL;
    this.queryClient = queryClient;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    return response.json();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

// shared/api/endpoints/game.endpoints.ts
export const gameEndpoints = {
  createRoom: '/api/games/rooms',
  joinRoom: '/api/games/rooms/:roomId/join',
  leaveRoom: '/api/games/rooms/:roomId/leave',
  getRoomInfo: '/api/games/rooms/:roomId',
  startGame: '/api/games/:gameId/start',
  submitHint: '/api/games/:gameId/hints',
  vote: '/api/games/:gameId/votes',
  getGameState: '/api/games/:gameId/state',
};
```

### C. Zustand 스토어 최적화
```typescript
// shared/stores/game.store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { GameState, Player, GamePhase } from '../types/game.types';

interface GameStore {
  // State
  currentGame: GameState | null;
  players: Player[];
  currentPhase: GamePhase;
  currentTurnIndex: number;
  
  // Actions
  setGame: (game: GameState) => void;
  updatePlayers: (players: Player[]) => void;
  setPhase: (phase: GamePhase) => void;
  incrementTurn: () => void;
  
  // Computed values
  getCurrentPlayer: () => Player | null;
  getAlivePlayerCount: () => number;
  isCurrentUserTurn: () => boolean;
}

export const useGameStore = create<GameStore>()(
  subscribeWithSelector((set, get) => ({
    currentGame: null,
    players: [],
    currentPhase: 'WAITING',
    currentTurnIndex: 0,

    setGame: (game) => set({ currentGame: game }),
    
    updatePlayers: (players) => set({ players }),
    
    setPhase: (phase) => set({ currentPhase: phase }),
    
    incrementTurn: () => set((state) => ({ 
      currentTurnIndex: (state.currentTurnIndex + 1) % state.players.length 
    })),

    getCurrentPlayer: () => {
      const { players, currentTurnIndex } = get();
      return players[currentTurnIndex] || null;
    },

    getAlivePlayerCount: () => {
      return get().players.filter(player => player.isAlive).length;
    },

    isCurrentUserTurn: () => {
      const currentPlayer = get().getCurrentPlayer();
      const userId = localStorage.getItem('user_id');
      return currentPlayer?.userId === Number(userId);
    },
  }))
);
```

### D. 타입 정의 통합
```typescript
// shared/types/game.types.ts
export type GamePhase = 
  | 'WAITING'
  | 'HINT_PROVIDING'
  | 'DISCUSSION'
  | 'LIAR_SELECTION'
  | 'FINAL_DEFENSE'
  | 'FINAL_VOTING'
  | 'GAME_OVER';

export type PlayerRole = 'CITIZEN' | 'LIAR';

export type PlayerState = 
  | 'WAITING'
  | 'PROVIDING_HINT'
  | 'DISCUSSING'
  | 'VOTING'
  | 'DEFENDING'
  | 'ELIMINATED';

export interface Player {
  id: number;
  userId: number;
  nickname: string;
  isAlive: boolean;
  role?: PlayerRole;
  state: PlayerState;
  hint?: string;
  votesReceived: number;
  hasVoted: boolean;
  joinedAt: string;
}

export interface GameState {
  id: number;
  gameNumber: number;
  phase: GamePhase;
  keyword: string;
  currentTurnIndex: number;
  currentPlayerId?: number;
  timeRemaining?: number;
  isActive: boolean;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
}

export interface VotingRecord {
  voterId: number;
  targetId: number;
  voteType?: boolean; // true = 찬성, false = 반대
  createdAt: string;
}
```

## 추출 전략

### A. 단계적 모듈 분리
1. **타입 정의 먼저 분리**
   - 공통 타입을 shared/types로 이동
   - 버전별 컴포넌트에서 import 경로 업데이트

2. **API 클라이언트 분리**
   - 기존 API 호출 코드를 shared/api로 통합
   - TanStack Query 설정을 공통 모듈로 이동

3. **상태 관리 통합**
   - Zustand 스토어를 shared/stores로 이동
   - 버전별 컴포넌트에서 동일한 스토어 사용

4. **유틸리티 함수 분리**
   - 순수 함수들을 shared/utils로 이동
   - 비즈니스 로직 함수 통합

### B. 호환성 유지 전략
```typescript
// versions/light/utils/compatibility.ts
// Light Version에서 공통 모듈 사용을 위한 호환성 레이어
export const createCompatibilityLayer = () => {
  return {
    // Mantine 특화 유틸리티를 공통 유틸리티로 변환
    convertMantineProps: (props: any) => {
      // Mantine props를 일반적인 props로 변환
      return transformPropsForCommonUtils(props);
    },
    
    // 공통 모듈의 결과를 Mantine에 맞게 변환
    adaptToMantine: (result: any) => {
      // 공통 모듈 결과를 Mantine 컴포넌트에 맞게 조정
      return adaptResultForMantine(result);
    }
  };
};
```

## 출력 요구사항
1. 완전히 분리된 공통 모듈 시스템
2. 버전 간 호환성을 보장하는 어댑터 패턴
3. 타입 안전성을 유지하는 공통 타입 시스템
4. 성능 최적화된 공통 상태 관리
5. 종합적인 모듈 분리 테스트
```

### ✅ 완료 기준
- [ ] 모든 공통 모듈 분리 완료
- [ ] 버전 간 호환성 검증 완료
- [ ] 타입 안전성 확인 완료
- [ ] 공통 모듈 테스트 작성 완료

---

## 🔀 Step 3.2: 버전 관리 시스템 구현

### 📋 프롬프트

```markdown
# 버전 관리 시스템 구현

## 목표
Light Version과 Main Version 간의 매끄러운 전환을 지원하는 버전 관리 시스템을 구현합니다. 사용자가 실시간으로 버전을 전환할 수 있으며, 게임 중에도 일시적 전환이 가능해야 합니다.

## 버전 관리 아키텍처

### A. 버전 전환 매니저
```typescript
// shared/version/manager.ts
export type UIVersion = 'light' | 'main';

export interface VersionConfig {
  version: UIVersion;
  theme: string;
  features: string[];
  performance: 'low' | 'medium' | 'high';
}

export class VersionManager {
  private currentVersion: UIVersion;
  private userPreference: UIVersion;
  private deviceCapability: 'low' | 'medium' | 'high';

  constructor() {
    this.currentVersion = this.detectOptimalVersion();
    this.userPreference = this.loadUserPreference();
    this.deviceCapability = this.detectDeviceCapability();
  }

  getCurrentVersion(): UIVersion {
    return this.currentVersion;
  }

  switchVersion(version: UIVersion, temporary = false): Promise<void> {
    return new Promise((resolve) => {
      // 애니메이션과 함께 버전 전환
      this.animateVersionTransition(() => {
        this.currentVersion = version;
        
        if (!temporary) {
          this.saveUserPreference(version);
        }
        
        // 전역 상태 업데이트
        this.notifyVersionChange(version);
        resolve();
      });
    });
  }

  private detectOptimalVersion(): UIVersion {
    const userAgent = navigator.userAgent.toLowerCase();
    const memory = (navigator as any).deviceMemory || 4;
    const connection = (navigator as any).connection;

    // 저사양 기기 감지
    if (memory < 2) return 'light';
    if (userAgent.includes('mobile') && memory < 4) return 'light';
    if (connection && connection.effectiveType === '2g') return 'light';

    return this.loadUserPreference() || 'main';
  }

  private detectDeviceCapability(): 'low' | 'medium' | 'high' {
    const memory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;

    if (memory >= 8 && hardwareConcurrency >= 8) return 'high';
    if (memory >= 4 && hardwareConcurrency >= 4) return 'medium';
    return 'low';
  }
}
```

### B. 동적 컴포넌트 로더
```typescript
// shared/version/loader.ts
import { ComponentType, lazy } from 'react';

interface ComponentLoader {
  light: () => Promise<{ default: ComponentType<any> }>;
  main: () => Promise<{ default: ComponentType<any> }>;
}

export const createVersionedComponent = (
  componentLoaders: ComponentLoader
) => {
  const LightComponent = lazy(componentLoaders.light);
  const MainComponent = lazy(componentLoaders.main);

  return ({ version, ...props }: { version: UIVersion }) => {
    const Component = version === 'light' ? LightComponent : MainComponent;
    return <Component {...props} />;
  };
};

// 사용 예시
export const PlayerCard = createVersionedComponent({
  light: () => import('../../versions/light/components/PlayerCard'),
  main: () => import('../../versions/main/components/PlayerCard'),
});

export const GameBoard = createVersionedComponent({
  light: () => import('../../versions/light/components/GameBoard'),
  main: () => import('../../versions/main/components/GameBoard'),
});
```

### C. 상태 동기화 시스템
```typescript
// shared/version/sync.ts
export class VersionSyncManager {
  private syncQueue: Array<{ 
    action: string; 
    payload: any; 
    timestamp: number; 
  }> = [];

  syncGameState(fromVersion: UIVersion, toVersion: UIVersion): Promise<void> {
    return new Promise((resolve) => {
      // 게임 상태를 버전 간 동기화
      const gameState = useGameStore.getState();
      const userState = useAuthStore.getState();
      
      // 상태 변환 및 동기화
      this.transformAndSyncState(gameState, fromVersion, toVersion);
      this.transformAndSyncState(userState, fromVersion, toVersion);
      
      // WebSocket 연결 유지
      this.maintainWebSocketConnection();
      
      resolve();
    });
  }

  private transformAndSyncState(
    state: any, 
    from: UIVersion, 
    to: UIVersion
  ) {
    // 버전별 상태 구조 차이를 보정
    if (from === 'light' && to === 'main') {
      // Light → Main 변환
      return this.transformLightToMain(state);
    } else if (from === 'main' && to === 'light') {
      // Main → Light 변환
      return this.transformMainToLight(state);
    }
    
    return state;
  }

  private maintainWebSocketConnection() {
    // 버전 전환 중에도 WebSocket 연결 유지
    const websocketStore = useWebSocketStore.getState();
    if (websocketStore.isConnected) {
      websocketStore.sendMessage({
        type: 'VERSION_SWITCH',
        payload: { version: this.currentVersion }
      });
    }
  }
}
```

### D. 버전별 라우팅 시스템
```typescript
// app/router.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { VersionProvider } from '../shared/version/context';

const createVersionedRoutes = (version: UIVersion) => {
  const basePath = version === 'light' ? '/light' : '/main';
  
  return [
    {
      path: basePath,
      element: <VersionProvider version={version} />,
      children: [
        {
          path: 'lobby',
          lazy: () => import(`../versions/${version}/pages/LobbyPage`)
        },
        {
          path: 'room/:roomId',
          lazy: () => import(`../versions/${version}/pages/GameRoomPage`)
        },
        {
          path: 'game/:gameId',
          lazy: () => import(`../versions/${version}/pages/GamePlayPage`)
        }
      ]
    }
  ];
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <VersionSelector />
  },
  ...createVersionedRoutes('light'),
  ...createVersionedRoutes('main'),
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
```

### E. 실시간 버전 전환 UI
```typescript
// shared/components/VersionSwitcher.tsx
import { useState } from 'react';
import { useVersionManager } from '../hooks/useVersionManager';
import { AnimatePresence, motion } from 'framer-motion';

export const VersionSwitcher = () => {
  const { currentVersion, switchVersion, canSwitchDuringGame } = useVersionManager();
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleVersionSwitch = async (newVersion: UIVersion) => {
    if (isTransitioning) return;
    
    setIsTransitioning(true);
    
    try {
      await switchVersion(newVersion);
    } finally {
      setIsTransitioning(false);
    }
  };

  return (
    <div className="version-switcher">
      <AnimatePresence>
        {!canSwitchDuringGame && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="warning-message"
          >
            게임 중에는 버전 전환이 제한됩니다
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="version-toggle">
        <button
          onClick={() => handleVersionSwitch('light')}
          disabled={isTransitioning || currentVersion === 'light'}
          className={`version-button ${currentVersion === 'light' ? 'active' : ''}`}
        >
          Light Version
          <span className="version-description">빠르고 안정적</span>
        </button>
        
        <button
          onClick={() => handleVersionSwitch('main')}
          disabled={isTransitioning || currentVersion === 'main'}
          className={`version-button ${currentVersion === 'main' ? 'active' : ''}`}
        >
          Main Version
          <span className="version-description">풍부한 애니메이션</span>
        </button>
      </div>
      
      {isTransitioning && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="transition-indicator"
        >
          <div className="loading-spinner" />
          <span>버전 전환 중...</span>
        </motion.div>
      )}
    </div>
  );
};
```

## 추가 기능

### A. 성능 모니터링
```typescript
// shared/version/monitor.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  measureVersionPerformance(version: UIVersion, operation: string) {
    const start = performance.now();
    
    return {
      end: () => {
        const duration = performance.now() - start;
        this.recordMetric(`${version}_${operation}`, duration);
        
        // 성능이 떨어지면 자동으로 Light Version 추천
        if (duration > 100 && version === 'main') {
          this.recommendVersionSwitch('light');
        }
      }
    };
  }

  private recommendVersionSwitch(recommendedVersion: UIVersion) {
    // 사용자에게 버전 전환 추천 알림
    window.dispatchEvent(new CustomEvent('version-recommendation', {
      detail: { recommended: recommendedVersion }
    }));
  }
}
```

### B. 점진적 기능 활성화
```typescript
// shared/version/features.ts
export const getFeatureFlags = (version: UIVersion, deviceCapability: string) => {
  const baseFeatures = {
    realTimeChat: true,
    basicAnimations: true,
    gameLogic: true,
  };

  if (version === 'light') {
    return baseFeatures;
  }

  // Main Version 추가 기능
  const advancedFeatures = {
    ...baseFeatures,
    particleEffects: deviceCapability !== 'low',
    complexAnimations: true,
    shadowcnComponents: true,
    framerMotion: true,
    dynamicThemes: true,
  };

  return advancedFeatures;
};
```

## 출력 요구사항
1. 완전한 버전 관리 시스템
2. 실시간 버전 전환 기능
3. 상태 동기화 메커니즘
4. 성능 모니터링 및 자동 최적화
5. 사용자 친화적인 버전 선택 UI
```

### ✅ 완료 기준
- [ ] 버전 전환 시스템 구현 완료
- [ ] 실시간 상태 동기화 구현 완료
- [ ] 성능 모니터링 시스템 완료
- [ ] 버전 전환 UI 구현 완료

---

## 🎯 Phase 3 완료 체크리스트

### 필수 완료사항
- [ ] **공통 모듈**: 완전한 모듈 분리 및 추출 완료
- [ ] **버전 관리**: 실시간 버전 전환 시스템 완성
- [ ] **상태 동기화**: 버전 간 상태 동기화 구현
- [ ] **성능 최적화**: 버전별 성능 모니터링 시스템
- [ ] **호환성**: 양 버전 간 완전한 호환성 확보

### 산출물
1. **공통 모듈 시스템**: 재사용 가능한 비즈니스 로직 모듈
2. **버전 관리자**: 동적 버전 전환 및 관리 시스템
3. **상태 동기화**: 실시간 상태 동기화 메커니즘
4. **성능 모니터**: 자동 성능 최적화 시스템
5. **통합 테스트**: 버전 간 호환성 검증 테스트

---

## 🔄 다음 단계

Phase 3 완료 후 [Phase 4: 고급 기능 및 완성도](./phase-4-advanced.md)로 진행합니다.

**Phase 4 미리보기:**
- 고급 애니메이션 및 마이크로 인터랙션
- 접근성 및 반응형 최적화
- 성능 최적화 및 번들 최적화