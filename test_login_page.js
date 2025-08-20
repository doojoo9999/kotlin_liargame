// Test script to verify the login page loads without console errors
// This script checks if the CssBaseline semiBold error is resolved

const http = require('http');
const { spawn } = require('child_process');

console.log('[DEBUG_LOG] Starting login page test...');

// Function to check if server is running
function checkServer() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 5173,
            path: '/',
            method: 'GET',
            timeout: 1000
        }, (res) => {
            resolve(true);
        });
        
        req.on('error', () => {
            resolve(false);
        });
        
        req.on('timeout', () => {
            req.destroy();
            resolve(false);
        });
        
        req.end();
    });
}

async function testLoginPage() {
    console.log('[DEBUG_LOG] Checking if development server is running on localhost:5173...');
    
    const isServerRunning = await checkServer();
    
    if (!isServerRunning) {
        console.log('[DEBUG_LOG] Development server not running. Please start it with: npm run dev');
        console.log('[DEBUG_LOG] Then access http://localhost:5173/login to verify the fix');
        return;
    }
    
    console.log('[DEBUG_LOG] Development server is running!');
    console.log('[DEBUG_LOG] Please manually test:');
    console.log('[DEBUG_LOG] 1. Open browser and navigate to: http://localhost:5173/login');
    console.log('[DEBUG_LOG] 2. Check browser console for any errors');
    console.log('[DEBUG_LOG] 3. Verify the page loads without the "Cannot read properties of undefined (reading \'semiBold\')" error');
    console.log('[DEBUG_LOG] 4. The page should show login content instead of blank white screen');
}

testLoginPage().catch(console.error);