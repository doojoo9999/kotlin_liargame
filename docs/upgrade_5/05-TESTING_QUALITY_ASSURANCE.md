# 🧪 Comprehensive Testing & Quality Assurance

## Overview
**Priority**: 5 (Final implementation phase)  
**Dependencies**: All previous prompts completed  
**Impact**: Production readiness and reliability  
**Estimated Time**: 12-16 hours

## Testing Strategy Overview
Based on TESTING_AND_DEPLOYMENT.md specifications:

```
Testing Pyramid:
Unit Tests (70%) → Integration Tests (20%) → E2E Tests (10%)
```

## AI Agent Prompts

### Prompt 1: Unit Testing Setup and Implementation
```
**Task**: Establish comprehensive unit testing framework with Vitest and React Testing Library

**Context**:
- React 19 + TypeScript components require specialized testing approaches
- Zustand stores need isolated testing with mock state
- Game logic functions require edge case testing
- WebSocket services need mock implementation testing

**Testing Framework Configuration**:
```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      },
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts'
      ]
    }
  }
});
```

**Unit Testing Categories**:

**1. Component Testing**
```typescript
// Example: Game phase component testing
describe('HintPhase Component', () => {
  const mockGameStore = {
    phase: 'SPEECH',
    currentPlayer: 'player1',
    timeRemaining: 45,
    submitHint: vi.fn(),
    players: mockPlayers
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useGameStore.setState(mockGameStore);
  });

  test('renders correctly for current player', () => {
    render(<HintPhase />);
    
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByText(/your turn to give a hint/i)).toBeInTheDocument();
  });

  test('submits hint when form is valid', async () => {
    const user = userEvent.setup();
    render(<HintPhase />);
    
    const input = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button', { name: /submit hint/i });
    
    await user.type(input, 'clever hint');
    await user.click(submitBtn);
    
    expect(mockGameStore.submitHint).toHaveBeenCalledWith('clever hint');
  });

  test('shows validation error for invalid hint', async () => {
    const user = userEvent.setup();
    render(<HintPhase />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'secretword'); // Contains banned word
    
    expect(screen.getByText(/hint cannot contain the secret word/i)).toBeInTheDocument();
  });
});
```

**2. Store Testing**
```typescript
// Example: GameStore testing
describe('GameStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useGameStore.getState().resetGame();
  });

  test('submitHint updates state optimistically', async () => {
    const store = useGameStore.getState();
    
    await store.submitHint('test hint');
    
    const state = useGameStore.getState();
    expect(state.hints).toContainEqual(
      expect.objectContaining({
        text: 'test hint',
        playerId: store.currentUserId,
        pending: true
      })
    );
  });

  test('handles vote casting correctly', async () => {
    const store = useGameStore.getState();
    store.updateGameState({ phase: 'VOTING_FOR_LIAR' });
    
    await store.castVote('player2', 'LIAR_VOTE');
    
    const state = useGameStore.getState();
    expect(state.votes).toContainEqual({
      voterId: store.currentUserId,
      targetId: 'player2',
      type: 'LIAR_VOTE'
    });
  });
});
```

**3. Utility Function Testing**
```typescript
// Example: Game logic testing
describe('Scoring Calculations', () => {
  test('calculates correct scores for liar elimination', () => {
    const gameResult = {
      accusedPlayer: 'player1',
      actualLiar: 'player1',
      votes: [
        { voterId: 'player2', targetId: 'player1', correct: true },
        { voterId: 'player3', targetId: 'player2', correct: false }
      ]
    };
    
    const scores = calculateRoundScores(gameResult);
    
    expect(scores).toEqual({
      player1: 0, // Eliminated liar
      player2: 3, // Correct vote
      player3: 0  // Incorrect vote
    });
  });
});
```

**4. Hook Testing**
```typescript
// Example: Custom hook testing
describe('useTimer Hook', () => {
  test('counts down from initial time', async () => {
    const { result } = renderHook(() => useTimer(10));
    
    expect(result.current.timeRemaining).toBe(10);
    
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    
    expect(result.current.timeRemaining).toBe(9);
  });
});
```

**Actions Required**:
1. Set up Vitest configuration with React Testing Library
2. Create comprehensive test utilities and mocks
3. Implement component tests for all game phases
4. Add store tests with state management validation
5. Create utility function tests for game logic
6. Build custom hook tests for all hooks

**Files to Create**:
- frontend/src/test/setup.ts
- frontend/src/test/utils.tsx
- frontend/src/test/mocks/stores.ts
- frontend/src/test/mocks/websocket.ts
- frontend/src/components/game/__tests__/HintPhase.test.tsx
- frontend/src/components/game/__tests__/VotingPhase.test.tsx
- frontend/src/stores/__tests__/gameStore.test.ts
- frontend/src/utils/__tests__/gameLogic.test.ts
- frontend/src/hooks/__tests__/useTimer.test.ts

**Acceptance Criteria**:
1. ✅ Test coverage above 80% for all categories
2. ✅ All game phase components have comprehensive tests
3. ✅ Store actions and state changes are validated
4. ✅ Edge cases and error conditions are covered
5. ✅ Tests run fast (<30 seconds for full suite)
6. ✅ Mock implementations match real service behavior
```

