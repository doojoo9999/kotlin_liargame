# Testing and Deployment Strategy

## 8. Comprehensive Testing Strategy

### Unit Testing with Vitest

```typescript
// tests/components/HintPhase.test.tsx
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HintPhase } from '@/components/game/phases/HintPhase';

// Mock dependencies
const mockSubmitHint = vi.fn();
const mockPlayers = [
  { id: '1', nickname: 'Player1' },
  { id: '2', nickname: 'Player2' }
];

describe('HintPhase Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Citizen Player Behavior', () => {
    const citizenProps = {
      currentTopic: 'Animals',
      currentWord: 'Dog',
      isMyTurn: true,
      isLiar: false,
      timeRemaining: 60,
      onSubmitHint: mockSubmitHint,
      players: mockPlayers,
      submittedHints: []
    };

    it('should render correctly for citizen player', () => {
      render(<HintPhase {...citizenProps} />);
      
      expect(screen.getByText('Give Your Hint')).toBeInTheDocument();
      expect(screen.getByText('Topic: Animals')).toBeInTheDocument();
      expect(screen.getByText('Secret word: Dog')).toBeInTheDocument();
    });

    it('should prevent hints containing the secret word', async () => {
      const user = userEvent.setup();
      render(<HintPhase {...citizenProps} />);
      
      const input = screen.getByLabelText('Your hint');
      await user.type(input, 'This is a dog');
      
      expect(screen.getByText('Your hint cannot contain the secret word')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /submit hint/i })).toBeDisabled();
    });

    it('should submit valid hint successfully', async () => {
      const user = userEvent.setup();
      render(<HintPhase {...citizenProps} />);
      
      const input = screen.getByLabelText('Your hint');
      await user.type(input, 'Loyal pet');
      
      const submitButton = screen.getByRole('button', { name: /submit hint/i });
      expect(submitButton).toBeEnabled();
      
      await user.click(submitButton);
      
      expect(mockSubmitHint).toHaveBeenCalledWith('Loyal pet');
    });

    it('should auto-submit when time is critically low', async () => {
      const { rerender } = render(<HintPhase {...citizenProps} />);
      
      const user = userEvent.setup();
      const input = screen.getByLabelText('Your hint');
      await user.type(input, 'Four legs');
      
      // Simulate time running out
      rerender(<HintPhase {...citizenProps} timeRemaining={3} />);
      
      await waitFor(() => {
        expect(mockSubmitHint).toHaveBeenCalledWith('Four legs');
      });
    });
  });

  describe('Liar Player Behavior', () => {
    const liarProps = {
      currentTopic: 'Animals',
      isMyTurn: true,
      isLiar: true,
      timeRemaining: 60,
      onSubmitHint: mockSubmitHint,
      players: mockPlayers,
      submittedHints: []
    };

    it('should show liar-specific UI', () => {
      render(<HintPhase {...liarProps} />);
      
      expect(screen.getByText('You are the liar! You don\'t know the secret word.')).toBeInTheDocument();
      expect(screen.queryByText(/Secret word:/)).not.toBeInTheDocument();
    });

    it('should show hint suggestions for liars', () => {
      render(<HintPhase {...liarProps} />);
      
      expect(screen.getByText(/Suggestion: Try hints like these/)).toBeInTheDocument();
    });

    it('should allow clicking on hint suggestions', async () => {
      const user = userEvent.setup();
      render(<HintPhase {...liarProps} />);
      
      const suggestion = screen.getByText('"furry"');
      await user.click(suggestion);
      
      const input = screen.getByLabelText('Your hint (be careful!)');
      expect(input).toHaveValue('furry');
    });
  });

  describe('Non-Turn Player Behavior', () => {
    it('should show waiting state when not player\'s turn', () => {
      render(<HintPhase {...{ 
        ...citizenProps, 
        isMyTurn: false 
      }} />);
      
      expect(screen.getByText('Waiting for your turn')).toBeInTheDocument();
      expect(screen.getByText('Listen to other players\' hints and prepare yours.')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle submission errors gracefully', async () => {
      const user = userEvent.setup();
      mockSubmitHint.mockRejectedValueOnce(new Error('Network error'));
      
      render(<HintPhase {...citizenProps} />);
      
      const input = screen.getByLabelText('Your hint');
      await user.type(input, 'Valid hint');
      
      const submitButton = screen.getByRole('button', { name: /submit hint/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Failed to submit hint/)).toBeInTheDocument();
      });
      
      // Should allow retry
      expect(submitButton).toBeEnabled();
    });
  });
});
```

### Integration Testing with React Testing Library

