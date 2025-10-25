package org.example.lineagew.application.service

import org.example.lineagew.domain.audit.IdempotencyKey
import org.example.lineagew.domain.audit.IdempotencyKeyRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class IdempotencyService(
    private val idempotencyKeyRepository: IdempotencyKeyRepository
) {

    @Transactional(readOnly = true)
    fun exists(key: String): Boolean = idempotencyKeyRepository.findByIdempotencyKey(key) != null

    @Transactional
    fun register(key: String, endpoint: String) {
        if (exists(key)) return
        idempotencyKeyRepository.save(IdempotencyKey(idempotencyKey = key, endpoint = endpoint))
    }
}
