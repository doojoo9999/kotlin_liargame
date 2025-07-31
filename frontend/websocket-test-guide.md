# WebSocket Implementation Test Guide

## Implementation Summary

### ✅ **Completed Features**

1. **WebSocket Client Module (`src/socket/socketClient.js`)**
   - ✅ Real SocketClient class with socket.io-client integration
   - ✅ DummySocketClient class for testing without backend
   - ✅ Automatic fallback to dummy client when no WebSocket URL configured
   - ✅ Connection management with reconnection logic
   - ✅ Event handling for chat, players, and game state
   - ✅ Debug logging throughout

2. **Global State Management Extensions (`src/context/GameContext.jsx`)**
   - ✅ WebSocket connection status state
   - ✅ Real-time chat messages state
   - ✅ Room players synchronization state
   - ✅ Current turn player state
   - ✅ WebSocket action types and reducer cases
   - ✅ WebSocket management functions (connect, disconnect, join room, send message)
   - ✅ Integration with existing room join/leave functions

3. **GameRoomPage WebSocket Integration (`src/pages/GameRoomPage.jsx`)**
   - ✅ WebSocket connection lifecycle management
   - ✅ Real-time player distribution using WebSocket data
   - ✅ Current turn player highlighting from WebSocket
   - ✅ Connection status monitoring
   - ✅ Automatic cleanup on component unmount

4. **Real-time Chat Functionality (`src/components/ChatWindow.jsx`)**
   - ✅ WebSocket message sending integration
   - ✅ Real-time message receiving and display
   - ✅ Connection status indicator in chat header
   - ✅ Error handling and alerts
   - ✅ Empty state handling
   - ✅ Auto-scroll to new messages

5. **Environment Configuration**
   - ✅ WebSocket URL configuration in `.env`
   - ✅ Dummy WebSocket toggle for testing
   - ✅ Automatic fallback mechanism

## Testing Instructions

### 1. **Start Development Server**
```bash
cd frontend
npm run dev
```

### 2. **Test Scenarios**

#### **A. WebSocket Connection Testing**

1. **Dummy WebSocket Mode (Default)**
   - Open browser console (F12)
   - Navigate to lobby and join a room
   - Look for `[DEBUG_LOG]` messages indicating dummy WebSocket connection
   - Should see: `"[DEBUG_LOG] Using dummy WebSocket client"`

2. **Connection Status Verification**
   - In game room, check chat window header
   - Should show green dot and "연결됨" when connected
   - Should show red dot and "연결 끊김" when disconnected

#### **B. Real-time Chat Testing**

1. **Message Sending**
   - Type message in chat input and press Enter
   - Should see your message appear immediately
   - Console should show: `"[DEBUG_LOG] Sending chat message: [your message]"`

2. **Dummy Response Simulation**
   - After sending a message, wait 2-5 seconds
   - Should receive automatic responses from dummy players
   - Messages should auto-scroll to bottom

3. **System Messages**
   - When joining room, should see system message: "[username]님이 입장했습니다."
   - System messages should appear with different styling

#### **C. Player Synchronization Testing**

1. **Player List Updates**
   - When joining room, should see dummy players appear around screen
   - Console should show: `"[DEBUG_LOG] Players updated: [player array]"`

2. **Current Turn Player**
   - Players should have visual highlighting when it's their turn
   - Turn highlighting should update based on WebSocket events

#### **D. Error Handling Testing**

1. **Connection Errors**
   - Modify `.env` to set `VITE_USE_DUMMY_WEBSOCKET=false` and invalid WebSocket URL
   - Should see error messages in chat window
   - Should gracefully fallback to dummy mode

2. **Message Sending Errors**
   - Try sending message when disconnected
   - Should see warning in console: `"[DEBUG_LOG] Cannot send message: socket not connected"`

### 3. **Console Debug Messages to Look For**

#### **Connection Messages**
```
[DEBUG_LOG] Using dummy WebSocket client
[DEBUG_LOG] Dummy WebSocket: Simulating connection to http://localhost:8080
[DEBUG_LOG] GameRoomPage mounted, connecting to WebSocket
[DEBUG_LOG] WebSocket connected in GameRoomPage
```

