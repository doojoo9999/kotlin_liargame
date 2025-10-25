package org.example.lineagew.application.service

import org.example.lineagew.application.dto.*
import org.example.lineagew.domain.boss.BossRepository
import org.example.lineagew.domain.member.MemberRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UploadService(
    private val memberRepository: MemberRepository,
    private val bossRepository: BossRepository,
    private val memberService: MemberService,
    private val bossService: BossService,
    private val bossKillService: BossKillService,
    private val itemService: ItemService,
    private val saleService: SaleService,
    private val clanFundService: ClanFundService,
    private val essenceService: EssenceService
) {

    fun preview(payload: UploadPayload): UploadPreviewResponse {
        val warnings = mutableListOf<String>()
        payload.bossKills.forEach { row ->
            if (!bossRepository.existsById(row.bossId)) {
                warnings.add("Missing boss id ${row.bossId} for boss kill")
            }
            row.participants.forEach { participant ->
                if (!memberRepository.existsById(participant.memberId)) {
                    warnings.add("Missing member id ${participant.memberId} in boss kill participants")
                }
            }
        }

        return UploadPreviewResponse(
            memberCount = payload.members.size,
            bossCount = payload.bosses.size,
            bossKillCount = payload.bossKills.size,
            itemCount = payload.items.size,
            saleCount = payload.sales.size,
            clanFundTxnCount = payload.clanFundTransactions.size,
            essenceCount = payload.essences.size,
            warnings = warnings
        )
    }

    @Transactional
    fun commit(payload: UploadPayload): UploadCommitResponse {
        var createdMembers = 0
        payload.members.forEach { memberRequest ->
            val existing = memberRepository.findByNameIgnoreCase(memberRequest.name).orElse(null)
            if (existing == null) {
                memberService.createMember(memberRequest)
                createdMembers++
            } else {
                memberService.updateMember(existing.id!!, MemberUpdateRequest(
                    role = memberRequest.role,
                    joinedAt = memberRequest.joinedAt,
                    memo = memberRequest.memo
                ))
            }
        }

        var createdBosses = 0
        payload.bosses.forEach { bossRequest ->
            val existing = bossRepository.findByNameIgnoreCase(bossRequest.name).orElse(null)
            if (existing == null) {
                bossService.createBoss(bossRequest)
                createdBosses++
            } else {
                bossService.updateBoss(existing.id!!, bossRequest)
            }
        }

        var createdBossKills = 0
        payload.bossKills.forEach { row ->
            val request = BossKillCreateRequest(
                bossId = row.bossId,
                killedAt = row.killedAt,
                notes = row.notes,
                participants = row.participants.map {
                    BossKillParticipantPayload(
                        memberId = it.memberId,
                        baseWeight = it.baseWeight,
                        attendance = it.attendance
                    )
                }
            )
            bossKillService.createBossKill(request)
            createdBossKills++
        }

        var createdItems = 0
        payload.items.forEach { itemRequest ->
            itemService.createItem(itemRequest)
            createdItems++
        }

        var createdSales = 0
        var finalizedSales = 0
        payload.sales.forEach { saleRow ->
            val sale = saleService.createSale(saleRow.sale)
            createdSales++
            saleRow.finalize?.let { finalizeRequest ->
                saleService.finalizeSale(sale.id, finalizeRequest)
                finalizedSales++
            }
        }

        var clanFundTxns = 0
        payload.clanFundTransactions.forEach {
            clanFundService.recordTransaction(it)
            clanFundTxns++
        }

        var essences = 0
        payload.essences.forEach {
            essenceService.upsertEssence(it)
            essences++
        }

        return UploadCommitResponse(
            createdMembers = createdMembers,
            createdBosses = createdBosses,
            createdBossKills = createdBossKills,
            createdItems = createdItems,
            createdSales = createdSales,
            finalizedSales = finalizedSales,
            clanFundTxns = clanFundTxns,
            essences = essences
        )
    }
}
