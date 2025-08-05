# WebSocket Authentication Fix Summary

## Issue Description
The user reported that chat messages were not appearing in the chat history, with the following errors in the Spring Boot logs:
```
[ERROR] WebSocket chat error: Not authenticated via WebSocket
[ERROR] WebSocket chat error: Not authenticated via WebSocket
```

The `getChatHistory` debug logs showed 0 messages being returned even though users were connected and attempting to send messages.

## Root Cause Analysis

### 1. Authentication Flow Investigation
- **Backend Authentication**: The backend uses session-based authentication where:
  - HTTP API calls establish a session with `userId` stored in `HttpSession`
  - WebSocket connections need to access this session to authenticate users
  - The `ChatService.sendMessageViaWebSocket()` method expects `sessionAttributes["userId"]` to be available

### 2. WebSocket Configuration Analysis
- **Backend WebSocket Config** (`WebSocketConfig.kt`): 
  - Properly configured to extract `userId` from HTTP session and store in WebSocket session attributes
  - Interceptor logs showed "No HTTP session found in WebSocket connection"

### 3. Frontend WebSocket Connection Analysis
- **HTTP API Client** (`apiClient.js`): Correctly configured with `withCredentials: true` for session cookies
- **WebSocket Clients**: Missing `withCredentials: true` configuration, causing session cookies not to be sent

## The Fix

### Modified Files

#### 1. `frontend/src/socket/gameStompClient.js`
**Before:**
```javascript
this.client = new Client({
    webSocketFactory: () => new SockJS(`${serverUrl}/ws`),
    connectHeaders: {
        ...options.headers
    },
```

**After:**
```javascript
this.client = new Client({
    webSocketFactory: () => new SockJS(`${serverUrl}/ws`, null, {
        withCredentials: true // 세션 쿠키 포함
    }),
    connectHeaders: {
        ...options.headers
    },
```

#### 2. `frontend/src/utils/stompClient.js`
**Before:**
```javascript
this.client = new Client({
    webSocketFactory: () => new SockJS(`${serverUrl}/ws`),
    connectHeaders: {
        ...options.headers
    },
```

**After:**
```javascript
this.client = new Client({
    webSocketFactory: () => new SockJS(`${serverUrl}/ws`, null, {
        withCredentials: true // 세션 쿠키 포함
    }),
    connectHeaders: {
        ...options.headers
    },
```

## How the Fix Works

### 1. Session Cookie Transmission
- **Before**: WebSocket connections were established without session cookies
- **After**: WebSocket connections now include session cookies via `withCredentials: true`

### 2. Authentication Flow
1. User logs in via HTTP API → Session established with `userId`
2. WebSocket connection made with session cookies → Backend can access HTTP session
3. `WebSocketConfig` interceptor extracts `userId` from HTTP session → Stores in WebSocket session attributes
4. `ChatService.sendMessageViaWebSocket()` finds `userId` in session attributes → Authentication succeeds
5. Chat message is saved to database and broadcast to subscribers

### 3. Message Persistence
- With authentication working, chat messages are now properly saved to the database
- `getChatHistory` will return the saved messages instead of 0 messages

## Expected Results

### 1. No More Authentication Errors
- The "Not authenticated via WebSocket" errors should disappear
- WebSocket connections will successfully authenticate using session cookies

### 2. Chat Messages Visible
- User messages sent via WebSocket will be saved to the database
- Chat history will show previously sent messages
- Real-time chat functionality will work as expected

### 3. Debug Logs Should Show
```
[DEBUG] WebSocket session authenticated with userId: [USER_ID]
[DEBUG] WebSocket chat message sent successfully
[DEBUG] All messages in database for game [GAME_NUMBER]: [MESSAGE_COUNT > 0]
```

## Technical Details

### Session-Based Authentication
- The application uses session-based authentication (not JWT)
- HTTP sessions store `userId` after successful login
- WebSocket connections must include session cookies to access this information

### SockJS Configuration
- SockJS is used as the WebSocket transport layer
- The third parameter of `new SockJS(url, protocols, options)` accepts options including `withCredentials`
- This ensures session cookies are sent with the WebSocket handshake

## Verification
The fix addresses the core issue where WebSocket connections couldn't authenticate because they weren't sending session cookies. With this change:
1. WebSocket authentication will succeed
2. Chat messages will be saved to the database
3. Chat history will display properly
4. Real-time messaging will function correctly

## Files Modified
- `frontend/src/socket/gameStompClient.js` - Added `withCredentials: true` to SockJS options
- `frontend/src/utils/stompClient.js` - Added `withCredentials: true` to SockJS options

## Impact
- **Minimal Risk**: Only adds credential transmission to WebSocket connections
- **No Breaking Changes**: Existing functionality remains unchanged
- **Immediate Effect**: Fix takes effect as soon as frontend is reloaded