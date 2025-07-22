package org.example.kotlin_liargame.domain.subject.dto.response

import org.example.kotlin_liargame.domain.question.model.QuestionEntity
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

data class SubjectResponse(
    val id: Long,
    val content: String,
    val questionIds: List<Long>,
){
    companion object{
        fun from(subjectEntity: SubjectEntity) : SubjectResponse{
            return SubjectResponse(
                id = subjectEntity.id,
                content = subjectEntity.content,
                questionIds = subjectEntity.question.map { it.id }
            )
        }
    }
}