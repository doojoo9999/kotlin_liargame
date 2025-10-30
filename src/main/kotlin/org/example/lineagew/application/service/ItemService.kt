package org.example.lineagew.application.service

import org.example.lineagew.application.dto.ItemDetailResponse
import org.example.lineagew.application.dto.ItemRequest
import org.example.lineagew.application.dto.ItemResponse
import org.example.lineagew.application.dto.toDetailResponse
import org.example.lineagew.application.dto.toResponse
import org.example.lineagew.common.ItemStatus
import org.example.lineagew.domain.bosskill.BossKillRepository
import org.example.lineagew.domain.item.Item
import org.example.lineagew.domain.item.ItemRepository
import org.example.lineagew.domain.item.ItemTag
import org.example.lineagew.domain.sale.SaleRepository
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ItemService(
    private val itemRepository: ItemRepository,
    private val bossKillRepository: BossKillRepository,
    private val saleRepository: SaleRepository
) {

    @Transactional
    fun createItem(request: ItemRequest): ItemResponse {
        val item = Item(
            name = request.name.trim(),
            grade = request.grade,
            acquiredAt = request.acquiredAt,
            status = request.status,
            note = request.note
        )
        request.sourceBossKillId?.let {
            val bossKill = bossKillRepository.findById(it)
                .orElseThrow { IllegalArgumentException("BossKill not found: $it") }
            item.sourceBossKill = bossKill
        }
        applyTags(item, request.tags)
        return itemRepository.save(item).toResponse()
    }

    @Transactional
    fun updateItem(id: Long, request: ItemRequest): ItemResponse {
        val item = itemRepository.findById(id).orElseThrow { IllegalArgumentException("Item not found: $id") }
        item.name = request.name.trim()
        item.grade = request.grade
        item.acquiredAt = request.acquiredAt
        item.note = request.note
        item.status = request.status
        item.sourceBossKill = request.sourceBossKillId?.let { bossKillId ->
            bossKillRepository.findById(bossKillId)
                .orElseThrow { IllegalArgumentException("BossKill not found: $bossKillId") }
        }
        applyTags(item, request.tags)
        return item.toResponse()
    }

    @Transactional(readOnly = true)
    fun listItems(status: ItemStatus? = null, keyword: String? = null, limit: Int? = null): List<ItemResponse> {
        val normalizedKeyword = keyword?.trim()?.takeIf { it.isNotEmpty() }
        val items: List<Item> = when {
            normalizedKeyword != null && status != null ->
                itemRepository.findAllByStatusAndNameContainingIgnoreCase(status, normalizedKeyword)
            normalizedKeyword != null ->
                itemRepository.findAllByNameContainingIgnoreCase(normalizedKeyword)
            status != null ->
                itemRepository.findAllByStatus(status)
            else -> itemRepository.findAll()
        }

        val sorted = items.sortedWith(compareBy<Item> { it.status }.thenByDescending { it.acquiredAt })
        val limited = limit?.takeIf { it > 0 }?.let { sorted.take(it.coerceAtMost(500)) } ?: sorted
        return limited.map { it.toResponse() }
    }

    private fun applyTags(item: Item, tags: List<String>) {
        item.tags.clear()
        tags.distinct().forEach { tagValue ->
            item.tags.add(ItemTag(item = item, tag = tagValue.trim()))
        }
    }

    @Transactional(readOnly = true)
    fun getItem(id: Long): ItemDetailResponse = itemRepository.findDetailedById(id)
        .orElseThrow { IllegalArgumentException("Item not found: $id") }
        .toDetailResponse()

    @Transactional
    fun deleteItem(id: Long) {
        val item = itemRepository.findById(id).orElseThrow { IllegalArgumentException("Item not found: $id") }

        if (saleRepository.existsByItemId(id)) {
            throw IllegalStateException("아이템이 판매 내역에 연결되어 있어 삭제할 수 없습니다.")
        }

        itemRepository.delete(item)
    }
}
