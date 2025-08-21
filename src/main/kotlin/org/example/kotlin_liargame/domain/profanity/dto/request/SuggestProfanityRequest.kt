package org.example.kotlin_liargame.domain.profanity.dto.request

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size

data class SuggestProfanityRequest(
    @field:NotBlank(message = "단어는 비워둘 수 없습니다.")
    @field:Size(min = 2, max = 20, message = "단어는 2자 이상 20자 이하이어야 합니다.")
    val word: String
)