### Prompt 2: Integration Testing for Real-time Features
```
**Task**: Build integration tests for WebSocket communication and state synchronization

**Context**:
- Test real-time multiplayer interactions
- Validate WebSocket message handling
- Ensure state synchronization works correctly
- Test error recovery and reconnection scenarios

**Integration Testing Setup**:
```typescript
// Mock WebSocket server for testing
class MockWebSocketServer {
  private clients: MockWebSocketClient[] = [];
  private messageHandlers: Map<string, MessageHandler> = new Map();
  
  addClient(client: MockWebSocketClient): void;
  broadcast(message: any): void;
  sendToClient(clientId: string, message: any): void;
  simulateDisconnection(clientId: string): void;
  simulateReconnection(clientId: string): void;
}

// Integration test utilities
const createGameTestSession = (playerCount: number) => {
  const server = new MockWebSocketServer();
  const clients = Array.from({ length: playerCount }, (_, i) => 
    new MockWebSocketClient(`player${i + 1}`)
  );
  
  return { server, clients };
};
```

**Integration Test Scenarios**:

**1. Multi-player Game Flow Testing**
```typescript
describe('Complete Game Flow Integration', () => {
  test('handles full game from start to finish', async () => {
    const { server, clients } = createGameTestSession(4);
    const [host, ...players] = clients;
    
    // Game creation and joining
    await host.createGame({ maxPlayers: 4 });
    await Promise.all(players.map(client => client.joinGame(host.gameId)));
    
    // Start game
    await host.startGame();
    
    // Phase 1: Hint giving
    for (const client of clients) {
      await client.submitHint(`hint from ${client.playerId}`);
    }
    
    // Verify all clients received hints
    clients.forEach(client => {
      expect(client.gameState.hints).toHaveLength(4);
    });
    
    // Phase 2: Voting
    await Promise.all(players.map(client => 
      client.castVote(host.playerId) // Vote for host as liar
    ));
    
    // Verify game progressed to defense phase
    clients.forEach(client => {
      expect(client.gameState.phase).toBe('DEFENDING');
    });
  });
});
```

**2. WebSocket Message Handling**
```typescript
describe('WebSocket Message Integration', () => {
  test('handles concurrent messages correctly', async () => {
    const { server, clients } = createGameTestSession(4);
    
    // Send multiple messages simultaneously
    const promises = clients.map((client, i) => 
      client.submitHint(`concurrent hint ${i}`)
    );
    
    await Promise.all(promises);
    
    // Verify all messages were processed
    clients.forEach(client => {
      expect(client.gameState.hints).toHaveLength(4);
      expect(client.gameState.hints.map(h => h.text)).toEqual(
        expect.arrayContaining([
          'concurrent hint 0',
          'concurrent hint 1', 
          'concurrent hint 2',
          'concurrent hint 3'
        ])
      );
    });
  });

  test('handles network disconnection and recovery', async () => {
    const { server, clients } = createGameTestSession(2);
    const [client1, client2] = clients;
    
    await client1.createGame({ maxPlayers: 2 });
    await client2.joinGame(client1.gameId);
    
    // Simulate disconnection
    server.simulateDisconnection(client2.clientId);
    
    // Client 1 continues playing
    await client1.submitHint('hint while disconnected');
    
    // Simulate reconnection
    server.simulateReconnection(client2.clientId);
    
    // Verify client 2 receives missed updates
    await waitFor(() => {
      expect(client2.gameState.hints).toContainEqual(
        expect.objectContaining({ text: 'hint while disconnected' })
      );
    });
  });
});
```

**3. State Synchronization Testing**
```typescript
describe('State Synchronization Integration', () => {
  test('maintains state consistency across clients', async () => {
    const { server, clients } = createGameTestSession(3);
    
    // Perform various game actions
    await clients[0].createGame({ maxPlayers: 3 });
    await Promise.all(clients.slice(1).map(c => c.joinGame(clients[0].gameId)));
    
    await clients[0].startGame();
    
    // Each client submits different actions
    await clients[0].submitHint('first hint');
    await clients[1].submitHint('second hint');  
    await clients[2].submitHint('third hint');
    
    // Wait for synchronization
    await waitFor(() => {
      clients.forEach(client => {
        expect(client.gameState.hints).toHaveLength(3);
      });
    });
    
    // Verify all clients have identical game state
    const gameStates = clients.map(c => c.gameState);
    expect(gameStates[0]).toEqual(gameStates[1]);
    expect(gameStates[1]).toEqual(gameStates[2]);
  });
});
```

**Actions Required**:
1. Create mock WebSocket server for testing
2. Build multi-client test scenarios
3. Test concurrent action handling
4. Validate network disconnection recovery
5. Ensure state consistency across clients
6. Test error conditions and edge cases

**Files to Create**:
- frontend/src/test/integration/mockWebSocket.ts
- frontend/src/test/integration/gameFlow.test.ts
- frontend/src/test/integration/webSocketMessages.test.ts
- frontend/src/test/integration/stateSync.test.ts
- frontend/src/test/integration/errorRecovery.test.ts

**Acceptance Criteria**:
1. ✅ Multi-player game flows complete successfully
2. ✅ Concurrent actions are handled correctly
3. ✅ Network issues recover gracefully
4. ✅ State remains consistent across all clients
5. ✅ Error conditions are properly handled
6. ✅ Integration tests run reliably in CI/CD
```

