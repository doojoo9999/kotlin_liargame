/**
 * Comprehensive JWT Authentication Issue Reproduction and Diagnostic Script
 * 
 * This script reproduces the exact issue described:
 * - Login successful, accessToken stored in localStorage
 * - Game room creation API returns 500 error
 * - Server logs: "Anonymous user cannot create game room. Please login first."
 * - Spring Security recognizes user as anonymousUser instead of UserPrincipal
 */

const axios = require('axios');
const fs = require('fs');

// Configuration
const BASE_URL = 'http://localhost:8080';
const API_BASE = `${BASE_URL}/api/v1`;

// Test data
const TEST_USER = {
    nickname: 'TestUser_JWT_Debug'
};

const TEST_ROOM = {
    title: 'JWT Debug Test Room',
    maxPlayers: 4,
    isPrivate: false,
    useRandomSubjects: true,
    randomSubjectCount: 1
};

// Utility functions
function log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    
    // Also write to log file
    fs.appendFileSync('jwt_debug.log', logMessage + '\n');
}

function logSeparator(title) {
    const separator = '='.repeat(80);
    log(separator);
    log(`  ${title}`);
    log(separator);
}

// Step 1: Test login and token storage
async function testLogin() {
    logSeparator('STEP 1: Testing Login and Token Storage');
    
    try {
        log('Attempting login...');
        const response = await axios.post(`${API_BASE}/auth/login`, {
            nickname: TEST_USER.nickname
        });
        
        log(`Login response status: ${response.status}`);
        log(`Login response data: ${JSON.stringify(response.data, null, 2)}`);
        
        if (response.data.accessToken) {
            log('✅ Login successful - accessToken received');
            log(`Access token (first 50 chars): ${response.data.accessToken.substring(0, 50)}...`);
            
            // Simulate localStorage storage
            global.localStorage = {
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                userData: JSON.stringify({
                    nickname: TEST_USER.nickname,
                    userId: response.data.userId
                })
            };
            
            log('✅ Tokens stored in simulated localStorage');
            return response.data;
        } else {
            log('❌ Login failed - no accessToken in response');
            return null;
        }
        
    } catch (error) {
        log(`❌ Login error: ${error.message}`, 'ERROR');
        if (error.response) {
            log(`Error response: ${JSON.stringify(error.response.data)}`, 'ERROR');
        }
        return null;
    }
}

// Step 2: Validate JWT token format and content
function validateJWTToken(token) {
    logSeparator('STEP 2: JWT Token Validation');
    
    if (!token) {
        log('❌ No token provided for validation');
        return false;
    }
    
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            log(`❌ Invalid JWT format - expected 3 parts, got ${parts.length}`);
            return false;
        }
        
        // Decode header and payload
        const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        
        log('✅ JWT token format is valid');
        log(`Header: ${JSON.stringify(header, null, 2)}`);
        log(`Payload: ${JSON.stringify(payload, null, 2)}`);
        
        // Check expiration
        const now = Math.floor(Date.now() / 1000);
        const exp = payload.exp;
        const isExpired = exp && exp < now;
        
        log(`Current time (unix): ${now}`);
        log(`Token expires (unix): ${exp}`);
        log(`Is expired: ${isExpired}`);
        
        if (isExpired) {
            log('❌ Token is expired');
            return false;
        }
        
        // Check required claims
        if (!payload.sub || !payload.nickname) {
            log('❌ Missing required claims (sub or nickname)');
            return false;
        }
        
        log('✅ JWT token validation successful');
        log(`User ID: ${payload.sub}`);
        log(`Nickname: ${payload.nickname}`);
        
        return true;
        
    } catch (error) {
        log(`❌ JWT validation error: ${error.message}`, 'ERROR');
        return false;
    }
}

