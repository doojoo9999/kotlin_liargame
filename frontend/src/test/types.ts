/**
 * Test Types
 * 
 * Type definitions for test utilities, mocks, and test result structures.
 */

// Test Result Types
export interface TestSuiteResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  tests: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
  };
  errors?: string[];
}

export interface TestMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage: CoverageReport;
}

export interface CoverageReport {
  lines: CoverageMetric;
  functions: CoverageMetric;
  branches: CoverageMetric;
  statements: CoverageMetric;
}

export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

// Performance Test Types
export interface PerformanceMetrics {
  renderTime: number;
  bundleSize: {
    total: number;
    gzipped: number;
    chunks: BundleChunk[];
  };
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
  };
  networkRequests: NetworkRequest[];
  coreWebVitals: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    fid: number; // First Input Delay
    cls: number; // Cumulative Layout Shift
  };
}

export interface BundleChunk {
  name: string;
  size: number;
  type: 'js' | 'css' | 'asset';
}

export interface NetworkRequest {
  url: string;
  method: string;
  duration: number;
  size: number;
  status: number;
}

// Mock Data Types
export interface MockUser {
  id: string;
  nickname: string;
  token?: string;
  avatar?: string;
  role?: 'player' | 'host' | 'spectator';
  isOnline?: boolean;
}

export interface MockGameState {
  id: string;
  status: 'waiting' | 'in_progress' | 'ended';
  currentPhase: GamePhase;
  players: MockPlayer[];
  timeLeft: number;
  settings: GameSettings;
  currentWord?: string;
  liarId?: string;
  votes?: Vote[];
  hints?: Hint[];
}

export interface MockPlayer {
  id: string;
  nickname: string;
  isReady: boolean;
  score: number;
  role?: 'normal' | 'liar';
  isHost: boolean;
  isCurrentTurn?: boolean;
  isConnected?: boolean;
}

export interface GameSettings {
  maxPlayers: number;
  timeLimit: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  category?: string;
}

export interface Vote {
  voterId: string;
  targetId: string;
  timestamp: string;
  confidence?: number;
  reason?: string;
}

export interface Hint {
  playerId: string;
  hint: string;
  timestamp: string;
  isLiar: boolean;
}

export interface MockChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: string;
  type: 'normal' | 'system' | 'whisper';
  targetUser?: string;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  timestamp: string;
}

// API Mock Types
export interface MockAPIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MockAPIError {
  status: number;
  message: string;
  code?: string;
  details?: Record<string, any>;
}

// Test Configuration Types
export interface TestConfig {
  environment: 'jsdom' | 'node';
  setupFiles: string[];
  coverage: {
    enabled: boolean;
    threshold: CoverageThreshold;
    reporters: string[];
    exclude: string[];
  };
  timeout: number;
  retries: number;
  parallel: boolean;
  maxWorkers: number;
}

export interface CoverageThreshold {
  global: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  perFile?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

// Accessibility Test Types
export interface AccessibilityViolation {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: AccessibilityNode[];
}

export interface AccessibilityNode {
  element: string;
  target: string[];
  html: string;
  impact: string;
  any: AccessibilityCheck[];
  all: AccessibilityCheck[];
  none: AccessibilityCheck[];
}

export interface AccessibilityCheck {
  id: string;
  impact: string;
  message: string;
  data: any;
  relatedNodes: any[];
}

// Test Utility Types
export interface TestRenderOptions {
  wrapper?: React.ComponentType<any>;
  initialProps?: Record<string, any>;
  queries?: Record<string, any>;
  baseElement?: HTMLElement;
}

export interface MockTimers {
  useFakeTimers: () => void;
  useRealTimers: () => void;
  advanceTimersByTime: (time: number) => void;
  runAllTimers: () => void;
  runOnlyPendingTimers: () => void;
}

export interface MockWebSocket {
  send: jest.MockedFunction<(data: string) => void>;
  close: jest.MockedFunction<() => void>;
  addEventListener: jest.MockedFunction<(event: string, handler: Function) => void>;
  removeEventListener: jest.MockedFunction<(event: string, handler: Function) => void>;
  readyState: number;
  url: string;
}

// Game Phase Types
export type GamePhase = 
  | 'waiting'
  | 'starting'
  | 'speech'
  | 'discussion' 
  | 'voting'
  | 'defense'
  | 'liar_guess'
  | 'final_vote'
  | 'ended';

// Test Data Factory Types
export interface TestDataFactory<T> {
  build: (overrides?: Partial<T>) => T;
  buildList: (count: number, overrides?: Partial<T>) => T[];
  sequence: (field: keyof T, start?: number) => TestDataFactory<T>;
  trait: (name: string, changes: Partial<T>) => TestDataFactory<T>;
  afterBuild: (callback: (instance: T) => void) => TestDataFactory<T>;
}

// Component Test Props
export interface ComponentTestProps {
  testId?: string;
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

// Form Test Types
export interface FormTestData {
  valid: Record<string, any>;
  invalid: Record<string, any>;
  errors: Record<string, string>;
}

// E2E Test Types
export interface E2ETestContext {
  page: any; // Playwright page
  browser: any; // Playwright browser
  baseURL: string;
  testData: Record<string, any>;
}

// Visual Testing Types
export interface VisualTestOptions {
  threshold: number;
  includeAA?: boolean;
  animations?: 'disabled' | 'allow';
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface VisualTestResult {
  passed: boolean;
  diffRatio: number;
  diffPixels: number;
  screenshot: string;
  baseline: string;
  diff?: string;
}

// Test Report Types
export interface TestReport {
  summary: TestSummary;
  suites: TestSuiteReport[];
  coverage: CoverageReport;
  performance: PerformanceMetrics;
  accessibility: AccessibilityReport;
  timestamp: string;
  duration: number;
}

export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  failRate: number;
}

export interface TestSuiteReport {
  name: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  tests: TestCase[];
}

export interface TestCase {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: TestError;
  retries: number;
}

export interface TestError {
  message: string;
  stack: string;
  expected?: any;
  actual?: any;
  diff?: string;
}

export interface AccessibilityReport {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
  timestamp: string;
  url: string;
  toolOptions: Record<string, any>;
}

// Snapshot Test Types
export interface SnapshotOptions {
  updateSnapshots?: boolean;
  snapshotFormat?: {
    escapeString?: boolean;
    indent?: number;
    maxDepth?: number;
    min?: boolean;
    printBasicPrototype?: boolean;
    printFunctionName?: boolean;
  };
}

// Test Database Types (for integration tests)
export interface TestDatabase {
  connection: any;
  setup: () => Promise<void>;
  teardown: () => Promise<void>;
  seed: (data: Record<string, any[]>) => Promise<void>;
  clear: (tables: string[]) => Promise<void>;
  query: (sql: string, params?: any[]) => Promise<any>;
}

export interface TestServer {
  port: number;
  url: string;
  start: () => Promise<void>;
  stop: () => Promise<void>;
  reset: () => Promise<void>;
}

// Custom Matcher Types
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoViolations(): R;
      toBeAccessible(): R;
      toHaveValidHTML(): R;
      toMatchSnapshot(options?: SnapshotOptions): R;
      toHavePerformantRender(threshold?: number): R;
      toHaveValidSEO(): R;
      toBeResponsive(): R;
    }
  }
}