### Prompt 3: End-to-End Testing with Playwright
```
**Task**: Implement comprehensive E2E tests covering complete user journeys

**Context**:
- Test real user workflows from login to game completion
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- Mobile responsive testing on various device sizes
- Performance testing and visual regression detection

**Playwright Configuration**:
```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'playwright-report/results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] }
    }
  ]
});
```

**E2E Test Scenarios**:

**1. Complete Game Journey**
```typescript
// Complete user workflow from login to game end
test('complete liar game journey', async ({ page, context }) => {
  // Multiple browser contexts for different players
  const player1Page = page;
  const player2Page = await context.newPage();
  const player3Page = await context.newPage();
  const player4Page = await context.newPage();
  
  const pages = [player1Page, player2Page, player3Page, player4Page];
  
  // Step 1: All players login
  for (const [index, playerPage] of pages.entries()) {
    await playerPage.goto('/');
    await playerPage.fill('[data-testid="nickname-input"]', `Player${index + 1}`);
    await playerPage.click('[data-testid="login-button"]');
    await expect(playerPage.locator('[data-testid="lobby"]')).toBeVisible();
  }
  
  // Step 2: Create and join game
  await player1Page.click('[data-testid="create-game-button"]');
  await player1Page.fill('[data-testid="game-name"]', 'E2E Test Game');
  await player1Page.click('[data-testid="confirm-create"]');
  
  // Get game ID from URL
  const gameUrl = player1Page.url();
  const gameId = gameUrl.split('/').pop();
  
  // Other players join
  for (const playerPage of pages.slice(1)) {
    await playerPage.goto(`/game/${gameId}`);
    await expect(playerPage.locator('[data-testid="waiting-room"]')).toBeVisible();
  }
  
  // Step 3: Start game
  await player1Page.click('[data-testid="start-game-button"]');
  
  // Verify all players see game start
  for (const playerPage of pages) {
    await expect(playerPage.locator('[data-testid="game-phase-indicator"]')).toBeVisible();
    await expect(playerPage.locator('[data-testid="topic-display"]')).toBeVisible();
  }
  
  // Step 4: Play through all phases
  
  // Hint Phase
  for (const [index, playerPage] of pages.entries()) {
    await playerPage.waitForSelector(`[data-testid="hint-input-${index}"]`);
    await playerPage.fill(`[data-testid="hint-input"]`, `Hint from Player${index + 1}`);
    await playerPage.click('[data-testid="submit-hint"]');
    
    // Verify hint was submitted
    await expect(playerPage.locator('[data-testid="hint-submitted"]')).toBeVisible();
  }
  
  // Voting Phase
  for (const playerPage of pages) {
    await expect(playerPage.locator('[data-testid="voting-interface"]')).toBeVisible();
    
    // Vote for player 1 (arbitrary choice)
    await playerPage.click('[data-testid="vote-player-0"]');
    await playerPage.click('[data-testid="confirm-vote"]');
  }
  
  // Defense Phase (Player 1 defends)
  await expect(player1Page.locator('[data-testid="defense-input"]')).toBeVisible();
  await player1Page.fill('[data-testid="defense-input"]', 'I am innocent!');
  await player1Page.click('[data-testid="submit-defense"]');
  
  // Final Vote
  for (const playerPage of pages) {
    await playerPage.click('[data-testid="vote-innocent"]'); // Vote to save
  }
  
  // Step 5: Verify game completion
  for (const playerPage of pages) {
    await expect(playerPage.locator('[data-testid="game-results"]')).toBeVisible();
    await expect(playerPage.locator('[data-testid="final-scores"]')).toBeVisible();
  }
});
```

**2. Mobile Responsive Testing**
```typescript
test('mobile responsive design', async ({ page }) => {
  // Test on mobile viewport
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  
  await page.goto('/');
  
  // Login on mobile
  await page.fill('[data-testid="nickname-input"]', 'MobileUser');
  await page.click('[data-testid="login-button"]');
  
  // Test mobile navigation
  await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
  
  // Create game on mobile
  await page.click('[data-testid="mobile-menu-toggle"]');
  await page.click('[data-testid="create-game-mobile"]');
  
  // Test mobile game interface
  await page.fill('[data-testid="game-name"]', 'Mobile Game');
  await page.click('[data-testid="create-button"]');
  
  // Verify mobile game interface
  await expect(page.locator('[data-testid="mobile-game-panel"]')).toBeVisible();
  
  // Test touch interactions
  await page.tap('[data-testid="mobile-hint-input"]');
  await expect(page.locator('[data-testid="mobile-keyboard"]')).toBeVisible();
});
```

**3. Performance Testing**
```typescript
test('performance metrics', async ({ page }) => {
  // Enable performance monitoring
  await page.addInitScript(() => {
    window.performance.mark('navigation-start');
  });
  
  await page.goto('/');
  
  // Measure page load performance
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime
    };
  });
  
  // Assert performance thresholds
  expect(metrics.domContentLoaded).toBeLessThan(2000); // 2 seconds
  expect(metrics.loadComplete).toBeLessThan(3000); // 3 seconds
  expect(metrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds
});
```

**Actions Required**:
1. Set up Playwright with multi-browser configuration
2. Create complete user journey tests
3. Implement mobile-specific responsive tests
4. Add performance monitoring and thresholds
5. Create visual regression testing setup
6. Build CI/CD integration for E2E tests

**Files to Create**:
- tests/e2e/gameJourney.spec.ts
- tests/e2e/mobileResponsive.spec.ts
- tests/e2e/performance.spec.ts
- tests/e2e/crossBrowser.spec.ts
- tests/e2e/visualRegression.spec.ts
- tests/e2e/utils/testHelpers.ts

**Acceptance Criteria**:
1. ✅ Complete game journeys pass on all browsers
2. ✅ Mobile responsive tests validate touch interactions
3. ✅ Performance tests enforce speed requirements
4. ✅ Visual regression tests catch UI changes
5. ✅ Tests run reliably in CI/CD pipeline
6. ✅ Cross-browser compatibility verified
```