// Step 3: Test backend diagnostic endpoint
async function testBackendDiagnostic(token) {
    logSeparator('STEP 3: Backend JWT Diagnostic');
    
    try {
        log('Testing backend JWT diagnostic endpoint...');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        log(`Request headers: ${JSON.stringify(headers, null, 2)}`);
        
        const response = await axios.get(`${API_BASE}/debug/jwt-status`, { headers });
        
        log(`Diagnostic response status: ${response.status}`);
        log(`Diagnostic response: ${JSON.stringify(response.data, null, 2)}`);
        
        const diagnostic = response.data;
        
        // Analyze diagnostic results
        if (diagnostic.authenticationStatus === 'AUTHENTICATED_USER_PRINCIPAL') {
            log('✅ Backend authentication is working correctly');
            return true;
        } else if (diagnostic.authenticationStatus === 'ANONYMOUS_USER') {
            log('❌ ISSUE FOUND: Backend sees user as anonymous');
            log('🔍 This is the root cause of the room creation failure');
            
            // Additional analysis
            if (diagnostic.tokenPresent && diagnostic.tokenValid) {
                log('🔍 Token is present and valid, but authentication still failed');
                log('🔍 Possible causes:');
                log('  - JWT filter not properly setting SecurityContext');
                log('  - Token not found in database');
                log('  - Filter chain configuration issue');
                
                if (diagnostic.tokenInDatabase === false) {
                    log('🔍 LIKELY CAUSE: Token not found in database');
                }
            } else if (!diagnostic.tokenPresent) {
                log('🔍 LIKELY CAUSE: Authorization header not reaching backend');
            } else if (!diagnostic.tokenValid) {
                log('🔍 LIKELY CAUSE: Token validation failed on backend');
            }
            
            return false;
        } else {
            log(`❌ Unexpected authentication status: ${diagnostic.authenticationStatus}`);
            return false;
        }
        
    } catch (error) {
        log(`❌ Backend diagnostic error: ${error.message}`, 'ERROR');
        if (error.response) {
            log(`Error response: ${JSON.stringify(error.response.data)}`, 'ERROR');
        }
        return false;
    }
}

// Step 4: Test room creation (the failing endpoint)
async function testRoomCreation(token) {
    logSeparator('STEP 4: Testing Game Room Creation (The Failing Endpoint)');
    
    try {
        log('Attempting to create game room...');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        log(`Request headers: ${JSON.stringify(headers, null, 2)}`);
        log(`Request body: ${JSON.stringify(TEST_ROOM, null, 2)}`);
        
        const response = await axios.post(`${API_BASE}/game/create`, TEST_ROOM, { headers });
        
        log(`Room creation response status: ${response.status}`);
        log(`Room creation response: ${JSON.stringify(response.data, null, 2)}`);
        
        log('✅ Room creation successful - issue appears to be resolved!');
        return true;
        
    } catch (error) {
        log(`❌ Room creation failed: ${error.message}`, 'ERROR');
        
        if (error.response) {
            log(`Error status: ${error.response.status}`);
            log(`Error response: ${JSON.stringify(error.response.data)}`, 'ERROR');
            
            // Check for the specific error message
            const errorMessage = error.response.data?.message || error.response.data || '';
            if (errorMessage.includes('Anonymous user cannot create game room')) {
                log('🔍 CONFIRMED: This is the exact error from the issue description');
                log('🔍 Backend is receiving anonymousUser instead of UserPrincipal');
                return false;
            }
        }
        
        return false;
    }
}

// Step 5: Test backend room creation diagnostic
async function testBackendRoomCreationDiagnostic(token) {
    logSeparator('STEP 5: Backend Room Creation Diagnostic');
    
    try {
        log('Testing backend room creation diagnostic...');
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        const response = await axios.post(`${API_BASE}/debug/test-room-creation`, {}, { headers });
        
        log(`Room creation diagnostic status: ${response.status}`);
        log(`Room creation diagnostic: ${JSON.stringify(response.data, null, 2)}`);
        
        const diagnostic = response.data;
        
        if (diagnostic.canCreateRoom) {
            log('✅ Backend confirms user can create rooms');
            return true;
        } else {
            log('❌ Backend confirms user CANNOT create rooms');
            log(`Issue: ${diagnostic.issue}`);
            log(`Message: ${diagnostic.message}`);
            return false;
        }
        
    } catch (error) {
        log(`❌ Room creation diagnostic error: ${error.message}`, 'ERROR');
        if (error.response) {
            log(`Error response: ${JSON.stringify(error.response.data)}`, 'ERROR');
        }
        return false;
    }
}

