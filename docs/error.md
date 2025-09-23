API Response: {status: 200, statusText: '', headers: {…}, ok: true}
client.ts:188 API Request: {method: 'GET', url: 'http://localhost:20021/api/v1/chat/history?gameNumber=11&limit=50', headers: {…}, body: undefined, credentials: 'include'}
client.ts:252 API Response Data: {success: true, userId: 32, nickname: '재현', message: '세션이 갱신되었습니다.'}
authService.ts:48 Session refresh successful: 재현
authStore.ts:106 Auth state updated after refresh: 재현
client.ts:200 API Response: {status: 200, statusText: '', headers: {…}, ok: true}
client.ts:252 API Response Data: []
websocketService.ts:667 STOMP Debug: >>> SEND
destination:/app/chat.send
content-length:103


websocketService.ts:667 STOMP Debug: Received data
websocketService.ts:667 STOMP Debug: <<< MESSAGE
content-length:156
message-id:kxfmcjox-12
subscription:sub-2
content-type:application/json
destination:/topic/chat.11
content-length:156


websocketService.ts:915 Received chat message: {id: '15', gameNumber: 11, playerId: undefined, userId: undefined, playerNickname: '재현', …}
websocketService.ts:667 STOMP Debug: >>> SEND
destination:/app/chat.send
content-length:100


websocketService.ts:667 STOMP Debug: Received data
websocketService.ts:667 STOMP Debug: <<< MESSAGE
content-length:153
message-id:kxfmcjox-13
subscription:sub-2
content-type:application/json
destination:/topic/chat.11
content-length:153


websocketService.ts:915 Received chat message: {id: '16', gameNumber: 11, playerId: undefined, userId: undefined, playerNickname: '재현', …}content: "ㅁㄴㄻㄹㄴㅇㅁㄹ"gameNumber: 11id: "16"message: "ㅁㄴㄻㄹㄴㅇㅁㄹ"playerId: undefinedplayerName: "재현"playerNickname: "재현"timestamp: 1758595476867type: "POST_ROUND"userId: undefined[[Prototype]]: Object
websocketService.ts:667 STOMP Debug: >>> SEND
destination:/app/chat.send
content-length:109


websocketService.ts:667 STOMP Debug: Received data
websocketService.ts:667 STOMP Debug: <<< MESSAGE
content-length:159
message-id:kxfmcjox-14
subscription:sub-2
content-type:application/json
destination:/topic/chat.11
content-length:159


websocketService.ts:915 Received chat message: {id: '17', gameNumber: 11, playerId: undefined, userId: undefined, playerNickname: '재현', …}content: "ㄴㄻㅇㄹㄴㅁㄹㄴㄹㄴㅁ"gameNumber: 11id: "17"message: "ㄴㄻㅇㄹㄴㅁㄹㄴㄹㄴㅁ"playerId: undefinedplayerName: "재현"playerNickname: "재현"timestamp: 1758595500246type: "POST_ROUND"userId: undefined[[Prototype]]: Object
2websocketService.ts:667 STOMP Debug: >>> SEND
destination:/app/ping
content-length:27
