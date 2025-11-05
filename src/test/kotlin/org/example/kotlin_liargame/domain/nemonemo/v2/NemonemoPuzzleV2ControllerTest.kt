package org.example.kotlin_liargame.domain.nemonemo.v2

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.transaction.Transactional
import org.example.kotlin_liargame.domain.nemonemo.service.PuzzleValidationService
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleReviewRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleReviewDecision
import org.example.kotlin_liargame.domain.nemonemo.v2.model.DailyPickEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreEntity
import org.example.kotlin_liargame.domain.nemonemo.v2.model.ScoreId
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.DailyPickRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleHintRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleSolutionRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PlayRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.ScoreRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.service.PuzzleApplicationService
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.assertEquals
import org.springframework.beans.factory.annotation.Autowired
import com.opentable.db.postgres.embedded.EmbeddedPostgres
import org.hamcrest.Matchers.hasItem
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.AfterEach
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.MediaType
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
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
    private val objectMapper: ObjectMapper
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
            header("X-Subject-Key", SUBJECT_KEY.toString())
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
            with {
                val session = requireNotNull(it.getSession(true))
                session.setAttribute(SubjectPrincipalResolver.SUBJECT_SESSION_ATTRIBUTE, guestPrincipal())
                it.setAttribute(SubjectPrincipalResolver.REQUEST_ATTRIBUTE, guestPrincipal())
                it.addHeader("X-Subject-Key", SUBJECT_KEY.toString())
                it
            }
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
            with {
                val session = requireNotNull(it.getSession(true))
                session.setAttribute(SubjectPrincipalResolver.SUBJECT_SESSION_ATTRIBUTE, guestPrincipal())
                it.setAttribute(SubjectPrincipalResolver.REQUEST_ATTRIBUTE, guestPrincipal())
                it.addHeader("X-Subject-Key", SUBJECT_KEY.toString())
                it
            }
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
}