// Main test execution
async function runCompleteTest() {
    logSeparator('JWT AUTHENTICATION ISSUE REPRODUCTION TEST');
    log('Starting comprehensive JWT authentication diagnostic...');
    
    // Clear previous log
    if (fs.existsSync('jwt_debug.log')) {
        fs.unlinkSync('jwt_debug.log');
    }
    
    const results = {
        login: false,
        tokenValidation: false,
        backendDiagnostic: false,
        roomCreation: false,
        roomCreationDiagnostic: false
    };
    
    try {
        // Step 1: Login
        const loginData = await testLogin();
        if (!loginData || !loginData.accessToken) {
            log('❌ Cannot proceed - login failed');
            return results;
        }
        results.login = true;
        
        const token = loginData.accessToken;
        
        // Step 2: Validate token
        results.tokenValidation = validateJWTToken(token);
        
        // Step 3: Backend diagnostic
        results.backendDiagnostic = await testBackendDiagnostic(token);
        
        // Step 4: Room creation
        results.roomCreation = await testRoomCreation(token);
        
        // Step 5: Room creation diagnostic
        results.roomCreationDiagnostic = await testBackendRoomCreationDiagnostic(token);
        
    } catch (error) {
        log(`❌ Test execution error: ${error.message}`, 'ERROR');
    }
    
    // Final summary
    logSeparator('TEST RESULTS SUMMARY');
    log(`Login: ${results.login ? '✅ PASS' : '❌ FAIL'}`);
    log(`Token Validation: ${results.tokenValidation ? '✅ PASS' : '❌ FAIL'}`);
    log(`Backend Diagnostic: ${results.backendDiagnostic ? '✅ PASS' : '❌ FAIL'}`);
    log(`Room Creation: ${results.roomCreation ? '✅ PASS' : '❌ FAIL'}`);
    log(`Room Creation Diagnostic: ${results.roomCreationDiagnostic ? '✅ PASS' : '❌ FAIL'}`);
    
    // Issue analysis
    logSeparator('ISSUE ANALYSIS');
    if (results.login && results.tokenValidation && !results.backendDiagnostic) {
        log('🔍 ROOT CAUSE IDENTIFIED:');
        log('- Frontend login works correctly');
        log('- JWT token is valid and properly formatted');
        log('- Backend JWT authentication filter is failing');
        log('- SecurityContext contains anonymousUser instead of UserPrincipal');
        log('');
        log('💡 RECOMMENDED FIXES:');
        log('1. Check JWT secret key configuration');
        log('2. Verify token database storage during login');
        log('3. Review JWT filter chain configuration');
        log('4. Check Spring Security configuration');
    } else if (!results.login) {
        log('🔍 Issue is in the login process');
    } else if (!results.tokenValidation) {
        log('🔍 Issue is with JWT token format or content');
    } else {
        log('🔍 Issue analysis inconclusive - check individual test results');
    }
    
    log('');
    log('📋 Detailed logs saved to: jwt_debug.log');
    log('🔧 Use the enhanced JWT filter logs to trace the authentication flow');
    
    return results;
}

// Export for use as module or run directly
if (require.main === module) {
    runCompleteTest().then(results => {
        process.exit(results.roomCreation ? 0 : 1);
    }).catch(error => {
        console.error('Test execution failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runCompleteTest,
    testLogin,
    validateJWTToken,
    testBackendDiagnostic,
    testRoomCreation,
    testBackendRoomCreationDiagnostic
};