


//SPRING CONSOLE LOG
2025-08-22 11:46:05.688 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing POST /api/v1/auth/login
2025-08-22 11:46:05.695 [http-nio-20021-exec-1] WARN  o.s.w.s.h.HandlerMappingIntrospector - Cache miss for REQUEST dispatch to '/api/v1/auth/login' (previous null). Performing CorsConfiguration lookup. This is logged once only at WARN level, and every time at TRACE.
2025-08-22 11:46:05.711 [http-nio-20021-exec-1] DEBUG o.s.security.web.csrf.CsrfFilter - Invalid CSRF token found for http://localhost:20021/api/v1/auth/login
2025-08-22 11:46:05.711 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.AccessDeniedHandlerImpl - Responding with 403 status code
2025-08-22 11:46:05.808 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing POST /error
2025-08-22 11:46:05.814 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-22 11:46:05.818 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.DelegatingAuthenticationEntryPoint - Trying to match using And [Not [RequestHeaderRequestMatcher [expectedHeaderName=X-Requested-With, expectedHeaderValue=XMLHttpRequest]], MediaTypeRequestMatcher [contentNegotiationStrategy=org.springframework.web.accept.ContentNegotiationManager@413195dc, matchingMediaTypes=[application/xhtml+xml, image/*, text/html, text/plain], useEquals=false, ignoredMediaTypes=[*/*]]]
2025-08-22 11:46:05.819 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.DelegatingAuthenticationEntryPoint - Match found! Executing org.springframework.security.web.authentication.LoginUrlAuthenticationEntryPoint@3dfabb85
2025-08-22 11:46:05.820 [http-nio-20021-exec-1] DEBUG o.s.s.web.DefaultRedirectStrategy - Redirecting to http://localhost:20021/login
2025-08-22 11:46:05.834 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing GET /login

//BROWSER CONSOLE LOG
login:1 Access to XMLHttpRequest at 'http://localhost:20021/login' (redirected from 'http://localhost:5173/api/v1/auth/login') from origin 'http://localhost:5173' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.Understand this error
useLoginMutation.ts:22 Login failed: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK', config: {…}, request: XMLHttpRequest, …}
onError @ useLoginMutation.ts:22
execute @ @tanstack_react-query.js?v=92a008ee:1261
await in execute
mutate @ @tanstack_react-query.js?v=92a008ee:2642
(anonymous) @ @tanstack_react-query.js?v=92a008ee:3356
onSubmit @ LoginForm.tsx:19
(anonymous) @ chunk-JYNBG5WP.js?v=92a008ee:1506
await in (anonymous)
executeDispatch @ react-dom_client.js?v=92a008ee:11736
runWithFiberInDEV @ react-dom_client.js?v=92a008ee:1485
processDispatchQueue @ react-dom_client.js?v=92a008ee:11772
(anonymous) @ react-dom_client.js?v=92a008ee:12182
batchedUpdates$1 @ react-dom_client.js?v=92a008ee:2628
dispatchEventForPluginEventSystem @ react-dom_client.js?v=92a008ee:11877
dispatchEvent @ react-dom_client.js?v=92a008ee:14792
dispatchDiscreteEvent @ react-dom_client.js?v=92a008ee:14773Understand this error
login.ts:12  GET http://localhost:20021/login net::ERR_FAILED 200 (OK)