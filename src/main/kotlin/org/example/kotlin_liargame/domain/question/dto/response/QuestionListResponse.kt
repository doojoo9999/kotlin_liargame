package org.example.kotlin_liargame.domain.question.dto.response

import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

data class QuestionListResponse(
    val id: Long,
    val subjectContent: String,
    val questionContent: String,
) {
    companion object {
        fun from(questionEntity: QuestionEntity): QuestionListResponse {
            return QuestionListResponse(
                id = questionEntity.id,
                subjectContent = questionEntity.subject?.content ?: "N/A",
                questionContent = questionEntity.question,
            )
        }
    }
}