# Phase 6: Advanced Features & Testing

## 목표
프로덕션 준비를 위한 고급 기능들을 구현하고, 포괄적인 테스트 코드를 작성합니다. 성능 최적화, 오류 처리 개선, 테스트 자동화를 완성합니다.

## 전제 조건
- Phase 1-5 모든 단계 완료
- 기본 게임 플로우 정상 동작
- 실시간 통신 안정적으로 작동

## 주요 작업

### 1. 성능 최적화

#### 1.1 React 컴포넌트 최적화

**파일**: `src/utils/performance.ts`

```typescript
import { useCallback, useMemo } from 'react';
import { debounce, throttle } from 'lodash-es';

// 디바운스된 함수 생성 Hook
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  return useMemo(
    () => debounce(callback, delay),
    [callback, delay]
  ) as T;
}

// 스로틀된 함수 생성 Hook
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  return useMemo(
    () => throttle(callback, delay),
    [callback, delay]
  ) as T;
}

// 메모화된 콜백 Hook
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps);
}

// 성능 측정 유틸리티
export class PerformanceTracker {
  private static marks: Map<string, number> = new Map();

  static start(name: string) {
    this.marks.set(name, performance.now());
  }

  static end(name: string): number {
    const start = this.marks.get(name);
    if (!start) {
      console.warn(`Performance mark "${name}" not found`);
      return 0;
    }

    const duration = performance.now() - start;
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    this.marks.delete(name);
    return duration;
  }

  static measure<T>(name: string, fn: () => T): T {
    this.start(name);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }
}
```

#### 1.2 메모화된 컴포넌트들

**파일**: `src/components/game/PlayerList.tsx`

```typescript
import React, { memo } from 'react';
import { Player } from '@/types/game';

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  onPlayerClick?: (playerId: string) => void;
}

export const PlayerList = memo<PlayerListProps>(({
  players,
  currentPlayerId,
  onPlayerClick,
}) => {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          player={player}
          isCurrent={player.id === currentPlayerId}
          onClick={onPlayerClick}
        />
      ))}
    </div>
  );
});

interface PlayerCardProps {
  player: Player;
  isCurrent: boolean;
  onClick?: (playerId: string) => void;
}

const PlayerCard = memo<PlayerCardProps>(({
  player,
  isCurrent,
  onClick,
}) => {
  const handleClick = () => onClick?.(player.id);

  return (
    <div
      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
        isCurrent ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{player.nickname}</div>
          <div className="text-sm text-gray-600">
            {player.isOnline ? '🟢 온라인' : '🔴 오프라인'}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {player.isReady && <span className="text-green-600">✓</span>}
          {player.isHost && <span className="text-blue-600">👑</span>}
        </div>
      </div>
    </div>
  );
});
```

### 2. 고급 오류 처리

#### 2.1 전역 오류 바운더리

**파일**: `src/components/common/ErrorBoundary.tsx` (기존 파일 개선)

