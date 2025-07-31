# Liar Game Mechanics Implementation Test Guide

## Implementation Summary

### ✅ **Completed Features (Depth 6)**

1. **Complete Game Logic State Management**
   - ✅ Extended GameContext with game-specific states (gameStatus, currentRound, playerRole, assignedWord, gameTimer, etc.)
   - ✅ Added game logic action types and reducer cases
   - ✅ Implemented WebSocket event handlers for all game events
   - ✅ Added helper functions for game actions (startGame, castVote, resetGameState)

2. **Game Start Functionality**
   - ✅ Host-only "게임 시작" button with conditional rendering
   - ✅ WebSocket startGame event emission
   - ✅ WAITING to IN_PROGRESS state transition management
   - ✅ Game start confirmation and UI feedback

3. **Role and Keyword Assignment Display**
   - ✅ Personal role/keyword display component (라이어/시민)
   - ✅ assignRole WebSocket event handling
   - ✅ Private role and keyword display for each player
   - ✅ Visual distinction between liar and citizen roles

4. **Speaking Phase Mechanics**
   - ✅ Enhanced turn-based speaking with visual highlighting
   - ✅ Countdown timer display for speaking turns
   - ✅ turnStart WebSocket event handling with time limits
   - ✅ Current speaker indication and instructions

5. **Voting Phase Functionality**
   - ✅ Interactive voting UI with clickable player selection
   - ✅ castVote WebSocket event handling
   - ✅ Voting timer and state management
   - ✅ Vote confirmation and cancellation system
   - ✅ Visual feedback for selected vote target

6. **Results and Game Completion**
   - ✅ roundResult WebSocket event handling
   - ✅ Game results display with winner announcements
   - ✅ Liar reveal and voting results presentation
   - ✅ Game end handling and state reset

7. **Complete Dummy WebSocket Simulation**
   - ✅ Full game flow simulation (start → roles → speaking → voting → results → end)
   - ✅ Realistic timing and player interactions
   - ✅ All game events properly simulated
   - ✅ Automatic game progression for testing

8. **UI State Awareness**
   - ✅ All UI elements conditional based on gameStatus
   - ✅ Game phase indicators and player instructions
   - ✅ System messages for all game events
   - ✅ Dynamic content based on game state

## Game Flow Overview

### **Phase 1: Waiting (WAITING)**
- Players join the room
- Host sees "게임 시작" button
- Room status shows "대기 중"

### **Phase 2: Game Start**
- Host clicks "게임 시작" button
- WebSocket emits `startGame` event
- System message: "게임이 시작되었습니다!"
- Game status transitions to SPEAKING

### **Phase 3: Role Assignment**
- WebSocket receives `assignRole` event
- Players see their role (라이어/시민) and keyword
- Private display shows role-specific information
- System message shows role assignment

### **Phase 4: Speaking Phase (SPEAKING)**
- WebSocket receives `turnStart` events for each player
- Current speaker highlighted with visual indicators
- 30-second timer for each player's turn
- System messages announce each player's turn
- Players can chat during their speaking time

### **Phase 5: Voting Phase (VOTING)**
- WebSocket receives `startVote` event
- All players become clickable for voting
- Selected player highlighted with orange border
- Voting confirmation buttons appear
- 30-second voting timer
- System message: "투표를 시작합니다!"

### **Phase 6: Results (RESULTS)**
- WebSocket receives `roundResult` event
- System messages reveal:
  - Who the liar was
  - Who received the most votes
  - Who won (라이어/시민)
- Results displayed for 5 seconds

### **Phase 7: Game End (FINISHED)**
- WebSocket receives `gameEnded` event
- Final game results displayed
- Game state resets to WAITING
- Players can start a new game

## Testing Instructions

### **1. Start Development Server**
```bash
cd frontend
npm run dev
```

### **2. Basic Game Flow Test**

1. **Join a Room**
   - Navigate to lobby
   - Join any room (dummy data will be used)
   - Verify WebSocket connection status in chat header

2. **Start Game (Host Only)**
   - Look for green "게임 시작" button in center area
   - Click to start game
   - Verify game status changes to "🎤 발언 단계"

3. **Role Assignment**
   - Check for role display (라이어/시민) with keyword
   - Verify system message in chat showing role assignment
   - Note: Dummy simulation assigns LIAR role for testing

4. **Speaking Phase**
   - Watch for player highlighting (orange border)
   - Observe timer countdown (30 seconds, shortened to 8 for demo)
   - See system messages announcing each player's turn
   - Try sending chat messages during speaking phase

5. **Voting Phase**
   - Wait for "🗳️투표 단계" status
   - Click on any player to select for voting
   - Verify orange border appears around selected player
   - Click "투표 확정" to cast vote or "취소" to cancel
   - Observe voting timer countdown

6. **Results Phase**
   - Watch for "📊 결과 발표" status
   - Read system messages revealing:
     - Liar identity
     - Vote results
     - Winner announcement
   - Results display for 5 seconds

7. **Game End**
   - See "🏁 게임 종료" status
   - Game automatically resets to WAITING
   - "게임 시작" button reappears for host

### **3. Advanced Testing Scenarios**

#### **A. Voting Interaction Test**
1. During voting phase, click different players
2. Verify only one player can be selected at a time
3. Test vote confirmation and cancellation
4. Verify vote is cast correctly