### Prompt 4: Quality Assurance and Code Coverage
```
**Task**: Establish comprehensive QA processes and maintain high code coverage

**Context**:
- Enforce code quality standards with ESLint and TypeScript
- Maintain 85%+ test coverage across all code
- Implement automated accessibility testing
- Set up security vulnerability scanning

**Code Quality Configuration**:

**1. ESLint Configuration**
```typescript
// .eslintrc.js
module.exports = {
  extends: [
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended'
  ],
  rules: {
    // Typescript rules
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-explicit-any': 'error',
    
    // React rules
    'react/prop-types': 'off', // Using TypeScript
    'react/react-in-jsx-scope': 'off', // React 17+
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // Accessibility rules
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-role': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    
    // General code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'prefer-const': 'error'
  }
};
```

**2. Code Coverage Configuration**
```typescript
// Coverage thresholds in vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        },
        // Specific thresholds for critical modules
        'src/stores/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/services/': {
          branches: 88,
          functions: 88,
          lines: 88,
          statements: 88
        }
      }
    }
  }
});
```

**3. Accessibility Testing**
```typescript
// Automated accessibility testing
describe('Accessibility Compliance', () => {
  test('login page meets WCAG 2.1 AA standards', async () => {
    render(<LoginPage />);
    const results = await axe(document.body);
    expect(results).toHaveNoViolations();
  });

  test('game interface supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<GameInterface />);
    
    const hintInput = screen.getByRole('textbox');
    await user.tab();
    expect(hintInput).toHaveFocus();
    
    await user.tab();
    const submitButton = screen.getByRole('button', { name: /submit/i });
    expect(submitButton).toHaveFocus();
  });

  test('screen reader announcements work correctly', async () => {
    render(<GamePhaseIndicator phase="SPEECH" />);
    
    const announcement = screen.getByRole('status');
    expect(announcement).toHaveTextContent(/hint giving phase/i);
  });
});
```

**4. Security Testing**
```typescript
// Security vulnerability testing
describe('Security Compliance', () => {
  test('prevents XSS attacks in user input', () => {
    const maliciousScript = '<script>alert("xss")</script>';
    render(<HintInput initialValue={maliciousScript} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue(''); // Script should be sanitized
  });

  test('validates all API inputs', async () => {
    const invalidHint = 'x'.repeat(1000); // Too long
    const submitHint = vi.fn().mockRejectedValue(new Error('Hint too long'));
    
    render(<HintPhase onSubmitHint={submitHint} />);
    
    const input = screen.getByRole('textbox');
    const submitBtn = screen.getByRole('button');
    
    await userEvent.type(input, invalidHint);
    await userEvent.click(submitBtn);
    
    expect(screen.getByText(/hint is too long/i)).toBeInTheDocument();
  });
});
```

**Quality Gates and Automation**:

**1. Pre-commit Hooks**
```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type checking
npm run typecheck

# Run linting
npm run lint

# Run tests
npm test

# Check code coverage
npm run coverage

echo "✅ Pre-commit checks passed"
```

**2. CI/CD Quality Gates**
```yaml
# .github/workflows/quality.yml
name: Code Quality

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: TypeScript check
        run: npm run typecheck
        
      - name: Lint check
        run: npm run lint
        
      - name: Run tests with coverage
        run: npm run coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        
      - name: Security audit
        run: npm audit --audit-level=high
        
      - name: Bundle size check
        run: npm run build && npm run analyze
```

**Actions Required**:
1. Configure comprehensive ESLint rules
2. Set up code coverage thresholds and monitoring
3. Implement automated accessibility testing
4. Add security vulnerability scanning
5. Create pre-commit hooks for quality gates
6. Set up CI/CD pipeline with quality checks

**Files to Create**:
- .eslintrc.js
- .husky/pre-commit
- .github/workflows/quality.yml
- src/test/accessibility.test.tsx
- src/test/security.test.tsx
- scripts/coverage-check.js
- scripts/bundle-analyzer.js

**Acceptance Criteria**:
1. ✅ ESLint enforces consistent code style
2. ✅ Code coverage maintains 85%+ across all modules
3. ✅ Accessibility tests pass WCAG 2.1 AA standards
4. ✅ Security scanning identifies and prevents vulnerabilities
5. ✅ Pre-commit hooks prevent low-quality code commits
6. ✅ CI/CD pipeline enforces all quality gates
```

### Prompt 5: Performance Testing and Monitoring
```
**Task**: Implement comprehensive performance testing and production monitoring

**Context**:
- Real-time multiplayer games require consistent performance
- Monitor Core Web Vitals and game-specific metrics
- Load testing for concurrent users
- Performance regression detection

**Performance Testing Setup**:

**1. Core Web Vitals Testing**
```typescript
// Performance monitoring utilities
class PerformanceMonitor {
  static measureLCP(): Promise<number> {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
  }

  static measureFID(): Promise<number> {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          resolve(entry.processingStart - entry.startTime);
        });
      }).observe({ type: 'first-input', buffered: true });
    });
  }

  static measureCLS(): Promise<number> {
    return new Promise((resolve) => {
      let clsValue = 0;
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        resolve(clsValue);
      }).observe({ type: 'layout-shift', buffered: true });
    });
  }
}
```

**2. Game-Specific Performance Tests**
```typescript
// Game performance testing
describe('Game Performance', () => {
  test('hint input responds within 100ms', async () => {
    render(<HintPhase />);
    const input = screen.getByRole('textbox');
    
    const startTime = performance.now();
    await userEvent.type(input, 'test hint');
    const endTime = performance.now();
    
    const responseTime = endTime - startTime;
    expect(responseTime).toBeLessThan(100);
  });

  test('phase transitions complete within 300ms', async () => {
    const { rerender } = render(<GameInterface phase="SPEECH" />);
    
    const startTime = performance.now();
    rerender(<GameInterface phase="VOTING_FOR_LIAR" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('voting-interface')).toBeInTheDocument();
    });
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(300);
  });

  test('handles 100 simultaneous hint updates', async () => {
    const hints = Array.from({ length: 100 }, (_, i) => ({
      id: `hint-${i}`,
      text: `Hint ${i}`,
      playerId: `player-${i % 4}`
    }));
    
    const startTime = performance.now();
    render(<HintList hints={hints} />);
    const endTime = performance.now();
    
    const renderTime = endTime - startTime;
    expect(renderTime).toBeLessThan(50); // 50ms for 100 items
  });
});
```

**3. WebSocket Performance Testing**
```typescript
// WebSocket latency and throughput testing
describe('WebSocket Performance', () => {
  test('message roundtrip latency under 100ms', async () => {
    const mockWebSocket = new MockWebSocket();
    const service = new GameWebSocketService(mockWebSocket);
    
    const startTime = performance.now();
    
    service.sendMessage('/app/game/test/ping', { timestamp: startTime });
    
    await waitFor(() => {
      expect(mockWebSocket.lastMessage).toEqual(
        expect.objectContaining({ type: 'pong' })
      );
    });
    
    const endTime = performance.now();
    const latency = endTime - startTime;
    
    expect(latency).toBeLessThan(100);
  });

  test('handles high message throughput', async () => {
    const mockWebSocket = new MockWebSocket();
    const service = new GameWebSocketService(mockWebSocket);
    
    const messageCount = 1000;
    const messages = Array.from({ length: messageCount }, (_, i) => ({
      type: 'test',
      data: `message-${i}`
    }));
    
    const startTime = performance.now();
    
    messages.forEach(message => {
      service.sendMessage('/app/test', message);
    });
    
    await waitFor(() => {
      expect(mockWebSocket.sentMessages).toHaveLength(messageCount);
    });
    
    const endTime = performance.now();
    const throughput = messageCount / ((endTime - startTime) / 1000); // messages per second
    
    expect(throughput).toBeGreaterThan(100); // 100 messages per second minimum
  });
});
```

**4. Load Testing with k6**
```javascript
// k6 load testing script
import { check, sleep } from 'k6';
import { WebSocket } from 'k6/ws';