```typescript
// tests/integration/GameFlow.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { GameFlowManager } from '@/components/game/GameFlowManager';
import { createMockWebSocket } from '../mocks/websocket';

// Mock WebSocket
const mockWebSocket = createMockWebSocket();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Game Flow Integration', () => {
  beforeEach(() => {
    mockWebSocket.reset();
  });

  it('should handle complete hint phase workflow', async () => {
    const user = userEvent.setup();
    
    // Setup initial game state
    mockWebSocket.mockGameState({
      gameNumber: 1,
      gamePhase: 'SPEECH',
      players: [
        { id: '1', nickname: 'Player1', isLiar: false },
        { id: '2', nickname: 'Player2', isLiar: true }
      ],
      currentPlayer: { id: '1', nickname: 'Player1' },
      currentTopic: 'Animals',
      currentWord: 'Dog',
      timeRemaining: 60
    });

    render(
      <TestWrapper>
        <GameFlowManager />
      </TestWrapper>
    );

    // Wait for game to load
    await waitFor(() => {
      expect(screen.getByText('Give Your Hint')).toBeInTheDocument();
    });

    // Submit a hint
    const hintInput = screen.getByLabelText('Your hint');
    await user.type(hintInput, 'Loyal companion');
    
    const submitButton = screen.getByRole('button', { name: /submit hint/i });
    await user.click(submitButton);

    // Verify hint was submitted
    expect(mockWebSocket.getLastMessage()).toMatchObject({
      type: 'SUBMIT_HINT',
      data: { hint: 'Loyal companion' }
    });

    // Simulate server response
    mockWebSocket.simulateMessage({
      type: 'HINT_SUBMITTED',
      data: { success: true }
    });

    // Check success state
    await waitFor(() => {
      expect(screen.getByText('Hint submitted!')).toBeInTheDocument();
    });
  });

  it('should transition between game phases correctly', async () => {
    const user = userEvent.setup();
    
    // Start in hint phase
    mockWebSocket.mockGameState({
      gamePhase: 'SPEECH',
      timeRemaining: 60
    });

    render(
      <TestWrapper>
        <GameFlowManager />
      </TestWrapper>
    );

    expect(screen.getByText('Give Your Hint')).toBeInTheDocument();

    // Simulate phase transition to voting
    mockWebSocket.simulateMessage({
      type: 'PHASE_CHANGE',
      data: {
        phase: 'VOTING_FOR_LIAR',
        timeRemaining: 30
      }
    });

    await waitFor(() => {
      expect(screen.getByText('Vote for the Liar')).toBeInTheDocument();
    });

    // Verify moderator commentary updated
    expect(screen.getByText(/Who do you think gave the most suspicious hint/)).toBeInTheDocument();
  });

  it('should handle WebSocket disconnection gracefully', async () => {
    mockWebSocket.mockGameState({
      gamePhase: 'SPEECH',
      timeRemaining: 60
    });

    render(
      <TestWrapper>
        <GameFlowManager />
      </TestWrapper>
    );

    // Simulate disconnection
    mockWebSocket.simulateDisconnection();

    await waitFor(() => {
      expect(screen.getByText(/Connection lost/)).toBeInTheDocument();
    });

    // Simulate reconnection
    mockWebSocket.simulateReconnection();

    await waitFor(() => {
      expect(screen.queryByText(/Connection lost/)).not.toBeInTheDocument();
    });
  });
});
```

### End-to-End Testing with Playwright

