package org.example.dnf_raid.service

import com.fasterxml.jackson.annotation.JsonIgnoreProperties
import org.example.dnf_raid.service.SkillDetailResponse

@JsonIgnoreProperties(ignoreUnknown = true)
data class NormalizedSkillDetail(
    val name: String? = null,
    val type: String? = null,
    val desc: String? = null,
    val descDetail: String? = null,
    val descSpecial: List<String> = emptyList(),
    val consumeItem: SkillDetailResponse.ConsumeItem? = null,
    val maxLevel: Int? = null,
    val requiredLevel: Int? = null,
    val requiredLevelRange: Int? = null,
    val jobId: String? = null,
    val jobName: String? = null,
    val levelInfo: NormalizedLevelInfo? = null,
    val evolution: List<NormalizedEvolution> = emptyList(),
    val enhancement: List<NormalizedEnhancement> = emptyList()
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class NormalizedLevelInfo(
    val optionDesc: String? = null,
    val rows: List<NormalizedLevelRow> = emptyList()
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class NormalizedLevelRow(
    val level: Int? = null,
    val consumeMp: Int? = null,
    val coolTime: Double? = null,
    val castingTime: Double? = null,
    val optionValue: Map<String, Double> = emptyMap()
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class NormalizedEvolution(
    val type: Int? = null,
    val name: String? = null,
    val desc: String? = null,
    val descDetail: String? = null,
    val skills: List<String> = emptyList()
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class NormalizedEnhancement(
    val type: Int? = null,
    val status: List<NormalizedStatus> = emptyList()
)

@JsonIgnoreProperties(ignoreUnknown = true)
data class NormalizedStatus(
    val name: String? = null,
    val value: String? = null
)

/**
 * Converts raw SkillDetailResponse into a shape that is safe to serialize and store.
 * - Drops unknown fields to avoid future API changes from breaking serialization.
 * - Normalizes optionValue numbers into Double for consistent damage calculations.
 */
fun SkillDetailResponse.toNormalized(): NormalizedSkillDetail =
    NormalizedSkillDetail(
        name = name,
        type = type,
        desc = desc,
        descDetail = descDetail,
        descSpecial = descSpecial.orEmpty(),
        consumeItem = consumeItem,
        maxLevel = maxLevel,
        requiredLevel = requiredLevel,
        requiredLevelRange = requiredLevelRange,
        jobId = jobId,
        jobName = jobName,
        levelInfo = levelInfo?.let { info ->
            NormalizedLevelInfo(
                optionDesc = info.optionDesc,
                rows = info.rows.map { row ->
                    NormalizedLevelRow(
                        level = row.level,
                        consumeMp = row.consumeMp,
                        coolTime = row.coolTime,
                        castingTime = row.castingTime,
                        optionValue = row.optionValue
                            .orEmpty()
                            .mapNotNull { (key, value) ->
                                val asDouble = when (value) {
                                    is Number -> value.toDouble()
                                    is String -> value.toDoubleOrNull()
                                    else -> null
                                }
                                asDouble?.let { key to it }
                            }
                            .toMap()
                    )
                }
            )
        },
        evolution = evolution.orEmpty().map { evo ->
            NormalizedEvolution(
                type = evo.type,
                name = evo.name,
                desc = evo.desc,
                descDetail = evo.descDetail,
                skills = evo.skills.orEmpty()
            )
        },
        enhancement = enhancement.orEmpty().map { enh ->
            NormalizedEnhancement(
                type = enh.type,
                status = enh.status.orEmpty().map { st ->
                    NormalizedStatus(name = st.name, value = st.value)
                }
            )
        }
    )
