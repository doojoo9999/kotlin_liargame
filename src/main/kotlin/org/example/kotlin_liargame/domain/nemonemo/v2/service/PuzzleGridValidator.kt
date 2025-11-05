package org.example.kotlin_liargame.domain.nemonemo.v2.service

import org.example.kotlin_liargame.domain.nemonemo.v2.dto.PuzzleCreateRequest
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.server.ResponseStatusException

@Component
class PuzzleGridValidator {

    fun sanitize(request: PuzzleCreateRequest): List<String> {
        val width = request.width
        val height = request.height

        if (width !in MIN_SIZE..MAX_SIZE || height !in MIN_SIZE..MAX_SIZE) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "퍼즐 크기는 ${MIN_SIZE}~${MAX_SIZE} 범위여야 합니다."
            )
        }

        if (request.grid.size != height) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "그리드 행 수가 지정된 높이와 일치하지 않습니다."
            )
        }

        val sanitized = request.grid.mapIndexed { rowIndex, row ->
            val trimmed = row.trim()
            if (trimmed.length != width) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "${rowIndex + 1}번째 행의 길이가 지정된 너비와 일치하지 않습니다."
                )
            }
            if (!ROW_PATTERN.matches(trimmed)) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "퍼즐 그리드는 '#' 또는 '.' 문자만 사용할 수 있습니다."
                )
            }
            trimmed
        }

        if (request.tags.size > MAX_TAG_COUNT) {
            throw ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "태그는 최대 ${MAX_TAG_COUNT}개까지 지정할 수 있습니다."
            )
        }

        request.tags.forEach { tag ->
            if (tag.length > MAX_TAG_LENGTH) {
                throw ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "태그 '${tag}' 의 길이가 ${MAX_TAG_LENGTH}자를 초과했습니다."
                )
            }
        }

        return sanitized
    }

    companion object {
        private const val MIN_SIZE = 5
        private const val MAX_SIZE = 50
        private const val MAX_TAG_COUNT = 10
        private const val MAX_TAG_LENGTH = 32
        private val ROW_PATTERN = Regex("^[#.]+$")
    }
}

