package org.example.kotlin_liargame.domain.profanity.dto.response

import org.example.kotlin_liargame.domain.profanity.model.ProfanityRequestEntity
import java.time.LocalDateTime

data class ProfanityRequestResponse(
    val id: Long,
    val word: String,
    val suggesterName: String,
    val status: String,
    val createdAt: LocalDateTime
) {
    constructor(profanityRequest: ProfanityRequestEntity) : this(
        id = profanityRequest.id,
        word = profanityRequest.word,
        suggesterName = profanityRequest.suggester.nickname,
        status = profanityRequest.status.name,
        createdAt = profanityRequest.createdAt
    )
}