export const options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up to 20 users
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    ws_msgs_received: ['rate>10'],    // Receive at least 10 messages per second
  },
};

export default function () {
  // Test WebSocket connection
  const ws = new WebSocket('ws://localhost:8080/ws');
  
  ws.onopen = function() {
    // Join game
    ws.send(JSON.stringify({
      type: 'JOIN_GAME',
      gameId: 'load-test-game',
      playerId: `player-${__VU}`
    }));
  };
  
  ws.onmessage = function(event) {
    const message = JSON.parse(event.data);
    check(message, {
      'message received': (msg) => msg !== null,
      'valid message format': (msg) => msg.type !== undefined
    });
  };
  
  sleep(1);
  
  // Submit hint
  ws.send(JSON.stringify({
    type: 'SUBMIT_HINT',
    gameId: 'load-test-game',
    hint: `Load test hint from ${__VU}`
  }));
  
  sleep(5);
  ws.close();
}
```

**5. Production Performance Monitoring**
```typescript
// Real-time performance monitoring
class ProductionMonitor {
  private metricsEndpoint = '/api/metrics';
  
  trackPageLoad(route: string, loadTime: number): void {
    this.sendMetric('page_load', {
      route,
      load_time: loadTime,
      timestamp: Date.now()
    });
  }
  
