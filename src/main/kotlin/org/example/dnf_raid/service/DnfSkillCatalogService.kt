package org.example.dnf_raid.service

import com.fasterxml.jackson.databind.ObjectMapper
import jakarta.transaction.Transactional
import org.example.dnf_raid.model.DnfJobEntity
import org.example.dnf_raid.model.DnfJobGrowEntity
import org.example.dnf_raid.model.DnfSkillEntity
import org.example.dnf_raid.repository.DnfJobGrowRepository
import org.example.dnf_raid.repository.DnfJobRepository
import org.example.dnf_raid.repository.DnfSkillRepository
import org.example.dnf_raid.service.JobGrowRow
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service

@Service
class DnfSkillCatalogService(
    private val apiClient: DnfApiClient,
    private val jobRepository: DnfJobRepository,
    private val jobGrowRepository: DnfJobGrowRepository,
    private val skillRepository: DnfSkillRepository,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(DnfSkillCatalogService::class.java)

    /**
     * /jobs → /skills/{jobId}?jobGrowId=… → /skills/{jobId}/{skillId} 전체 동기화.
     * skillId를 jobGrowId와 결합한 복합 키로 저장한다.
     */
    @Transactional
    fun refreshAll() {
        val jobs = apiClient.fetchJobs()
        if (jobs.isEmpty()) {
            logger.warn("DNF 직업 목록이 비어 있습니다. API 키나 네트워크를 확인하세요.")
            return
        }

        // 기본 직업 저장
        jobs.map { it.jobId to it.jobName }
            .distinct()
            .forEach { (jobId, jobName) ->
                jobRepository.save(DnfJobEntity(jobId = jobId, jobName = jobName))
            }

        val growRows = jobs.flatMap { job ->
            job.rows.flatMap { expandGrowChain(it) }
                .map { grow -> Triple(job.jobId, job.jobName, grow) }
        }

        growRows.forEach { (jobId, jobName, grow) ->
            jobGrowRepository.save(
                DnfJobGrowEntity(
                    jobId = jobId,
                    jobGrowId = grow.jobGrowId,
                    jobName = jobName,
                    jobGrowName = grow.jobGrowName
                )
            )
        }

        growRows.forEach { (jobId, jobName, grow) ->
            val jobGrowId = grow.jobGrowId
            val jobGrowName = grow.jobGrowName

            skillRepository.deleteByJobGrowId(jobGrowId)

            val skills = apiClient.fetchSkills(jobId, jobGrowId)
            logger.info("스킬 목록 동기화 (jobGrowId={} / count={})", jobGrowId, skills.size)

            skills.forEach { summary ->
                val detail = apiClient.fetchSkillDetail(jobId, summary.skillId)
                val normalized = detail?.toNormalized()

                val levelRowsJson = normalized?.levelInfo?.rows?.let { objectMapper.writeValueAsString(it) }
                val detailJson = normalized?.let { objectMapper.writeValueAsString(it) }
                val descSpecialJson = normalized?.descSpecial?.let { ds -> objectMapper.writeValueAsString(ds) }
                val consumeItemJson = normalized?.consumeItem?.let { ci -> objectMapper.writeValueAsString(ci) }
                val levelInfoJson = normalized?.levelInfo?.let { li -> objectMapper.writeValueAsString(li) }
                val enhancementJson = normalized?.enhancement?.let { en -> objectMapper.writeValueAsString(en) }
                val evolutionJson = normalized?.evolution?.let { ev -> objectMapper.writeValueAsString(ev) }

                val baseCoolTime = normalized?.levelInfo?.rows?.firstOrNull()?.coolTime

                val entity = DnfSkillEntity(
                    id = "$jobGrowId:${summary.skillId}",
                    jobId = jobId,
                    jobGrowId = jobGrowId,
                    jobName = jobName,
                    jobGrowName = jobGrowName,
                    skillId = summary.skillId,
                    skillName = summary.name,
                    skillType = summary.type ?: detail?.type,
                    skillDesc = normalized?.desc,
                    skillDescDetail = normalized?.descDetail,
                    descSpecialJson = descSpecialJson,
                    consumeItemJson = consumeItemJson,
                    maxLevel = normalized?.maxLevel,
                    requiredLevel = normalized?.requiredLevel,
                    baseCoolTime = baseCoolTime,
                    optionDesc = normalized?.levelInfo?.optionDesc,
                    levelInfoJson = levelInfoJson,
                    detailJson = detailJson,
                    enhancementJson = enhancementJson,
                    evolutionJson = evolutionJson,
                    levelRowsJson = levelRowsJson
                )
                skillRepository.save(entity)
            }
        }
    }

    /**
     * 특정 직업/전직만 즉시 동기화한다.
     * 딜 계산 시 스킬 데이터가 비어 있을 때 한 번만 호출된다.
     */
    @Transactional
    fun refreshByNames(jobName: String, jobGrowName: String): Boolean {
        val jobs = apiClient.fetchJobs()
        if (jobs.isEmpty()) {
            logger.warn("DNF 직업 목록이 비어 있습니다. API 키나 네트워크를 확인하세요.")
            return false
        }

        val normalizedJob = normalize(jobName)
        val normalizedGrow = normalize(jobGrowName)

        val jobAndGrow = jobs.asSequence()
            .flatMap { job ->
                job.rows.flatMap { expandGrowChain(it) }
                    .map { grow -> Triple(job, grow, normalize(grow.jobGrowName)) }
            }
            .firstOrNull { (_, _, growNormalized) ->
                growNormalized.equals(normalizedGrow, ignoreCase = true)
            }
            ?: jobs.asSequence()
                .flatMap { job ->
                    job.rows.flatMap { expandGrowChain(it) }
                        .map { grow -> Triple(job, grow, normalize(job.jobName)) }
                }
                .firstOrNull { (_, _, jobNormalized) ->
                    jobNormalized.equals(normalizedJob, ignoreCase = true)
                }

        if (jobAndGrow == null) {
            logger.warn("직업/전직을 찾지 못했습니다: jobName={}, jobGrowName={}", jobName, jobGrowName)
            return false
        }

        val (jobRow, growRow) = jobAndGrow

        jobRepository.save(DnfJobEntity(jobId = jobRow.jobId, jobName = jobRow.jobName))
        jobGrowRepository.save(
            DnfJobGrowEntity(
                jobId = jobRow.jobId,
                jobGrowId = growRow.jobGrowId,
                jobName = jobRow.jobName,
                jobGrowName = growRow.jobGrowName
            )
        )

        skillRepository.deleteByJobGrowId(growRow.jobGrowId)

        val skills = apiClient.fetchSkills(jobRow.jobId, growRow.jobGrowId)
        if (skills.isEmpty()) {
            logger.warn("스킬 목록이 비어 있습니다 (jobGrowId={}, jobGrowName={})", growRow.jobGrowId, growRow.jobGrowName)
            return false
        }

        skills.forEach { summary ->
            val detail = apiClient.fetchSkillDetail(jobRow.jobId, summary.skillId)
            val normalized = detail?.toNormalized()

            val levelRowsJson = normalized?.levelInfo?.rows?.let { objectMapper.writeValueAsString(it) }
            val detailJson = normalized?.let { objectMapper.writeValueAsString(it) }
            val descSpecialJson = normalized?.descSpecial?.let { ds -> objectMapper.writeValueAsString(ds) }
            val consumeItemJson = normalized?.consumeItem?.let { ci -> objectMapper.writeValueAsString(ci) }
            val levelInfoJson = normalized?.levelInfo?.let { li -> objectMapper.writeValueAsString(li) }
            val enhancementJson = normalized?.enhancement?.let { en -> objectMapper.writeValueAsString(en) }
            val evolutionJson = normalized?.evolution?.let { ev -> objectMapper.writeValueAsString(ev) }
            val baseCoolTime = normalized?.levelInfo?.rows?.firstOrNull()?.coolTime

            val entity = DnfSkillEntity(
                id = "${growRow.jobGrowId}:${summary.skillId}",
                jobId = jobRow.jobId,
                jobGrowId = growRow.jobGrowId,
                jobName = jobRow.jobName,
                jobGrowName = growRow.jobGrowName,
                skillId = summary.skillId,
                skillName = summary.name,
                skillType = summary.type ?: detail?.type,
                skillDesc = normalized?.desc,
                skillDescDetail = normalized?.descDetail,
                descSpecialJson = descSpecialJson,
                consumeItemJson = consumeItemJson,
                maxLevel = normalized?.maxLevel,
                requiredLevel = normalized?.requiredLevel,
                baseCoolTime = baseCoolTime,
                optionDesc = normalized?.levelInfo?.optionDesc,
                levelInfoJson = levelInfoJson,
                detailJson = detailJson,
                enhancementJson = enhancementJson,
                evolutionJson = evolutionJson,
                levelRowsJson = levelRowsJson
            )
            skillRepository.save(entity)
        }

        logger.info("스킬 동기화 완료 (jobGrowId={}, jobGrowName={}, count={})", growRow.jobGrowId, growRow.jobGrowName, skills.size)
        return true
    }

    private fun expandGrowChain(root: JobGrowRow): List<JobGrowRow> {
        val result = mutableListOf<JobGrowRow>()
        var current: JobGrowRow? = root
        while (current != null) {
            result += current
            current = current.next
        }
        return result
    }

    private fun normalize(name: String?): String =
        name.orEmpty()
            .replaceFirst(Regex("^眞\\s*"), "")
            .replaceFirst(Regex("^진\\s*"), "")
            .trim()
}
