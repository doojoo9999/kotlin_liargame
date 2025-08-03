/**
 * JWT Authentication Diagnostic Tool
 * This script helps diagnose JWT authentication issues between frontend and backend
 */

// JWT Token Validation Function
function validateJWTToken(token) {
    console.log('[JWT_DIAGNOSTIC] Starting JWT token validation...')
    
    if (!token) {
        console.error('[JWT_DIAGNOSTIC] ❌ No token provided')
        return { valid: false, error: 'No token provided' }
    }
    
    // Check token format
    const parts = token.split('.')
    if (parts.length !== 3) {
        console.error('[JWT_DIAGNOSTIC] ❌ Invalid JWT format - expected 3 parts, got:', parts.length)
        return { valid: false, error: 'Invalid JWT format' }
    }
    
    try {
        // Decode header
        const header = JSON.parse(atob(parts[0]))
        console.log('[JWT_DIAGNOSTIC] ✅ JWT Header:', header)
        
        // Decode payload
        const payload = JSON.parse(atob(parts[1]))
        console.log('[JWT_DIAGNOSTIC] ✅ JWT Payload:', payload)
        
        // Check expiration
        const now = Math.floor(Date.now() / 1000)
        const exp = payload.exp
        const isExpired = exp && exp < now
        
        console.log('[JWT_DIAGNOSTIC] Token expiration check:')
        console.log('  - Current time (unix):', now)
        console.log('  - Token expires (unix):', exp)
        console.log('  - Is expired:', isExpired)
        
        if (isExpired) {
            console.error('[JWT_DIAGNOSTIC] ❌ Token is expired')
            return { valid: false, error: 'Token expired', payload, header }
        }
        
        // Check required claims
        const requiredClaims = ['sub', 'nickname']
        const missingClaims = requiredClaims.filter(claim => !payload[claim])
        
        if (missingClaims.length > 0) {
            console.error('[JWT_DIAGNOSTIC] ❌ Missing required claims:', missingClaims)
            return { valid: false, error: 'Missing required claims', missingClaims, payload, header }
        }
        
        console.log('[JWT_DIAGNOSTIC] ✅ Token validation successful')
        return { 
            valid: true, 
            payload, 
            header,
            userId: payload.sub,
            nickname: payload.nickname,
            expiresAt: new Date(exp * 1000).toISOString()
        }
        
    } catch (error) {
        console.error('[JWT_DIAGNOSTIC] ❌ Error decoding token:', error.message)
        return { valid: false, error: 'Token decode error: ' + error.message }
    }
}

// API Request Header Verification
function verifyAPIRequestHeaders() {
    console.log('[JWT_DIAGNOSTIC] Checking localStorage tokens...')
    
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const adminToken = localStorage.getItem('adminAccessToken')
    const userData = localStorage.getItem('userData')
    
    console.log('[JWT_DIAGNOSTIC] Token storage status:')
    console.log('  - accessToken:', accessToken ? '✅ Present' : '❌ Missing')
    console.log('  - refreshToken:', refreshToken ? '✅ Present' : '❌ Missing')
    console.log('  - adminAccessToken:', adminToken ? '✅ Present' : '❌ Missing')
    console.log('  - userData:', userData ? '✅ Present' : '❌ Missing')
    
    // Validate the primary token
    const primaryToken = adminToken || accessToken
    if (primaryToken) {
        console.log('[JWT_DIAGNOSTIC] Validating primary token...')
        const validation = validateJWTToken(primaryToken)
        
        if (validation.valid) {
            console.log('[JWT_DIAGNOSTIC] ✅ Primary token is valid')
            console.log('  - User ID:', validation.userId)
            console.log('  - Nickname:', validation.nickname)
            console.log('  - Expires at:', validation.expiresAt)
        } else {
            console.error('[JWT_DIAGNOSTIC] ❌ Primary token validation failed:', validation.error)
        }
        
        return validation
    } else {
        console.error('[JWT_DIAGNOSTIC] ❌ No tokens found in localStorage')
        return { valid: false, error: 'No tokens in localStorage' }
    }
}

// Test API Request with Headers
async function testAPIRequest(endpoint = '/api/v1/game/rooms') {
    console.log('[JWT_DIAGNOSTIC] Testing API request to:', endpoint)
    
    const tokenValidation = verifyAPIRequestHeaders()
    if (!tokenValidation.valid) {
        console.error('[JWT_DIAGNOSTIC] ❌ Cannot test API - invalid token')
        return
    }
    
    const accessToken = localStorage.getItem('accessToken')
    const adminToken = localStorage.getItem('adminAccessToken')
    const token = adminToken || accessToken
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
    
    console.log('[JWT_DIAGNOSTIC] Request headers:', headers)
    
    try {
        const baseURL = window.location.origin
        const fullURL = baseURL + endpoint
        
        console.log('[JWT_DIAGNOSTIC] Making request to:', fullURL)
        
        const response = await fetch(fullURL, {
            method: 'GET',
            headers: headers
        })
        
        console.log('[JWT_DIAGNOSTIC] Response status:', response.status)
        console.log('[JWT_DIAGNOSTIC] Response headers:', Object.fromEntries(response.headers.entries()))
        
        if (response.ok) {
            const data = await response.json()
            console.log('[JWT_DIAGNOSTIC] ✅ API request successful:', data)
            return { success: true, data, status: response.status }
        } else {
            const errorText = await response.text()
            console.error('[JWT_DIAGNOSTIC] ❌ API request failed:', errorText)
            return { success: false, error: errorText, status: response.status }
        }
        
    } catch (error) {
        console.error('[JWT_DIAGNOSTIC] ❌ Network error:', error.message)
        return { success: false, error: error.message }
    }
}