```typescript
import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error boundary caught an error:', error, errorInfo);
    
    // 오류 리포팅 서비스에 전송
    this.reportError(error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  private reportError(error: Error, errorInfo: React.ErrorInfo) {
    // 개발 환경에서는 콘솔에만 출력
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Error Boundary Report');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
      return;
    }

    // 프로덕션에서는 에러 리포팅 서비스 사용
    // 예: Sentry, LogRocket 등
    try {
      // window.Sentry?.captureException(error, {
      //   contexts: {
      //     react: {
      //       componentStack: errorInfo.componentStack
      //     }
      //   }
      // });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">오류가 발생했습니다</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    개발자 정보 (클릭하여 펼치기)
                  </summary>
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs font-mono text-red-800 overflow-auto max-h-40">
                    <div className="font-bold">Error:</div>
                    <div>{this.state.error?.toString()}</div>
                    <div className="font-bold mt-2">Component Stack:</div>
                    <div>{this.state.errorInfo?.componentStack}</div>
                  </div>
                </details>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex-1"
                >
                  다시 시도
                </Button>
                <Button 
                  onClick={this.handleReload}
                  className="flex-1"
                >
                  페이지 새로고침
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### 2.2 네트워크 오류 처리 개선

**파일**: `src/services/api.ts` (기존 파일 개선)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useToast } from '@/hooks/useToast';

// 재시도 설정
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: any) => boolean;
}

class ApiService {
  private client: AxiosInstance;
  private defaultRetryConfig: RetryConfig = {
    retries: 3,
    retryDelay: 1000,
    retryCondition: (error) => {
      // 네트워크 오류나 5xx 서버 오류만 재시도
      return !error.response || (error.response.status >= 500);
    }
  };

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080/api/v1',
      timeout: 10000,
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        // 요청 시작 시간 기록
        (config as any).__startTime = Date.now();
        
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        // 응답 시간 계산
        const duration = Date.now() - (response.config as any).__startTime;
        console.log(`📥 API Response: ${response.status} ${response.config.url} (${duration}ms)`);
        
        return response;
      },
      async (error) => {
        const duration = Date.now() - (error.config?.__startTime || Date.now());
        console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url} (${duration}ms)`, {
          status: error.response?.status,
          message: error.response?.data?.message || error.message,
        });

        // 재시도 로직
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        // 특별한 오류 처리
        await this.handleSpecialErrors(error);
        
        return Promise.reject(error);
      }
    );
  }

  private shouldRetry(error: any): boolean {
    const config = error.config;
    if (!config || config.__isRetryRequest) return false;
    
    return this.defaultRetryConfig.retryCondition(error) &&
           (config.__retryCount || 0) < this.defaultRetryConfig.retries;
  }

  private async retryRequest(error: any) {
    const config = error.config;
    config.__isRetryRequest = true;
    config.__retryCount = (config.__retryCount || 0) + 1;

    console.log(`🔄 Retrying request (${config.__retryCount}/${this.defaultRetryConfig.retries}): ${config.url}`);

    // 지연 후 재시도
    await new Promise(resolve => 
      setTimeout(resolve, this.defaultRetryConfig.retryDelay * config.__retryCount)
    );

    return this.client.request(config);
  }

  private async handleSpecialErrors(error: any) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    switch (status) {
      case 401:
        console.warn('🔐 Unauthorized - redirecting to login');
        // 로그인 페이지로 리다이렉트 (이미 인터셉터에서 처리)
        break;
        
      case 403:
        console.warn('🚫 Forbidden access');
        this.showErrorToast('접근 권한이 없습니다', message);
        break;
        
      case 404:
        console.warn('🔍 Resource not found');
        this.showErrorToast('리소스를 찾을 수 없습니다', message);
        break;
        
      case 409:
        console.warn('⚠️ Conflict error');
        this.showErrorToast('요청 충돌', message);
        break;
        
      case 429:
        console.warn('🐌 Rate limited');
        this.showErrorToast('요청이 너무 많습니다', '잠시 후 다시 시도해주세요');
        break;
        
      case 500:
        console.error('🔥 Server error');
        this.showErrorToast('서버 오류', '잠시 후 다시 시도해주세요');
        break;
        
      default:
        if (!error.response) {
          console.error('🌐 Network error');
          this.showErrorToast('네트워크 오류', '인터넷 연결을 확인해주세요');
        }
    }
  }

  private showErrorToast(title: string, description: string) {
    // Toast는 컴포넌트 외부에서 사용할 수 없으므로 이벤트로 처리
    window.dispatchEvent(new CustomEvent('api-error', {
      detail: { title, description }
    }));
  }

  // 기존 메서드들은 그대로 유지...
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config).then(response => response.data);
  }

  // ... 나머지 메서드들
}

export const apiService = new ApiService();
```

### 3. 포괄적인 테스트 구현

#### 3.1 단위 테스트

**파일**: `src/services/__tests__/gameService.test.ts` (개선)

```typescript
import { gameService } from '../gameService';
import { apiService } from '../api';
import { CreateGameRequest } from '../../types/api';

jest.mock('../api');
const mockedApiService = apiService as jest.Mocked<typeof apiService>;

