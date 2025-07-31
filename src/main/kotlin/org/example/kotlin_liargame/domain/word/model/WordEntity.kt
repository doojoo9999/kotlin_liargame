package org.example.kotlin_liargame.domain.word.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.subject.model.SubjectEntity
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "word", uniqueConstraints = [UniqueConstraint(columnNames = ["subject_id", "content"])])
class WordEntity (

    val content : String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    var subject: SubjectEntity ?= null,
) : BaseEntity() {
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Id
    val id: Long = 0
}

