package org.example.kotlin_liargame.domain.subject.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.word.model.WordEntity
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "subject")
class SubjectEntity (
    val content : String,

    @OneToMany(mappedBy = "subject", cascade = [CascadeType.ALL], orphanRemoval = true, fetch = FetchType.EAGER)
    val word: List<WordEntity>,

//    val createdUser: String
) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}