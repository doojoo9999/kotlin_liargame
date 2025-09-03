# Phase 5: 테스트 및 배포 단계

> **목표**: 종합적인 테스트를 수행하고 안정적인 배포 환경을 구축하여 Main Version의 완전한 서비스 준비를 완료합니다.

**예상 소요시간**: 2-3일  
**선행 조건**: [Phase 4: 고급 기능 및 완성도](./phase-4-advanced.md) 완료  
**다음 단계**: 서비스 배포 및 운영

---

## 🧪 Step 5.1: 종합 테스트 및 검증

### 📋 프롬프트

```markdown
# 종합 테스트 및 검증

## 목표
단위 테스트, 통합 테스트, E2E 테스트를 포괄하는 종합적인 테스트 스위트를 구축하고, 모든 기능의 안정성을 검증합니다.

## 테스트 아키텍처

### A. 단위 테스트 (Jest + Testing Library)
```typescript
// tests/unit/components/PlayerCard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlayerCard } from '../../../versions/main/components/PlayerCard';
import { Player } from '../../../shared/types/game.types';

const mockPlayer: Player = {
  id: 1,
  userId: 123,
  nickname: 'TestPlayer',
  isAlive: true,
  state: 'WAITING',
  votesReceived: 0,
  hasVoted: false,
  joinedAt: '2024-01-01T00:00:00Z'
};

describe('PlayerCard', () => {
  it('should render player information correctly', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('생존')).toBeInTheDocument();
  });

  it('should handle vote action', async () => {
    const mockOnVote = jest.fn();
    render(
      <PlayerCard 
        player={mockPlayer} 
        onVote={mockOnVote}
        gamePhase="LIAR_SELECTION"
      />
    );
    
    const voteButton = screen.getByRole('button', { name: /투표하기/i });
    fireEvent.click(voteButton);
    
    await waitFor(() => {
      expect(mockOnVote).toHaveBeenCalledWith(mockPlayer.id);
    });
  });

  it('should be accessible via keyboard', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabindex', '0');
    
    fireEvent.keyDown(card, { key: 'Enter' });
    // 키보드 이벤트 처리 확인
  });

  it('should announce screen reader information', () => {
    render(<PlayerCard player={mockPlayer} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label');
    expect(card.getAttribute('aria-label')).toContain('TestPlayer');
    expect(card.getAttribute('aria-label')).toContain('생존');
  });
});
```

### B. 통합 테스트
```typescript
// tests/integration/GameFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GamePlayPage } from '../../versions/main/pages/GamePlayPage';
import { mockWebSocketServer } from '../mocks/websocket';
import { mockApiServer } from '../mocks/api';

