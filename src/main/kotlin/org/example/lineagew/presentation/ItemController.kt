package org.example.lineagew.presentation

import jakarta.validation.Valid
import org.example.lineagew.application.dto.ItemRequest
import org.example.lineagew.application.dto.ItemResponse
import org.example.lineagew.application.service.ItemService
import org.example.lineagew.common.ItemStatus
import org.example.lineagew.common.security.LineagewAdminOnly
import org.springframework.http.HttpStatus
import org.springframework.validation.annotation.Validated
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/lineage/items")
@Validated
class ItemController(
    private val itemService: ItemService
) {

    @GetMapping
    fun listItems(@RequestParam(required = false) status: ItemStatus?): List<ItemResponse> =
        itemService.listItems(status)

    @LineagewAdminOnly
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun createItem(@Valid @RequestBody request: ItemRequest): ItemResponse = itemService.createItem(request)

    @LineagewAdminOnly
    @PutMapping("/{id}")
    fun updateItem(
        @PathVariable id: Long,
        @Valid @RequestBody request: ItemRequest
    ): ItemResponse = itemService.updateItem(id, request)
}
