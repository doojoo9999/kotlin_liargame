package org.example.lineagew.domain.bosskill

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.LocalDateTime

interface BossKillRepository : JpaRepository<BossKill, Long> {

    @Query(
        "select bkp from BossKillParticipant bkp " +
            "where bkp.member.id = :memberId " +
            "and bkp.attendanceFlag = true " +
            "and bkp.bossKill.killedAt between :from and :to"
    )
    fun findParticipantsWithinWindow(
        @Param("memberId") memberId: Long,
        @Param("from") from: LocalDateTime,
        @Param("to") to: LocalDateTime
    ): List<BossKillParticipant>

    @Query(
        "select bkp from BossKillParticipant bkp " +
            "join fetch bkp.bossKill bk " +
            "join fetch bkp.member m " +
            "where bkp.attendanceFlag = true " +
            "and bk.killedAt between :from and :to"
    )
    fun findAllAttendanceBetween(
        @Param("from") from: LocalDateTime,
        @Param("to") to: LocalDateTime
    ): List<BossKillParticipant>
}
