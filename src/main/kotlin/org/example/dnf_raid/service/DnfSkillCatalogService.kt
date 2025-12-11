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
                val levelRowsJson = detail?.levelInfo?.rows?.let { objectMapper.writeValueAsString(it) }
                val detailJson = detail?.let { objectMapper.writeValueAsString(it) }

                val baseCoolTime = detail?.levelInfo?.rows?.firstOrNull()?.coolTime

                val entity = DnfSkillEntity(
                    id = "$jobGrowId:${summary.skillId}",
                    jobId = jobId,
                    jobGrowId = jobGrowId,
                    jobName = jobName,
                    jobGrowName = jobGrowName,
                    skillId = summary.skillId,
                    skillName = summary.name,
                    skillType = summary.type,
                    maxLevel = detail?.maxLevel,
                    requiredLevel = detail?.requiredLevel,
                    baseCoolTime = baseCoolTime,
                    optionDesc = detail?.levelInfo?.optionDesc,
                    detailJson = detailJson,
                    levelRowsJson = levelRowsJson
                )
                skillRepository.save(entity)
            }
        }
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
}