  trackWebSocketLatency(messageType: string, latency: number): void {
    this.sendMetric('websocket_latency', {
      message_type: messageType,
      latency,
      timestamp: Date.now()
    });
  }
  
  trackUserAction(action: string, duration: number): void {
    this.sendMetric('user_action', {
      action,
      duration,
      timestamp: Date.now()
    });
  }
  
  private sendMetric(type: string, data: any): void {
    // Send to monitoring service (e.g., DataDog, New Relic)
    navigator.sendBeacon(this.metricsEndpoint, JSON.stringify({
      type,
      data
    }));
  }
}
```

**Actions Required**:
1. Set up Core Web Vitals monitoring
2. Create game-specific performance benchmarks
3. Implement WebSocket performance testing
4. Build load testing with k6 or Artillery
5. Add production performance monitoring
6. Create performance regression detection

**Files to Create**:
- src/test/performance/coreWebVitals.test.ts
- src/test/performance/gamePerformance.test.ts
- src/test/performance/websocketPerformance.test.ts
- tests/load/gameLoad.js (k6 script)
- src/services/performanceMonitor.ts
- scripts/performance-regression.js

**Acceptance Criteria**:
1. ✅ Core Web Vitals meet Google's thresholds
2. ✅ Game interactions respond within performance budgets
3. ✅ WebSocket latency stays under 100ms for 95% of messages
4. ✅ Load testing validates system can handle target user count
5. ✅ Production monitoring tracks key performance metrics
6. ✅ Performance regression detection prevents degradation
```

