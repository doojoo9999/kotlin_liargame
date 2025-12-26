package org.example.kotlin_liargame.domain.invest.service

import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.runs
import io.mockk.verify
import java.math.BigDecimal
import java.util.Optional
import org.example.kotlin_liargame.domain.invest.dto.TradeRequest
import org.example.kotlin_liargame.domain.invest.model.AssetEntity
import org.example.kotlin_liargame.domain.invest.model.PortfolioEntity
import org.example.kotlin_liargame.domain.invest.model.PortfolioUserEntity
import org.example.kotlin_liargame.domain.invest.model.enum.MarketType
import org.example.kotlin_liargame.domain.invest.model.enum.TradeType
import org.example.kotlin_liargame.domain.invest.repository.AssetRepository
import org.example.kotlin_liargame.domain.invest.repository.PortfolioRepository
import org.example.kotlin_liargame.domain.invest.repository.TradeHistoryRepository
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test

class PortfolioServiceTest {
    private val portfolioRepository: PortfolioRepository = mockk()
    private val assetRepository: AssetRepository = mockk()
    private val tradeHistoryRepository: TradeHistoryRepository = mockk()
    private val marketPriceService: MarketPriceService = mockk()
    private val currencyService: CurrencyService = mockk()

    private lateinit var portfolioService: PortfolioService

    @BeforeEach
    fun setup() {
        portfolioService = PortfolioService(
            portfolioRepository,
            assetRepository,
            tradeHistoryRepository,
            marketPriceService,
            currencyService
        )
    }

    @Test
    fun `recordTrade updates weighted average on buy`() {
        val owner = PortfolioUserEntity(email = "user@example.com", displayName = "User")
        val portfolio = PortfolioEntity(name = "Main", owner = owner)
        val asset = AssetEntity(
            portfolio = portfolio,
            stockCode = "AAPL",
            marketType = MarketType.US,
            averagePrice = BigDecimal("100.0000"),
            quantity = BigDecimal("10.0000")
        )

        every { portfolioRepository.findById(1L) } returns Optional.of(portfolio)
        every { assetRepository.findByPortfolioIdAndStockCodeAndMarketType(1L, "AAPL", MarketType.US) } returns asset
        every { assetRepository.save(any()) } answers { firstArg() }
        every { tradeHistoryRepository.save(any()) } answers { firstArg() }

        val request = TradeRequest(
            portfolioId = 1L,
            stockCode = "AAPL",
            marketType = MarketType.US,
            tradeType = TradeType.BUY,
            tradePrice = BigDecimal("120.0000"),
            quantity = BigDecimal("5.0000")
        )

        val updated = portfolioService.recordTrade(request)

        assertEquals(BigDecimal("106.6667"), updated.averagePrice)
        assertEquals(BigDecimal("15.0000"), updated.quantity)
    }

    @Test
    fun `recordTrade decreases quantity on sell`() {
        val owner = PortfolioUserEntity(email = "user@example.com", displayName = "User")
        val portfolio = PortfolioEntity(name = "Main", owner = owner)
        val asset = AssetEntity(
            portfolio = portfolio,
            stockCode = "AAPL",
            marketType = MarketType.US,
            averagePrice = BigDecimal("100.0000"),
            quantity = BigDecimal("10.0000")
        )

        every { portfolioRepository.findById(1L) } returns Optional.of(portfolio)
        every { assetRepository.findByPortfolioIdAndStockCodeAndMarketType(1L, "AAPL", MarketType.US) } returns asset
        every { assetRepository.save(any()) } answers { firstArg() }
        every { tradeHistoryRepository.save(any()) } answers { firstArg() }

        val request = TradeRequest(
            portfolioId = 1L,
            stockCode = "AAPL",
            marketType = MarketType.US,
            tradeType = TradeType.SELL,
            tradePrice = BigDecimal("110.0000"),
            quantity = BigDecimal("4.0000")
        )

        val updated = portfolioService.recordTrade(request)

        assertEquals(BigDecimal("6.0000"), updated.quantity)
        assertEquals(BigDecimal("100.0000"), updated.averagePrice)
    }

    @Test
    fun `recordTrade throws when selling more than holdings`() {
        val owner = PortfolioUserEntity(email = "user@example.com", displayName = "User")
        val portfolio = PortfolioEntity(name = "Main", owner = owner)
        val asset = AssetEntity(
            portfolio = portfolio,
            stockCode = "AAPL",
            marketType = MarketType.US,
            averagePrice = BigDecimal("100.0000"),
            quantity = BigDecimal("2.0000")
        )

        every { portfolioRepository.findById(1L) } returns Optional.of(portfolio)
        every { assetRepository.findByPortfolioIdAndStockCodeAndMarketType(1L, "AAPL", MarketType.US) } returns asset
        every { tradeHistoryRepository.save(any()) } answers { firstArg() }

        val request = TradeRequest(
            portfolioId = 1L,
            stockCode = "AAPL",
            marketType = MarketType.US,
            tradeType = TradeType.SELL,
            tradePrice = BigDecimal("110.0000"),
            quantity = BigDecimal("5.0000")
        )

        assertThrows(IllegalArgumentException::class.java) {
            portfolioService.recordTrade(request)
        }
    }

    @Test
    fun `recordTrade deletes asset when selling all`() {
        val owner = PortfolioUserEntity(email = "user@example.com", displayName = "User")
        val portfolio = PortfolioEntity(name = "Main", owner = owner)
        val asset = AssetEntity(
            portfolio = portfolio,
            stockCode = "AAPL",
            marketType = MarketType.US,
            averagePrice = BigDecimal("100.0000"),
            quantity = BigDecimal("2.0000")
        )

        every { portfolioRepository.findById(1L) } returns Optional.of(portfolio)
        every { assetRepository.findByPortfolioIdAndStockCodeAndMarketType(1L, "AAPL", MarketType.US) } returns asset
        every { tradeHistoryRepository.save(any()) } answers { firstArg() }
        every { assetRepository.delete(asset) } just runs

        val request = TradeRequest(
            portfolioId = 1L,
            stockCode = "AAPL",
            marketType = MarketType.US,
            tradeType = TradeType.SELL,
            tradePrice = BigDecimal("110.0000"),
            quantity = BigDecimal("2.0000")
        )

        portfolioService.recordTrade(request)

        verify { assetRepository.delete(asset) }
    }
}
