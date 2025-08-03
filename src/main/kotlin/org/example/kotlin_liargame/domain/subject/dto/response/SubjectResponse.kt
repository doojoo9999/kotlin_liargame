package org.example.kotlin_liargame.domain.subject.dto.response

import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

data class SubjectResponse(
    val id: Long,
    val name: String,
    val wordIds: List<Long>,
){
    companion object{
        fun from(subjectEntity: SubjectEntity) : SubjectResponse{
            return SubjectResponse(
                id = subjectEntity.id,
                name = subjectEntity.content,
                wordIds = subjectEntity.word.map { it.id }
            )
        }
    }
}
