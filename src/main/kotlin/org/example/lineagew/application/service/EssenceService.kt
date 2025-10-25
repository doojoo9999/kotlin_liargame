package org.example.lineagew.application.service

import org.example.lineagew.application.dto.*
import org.example.lineagew.domain.essence.Essence
import org.example.lineagew.domain.essence.EssenceRepository
import org.example.lineagew.domain.essence.EssenceTxn
import org.example.lineagew.domain.essence.EssenceTxnRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class EssenceService(
    private val essenceRepository: EssenceRepository,
    private val essenceTxnRepository: EssenceTxnRepository
) {

    @Transactional
    fun upsertEssence(request: EssenceRequest): EssenceResponse {
        val essence = essenceRepository.findByNameIgnoreCase(request.name)?.apply {
            memo = request.memo
        } ?: Essence(
            name = request.name.trim(),
            memo = request.memo
        )
        val saved = essenceRepository.save(essence)
        val txns = essenceTxnRepository.findAllByEssenceIdOrderByOccurredAtDesc(saved.id!!)
        return saved.toResponse(txns)
    }

    @Transactional
    fun appendTransaction(essenceId: Long, request: EssenceTxnRequest): EssenceResponse {
        val essence = essenceRepository.findById(essenceId)
            .orElseThrow { IllegalArgumentException("Essence not found: $essenceId") }
        val delta = if (request.increase) request.deltaQty else -request.deltaQty
        essence.apply(delta)
        val txn = EssenceTxn(
            essence = essence,
            occurredAt = request.occurredAt,
            deltaQty = delta,
            reason = request.reason,
            memo = request.memo
        )
        essenceTxnRepository.save(txn)
        val txns = essenceTxnRepository.findAllByEssenceIdOrderByOccurredAtDesc(essence.id!!)
        return essence.toResponse(txns)
    }

    @Transactional(readOnly = true)
    fun listEssences(): List<EssenceResponse> = essenceRepository.findAll()
        .sortedBy { it.name.lowercase() }
        .map { essence ->
            val txns = essenceTxnRepository.findAllByEssenceIdOrderByOccurredAtDesc(essence.id!!)
            essence.toResponse(txns)
        }
}
