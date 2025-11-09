package org.example.kotlin_liargame.domain.nemonemo.v2

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.transaction.Transactional
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationService
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleReviewRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleAuditAction
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleReviewDecision
import org.example.kotlin_liargame.domain.nemonemo.v2.model.DailyPickEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreId
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.DailyPickRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleAuditLogRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleHintRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleSolutionRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PlayRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.service.PuzzleApplicationService
import org.example.kotlin_liargame.domain.nemonemo.v2.controller.NemonemoPuzzleV2Controller
import org.example.kotlin_liargame.global.security.SessionDataManager
import org.example.kotlin_liargame.global.security.UserSessionData
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.springframework.beans.factory.annotation.Autowired
import com.opentable.db.postgres.embedded.EmbeddedPostgres
import org.hamcrest.Matchers.hasItem
import org.hamcrest.Matchers.hasItems
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.AfterEach
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import org.springframework.test.web.servlet.request.RequestPostProcessor
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders
import org.springframework.test.web.servlet.setup.MockMvcBuilders
import org.springframework.core.MethodParameter
import org.springframework.web.bind.support.WebDataBinderFactory
import org.springframework.web.context.request.NativeWebRequest
import org.springframework.web.method.support.HandlerMethodArgumentResolver
import org.springframework.web.method.support.ModelAndViewContainer
import org.example.kotlin_liargame.global.security.RequireSubject
import org.springframework.test.web.servlet.result.MockMvcResultMatchers
import java.time.Instant
import java.time.LocalDate
import java.util.UUID
import org.example.kotlin_liargame.global.security.SubjectPrincipal
import org.example.kotlin_liargame.global.security.SubjectPrincipalResolver
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.assertThrows

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NemonemoPuzzleV2ControllerTest @Autowired constructor(
    private val mockMvc: MockMvc,
    private val puzzleApplicationService: PuzzleApplicationService,
    private val puzzleValidationService: PuzzleValidationService,
    private val puzzleRepository: PuzzleRepository,
    private val puzzleHintRepository: PuzzleHintRepository,
    private val puzzleSolutionRepository: PuzzleSolutionRepository,
    private val playRepository: PlayRepository,
    private val dailyPickRepository: DailyPickRepository,
    private val scoreRepository: ScoreRepository,
    private val puzzleAuditLogRepository: PuzzleAuditLogRepository,
    private val objectMapper: ObjectMapper,
    private val sessionDataManager: SessionDataManager,
    private val puzzleController: NemonemoPuzzleV2Controller
) {

    companion object {
        private val SUBJECT_KEY: UUID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")

        private val embeddedPostgres: EmbeddedPostgres = EmbeddedPostgres.builder().setPort(0).start()

        @JvmStatic
        @DynamicPropertySource
        fun registerProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url") { embeddedPostgres.getJdbcUrl("postgres", "postgres") }
            registry.add("spring.datasource.username") { "postgres" }
            registry.add("spring.datasource.password") { "postgres" }
            registry.add("spring.datasource.driver-class-name") { "org.postgresql.Driver" }
            registry.add("spring.jpa.hibernate.ddl-auto") { "create-drop" }
            registry.add("spring.jpa.properties.hibernate.dialect") { "org.hibernate.dialect.PostgreSQLDialect" }
            registry.add("spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation") { "true" }
        }

        @JvmStatic
        @AfterAll
        fun shutdown() {
            embeddedPostgres.close()
        }
    }

    private val fixtureGrid = listOf(
        "###..",
        "#..#.",
        "##.#.",
        ".#..#",
        "..###"
    )

    private val solverTestGrid = listOf(
        "#..#.",
        ".##..",
        "..###",
        ".##..",
        "#..#."
    )

    private val duplicateTestGrid = listOf(
        "##..#",
        "#..##",
        ".###.",
        "#..##",
        "##..#"
    )

    private lateinit var puzzleId: UUID

    @BeforeEach
    fun setupFixture() {
        cleanup()
        ensureUniqueSolution("fixtureGrid", fixtureGrid)
        ensureUniqueSolution("solverTestGrid", solverTestGrid)
        ensureUniqueSolution("duplicateTestGrid", duplicateTestGrid)

        val request = PuzzleCreateRequest(
            title = "Integration Puzzle",
            description = "API integration test puzzle",
            width = 5,
            height = 5,
            grid = fixtureGrid,
            tags = listOf("integration"),
            seriesId = null,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )

        val created = try {
            puzzleApplicationService.createPuzzle(request, SUBJECT_KEY)
        } catch (ex: org.springframework.web.server.ResponseStatusException) {
            println("[TEST] puzzle setup failed: status=${ex.statusCode} reason=${ex.reason}")
            throw ex
        }
        val puzzle = puzzleRepository.findById(created.puzzleId).orElseThrow().apply {
            status = PuzzleStatus.APPROVED
            playCount = 12
            clearCount = 4
        }
        puzzleRepository.save(puzzle)

        val score = ScoreEntity(
            id = ScoreId(
                puzzleId = puzzle.id,
                subjectKey = SUBJECT_KEY,
                mode = PuzzleMode.NORMAL
            ),
            bestTimeMs = 165000,
            bestScore = 1875,
            perfectClear = true
        ).apply {
            lastPlayedAt = Instant.now()
        }
        scoreRepository.save(score)

        puzzleId = puzzle.id
    }

    @AfterEach
    fun cleanup() {
        scoreRepository.deleteAll()
        playRepository.deleteAll()
        dailyPickRepository.deleteAll()
        puzzleAuditLogRepository.deleteAll()
        puzzleSolutionRepository.deleteAll()
        puzzleHintRepository.deleteAll()
        puzzleRepository.deleteAll()
    }

    private fun adminPrincipal() = SubjectPrincipal(
        subjectKey = SUBJECT_KEY,
        userId = 1L,
        roles = setOf("ROLE_SUBJECT", "ROLE_ADMIN")
    )

    private fun guestPrincipal() = SubjectPrincipal(
        subjectKey = SUBJECT_KEY,
        userId = null,
        roles = setOf("ROLE_SUBJECT", "ROLE_GUEST")
    )

    private fun asGuest(): RequestPostProcessor = attachPrincipal(guestPrincipal())

    private fun attachPrincipal(principal: SubjectPrincipal): RequestPostProcessor = RequestPostProcessor { request ->
        val session = requireNotNull(request.getSession(true))
        principal.userId?.let { userId ->
            sessionDataManager.setUserSession(
                session,
                UserSessionData(
                    userId = userId,
                    nickname = "member"
                )
            )
        }
        session.setAttribute(SubjectPrincipalResolver.SUBJECT_SESSION_ATTRIBUTE, principal)
        request.setAttribute(SubjectPrincipalResolver.REQUEST_ATTRIBUTE, principal)
        request.addHeader("X-Subject-Key", principal.subjectKey.toString())
        request
    }

    private fun createAdminMockMvc(principal: SubjectPrincipal): MockMvc =
        MockMvcBuilders.standaloneSetup(puzzleController)
            .setCustomArgumentResolvers(object : HandlerMethodArgumentResolver {
                override fun supportsParameter(parameter: MethodParameter): Boolean {
                    return parameter.hasParameterAnnotation(RequireSubject::class.java) &&
                        SubjectPrincipal::class.java.isAssignableFrom(parameter.parameterType)
                }

                override fun resolveArgument(
                    parameter: MethodParameter,
                    mavContainer: org.springframework.web.method.support.ModelAndViewContainer?,
                    webRequest: org.springframework.web.context.request.NativeWebRequest,
                    binderFactory: org.springframework.web.bind.support.WebDataBinderFactory?
                ): Any = principal
            })
            .setMessageConverters(MappingJackson2HttpMessageConverter(objectMapper))
            .build()

    private fun ensureUniqueSolution(label: String, grid: List<String>) {
        val parsed = puzzleValidationService.parseSolutionPayload(grid)
        val validation = puzzleValidationService.validateSolution(parsed)
        require(validation.solver.uniqueSolution) {
            "Test grid '$label' must yield a unique solution for reliable assertions."
        }
    }

    private fun createDraftPuzzle(title: String = "Draft Puzzle"): UUID {
        val request = PuzzleCreateRequest(
            title = title,
            description = "검수 테스트용 퍼즐",
            width = 5,
            height = 5,
            grid = solverTestGrid,
            tags = listOf("draft"),
            seriesId = null,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )
        return puzzleApplicationService.createPuzzle(request, SUBJECT_KEY).puzzleId
    }

    private fun approveDraft(puzzleId: UUID) {
        puzzleApplicationService.reviewPuzzle(
            puzzleId = puzzleId,
            reviewerKey = SUBJECT_KEY,
            request = PuzzleReviewRequest(
                decision = PuzzleReviewDecision.APPROVE,
                reviewNotes = "자동 승인",
                rejectionReason = null
            )
        )
    }

    private fun promoteOfficial(puzzleId: UUID, notes: String? = "승격 완료") {
        puzzleApplicationService.promoteToOfficial(
            puzzleId = puzzleId,
            reviewerKey = SUBJECT_KEY,
            request = org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(notes = notes)
        )
    }

    @Test
    fun `list puzzles returns approved entries`() {
        mockMvc.get("/api/v2/nemonemo/puzzles") {
            param("status", "APPROVED")
        }
            .andExpect {
                status { isOk() }
                jsonPath("$.items[*].id", hasItem(puzzleId.toString()))
                jsonPath("$.items[0].difficultyCategory") { isNotEmpty() }
            }
    }

    @Test
    fun `puzzle detail exposes hints and statistics`() {
        mockMvc.get("/api/v2/nemonemo/puzzles/{id}", puzzleId)
            .andExpect {
                status { isOk() }
                jsonPath("$.id") { value(puzzleId.toString()) }
                jsonPath("$.hints.rows") { isArray() }
                jsonPath("$.statistics.playCount") { value(12) }
            }
    }

    @Test
    fun `daily picks endpoint resolves configured puzzles`() {
        mockMvc.get("/api/v2/nemonemo/daily-picks")
            .andExpect {
                status { isOk() }
                jsonPath("$.items[*].id", hasItem(puzzleId.toString()))
                jsonPath("$.date") { exists() }
            }
    }

    @Test
    fun `start play creates session with state token`() {
        mockMvc.post("/api/v2/nemonemo/puzzles/{id}/plays", puzzleId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = """{"mode":"NORMAL"}"""
            with(csrf())
        }
            .andExpect {
                status { isOk() }
                jsonPath("$.playId") { exists() }
                jsonPath("$.stateToken") { isNotEmpty() }
            }
    }

    @Test
    fun `play snapshot and submit updates score`() {
        val startResponse = mockMvc.post("/api/v2/nemonemo/puzzles/{id}/plays", puzzleId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = """{"mode":"NORMAL"}"""
            with(csrf())
        }.andExpect {
            status { isOk() }
        }.andReturn()

        val playId = UUID.fromString(objectMapper.readTree(startResponse.response.contentAsString).get("playId").asText())

        mockMvc.patch("/api/v2/nemonemo/plays/{id}/snapshot", playId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = objectMapper.writeValueAsString(
                mapOf(
                    "snapshot" to mapOf("cells" to listOf(mapOf("x" to 0, "y" to 0, "value" to 1))),
                    "mistakes" to 0,
                    "undoCount" to 1,
                    "usedHints" to 0
                )
            )
            with(csrf())
        }.andExpect {
            status { isNoContent() }
        }

        mockMvc.get("/api/v2/nemonemo/plays/{id}", playId) {
            with(asGuest())
        }.andExpect {
            status { isOk() }
            jsonPath("$.playId") { value(playId.toString()) }
            jsonPath("$.snapshot.cells") { isArray() }
        }

        mockMvc.post("/api/v2/nemonemo/plays/{id}/submit", playId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = objectMapper.writeValueAsString(
                mapOf(
                    "solution" to fixtureGrid,
                    "elapsedMs" to 120_000,
                    "mistakes" to 0,
                    "usedHints" to 0,
                    "undoCount" to 1,
                    "comboCount" to 3
                )
            )
            with(csrf())
        }.andExpect {
            status { isOk() }
            jsonPath("$.score") { isNumber() }
            jsonPath("$.perfectClear") { value(true) }
        }

        val updatedPuzzle = puzzleRepository.findById(puzzleId).orElseThrow()
        assertEquals(13, updatedPuzzle.playCount)
        assertEquals(5, updatedPuzzle.clearCount)
        val scoreId = ScoreId(puzzleId, SUBJECT_KEY, PuzzleMode.NORMAL)
        assertTrue(scoreRepository.findById(scoreId).isPresent)
    }

    @Test
    fun `submit rejects incorrect solution with 422`() {
        val start = mockMvc.post("/api/v2/nemonemo/puzzles/{id}/plays", puzzleId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = """{"mode":"NORMAL"}"""
        }.andReturn()

        val playId = UUID.fromString(objectMapper.readTree(start.response.contentAsString).get("playId").asText())
        val originalPuzzle = puzzleRepository.findById(puzzleId).orElseThrow()
        val originalScore = scoreRepository.findById(ScoreId(puzzleId, SUBJECT_KEY, PuzzleMode.NORMAL)).orElseThrow()

        mockMvc.post("/api/v2/nemonemo/plays/{id}/submit", playId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = objectMapper.writeValueAsString(
                mapOf(
                    "solution" to fixtureGrid.mapIndexed { idx, row ->
                        if (idx == 0) row.replaceRange(0, 1, ".") else row
                    },
                    "elapsedMs" to 90_000,
                    "mistakes" to 0,
                    "usedHints" to 0,
                    "undoCount" to 0,
                    "comboCount" to 0
                )
            )
        }.andExpect {
            status { isUnprocessableEntity() }
        }

        val puzzle = puzzleRepository.findById(puzzleId).orElseThrow()
        assertEquals(originalPuzzle.playCount, puzzle.playCount)
        assertEquals(originalPuzzle.clearCount, puzzle.clearCount)
        val scoreId = ScoreId(puzzleId, SUBJECT_KEY, PuzzleMode.NORMAL)
        val persistedScore = scoreRepository.findById(scoreId).orElseThrow()
        assertEquals(originalScore.bestScore, persistedScore.bestScore)
    }

    @Test
    fun `submit twice returns conflict`() {
        val start = mockMvc.post("/api/v2/nemonemo/puzzles/{id}/plays", puzzleId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = """{"mode":"NORMAL"}"""
        }.andReturn()

        val playId = UUID.fromString(objectMapper.readTree(start.response.contentAsString).get("playId").asText())

        val payload = objectMapper.writeValueAsString(
            mapOf(
                "solution" to fixtureGrid,
                "elapsedMs" to 180_000,
                "mistakes" to 1,
                "usedHints" to 0,
                "undoCount" to 0,
                "comboCount" to 2
            )
        )

        mockMvc.post("/api/v2/nemonemo/plays/{id}/submit", playId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = payload
        }.andExpect {
            status { isOk() }
        }

        mockMvc.post("/api/v2/nemonemo/plays/{id}/submit", playId) {
            contentType = MediaType.APPLICATION_JSON
            with(asGuest())
            content = payload
        }.andExpect {
            status { isConflict() }
        }
    }

    @Test
    fun `puzzle leaderboard exposes aggregated scores`() {
        mockMvc.get("/api/v2/nemonemo/puzzles/{id}/leaderboard", puzzleId)
            .andExpect {
                status { isOk() }
                jsonPath("$.entries[0].score") { value(1875) }
                jsonPath("$.entries[0].perfect") { value(true) }
            }
    }

    @Test
    @Transactional
    fun `create puzzle persists solver metadata`() {
        val request = PuzzleCreateRequest(
            title = "Solver Driven",
            description = "유일해 검증 퍼즐",
            width = 5,
            height = 5,
            grid = solverTestGrid,
            tags = listOf("custom"),
            seriesId = null,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )

        val mvcResult = mockMvc.post("/api/v2/nemonemo/puzzles") {
            contentType = MediaType.APPLICATION_JSON
            header("X-Subject-Key", SUBJECT_KEY.toString())
            content = objectMapper.writeValueAsString(request)
        }
            .andExpect {
                status { isCreated() }
                jsonPath("$.metadata.tags") { isArray() }
                jsonPath("$.metadata.tags", hasItems("custom", "small", "sparse"))
                jsonPath("$.metadata.uniqueness") { value(true) }
                jsonPath("$.metadata.difficultyScore") { isNumber() }
                jsonPath("$.metadata.solvingTimeEstimateMs") { isNumber() }
            }
            .andReturn()

        val validation = puzzleValidationService.validateSolution(
            puzzleValidationService.parseSolutionPayload(request.grid)
        )
        println("[TEST] solver unique=${validation.solver.uniqueSolution} solutions=${validation.solver.solutionsFound}")

        val createdId = UUID.fromString(
            objectMapper.readTree(mvcResult.response.contentAsString).get("puzzleId").asText()
        )
        val storedPuzzle = puzzleRepository.findById(createdId).orElseThrow()
        val storedHints = puzzleHintRepository.findById(createdId).orElse(null)
        val storedSolution = puzzleSolutionRepository.findById(createdId).orElse(null)

        println("[TEST] stored tags=${storedPuzzle.tags}")
        assertEquals(true, storedPuzzle.uniquenessFlag)
        assertEquals(25, storedPuzzle.width * storedPuzzle.height)
        assertEquals(true, storedPuzzle.tags.contains("custom"))
        assertEquals(true, storedPuzzle.tags.any { it == "dense" || it == "sparse" })
        assertEquals(1, storedHints?.version)
        assertEquals(true, storedSolution?.checksum?.isNotBlank())
    }

    @Test
    fun `create puzzle rejects duplicate checksum`() {
        val request = PuzzleCreateRequest(
            title = "Duplicate",
            description = null,
            width = 5,
            height = 5,
            grid = duplicateTestGrid,
            tags = emptyList(),
            seriesId = null,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )

        mockMvc.post("/api/v2/nemonemo/puzzles") {
            contentType = MediaType.APPLICATION_JSON
            header("X-Subject-Key", SUBJECT_KEY.toString())
            content = objectMapper.writeValueAsString(request)
        }.andExpect { status { isCreated() } }

        mockMvc.post("/api/v2/nemonemo/puzzles") {
            contentType = MediaType.APPLICATION_JSON
            header("X-Subject-Key", SUBJECT_KEY.toString())
            content = objectMapper.writeValueAsString(request.copy(title = "Duplicate 2"))
        }.andExpect { status { isConflict() } }
    }

    @Test
    fun `create puzzle rejects malformed grid`() {
        val request = PuzzleCreateRequest(
            title = "Invalid grid",
            description = null,
            width = 5,
            height = 5,
            grid = listOf(
                "#",
                "#",
                "#",
                "#",
                "#"
            ),
            tags = emptyList(),
            seriesId = null,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )

        mockMvc.post("/api/v2/nemonemo/puzzles") {
            contentType = MediaType.APPLICATION_JSON
            header("X-Subject-Key", SUBJECT_KEY.toString())
            content = objectMapper.writeValueAsString(request)
        }.andExpect { status { isBadRequest() } }
    }

    @Test
    fun `non admin review is forbidden`() {
        val draftId = createDraftPuzzle("Forbidden Review")

        mockMvc.post("/api/v2/nemonemo/puzzles/{id}/review", draftId) {
            with(asGuest())
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(
                PuzzleReviewRequest(
                    decision = PuzzleReviewDecision.APPROVE,
                    reviewNotes = null,
                    rejectionReason = null
                )
            )
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `review puzzle approve updates metadata`() {
        val draftId = createDraftPuzzle("Service Approve")

        val response = puzzleApplicationService.reviewPuzzle(
            puzzleId = draftId,
            reviewerKey = SUBJECT_KEY,
            request = PuzzleReviewRequest(
                decision = PuzzleReviewDecision.APPROVE,
                reviewNotes = "검수 통과",
                rejectionReason = null
            )
        )

        assertEquals(PuzzleStatus.APPROVED, response.status)
        assertEquals("검수 통과", response.reviewNotes)
        assertEquals(SUBJECT_KEY, response.reviewerKey)
        assertNotNull(response.reviewedAt)
    }

    @Test
    fun `review puzzle reject requires reason`() {
        val draftId = createDraftPuzzle("Missing Reason Service")

        val exception = assertThrows<org.springframework.web.server.ResponseStatusException> {
            puzzleApplicationService.reviewPuzzle(
                puzzleId = draftId,
                reviewerKey = SUBJECT_KEY,
                request = PuzzleReviewRequest(
                    decision = PuzzleReviewDecision.REJECT,
                    reviewNotes = null,
                    rejectionReason = null
                )
            )
        }

        assertEquals(org.springframework.http.HttpStatus.BAD_REQUEST, exception.statusCode)
    }

    @Test
    fun `promote to official requires admin`() {
        val draftId = createDraftPuzzle("Official Forbidden")
        approveDraft(draftId)

        mockMvc.post("/api/v2/nemonemo/puzzles/{id}/official", draftId) {
            with(asGuest())
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(
                org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(
                    notes = "승격 요청"
                )
            )
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `promote to official updates status`() {
        val draftId = createDraftPuzzle("Official Approved")
        approveDraft(draftId)

        val response = puzzleApplicationService.promoteToOfficial(
            puzzleId = draftId,
            reviewerKey = SUBJECT_KEY,
            request = org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(notes = "승격 완료")
        )

        assertEquals(PuzzleStatus.OFFICIAL, response.status)
        assertEquals("승격 완료", response.reviewNotes)
    }

    @Test
    fun `promote to official requires approval`() {
        val draftId = createDraftPuzzle("Official Conflict")

        val exception = assertThrows<org.springframework.web.server.ResponseStatusException> {
            puzzleApplicationService.promoteToOfficial(
                puzzleId = draftId,
                reviewerKey = SUBJECT_KEY,
                request = org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(notes = null)
            )
        }
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, exception.statusCode)
    }

    @Test
    fun `revoke official requires admin`() {
        val draftId = createDraftPuzzle("Revoke Forbidden")
        approveDraft(draftId)
        promoteOfficial(draftId)

        mockMvc.post("/api/v2/nemonemo/puzzles/{id}/official/revoke", draftId) {
            with(asGuest())
            contentType = MediaType.APPLICATION_JSON
            content = objectMapper.writeValueAsString(
                org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(notes = "철회 요청")
            )
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `revoke official transitions to approved`() {
        val draftId = createDraftPuzzle("Revoke Success")
        approveDraft(draftId)
        promoteOfficial(draftId, notes = "승격 완료")

        val response = puzzleApplicationService.revokeOfficial(
            puzzleId = draftId,
            reviewerKey = SUBJECT_KEY,
            request = org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(notes = "철회됨")
        )

        assertEquals(PuzzleStatus.APPROVED, response.status)
        assertEquals("철회됨", response.reviewNotes)
        val entity = puzzleRepository.findById(draftId).orElseThrow()
        assertEquals(PuzzleStatus.APPROVED, entity.status)
        assertNull(entity.officialAt)
    }

    @Test
    fun `revoke official requires official status`() {
        val draftId = createDraftPuzzle("Revoke Conflict")
        approveDraft(draftId)

        val exception = assertThrows<org.springframework.web.server.ResponseStatusException> {
            puzzleApplicationService.revokeOfficial(
                puzzleId = draftId,
                reviewerKey = SUBJECT_KEY,
                request = org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(notes = null)
            )
        }
        assertEquals(org.springframework.http.HttpStatus.CONFLICT, exception.statusCode)
    }

    @Test
    fun `approve review writes puzzle audit log`() {
        val draftId = createDraftPuzzle("Audit Review")
        approveDraft(draftId)

        val logs = puzzleAuditLogRepository.findByPuzzleIdOrderByCreatedAtAsc(draftId)
        assertEquals(1, logs.size)
        val log = logs.first()
        assertEquals(PuzzleAuditAction.REVIEW_APPROVE, log.action)
        val payload = log.payload?.let(objectMapper::readTree)
        assertEquals("APPROVED", payload?.get("status")?.asText())
    }

    @Test
    fun `official actions emit audit logs`() {
        val draftId = createDraftPuzzle("Audit Official Flow")
        approveDraft(draftId)
        puzzleApplicationService.promoteToOfficial(
            puzzleId = draftId,
            reviewerKey = SUBJECT_KEY,
            request = org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(notes = "승격 감사")
        )
        puzzleApplicationService.revokeOfficial(
            puzzleId = draftId,
            reviewerKey = SUBJECT_KEY,
            request = org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(notes = "철회 감사")
        )

        val actions = puzzleAuditLogRepository.findByPuzzleIdOrderByCreatedAtAsc(draftId)
            .map { it.action }
        assertEquals(
            listOf(
                PuzzleAuditAction.REVIEW_APPROVE,
                PuzzleAuditAction.OFFICIAL_PROMOTE,
                PuzzleAuditAction.OFFICIAL_REVOKE
            ),
            actions
        )
    }

    @Test
    fun `get review queue returns drafts`() {
        val draftId = createDraftPuzzle("Queue Candidate")
        val queue = puzzleApplicationService.getReviewQueue(10)
        val ids = queue.map { it.id }
        assertTrue(ids.contains(draftId))
    }

    @Test
    fun `non admin cannot fetch review queue`() {
        createDraftPuzzle("Queue Forbidden")

        mockMvc.get("/api/v2/nemonemo/admin/puzzles/review-queue") {
            with(asGuest())
        }.andExpect {
            status { isForbidden() }
        }
    }

    @Test
    fun `admin review queue endpoint returns drafts`() {
        val draftId = createDraftPuzzle("Queue Admin")
        val adminPrincipal = adminPrincipal()
        val mvcResult = createAdminMockMvc(adminPrincipal).perform(
            MockMvcRequestBuilders
                .get("/api/v2/nemonemo/admin/puzzles/review-queue")
                .param("limit", "5")
        ).andReturn()

        val queueStatus = mvcResult.response.status
        val queueBody = mvcResult.response.contentAsString
        val resolvedPrincipal = mvcResult.request.getAttribute(SubjectPrincipalResolver.REQUEST_ATTRIBUTE) as? SubjectPrincipal
        assertEquals(200, queueStatus, "Queue status=$queueStatus body=$queueBody roles=${resolvedPrincipal?.roles}")

        val nodes = objectMapper.readTree(queueBody)
        assertTrue(nodes.any { it.get("id").asText() == draftId.toString() }, "Queue response: $queueBody")
    }

    @Test
    fun `admin audit endpoint exposes audit trail`() {
        val draftId = createDraftPuzzle("Audit API")
        puzzleApplicationService.reviewPuzzle(
            puzzleId = draftId,
            reviewerKey = SUBJECT_KEY,
            request = PuzzleReviewRequest(
                decision = PuzzleReviewDecision.APPROVE,
                reviewNotes = "OK",
                rejectionReason = null
            )
        )

        val adminPrincipal = adminPrincipal()

        val auditResult = createAdminMockMvc(adminPrincipal).perform(
            MockMvcRequestBuilders
                .get("/api/v2/nemonemo/admin/puzzles/{id}/audits", draftId)
        ).andReturn()

        val auditStatus = auditResult.response.status
        val resolvedAuditPrincipal = auditResult.request.getAttribute(SubjectPrincipalResolver.REQUEST_ATTRIBUTE) as? SubjectPrincipal
        assertEquals(200, auditStatus, "Audit status=$auditStatus body=${auditResult.response.contentAsString} roles=${resolvedAuditPrincipal?.roles}")

        val auditBody = auditResult.response.contentAsString
        val auditRoot = objectMapper.readTree(auditBody)
        assertTrue(auditRoot.has("items"), "Audit response missing items: $auditBody")
        val firstItem = auditRoot.path("items").first()
        assertEquals("REVIEW_APPROVE", firstItem.get("action").asText(), "Audit response: $auditBody")
        assertEquals("APPROVED", firstItem.path("payload").path("status").asText(), "Audit response: $auditBody")
        assertEquals(SUBJECT_KEY.toString(), firstItem.get("actorKey").asText(), "Audit response: $auditBody")
        assertTrue(auditRoot.path("nextCursor").isMissingNode || auditRoot.path("nextCursor").isNull,
            "Audit response should not have next cursor: $auditBody")
    }

    @Test
    fun `admin audit endpoint supports cursor pagination`() {
        val draftId = createDraftPuzzle("Audit Cursor")
        puzzleApplicationService.reviewPuzzle(
            puzzleId = draftId,
            reviewerKey = SUBJECT_KEY,
            request = PuzzleReviewRequest(
                decision = PuzzleReviewDecision.APPROVE,
                reviewNotes = "OK",
                rejectionReason = null
            )
        )
        puzzleApplicationService.promoteToOfficial(
            puzzleId = draftId,
            reviewerKey = SUBJECT_KEY,
            request = org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest("승격")
        )

        val adminPrincipal = adminPrincipal()
        val client = createAdminMockMvc(adminPrincipal)

        val firstPage = client.perform(
            MockMvcRequestBuilders
                .get("/api/v2/nemonemo/admin/puzzles/{id}/audits", draftId)
                .param("limit", "1")
        ).andReturn()

        val firstBody = objectMapper.readTree(firstPage.response.contentAsString)
        assertEquals(1, firstBody.path("items").size(), "First page should contain one item: $firstBody")
        val nextCursor = firstBody.path("nextCursor").asText()
        assertTrue(nextCursor.isNotBlank(), "Next cursor expected: $firstBody")

        val secondPage = client.perform(
            MockMvcRequestBuilders
                .get("/api/v2/nemonemo/admin/puzzles/{id}/audits", draftId)
                .param("cursor", nextCursor)
        ).andReturn()

        val secondBody = objectMapper.readTree(secondPage.response.contentAsString)
        assertEquals(1, secondBody.path("items").size(), "Second page should contain one item: $secondBody")
        assertTrue(secondBody.path("nextCursor").isMissingNode || secondBody.path("nextCursor").isNull,
            "No next cursor expected on last page: $secondBody")
    }

    @Test
    fun `admin controller review approves puzzle`() {
        val draftId = createDraftPuzzle("Controller Approve")
        val adminPrincipal = adminPrincipal()

        createAdminMockMvc(adminPrincipal)
            .perform(
                MockMvcRequestBuilders
                    .post("/api/v2/nemonemo/puzzles/{id}/review", draftId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsBytes(
                            PuzzleReviewRequest(
                                decision = PuzzleReviewDecision.APPROVE,
                                reviewNotes = "controller",
                                rejectionReason = null
                            )
                        )
                    )
            )
            .andExpect(MockMvcResultMatchers.status().isOk)

        val entity = puzzleRepository.findById(draftId).orElseThrow()
        assertEquals(PuzzleStatus.APPROVED, entity.status)
        assertEquals("controller", entity.reviewNotes)
    }

    @Test
    fun `admin controller promote sets official`() {
        val draftId = createDraftPuzzle("Controller Promote")
        approveDraft(draftId)
        val adminPrincipal = adminPrincipal()

        createAdminMockMvc(adminPrincipal)
            .perform(
                MockMvcRequestBuilders
                    .post("/api/v2/nemonemo/puzzles/{id}/official", draftId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsBytes(
                            org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(
                                notes = "승격 controller"
                            )
                        )
                    )
            )
            .andExpect(MockMvcResultMatchers.status().isOk)

        val entity = puzzleRepository.findById(draftId).orElseThrow()
        assertEquals(PuzzleStatus.OFFICIAL, entity.status)
        assertEquals("승격 controller", entity.reviewNotes)
    }

    @Test
    fun `admin controller revoke returns to approved`() {
        val draftId = createDraftPuzzle("Controller Revoke")
        approveDraft(draftId)
        promoteOfficial(draftId, notes = "승격 controller")
        val adminPrincipal = adminPrincipal()

        createAdminMockMvc(adminPrincipal)
            .perform(
                MockMvcRequestBuilders
                    .post("/api/v2/nemonemo/puzzles/{id}/official/revoke", draftId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsBytes(
                            org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(
                                notes = "철회 controller"
                            )
                        )
                    )
            )
            .andExpect(MockMvcResultMatchers.status().isOk)

        val entity = puzzleRepository.findById(draftId).orElseThrow()
        assertEquals(PuzzleStatus.APPROVED, entity.status)
        assertEquals("철회 controller", entity.reviewNotes)
        assertNull(entity.officialAt)
    }

    @Test
    fun `admin controller promote rejects draft without audit`() {
        val draftId = createDraftPuzzle("Controller Promote Conflict")
        val adminPrincipal = adminPrincipal()

        assertTrue(puzzleAuditLogRepository.findByPuzzleIdOrderByCreatedAtAsc(draftId).isEmpty())

        createAdminMockMvc(adminPrincipal)
            .perform(
                MockMvcRequestBuilders
                    .post("/api/v2/nemonemo/puzzles/{id}/official", draftId)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(
                        objectMapper.writeValueAsBytes(
                            org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleOfficialRequest(
                                notes = "invalid promote"
                            )
                        )
                    )
            )
            .andExpect(MockMvcResultMatchers.status().isConflict)

        assertTrue(puzzleAuditLogRepository.findByPuzzleIdOrderByCreatedAtAsc(draftId).isEmpty())
    }
}
