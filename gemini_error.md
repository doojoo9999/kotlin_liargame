오류가 발생했습니다

Cannot read properties of undefined (reading 'rooms')


User restored from localStorage: {id: 1, nickname: 'ㅇㅇ', role: 'user'}
subjectStore.js:301 [DEBUG_LOG] GameStompClient not connected, skipping subscription
hook.js:608 No `HydrateFallback` element provided to render during initial hydration Error Component Stack
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
warning @ react-router-dom.js?v=d308228d:532
warningOnce @ react-router-dom.js?v=d308228d:5966
(anonymous) @ react-router-dom.js?v=d308228d:5714
_renderMatches @ react-router-dom.js?v=d308228d:5703
useRoutesImpl @ react-router-dom.js?v=d308228d:5540
DataRoutes @ react-router-dom.js?v=d308228d:6241
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
updateFunctionComponent @ chunk-276SZO74.js?v=19c79349:14582
updateSimpleMemoComponent @ chunk-276SZO74.js?v=19c79349:14463
updateMemoComponent @ chunk-276SZO74.js?v=19c79349:14366
beginWork @ chunk-276SZO74.js?v=19c79349:15977
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19753
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopSync @ chunk-276SZO74.js?v=19c79349:19137
renderRootSync @ chunk-276SZO74.js?v=19c79349:19116
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this warning
gameApi.js:121 [DEBUG] Raw subjects API response: [{…}]
gameApi.js:134 [DEBUG] Found unique subjects: 1 subjects
gameApi.js:135 [DEBUG] Unique subject names: ㅇ
gameApi.js:22 [DEBUG] Raw API response: {gameRooms: Array(1)}
gameApi.js:25 [DEBUG] Found gameRooms: 1 rooms
useGame.js:41 You should call navigate() in a React.useEffect(), not when your component is first rendered. Error Component Stack
at GameProvider (GameContext.jsx:31:25)
at AppLayout (App.jsx:26:22)
at RenderedRoute (react-router-dom.js?v=d308228d:5643:26)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
warning @ react-router-dom.js?v=d308228d:532
(anonymous) @ react-router-dom.js?v=d308228d:5950
(anonymous) @ zustand.js?v=e85e01f0:38
mountSyncExternalStore @ chunk-276SZO74.js?v=19c79349:11886
useSyncExternalStore @ chunk-276SZO74.js?v=19c79349:12573
useSyncExternalStore @ chunk-ZMLY2J2T.js?v=19c79349:1120
useStore @ zustand.js?v=e85e01f0:36
useBoundStore @ zustand.js?v=e85e01f0:46
useGame @ useGame.js:41
GameProvider @ GameContext.jsx:33
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
mountIndeterminateComponent @ chunk-276SZO74.js?v=19c79349:14926
beginWork @ chunk-276SZO74.js?v=19c79349:15914
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19753
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this warning
useGame.js:41 You should call navigate() in a React.useEffect(), not when your component is first rendered. Error Component Stack
at GameProvider (GameContext.jsx:31:25)
at AppLayout (App.jsx:26:22)
at RenderedRoute (react-router-dom.js?v=d308228d:5643:26)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
warning @ react-router-dom.js?v=d308228d:532
(anonymous) @ react-router-dom.js?v=d308228d:5950
(anonymous) @ zustand.js?v=e85e01f0:38
mountSyncExternalStore @ chunk-276SZO74.js?v=19c79349:11889
useSyncExternalStore @ chunk-276SZO74.js?v=19c79349:12573
useSyncExternalStore @ chunk-ZMLY2J2T.js?v=19c79349:1120
useStore @ zustand.js?v=e85e01f0:36
useBoundStore @ zustand.js?v=e85e01f0:46
useGame @ useGame.js:41
GameProvider @ GameContext.jsx:33
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
mountIndeterminateComponent @ chunk-276SZO74.js?v=19c79349:14926
beginWork @ chunk-276SZO74.js?v=19c79349:15914
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19753
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this warning
useGame.js:41 Warning: The result of getSnapshot should be cached to avoid an infinite loop Error Component Stack
at GameProvider (GameContext.jsx:31:25)
at AppLayout (App.jsx:26:22)
at RenderedRoute (react-router-dom.js?v=d308228d:5643:26)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
mountSyncExternalStore @ chunk-276SZO74.js?v=19c79349:11891
useSyncExternalStore @ chunk-276SZO74.js?v=19c79349:12573
useSyncExternalStore @ chunk-ZMLY2J2T.js?v=19c79349:1120
useStore @ zustand.js?v=e85e01f0:36
useBoundStore @ zustand.js?v=e85e01f0:46
useGame @ useGame.js:41
GameProvider @ GameContext.jsx:33
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
mountIndeterminateComponent @ chunk-276SZO74.js?v=19c79349:14926
beginWork @ chunk-276SZO74.js?v=19c79349:15914
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19753
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
useGame.js:41 You should call navigate() in a React.useEffect(), not when your component is first rendered. Error Component Stack
at GameProvider (GameContext.jsx:31:25)
at AppLayout (App.jsx:26:22)
at RenderedRoute (react-router-dom.js?v=d308228d:5643:26)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
warning @ react-router-dom.js?v=d308228d:532
(anonymous) @ react-router-dom.js?v=d308228d:5950
(anonymous) @ zustand.js?v=e85e01f0:38
mountSyncExternalStore @ chunk-276SZO74.js?v=19c79349:11886
useSyncExternalStore @ chunk-276SZO74.js?v=19c79349:12573
useSyncExternalStore @ chunk-ZMLY2J2T.js?v=19c79349:1120
useStore @ zustand.js?v=e85e01f0:36
useBoundStore @ zustand.js?v=e85e01f0:46
useGame @ useGame.js:41
GameProvider @ GameContext.jsx:33
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
mountIndeterminateComponent @ chunk-276SZO74.js?v=19c79349:14926
beginWork @ chunk-276SZO74.js?v=19c79349:15914
callCallback2 @ chunk-276SZO74.js?v=19c79349:3674
invokeGuardedCallbackDev @ chunk-276SZO74.js?v=19c79349:3699
invokeGuardedCallback @ chunk-276SZO74.js?v=19c79349:3733
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19765
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this warning
useGame.js:113 Uncaught TypeError: Cannot read properties of undefined (reading 'rooms')
at useGame.js:113:24
at mountMemo (chunk-276SZO74.js?v=19c79349:12194:27)
at Object.useMemo (chunk-276SZO74.js?v=19c79349:12518:24)
at useMemo (chunk-ZMLY2J2T.js?v=19c79349:1094:29)
at useGame (useGame.js:111:19)
at GameProvider (GameContext.jsx:33:24)
at renderWithHooks (chunk-276SZO74.js?v=19c79349:11548:26)
at mountIndeterminateComponent (chunk-276SZO74.js?v=19c79349:14926:21)
at beginWork (chunk-276SZO74.js?v=19c79349:15914:22)
at HTMLUnknownElement.callCallback2 (chunk-276SZO74.js?v=19c79349:3674:22)
(anonymous) @ useGame.js:113
mountMemo @ chunk-276SZO74.js?v=19c79349:12194
useMemo @ chunk-276SZO74.js?v=19c79349:12518
useMemo @ chunk-ZMLY2J2T.js?v=19c79349:1094
useGame @ useGame.js:111
GameProvider @ GameContext.jsx:33
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
mountIndeterminateComponent @ chunk-276SZO74.js?v=19c79349:14926
beginWork @ chunk-276SZO74.js?v=19c79349:15914
callCallback2 @ chunk-276SZO74.js?v=19c79349:3674
invokeGuardedCallbackDev @ chunk-276SZO74.js?v=19c79349:3699
invokeGuardedCallback @ chunk-276SZO74.js?v=19c79349:3733
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19765
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: React does not recognize the `startIcon` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `starticon` instead. If you accidentally passed it from a parent component, remove it from the DOM element. Error Component Stack
at button (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at chunk-SZOH2DOY.js?v=19c79349:10384:19
at chunk-SZOH2DOY.js?v=19c79349:17278:17
at div (<anonymous>)
at MotionDOMComponent (framer-motion.js?v=20e766b6:5366:40)
at Button.jsx:10:3
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
validateProperty$1 @ chunk-276SZO74.js?v=19c79349:3427
warnUnknownProperties @ chunk-276SZO74.js?v=19c79349:3459
validateProperties$2 @ chunk-276SZO74.js?v=19c79349:3478
validatePropertiesInDevelopment @ chunk-276SZO74.js?v=19c79349:7346
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7535
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: React does not recognize the `$flexDirection` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `$flexdirection` instead. If you accidentally passed it from a parent component, remove it from the DOM element. Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
validateProperty$1 @ chunk-276SZO74.js?v=19c79349:3427
warnUnknownProperties @ chunk-276SZO74.js?v=19c79349:3459
validateProperties$2 @ chunk-276SZO74.js?v=19c79349:3478
validatePropertiesInDevelopment @ chunk-276SZO74.js?v=19c79349:7346
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7535
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: React does not recognize the `$alignItems` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `$alignitems` instead. If you accidentally passed it from a parent component, remove it from the DOM element. Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
validateProperty$1 @ chunk-276SZO74.js?v=19c79349:3427
warnUnknownProperties @ chunk-276SZO74.js?v=19c79349:3459
validateProperties$2 @ chunk-276SZO74.js?v=19c79349:3478
validatePropertiesInDevelopment @ chunk-276SZO74.js?v=19c79349:7346
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7535
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: React does not recognize the `$justifyContent` prop on a DOM element. If you intentionally want it to appear in the DOM as a custom attribute, spell it as lowercase `$justifycontent` instead. If you accidentally passed it from a parent component, remove it from the DOM element. Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
validateProperty$1 @ chunk-276SZO74.js?v=19c79349:3427
warnUnknownProperties @ chunk-276SZO74.js?v=19c79349:3459
validateProperties$2 @ chunk-276SZO74.js?v=19c79349:3478
validatePropertiesInDevelopment @ chunk-276SZO74.js?v=19c79349:7346
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7535
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: Invalid attribute name: `$display` Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
isAttributeNameSafe @ chunk-276SZO74.js?v=19c79349:680
setValueForProperty @ chunk-276SZO74.js?v=19c79349:1224
setInitialDOMProperties @ chunk-276SZO74.js?v=19c79349:7462
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7595
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: Invalid attribute name: `$flexDirection` Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
isAttributeNameSafe @ chunk-276SZO74.js?v=19c79349:680
setValueForProperty @ chunk-276SZO74.js?v=19c79349:1224
setInitialDOMProperties @ chunk-276SZO74.js?v=19c79349:7462
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7595
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: Invalid attribute name: `$alignItems` Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
isAttributeNameSafe @ chunk-276SZO74.js?v=19c79349:680
setValueForProperty @ chunk-276SZO74.js?v=19c79349:1224
setInitialDOMProperties @ chunk-276SZO74.js?v=19c79349:7462
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7595
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: Invalid attribute name: `$justifyContent` Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
isAttributeNameSafe @ chunk-276SZO74.js?v=19c79349:680
setValueForProperty @ chunk-276SZO74.js?v=19c79349:1224
setInitialDOMProperties @ chunk-276SZO74.js?v=19c79349:7462
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7595
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: Invalid attribute name: `$height` Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
isAttributeNameSafe @ chunk-276SZO74.js?v=19c79349:680
setValueForProperty @ chunk-276SZO74.js?v=19c79349:1224
setInitialDOMProperties @ chunk-276SZO74.js?v=19c79349:7462
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7595
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 Warning: Invalid attribute name: `$gap` Error Component Stack
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at div (<anonymous>)
at chunk-SZOH2DOY.js?v=19c79349:5054:5
at Box (Layout.jsx:24:3)
at RouteErrorBoundary (RouteErrorBoundary.jsx:7:17)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
printWarning @ chunk-276SZO74.js?v=19c79349:521
error @ chunk-276SZO74.js?v=19c79349:505
isAttributeNameSafe @ chunk-276SZO74.js?v=19c79349:680
setValueForProperty @ chunk-276SZO74.js?v=19c79349:1224
setInitialDOMProperties @ chunk-276SZO74.js?v=19c79349:7462
setInitialProperties @ chunk-276SZO74.js?v=19c79349:7595
finalizeInitialChildren @ chunk-276SZO74.js?v=19c79349:8345
completeWork @ chunk-276SZO74.js?v=19c79349:16293
completeUnitOfWork @ chunk-276SZO74.js?v=19c79349:19224
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19206
workLoopConcurrent @ chunk-276SZO74.js?v=19c79349:19189
renderRootConcurrent @ chunk-276SZO74.js?v=19c79349:19164
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18678
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
useGame.js:41 You should call navigate() in a React.useEffect(), not when your component is first rendered. Error Component Stack
at GameProvider (GameContext.jsx:31:25)
at AppLayout (App.jsx:26:22)
at RenderedRoute (react-router-dom.js?v=d308228d:5643:26)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
warning @ react-router-dom.js?v=d308228d:532
(anonymous) @ react-router-dom.js?v=d308228d:5950
(anonymous) @ zustand.js?v=e85e01f0:38
mountSyncExternalStore @ chunk-276SZO74.js?v=19c79349:11886
useSyncExternalStore @ chunk-276SZO74.js?v=19c79349:12573
useSyncExternalStore @ chunk-ZMLY2J2T.js?v=19c79349:1120
useStore @ zustand.js?v=e85e01f0:36
useBoundStore @ zustand.js?v=e85e01f0:46
useGame @ useGame.js:41
GameProvider @ GameContext.jsx:33
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
mountIndeterminateComponent @ chunk-276SZO74.js?v=19c79349:14926
beginWork @ chunk-276SZO74.js?v=19c79349:15914
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19753
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopSync @ chunk-276SZO74.js?v=19c79349:19137
renderRootSync @ chunk-276SZO74.js?v=19c79349:19116
recoverFromConcurrentError @ chunk-276SZO74.js?v=19c79349:18736
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18684
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this warning
useGame.js:41 You should call navigate() in a React.useEffect(), not when your component is first rendered. Error Component Stack
at GameProvider (GameContext.jsx:31:25)
at AppLayout (App.jsx:26:22)
at RenderedRoute (react-router-dom.js?v=d308228d:5643:26)
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
warning @ react-router-dom.js?v=d308228d:532
(anonymous) @ react-router-dom.js?v=d308228d:5950
(anonymous) @ zustand.js?v=e85e01f0:38
mountSyncExternalStore @ chunk-276SZO74.js?v=19c79349:11886
useSyncExternalStore @ chunk-276SZO74.js?v=19c79349:12573
useSyncExternalStore @ chunk-ZMLY2J2T.js?v=19c79349:1120
useStore @ zustand.js?v=e85e01f0:36
useBoundStore @ zustand.js?v=e85e01f0:46
useGame @ useGame.js:41
GameProvider @ GameContext.jsx:33
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
mountIndeterminateComponent @ chunk-276SZO74.js?v=19c79349:14926
beginWork @ chunk-276SZO74.js?v=19c79349:15914
callCallback2 @ chunk-276SZO74.js?v=19c79349:3674
invokeGuardedCallbackDev @ chunk-276SZO74.js?v=19c79349:3699
invokeGuardedCallback @ chunk-276SZO74.js?v=19c79349:3733
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19765
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopSync @ chunk-276SZO74.js?v=19c79349:19137
renderRootSync @ chunk-276SZO74.js?v=19c79349:19116
recoverFromConcurrentError @ chunk-276SZO74.js?v=19c79349:18736
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18684
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this warning
useGame.js:113 Uncaught TypeError: Cannot read properties of undefined (reading 'rooms')
at useGame.js:113:24
at mountMemo (chunk-276SZO74.js?v=19c79349:12194:27)
at Object.useMemo (chunk-276SZO74.js?v=19c79349:12518:24)
at useMemo (chunk-ZMLY2J2T.js?v=19c79349:1094:29)
at useGame (useGame.js:111:19)
at GameProvider (GameContext.jsx:33:24)
at renderWithHooks (chunk-276SZO74.js?v=19c79349:11548:26)
at mountIndeterminateComponent (chunk-276SZO74.js?v=19c79349:14926:21)
at beginWork (chunk-276SZO74.js?v=19c79349:15914:22)
at HTMLUnknownElement.callCallback2 (chunk-276SZO74.js?v=19c79349:3674:22)
(anonymous) @ useGame.js:113
mountMemo @ chunk-276SZO74.js?v=19c79349:12194
useMemo @ chunk-276SZO74.js?v=19c79349:12518
useMemo @ chunk-ZMLY2J2T.js?v=19c79349:1094
useGame @ useGame.js:111
GameProvider @ GameContext.jsx:33
renderWithHooks @ chunk-276SZO74.js?v=19c79349:11548
mountIndeterminateComponent @ chunk-276SZO74.js?v=19c79349:14926
beginWork @ chunk-276SZO74.js?v=19c79349:15914
callCallback2 @ chunk-276SZO74.js?v=19c79349:3674
invokeGuardedCallbackDev @ chunk-276SZO74.js?v=19c79349:3699
invokeGuardedCallback @ chunk-276SZO74.js?v=19c79349:3733
beginWork$1 @ chunk-276SZO74.js?v=19c79349:19765
performUnitOfWork @ chunk-276SZO74.js?v=19c79349:19198
workLoopSync @ chunk-276SZO74.js?v=19c79349:19137
renderRootSync @ chunk-276SZO74.js?v=19c79349:19116
recoverFromConcurrentError @ chunk-276SZO74.js?v=19c79349:18736
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18684
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 The above error occurred in the <GameProvider> component:

    at GameProvider (http://119.201.51.128:5173/src/context/GameContext.jsx?t=1755534127607:25:25)
    at AppLayout (http://119.201.51.128:5173/src/App.jsx?t=1755534127607:37:20)
    at RenderedRoute (http://119.201.51.128:5173/node_modules/.vite/deps/react-router-dom.js?v=d308228d:5643:26)
    at RenderErrorBoundary (http://119.201.51.128:5173/node_modules/.vite/deps/react-router-dom.js?v=d308228d:5602:5)
    at DataRoutes (http://119.201.51.128:5173/node_modules/.vite/deps/react-router-dom.js?v=d308228d:6237:3)
    at Router (http://119.201.51.128:5173/node_modules/.vite/deps/react-router-dom.js?v=d308228d:6322:13)
    at RouterProvider (http://119.201.51.128:5173/node_modules/.vite/deps/react-router-dom.js?v=d308228d:6067:11)
    at RouterProvider2
    at ErrorBoundary (http://119.201.51.128:5173/src/components/ErrorBoundary.jsx:9:5)
    at div
    at CssBaseline (http://119.201.51.128:5173/src/components/ui/CssBaseline/CssBaseline.jsx:19:31)
    at App
    at QueryClientProvider (http://119.201.51.128:5173/node_modules/.vite/deps/chunk-ENT363IH.js?v=19c79349:2934:3)
    at MantineThemeProvider (http://119.201.51.128:5173/node_modules/.vite/deps/chunk-SZOH2DOY.js?v=19c79349:3407:3)
    at MantineProvider (http://119.201.51.128:5173/node_modules/.vite/deps/chunk-SZOH2DOY.js?v=19c79349:3909:3)

React will try to recreate this component tree from scratch using the error boundary you provided, RenderErrorBoundary.
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
logCapturedError @ chunk-276SZO74.js?v=19c79349:14032
callback @ chunk-276SZO74.js?v=19c79349:14078
callCallback @ chunk-276SZO74.js?v=19c79349:11248
commitUpdateQueue @ chunk-276SZO74.js?v=19c79349:11265
commitLayoutEffectOnFiber @ chunk-276SZO74.js?v=19c79349:17075
commitLayoutMountEffects_complete @ chunk-276SZO74.js?v=19c79349:17980
commitLayoutEffects_begin @ chunk-276SZO74.js?v=19c79349:17969
commitLayoutEffects @ chunk-276SZO74.js?v=19c79349:17920
commitRootImpl @ chunk-276SZO74.js?v=19c79349:19353
commitRoot @ chunk-276SZO74.js?v=19c79349:19277
finishConcurrentRender @ chunk-276SZO74.js?v=19c79349:18760
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18718
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error
hook.js:608 React Router caught the following error during render TypeError: Cannot read properties of undefined (reading 'rooms')
at useGame.js:113:24
at mountMemo (chunk-276SZO74.js?v=19c79349:12194:27)
at Object.useMemo (chunk-276SZO74.js?v=19c79349:12518:24)
at useMemo (chunk-ZMLY2J2T.js?v=19c79349:1094:29)
at useGame (useGame.js:111:19)
at GameProvider (GameContext.jsx:33:24)
at renderWithHooks (chunk-276SZO74.js?v=19c79349:11548:26)
at mountIndeterminateComponent (chunk-276SZO74.js?v=19c79349:14926:21)
at beginWork (chunk-276SZO74.js?v=19c79349:15914:22)
at beginWork$1 (chunk-276SZO74.js?v=19c79349:19753:22) {componentStack: '\n    at GameProvider (http://119.201.51.128:5173/s…s/.vite/deps/chunk-SZOH2DOY.js?v=19c79349:3909:3)'} Error Component Stack
at RenderErrorBoundary (react-router-dom.js?v=d308228d:5602:5)
at DataRoutes (react-router-dom.js?v=d308228d:6237:3)
at Router (react-router-dom.js?v=d308228d:6322:13)
at RouterProvider (react-router-dom.js?v=d308228d:6067:11)
at RouterProvider2 (<anonymous>)
at ErrorBoundary (ErrorBoundary.jsx:7:5)
at div (<anonymous>)
at CssBaseline (CssBaseline.jsx:5:31)
at App (<anonymous>)
at QueryClientProvider (chunk-ENT363IH.js?v=19c79349:2934:3)
at MantineThemeProvider (chunk-SZOH2DOY.js?v=19c79349:3407:3)
at MantineProvider (chunk-SZOH2DOY.js?v=19c79349:3909:3)
overrideMethod @ hook.js:608
console.error @ chunk-SZOH2DOY.js?v=19c79349:3822
componentDidCatch @ react-router-dom.js?v=d308228d:5627
callback @ chunk-276SZO74.js?v=19c79349:14084
callCallback @ chunk-276SZO74.js?v=19c79349:11248
commitUpdateQueue @ chunk-276SZO74.js?v=19c79349:11265
commitLayoutEffectOnFiber @ chunk-276SZO74.js?v=19c79349:17075
commitLayoutMountEffects_complete @ chunk-276SZO74.js?v=19c79349:17980
commitLayoutEffects_begin @ chunk-276SZO74.js?v=19c79349:17969
commitLayoutEffects @ chunk-276SZO74.js?v=19c79349:17920
commitRootImpl @ chunk-276SZO74.js?v=19c79349:19353
commitRoot @ chunk-276SZO74.js?v=19c79349:19277
finishConcurrentRender @ chunk-276SZO74.js?v=19c79349:18760
performConcurrentWorkOnRoot @ chunk-276SZO74.js?v=19c79349:18718
workLoop @ chunk-276SZO74.js?v=19c79349:197
flushWork @ chunk-276SZO74.js?v=19c79349:176
performWorkUntilDeadline @ chunk-276SZO74.js?v=19c79349:384Understand this error