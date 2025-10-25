package org.example.lineagew.application.service

import org.example.lineagew.application.dto.BossKillCreateRequest
import org.example.lineagew.application.dto.BossKillResponse
import org.example.lineagew.application.dto.toResponse
import org.example.lineagew.domain.boss.BossRepository
import org.example.lineagew.domain.bosskill.BossKill
import org.example.lineagew.domain.bosskill.BossKillRepository
import org.example.lineagew.domain.member.MemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BossKillService(
    private val bossRepository: BossRepository,
    private val memberRepository: MemberRepository,
    private val bossKillRepository: BossKillRepository
) {

    @Transactional
    fun createBossKill(request: BossKillCreateRequest): BossKillResponse {
        val boss = bossRepository.findById(request.bossId)
            .orElseThrow { IllegalArgumentException("Boss not found: ${request.bossId}") }

        val participants = request.participants.map { payload ->
            val member = memberRepository.findById(payload.memberId)
                .orElseThrow { IllegalArgumentException("Member not found: ${payload.memberId}") }
            member.markActive(request.killedAt.toLocalDate())
            Triple(member, payload.baseWeight, payload.attendance)
        }

        val bossKill = BossKill(
            boss = boss,
            killedAt = request.killedAt,
            notes = request.notes
        )

        participants.forEach { (member, weight, attendance) ->
            bossKill.addParticipant(member, weight, attendance)
        }

        val saved = bossKillRepository.save(bossKill)
        return saved.toResponse()
    }

    @Transactional(readOnly = true)
    fun findRecent(limit: Int = 50): List<BossKillResponse> = bossKillRepository.findAll()
        .sortedByDescending { it.killedAt }
        .take(limit)
        .map { it.toResponse() }
}
