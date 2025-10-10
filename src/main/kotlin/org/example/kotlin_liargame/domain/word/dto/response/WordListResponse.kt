package org.example.kotlin_liargame.domain.word.dto.response

import org.example.kotlin_liargame.domain.subject.model.enum.ContentStatus
import org.example.kotlin_liargame.domain.word.model.WordEntity

data class WordListResponse(
    val id: Long,
    val subjectId: Long,
    val subjectContent: String,
    val content: String,
    val status: ContentStatus,
) {
    companion object {
        fun from(wordEntity: WordEntity): WordListResponse {
            return WordListResponse(
                id = wordEntity.id,
                subjectId = wordEntity.subject?.id ?: 0L,
                subjectContent = wordEntity.subject?.content ?: "N/A",
                content = wordEntity.content,
                status = wordEntity.status,
            )
        }
    }
}
