2025-08-30 01:55:12.814 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Admin (ID: 55)
[ChatService] Player: Test (ID: 56)
[ChatService] Player isAlive: true
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:14.822 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:14.823 [http-nio-20021-exec-9] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:14.823 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:14.837 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:14.838 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:14.838 [http-nio-20021-exec-10] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:14.838 [http-nio-20021-exec-4] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:14.838 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
2025-08-30 01:55:14.838 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Test (ID: 56)
[ChatService] Player: Admin (ID: 55)
[ChatService] Player isAlive: true
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
[CONNECTION] Connection timeout detected: srjhb3tr
2025-08-30 01:55:16.849 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:16.849 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:16.850 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:16.850 [http-nio-20021-exec-2] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:16.850 [http-nio-20021-exec-3] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:16.850 [http-nio-20021-exec-5] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:16.850 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
2025-08-30 01:55:16.850 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
2025-08-30 01:55:16.850 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player: Admin (ID: 55)
[ChatService] Player: Test (ID: 56)
[ChatService] Player isAlive: true
[ChatService] Player isAlive: true
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game currentPlayerId: null
[ChatService] Game state: IN_PROGRESS
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
[CONNECTION] Connection timeout detected: vishtx4b
2025-08-30 01:55:17.671 [MessageBroker-6] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === WebSocket 연결 상태 모니터링 시작 ===
2025-08-30 01:55:17.671 [MessageBroker-6] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 시작
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.g_state=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
2025-08-30 01:55:17.674 [MessageBroker-6] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 완료: 0명 정리
2025-08-30 01:55:17.691 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing OPTIONS /api/v1/game/vote
2025-08-30 01:55:17.694 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Securing POST /api/v1/game/vote
2025-08-30 01:55:17.695 [http-nio-20021-exec-7] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:17.695 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Secured POST /api/v1/game/vote
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=? for no key update
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=? and pe1_0.user_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.id=?
[VotingService] Player Flow voted for Admin
Hibernate: update player set assigned_word=?,defense=?,final_vote=?,game_id=?,hint=?,is_alive=?,joined_at=?,nickname=?,role=?,state=?,subject_id=?,user_id=?,vote_start_time=?,voted_for=?,votes_received=? where id=?
Hibernate: update player set assigned_word=?,defense=?,final_vote=?,game_id=?,hint=?,is_alive=?,joined_at=?,nickname=?,role=?,state=?,subject_id=?,user_id=?,vote_start_time=?,voted_for=?,votes_received=? where id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[VotingService] Vote progress: 1/3 players voted
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:18.862 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:18.863 [http-nio-20021-exec-6] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:18.863 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Admin (ID: 55)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
2025-08-30 01:55:18.868 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
2025-08-30 01:55:18.869 [http-nio-20021-exec-8] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:18.869 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Test (ID: 56)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:19.209 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Securing OPTIONS /api/v1/game/vote
2025-08-30 01:55:19.212 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Securing POST /api/v1/game/vote
2025-08-30 01:55:19.213 [http-nio-20021-exec-10] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:19.214 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Secured POST /api/v1/game/vote
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=? for no key update
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=? and pe1_0.user_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.id=?
[VotingService] Player Admin voted for Flow
Hibernate: update player set assigned_word=?,defense=?,final_vote=?,game_id=?,hint=?,is_alive=?,joined_at=?,nickname=?,role=?,state=?,subject_id=?,user_id=?,vote_start_time=?,voted_for=?,votes_received=? where id=?
Hibernate: update player set assigned_word=?,defense=?,final_vote=?,game_id=?,hint=?,is_alive=?,joined_at=?,nickname=?,role=?,state=?,subject_id=?,user_id=?,vote_start_time=?,voted_for=?,votes_received=? where id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[VotingService] Vote progress: 2/3 players voted
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:19.739 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:19.740 [http-nio-20021-exec-4] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:19.741 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
[CONNECTION] Connection timeout detected: rj3ym04d
2025-08-30 01:55:20.884 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:20.885 [http-nio-20021-exec-3] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:20.886 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Test (ID: 56)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:21.251 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:21.252 [http-nio-20021-exec-2] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:21.252 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Admin (ID: 55)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:21.759 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:21.760 [http-nio-20021-exec-5] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:21.760 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=VOTING_FOR_LIAR, calculatedPhase=SPEECH, finalPhase=VOTING_FOR_LIAR
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: VOTING_FOR_LIAR
[ChatService] Current phase: VOTING_FOR_LIAR
[ChatService] In VOTING_FOR_LIAR phase, returning null to enable voting UI
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:22.373 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing OPTIONS /api/v1/game/vote
2025-08-30 01:55:22.377 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Securing POST /api/v1/game/vote
2025-08-30 01:55:22.378 [http-nio-20021-exec-7] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:22.379 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Secured POST /api/v1/game/vote
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=? for no key update
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=? and pe1_0.user_id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.id=?
[VotingService] Player Test voted for Admin
Hibernate: update player set assigned_word=?,defense=?,final_vote=?,game_id=?,hint=?,is_alive=?,joined_at=?,nickname=?,role=?,state=?,subject_id=?,user_id=?,vote_start_time=?,voted_for=?,votes_received=? where id=?
Hibernate: update player set assigned_word=?,defense=?,final_vote=?,game_id=?,hint=?,is_alive=?,joined_at=?,nickname=?,role=?,state=?,subject_id=?,user_id=?,vote_start_time=?,voted_for=?,votes_received=? where id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[VotingService] Vote progress: 3/3 players voted
[VotingService] All players have voted, processing vote results
[VotingService] === PROCESSING VOTE RESULTS ===
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=? and pe1_0.is_alive=?
[VotingService] Max votes received: 2
[VotingService] Player Flow: 1 votes
[VotingService] Player Test: 0 votes
[VotingService] Player Admin: 2 votes
[VotingService] Single most-voted player: Admin
Hibernate: update game set accused_player_id=?,citizen_subject_id=?,g_phase=?,current_player_id=?,current_turn_index=?,game_current_round=?,game_end_time=?,game_liar_count=?,g_game_mode=?,game_name=?,game_number=?,game_owner=?,game_participants=?,game_password=?,game_start_deadline=?,g_state=?,game_total_rounds=?,ip_address=?,last_activity_at=?,liar_subject_id=?,modified_at=?,phase_end_time=?,session_id=?,time_extension_count=?,turn_order=?,turn_started_at=?,version=? where id=? and version=?
Hibernate: update player set assigned_word=?,defense=?,final_vote=?,game_id=?,hint=?,is_alive=?,joined_at=?,nickname=?,role=?,state=?,subject_id=?,user_id=?,vote_start_time=?,voted_for=?,votes_received=? where id=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:22.675 [MessageBroker-12] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === 실시간 연결 해제 플레이어 정리 시작 ===
2025-08-30 01:55:22.675 [MessageBroker-9] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === WebSocket 연결 상태 모니터링 시작 ===
2025-08-30 01:55:22.675 [MessageBroker-9] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 시작
2025-08-30 01:55:22.675 [MessageBroker-12] DEBUG o.e.k.d.auth.service.AdminService - 연결 해제된 플레이어 정리 시작
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.g_state=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
2025-08-30 01:55:22.677 [MessageBroker-12] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 정리 완료: 0명 정리
2025-08-30 01:55:22.677 [MessageBroker-9] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 완료: 0명 정리
2025-08-30 01:55:23.265 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:23.266 [http-nio-20021-exec-6] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:23.266 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=DEFENDING, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Admin (ID: 55)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:23.777 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:23.778 [http-nio-20021-exec-8] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:23.778 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=DEFENDING, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:24.433 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:24.434 [http-nio-20021-exec-9] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:24.434 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=DEFENDING, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Test (ID: 56)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:25.281 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:25.282 [http-nio-20021-exec-10] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:25.282 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=DEFENDING, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Admin (ID: 55)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:25.791 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:25.792 [http-nio-20021-exec-4] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:25.793 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=DEFENDING, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
[CONNECTION] Connection timeout detected: srjhb3tr
[CONNECTION] Max reconnection attempts reached for srjhb3tr
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 join game g1_0 on g1_0.id=pe1_0.game_id where pe1_0.user_id=? and g1_0.g_state='IN_PROGRESS'
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=? for no key update
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=? and pe1_0.user_id=?
2025-08-30 01:55:26.237 [MessageBroker-2] DEBUG o.e.k.d.game.service.GameService - 플레이어 삭제 전 채팅 메시지 정리: playerId=55, nickname=Admin
Hibernate: delete from chat_message where player_id=?
[CHAT] Deleted 2 chat messages for player ID: 55
Hibernate: delete from player where id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] Successfully cleaned up player by userId: 1 from game: 1
Hibernate: update game set accused_player_id=?,citizen_subject_id=?,g_phase=?,current_player_id=?,current_turn_index=?,game_current_round=?,game_end_time=?,game_liar_count=?,g_game_mode=?,game_name=?,game_number=?,game_owner=?,game_participants=?,game_password=?,game_start_deadline=?,g_state=?,game_total_rounds=?,ip_address=?,last_activity_at=?,liar_subject_id=?,modified_at=?,phase_end_time=?,session_id=?,time_extension_count=?,turn_order=?,turn_started_at=?,version=? where id=? and version=?
[CONNECTION] Successfully cleaned up player by userId: 1
[CONNECTION] Cleaned up connection: srjhb3tr
2025-08-30 01:55:26.468 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:26.469 [http-nio-20021-exec-3] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:26.469 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Test (ID: 56)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
[CONNECTION] Connection timeout detected: vishtx4b
2025-08-30 01:55:27.299 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:27.300 [http-nio-20021-exec-2] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:27.301 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:27.668 [MessageBroker-10] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === WebSocket 연결 상태 모니터링 시작 ===
2025-08-30 01:55:27.668 [MessageBroker-10] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 시작
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.g_state=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
2025-08-30 01:55:27.671 [MessageBroker-10] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 완료: 0명 정리
2025-08-30 01:55:27.808 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:27.809 [http-nio-20021-exec-5] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:27.809 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:28.497 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:28.498 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:28.498 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Test (ID: 56)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:29.320 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:29.320 [http-nio-20021-exec-7] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:29.320 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:29.838 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:29.840 [http-nio-20021-exec-6] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:29.840 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:30.512 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:30.514 [http-nio-20021-exec-8] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:30.514 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Test (ID: 56)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
[CONNECTION] Connection timeout detected: rj3ym04d
[CONNECTION] Max reconnection attempts reached for rj3ym04d
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 join game g1_0 on g1_0.id=pe1_0.game_id where pe1_0.user_id=? and g1_0.g_state='IN_PROGRESS'
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=? for no key update
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=? and pe1_0.user_id=?
2025-08-30 01:55:30.589 [MessageBroker-6] DEBUG o.e.k.d.game.service.GameService - 플레이어 삭제 전 채팅 메시지 정리: playerId=56, nickname=Test
Hibernate: delete from chat_message where player_id=?
[CHAT] Deleted 1 chat messages for player ID: 56
Hibernate: delete from player where id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] Successfully cleaned up player by userId: 37 from game: 1
Hibernate: update game set accused_player_id=?,citizen_subject_id=?,g_phase=?,current_player_id=?,current_turn_index=?,game_current_round=?,game_end_time=?,game_liar_count=?,g_game_mode=?,game_name=?,game_number=?,game_owner=?,game_participants=?,game_password=?,game_start_deadline=?,g_state=?,game_total_rounds=?,ip_address=?,last_activity_at=?,liar_subject_id=?,modified_at=?,phase_end_time=?,session_id=?,time_extension_count=?,turn_order=?,turn_started_at=?,version=? where id=? and version=?
[CONNECTION] Successfully cleaned up player by userId: 37
[CONNECTION] Cleaned up connection: rj3ym04d
2025-08-30 01:55:31.336 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:31.337 [http-nio-20021-exec-9] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:31.337 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:31.853 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:31.854 [http-nio-20021-exec-4] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:31.854 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:32.526 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:32.527 [http-nio-20021-exec-3] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:32.528 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:32.662 [MessageBroker-8] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === WebSocket 연결 상태 모니터링 시작 ===
2025-08-30 01:55:32.662 [MessageBroker-2] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === 개선된 게임방 정리 시작 ===
2025-08-30 01:55:32.662 [MessageBroker-8] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 시작
2025-08-30 01:55:32.662 [MessageBroker-9] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === 실시간 연결 해제 플레이어 정리 시작 ===
2025-08-30 01:55:32.662 [MessageBroker-2] DEBUG o.e.k.d.auth.service.AdminService - 개선된 게임방 정리 시작
2025-08-30 01:55:32.663 [MessageBroker-9] DEBUG o.e.k.d.auth.service.AdminService - 연결 해제된 플레이어 정리 시작
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
2025-08-30 01:55:32.664 [MessageBroker-9] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 정리 완료: 0명 정리
2025-08-30 01:55:32.664 [MessageBroker-8] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 완료: 0명 정리
2025-08-30 01:55:32.664 [MessageBroker-2] DEBUG o.e.k.d.auth.service.AdminService - 게임방 정리 완료: 0개 게임방 처리
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.g_state=?
2025-08-30 01:55:33.352 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:33.353 [http-nio-20021-exec-2] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:33.353 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:33.872 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:33.873 [http-nio-20021-exec-5] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:33.873 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:34.538 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:34.540 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:34.541 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:35.368 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:35.370 [http-nio-20021-exec-7] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:35.371 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:35.889 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:35.890 [http-nio-20021-exec-6] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:35.890 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
[ChatService] === DETERMINE MESSAGE TYPE DEBUG ===
[ChatService] Player: Flow (ID: 57)
[ChatService] Player isAlive: true
[ChatService] Game state: IN_PROGRESS
[ChatService] Game currentPlayerId: null
[ChatService] Game turnStartedAt: 2025-08-29T16:55:02.469696Z
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[ChatService] Using actual game currentPhase: DEFENDING
[ChatService] Current phase: DEFENDING
[ChatService] In DEFENDING phase, returning DEFENSE
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
2025-08-30 01:55:36.561 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:36.562 [http-nio-20021-exec-8] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:36.562 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
[GameService] getGameState - Game 1: actualPhase=DEFENDING, calculatedPhase=VOTING_FOR_LIAR, finalPhase=DEFENDING
Hibernate: select se1_0.id,se1_0.content,se1_0.created_at,se1_0.ip_address,se1_0.modified_at,se1_0.session_id,se1_0.status,w1_0.subject_id,w1_0.id,w1_0.content,w1_0.created_at,w1_0.ip_address,w1_0.modified_at,w1_0.session_id,w1_0.status from subject se1_0 left join word w1_0 on se1_0.id=w1_0.subject_id where se1_0.id=?
[CONNECTION] Connection timeout detected: vishtx4b
[CONNECTION] Max reconnection attempts reached for vishtx4b
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 join game g1_0 on g1_0.id=pe1_0.game_id where pe1_0.user_id=? and g1_0.g_state='IN_PROGRESS'
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.id=?
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=? for no key update
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=? and pe1_0.user_id=?
2025-08-30 01:55:37.223 [MessageBroker-3] DEBUG o.e.k.d.game.service.GameService - 플레이어 삭제 전 채팅 메시지 정리: playerId=57, nickname=Flow
Hibernate: delete from chat_message where player_id=?
[CHAT] Deleted 2 chat messages for player ID: 57
Hibernate: delete from player where id=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0 where pe1_0.game_id=?
2025-08-30 01:55:37.227 [MessageBroker-3] DEBUG o.e.k.d.game.service.GameService - 게임 삭제 전 모든 채팅 메시지 정리: gameNumber=1
Hibernate: delete from chat_message where game_id=?
[CHAT] Deleted 10 chat messages for game: 1
2025-08-30 01:55:37.229 [MessageBroker-3] DEBUG o.e.k.d.game.service.GameService - 게임 삭제 전 game_subject 관계 정리: gameNumber=1
Hibernate: select gse1_0.id,gse1_0.created_at,gse1_0.game_id,gse1_0.ip_address,gse1_0.modified_at,gse1_0.session_id,gse1_0.subject_id from game_subject gse1_0 where gse1_0.game_id=?
2025-08-30 01:55:37.231 [MessageBroker-3] DEBUG o.e.k.d.game.service.GameService - game_subject 레코드 1개 삭제됨
[GameService] Successfully cleaned up player by userId: 38 from game: 1
Hibernate: delete from game_subject where id=?
Hibernate: delete from game where id=? and version=?
[CONNECTION] Successfully cleaned up player by userId: 38
[CONNECTION] Cleaned up connection: vishtx4b
2025-08-30 01:55:37.530 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:37.530 [http-nio-20021-exec-10] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:37.530 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:37.674 [MessageBroker-10] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === WebSocket 연결 상태 모니터링 시작 ===
2025-08-30 01:55:37.674 [MessageBroker-10] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 시작
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.g_state=?
2025-08-30 01:55:37.675 [MessageBroker-10] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 완료: 0명 정리
2025-08-30 01:55:37.982 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:37.983 [http-nio-20021-exec-9] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:37.983 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:38.553 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:38.554 [http-nio-20021-exec-3] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:38.554 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:38.584 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:38.585 [http-nio-20021-exec-2] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:38.585 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:39.007 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:39.009 [http-nio-20021-exec-5] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:39.009 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:39.616 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:39.617 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:39.617 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:40.570 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:40.571 [http-nio-20021-exec-7] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:40.571 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:41.029 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:41.030 [http-nio-20021-exec-6] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:41.030 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:41.638 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:41.638 [http-nio-20021-exec-8] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:41.640 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:42.675 [MessageBroker-1] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === WebSocket 연결 상태 모니터링 시작 ===
2025-08-30 01:55:42.675 [MessageBroker-12] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === 실시간 연결 해제 플레이어 정리 시작 ===
2025-08-30 01:55:42.676 [MessageBroker-12] DEBUG o.e.k.d.auth.service.AdminService - 연결 해제된 플레이어 정리 시작
2025-08-30 01:55:42.676 [MessageBroker-1] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 시작
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
2025-08-30 01:55:42.676 [MessageBroker-12] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 정리 완료: 0명 정리
2025-08-30 01:55:42.676 [MessageBroker-1] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 완료: 0명 정리
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.g_state=?
2025-08-30 01:55:44.593 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:44.594 [http-nio-20021-exec-10] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:44.594 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:45.040 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:45.040 [http-nio-20021-exec-9] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:45.042 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:45.652 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:45.654 [http-nio-20021-exec-2] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:45.654 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:46.610 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:46.611 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:46.612 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:47.065 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:47.067 [http-nio-20021-exec-7] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:47.067 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:47.632 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:47.633 [http-nio-20021-exec-6] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:47.634 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:47.678 [MessageBroker-11] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === WebSocket 연결 상태 모니터링 시작 ===
2025-08-30 01:55:47.678 [MessageBroker-11] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 시작
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.g_state=?
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
2025-08-30 01:55:47.680 [MessageBroker-11] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 완료: 0명 정리
2025-08-30 01:55:47.681 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:47.682 [http-nio-20021-exec-8] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:47.682 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:48.074 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:48.076 [http-nio-20021-exec-10] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:48.076 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:48.699 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:48.700 [http-nio-20021-exec-4] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:48.700 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:49.655 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:49.656 [http-nio-20021-exec-9] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:49.657 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:50.095 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:50.096 [http-nio-20021-exec-3] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:50.097 [http-nio-20021-exec-3] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:50.726 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:50.728 [http-nio-20021-exec-2] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:50.728 [http-nio-20021-exec-2] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:52.666 [MessageBroker-3] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === WebSocket 연결 상태 모니터링 시작 ===
2025-08-30 01:55:52.666 [MessageBroker-5] DEBUG o.e.k.d.a.s.GameCleanupScheduler - === 실시간 연결 해제 플레이어 정리 시작 ===
2025-08-30 01:55:52.666 [MessageBroker-5] DEBUG o.e.k.d.auth.service.AdminService - 연결 해제된 플레이어 정리 시작
2025-08-30 01:55:52.666 [MessageBroker-3] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 시작
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select pe1_0.id,pe1_0.assigned_word,pe1_0.defense,pe1_0.final_vote,pe1_0.game_id,pe1_0.hint,pe1_0.is_alive,pe1_0.joined_at,pe1_0.nickname,pe1_0.role,pe1_0.state,pe1_0.subject_id,pe1_0.user_id,pe1_0.vote_start_time,pe1_0.voted_for,pe1_0.votes_received from player pe1_0
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.g_state=?
2025-08-30 01:55:52.667 [MessageBroker-5] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 정리 완료: 0명 정리
2025-08-30 01:55:52.667 [MessageBroker-3] DEBUG o.e.k.d.auth.service.AdminService - 고아 플레이어 감지 및 정리 완료: 0명 정리
2025-08-30 01:55:53.674 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:53.675 [http-nio-20021-exec-5] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:53.675 [http-nio-20021-exec-5] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:54.115 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:54.116 [http-nio-20021-exec-1] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:54.116 [http-nio-20021-exec-1] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:54.982 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:54.983 [http-nio-20021-exec-7] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:54.983 [http-nio-20021-exec-7] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:55.695 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:55.696 [http-nio-20021-exec-6] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:55.696 [http-nio-20021-exec-6] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:56.138 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:56.138 [http-nio-20021-exec-8] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:56.140 [http-nio-20021-exec-8] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:56.717 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:56.718 [http-nio-20021-exec-10] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:56.718 [http-nio-20021-exec-10] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:57.008 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:57.009 [http-nio-20021-exec-4] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:57.009 [http-nio-20021-exec-4] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.
2025-08-30 01:55:57.158 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Securing GET /api/v1/game/1
2025-08-30 01:55:57.159 [http-nio-20021-exec-9] DEBUG o.s.s.w.a.AnonymousAuthenticationFilter - Set SecurityContextHolder to anonymous SecurityContext
2025-08-30 01:55:57.159 [http-nio-20021-exec-9] DEBUG o.s.security.web.FilterChainProxy - Secured GET /api/v1/game/1
Hibernate: select ge1_0.id,ge1_0.accused_player_id,ge1_0.citizen_subject_id,ge1_0.created_at,ge1_0.g_phase,ge1_0.current_player_id,ge1_0.current_turn_index,ge1_0.game_current_round,ge1_0.game_end_time,ge1_0.game_liar_count,ge1_0.g_game_mode,ge1_0.game_name,ge1_0.game_number,ge1_0.game_owner,ge1_0.game_participants,ge1_0.game_password,ge1_0.game_start_deadline,ge1_0.g_state,ge1_0.game_total_rounds,ge1_0.ip_address,ge1_0.last_activity_at,ge1_0.liar_subject_id,ge1_0.modified_at,ge1_0.phase_end_time,ge1_0.session_id,ge1_0.time_extension_count,ge1_0.turn_order,ge1_0.turn_started_at,ge1_0.version from game ge1_0 where ge1_0.game_number=?
[ERROR] GAME_NOT_FOUND: Game room 1 not found.