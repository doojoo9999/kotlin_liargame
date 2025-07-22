package org.example.kotlin_liargame.domain.question.model

import jakarta.persistence.Entity
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table
import jakarta.persistence.UniqueConstraint
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity

@Entity
@Table(name = "question", uniqueConstraints = [UniqueConstraint(columnNames = ["subject_id", "content"])])
class QuestionEntity (

    val content : String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    var subject: SubjectEntity ?= null
) {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    val id: Long = 0
}
