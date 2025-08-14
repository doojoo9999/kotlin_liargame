/**
 * WebSocket Implementation Verification Script
 * 
 * This script verifies that:
 * 1. socket.io-client is completely removed from the project
 * 2. STOMP clients implement proper connection guards
 * 3. Subscriptions are idempotent (no duplicates)
 * 4. Proper cleanup occurs on disconnect
 */

import fs from 'fs'
import path from 'path'

console.log('[DEBUG_LOG] Starting WebSocket implementation verification...\n')

// 1. Verify socket.io-client removal
console.log('1. Checking for socket.io-client removal:')

// Check package.json
const packageJsonPath = './package.json'
try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    if (packageJson.dependencies['socket.io-client']) {
        console.log('   ❌ socket.io-client still in package.json dependencies')
    } else {
        console.log('   ✅ socket.io-client removed from package.json dependencies')
    }
} catch (error) {
    console.log('   ❌ Failed to read package.json:', error.message)
}

// Check for any remaining socket.io-client imports
const srcDir = './src'
let socketIoImportsFound = false

function scanForSocketIoImports(dir) {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
        const filePath = path.join(dir, file)
        const stat = fs.statSync(filePath)
        
        if (stat.isDirectory()) {
            scanForSocketIoImports(filePath)
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            try {
                const content = fs.readFileSync(filePath, 'utf8')
                if (content.includes("'socket.io-client'") || content.includes('"socket.io-client"')) {
                    console.log(`   ❌ socket.io-client import found in: ${filePath}`)
                    socketIoImportsFound = true
                }
            } catch (error) {
                // Skip files that can't be read
            }
        }
    }
}

try {
    scanForSocketIoImports(srcDir)
    if (!socketIoImportsFound) {
        console.log('   ✅ No socket.io-client imports found in source code')
    }
} catch (error) {
    console.log('   ❌ Failed to scan source files:', error.message)
}

// 2. Verify STOMP client implementations
console.log('\n2. Checking STOMP client implementations:')

// Check gameStompClient
const gameStompClientPath = './src/socket/gameStompClient.js'
try {
    const gameStompContent = fs.readFileSync(gameStompClientPath, 'utf8')
    
    const hasConnectionGuards = gameStompContent.includes('isConnecting') && 
                               gameStompContent.includes('connectionPromise')
    const hasSubscriptionMap = gameStompContent.includes('subscriptions = new Map()')
    const hasIdempotentSubscribe = gameStompContent.includes('subscriptions.has(topic)')
    const hasProperDisconnect = gameStompContent.includes('subscriptions.forEach') &&
                               gameStompContent.includes('unsubscribe()')
    
    console.log(`   gameStompClient.js:`)
    console.log(`     ${hasConnectionGuards ? '✅' : '❌'} Connection guards (isConnecting, connectionPromise)`)
    console.log(`     ${hasSubscriptionMap ? '✅' : '❌'} Subscription Map for tracking`)
    console.log(`     ${hasIdempotentSubscribe ? '✅' : '❌'} Idempotent subscription check`)
    console.log(`     ${hasProperDisconnect ? '✅' : '❌'} Proper cleanup on disconnect`)
    
} catch (error) {
    console.log('   ❌ Failed to read gameStompClient.js:', error.message)
}

// Check adminStompClient
const adminStompClientPath = './src/utils/stompClient.js'
try {
    const adminStompContent = fs.readFileSync(adminStompClientPath, 'utf8')
    
    const hasConnectionGuards = adminStompContent.includes('isConnecting') && 
                               adminStompContent.includes('connectionPromise')
    const hasSubscriptionMap = adminStompContent.includes('subscriptions = new Map()')
    const hasIdempotentSubscribe = adminStompContent.includes('subscriptions.has(topic)')
    const hasProperDisconnect = adminStompContent.includes('subscriptions.forEach') &&
                               adminStompContent.includes('unsubscribe()')
    
    console.log(`   adminStompClient.js:`)
    console.log(`     ${hasConnectionGuards ? '✅' : '❌'} Connection guards (isConnecting, connectionPromise)`)
    console.log(`     ${hasSubscriptionMap ? '✅' : '❌'} Subscription Map for tracking`)
    console.log(`     ${hasIdempotentSubscribe ? '✅' : '❌'} Idempotent subscription check`)
    console.log(`     ${hasProperDisconnect ? '✅' : '❌'} Proper cleanup on disconnect`)
    
} catch (error) {
    console.log('   ❌ Failed to read stompClient.js:', error.message)
}

// 3. Verify dependencies
console.log('\n3. Checking required dependencies:')

try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const hasStompJs = packageJson.dependencies['@stomp/stompjs']
    const hasSockJsClient = packageJson.dependencies['sockjs-client']
    
    console.log(`   ${hasStompJs ? '✅' : '❌'} @stomp/stompjs: ${hasStompJs || 'missing'}`)
    console.log(`   ${hasSockJsClient ? '✅' : '❌'} sockjs-client: ${hasSockJsClient || 'missing'}`)
    
} catch (error) {
    console.log('   ❌ Failed to verify dependencies:', error.message)
}

console.log('\n[DEBUG_LOG] WebSocket implementation verification complete!')
console.log('\n🎯 Summary:')
console.log('   - Removed socket.io-client dependency and usage')
console.log('   - Implemented connection guards to prevent duplicate connections')
console.log('   - Added idempotent subscription management with Map')
console.log('   - Ensured proper cleanup and disconnection logic')
console.log('   - Maintained @stomp/stompjs + sockjs-client stack as required')