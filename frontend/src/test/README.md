# Frontend Test Suite

This comprehensive test suite provides complete testing coverage for the frontend application using modern testing practices and tools.

## 📁 Test Structure

```
src/test/
├── main-test-orchestrator.ts    # Main test coordinator and runner
├── test-runner.ts               # CLI test execution and reporting
├── types.ts                     # TypeScript type definitions
├── setup.ts                     # Global test configuration
│
├── utils/
│   └── utils.test.ts           # Utility functions tests
│
├── api/
│   └── api-client.test.ts      # API client and HTTP requests
│
├── hooks/
│   └── hooks.test.ts           # Custom React hooks
│
├── stores/
│   └── stores.test.ts          # Zustand state management
│
├── validation/
│   └── validation.test.ts      # Form validation and data validation
│
├── components/
│   ├── auth-components.test.tsx      # Authentication UI components
│   ├── game-components.test.tsx      # Game-related UI components
│   ├── chat-components.test.tsx      # Chat functionality components
│   ├── shared-components.test.tsx    # Reusable UI components
│   └── layout-components.test.tsx    # Layout and navigation
│
├── integration/
│   ├── auth-integration.test.tsx     # Authentication flow integration
│   ├── game-integration.test.tsx     # Game flow integration
│   ├── chat-integration.test.tsx     # Chat system integration
│   └── websocket-integration.test.tsx # WebSocket connections
│
├── accessibility/
│   └── accessibility.test.tsx        # WCAG compliance and a11y
│
└── optimization/
    ├── performance.test.tsx          # Performance and optimization
    ├── bundle-analysis.test.tsx      # Bundle size analysis
    └── memory-leaks.test.tsx         # Memory leak detection
```

## 🚀 Quick Start

### Running Tests

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Category-Specific Tests

```bash
# Component tests only
npm run test:components

# Integration tests
npm run test:integration

# Accessibility tests
npm run test:accessibility

# Performance tests
npm run test:optimization
```

## 🧪 Test Categories

### Unit Tests
- **Utils**: String manipulation, date formatting, validation helpers
- **API Client**: HTTP requests, error handling, retry logic
- **Hooks**: Custom React hooks for authentication, game state, WebSocket
- **Stores**: Zustand state management and actions
- **Validation**: Form validation using Zod schemas

### Component Tests
- **Authentication**: Login forms, user profiles, auth guards
- **Game Components**: Game boards, player lists, voting panels, phase indicators
- **Chat Components**: Message lists, input forms, user lists, notifications
- **Shared Components**: Reusable UI elements, modals, buttons
- **Layout Components**: Navigation, headers, sidebars

### Integration Tests
- **Authentication Flow**: Login/logout, session management, protected routes
- **Game Integration**: Complete game workflows, player interactions
- **Chat Integration**: Real-time messaging, WebSocket connections
- **WebSocket Integration**: Connection management, message handling

### Accessibility Tests
- **WCAG Compliance**: Level AA accessibility standards
- **Keyboard Navigation**: Tab order, keyboard shortcuts
- **Screen Reader Support**: ARIA labels, live regions
- **Color Contrast**: Visual accessibility requirements

### Performance Tests
- **Render Performance**: Component render times, re-render optimization
- **Bundle Analysis**: Code splitting, tree shaking effectiveness
- **Memory Usage**: Memory leaks, cleanup verification
- **Core Web Vitals**: FCP, LCP, FID, CLS metrics

## 🛠️ Testing Technologies

### Core Testing Framework
- **Vitest**: Fast unit test runner with TypeScript support
- **React Testing Library**: Component testing with user-centric approach
- **Jest DOM**: Custom matchers for DOM assertions
- **User Event**: Realistic user interaction simulation

### Specialized Testing Tools
- **Jest Axe**: Automated accessibility testing
- **MSW**: API mocking for integration tests
- **Playwright**: End-to-end testing capabilities
- **Happy DOM**: Lightweight DOM implementation

### Development Tools
- **Vitest UI**: Interactive test runner interface
- **Coverage Reports**: Line, branch, function coverage
- **Performance Monitoring**: Render time and memory tracking

## 📊 Coverage Requirements