describe('Game Flow Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }
    });
    mockApiServer.listen();
    mockWebSocketServer.listen();
  });

  afterEach(() => {
    mockApiServer.resetHandlers();
    mockWebSocketServer.close();
  });

  it('should complete full game flow', async () => {
    // 게임 시작부터 종료까지 전체 플로우 테스트
    render(
      <QueryClientProvider client={queryClient}>
        <GamePlayPage gameId="test-game-1" />
      </QueryClientProvider>
    );

    // 1. 게임 로딩 확인
    await waitFor(() => {
      expect(screen.getByText('게임 로딩 중...')).toBeInTheDocument();
    });

    // 2. 게임 보드 렌더링 확인
    await waitFor(() => {
      expect(screen.getByText('힌트 제공 단계')).toBeInTheDocument();
    });

    // 3. 힌트 제공 테스트
    const hintInput = screen.getByPlaceholderText('힌트를 입력하세요');
    fireEvent.change(hintInput, { target: { value: '테스트 힌트' } });
    
    const submitButton = screen.getByText('힌트 제출');
    fireEvent.click(submitButton);

    // 4. 단계 전환 확인
    await waitFor(() => {
      expect(screen.getByText('토론 단계')).toBeInTheDocument();
    });

    // 5. 투표 단계 테스트
    // ... 각 단계별 상호작용 테스트
  });

  it('should handle websocket disconnection', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <GamePlayPage gameId="test-game-1" />
      </QueryClientProvider>
    );

    // WebSocket 연결 끊기 시뮬레이션
    mockWebSocketServer.disconnect();

    await waitFor(() => {
      expect(screen.getByText('연결이 끊어졌습니다')).toBeInTheDocument();
    });

    // 재연결 시도 확인
    const reconnectButton = screen.getByText('다시 연결');
    fireEvent.click(reconnectButton);

    await waitFor(() => {
      expect(screen.getByText('연결됨')).toBeInTheDocument();
    });
  });
});
```

### C. E2E 테스트 (Playwright)
```typescript
// tests/e2e/game-complete-flow.spec.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Complete Game Flow', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // 접근성 테스트 자동화 설정
    await page.addScriptTag({
      path: require.resolve('axe-core/axe.min.js')
    });
  });

  test('should complete full multiplayer game', async () => {
    // 1. 게임방 생성
    await page.goto('/main/lobby');
    await page.click('[data-testid="create-room-button"]');
    await page.fill('[data-testid="room-title-input"]', 'E2E Test Room');
    await page.click('[data-testid="create-button"]');

    // 2. 다른 플레이어 시뮬레이션 (별도 브라우저 컨텍스트)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    const roomUrl = page.url();
    await page2.goto(roomUrl);
    await page2.click('[data-testid="join-room-button"]');

    // 3. 게임 시작
    await page.click('[data-testid="start-game-button"]');
    
    // 4. 힌트 제공 단계
    await page.waitForSelector('[data-testid="hint-input"]');
    await page.fill('[data-testid="hint-input"]', 'E2E 테스트 힌트');
    await page.click('[data-testid="submit-hint-button"]');

    // 5. 다른 플레이어도 힌트 제공
    await page2.waitForSelector('[data-testid="hint-input"]');
    await page2.fill('[data-testid="hint-input"]', '다른 플레이어 힌트');
    await page2.click('[data-testid="submit-hint-button"]');

    // 6. 토론 단계 확인
    await page.waitForSelector('[data-testid="discussion-phase"]');
    await expect(page.locator('[data-testid="phase-indicator"]')).toContainText('토론 단계');

    // 7. 투표 단계
    await page.waitForSelector('[data-testid="voting-phase"]');
    await page.click('[data-testid="vote-player-2"]');
    await page2.click('[data-testid="vote-player-1"]');

    // 8. 게임 결과 확인
    await page.waitForSelector('[data-testid="game-result"]');
    await expect(page.locator('[data-testid="game-result"]')).toBeVisible();
  });

  test('should be accessible', async () => {
    await page.goto('/main/lobby');
    
    // axe-core로 접근성 테스트
    const accessibilityScanResults = await page.evaluate(() => {
      return new Promise((resolve) => {
        // @ts-ignore
        axe.run((err, results) => {
          if (err) throw err;
          resolve(results);
        });
      });
    });

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should work on mobile devices', async () => {
    // 모바일 viewport 설정
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/main/lobby');
    
    // 모바일에서 햄버거 메뉴 테스트
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // 터치 제스처 테스트
    await page.touchscreen.tap(100, 100);
    
    // 스와이프 제스처 테스트
    await page.touchscreen.swipe(
      { x: 100, y: 300 }, 
      { x: 300, y: 300 }
    );
  });
});
```

### D. 성능 테스트
```typescript
// tests/performance/performance.test.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should meet performance benchmarks', async ({ page }) => {
    // 성능 메트릭 측정 시작
    await page.goto('/main/lobby', { waitUntil: 'networkidle' });
    
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        // Core Web Vitals
        TTFB: navigation.responseStart - navigation.requestStart,
        FCP: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        LCP: 0, // 별도 측정 필요
        CLS: 0, // 별도 측정 필요
        
        // 추가 메트릭
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalPageLoad: navigation.loadEventEnd - navigation.navigationStart
      };
    });

    // 성능 기준 검증
    expect(performanceMetrics.TTFB).toBeLessThan(200); // 200ms 이하
    expect(performanceMetrics.FCP).toBeLessThan(1500); // 1.5초 이하
    expect(performanceMetrics.totalPageLoad).toBeLessThan(3000); // 3초 이하
  });

  test('should handle large player counts', async ({ page }) => {
    // 대규모 플레이어 목록 렌더링 성능 테스트
    await page.goto('/main/test-large-game');
    
    const startTime = Date.now();
    
    // 100명 플레이어 추가
    await page.evaluate(() => {
      // 테스트용 대량 플레이어 데이터 추가
      window.testAddPlayers(100);
    });
    
    await page.waitForSelector('[data-testid="player-list"]');
    
    const renderTime = Date.now() - startTime;
    expect(renderTime).toBeLessThan(1000); // 1초 이하 렌더링
    
    // 스크롤 성능 테스트
    const scrollStartTime = Date.now();
    await page.mouse.wheel(0, 1000); // 스크롤
    await page.waitForTimeout(100);
    
    const scrollTime = Date.now() - scrollStartTime;
    expect(scrollTime).toBeLessThan(100); // 부드러운 스크롤
  });
});
```

### E. 시각적 회귀 테스트
```typescript
// tests/visual/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('should match component screenshots', async ({ page }) => {
    await page.goto('/main/storybook/playercard');
    
    // 컴포넌트별 스크린샷 비교
    await expect(page.locator('[data-testid="player-card-normal"]')).toHaveScreenshot('player-card-normal.png');
    await expect(page.locator('[data-testid="player-card-current-turn"]')).toHaveScreenshot('player-card-current-turn.png');
    await expect(page.locator('[data-testid="player-card-eliminated"]')).toHaveScreenshot('player-card-eliminated.png');
  });

  test('should maintain consistent game board layout', async ({ page }) => {
    await page.goto('/main/game/test-game');
    
    // 다양한 viewport에서 레이아웃 일관성 확인
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 } // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500); // 레이아웃 안정화
      
      await expect(page.locator('[data-testid="game-board"]')).toHaveScreenshot(`game-board-${viewport.width}x${viewport.height}.png`);
    }
  });
});
```

## 테스트 자동화 설정

### A. CI/CD 파이프라인 테스트
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm run test:integration
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run test:e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      - run: npm run test:performance
      
      # 성능 결과를 PR 코멘트로 추가
      - uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(fs.readFileSync('performance-results.json', 'utf8'));
            // PR에 성능 결과 코멘트 추가
```

