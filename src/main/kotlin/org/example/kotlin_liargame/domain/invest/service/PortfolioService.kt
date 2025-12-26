package org.example.kotlin_liargame.domain.invest.service

import jakarta.transaction.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDateTime
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import org.example.kotlin_liargame.domain.invest.dto.AssetPerformance
import org.example.kotlin_liargame.domain.invest.dto.TradeRequest
import org.example.kotlin_liargame.domain.invest.exception.PriceDataUnavailableException
import org.example.kotlin_liargame.domain.invest.model.AssetEntity
import org.example.kotlin_liargame.domain.invest.model.PortfolioEntity
import org.example.kotlin_liargame.domain.invest.model.TradeHistoryEntity
import org.example.kotlin_liargame.domain.invest.model.enum.Currency
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.domain.invest.model.enum.TradeType
import org.example.kotlin_liargame.domain.invest.repository.AssetRepository
import org.example.kotlin_liargame.domain.invest.repository.PortfolioRepository
import org.example.kotlin_liargame.domain.invest.repository.TradeHistoryRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class PortfolioService(
    private val portfolioRepository: PortfolioRepository,
    private val assetRepository: AssetRepository,
    private val tradeHistoryRepository: TradeHistoryRepository,
    private val marketPriceService: MarketPriceService,
    private val currencyService: CurrencyService
) {
    private val logger = LoggerFactory.getLogger(this::class.java)

    @Transactional
    fun recordTrade(request: TradeRequest): AssetEntity {
        validateTradeRequest(request)

        val portfolio = portfolioRepository.findById(request.portfolioId)
            .orElseThrow { IllegalArgumentException("Portfolio not found: ${request.portfolioId}") }

        val scaledPrice = FinancialMath.scalePrice(request.tradePrice)
        val scaledQuantity = FinancialMath.scaleQuantity(request.quantity)

        val asset = assetRepository.findByPortfolioIdAndStockCodeAndMarketType(
            portfolioId = request.portfolioId,
            stockCode = request.stockCode,
            marketType = request.marketType
        )

        val updatedAsset = when (request.tradeType) {
            TradeType.BUY -> applyBuyTrade(portfolio, asset, request.stockCode, request.marketType, scaledPrice, scaledQuantity)
            TradeType.SELL -> applySellTrade(asset, scaledQuantity)
        }

        val tradedAt = request.tradedAt ?: LocalDateTime.now()
        tradeHistoryRepository.save(
            TradeHistoryEntity(
                portfolio = portfolio,
                stockCode = request.stockCode,
                marketType = request.marketType,
                tradeType = request.tradeType,
                tradePrice = scaledPrice,
                quantity = scaledQuantity,
                tradedAt = tradedAt
            )
        )

        return updatedAsset
    }

    suspend fun calculateAssetPerformance(portfolioId: Long, baseCurrency: Currency = Currency.KRW): List<AssetPerformance> {
        val assets = assetRepository.findByPortfolioId(portfolioId)
        if (assets.isEmpty()) {
            return emptyList()
        }

        return coroutineScope {
            assets.map { asset ->
                async { buildAssetPerformance(asset, baseCurrency) }
            }.map { it.await() }
        }
    }

    suspend fun calculatePortfolioValue(portfolio: PortfolioEntity, baseCurrency: Currency = Currency.KRW): BigDecimal {
        val assets = assetRepository.findByPortfolioId(portfolio.id)
        var total = BigDecimal.ZERO
        for (asset in assets) {
            val currentPrice = marketPriceService.getLatestPrice(asset.stockCode, asset.marketType)
            val positionValue = FinancialMath.scalePrice(currentPrice.multiply(asset.quantity, FinancialMath.MATH_CONTEXT))
            val converted = if (asset.marketType.currency == baseCurrency) {
                positionValue
            } else {
                currencyService.convert(positionValue, asset.marketType.currency, baseCurrency)
            }
            total = total.add(converted)
        }
        return FinancialMath.scalePrice(total)
    }

    private fun applyBuyTrade(
        portfolio: PortfolioEntity,
        existingAsset: AssetEntity?,
        stockCode: String,
        marketType: MarketType,
        price: BigDecimal,
        quantity: BigDecimal
    ): AssetEntity {
        return if (existingAsset == null) {
            assetRepository.save(
                AssetEntity(
                    portfolio = portfolio,
                    stockCode = stockCode,
                    marketType = marketType,
                    averagePrice = price,
                    quantity = quantity
                )
            )
        } else {
            val totalCost = existingAsset.averagePrice.multiply(existingAsset.quantity, FinancialMath.MATH_CONTEXT)
                .add(price.multiply(quantity, FinancialMath.MATH_CONTEXT))
            val newQuantity = existingAsset.quantity.add(quantity)
            val newAverage = totalCost.divide(newQuantity, FinancialMath.PRICE_SCALE, RoundingMode.HALF_UP)

            existingAsset.averagePrice = FinancialMath.scalePrice(newAverage)
            existingAsset.quantity = FinancialMath.scaleQuantity(newQuantity)

            assetRepository.save(existingAsset)
        }
    }

    private fun applySellTrade(existingAsset: AssetEntity?, quantity: BigDecimal): AssetEntity {
        if (existingAsset == null) {
            throw IllegalArgumentException("Cannot sell asset that does not exist")
        }
        val newQuantity = existingAsset.quantity.subtract(quantity)
        if (newQuantity < BigDecimal.ZERO) {
            throw IllegalArgumentException("Sell quantity exceeds available holdings")
        }
        return if (newQuantity.compareTo(BigDecimal.ZERO) == 0) {
            assetRepository.delete(existingAsset)
            existingAsset
        } else {
            existingAsset.quantity = FinancialMath.scaleQuantity(newQuantity)
            assetRepository.save(existingAsset)
        }
    }

    private suspend fun buildAssetPerformance(asset: AssetEntity, baseCurrency: Currency): AssetPerformance {
        return try {
            val currentPrice = marketPriceService.getLatestPrice(asset.stockCode, asset.marketType)
            val costValue = asset.averagePrice.multiply(asset.quantity, FinancialMath.MATH_CONTEXT)
            val currentValue = currentPrice.multiply(asset.quantity, FinancialMath.MATH_CONTEXT)
            val pnlRaw = currentValue.subtract(costValue)
            val roiRaw = if (costValue.compareTo(BigDecimal.ZERO) == 0) {
                BigDecimal.ZERO
            } else {
                pnlRaw.divide(costValue, FinancialMath.ROI_SCALE, RoundingMode.HALF_UP)
                    .multiply(BigDecimal(100))
            }

            val pnlConverted = convertIfNeeded(pnlRaw, asset.marketType.currency, baseCurrency)
            val currentValueConverted = convertIfNeeded(currentValue, asset.marketType.currency, baseCurrency)

            AssetPerformance(
                stockCode = asset.stockCode,
                marketType = asset.marketType,
                quantity = asset.quantity,
                averagePrice = asset.averagePrice,
                currentPrice = FinancialMath.scalePrice(currentPrice),
                currentValue = FinancialMath.scalePrice(currentValueConverted),
                pnl = FinancialMath.scalePrice(pnlConverted),
                roiPercent = FinancialMath.scaleRoi(roiRaw),
                baseCurrency = baseCurrency,
                priceAvailable = true
            )
        } catch (ex: PriceDataUnavailableException) {
            logger.warn("Price unavailable for ${asset.stockCode} (${asset.marketType}): ${ex.message}")
            AssetPerformance(
                stockCode = asset.stockCode,
                marketType = asset.marketType,
                quantity = asset.quantity,
                averagePrice = asset.averagePrice,
                currentPrice = null,
                currentValue = null,
                pnl = null,
                roiPercent = null,
                baseCurrency = baseCurrency,
                priceAvailable = false
            )
        }
    }

    private fun convertIfNeeded(amount: BigDecimal, from: Currency, to: Currency): BigDecimal {
        return if (from == to) {
            FinancialMath.scalePrice(amount)
        } else {
            currencyService.convert(amount, from, to)
        }
    }

    private fun validateTradeRequest(request: TradeRequest) {
        if (request.stockCode.isBlank()) {
            throw IllegalArgumentException("Stock code is required")
        }
        if (request.tradePrice.compareTo(BigDecimal.ZERO) <= 0) {
            throw IllegalArgumentException("Trade price must be positive")
        }
        if (request.quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw IllegalArgumentException("Trade quantity must be positive")
        }
    }
}