```typescript
// e2e/gameFlow.spec.ts
import { test, expect, Page } from '@playwright/test';

class GamePage {
  constructor(private page: Page) {}

  async joinGame(gameId: string) {
    await this.page.goto(`/game/${gameId}`);
    await expect(this.page.locator('[data-testid="game-container"]')).toBeVisible();
  }

  async submitHint(hint: string) {
    await this.page.fill('[data-testid="hint-input"]', hint);
    await this.page.click('[data-testid="submit-hint-button"]');
  }

  async voteForPlayer(playerName: string) {
    await this.page.click(`[data-testid="vote-${playerName}"]`);
    await this.page.click('[data-testid="submit-vote-button"]');
  }

  async waitForPhase(phase: string) {
    await expect(this.page.locator(`[data-testid="phase-${phase}"]`)).toBeVisible();
  }

  async getChatMessages() {
    return this.page.locator('[data-testid="chat-message"]').allTextContents();
  }
}

test.describe('Liar Game E2E Flow', () => {
  let game: GamePage;

  test.beforeEach(async ({ page }) => {
    game = new GamePage(page);
  });

  test('complete game flow - citizen perspective', async ({ page }) => {
    await game.joinGame('test-game-1');
    
    // Wait for hint phase to start
    await game.waitForPhase('hint');
    
    // Check that secret word is visible (citizen)
    await expect(page.locator('[data-testid="secret-word"]')).toContainText('Dog');
    
    // Submit hint
    await game.submitHint('Furry friend');
    
    // Verify hint was submitted
    await expect(page.locator('[data-testid="hint-submitted"]')).toBeVisible();
    
    // Wait for voting phase
    await game.waitForPhase('voting');
    
    // Vote for suspected liar
    await game.voteForPlayer('SuspiciousPlayer');
    
    // Wait for defense phase
    await game.waitForPhase('defense');
    
    // Listen to defense
    await expect(page.locator('[data-testid="defense-text"]')).toBeVisible();
    
    // Final vote
    await game.waitForPhase('final-vote');
    await page.click('[data-testid="vote-execute"]');
    
    // Check results
    await game.waitForPhase('results');
    await expect(page.locator('[data-testid="game-result"]')).toContainText('Citizens Win');
  });

  test('complete game flow - liar perspective', async ({ page }) => {
    // Set up liar game context
    await page.addInitScript(() => {
      window.testConfig = { isLiar: true };
    });
    
    await game.joinGame('test-game-2');
    await game.waitForPhase('hint');
    
    // Verify liar UI
    await expect(page.locator('[data-testid="liar-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="secret-word"]')).not.toBeVisible();
    
    // Use hint suggestion
    await page.click('[data-testid="hint-suggestion-0"]');
    await page.click('[data-testid="submit-hint-button"]');
    
    // Navigate through phases
    await game.waitForPhase('voting');
    
    // Get voted as liar
    await game.waitForPhase('defense');
    
    // Submit defense
    await page.fill('[data-testid="defense-input"]', 'I know the word! My hint was strategic.');
    await page.click('[data-testid="submit-defense-button"]');
    
    // Survive the vote
    await game.waitForPhase('word-guess');
    
    // Guess the word
    await page.fill('[data-testid="word-guess-input"]', 'Dog');
    await page.click('[data-testid="submit-guess-button"]');
    
    // Check victory
    await game.waitForPhase('results');
    await expect(page.locator('[data-testid="game-result"]')).toContainText('Liar Wins');
  });

  test('mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await game.joinGame('mobile-test');
    
    // Check mobile layout elements
    await expect(page.locator('[data-testid="mobile-tab-nav"]')).toBeVisible();
    await expect(page.locator('[data-testid="floating-moderator"]')).toBeVisible();
    
    // Test tab switching
    await page.click('[data-testid="tab-players"]');
    await expect(page.locator('[data-testid="players-panel"]')).toBeVisible();
    
    await page.click('[data-testid="tab-chat"]');
    await expect(page.locator('[data-testid="chat-panel"]')).toBeVisible();
    
    // Test sliding panel
    const panel = page.locator('[data-testid="sliding-panel"]');
    await panel.hover();
    
    // Simulate swipe down gesture
    await panel.dragTo(panel, { targetPosition: { x: 0, y: 100 } });
    await expect(panel).not.toBeVisible();
  });

  test('accessibility compliance', async ({ page }) => {
    await game.joinGame('accessibility-test');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="hint-input"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('[data-testid="submit-hint-button"]')).toBeFocused();
    
    // Test screen reader compatibility
    const hintInput = page.locator('[data-testid="hint-input"]');
    await expect(hintInput).toHaveAttribute('aria-label', 'Your hint');
    
    // Test high contrast mode
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(page.locator('[data-testid="game-container"]')).toBeVisible();
  });

  test('performance benchmarks', async ({ page }) => {
    // Start performance tracing
    await page.tracing.start({ screenshots: true, snapshots: true });
    
    const startTime = Date.now();
    await game.joinGame('performance-test');
    const loadTime = Date.now() - startTime;
    
    // Check load time is under 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check Core Web Vitals
    const lcp = await page.evaluate(() => {
      return new Promise((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }).observe({ entryTypes: ['largest-contentful-paint'] });
      });
    });
    
    expect(lcp).toBeLessThan(2500); // LCP should be under 2.5s
    
    await page.tracing.stop({ path: 'performance-trace.zip' });
  });
});
```

## 9. Deployment Strategy