### B. 테스트 설정 파일
```typescript
// jest.config.js
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest-setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@main/(.*)$': '<rootDir>/src/versions/main/$1',
    '^@light/(.*)$': '<rootDir>/src/versions/light/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/tests/**/*',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 출력 요구사항
1. 80% 이상의 코드 커버리지를 달성하는 종합 테스트 스위트
2. 모든 사용자 시나리오를 커버하는 E2E 테스트
3. 성능 벤치마크 및 회귀 방지 테스트
4. 접근성 자동화 테스트
5. CI/CD 통합된 자동화 테스트 파이프라인
```

### ✅ 완료 기준
- [ ] 단위 테스트 80% 커버리지 달성
- [ ] 통합 테스트 모든 시나리오 커버
- [ ] E2E 테스트 주요 플로우 검증 완료
- [ ] 성능 테스트 기준 달성
- [ ] 접근성 테스트 통과

---

## 🚀 Step 5.2: 배포 준비 및 최종 최적화

### 📋 프롬프트

```markdown
# 배포 준비 및 최종 최적화

## 목표
프로덕션 환경을 위한 최적화를 완료하고, 안정적인 배포 파이프라인을 구축합니다.

## 프로덕션 최적화

### A. 빌드 최적화
```typescript
// config/vite.prod.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { compression } from 'vite-plugin-compression';

