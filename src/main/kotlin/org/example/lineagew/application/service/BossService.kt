package org.example.lineagew.application.service

import org.example.lineagew.application.dto.BossRequest
import org.example.lineagew.application.dto.BossResponse
import org.example.lineagew.application.dto.toResponse
import org.example.lineagew.domain.boss.Boss
import org.example.lineagew.domain.boss.BossRepository
import org.example.lineagew.domain.boss.exception.DuplicateBossException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class BossService(
    private val bossRepository: BossRepository
) {

    @Transactional(readOnly = true)
    fun getBosses(): List<BossResponse> = bossRepository.findAll()
        .sortedBy { it.name.lowercase() }
        .map { it.toResponse() }

    @Transactional
    fun createBoss(request: BossRequest): BossResponse {
        val normalizedName = request.name.trim()

        bossRepository.findByNameIgnoreCase(normalizedName).ifPresent {
            throw DuplicateBossException(normalizedName)
        }
        val boss = Boss(
            name = normalizedName,
            tier = request.tier,
            memo = request.memo
        )
        return bossRepository.save(boss).toResponse()
    }

    @Transactional
    fun updateBoss(id: Long, request: BossRequest): BossResponse {
        val boss = bossRepository.findById(id).orElseThrow { IllegalArgumentException("Boss not found: $id") }
        val normalizedName = request.name.trim()

        bossRepository.findByNameIgnoreCase(normalizedName).ifPresent { existing ->
            if (existing.id != boss.id) {
                throw DuplicateBossException(normalizedName)
            }
        }

        boss.name = normalizedName
        boss.tier = request.tier
        boss.memo = request.memo
        return boss.toResponse()
    }

    @Transactional
    fun deleteBoss(id: Long) {
        val boss = bossRepository.findById(id).orElseThrow { IllegalArgumentException("Boss not found: $id") }
        bossRepository.delete(boss)
    }
}