describe('GameService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGame', () => {
    const mockGameConfig: CreateGameRequest = {
      gameParticipants: 6,
      gameLiarCount: 1,
      gameTotalRounds: 3,
      gameMode: 'LIARS_KNOW',
      subjectIds: [1, 2, 3],
      useRandomSubjects: true,
      randomSubjectCount: 2,
      targetPoints: 10,
    };

    it('should create game successfully', async () => {
      const mockGameNumber = 123;
      mockedApiService.post.mockResolvedValue(mockGameNumber);

      const result = await gameService.createGame(mockGameConfig);

      expect(result).toBe(mockGameNumber);
      expect(mockedApiService.post).toHaveBeenCalledWith('/game/create', mockGameConfig);
    });

    it('should handle game creation failure', async () => {
      const mockError = new Error('Server error');
      mockedApiService.post.mockRejectedValue(mockError);

      await expect(gameService.createGame(mockGameConfig)).rejects.toThrow('Server error');
      expect(mockedApiService.post).toHaveBeenCalledWith('/game/create', mockGameConfig);
    });

    it('should validate game configuration', async () => {
      const invalidConfig = { ...mockGameConfig, gameParticipants: 0 };
      mockedApiService.post.mockRejectedValue(new Error('Invalid configuration'));

      await expect(gameService.createGame(invalidConfig)).rejects.toThrow('Invalid configuration');
    });
  });

  describe('joinGame', () => {
    it('should join game successfully', async () => {
      const mockGameState = {
        gameNumber: 123,
        gameOwner: 'testHost',
        players: [],
        gameState: 'WAITING' as const,
        currentPhase: 'WAITING_FOR_PLAYERS' as const,
      };
      mockedApiService.post.mockResolvedValue(mockGameState);

      const result = await gameService.joinGame({ gameNumber: 123 });

      expect(result).toEqual(mockGameState);
      expect(mockedApiService.post).toHaveBeenCalledWith('/game/join', { gameNumber: 123 });
    });

    it('should handle room full error', async () => {
      const mockError = new Error('Room is full');
      mockedApiService.post.mockRejectedValue(mockError);

      await expect(gameService.joinGame({ gameNumber: 123 })).rejects.toThrow('Room is full');
    });
  });

  describe('getActiveRooms', () => {
    it('should fetch active rooms', async () => {
      const mockRooms = {
        gameRooms: [
          { gameNumber: 123, gameOwner: 'host1', gameState: 'WAITING' as const },
          { gameNumber: 456, gameOwner: 'host2', gameState: 'IN_PROGRESS' as const },
        ]
      };
      mockedApiService.get.mockResolvedValue(mockRooms);

      const result = await gameService.getActiveRooms();

      expect(result).toEqual(mockRooms);
      expect(mockedApiService.get).toHaveBeenCalledWith('/game/rooms');
    });

    it('should handle empty rooms list', async () => {
      const emptyRooms = { gameRooms: [] };
      mockedApiService.get.mockResolvedValue(emptyRooms);

      const result = await gameService.getActiveRooms();

      expect(result.gameRooms).toHaveLength(0);
    });
  });
});
```

#### 3.2 통합 테스트

**파일**: `src/__tests__/integration/gameFlow.test.ts`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GamePage from '../../versions/main/pages/GamePage';
import { useGameStore } from '../../store/gameStore';
import { websocketService } from '../../services/websocketService';

// Mock WebSocket service
jest.mock('../../services/websocketService');
jest.mock('../../services/gameService');

const mockWebSocketService = websocketService as jest.Mocked<typeof websocketService>;

describe('Game Flow Integration', () => {
  const mockGameState = {
    gameNumber: 123,
    gamePhase: 'WAITING_FOR_PLAYERS' as const,
    players: [
      {
        id: '1',
        nickname: 'Player1',
        isHost: true,
        isReady: true,
        isOnline: true,
        isAlive: true,
      },
    ],
    currentPlayer: {
      id: '1',
      nickname: 'Player1',
      isHost: true,
      isReady: true,
      isOnline: true,
    },
  };

  beforeEach(() => {
    // Reset store state
    useGameStore.setState({
      ...mockGameState,
      isLoading: false,
      error: null,
    });

    // Mock WebSocket methods
    mockWebSocketService.connect.mockResolvedValue();
    mockWebSocketService.isConnected.mockReturnValue(true);
    mockWebSocketService.getConnectionState.mockReturnValue('connected');
  });

  it('should display game waiting state', async () => {
    render(
      <BrowserRouter>
        <GamePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('게임방 123')).toBeInTheDocument();
      expect(screen.getByText('플레이어 대기 중...')).toBeInTheDocument();
    });
  });

  it('should handle phase transitions', async () => {
    render(
      <BrowserRouter>
        <GamePage />
      </BrowserRouter>
    );

    // Simulate phase change to SPEECH
    act(() => {
      useGameStore.setState({
        ...mockGameState,
        gamePhase: 'SPEECH',
        currentTopic: '동물',
        currentWord: '강아지',
        currentTurnPlayerId: '1',
      });
    });

    await waitFor(() => {
      expect(screen.getByText('힌트 제공 단계')).toBeInTheDocument();
      expect(screen.getByText('동물')).toBeInTheDocument();
      expect(screen.getByText('강아지')).toBeInTheDocument();
    });
  });

  it('should handle WebSocket connection states', async () => {
    // Start with disconnected state
    mockWebSocketService.isConnected.mockReturnValue(false);
    mockWebSocketService.getConnectionState.mockReturnValue('disconnected');

    render(
      <BrowserRouter>
        <GamePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('연결 끊김')).toBeInTheDocument();
    });

    // Simulate reconnection
    act(() => {
      mockWebSocketService.isConnected.mockReturnValue(true);
      mockWebSocketService.getConnectionState.mockReturnValue('connected');
    });

    // Re-render component (would normally happen via state change)
    render(
      <BrowserRouter>
        <GamePage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('연결됨')).toBeInTheDocument();
    });
  });
});
```

