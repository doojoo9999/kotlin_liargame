package org.example.kotlin_liargame.domain.invest.service

import java.time.LocalDateTime
import org.example.kotlin_liargame.domain.invest.exception.PriceDataUnavailableException
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.domain.invest.repository.AssetRepository
import org.example.kotlin_liargame.domain.invest.repository.StockAnalysisResultRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class PriceWatcherService(
    private val assetRepository: AssetRepository,
    private val analysisRepository: StockAnalysisResultRepository,
    private val marketPriceService: MarketPriceService,
    private val marketStatusService: MarketStatusService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    suspend fun checkTargetsAndStops() {
        val openMarkets = mutableListOf<MarketType>()
        if (marketStatusService.isKrMarketOpen()) {
            openMarkets.add(MarketType.KR)
        }
        if (marketStatusService.isUsMarketOpen()) {
            openMarkets.add(MarketType.US)
        }
        if (openMarkets.isEmpty()) {
            return
        }

        val assets = assetRepository.findByMarketTypeIn(openMarkets)
        for (asset in assets) {
            val analysis = analysisRepository.findTopByAssetIdOrderByCreatedAtDesc(asset.id) ?: continue
            try {
                val currentPrice = marketPriceService.getLatestPrice(asset.stockCode, asset.marketType)
                val now = LocalDateTime.now()
                var updated = false
                if (analysis.targetHitAt == null && currentPrice >= analysis.targetPrice) {
                    analysis.targetHitAt = now
                    updated = true
                }
                if (analysis.stopLossHitAt == null && currentPrice <= analysis.stopLoss) {
                    analysis.stopLossHitAt = now
                    updated = true
                }
                if (updated) {
                    analysisRepository.save(analysis)
                }
            } catch (ex: PriceDataUnavailableException) {
                logger.warn("Price unavailable for ${asset.stockCode} (${asset.marketType})")
            } catch (ex: Exception) {
                logger.error("Price watcher error for ${asset.stockCode}: ${ex.message}", ex)
            }
        }
    }
}
