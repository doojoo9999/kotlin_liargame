package org.example.kotlin_liargame.domain.question.dto

import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import javax.security.auth.Subject

data class ApplyQuestionRequest(
    val subject: String,
    val question: String
) {
    fun to() = QuestionEntity(
        question = this.question
    )
}