#### 3.3 E2E 테스트 (Playwright)

**파일**: `tests/e2e/multiplayer.spec.ts`

```typescript
import { test, expect, Page } from '@playwright/test';

test.describe('Multiplayer Game Flow', () => {
  let host: Page;
  let player: Page;

  test.beforeEach(async ({ browser }) => {
    // Create two browser contexts for two players
    const hostContext = await browser.newContext();
    const playerContext = await browser.newContext();
    
    host = await hostContext.newPage();
    player = await playerContext.newPage();
  });

  test('should complete full multiplayer game', async () => {
    // Host logs in and creates game
    await host.goto('/login');
    await host.fill('[data-testid="nickname-input"]', 'Host');
    await host.fill('[data-testid="password-input"]', 'password123');
    await host.click('[data-testid="login-button"]');
    
    await host.waitForURL('/lobby');
    await host.click('[data-testid="create-game-button"]');
    await host.fill('[data-testid="game-name-input"]', 'Test Game');
    await host.click('[data-testid="create-button"]');

    // Get game number from URL
    await host.waitForURL(/\/game\/\d+/);
    const gameUrl = host.url();
    const gameNumber = gameUrl.match(/\/game\/(\d+)/)?.[1];
    expect(gameNumber).toBeTruthy();

    // Player logs in and joins game
    await player.goto('/login');
    await player.fill('[data-testid="nickname-input"]', 'Player2');
    await player.fill('[data-testid="password-input"]', 'password123');
    await player.click('[data-testid="login-button"]');
    
    await player.goto(`/game/${gameNumber}`);

    // Verify both players see each other
    await expect(host.locator('[data-testid="player-list"]')).toContainText('Host');
    await expect(host.locator('[data-testid="player-list"]')).toContainText('Player2');
    await expect(player.locator('[data-testid="player-list"]')).toContainText('Host');
    await expect(player.locator('[data-testid="player-list"]')).toContainText('Player2');

    // Host starts the game
    await host.click('[data-testid="start-game-button"]');

    // Verify game phase changes
    await expect(host.locator('[data-testid="game-phase"]')).toContainText('SPEECH');
    await expect(player.locator('[data-testid="game-phase"]')).toContainText('SPEECH');

    // Test hint submission
    const isHostTurn = await host.locator('[data-testid="hint-input"]').isVisible();
    const isPlayerTurn = await player.locator('[data-testid="hint-input"]').isVisible();

    if (isHostTurn) {
      await host.fill('[data-testid="hint-input"]', 'Four legs');
      await host.click('[data-testid="submit-hint-button"]');
      
      // Verify turn changes
      await expect(player.locator('[data-testid="hint-input"]')).toBeVisible();
    } else {
      await player.fill('[data-testid="hint-input"]', 'Cute animal');
      await player.click('[data-testid="submit-hint-button"]');
      
      await expect(host.locator('[data-testid="hint-input"]')).toBeVisible();
    }

    // Continue testing voting, defense, etc.
    // This would be a comprehensive test covering the entire game flow
  });

  test('should handle connection issues gracefully', async () => {
    // Test network disconnection and reconnection
    await host.goto('/login');
    await host.fill('[data-testid="nickname-input"]', 'Host');
    await host.fill('[data-testid="password-input"]', 'password123');
    await host.click('[data-testid="login-button"]');
    
    await host.goto('/game/123');

    // Simulate network disconnection
    await host.context().setOffline(true);
    
    // Verify disconnection state
    await expect(host.locator('[data-testid="connection-status"]')).toContainText('연결 끊김');

    // Restore connection
    await host.context().setOffline(false);

    // Verify reconnection
    await expect(host.locator('[data-testid="connection-status"]')).toContainText('연결됨');
  });
});
```

