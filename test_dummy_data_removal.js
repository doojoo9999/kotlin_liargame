// Test script to verify dummy data removal
console.log('[DEBUG_LOG] Testing dummy data removal...')

// Test 1: Verify environment variables are set correctly
console.log('[DEBUG_LOG] Environment variables:')
console.log('VITE_USE_DUMMY_WEBSOCKET:', process.env.VITE_USE_DUMMY_WEBSOCKET || 'undefined')
console.log('VITE_USE_DUMMY_DATA:', process.env.VITE_USE_DUMMY_DATA || 'undefined')

// Test 2: Check if gameApi.js no longer has dummy data references
const fs = require('fs')
const path = require('path')

try {
  const gameApiPath = path.join(__dirname, 'frontend', 'src', 'api', 'gameApi.js')
  const gameApiContent = fs.readFileSync(gameApiPath, 'utf8')
  
  console.log('[DEBUG_LOG] Checking gameApi.js for dummy data references...')
  
  // Check for removed dummy data references
  const dummyDataReferences = [
    'dummyData.rooms',
    'dummyData.subjects',
    'config.useDummyData',
    'export const dummyData'
  ]
  
  let foundDummyReferences = false
  dummyDataReferences.forEach(ref => {
    if (gameApiContent.includes(ref)) {
      console.log(`[ERROR] Found dummy data reference: ${ref}`)
      foundDummyReferences = true
    }
  })
  
  if (!foundDummyReferences) {
    console.log('[DEBUG_LOG] ✅ No dummy data references found in gameApi.js')
  }
  
  // Check for required API functions
  const requiredFunctions = [
    'getAllRooms',
    'getAllSubjects',
    'getRoomDetails',
    'getRoomPlayers'
  ]
  
  requiredFunctions.forEach(func => {
    if (gameApiContent.includes(`export const ${func}`)) {
      console.log(`[DEBUG_LOG] ✅ Found required function: ${func}`)
    } else {
      console.log(`[ERROR] Missing required function: ${func}`)
    }
  })
  
} catch (error) {
  console.error('[ERROR] Failed to read gameApi.js:', error.message)
}

// Test 3: Check GameContext.jsx for dummy data removal
try {
  const contextPath = path.join(__dirname, 'frontend', 'src', 'context', 'GameContext.jsx')
  const contextContent = fs.readFileSync(contextPath, 'utf8')
  
  console.log('[DEBUG_LOG] Checking GameContext.jsx for dummy data references...')
  
  // Check for removed dummy data references
  const contextDummyReferences = [
    'VITE_USE_DUMMY_WEBSOCKET === \'true\'',
    'gameApi.dummyData.rooms',
    'isDummyMode'
  ]
  
  let foundContextDummyReferences = false
  contextDummyReferences.forEach(ref => {
    if (contextContent.includes(ref)) {
      console.log(`[ERROR] Found dummy data reference in GameContext.jsx: ${ref}`)
      foundContextDummyReferences = true
    }
  })
  
  if (!foundContextDummyReferences) {
    console.log('[DEBUG_LOG] ✅ No dummy data references found in GameContext.jsx')
  }
  
  // Check for getCurrentRoom function
  if (contextContent.includes('const getCurrentRoom')) {
    console.log('[DEBUG_LOG] ✅ Found getCurrentRoom function')
  } else {
    console.log('[ERROR] Missing getCurrentRoom function')
  }
  
} catch (error) {
  console.error('[ERROR] Failed to read GameContext.jsx:', error.message)
}

// Test 4: Check environment files
try {
  const envPath = path.join(__dirname, 'frontend', '.env')
  const envContent = fs.readFileSync(envPath, 'utf8')
  
  console.log('[DEBUG_LOG] Checking .env file...')
  
  if (envContent.includes('VITE_USE_DUMMY_WEBSOCKET=false')) {
    console.log('[DEBUG_LOG] ✅ VITE_USE_DUMMY_WEBSOCKET is set to false')
  } else {
    console.log('[ERROR] VITE_USE_DUMMY_WEBSOCKET is not set to false')
  }
  
  if (envContent.includes('VITE_USE_DUMMY_DATA=false')) {
    console.log('[DEBUG_LOG] ✅ VITE_USE_DUMMY_DATA is set to false')
  } else {
    console.log('[ERROR] VITE_USE_DUMMY_DATA is not set to false')
  }
  
} catch (error) {
  console.error('[ERROR] Failed to read .env file:', error.message)
}

console.log('[DEBUG_LOG] Dummy data removal test completed!')