### Minimum Coverage Thresholds
- **Lines**: 80%
- **Functions**: 85%
- **Branches**: 75%
- **Statements**: 80%

### Coverage Reports
Coverage reports are generated in multiple formats:
- **HTML**: Interactive coverage viewer (`coverage/index.html`)
- **LCOV**: For CI/CD integration (`coverage/lcov.info`)
- **JSON**: Programmatic access (`coverage/coverage-final.json`)
- **Text**: Console summary

## 🔧 Configuration

### Vitest Configuration
Primary configuration in `vitest.config.ts`:
- Test environment: jsdom for component tests
- Setup files: Global test utilities and mocks
- Coverage provider: v8 for accurate TypeScript coverage
- Parallel execution for performance

### Test Setup
Global setup in `src/test/setup.ts`:
- Jest DOM matchers
- Mock browser APIs (IntersectionObserver, ResizeObserver, etc.)
- Global cleanup after each test
- Mock implementations for external dependencies

## 🎯 Best Practices

### Test Organization
- **Arrange-Act-Assert**: Clear test structure
- **Descriptive Names**: Test names explain the behavior being tested
- **Single Responsibility**: One assertion per test when possible
- **Test Independence**: Tests don't depend on other tests

### Component Testing
- **User-Centric**: Test from user perspective, not implementation details
- **Accessibility First**: Include accessibility checks in component tests
- **Error States**: Test loading, error, and empty states
- **User Interactions**: Simulate realistic user behavior

### Mocking Strategy
- **Minimal Mocking**: Only mock external dependencies
- **Realistic Mocks**: Mocks behave like real implementations
- **Mock Cleanup**: Reset mocks between tests
- **Type-Safe Mocks**: Use TypeScript for mock type safety

## 🚨 Troubleshooting

### Common Issues

#### Tests Time Out
```bash
# Increase timeout for slow tests
vi.setConfig({ testTimeout: 10000 })
```

#### Memory Issues
```bash
# Run tests with more memory
node --max-old-space-size=4096 node_modules/.bin/vitest
```

#### Mock Issues
```bash
# Clear all mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
```

### Debug Mode
```bash
# Run single test file with debug output
npm test -- --reporter=verbose src/test/components/auth-components.test.tsx
```

## 📈 Continuous Integration

### GitHub Actions
The test suite is configured to run automatically on:
- Pull requests to main branch
- Push to main/develop branches
- Scheduled runs for regression testing

### Quality Gates
- **Coverage Threshold**: Must maintain minimum coverage
- **Test Passing**: All tests must pass
- **Performance Budget**: Bundle size and performance checks
- **Accessibility Standards**: No accessibility violations

### Reports
CI generates and uploads:
- Test results (JUnit XML)
- Coverage reports (LCOV)
- Performance metrics
- Accessibility audit results

## 🤝 Contributing

### Adding New Tests
1. Create test file in appropriate category directory
2. Follow existing naming conventions (`*.test.ts` or `*.test.tsx`)
3. Include both positive and negative test cases
4. Add accessibility tests for UI components
5. Update this README if adding new test categories

### Test Guidelines
- Write tests before or alongside feature development
- Ensure tests are deterministic and reliable
- Include edge cases and error scenarios
- Test user workflows, not just individual functions
- Maintain high code coverage without compromising quality

### Code Review Checklist
- [ ] Tests cover new functionality
- [ ] Tests are readable and maintainable
- [ ] No flaky or brittle tests
- [ ] Appropriate use of mocks and test utilities
- [ ] Tests run consistently in CI environment

## 📚 Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Axe](https://github.com/nickcolley/jest-axe)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Examples
Each test file includes comprehensive examples of:
- Component rendering and interaction testing
- API mocking and error handling
- Accessibility testing with Jest Axe
- Performance and optimization testing
- Integration testing patterns

---

## 🎉 Test Execution Summary

The test orchestrator provides detailed execution reports including:
- **Total execution time**
- **Coverage metrics by category**
- **Performance benchmarks**
- **Accessibility compliance status**
- **Quality gate results**
- **Recommendations for improvement**

Run `npm run test:coverage` to see the full report!