### 4. 성능 모니터링

**파일**: `src/utils/monitoring.ts`

```typescript
// 성능 메트릭 수집
export class PerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(value);
  }

  static getMetrics(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
    };
  }

  static logAllMetrics() {
    console.group('📊 Performance Metrics');
    this.metrics.forEach((_, name) => {
      const stats = this.getMetrics(name);
      if (stats) {
        console.log(`${name}:`, stats);
      }
    });
    console.groupEnd();
  }
}

// WebSocket 연결 시간 측정
export function measureWebSocketConnection() {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    PerformanceMonitor.recordMetric('websocket_connection_time', duration);
  };
}

// API 응답 시간 측정
export function measureApiResponse(endpoint: string) {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    PerformanceMonitor.recordMetric(`api_response_${endpoint}`, duration);
  };
}
```

### 5. 프로덕션 설정

#### 5.1 환경별 설정 파일

**파일**: `src/config/environment.ts`

```typescript
interface EnvironmentConfig {
  API_BASE_URL: string;
  WS_URL: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_PERFORMANCE_MONITORING: boolean;
  WEBSOCKET_RECONNECT_ATTEMPTS: number;
  API_TIMEOUT: number;
}

const development: EnvironmentConfig = {
  API_BASE_URL: 'http://localhost:8080/api/v1',
  WS_URL: 'http://localhost:8080/ws',
  LOG_LEVEL: 'debug',
  ENABLE_PERFORMANCE_MONITORING: true,
  WEBSOCKET_RECONNECT_ATTEMPTS: 5,
  API_TIMEOUT: 10000,
};

const production: EnvironmentConfig = {
  API_BASE_URL: process.env.REACT_APP_API_BASE_URL || '',
  WS_URL: process.env.REACT_APP_WS_URL || '',
  LOG_LEVEL: 'error',
  ENABLE_PERFORMANCE_MONITORING: false,
  WEBSOCKET_RECONNECT_ATTEMPTS: 3,
  API_TIMEOUT: 5000,
};

const test: EnvironmentConfig = {
  API_BASE_URL: 'http://localhost:3001/api/v1',
  WS_URL: 'http://localhost:3001/ws',
  LOG_LEVEL: 'warn',
  ENABLE_PERFORMANCE_MONITORING: false,
  WEBSOCKET_RECONNECT_ATTEMPTS: 1,
  API_TIMEOUT: 5000,
};

const configs = { development, production, test };

export const config = configs[process.env.NODE_ENV as keyof typeof configs] || development;
```

#### 5.2 빌드 최적화

**파일**: `package.json` (스크립트 추가)

```json
{
  "scripts": {
    "build": "vite build",
    "build:analyze": "vite build && npx vite-bundle-analyzer dist",
    "build:profile": "vite build --mode profile",
    "test": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:all": "npm run test && npm run test:e2e",
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "typecheck": "tsc --noEmit"
  }
}
```

## 검증 체크리스트

### ✅ 성능 최적화
- [ ] React 컴포넌트 메모화 적용
- [ ] 불필요한 리렌더링 제거
- [ ] API 요청 최적화 (debounce, throttle)
- [ ] 번들 크기 분석 및 최적화

### ✅ 테스트 커버리지
- [ ] 단위 테스트 80% 이상
- [ ] 통합 테스트 주요 플로우 커버
- [ ] E2E 테스트 핵심 시나리오 커버
- [ ] 오류 시나리오 테스트

### ✅ 프로덕션 준비
- [ ] 환경별 설정 분리
- [ ] 오류 리포팅 시스템 연동
- [ ] 성능 모니터링 구현
- [ ] 보안 설정 강화

### ✅ 품질 보증
- [ ] TypeScript 타입 안정성
- [ ] ESLint/Prettier 규칙 준수
- [ ] 접근성 기준 만족
- [ ] 브라우저 호환성 확인

## 성공 기준

Phase 6가 성공적으로 완료되면:
- ✅ 프로덕션 배포 가능한 안정성
- ✅ 포괄적인 테스트 커버리지
- ✅ 성능 최적화 완료
- ✅ 체계적인 오류 처리
- ✅ 모니터링 시스템 구축

**🎉 전체 프로젝트 통합 완료!**

모든 Phase가 완료되면 실제 게임플레이가 가능한 완전한 시스템이 준비됩니다.