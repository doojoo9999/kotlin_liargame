package org.example.kotlin_liargame.domain.question.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.global.base.BaseEntity
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

@Entity
@Table(name = "question", uniqueConstraints = [UniqueConstraint(columnNames = ["subject_id", "content"])])
class QuestionEntity (

    val content : String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    var subject: SubjectEntity ?= null,

//    val createdUser: String
) : BaseEntity() {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    val id: Long = 0
}