export default defineConfig({
  plugins: [
    react({
      // React 최적화
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }],
          ['babel-plugin-styled-components', { displayName: false }],
        ],
      },
    }),
    
    // Gzip 압축
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    
    // Brotli 압축
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    
    // 번들 분석
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
    }),
  ],
  
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 프로덕션에서는 소스맵 제거
    
    rollupOptions: {
      output: {
        manualChunks: {
          // 벤더 청크 분리
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-toast'],
          animations: ['framer-motion'],
          utils: ['clsx', 'class-variance-authority'],
        },
        
        // 청크 파일명 최적화
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name!.split('.').pop()!;
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `images/[name]-[hash][extname]`;
          }
          if (/css/i.test(extType)) {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
      },
    },
    
    // 청크 크기 경고 임계값
    chunkSizeWarningLimit: 1000,
    
    // 미니파이 설정
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // console.log 제거
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
      mangle: true,
    },
  },
  
  // CSS 최적화
  css: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
        require('cssnano')({
          preset: ['default', {
            discardComments: { removeAll: true },
            mergeRules: true,
            minifySelectors: true,
          }],
        }),
      ],
    },
  },
});
```

### B. 환경별 설정 관리
```typescript
// config/environment.ts
export interface EnvironmentConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  websocket: {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
  };
  features: {
    enableAnimations: boolean;
    enableAnalytics: boolean;
    enableErrorReporting: boolean;
    debugMode: boolean;
  };
  performance: {
    enableServiceWorker: boolean;
    enableLazyLoading: boolean;
    enableVirtualization: boolean;
  };
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    api: {
      baseUrl: 'http://localhost:8080',
      timeout: 10000,
      retryAttempts: 3,
    },
    websocket: {
      url: 'ws://localhost:8080/ws',
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
    },
    features: {
      enableAnimations: true,
      enableAnalytics: false,
      enableErrorReporting: false,
      debugMode: true,
    },
    performance: {
      enableServiceWorker: false,
      enableLazyLoading: true,
      enableVirtualization: false,
    },
  },
  
  staging: {
    api: {
      baseUrl: 'https://api-staging.liargame.com',
      timeout: 8000,
      retryAttempts: 3,
    },
    websocket: {
      url: 'wss://api-staging.liargame.com/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
    },
    features: {
      enableAnimations: true,
      enableAnalytics: true,
      enableErrorReporting: true,
      debugMode: false,
    },
    performance: {
      enableServiceWorker: true,
      enableLazyLoading: true,
      enableVirtualization: true,
    },
  },
  
  production: {
    api: {
      baseUrl: 'https://api.liargame.com',
      timeout: 8000,
      retryAttempts: 5,
    },
    websocket: {
      url: 'wss://api.liargame.com/ws',
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
    },
    features: {
      enableAnimations: true,
      enableAnalytics: true,
      enableErrorReporting: true,
      debugMode: false,
    },
    performance: {
      enableServiceWorker: true,
      enableLazyLoading: true,
      enableVirtualization: true,
    },
  },
};

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const env = import.meta.env.VITE_APP_ENV || 'development';
  return environments[env] || environments.development;
};
```

### C. 서비스 워커 구현
```typescript
// public/sw.js
const CACHE_NAME = 'liargame-main-v1.0.0';
const STATIC_CACHE = 'static-v1.0.0';
const DYNAMIC_CACHE = 'dynamic-v1.0.0';

const STATIC_FILES = [
  '/',
  '/main',
  '/main/lobby',
  '/static/js/vendor.js',
  '/static/css/main.css',
  '/images/logo.png',
  '/fonts/pretendard-variable.woff2',
];

const DYNAMIC_CACHE_LIMIT = 50;

// 설치 이벤트
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_FILES);
    })
  );
  self.skipWaiting();
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API 요청은 캐싱하지 않음
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/ws/')) {
    return;
  }

  // Static 파일들
  if (STATIC_FILES.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 동적 콘텐츠
  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

// Cache First 전략
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    return new Response('Offline content not available', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// Network First 전략
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(cacheName);
    
    // 동적 캐시 크기 제한
    limitCacheSize(cache, DYNAMIC_CACHE_LIMIT);
    
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Content not available offline', {
      status: 503,
      statusText: 'Service Unavailable',
    });
  }
}

// 캐시 크기 제한 함수
async function limitCacheSize(cache, maxSize) {
  const keys = await cache.keys();
  if (keys.length > maxSize) {
    const oldestKey = keys[0];
    await cache.delete(oldestKey);
    limitCacheSize(cache, maxSize);
  }
}
```

### D. 모니터링 및 에러 추적
```typescript
// shared/monitoring/error-tracking.ts
export class ErrorTrackingService {
  private isProduction = import.meta.env.PROD;
  private userId: string | null = null;
  private sessionId: string = this.generateSessionId();

  constructor() {
    this.setupGlobalErrorHandlers();
    this.setupUnhandledRejectionHandler();
    this.setupPerformanceMonitoring();
  }

  setUser(userId: string) {
    this.userId = userId;
  }

  trackError(error: Error, context?: Record<string, any>) {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: this.userId,
      sessionId: this.sessionId,
      context,
    };

