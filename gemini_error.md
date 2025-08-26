Network Log:
{
"gameNumber": 1,
"gameName": "Admin님의 방",
"gameOwner": "Admin",
"gameParticipants": 5,
"gameCurrentRound": 0,
"gameTotalRounds": 3,
"gameLiarCount": 1,
"gameMode": "LIARS_KNOW",
"gameState": "WAITING",
"players": [
{
"id": 1,
"nickname": "Admin",
"isAlive": true,
"state": "WAITING_FOR_HINT",
"hint": null,
"defense": null,
"votesReceived": 0,
"hasVoted": false
},
{
"id": 3,
"nickname": "Admin1",
"isAlive": true,
"state": "WAITING_FOR_HINT",
"hint": null,
"defense": null,
"votesReceived": 0,
"hasVoted": false
},
{
"id": 5,
"nickname": "Admin4",
"isAlive": true,
"state": "WAITING_FOR_HINT",
"hint": null,
"defense": null,
"votesReceived": 0,
"hasVoted": false
}
],
"currentPhase": "WAITING_FOR_PLAYERS",
"yourRole": "CITIZEN",
"yourWord": "숫자",
"accusedPlayer": null,
"isChatAvailable": true,
"citizenSubject": "숫자",
"liarSubject": "한글",
"subjects": [
"숫자",
"한글"
],
"turnOrder": null,
"currentTurnIndex": null,
"phaseEndTime": null,
"winner": null,
"reason": null
}


Console Log:

useChatSocket.ts:33 [useChatSocket] Subscribing to chat for game: 1
logger.ts:11 [LOG] [DEBUG] Subscribing to chat: /topic/chat/1
react-router-dom.js?v=92a008ee:5582 Error handled by React Router default ErrorBoundary: Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
at getRootForUpdatedFiber (react-dom_client.js?v=92a008ee:3001:128)
at enqueueConcurrentRenderForLane (react-dom_client.js?v=92a008ee:2989:16)
at forceStoreRerender (react-dom_client.js?v=92a008ee:4653:21)
at updateStoreInstance (react-dom_client.js?v=92a008ee:4635:41)
at Object.react_stack_bottom_frame (react-dom_client.js?v=92a008ee:17486:20)
at runWithFiberInDEV (react-dom_client.js?v=92a008ee:1485:72)
at commitHookEffectListMount (react-dom_client.js?v=92a008ee:8460:122)
at commitHookPassiveMountEffects (react-dom_client.js?v=92a008ee:8518:60)
at commitPassiveMountOnFiber (react-dom_client.js?v=92a008ee:9887:29)
at recursivelyTraversePassiveMountEffects (react-dom_client.js?v=92a008ee:9868:13)
DefaultErrorComponent @ react-router-dom.js?v=92a008ee:5582
react_stack_bottom_frame @ react-dom_client.js?v=92a008ee:17424
renderWithHooks @ react-dom_client.js?v=92a008ee:4206
updateFunctionComponent @ react-dom_client.js?v=92a008ee:6619
beginWork @ react-dom_client.js?v=92a008ee:7654
runWithFiberInDEV @ react-dom_client.js?v=92a008ee:1485
performUnitOfWork @ react-dom_client.js?v=92a008ee:10868
workLoopSync @ react-dom_client.js?v=92a008ee:10728
renderRootSync @ react-dom_client.js?v=92a008ee:10711
performWorkOnRoot @ react-dom_client.js?v=92a008ee:10330
performSyncWorkOnRoot @ react-dom_client.js?v=92a008ee:11635
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=92a008ee:11536
flushSpawnedWork @ react-dom_client.js?v=92a008ee:11254
commitRoot @ react-dom_client.js?v=92a008ee:11081
commitRootWhenReady @ react-dom_client.js?v=92a008ee:10512
performWorkOnRoot @ react-dom_client.js?v=92a008ee:10457
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=92a008ee:11623
performWorkUntilDeadline @ react-dom_client.js?v=92a008ee:36Understand this error
react-router-dom.js?v=92a008ee:5582 Error handled by React Router default ErrorBoundary: Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
at getRootForUpdatedFiber (react-dom_client.js?v=92a008ee:3001:128)
at enqueueConcurrentRenderForLane (react-dom_client.js?v=92a008ee:2989:16)
at forceStoreRerender (react-dom_client.js?v=92a008ee:4653:21)
at updateStoreInstance (react-dom_client.js?v=92a008ee:4635:41)
at Object.react_stack_bottom_frame (react-dom_client.js?v=92a008ee:17486:20)
at runWithFiberInDEV (react-dom_client.js?v=92a008ee:1485:72)
at commitHookEffectListMount (react-dom_client.js?v=92a008ee:8460:122)
at commitHookPassiveMountEffects (react-dom_client.js?v=92a008ee:8518:60)
at commitPassiveMountOnFiber (react-dom_client.js?v=92a008ee:9887:29)
at recursivelyTraversePassiveMountEffects (react-dom_client.js?v=92a008ee:9868:13)
DefaultErrorComponent @ react-router-dom.js?v=92a008ee:5582
react_stack_bottom_frame @ react-dom_client.js?v=92a008ee:17424
renderWithHooksAgain @ react-dom_client.js?v=92a008ee:4281
renderWithHooks @ react-dom_client.js?v=92a008ee:4217
updateFunctionComponent @ react-dom_client.js?v=92a008ee:6619
beginWork @ react-dom_client.js?v=92a008ee:7654
runWithFiberInDEV @ react-dom_client.js?v=92a008ee:1485
performUnitOfWork @ react-dom_client.js?v=92a008ee:10868
workLoopSync @ react-dom_client.js?v=92a008ee:10728
renderRootSync @ react-dom_client.js?v=92a008ee:10711
performWorkOnRoot @ react-dom_client.js?v=92a008ee:10330
performSyncWorkOnRoot @ react-dom_client.js?v=92a008ee:11635
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=92a008ee:11536
flushSpawnedWork @ react-dom_client.js?v=92a008ee:11254
commitRoot @ react-dom_client.js?v=92a008ee:11081
commitRootWhenReady @ react-dom_client.js?v=92a008ee:10512
performWorkOnRoot @ react-dom_client.js?v=92a008ee:10457
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=92a008ee:11623
performWorkUntilDeadline @ react-dom_client.js?v=92a008ee:36Understand this error
react-dom_client.js?v=92a008ee:6264 Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
at getRootForUpdatedFiber (react-dom_client.js?v=92a008ee:3001:128)
at enqueueConcurrentRenderForLane (react-dom_client.js?v=92a008ee:2989:16)
at forceStoreRerender (react-dom_client.js?v=92a008ee:4653:21)
at updateStoreInstance (react-dom_client.js?v=92a008ee:4635:41)
at Object.react_stack_bottom_frame (react-dom_client.js?v=92a008ee:17486:20)
at runWithFiberInDEV (react-dom_client.js?v=92a008ee:1485:72)
at commitHookEffectListMount (react-dom_client.js?v=92a008ee:8460:122)
at commitHookPassiveMountEffects (react-dom_client.js?v=92a008ee:8518:60)
at commitPassiveMountOnFiber (react-dom_client.js?v=92a008ee:9887:29)
at recursivelyTraversePassiveMountEffects (react-dom_client.js?v=92a008ee:9868:13)