## Testing Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Set up Vitest and React Testing Library
- [ ] Create test utilities and mocks
- [ ] Implement basic component tests
- [ ] Configure code coverage thresholds

### Phase 2: Integration (Week 2)
- [ ] Build WebSocket integration tests
- [ ] Create multi-client testing scenarios
- [ ] Implement state synchronization tests
- [ ] Add error recovery testing

### Phase 3: E2E Testing (Week 3)
- [ ] Set up Playwright with multi-browser support
- [ ] Create complete user journey tests
- [ ] Implement mobile responsive testing
- [ ] Add visual regression testing

### Phase 4: Quality & Performance (Week 4)
- [ ] Configure ESLint and accessibility testing
- [ ] Set up performance monitoring
- [ ] Implement load testing with k6
- [ ] Create CI/CD quality gates

## Success Metrics

### Code Quality
- [ ] 85%+ code coverage across all modules
- [ ] Zero ESLint errors or TypeScript warnings
- [ ] 100% accessibility compliance (WCAG 2.1 AA)
- [ ] Security audit passes with no high-severity issues

### Performance
- [ ] Core Web Vitals meet Google's thresholds
- [ ] Game interactions respond within 100ms
- [ ] WebSocket latency under 100ms for 95% of messages
- [ ] Load testing handles 50+ concurrent users

### Testing Coverage
- [ ] All game phases have comprehensive unit tests
- [ ] Integration tests cover multi-player scenarios
- [ ] E2E tests validate complete user journeys
- [ ] Performance tests prevent regression

## Production Readiness Checklist

### Testing
- [ ] Unit test coverage above 85%
- [ ] Integration tests passing
- [ ] E2E tests covering critical paths
- [ ] Performance tests within budgets
- [ ] Load testing completed
- [ ] Security testing passed

### Quality Assurance
- [ ] Code quality gates enforced
- [ ] Accessibility compliance verified  
- [ ] Cross-browser compatibility tested
- [ ] Mobile responsive design validated
- [ ] Error handling comprehensive
- [ ] Documentation complete

This comprehensive testing strategy ensures the Liar Game frontend meets production-quality standards with reliable performance, excellent user experience, and maintainable code architecture.