// Test Game Room Creation
async function testGameRoomCreation() {
    console.log('[JWT_DIAGNOSTIC] Testing game room creation...')
    
    const tokenValidation = verifyAPIRequestHeaders()
    if (!tokenValidation.valid) {
        console.error('[JWT_DIAGNOSTIC] ❌ Cannot test game room creation - invalid token')
        return
    }
    
    const testRoomData = {
        title: 'Test Room - JWT Diagnostic',
        maxPlayers: 4,
        isPrivate: false,
        useRandomSubjects: true,
        randomSubjectCount: 1
    }
    
    const accessToken = localStorage.getItem('accessToken')
    const adminToken = localStorage.getItem('adminAccessToken')
    const token = adminToken || accessToken
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    }
    
    console.log('[JWT_DIAGNOSTIC] Creating test room with data:', testRoomData)
    console.log('[JWT_DIAGNOSTIC] Using headers:', headers)
    
    try {
        const baseURL = window.location.origin
        const fullURL = baseURL + '/api/v1/game/create'
        
        const response = await fetch(fullURL, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(testRoomData)
        })
        
        console.log('[JWT_DIAGNOSTIC] Create room response status:', response.status)
        
        if (response.ok) {
            const data = await response.json()
            console.log('[JWT_DIAGNOSTIC] ✅ Game room creation successful:', data)
            return { success: true, data, status: response.status }
        } else {
            const errorText = await response.text()
            console.error('[JWT_DIAGNOSTIC] ❌ Game room creation failed:', errorText)
            
            // Check if it's the specific authentication error
            if (errorText.includes('Anonymous user cannot create game room')) {
                console.error('[JWT_DIAGNOSTIC] 🔍 FOUND THE ISSUE: Backend is receiving anonymousUser instead of UserPrincipal')
                console.error('[JWT_DIAGNOSTIC] This means JWT authentication filter is not properly setting SecurityContext')
            }
            
            return { success: false, error: errorText, status: response.status }
        }
        
    } catch (error) {
        console.error('[JWT_DIAGNOSTIC] ❌ Network error during room creation:', error.message)
        return { success: false, error: error.message }
    }
}

// Complete Diagnostic Run
async function runCompleteDiagnostic() {
    console.log('='.repeat(60))
    console.log('[JWT_DIAGNOSTIC] Starting Complete JWT Authentication Diagnostic')
    console.log('='.repeat(60))
    
    // Step 1: Check tokens in localStorage
    console.log('\n1. Checking localStorage tokens...')
    const tokenCheck = verifyAPIRequestHeaders()
    
    // Step 2: Test basic API request
    console.log('\n2. Testing basic API request...')
    const apiTest = await testAPIRequest()
    
    // Step 3: Test game room creation (the failing endpoint)
    console.log('\n3. Testing game room creation...')
    const roomTest = await testGameRoomCreation()
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('[JWT_DIAGNOSTIC] DIAGNOSTIC SUMMARY')
    console.log('='.repeat(60))
    console.log('Token validation:', tokenCheck.valid ? '✅ PASS' : '❌ FAIL')
    console.log('Basic API test:', apiTest?.success ? '✅ PASS' : '❌ FAIL')
    console.log('Room creation test:', roomTest?.success ? '✅ PASS' : '❌ FAIL')
    
    if (!roomTest?.success && roomTest?.error?.includes('Anonymous user cannot create game room')) {
        console.log('\n🔍 ROOT CAUSE IDENTIFIED:')
        console.log('- JWT token is valid on frontend')
        console.log('- Token is being sent with correct Authorization header')
        console.log('- Backend JWT filter is not properly authenticating the user')
        console.log('- SecurityContext contains anonymousUser instead of UserPrincipal')
        console.log('\n💡 LIKELY ISSUES:')
        console.log('1. JWT secret key mismatch between frontend and backend')
        console.log('2. Token not found in database (isTokenInDatabase check failing)')
        console.log('3. JWT filter not properly setting SecurityContext')
        console.log('4. Filter chain configuration issue')
    }
    
    return {
        tokenValid: tokenCheck.valid,
        apiWorking: apiTest?.success || false,
        roomCreationWorking: roomTest?.success || false,
        summary: {
            tokenCheck,
            apiTest,
            roomTest
        }
    }
}

// Export functions for use in browser console
window.jwtDiagnostic = {
    validateJWTToken,
    verifyAPIRequestHeaders,
    testAPIRequest,
    testGameRoomCreation,
    runCompleteDiagnostic
}

console.log('[JWT_DIAGNOSTIC] Diagnostic tools loaded. Use window.jwtDiagnostic.runCompleteDiagnostic() to start')