package org.example.kotlin_liargame.domain.nemonemo.V1.repository

import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoSessionEntity
import org.example.kotlin_liargame.domain.nemonemo.model.NemonemoSessionSnapshotEntity
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface NemonemoSessionSnapshotRepository : JpaRepository<NemonemoSessionSnapshotEntity, Long> {
    fun findTopBySessionOrderByCapturedAtDesc(session: NemonemoSessionEntity): NemonemoSessionSnapshotEntity?
}