### CI/CD Pipeline with GitHub Actions

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  REGISTRY: ghcr.io
  IMAGE_NAME: liargame/frontend

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      working-directory: frontend
      run: npm ci
    
    - name: Run TypeScript check
      working-directory: frontend
      run: npm run typecheck
    
    - name: Run linting
      working-directory: frontend
      run: npm run lint
    
    - name: Run unit tests
      working-directory: frontend
      run: npm run test:coverage
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        directory: frontend/coverage
    
    - name: Run build
      working-directory: frontend
      run: npm run build
    
    - name: Run E2E tests
      working-directory: frontend
      run: |
        npm run test:e2e
        npm run test:e2e:report
    
    - name: Upload E2E test results
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: playwright-report
        path: frontend/playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

  performance-audit:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install and build
      working-directory: frontend
      run: |
        npm ci
        npm run build
    
    - name: Run Lighthouse CI
      working-directory: frontend
      run: |
        npm install -g @lhci/cli@0.12.x
        lhci autorun
      env:
        LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}

  build-and-deploy:
    runs-on: ubuntu-latest
    needs: [test, security-scan, performance-audit]
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies and build
      working-directory: frontend
      run: |
        npm ci
        npm run build
      env:
        VITE_API_BASE_URL: ${{ secrets.PROD_API_URL }}
        VITE_WS_URL: ${{ secrets.PROD_WS_URL }}
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
        vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
        working-directory: frontend
        vercel-args: '--prod'
```

### Docker Configuration

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
ARG VITE_API_BASE_URL
ARG VITE_WS_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_WS_URL=$VITE_WS_URL

RUN npm run build

# Production image
FROM nginx:alpine AS production

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://backend:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws/ {
        proxy_pass http://backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment Configuration

```typescript
// config/environments.ts
interface Environment {
  apiBaseUrl: string;
  wsUrl: string;
  enableAnalytics: boolean;
  enableDevTools: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

const environments: Record<string, Environment> = {
  development: {
    apiBaseUrl: 'http://localhost:8080/api',
    wsUrl: 'ws://localhost:8080/ws',
    enableAnalytics: false,
    enableDevTools: true,
    logLevel: 'debug'
  },
  
  staging: {
    apiBaseUrl: 'https://staging-api.liargame.com/api',
    wsUrl: 'wss://staging-api.liargame.com/ws',
    enableAnalytics: true,
    enableDevTools: true,
    logLevel: 'info'
  },
  
  production: {
    apiBaseUrl: 'https://api.liargame.com/api',
    wsUrl: 'wss://api.liargame.com/ws',
    enableAnalytics: true,
    enableDevTools: false,
    logLevel: 'warn'
  }
};

export const config = environments[import.meta.env.MODE] || environments.development;
```

### Monitoring and Observability

```typescript
// utils/monitoring.ts
interface MonitoringConfig {
  sentryDsn?: string;
  amplitudeApiKey?: string;
  hotjarSiteId?: string;
}

export class MonitoringService {
  constructor(private config: MonitoringConfig) {
    this.initSentry();
    this.initAnalytics();
    this.initPerformanceMonitoring();
  }

  private initSentry() {
    if (this.config.sentryDsn && import.meta.env.PROD) {
      Sentry.init({
        dsn: this.config.sentryDsn,
        environment: import.meta.env.MODE,
        beforeSend(event) {
          // Filter out known issues
          if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop limit exceeded')) {
            return null;
          }
          return event;
        }
      });
    }
  }

  private initAnalytics() {
    if (this.config.amplitudeApiKey && import.meta.env.PROD) {
      amplitude.init(this.config.amplitudeApiKey);
    }
  }

  private initPerformanceMonitoring() {
    // Core Web Vitals tracking
    getCLS(this.reportMetric);
    getFID(this.reportMetric);
    getFCP(this.reportMetric);
    getLCP(this.reportMetric);
    getTTFB(this.reportMetric);
  }

  private reportMetric = (metric: Metric) => {
    if (import.meta.env.PROD) {
      // Send to analytics
      amplitude.track('Performance Metric', {
        name: metric.name,
        value: metric.value,
        rating: metric.rating
      });
    }
  };

  trackEvent(eventName: string, properties?: Record<string, any>) {
    if (import.meta.env.PROD && this.config.amplitudeApiKey) {
      amplitude.track(eventName, properties);
    }
  }

  trackError(error: Error, context?: Record<string, any>) {
    console.error(error);
    
    if (import.meta.env.PROD) {
      Sentry.captureException(error, { extra: context });
    }
  }
}

export const monitoring = new MonitoringService({
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  amplitudeApiKey: import.meta.env.VITE_AMPLITUDE_API_KEY,
  hotjarSiteId: import.meta.env.VITE_HOTJAR_SITE_ID
});
```

This comprehensive testing and deployment strategy ensures:

1. **Quality Assurance**: Multi-layered testing approach
2. **Security**: Automated vulnerability scanning
3. **Performance**: Continuous performance monitoring
4. **Reliability**: Health checks and error monitoring
5. **Scalability**: Container-based deployment
6. **Observability**: Comprehensive logging and analytics

The strategy provides a production-ready deployment pipeline that maintains high code quality while ensuring optimal user experience.