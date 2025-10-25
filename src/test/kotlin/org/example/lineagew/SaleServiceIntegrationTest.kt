package org.example.lineagew

import org.assertj.core.api.Assertions.assertThat
import org.example.kotlin_liargame.KotlinLiargameApplication
import org.example.lineagew.application.dto.*
import org.example.lineagew.application.service.*
import org.example.lineagew.common.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.test.context.ActiveProfiles
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@SpringBootTest(classes = [KotlinLiargameApplication::class])
@ActiveProfiles("test")
@org.springframework.transaction.annotation.Transactional
class SaleServiceIntegrationTest @Autowired constructor(
    private val memberService: MemberService,
    private val bossService: BossService,
    private val bossKillService: BossKillService,
    private val itemService: ItemService,
    private val saleService: SaleService,
    private val clanFundService: ClanFundService
) {

    private lateinit var memberAlpha: MemberResponse
    private lateinit var memberBeta: MemberResponse
    private lateinit var boss: BossResponse
    private var bossKillId: Long = 0

    @BeforeEach
    fun setupDomain() {
        memberAlpha = memberService.createMember(
            MemberCreateRequest(name = "Alpha", joinedAt = LocalDate.now().minusMonths(6))
        )
        memberBeta = memberService.createMember(
            MemberCreateRequest(name = "Beta", joinedAt = LocalDate.now().minusMonths(3))
        )
        boss = bossService.createBoss(BossRequest(name = "Ant Queen", tier = "Epic"))

        val kill = bossKillService.createBossKill(
            BossKillCreateRequest(
                bossId = boss.id,
                killedAt = LocalDateTime.now().minusDays(2),
                participants = listOf(
                    BossKillParticipantPayload(memberId = memberAlpha.id, baseWeight = BigDecimal("1.5")),
                    BossKillParticipantPayload(memberId = memberBeta.id, baseWeight = BigDecimal.ONE)
                )
            )
        )
        bossKillId = kill.id
    }

    @Test
    fun `weighted distribution computes payouts with participation bonus`() {
        val item = itemService.createItem(
            ItemRequest(
                name = "Glorious Sword",
                grade = ItemGrade.LEGENDARY,
                acquiredAt = LocalDate.now().minusDays(1),
                sourceBossKillId = bossKillId
            )
        )

        val sale = saleService.createSale(
            SaleCreateRequest(
                itemId = item.id,
                soldAt = LocalDateTime.now(),
                grossAmount = 1000,
                feeAmount = 0,
                taxAmount = 0
            )
        )

        val ruleRequest = DistributionRuleRequest(
            mode = DistributionMode.WEIGHTED,
            roundingMode = RoundingStrategy.ROUND,
            remainderPolicy = RemainderPolicy.TO_CLAN_FUND,
            participationBonusEnabled = true,
            bonusCurve = BonusCurveType.LINEAR,
            bonusLinearSlope = BigDecimal("0.05"),
            bonusLinearIntercept = BigDecimal("0.90"),
            bonusCapMultiplier = BigDecimal("1.20"),
            penaltyFloorMultiplier = BigDecimal("0.80")
        )

        val finalizeRequest = FinalizeSaleRequest(
            idempotencyKey = "test-weighted",
            rule = ruleRequest,
            participants = listOf(
                DistributionParticipantRequest(memberId = memberAlpha.id, baseWeight = BigDecimal("1.5")),
                DistributionParticipantRequest(memberId = memberBeta.id, baseWeight = BigDecimal.ONE)
            )
        )

        val finalized = saleService.finalizeSale(sale.id, finalizeRequest)

        assertThat(finalized.state).isEqualTo(SaleState.FINALIZED)
        assertThat(finalized.payouts).hasSize(2)

        val alphaPayout = finalized.payouts.first { it.memberId == memberAlpha.id }
        val betaPayout = finalized.payouts.first { it.memberId == memberBeta.id }

        assertThat(alphaPayout.amount + betaPayout.amount).isEqualTo(1000)
        assertThat(alphaPayout.amount).isEqualTo(600)
        assertThat(betaPayout.amount).isEqualTo(400)

        val rule = finalized.distributionRule!!
        val alphaParticipant = rule.participants.first { it.memberId == memberAlpha.id }
        val betaParticipant = rule.participants.first { it.memberId == memberBeta.id }

        assertThat(alphaParticipant.finalWeight).isGreaterThan(betaParticipant.finalWeight)
    }

    @Test
    fun `equal split remainder flows into clan fund`() {
        val item = itemService.createItem(
            ItemRequest(
                name = "Silver Coin",
                grade = ItemGrade.RARE,
                acquiredAt = LocalDate.now()
            )
        )

        val sale = saleService.createSale(
            SaleCreateRequest(
                itemId = item.id,
                soldAt = LocalDateTime.now(),
                grossAmount = 1001,
                feeAmount = 0,
                taxAmount = 0
            )
        )

        val finalizeRequest = FinalizeSaleRequest(
            rule = DistributionRuleRequest(
                mode = DistributionMode.EQUAL_SPLIT,
                roundingMode = RoundingStrategy.FLOOR,
                remainderPolicy = RemainderPolicy.TO_CLAN_FUND,
                participationBonusEnabled = false
            ),
            participants = listOf(
                DistributionParticipantRequest(memberId = memberAlpha.id),
                DistributionParticipantRequest(memberId = memberBeta.id)
            )
        )

        val initialFundBalance = clanFundService.getSummary().balance

        val finalized = saleService.finalizeSale(sale.id, finalizeRequest)

        assertThat(finalized.payouts.sumOf { it.amount }).isEqualTo(1000)
        val fundAfter = clanFundService.getSummary().balance
        assertThat(fundAfter - initialFundBalance).isEqualTo(1)
    }
}
