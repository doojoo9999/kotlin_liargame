package org.example.kotlin_liargame.domain.word.dto.response

import org.example.kotlin_liargame.domain.word.model.WordEntity

data class WordListResponse(
    val id: Long,
    val subjectContent: String,
    val content: String,
) {
    companion object {
        fun from(wordEntity: WordEntity): WordListResponse {
            return WordListResponse(
                id = wordEntity.id,
                subjectContent = wordEntity.subject?.content ?: "N/A",
                content = wordEntity.content,
            )
        }
    }
}