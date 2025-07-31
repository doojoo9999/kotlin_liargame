# Liar Game Frontend Implementation Test Guide

## Implementation Summary

### ✅ Completed Features

1. **API Communication Module**
   - ✅ Axios client configuration with environment variables
   - ✅ Authentication interceptors
   - ✅ Error handling interceptors
   - ✅ Game API functions (rooms, auth, subjects, chat)
   - ✅ Dummy data for testing without backend

2. **Global State Management**
   - ✅ React Context API implementation
   - ✅ State management for currentUser, currentRoom, roomList
   - ✅ Loading and error states
   - ✅ Navigation state management

3. **Lobby/Room List Page**
   - ✅ Room list display with table format
   - ✅ Room creation modal with all required fields
   - ✅ Room join functionality with password support
   - ✅ Game mode selection (라이어 인지 모드, 다른 답 보기 모드)
   - ✅ Subject selection
   - ✅ Loading states and error handling

4. **Game Room Page**
   - ✅ Player distribution around screen
   - ✅ Integration with existing PlayerProfile components
   - ✅ Chat window integration
   - ✅ Game info display
   - ✅ Leave room functionality
   - ✅ Room state display

5. **Error Handling & Loading States**
   - ✅ Error boundary component
   - ✅ Loading spinners throughout the app
   - ✅ Error messages and alerts
   - ✅ Fallback to dummy data when API fails

6. **UI/UX Features**
   - ✅ Material-UI theme integration
   - ✅ Responsive design
   - ✅ Korean language support
   - ✅ Icons and visual indicators
   - ✅ Confirmation dialogs

## File Structure

```
src/
├── api/
│   ├── apiClient.js          # Axios configuration
│   └── gameApi.js           # API functions and dummy data
├── components/
│   ├── ErrorBoundary.jsx    # Error boundary component
│   ├── PlayerProfile.jsx    # Existing player component
│   ├── ChatWindow.jsx       # Existing chat component
│   ├── GameInfoDisplay.jsx  # Existing game info component
│   └── ... (other existing components)
├── context/
│   └── GameContext.jsx      # Global state management
├── pages/
│   ├── LobbyPage.jsx        # Room list and creation
│   └── GameRoomPage.jsx     # Game room interface
├── App.jsx                  # Main app with routing
└── main.jsx                 # Entry point
```

## Environment Configuration

- ✅ `.env` file with `VITE_API_BASE_URL`
- ✅ Environment variable support in API client

## Testing Instructions

### 1. Start Development Server
```bash
npm run dev
```

### 2. Test Scenarios

#### Lobby Page Testing
1. **Room List Display**
   - Should show dummy rooms when backend is unavailable
   - Displays room title, host, player count, subject, state
   - Shows password indicator for protected rooms

2. **Room Creation**
   - Click "방 만들기" button
   - Fill in room details (title, max players, subject, game mode)
   - Test with and without password
   - Should show loading state during creation

3. **Room Join**
   - Click "입장" button on any room
   - Enter password if required
   - Should navigate to game room page

#### Game Room Page Testing
1. **Room Display**
   - Shows room information in top bar
   - Displays players around the screen
   - Shows game info in center
   - Chat window integration

2. **Leave Room**
   - Click "나가기" button
   - Confirm in dialog
   - Should return to lobby

#### Error Handling Testing
1. **API Errors**
   - Disconnect from internet
   - Should fallback to dummy data
   - Error messages should appear

2. **Component Errors**
   - Manually trigger JavaScript error
   - Error boundary should catch and display fallback UI

## API Integration Points

### Ready for Backend Integration
- All API endpoints are implemented according to documentation
- Authentication token handling is ready
- Error handling for API failures
- Loading states for all operations

### API Endpoints Used
- `GET /api/v1/game/rooms` - Get room list
- `POST /api/v1/game/create` - Create room
- `POST /api/v1/game/join` - Join room
- `POST /api/v1/game/leave` - Leave room
- `GET /api/v1/subjects/listsubj` - Get subjects
- `POST /api/v1/auth/login` - Authentication

## Next Steps for Backend Integration

1. **Start Backend Server**
   - Ensure backend is running on configured URL
   - Update `.env` file if needed

2. **Remove Dummy Data Fallbacks**
   - Once backend is stable, remove dummy data fallbacks
   - Keep them for development/testing

3. **WebSocket Integration**
   - Add WebSocket connection for real-time updates
   - Implement chat functionality
   - Real-time room updates

## Known Limitations

1. **Authentication**
   - Currently uses simple nickname-based auth
   - No user registration flow implemented

2. **Real-time Updates**
   - Room list doesn't auto-refresh
   - No WebSocket integration yet

3. **Game Logic**
   - Game mechanics not implemented (will be in next depth)
   - Chat is placeholder integration

## Verification Checklist

- [ ] App starts without errors
- [ ] Lobby page displays dummy rooms
- [ ] Room creation modal opens and works
- [ ] Room join navigation works
- [ ] Game room page displays correctly
- [ ] Leave room functionality works
- [ ] Error boundary catches errors
- [ ] Loading states appear during operations
- [ ] All Material-UI components render properly