    // 프로덕션에서만 외부 서비스로 전송
    if (this.isProduction) {
      this.sendToErrorService(errorData);
    } else {
      console.error('Error tracked:', errorData);
    }
  }

  trackPerformance(metric: string, value: number) {
    const performanceData = {
      metric,
      value,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.userId,
      sessionId: this.sessionId,
    };

    if (this.isProduction) {
      this.sendToAnalyticsService(performanceData);
    }
  }

  private setupGlobalErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.trackError(event.error, {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });
  }

  private setupUnhandledRejectionHandler() {
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        { type: 'promise' }
      );
    });
  }

  private setupPerformanceMonitoring() {
    // Core Web Vitals 모니터링
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.trackPerformance('LCP', entry.startTime);
          }
          if (entry.entryType === 'first-input') {
            this.trackPerformance('FID', entry.processingStart - entry.startTime);
          }
        }
      });

      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
    }
  }

  private sendToErrorService(errorData: any) {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorData),
    }).catch(() => {
      // 에러 서비스 전송 실패 시 로컬 스토리지에 저장
      const errors = JSON.parse(localStorage.getItem('pending_errors') || '[]');
      errors.push(errorData);
      localStorage.setItem('pending_errors', JSON.stringify(errors.slice(-10))); // 최대 10개
    });
  }

  private sendToAnalyticsService(performanceData: any) {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(performanceData),
    }).catch(() => {});
  }

  private generateSessionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
```

## 배포 파이프라인

### A. Docker 컨테이너화
```dockerfile
# Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm ci --only=production

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# Nginx 서버
FROM nginx:alpine

# 빌드된 파일 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 설정
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### B. Nginx 설정
```nginx
# nginx.conf
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    # Gzip 압축
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;
    
    # 브라우저 캐싱
    map $sent_http_content_type $expires {
        default                    off;
        text/html                  epoch;
        text/css                   max;
        application/javascript     max;
        ~image/                    1M;
        ~font/                     1M;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        expires $expires;
        
        # 보안 헤더
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        
        # SPA 라우팅
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }
        
        # API 프록시
        location /api/ {
            proxy_pass http://backend-service:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        # WebSocket 프록시
        location /ws/ {
            proxy_pass http://backend-service:8080;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }
        
        # 정적 파일 캐싱
        location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### C. 배포 자동화
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ secrets.REGISTRY_URL }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ secrets.REGISTRY_URL }}/liargame-frontend:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Deploy to Kubernetes
        run: |
          # Kubernetes 배포 스크립트
          kubectl set image deployment/frontend-deployment \
            frontend=${{ secrets.REGISTRY_URL }}/liargame-frontend:${{ github.sha }}
          kubectl rollout status deployment/frontend-deployment
```

## 출력 요구사항
1. 완전히 최적화된 프로덕션 빌드
2. 환경별 설정 관리 시스템
3. 서비스 워커를 통한 오프라인 지원
4. 실시간 모니터링 및 에러 추적 시스템
5. 자동화된 배포 파이프라인
6. 도커 컨테이너화된 배포 환경
```

### ✅ 완료 기준
- [ ] 프로덕션 빌드 최적화 완료
- [ ] 환경별 설정 시스템 완성
- [ ] 서비스 워커 구현 완료
- [ ] 모니터링 시스템 구축 완료
- [ ] 배포 파이프라인 완성

---

## 🎯 Phase 5 완료 체크리스트

### 필수 완료사항
- [ ] **테스트 커버리지**: 80% 이상 단위/통합 테스트 완성
- [ ] **E2E 테스트**: 모든 사용자 시나리오 검증 완료
- [ ] **성능 최적화**: 프로덕션 레벨 성능 달성
- [ ] **배포 준비**: 완전 자동화된 배포 파이프라인
- [ ] **모니터링**: 실시간 에러 추적 및 성능 모니터링

### 산출물
1. **테스트 스위트**: 종합적인 자동화 테스트 시스템
2. **성능 리포트**: 최적화 전후 성능 비교 분석
3. **배포 시스템**: 완전 자동화된 CI/CD 파이프라인
4. **모니터링 대시보드**: 실시간 애플리케이션 상태 모니터링
5. **운영 가이드**: 배포 및 운영을 위한 상세 가이드

---

## 🎉 전체 프로젝트 완료

**축하합니다!** 라이어 게임 Main Version 개발이 완료되었습니다.

### 최종 달성 목표
- ✅ **듀얼 버전 시스템**: Light/Main 버전 완벽 공존
- ✅ **현대적 UI/UX**: Radix UI + shadcn/ui + Framer Motion
- ✅ **최적화된 성능**: 60fps 애니메이션 및 빠른 로딩
- ✅ **접근성**: WCAG 2.1 AA 수준 웹 접근성
- ✅ **테스트 커버리지**: 80% 이상 종합 테스트
- ✅ **자동화 배포**: 완전한 CI/CD 파이프라인

**총 개발 기간**: 19-26일  
**품질 보증**: 프로덕션 준비 완료