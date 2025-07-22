package org.example.kotlin_liargame.domain.question.dto.response

import org.example.kotlin_liargame.domain.question.model.QuestionEntity

data class QuestionListResponse(
    val id: Long,
    val subjectContent: String,
    val content: String,
) {
    companion object {
        fun from(questionEntity: QuestionEntity): QuestionListResponse {
            return QuestionListResponse(
                id = questionEntity.id,
                subjectContent = questionEntity.subject?.content ?: "N/A",
                content = questionEntity.content,
            )
        }
    }
}