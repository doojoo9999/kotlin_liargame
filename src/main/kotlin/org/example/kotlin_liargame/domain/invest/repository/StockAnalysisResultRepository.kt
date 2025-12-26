package org.example.kotlin_liargame.domain.invest.repository

import org.example.kotlin_liargame.domain.invest.model.StockAnalysisResultEntity
import org.springframework.data.jpa.repository.JpaRepository

interface StockAnalysisResultRepository : JpaRepository<StockAnalysisResultEntity, Long> {
    fun findTopByAssetIdOrderByCreatedAtDesc(assetId: Long): StockAnalysisResultEntity?
}
