package org.example.lineagew.application.service

import org.example.lineagew.application.dto.ItemRequest
import org.example.lineagew.application.dto.ItemResponse
import org.example.lineagew.application.dto.toResponse
import org.example.lineagew.common.ItemStatus
import org.example.lineagew.domain.bosskill.BossKillRepository
import org.example.lineagew.domain.item.Item
import org.example.lineagew.domain.item.ItemRepository
import org.example.lineagew.domain.item.ItemTag
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ItemService(
    private val itemRepository: ItemRepository,
    private val bossKillRepository: BossKillRepository
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
    fun listItems(status: ItemStatus? = null): List<ItemResponse> = when (status) {
        null -> itemRepository.findAll()
        else -> itemRepository.findAllByStatus(status)
    }.sortedWith(compareBy<Item> { it.status }.thenByDescending { it.acquiredAt })
        .map { it.toResponse() }

    private fun applyTags(item: Item, tags: List<String>) {
        item.tags.clear()
        tags.distinct().forEach { tagValue ->
            item.tags.add(ItemTag(item = item, tag = tagValue.trim()))
        }
    }
}
