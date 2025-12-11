package org.example.dnf_raid.controller

import org.example.dnf_raid.service.DnfSkillCatalogService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/dnf/skills")
class DnfSkillCatalogController(
    private val catalogService: DnfSkillCatalogService
) {

    private val logger = LoggerFactory.getLogger(DnfSkillCatalogController::class.java)

    /**
     * 전체 직업/전직/스킬 데이터 동기화 트리거
     */
    @PostMapping("/sync")
    @GetMapping("/sync")
    fun syncAll(): ResponseEntity<String> {
        logger.info("DNF 스킬 전체 동기화 시작")
        catalogService.refreshAll()
        logger.info("DNF 스킬 전체 동기화 완료")
        return ResponseEntity.ok("Sync requested")
    }
}
