package org.example.kotlin_liargame.domain.word.dto.request

import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.domain.word.model.WordEntity

data class ApplyWordRequest(
    val subject: String,
    val word: String
) {
    fun to(subjectEntity: SubjectEntity) = WordEntity(
        content = this.word,
        subject = subjectEntity
    )
}