#### **Room Join Messages**
```
[DEBUG_LOG] Joining socket room: [roomId] as [username]
[DEBUG_LOG] Dummy WebSocket: Joining room [roomId]
[DEBUG_LOG] Players updated: [player array]
```

#### **Chat Messages**
```
[DEBUG_LOG] Sending chat message: [message content]
[DEBUG_LOG] Dummy WebSocket: Sending message {message: "...", sender: "..."}
[DEBUG_LOG] Received chat message: {id: ..., sender: "...", message: "..."}
```

### 4. **Backend Integration Testing**

To test with real WebSocket backend:

1. **Update Environment**
   ```env
   VITE_WEBSOCKET_URL=http://localhost:8080
   VITE_USE_DUMMY_WEBSOCKET=false
   ```

2. **Start Backend Server**
   - Ensure backend WebSocket server is running on port 8080
   - Backend should handle these events:
     - `joinRoom` - Join a game room
     - `leaveRoom` - Leave a game room  
     - `sendMessage` - Send chat message
     - `receiveMessage` - Receive chat message
     - `updatePlayers` - Player list updates
     - `currentTurn` - Current turn player updates

3. **Test Real Backend**
   - Follow same test scenarios as above
   - Should see real WebSocket connection instead of dummy
   - Multiple browser tabs should sync in real-time

## WebSocket Events Reference

### **Client → Server Events**
- `joinRoom: { roomId, userId }` - Join a game room
- `leaveRoom: { roomId }` - Leave current room
- `sendMessage: { roomId, message, sender, timestamp }` - Send chat message

### **Server → Client Events**
- `receiveMessage: { id, sender, message, isSystem, timestamp }` - Receive chat message
- `updatePlayers: [player array]` - Player list updated
- `currentTurn: playerId` - Current turn player changed
- `roomUpdate: roomData` - Room information updated
- `gameStateUpdate: gameState` - Game state changed

### **Connection Events**
- `connect` - WebSocket connected
- `disconnect` - WebSocket disconnected
- `connect_error` - Connection error occurred

## Troubleshooting

### **Common Issues**

1. **WebSocket Not Connecting**
   - Check `.env` file configuration
   - Verify backend server is running
   - Check browser console for error messages

2. **Messages Not Appearing**
   - Verify WebSocket connection status in chat header
   - Check console for debug messages
   - Ensure you're in a game room (not lobby)

3. **Players Not Updating**
   - Check if `roomPlayers` state is being updated
   - Verify WebSocket `updatePlayers` events are received
   - Check player distribution logic

4. **Dummy Mode Not Working**
   - Ensure `VITE_USE_DUMMY_WEBSOCKET=true` in `.env`
   - Check console for dummy WebSocket messages
   - Verify dummy client is being used

### **Debug Commands**

Open browser console and try:
```javascript
// Check WebSocket connection status
window.gameContext?.socketConnected

// Check current chat messages
window.gameContext?.chatMessages

// Check room players
window.gameContext?.roomPlayers
```

## Next Steps

1. **Backend WebSocket Server**
   - Implement corresponding server-side WebSocket handlers
   - Add authentication to WebSocket connections
   - Implement room-based message broadcasting

2. **Advanced Features**
   - Message history persistence
   - Typing indicators
   - Message reactions
   - Private messaging

3. **Performance Optimization**
   - Message pagination for large chat histories
   - Connection pooling
   - Message compression

## Verification Checklist

- [ ] WebSocket client connects successfully
- [ ] Chat messages send and receive in real-time
- [ ] Player list updates dynamically
- [ ] Current turn player highlighting works
- [ ] Connection status displays correctly
- [ ] Error handling works gracefully
- [ ] Dummy mode works without backend
- [ ] Debug logging provides useful information
- [ ] Component cleanup prevents memory leaks
- [ ] Multiple browser tabs sync properly (with real backend)

The WebSocket implementation is now complete and ready for integration with the backend server!