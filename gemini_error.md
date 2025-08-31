endDefense.ts:9
POST http://119.201.53.4:20021/api/v1/game/defense/end 400 (Bad Request)
DefensePhase.tsx:31 Failed to end defense:
AxiosError {message: 'Request failed with status code 400', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
endDefense.ts:9
POST http://119.201.53.4:20021/api/v1/game/defense/end 400 (Bad Request)
DefensePhase.tsx:31 Failed to end defense:
AxiosError {message: 'Request failed with status code 400', name: 'AxiosError', code: 'ERR_BAD_REQUEST', config: {…}, request: XMLHttpRequest, …}
code
:
"ERR_BAD_REQUEST"
config
:
{transitional: {…}, adapter: Array(3), transformRequest: Array(1), transformResponse: Array(1), timeout: 0, …}
message
:
"Request failed with status code 400"
name
:
"AxiosError"
request
:
XMLHttpRequest {onreadystatechange: null, readyState: 4, timeout: 0, withCredentials: true, upload: XMLHttpRequestUpload, …}
response
:
{data: '', status: 400, statusText: '', headers: AxiosHeaders, config: {…}, …}
status
:
400
stack
:
"AxiosError: Request failed with status code 400\n    at settle (http://119.201.53.4:5173/node_modules/.vite/deps/axios.js?v=5cdad08d:1253:12)\n    at XMLHttpRequest.onloadend (http://119.201.53.4:5173/node_modules/.vite/deps/axios.js?v=5cdad08d:1585:7)\n    at Axios.request (http://119.201.53.4:5173/node_modules/.vite/deps/axios.js?v=5cdad08d:2143:41)\n    at async endDefense (http://119.201.53.4:5173/src/features/game/api/endDefense.ts:3:20)\n    at async handleEndDefense (http://119.201.53.4:5173/src/features/game/ui/DefensePhase.tsx:35:7)"
[[Prototype]]
:
Error
handleEndDefense	@	DefensePhase.tsx:31
await in handleEndDefense		
onClick	@	DefensePhase.tsx:76


2025-08-31 20:03:32.729 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing POST /api/v1/game/defense/end
2025-08-31 20:03:32.729 [http-nio-20021-exec-2] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-31 20:03:32.730 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Secured POST /api/v1/game/defense/end
[DEBUG] endDefense called with gameNumber: 1
[DEBUG] Session ID: 76a271a6-5283-4661-9833-39a8b29929ca
[DEBUG] Session attributes: [nickname, userId]
[DEBUG] Retrieved userId from session: 43
[DEBUG] DefenseService.endDefense called - gameNumber: 1, playerId: 43
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.target_points,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[DEBUG] Game found - currentPhase: DEFENDING
[DEBUG] DefenseStatus: DefenseStatus(accusedPlayerId=73, defenseText=null, isDefenseSubmitted=false)
[ERROR] Player 43 is not the accused player 73
[ERROR] IllegalArgumentException in endDefense: Only the accused player can end defense
2025-08-31 20:03:33.044 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-31 20:03:33.044 [http-nio-20021-exec-10] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-31 20:03:33.045 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.target_points,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.cumulative_score,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=DEFENDING, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: 사용자3 (ID: 74)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-31T11:02:55.558867Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.cumulative_score,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase
[ChatService] Player is not accused, returning DISCUSSION
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-31 20:03:33.229 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-31 20:03:33.230 [http-nio-20021-exec-6] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-31 20:03:33.230 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.target_points,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.cumulative_score,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=DEFENDING, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: 사용자2 (ID: 75)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-31T11:02:55.558867Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.cumulative_score,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase
[ChatService] Player is not accused, returning DISCUSSION
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
