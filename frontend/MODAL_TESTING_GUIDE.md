# Modal Refresh Issue Testing Guide

This guide provides comprehensive testing procedures to verify that the modal refresh issue has been resolved.

## Issue Background

**Problem**: Users working in modals (주제 추가, 답안 추가, 게임방 생성 등) experienced unexpected redirects to the lobby screen, causing data loss.

**Root Cause**: Multiple competing systems (session refresh, auto-refresh, WebSocket reconnection, error handling) were triggering navigation without considering modal state.

## Solution Overview

The solution implements:
1. **Modal Context Provider** - Global tracking of active modal states
2. **Navigation Guards** - Prevents navigation when modals are open
3. **Session Management Protection** - Defers session refresh during modal use
4. **Auto-refresh Pause** - Stops background API calls when modals are active
5. **Improved Error Handling** - Replaces hard redirects with user-friendly error states

## Testing Procedures

### 1. Basic Modal Functionality Test

**Test**: Verify modals open and close correctly with proper state tracking

```bash
# Open browser console to see logging
1. Navigate to Lobby page
2. Open each modal:
   - Create Game Room (새 게임방 만들기)
   - Join by Code (게임 번호로 참여)
   - Topic Management modals
   - Answer Management modals
3. Check console for logs:
   - ✅ Modal registered: [modal-id]
   - 🚫 Navigation prevention ACTIVATED
   - ❌ Modal unregistered: [modal-id]
   - ✅ Navigation prevention DEACTIVATED
```

**Expected Result**: Modal state changes are logged correctly, navigation prevention activates/deactivates appropriately.

### 2. Session Management Test

**Test**: Verify session refresh is deferred when modals are open

```bash
1. Open a modal (e.g., Create Game Room)
2. Wait 15+ minutes (or modify SESSION_REFRESH_INTERVAL for testing)
3. Check console for logs:
   - [SessionManager] Deferring session refresh - modal open: [modal-id]
4. Close modal
5. Wait for next session refresh cycle
6. Verify normal session refresh occurs
```

**Expected Result**: Session refresh is deferred while modal is open, resumes after modal closes.

### 3. Auto-refresh Pause Test

**Test**: Verify lobby statistics auto-refresh pauses during modal interaction

```bash
1. Navigate to Lobby page
2. Open any modal
3. Wait 30+ seconds (default auto-refresh interval)
4. Check console for logs:
   - [LobbyPage] Skipping auto-refresh - modal open: [modal-id]
5. Close modal
6. Wait another 30+ seconds
7. Verify normal auto-refresh resumes:
   - [LobbyPage] Auto-refreshing statistics
```

**Expected Result**: Auto-refresh is skipped while modal is open, resumes after modal closes.

### 4. Navigation Prevention Test

**Test**: Verify navigation attempts are blocked when modals are open

```bash
1. Open a modal
2. Try various navigation methods:
   - Browser back/forward buttons
   - Direct URL changes
   - Programmatic navigation calls
3. Check console for logs:
   - [Navigation] 🚫 BLOCKED - Modal interference detected
4. Verify warning toast appears
5. Verify user remains on current page
6. Close modal and retry navigation
7. Verify navigation works normally:
   - [Navigation] ✅ ALLOWED - No modal interference
```

**Expected Result**: All navigation attempts blocked while modal open, allowed after modal closes.

### 5. Error Handling Test

**Test**: Verify improved error boundary behavior

```bash
1. Trigger an error while modal is open (can simulate in dev tools)
2. Verify error boundary shows overlay (not full-page redirect)
3. Verify error can be dismissed to continue working
4. Check console for comprehensive error logging
```

**Expected Result**: Errors show modal overlay instead of redirecting, user can continue working.

### 6. WebSocket Stability Test

**Test**: Verify WebSocket reconnection doesn't interfere with modals

```bash
1. Open a modal
2. Simulate network disconnection/reconnection
3. Verify modal remains open and functional
4. Check that WebSocket events don't trigger navigation
```

**Expected Result**: Modal remains stable during WebSocket reconnection.

### 7. Multiple Modal Test

**Test**: Verify system handles multiple overlapping modals

```bash
1. Open first modal
2. Open second modal (if possible in UI)
3. Verify both are tracked correctly
4. Close one modal
5. Verify navigation still blocked (second modal still open)
6. Close remaining modal
7. Verify navigation protection deactivated
```

**Expected Result**: System correctly tracks multiple modals, navigation protection remains until all modals closed.

### 8. Long-term Stability Test

**Test**: Verify system remains stable during extended modal use

```bash
1. Open modal
2. Work in modal for extended period (30+ minutes)
3. Verify no unexpected redirects or session timeouts
4. Complete modal workflow normally
5. Verify system returns to normal operation
```

**Expected Result**: Extended modal use doesn't trigger unexpected redirects.

## Debug Console Commands

Use these commands in browser console for debugging:

```javascript
// Check current modal state
window.__modalDebug = {
  getActiveModals: () => {
    // Access modal context state (implementation specific)
    console.log('Check ModalProvider state in React DevTools')
  },

  // Simulate navigation attempt
  testNavigation: (path) => {
    console.log('Testing navigation to:', path)
    window.history.pushState(null, '', path)
  },

  // Check session state
  checkSession: () => {
    console.log('Auth state:', localStorage.getItem('auth-storage'))
  }
}
```

## Expected Log Patterns

### Normal Operation
```
[ModalProvider] ✅ Modal registered: create-game-modal
[ModalProvider] 🚫 Navigation prevention ACTIVATED
[SessionManager] Deferring session refresh - modal open: create-game-modal
[LobbyPage] Skipping auto-refresh - modal open: create-game-modal
[ModalProvider] ❌ Modal unregistered: create-game-modal
[ModalProvider] ✅ Navigation prevention DEACTIVATED
```

### Navigation Blocked
```
[Navigation] 🚫 BLOCKED - Modal interference detected
└─ Target Path: /main
└─ Active Modals: create-game-modal
└─ Current Path: /lobby
```

### Error States
```
[ErrorBoundary] User initiated retry
[ErrorBoundary] User dismissed error - attempting to continue
```

## Performance Considerations

Monitor for:
- No memory leaks from modal state tracking
- Proper cleanup of event listeners
- Reasonable console log volume in production

## Rollback Plan

If issues arise:
1. Remove modal registration calls from components
2. Disable navigation prevention in ModalProvider
3. Restore original session manager behavior
4. Re-enable auto-refresh without modal checks

## Success Criteria

✅ No unexpected redirects to lobby when working in modals
✅ Session management defers appropriately during modal use
✅ Background processes pause during modal interaction
✅ Navigation is properly blocked when modals are open
✅ Error handling doesn't force navigation away from modals
✅ System returns to normal operation after modal closes
✅ Performance remains acceptable
✅ Comprehensive logging aids in debugging