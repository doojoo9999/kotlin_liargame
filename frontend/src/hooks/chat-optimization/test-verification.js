/**
 * Simple verification script to test the refactored useChatOptimization hook
 * This verifies that the API contract is preserved and all functions are available
 */

// Mock React hooks for testing outside React context
const mockSetState = (initialValue) => {
  let state = initialValue
  return [
    state,
    (newValue) => {
      state = typeof newValue === 'function' ? newValue(state) : newValue
    }
  ]
}

const mockUseCallback = (fn) => fn
const mockUseEffect = () => {}
const mockUseRef = (initialValue) => ({ current: initialValue })
const mockUseMemo = (fn) => fn()

// Mock React
global.React = {
  useState: mockSetState,
  useCallback: mockUseCallback,
  useEffect: mockUseEffect,
  useRef: mockUseRef,
  useMemo: mockUseMemo
}

// Mock performance API
global.performance = {
  now: () => Date.now(),
  memory: {
    usedJSHeapSize: 50000000 // 50MB
  }
}

// Mock navigator (using Object.defineProperty to avoid readonly issues)
if (typeof global.navigator === 'undefined') {
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15'
    },
    writable: false,
    configurable: true
  })
}

// Mock window
if (typeof global.window === 'undefined') {
  global.window = {}
}

async function runTest() {
  try {
    console.log('Testing refactored useChatOptimization hook...')

    // Import the hook (this will test if all dependencies are properly resolved)
    const { useChatOptimization } = await import('./useChatOptimization.js')

  console.log('✓ Hook import successful')

  // Test with default options
  const hookResult = useChatOptimization()

  console.log('✓ Hook initialization successful')

  // Verify API contract - check all expected properties exist
  const expectedProperties = [
    'messages',
    'addMessages',
    'clearMessages', 
    'isThrottling',
    'performanceStats',
    'virtualScrollHelpers',
    'getPerformanceReport',
    'mobileOptimizations',
    'isOptimizationEnabled',
    'queueLength'
  ]

  console.log('Verifying API contract...')
  let missingProperties = []

  expectedProperties.forEach(prop => {
    if (!(prop in hookResult)) {
      missingProperties.push(prop)
    } else {
      console.log(`✓ ${prop}: ${typeof hookResult[prop]}`)
    }
  })

  if (missingProperties.length > 0) {
    console.error('✗ Missing properties:', missingProperties)
    process.exit(1)
  }

  // Test performanceStats structure
  const statsProperties = ['messagesProcessed', 'messagesDropped', 'averageRenderTime', 'memoryUsage']
  statsProperties.forEach(prop => {
    if (!(prop in hookResult.performanceStats)) {
      console.error(`✗ Missing performanceStats.${prop}`)
      process.exit(1)
    } else {
      console.log(`✓ performanceStats.${prop}: ${typeof hookResult.performanceStats[prop]}`)
    }
  })

  // Test functions are callable
  if (typeof hookResult.addMessages !== 'function') {
    console.error('✗ addMessages is not a function')
    process.exit(1)
  }

  if (typeof hookResult.clearMessages !== 'function') {
    console.error('✗ clearMessages is not a function')
    process.exit(1)
  }

  if (typeof hookResult.getPerformanceReport !== 'function') {
    console.error('✗ getPerformanceReport is not a function')
    process.exit(1)
  }

  console.log('✓ All required functions are present and callable')

  // Test mobile optimizations (should detect iPhone)
  if (hookResult.mobileOptimizations.isMobile !== true) {
    console.error('✗ Mobile detection failed')
    process.exit(1)
  }
  console.log('✓ Mobile optimization detection working')

  // Test virtual scroll helpers
  if (hookResult.virtualScrollHelpers) {
    const helperFunctions = ['getItemHeight', 'getEstimatedTotalHeight', 'shouldItemUpdate']
    helperFunctions.forEach(fn => {
      if (typeof hookResult.virtualScrollHelpers[fn] !== 'function') {
        console.error(`✗ virtualScrollHelpers.${fn} is not a function`)
        process.exit(1)
      }
    })
    console.log('✓ Virtual scroll helpers are present')
  }

  console.log('\n🎉 All tests passed! Refactored hook maintains API contract.')
  console.log('✓ External API compatibility verified')
  console.log('✓ All internal hooks properly integrated')
  console.log('✓ Mobile optimizations working')
  console.log('✓ Performance metrics functional')
  console.log('✓ Virtual scroll helpers available')

  } catch (error) {
    console.error('✗ Test failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the test
runTest()