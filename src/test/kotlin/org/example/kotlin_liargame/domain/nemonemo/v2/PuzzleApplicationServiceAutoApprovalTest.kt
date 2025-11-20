package org.example.kotlin_liargame.domain.nemonemo.v2

import com.opentable.db.postgres.embedded.EmbeddedPostgres
import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleStatus
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleHintRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.repository.PuzzleSolutionRepository
import org.example.kotlin_liargame.domain.nemonemo.v2.service.PuzzleApplicationService
import org.junit.jupiter.api.AfterAll
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.context.DynamicPropertyRegistry
import org.springframework.test.context.DynamicPropertySource
import java.util.UUID

@SpringBootTest(properties = ["app.content.manual-approval-required=false"])
@ActiveProfiles("test")
class PuzzleApplicationServiceAutoApprovalTest @Autowired constructor(
    private val puzzleApplicationService: PuzzleApplicationService,
    private val puzzleRepository: PuzzleRepository,
    private val puzzleHintRepository: PuzzleHintRepository,
    private val puzzleSolutionRepository: PuzzleSolutionRepository
) {

    companion object {
        private val embeddedPostgres: EmbeddedPostgres = EmbeddedPostgres.builder().setPort(0).start()

        @JvmStatic
        @DynamicPropertySource
        fun registerProperties(registry: DynamicPropertyRegistry) {
            registry.add("spring.datasource.url") { embeddedPostgres.getJdbcUrl("postgres", "postgres") }
            registry.add("spring.datasource.username") { "postgres" }
            registry.add("spring.datasource.password") { "postgres" }
            registry.add("spring.datasource.driver-class-name") { "org.postgresql.Driver" }
            // Avoid drop-on-close to prevent shutdown errors when embedded PG is already closed
            registry.add("spring.jpa.hibernate.ddl-auto") { "create" }
            registry.add("spring.jpa.properties.hibernate.dialect") { "org.hibernate.dialect.PostgreSQLDialect" }
            registry.add("spring.jpa.properties.hibernate.jdbc.lob.non_contextual_creation") { "true" }
        }

        @JvmStatic
        @AfterAll
        fun shutdown() {
            embeddedPostgres.close()
        }
    }

    private val authorKey: UUID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
    private val fixtureGrid = listOf(
        "###..",
        "#..#.",
        "##.#.",
        ".#..#",
        "..###"
    )

    @AfterEach
    fun cleanup() {
        puzzleSolutionRepository.deleteAll()
        puzzleHintRepository.deleteAll()
        puzzleRepository.deleteAll()
    }

    @Test
    fun `create puzzle auto approves when manual gate disabled`() {
        val request = PuzzleCreateRequest(
            title = "Auto approved puzzle",
            description = "Playwright fixture",
            width = 5,
            height = 5,
            grid = fixtureGrid,
            tags = listOf("auto"),
            seriesId = null,
            contentStyle = PuzzleContentStyle.GENERIC_PIXEL
        )

        val response = puzzleApplicationService.createPuzzle(request, authorKey)

        assertEquals(PuzzleStatus.APPROVED, response.status)

        val persisted = puzzleRepository.findById(response.puzzleId).orElseThrow()
        assertEquals(PuzzleStatus.APPROVED, persisted.status)
        assertNotNull(persisted.approvedAt)
    }
}
