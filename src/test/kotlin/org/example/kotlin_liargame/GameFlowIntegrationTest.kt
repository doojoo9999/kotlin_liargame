//package org.example.kotlin_liargame
//
//import com.fasterxml.jackson.databind.ObjectMapper
//import com.fasterxml.jackson.module.kotlin.readValue
//import jakarta.persistence.EntityManager
//import jakarta.persistence.PersistenceContext
//import org.assertj.core.api.Assertions.assertThat
//import org.example.kotlin_liargame.domain.auth.dto.request.LoginRequest
//import org.example.kotlin_liargame.domain.game.dto.request.*
//import org.example.kotlin_liargame.domain.game.dto.response.GameStateResponse
//import org.example.kotlin_liargame.domain.game.dto.response.LiarGuessResultResponse
//import org.example.kotlin_liargame.domain.game.model.enum.GameMode
//import org.example.kotlin_liargame.domain.game.model.enum.GamePhase
//import org.example.kotlin_liargame.domain.game.model.enum.GameState
//import org.example.kotlin_liargame.domain.game.repository.GameRepository
//import org.example.kotlin_liargame.domain.game.repository.GameSubjectRepository
//import org.example.kotlin_liargame.domain.game.repository.PlayerRepository
//import org.example.kotlin_liargame.domain.game.service.GameProgressService
//import org.example.kotlin_liargame.domain.game.service.GameService
//import org.example.kotlin_liargame.domain.subject.dto.request.SubjectRequest
//import org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus
//import org.example.kotlin_liargame.domain.subject.repository.SubjectRepository
//import org.example.kotlin_liargame.domain.user.dto.request.UserAddRequest
//import org.example.kotlin_liargame.domain.user.repository.UserRepository
//import org.example.kotlin_liargame.domain.user.service.UserService
//import org.example.kotlin_liargame.domain.word.dto.request.ApplyWordRequest
//import org.example.kotlin_liargame.domain.word.repository.WordRepository
//import org.junit.jupiter.api.BeforeEach
//import org.junit.jupiter.api.Test
//import org.mockito.Mockito
//import org.springframework.beans.factory.annotation.Autowired
//import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
//import org.springframework.boot.test.context.SpringBootTest
//import org.springframework.boot.test.mock.mockito.SpyBean
//import org.springframework.http.MediaType
//import org.springframework.messaging.simp.SimpMessagingTemplate
//import org.springframework.mock.web.MockHttpSession
//import org.springframework.test.context.ActiveProfiles
//import org.springframework.test.web.servlet.MockMvc
//import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get
//import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post
//import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
//
//@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
//@AutoConfigureMockMvc
//@ActiveProfiles("test")
//class GameFlowIntegrationTest {
//
//    @Autowired
//    private lateinit var mockMvc: MockMvc
//
//    @Autowired
//    private lateinit var objectMapper: ObjectMapper
//
//    @SpyBean
//    private lateinit var simpMessagingTemplate: SimpMessagingTemplate
//
//    @Autowired lateinit var userService: UserService
//    @Autowired lateinit var userRepository: UserRepository
//
//    @Autowired lateinit var subjectRepository: SubjectRepository
//    @Autowired lateinit var wordRepository: WordRepository
//
//    @Autowired lateinit var gameRepository: GameRepository
//    @Autowired lateinit var playerRepository: PlayerRepository
//    @Autowired lateinit var gameSubjectRepository: GameSubjectRepository
//
//    @Autowired lateinit var gameService: GameService
//    @Autowired lateinit var gameProgressService: GameProgressService
//
//    @PersistenceContext lateinit var em: EntityManager
//
//    private lateinit var ownerSession: MockHttpSession
//    private lateinit var player2Session: MockHttpSession
//    private lateinit var player3Session: MockHttpSession
//
//    private var ownerId: Long = 0
//    private var player2Id: Long = 0
//    private var player3Id: Long = 0
//    private val subjectName = "동물"
//
//    @BeforeEach
//    fun setUp() {
//        // 1) 깨끗한 상태 보장 (자식 → 부모 순서)
//        playerRepository.deleteAll()
//        gameSubjectRepository.deleteAll()
//        gameRepository.deleteAll()
//        wordRepository.deleteAll()
//        subjectRepository.deleteAll()
//        userRepository.deleteAll()
//
//        // 2) 유저 생성
//        userService.createUser(UserAddRequest("Owner", "password"))
//        userService.createUser(UserAddRequest("Player2", "password"))
//        userService.createUser(UserAddRequest("Player3", "password"))
//        userService.createUser(UserAddRequest("admin", "password"))
//
//        // 3) admin 세션으로 주제/단어 생성
//        val admin = loginAndGetSession("admin", "password")
//
//        // 4) 주제 + 단어 6개 생성
//        val subjectId = createSubject(admin, subjectName)
//        listOf("고양이","개","토끼","사자","코끼리","기린").forEach {
//            createWord(admin, subjectName, it)
//        }
//
//        // 5) 승인 처리 + 재검증
//        approveSubjectAndWords(subjectId)
//        val approved = subjectRepository.findById(subjectId).orElseThrow()
//        val approvedWordCount = approved.word.count { it.status == ContentStatus.APPROVED }
//        require(approved.status == ContentStatus.APPROVED && approvedWordCount >= 5) {
//            "승인 데이터 준비 실패: status=${approved.status}, approvedWordCount=$approvedWordCount"
//        }
//
//        // 6) 플레이어 로그인 세션 생성
//        ownerSession = loginAndGetSession("Owner", "password")
//        player2Session = loginAndGetSession("Player2", "password")
//        player3Session = loginAndGetSession("Player3", "password")
//
//        Mockito.reset(simpMessagingTemplate)
//    }
//
//    @Test
//    fun `should_validate_setup_works`() {
//        // 간단한 설정 검증 테스트
//        println("Setup validation test started")
//        assertThat(ownerSession).isNotNull()
//        assertThat(player2Session).isNotNull()
//        assertThat(player3Session).isNotNull()
//
//        // 주제와 단어가 제대로 생성되었는지 확인
//        val subjects = subjectRepository.findAll()
//        println("Total subjects found: ${subjects.size}")
//        subjects.forEach { subject ->
//            println("Subject: ${subject.content}, Status: ${subject.status}, Words: ${subject.word.size}")
//        }
//
//        assertThat(subjects).isNotEmpty()
//        val approvedSubject = subjects.find { it.status == ContentStatus.APPROVED }
//        assertThat(approvedSubject).isNotNull()
//        assertThat(approvedSubject!!.word.count { it.status == ContentStatus.APPROVED }).isGreaterThanOrEqualTo(5)
//    }
//
//    @Test
//    fun `should_progress_through_entire_game_flow_when_following_happy_path`() {
//        // 1. 방 생성 및 3인 입장
//        val gameNumber = createGame(ownerSession, "Owner")
//        joinGame(player2Session, gameNumber, "Player2")
//        val initialState = joinGame(player3Session, gameNumber, "Player3")
//
//        ownerId = initialState.players.first { it.nickname == "Owner" }.id
//        player2Id = initialState.players.first { it.nickname == "Player2" }.id
//        player3Id = initialState.players.first { it.nickname == "Player3" }.id
//
//        // 2. 게임 시작
//        var gameState = startGame(ownerSession, gameNumber)
//        assertThat(gameState.gameState).isEqualTo(GameState.IN_PROGRESS)
//        assertThat(gameState.currentPhase).isEqualTo(GamePhase.SPEECH)
//        assertThat(gameState.turnOrder).isNotEmpty()
//
//        // 3. 힌트 제출 (턴 순서대로)
//        val sessions = mapOf(ownerId to ownerSession, player2Id to player2Session, player3Id to player3Session)
//        gameState.turnOrder!!.forEach { playerId ->
//            val playerSession = sessions[playerId.toLong()]!!
//            gameState = giveHint(playerSession, gameNumber, "힌트")
//        }
//        assertThat(gameState.currentPhase).isEqualTo(GamePhase.VOTING_FOR_LIAR)
//
//        // 4. 라이어 투표 (첫 두 플레이어가 세 번째 플레이어에게 투표)
//        val targetPlayerId = gameState.players[2].id
//        vote(ownerSession, gameNumber, targetPlayerId)
//        gameState = vote(player2Session, gameNumber, targetPlayerId)
//
//        assertThat(gameState.currentPhase).isEqualTo(GamePhase.DEFENDING)
//        assertThat(gameState.accusedPlayer?.id).isEqualTo(targetPlayerId)
//
//        // 5. 변론 제출 및 즉시 종료
//        val accusedSession = sessions[targetPlayerId]!!
//        submitDefense(accusedSession, gameNumber, "저는 라이어가 아닙니다.")
//        gameState = endDefense(accusedSession, gameNumber)
//
//        // 변론 종료 후 최종 투표 상태 초기화 확인
//        assertThat(gameState.currentPhase).isEqualTo(GamePhase.VOTING_FOR_SURVIVAL)
//
//        // 6. 최종 투표 중복 방지 테스트 포함
//        finalVote(ownerSession, gameNumber, true)
//        finalVote(player2Session, gameNumber, true)
//        gameState = finalVote(player3Session, gameNumber, true)
//
//        // 7. 라이어 추측 단계 확인
//        assertThat(gameState.currentPhase).isEqualTo(GamePhase.GUESSING_WORD)
//
//        // 8. 라이어 정답 추측 -> 라이어 승리
//        val liarGuessResponse = guessWord(accusedSession, gameNumber, "고양이")
//        assertThat(liarGuessResponse.isCorrect).isTrue()
//
//        val finalState = getGameState(ownerSession, gameNumber)
//        assertThat(finalState.gameState).isEqualTo(GameState.ENDED)
//
//        // WebSocket 브로드캐스트 검증
//        Mockito.verify(simpMessagingTemplate, Mockito.atLeastOnce()).convertAndSend(
//            Mockito.anyString(),
//            Mockito.any<Any>()
//        )
//    }
//
//    @Test
//    fun `should_throw_error_when_non_accused_player_tries_to_end_defense`() {
//        // 게임 준비 (DEFENDING 단계까지)
//        val gameNumber = setupGameToDefendingPhase()
//
//        // 피고발자가 아닌 플레이어가 변론 종료 시도 -> 400 에러
//        val response = mockMvc.perform(
//            post("/api/v1/game/defense/end")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(EndDefenseRequest(gameNumber)))
//                .session(ownerSession)
//        ).andExpect(status().isBadRequest()).andReturn()
//
//        val errorMessage = response.response.contentAsString
//        assertThat(errorMessage).contains("Only the accused player can end defense")
//    }
//
//    @Test
//    fun `should_throw_error_when_trying_to_end_defense_in_wrong_phase`() {
//        // 게임 준비 (SPEECH 단계)
//        val gameNumber = createGame(ownerSession, "Owner")
//        joinGame(player2Session, gameNumber, "Player2")
//        joinGame(player3Session, gameNumber, "Player3")
//
//        startGame(ownerSession, gameNumber)
//
//        // SPEECH 단계에서 변론 종료 시도 -> 400 에러
//        val response = mockMvc.perform(
//            post("/api/v1/game/defense/end")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(EndDefenseRequest(gameNumber)))
//                .session(ownerSession)
//        ).andExpect(status().isBadRequest()).andReturn()
//
//        val errorMessage = response.response.contentAsString
//        assertThat(errorMessage).contains("Defense can only be ended during DEFENDING phase")
//    }
//
//    @Test
//    fun `should_prevent_duplicate_final_voting_after_defense_end`() {
//        // 게임 준비 (VOTING_FOR_SURVIVAL 단계까지)
//        val gameNumber = setupGameToVotingForSurvival()
//
//        // 첫 번째 최종 투표 성공
//        finalVote(ownerSession, gameNumber, true)
//
//        // 동일 플레이어가 다시 투표 시도 -> 400 에러 (이미 투표했으므로)
//        val response = mockMvc.perform(
//            post("/api/v1/game/vote/final")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(FinalVotingRequest(gameNumber, false)))
//                .session(ownerSession)
//        ).andExpect(status().isBadRequest()).andReturn()
//
//        // 409가 아닌 400 에러가 나는 것이 정상 (중복 투표 방지)
//        val errorMessage = response.response.contentAsString
//        assertThat(errorMessage).contains("It's not the time for a final vote")
//    }
//
//    @Test
//    fun `should_not_throw_409_error_for_final_vote_after_defense_end`() {
//        // 변론 종료 후 최종 투표 상태 초기화가 제대로 되어 409 에러가 발생하지 않는지 검증
//        val gameNumber = setupGameToVotingForSurvival()
//
//        // 모든 플레이어가 최종 투표를 성공적으로 할 수 있어야 함
//        mockMvc.perform(
//            post("/api/v1/game/vote/final")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(FinalVotingRequest(gameNumber, true)))
//                .session(ownerSession)
//        ).andExpect(status().isOk())
//
//        mockMvc.perform(
//            post("/api/v1/game/vote/final")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(FinalVotingRequest(gameNumber, true)))
//                .session(player2Session)
//        ).andExpect(status().isOk())
//
//        mockMvc.perform(
//            post("/api/v1/game/vote/final")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(FinalVotingRequest(gameNumber, true)))
//                .session(player3Session)
//        ).andExpect(status().isOk())
//    }
//
//    @Test
//    fun `should_handle_tie_voting_scenario`() {
//        // 게임 준비
//        val gameNumber = createGame(ownerSession, "Owner")
//        joinGame(player2Session, gameNumber, "Player2")
//        val initialState = joinGame(player3Session, gameNumber, "Player3")
//
//        ownerId = initialState.players.first { it.nickname == "Owner" }.id
//        player2Id = initialState.players.first { it.nickname == "Player2" }.id
//        player3Id = initialState.players.first { it.nickname == "Player3" }.id
//
//        startGame(ownerSession, gameNumber)
//
//        // 힌트 제출
//        val gameState = getGameState(ownerSession, gameNumber)
//        gameState.turnOrder!!.forEach { playerId ->
//            val session = getSessionForPlayer(playerId.toLong())
//            giveHint(session, gameNumber, "힌트")
//        }
//
//        // 동점 투표 (각자 다른 사람에게 투표)
//        vote(ownerSession, gameNumber, player2Id)  // Owner -> Player2
//        vote(player2Session, gameNumber, player3Id)  // Player2 -> Player3
//        val voteResult = vote(player3Session, gameNumber, ownerId)  // Player3 -> Owner
//
//        // 동점 상황에서 랜덤으로 선택되어 DEFENDING 단계로 전환되어야 함
//        assertThat(voteResult.currentPhase).isEqualTo(GamePhase.DEFENDING)
//        assertThat(voteResult.accusedPlayer).isNotNull()
//    }
//
//    @Test
//    fun `should_handle_citizen_execution_leading_to_next_round`() {
//        // 시민이 처형되는 시나리오
//        val gameNumber = setupGameToVotingForSurvival()
//
//        // 시민 처형을 위한 투표 (과반수가 처형에 투표)
//        finalVote(ownerSession, gameNumber, true)
//        finalVote(player2Session, gameNumber, true)
//        val finalResult = finalVote(player3Session, gameNumber, true)
//
//        // 시민이 처형되면 다음 라운드로 가거나 게임 종료
//        assertThat(finalResult.gameState == GameState.ENDED || finalResult.currentPhase == GamePhase.SPEECH).isTrue()
//    }
//
//    @Test
//    fun `should_handle_liar_wrong_guess_leading_to_citizen_victory`() {
//        // 라이어가 틀린 추측을 하는 시나리오
//        val gameNumber = setupGameToGuessingWord()
//        val gameState = getGameState(ownerSession, gameNumber)
//        val accusedSession = getSessionForPlayer(gameState.accusedPlayer!!.id)
//
//        // 라이어가 틀린 단어 추측
//        val liarGuessResponse = guessWord(accusedSession, gameNumber, "잘못된답")
//        assertThat(liarGuessResponse.isCorrect).isFalse()
//
//        val finalState = getGameState(ownerSession, gameNumber)
//        assertThat(finalState.gameState).isEqualTo(GameState.ENDED)
//        assertThat(finalState.winner).isEqualTo("CITIZEN")
//    }
//
//    @Test
//    fun `should_handle_liar_correct_guess_leading_to_liar_victory`() {
//        // 라이어가 정답을 맞추는 시나리오
//        val gameNumber = setupGameToGuessingWord()
//        val gameState = getGameState(ownerSession, gameNumber)
//        val accusedSession = getSessionForPlayer(gameState.accusedPlayer!!.id)
//
//        // 라이어가 정답 추측 (일반적으로 동물 주제면 고양이 등)
//        val liarGuessResponse = guessWord(accusedSession, gameNumber, "고양이")
//        assertThat(liarGuessResponse.isCorrect).isTrue()
//
//        val finalState = getGameState(ownerSession, gameNumber)
//        assertThat(finalState.gameState).isEqualTo(GameState.ENDED)
//        assertThat(finalState.winner).isEqualTo("LIAR")
//    }
//
//    // Helper methods - Authentication and setup
//    private fun loginAndGetSession(nickname: String, password: String): MockHttpSession {
//        val preSession = MockHttpSession()
//        val result = mockMvc.perform(
//            post("/api/v1/auth/login")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(LoginRequest(nickname, password)))
//                .session(preSession)
//        ).andExpect(status().isOk())
//            .andReturn()
//
//        // 로그인 처리 중 새 세션이 발급될 수 있으므로 반환된 세션 사용
//        val session = result.request.session as MockHttpSession
//
//        // 세션에 인증 속성이 비어 있다면 테스트에서 직접 주입
//        val hasUserId = session.getAttribute("userId") as? Long
//        val hasNickname = session.getAttribute("nickname") as? String
//        if (hasUserId == null || hasNickname.isNullOrBlank()) {
//            val user = userRepository.findAll().find { it.nickname == nickname }
//                ?: throw IllegalArgumentException("User not found for nickname=$nickname")
//            session.setAttribute("userId", user.id)
//            session.setAttribute("nickname", user.nickname)
//        }
//
//        return session
//    }
//
//    private fun createSubject(session: MockHttpSession, name: String): Long {
//        Thread.sleep(100) // Rate limiting 방지를 위한 지연
//        val result = mockMvc.perform(
//            post("/api/v1/subjects/applysubj")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(SubjectRequest(name)))
//                .session(session)
//        ).andExpect(status().isOk()).andReturn()
//        return objectMapper.readTree(result.response.contentAsString).get("id").asLong()
//    }
//
//    private fun createWord(session: MockHttpSession, subject: String, word: String) {
//        try {
//            Thread.sleep(100) // 100ms 지연으로 rate limiting 방지
//            mockMvc.perform(
//                post("/api/v1/words/applyw")
//                    .contentType(MediaType.APPLICATION_JSON)
//                    .content(objectMapper.writeValueAsString(ApplyWordRequest(subject, word)))
//                    .session(session)
//            ).andExpect(status().isOk())
//        } catch (e: Exception) {
//            // Rate limiting 오류 시 재시도
//            Thread.sleep(200)
//            mockMvc.perform(
//                post("/api/v1/words/applyw")
//                    .contentType(MediaType.APPLICATION_JSON)
//                    .content(objectMapper.writeValueAsString(ApplyWordRequest(subject, word)))
//                    .session(session)
//            ).andExpect(status().isOk())
//        }
//    }
//
//    private fun approveSubjectAndWords(subjectId: Long) {
//        val subject = subjectRepository.findById(subjectId).orElseThrow()
//        subject.status = ContentStatus.APPROVED
//        subjectRepository.save(subject)
//        subject.word.forEach { w ->
//            w.status = ContentStatus.APPROVED
//            wordRepository.save(w)
//        }
//        wordRepository.flush()
//        subjectRepository.flush()
//    }
//
//    // Game flow helper methods
//    private fun createGame(session: MockHttpSession, nickname: String): Int {
//        return try {
//            val req = CreateGameRoomRequest(
//                nickname = null,
//                gameName = "테스트 게임",
//                gamePassword = null,
//                gameParticipants = 3,
//                gameTotalRounds = 3,
//                gameLiarCount = 1,
//                gameMode = GameMode.LIARS_KNOW,
//                subjectIds = null,          // 명시 지정하지 않음
//                useRandomSubjects = true,   // 랜덤 선택 경로
//                randomSubjectCount = 1
//            )
//            gameService.createGameRoom(req, session)
//        } catch (e: Exception) {
//            throw AssertionError("createGame (service) failed: ${e::class.simpleName}: ${e.message}", e)
//        }
//    }
//
//    private fun joinGame(session: MockHttpSession, gameNumber: Int, nickname: String): GameStateResponse {
//        val request = JoinGameRequest(gameNumber = gameNumber)
//        val mvcResult = mockMvc.perform(
//            post("/api/v1/game/join")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(request))
//                .session(session)
//        ).andReturn()
//        val status = mvcResult.response.status
//        val body = mvcResult.response.contentAsString
//        println("[TEST][joinGame] status=$status body=$body")
//        assertThat(status).withFailMessage("joinGame expected 200 but was $status body=$body").isEqualTo(200)
//        return objectMapper.readValue(body)
//    }
//
//    private fun startGame(session: MockHttpSession, gameNumber: Int): GameStateResponse {
//        val result = mockMvc.perform(
//            post("/api/v1/game/start")
//                .session(session)
//                .param("gameNumber", gameNumber.toString())
//        ).andExpect(status().isOk()).andReturn()
//        return objectMapper.readValue(result.response.contentAsString)
//    }
//
//    private fun giveHint(session: MockHttpSession, gameNumber: Int, hint: String): GameStateResponse {
//        val request = GiveHintRequest(gameNumber = gameNumber, hint = hint)
//        val result = mockMvc.perform(
//            post("/api/v1/game/hint")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(request))
//                .session(session)
//        ).andExpect(status().isOk()).andReturn()
//        return objectMapper.readValue(result.response.contentAsString)
//    }
//
//    private fun vote(session: MockHttpSession, gameNumber: Int, targetId: Long): GameStateResponse {
//        val request = VoteRequest(gameNumber = gameNumber, targetPlayerId = targetId)
//        val result = mockMvc.perform(
//            post("/api/v1/game/vote")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(request))
//                .session(session)
//        ).andExpect(status().isOk()).andReturn()
//        return objectMapper.readValue(result.response.contentAsString)
//    }
//
//    private fun submitDefense(session: MockHttpSession, gameNumber: Int, defense: String) {
//        val request = SubmitDefenseRequest(gameNumber, defense)
//        mockMvc.perform(
//            post("/api/v1/game/submit-defense")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(request))
//                .session(session)
//        ).andExpect(status().isOk())
//    }
//
//    private fun endDefense(session: MockHttpSession, gameNumber: Int): GameStateResponse {
//        val request = EndDefenseRequest(gameNumber)
//        val result = mockMvc.perform(
//            post("/api/v1/game/defense/end")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(request))
//                .session(session)
//        ).andExpect(status().isOk()).andReturn()
//        return objectMapper.readValue(result.response.contentAsString)
//    }
//
//    private fun finalVote(session: MockHttpSession, gameNumber: Int, vote: Boolean): GameStateResponse {
//        val request = FinalVotingRequest(gameNumber, vote)
//        val result = mockMvc.perform(
//            post("/api/v1/game/vote/final")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(request))
//                .session(session)
//        ).andExpect(status().isOk()).andReturn()
//        return objectMapper.readValue(result.response.contentAsString)
//    }
//
//    private fun guessWord(session: MockHttpSession, gameNumber: Int, word: String): LiarGuessResultResponse {
//        val request = GuessWordRequest(gameNumber, word)
//        val result = mockMvc.perform(
//            post("/api/v1/game/guess-word")
//                .contentType(MediaType.APPLICATION_JSON)
//                .content(objectMapper.writeValueAsString(request))
//                .session(session)
//        ).andExpect(status().isOk()).andReturn()
//        return objectMapper.readValue(result.response.contentAsString)
//    }
//
//    private fun getGameState(session: MockHttpSession, gameNumber: Int): GameStateResponse {
//        val result = mockMvc.perform(
//            get("/api/v1/game/{gameNumber}", gameNumber)
//                .session(session)
//        ).andExpect(status().isOk()).andReturn()
//        return objectMapper.readValue(result.response.contentAsString)
//    }
//
//    private fun setupGameToDefendingPhase(): Int {
//        val gameNumber = createGame(ownerSession, "Owner")
//        joinGame(player2Session, gameNumber, "Player2")
//        val initialState = joinGame(player3Session, gameNumber, "Player3")
//
//        ownerId = initialState.players.first { it.nickname == "Owner" }.id
//        player2Id = initialState.players.first { it.nickname == "Player2" }.id
//        player3Id = initialState.players.first { it.nickname == "Player3" }.id
//
//        startGame(ownerSession, gameNumber)
//
//        // 힌트 제출
//        val gameState = getGameState(ownerSession, gameNumber)
//        gameState.turnOrder!!.forEach { playerId ->
//            val session = getSessionForPlayer(playerId.toLong())
//            giveHint(session, gameNumber, "힌트")
//        }
//
//        // 투표로 DEFENDING 단계 진입
//        vote(ownerSession, gameNumber, player3Id)
//        vote(player2Session, gameNumber, player3Id)
//
//        return gameNumber
//    }
//
//    private fun setupGameToVotingForSurvival(): Int {
//        val gameNumber = setupGameToDefendingPhase()
//
//        // 변론 제출 및 종료
//        submitDefense(player3Session, gameNumber, "변론")
//        endDefense(player3Session, gameNumber)
//
//        return gameNumber
//    }
//
//    private fun setupGameToGuessingWord(): Int {
//        val gameNumber = setupGameToVotingForSurvival()
//
//        // 최종 투표로 처형
//        finalVote(ownerSession, gameNumber, true)
//        finalVote(player2Session, gameNumber, true)
//        finalVote(player3Session, gameNumber, true)
//
//        return gameNumber
//    }
//
//    private fun getSessionForPlayer(playerId: Long): MockHttpSession {
//        return when(playerId) {
//            ownerId -> ownerSession
//            player2Id -> player2Session
//            player3Id -> player3Session
//            else -> throw IllegalArgumentException("Unknown player ID: $playerId")
//        }
//    }
//}