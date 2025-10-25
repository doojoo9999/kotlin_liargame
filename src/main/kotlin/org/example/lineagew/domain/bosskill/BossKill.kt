package org.example.lineagew.domain.bosskill

import jakarta.persistence.*
import org.example.lineagew.common.LineagewBaseEntity
import org.example.lineagew.domain.boss.Boss
import org.example.lineagew.domain.member.Member
import java.math.BigDecimal
import java.time.LocalDateTime

@Entity
@Table(name = "linw_boss_kills")
class BossKill(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boss_id", nullable = false)
    var boss: Boss,

    @Column(name = "killed_at", nullable = false)
    var killedAt: LocalDateTime,

    @Column(columnDefinition = "text")
    var notes: String? = null
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null

    @OneToMany(mappedBy = "bossKill", cascade = [CascadeType.ALL], orphanRemoval = true)
    val participants: MutableList<BossKillParticipant> = mutableListOf()

    fun addParticipant(member: Member, baseWeight: BigDecimal = BigDecimal.ONE, attendance: Boolean = true) {
        val participant = BossKillParticipant(
            bossKill = this,
            member = member,
            baseWeight = baseWeight,
            attendanceFlag = attendance
        )
        participants.add(participant)
    }
}

@Entity
@Table(
    name = "linw_boss_kill_participants",
    uniqueConstraints = [UniqueConstraint(columnNames = ["boss_kill_id", "member_id"])]
)
class BossKillParticipant(
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "boss_kill_id", nullable = false)
    var bossKill: BossKill,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_id", nullable = false)
    var member: Member,

    @Column(name = "base_weight", nullable = false, precision = 12, scale = 4)
    var baseWeight: BigDecimal = BigDecimal.ONE,

    @Column(name = "attendance_flag", nullable = false)
    var attendanceFlag: Boolean = true
) : LineagewBaseEntity() {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
}
