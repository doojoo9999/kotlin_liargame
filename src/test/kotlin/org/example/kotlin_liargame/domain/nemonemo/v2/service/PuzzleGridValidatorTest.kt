package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleContentStyle
import org.example.kotlin_liargame.domain.nemonemo.v2.model.PuzzleMode
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.assertThrows
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import org.junit.jupiter.api.Test
import org.springframework.web.server.ResponseStatusException

class PuzzleGridValidatorTest {

    private val validator = PuzzleGridValidator()

    @Test
    fun `sanitize rejects grid with too few filled cells`() {
        val request = baseRequest(grid = List(10) { ".".repeat(10) })
        val exception = assertThrows<ResponseStatusException> {
            validator.sanitize(request)
        }
        assertEquals("퍼즐에는 최소 5% 이상 채워진 셀이 필요합니다.", exception.reason)
    }

    @Test
    fun `sanitize rejects grid with isolated cell`() {
        val grid = List(5) { "....." }.toMutableList().apply {
            this[0] = "###.."
            this[1] = "###.."
            this[2] = "....#"
        }
        val exception = assertThrows<ResponseStatusException> {
            validator.sanitize(baseRequest(width = 5, height = 5, grid = grid))
        }
        assertEquals("고립된 채움 셀이 감지되었습니다. 주변 셀과 연결되도록 조정해주세요.", exception.reason)
    }

    @ParameterizedTest
    @ValueSource(ints = [4, 51])
    fun `sanitize enforces size constraints`(size: Int) {
        val grid = List(size.coerceAtLeast(1)) { "#".repeat(size.coerceAtLeast(1)) }
        val request = baseRequest(width = size, height = size, grid = grid)
        assertThrows<ResponseStatusException> {
            validator.sanitize(request)
        }
    }

    private fun baseRequest(
        title: String = "Test",
        width: Int = 10,
        height: Int = 10,
        grid: List<String> = List(height) { "#".repeat(width) }
    ): PuzzleCreateRequest = PuzzleCreateRequest(
        title = title,
        description = null,
        width = width,
        height = height,
        grid = grid,
        tags = emptyList(),
        seriesId = null,
        contentStyle = PuzzleContentStyle.GENERIC_PIXEL
    )
}
