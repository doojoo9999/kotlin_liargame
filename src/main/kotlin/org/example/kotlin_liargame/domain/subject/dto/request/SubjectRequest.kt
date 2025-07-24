package org.example.kotlin_liargame.domain.subject.dto.request

import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

data class SubjectRequest(
    val content: String
) {
    fun to() = SubjectEntity(
        content = this.content,
        word = emptyList()
    )
}
