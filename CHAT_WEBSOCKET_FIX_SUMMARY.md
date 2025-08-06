# Chat WebSocket Authentication Fix Summary

## Issue Description
Users were unable to see chat messages in the chat window. The logs showed:
- Chat messages were being sent via WebSocket successfully
- Chat history API was returning empty arrays despite messages being sent
- Messages were not being persisted to the database

## Root Cause Analysis
The issue was caused by WebSocket authentication failure:

1. **Frontend**: Uses session-based authentication, connects to WebSocket without sending userId in headers
2. **Backend WebSocket Config**: Did not extract userId from HTTP session and store it in WebSocket session attributes
3. **Chat Service**: `sendMessageViaWebSocket` method expected `sessionAttributes["userId"]` but it was null
4. **Error Handling**: Exceptions were caught and only logged, causing silent failures

## Changes Made

### 1. WebSocketConfig.kt - Fixed WebSocket Authentication
**File**: `src/main/kotlin/org/example/kotlin_liargame/tools/websocket/WebSocketConfig.kt`

**Before**:
```kotlin
// JWT 관련 인터셉터 모두 제거
override fun configureClientInboundChannel(registration: ChannelRegistration) {
    registration.interceptors(object : ChannelInterceptor {
        override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
            val accessor = StompHeaderAccessor.wrap(message)
            
            if (StompCommand.CONNECT == accessor.command) {
                // 세션 기반 인증 로직만 유지
                val sessionId = accessor.sessionId
                println("[DEBUG] WebSocket connection attempt: $sessionId")
            }
            
            return message
        }
    })
}
```

**After**:
```kotlin
// 세션 기반 인증을 위한 인터셉터
override fun configureClientInboundChannel(registration: ChannelRegistration) {
    registration.interceptors(object : ChannelInterceptor {
        override fun preSend(message: Message<*>, channel: MessageChannel): Message<*>? {
            val accessor = StompHeaderAccessor.wrap(message)
            
            if (StompCommand.CONNECT == accessor.command) {
                val sessionId = accessor.sessionId
                println("[DEBUG] WebSocket connection attempt: $sessionId")
                
                // HTTP 세션에서 userId 추출하여 WebSocket 세션에 저장
                try {
                    val httpSession = accessor.sessionAttributes?.get("HTTP.SESSION") as? jakarta.servlet.http.HttpSession
                    if (httpSession != null) {
                        val userId = httpSession.getAttribute("userId") as? Long
                        if (userId != null) {
                            accessor.sessionAttributes?.put("userId", userId)
                            println("[DEBUG] WebSocket session authenticated with userId: $userId")
                        } else {
                            println("[WARN] No userId found in HTTP session")
                        }
                    } else {
                        println("[WARN] No HTTP session found in WebSocket connection")
                    }
                } catch (e: Exception) {
                    println("[ERROR] Failed to extract userId from HTTP session: ${e.message}")
                }
            }
            
            return message
        }
    })
}
```

**Changes**:
- Added logic to extract `userId` from HTTP session during WebSocket CONNECT
- Store `userId` in WebSocket session attributes for later use
- Added comprehensive logging for debugging

### 2. ChatController.kt - Improved Error Handling
**File**: `src/main/kotlin/org/example/kotlin_liargame/domain/chat/controller/ChatController.kt`

**Before**:
```kotlin
@MessageMapping("/chat.send")
fun handleChatMessage(
    @Payload request: SendChatMessageRequest,
    headerAccessor: SimpMessageHeaderAccessor
) {
    try {
        val sessionAttributes = headerAccessor.sessionAttributes
            ?: throw RuntimeException("No session found")
        
        val response = chatService.sendMessageViaWebSocket(request, sessionAttributes)
        messagingTemplate.convertAndSend("/topic/chat.${request.gameNumber}", response)
        
    } catch (e: Exception) {
        println("[ERROR] WebSocket chat error: ${e.message}")
    }
}
```

**After**:
```kotlin
@MessageMapping("/chat.send")
fun handleChatMessage(
    @Payload request: SendChatMessageRequest,
    headerAccessor: SimpMessageHeaderAccessor
) {
    try {
        val sessionAttributes = headerAccessor.sessionAttributes
            ?: throw RuntimeException("No session found")
        
        println("[DEBUG] WebSocket chat message received: gameNumber=${request.gameNumber}, content='${request.content}'")
        println("[DEBUG] Session attributes available: ${sessionAttributes.keys}")
        
        val response = chatService.sendMessageViaWebSocket(request, sessionAttributes)
        messagingTemplate.convertAndSend("/topic/chat.${request.gameNumber}", response)
        
        println("[DEBUG] WebSocket chat message sent successfully")
        
    } catch (e: Exception) {
        println("[ERROR] WebSocket chat error: ${e.message}")
        e.printStackTrace()
        
        // Send error message back to the client
        val errorMessage = mapOf(
            "error" to true,
            "message" to (e.message ?: "Unknown error occurred"),
            "gameNumber" to request.gameNumber
        )
        messagingTemplate.convertAndSend("/topic/chat.error.${request.gameNumber}", errorMessage)
    }
}
```

**Changes**:
- Added detailed logging for debugging WebSocket message handling
- Added error message broadcasting to clients when messages fail
- Added stack trace printing for better error diagnosis

## How the Fix Works

### Authentication Flow
1. **HTTP Session**: User logs in, `userId` is stored in HTTP session via `session.setAttribute("userId", userId)`
2. **WebSocket Connection**: When WebSocket connects, the interceptor extracts `userId` from HTTP session
3. **WebSocket Session**: `userId` is stored in WebSocket session attributes as `sessionAttributes["userId"]`
4. **Message Sending**: `sendMessageViaWebSocket` can now access `userId` from session attributes
5. **Database Persistence**: Messages are properly saved with the authenticated user's information

### Error Handling Improvements
- WebSocket errors are no longer silently ignored
- Detailed logging helps identify authentication and message processing issues
- Error messages are sent back to clients for better user experience

## Expected Results
After this fix:
1. ✅ WebSocket messages will be properly authenticated with userId
2. ✅ Chat messages will be saved to the database
3. ✅ Chat history API will return saved messages
4. ✅ Users will see chat messages from all participants in the room
5. ✅ Error messages will be visible for debugging

## Testing
- ✅ Build completed successfully
- ✅ No compilation errors introduced
- ✅ Maintains backward compatibility with existing HTTP-based chat API
- ✅ Enhanced logging for easier debugging

## Files Modified
1. `src/main/kotlin/org/example/kotlin_liargame/tools/websocket/WebSocketConfig.kt`
2. `src/main/kotlin/org/example/kotlin_liargame/domain/chat/controller/ChatController.kt`

The fix addresses the core issue where WebSocket-based chat messages were failing due to missing authentication context, while maintaining the existing session-based authentication system.