package org.example.kotlin_liargame.domain.nemonemo.V1.model

import jakarta.persistence.Column
import jakarta.persistence.Entity
import jakarta.persistence.EnumType
import jakarta.persistence.Enumerated
import jakarta.persistence.FetchType
import jakarta.persistence.GeneratedValue
import jakarta.persistence.GenerationType
import jakarta.persistence.Id
import jakarta.persistence.JoinColumn
import jakarta.persistence.ManyToOne
import jakarta.persistence.Table

@Entity
@Table(name = "nemonemo_puzzle_hint")
class NemonemoPuzzleHintEntity(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "puzzle_id", nullable = false)
    val puzzle: NemonemoPuzzleEntity,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    val axis: HintAxis,

    @Column(name = "position_index", nullable = false)
    val positionIndex: Int,

    @Column(name = "hint_values", columnDefinition = "TEXT", nullable = false)
    val hintValues: String
) {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