The above error occurred in the <GameRoomPage> component.

React will try to recreate this component tree from scratch using the error boundary you provided, RenderErrorBoundary.

defaultOnCaughtError @ react-dom_client.js?v=92a008ee:6264
logCaughtError @ react-dom_client.js?v=92a008ee:6296
runWithFiberInDEV @ react-dom_client.js?v=92a008ee:1485
inst.componentDidCatch.update.callback @ react-dom_client.js?v=92a008ee:6341
callCallback @ react-dom_client.js?v=92a008ee:4097
commitCallbacks @ react-dom_client.js?v=92a008ee:4109
runWithFiberInDEV @ react-dom_client.js?v=92a008ee:1485
commitClassCallbacks @ react-dom_client.js?v=92a008ee:8543
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9011
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8960
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9016
flushLayoutEffects @ react-dom_client.js?v=92a008ee:11174
commitRoot @ react-dom_client.js?v=92a008ee:11080
commitRootWhenReady @ react-dom_client.js?v=92a008ee:10512
performWorkOnRoot @ react-dom_client.js?v=92a008ee:10457
performSyncWorkOnRoot @ react-dom_client.js?v=92a008ee:11635
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=92a008ee:11536
flushSpawnedWork @ react-dom_client.js?v=92a008ee:11254
commitRoot @ react-dom_client.js?v=92a008ee:11081
commitRootWhenReady @ react-dom_client.js?v=92a008ee:10512
performWorkOnRoot @ react-dom_client.js?v=92a008ee:10457
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=92a008ee:11623
performWorkUntilDeadline @ react-dom_client.js?v=92a008ee:36Understand this error
react-router-dom.js?v=92a008ee:5618 React Router caught the following error during render Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
at getRootForUpdatedFiber (react-dom_client.js?v=92a008ee:3001:128)
at enqueueConcurrentRenderForLane (react-dom_client.js?v=92a008ee:2989:16)
at forceStoreRerender (react-dom_client.js?v=92a008ee:4653:21)
at updateStoreInstance (react-dom_client.js?v=92a008ee:4635:41)
at Object.react_stack_bottom_frame (react-dom_client.js?v=92a008ee:17486:20)
at runWithFiberInDEV (react-dom_client.js?v=92a008ee:1485:72)
at commitHookEffectListMount (react-dom_client.js?v=92a008ee:8460:122)
at commitHookPassiveMountEffects (react-dom_client.js?v=92a008ee:8518:60)
at commitPassiveMountOnFiber (react-dom_client.js?v=92a008ee:9887:29)
at recursivelyTraversePassiveMountEffects (react-dom_client.js?v=92a008ee:9868:13) {componentStack: '\n    at GameRoomPage (http://localhost:5173/src/pa…er.tsx:23:31)\n    at RouterProvider (<anonymous>)'}
componentDidCatch @ react-router-dom.js?v=92a008ee:5618
react_stack_bottom_frame @ react-dom_client.js?v=92a008ee:17462
inst.componentDidCatch.update.callback @ react-dom_client.js?v=92a008ee:6349
callCallback @ react-dom_client.js?v=92a008ee:4097
commitCallbacks @ react-dom_client.js?v=92a008ee:4109
runWithFiberInDEV @ react-dom_client.js?v=92a008ee:1485
commitClassCallbacks @ react-dom_client.js?v=92a008ee:8543
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9011
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8960
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:8956
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9096
recursivelyTraverseLayoutEffects @ react-dom_client.js?v=92a008ee:9682
commitLayoutEffectOnFiber @ react-dom_client.js?v=92a008ee:9016
flushLayoutEffects @ react-dom_client.js?v=92a008ee:11174
commitRoot @ react-dom_client.js?v=92a008ee:11080
commitRootWhenReady @ react-dom_client.js?v=92a008ee:10512
performWorkOnRoot @ react-dom_client.js?v=92a008ee:10457
performSyncWorkOnRoot @ react-dom_client.js?v=92a008ee:11635
flushSyncWorkAcrossRoots_impl @ react-dom_client.js?v=92a008ee:11536
flushSpawnedWork @ react-dom_client.js?v=92a008ee:11254
commitRoot @ react-dom_client.js?v=92a008ee:11081
commitRootWhenReady @ react-dom_client.js?v=92a008ee:10512
performWorkOnRoot @ react-dom_client.js?v=92a008ee:10457
performWorkOnRootViaSchedulerTask @ react-dom_client.js?v=92a008ee:11623
performWorkUntilDeadline @ react-dom_client.js?v=92a008ee:36Understand this error
useGameSocket.ts:30 [useGameSocket] Cleanup for game: 1
logger.ts:11 [LOG] [DEBUG] Unsubscribing from game socket: /topic/game/1/state
logger.ts:6 [LOG] [INFO] Unsubscribed from /topic/game/1/state
useChatSocket.ts:38 [useChatSocket] Cleanup for chat game: 1
logger.ts:11 [LOG] [DEBUG] Unsubscribing from chat: /topic/chat/1
logger.ts:6 [LOG] [INFO] Unsubscribed from /topic/chat/1
logger.ts:6 [LOG] [INFO] Unsubscribed from /topic/lobby
logger.ts:11 [LOG] [DEBUG] STOMP Debug >>> SUBSCRIBE
id:sub-6
destination:/topic/game/1/state


logger.ts:6 [LOG] [INFO] Subscribed to /topic/game/1/state
logger.ts:11 [LOG] [DEBUG] STOMP Debug >>> SUBSCRIBE
id:sub-7
destination:/topic/chat/1


logger.ts:6 [LOG] [INFO] Subscribed to /topic/chat/1
logger.ts:6 [LOG] [WARN] Returning existing subscription for /topic/game/1/state.
log @ logger.ts:6
warnLog @ logger.ts:18
subscribe @ SocketManager.ts:43Understand this warning
logger.ts:6 [LOG] [WARN] Returning existing subscription for /topic/chat/1.
log @ logger.ts:6
warnLog @ logger.ts:18
subscribe @ SocketManager.ts:43Understand this warning