#### **B. Timer and State Transitions**
1. Observe all timer countdowns
2. Verify automatic phase transitions
3. Check system messages for each phase
4. Confirm UI elements appear/disappear correctly

#### **C. Role Display Test**
1. Verify role display shows correct information
2. Check visual distinction between 라이어 and 시민
3. Confirm keyword display works
4. Test role-specific UI elements

#### **D. WebSocket Event Logging**
1. Open browser console (F12)
2. Look for `[DEBUG_LOG]` messages throughout game
3. Verify all WebSocket events are received and handled
4. Check for any error messages

### **4. Console Debug Messages to Monitor**

#### **Game Start Sequence**
```
[DEBUG_LOG] Host starting game
[DEBUG_LOG] Starting game for room: [roomId]
[DEBUG_LOG] Dummy WebSocket: Starting game simulation
[DEBUG_LOG] Game started: {round: 1}
[DEBUG_LOG] Role assigned: {role: "LIAR", keyword: "가짜 키워드"}
```

#### **Speaking Phase**
```
[DEBUG_LOG] Turn started: {playerId: 1, timeLimit: 30}
[DEBUG_LOG] Current turn player: 1
```

#### **Voting Phase**
```
[DEBUG_LOG] Voting started: {timeLimit: 30}
[DEBUG_LOG] Casting vote for player: [playerId]
[DEBUG_LOG] Vote cast for player [playerId]
```

#### **Results Phase**
```
[DEBUG_LOG] Round result: {liarId: 2, votedPlayerId: [id], winner: "CITIZEN"}
[DEBUG_LOG] Game ended: {winner: "CITIZEN", finalScore: {...}}
```

## WebSocket Events Reference

### **Client → Server Events**
- `startGame: { roomId }` - Host starts the game
- `castVote: { roomId, targetPlayerId }` - Player casts vote

### **Server → Client Events**
- `gameStarted: { round }` - Game has started
- `assignRole: { role, keyword }` - Player role assignment
- `turnStart: { playerId, timeLimit }` - Player's speaking turn
- `startVote: { timeLimit }` - Voting phase begins
- `roundResult: { liarId, votedPlayerId, winner, votes }` - Round results
- `gameEnded: { winner, finalScore }` - Game completion

## UI Components State Behavior

### **Game Status Display**
- **WAITING**: Shows "대기 중" with pause icon
- **SPEAKING**: Shows "🎤 발언 단계" with timer
- **VOTING**: Shows "🗳️ 투표 단계" with timer
- **RESULTS**: Shows "📊 결과 발표"
- **FINISHED**: Shows "🏁 게임 종료"

### **Player Interaction**
- **WAITING**: Players display normally
- **SPEAKING**: Current turn player highlighted with orange border
- **VOTING**: All players clickable with hover effects
- **RESULTS/FINISHED**: Players display normally

### **Center Area Content**
- **WAITING**: Game start button (host only)
- **SPEAKING/VOTING**: Role/keyword display + game status + timer
- **VOTING**: Vote confirmation buttons when player selected
- **All phases**: Chat window always visible

## Troubleshooting

### **Common Issues**

1. **Game Start Button Not Visible**
   - Verify user is the host (first player in room)
   - Check gameStatus is 'WAITING'
   - Ensure WebSocket is connected

2. **Role Not Displaying**
   - Check console for assignRole event
   - Verify gameStatus is not 'WAITING'
   - Look for role assignment system message

3. **Voting Not Working**
   - Ensure gameStatus is 'VOTING'
   - Check if players are clickable (cursor: pointer)
   - Verify vote confirmation buttons appear

4. **Timer Not Updating**
   - Check WebSocket events for timer values
   - Verify gameTimer state is being updated
   - Look for turnStart/startVote events

### **Debug Commands**

Open browser console and check:
```javascript
// Check current game state
window.gameContext?.gameStatus
window.gameContext?.playerRole
window.gameContext?.assignedWord
window.gameContext?.gameTimer

// Check WebSocket connection
window.gameContext?.socketConnected

// Check current room players
window.gameContext?.roomPlayers
```

## Backend Integration Readiness

The implementation is fully ready for backend integration:

1. **All WebSocket Events Implemented**: Ready to connect to real server
2. **Error Handling**: Graceful fallback when backend unavailable
3. **State Management**: Complete game state synchronization
4. **UI Responsiveness**: All components react to real-time updates
5. **Debug Logging**: Comprehensive logging for troubleshooting

## Next Steps for Production

1. **Connect to Real Backend**: Update WebSocket URL in `.env`
2. **Authentication**: Integrate with backend auth system
3. **Error Recovery**: Enhanced error handling for network issues
4. **Performance**: Optimize for larger player counts
5. **Accessibility**: Add keyboard navigation and screen reader support

## Verification Checklist

- [ ] Game starts when host clicks button
- [ ] Role assignment displays correctly
- [ ] Speaking phase shows current player and timer
- [ ] Voting phase allows player selection and confirmation
- [ ] Results phase shows liar reveal and winner
- [ ] Game resets properly after completion
- [ ] All WebSocket events logged in console
- [ ] UI elements appear/disappear based on game state
- [ ] Chat messages show system announcements
- [ ] Timer countdowns work correctly

The complete Liar Game mechanics implementation is now ready for testing and backend integration!