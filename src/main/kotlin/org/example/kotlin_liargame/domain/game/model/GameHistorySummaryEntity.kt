package org.example.kotlin_liargame.domain.game.model

import jakarta.persistence.*
import org.example.kotlin_liargame.domain.game.model.enum.GameMode
import org.example.kotlin_liargame.domain.game.model.enum.WinningTeam
import org.example.kotlin_liargame.global.base.BaseEntity

@Entity
@Table(name = "game_history")
class GameHistorySummaryEntity(
    @Column(nullable = false)
    val gameNumber: Int,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val gameMode: GameMode,

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "game_history_players", joinColumns = [JoinColumn(name = "game_history_id")])
    @Column(name = "player_nickname")
    val participants: Set<String>,

    @Column(nullable = false)
    val liarNickname: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val winningTeam: WinningTeam,

    @Column(nullable = false)
    val gameRounds: Int

) : BaseEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0
}
