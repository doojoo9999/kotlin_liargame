package org.example.dnf_raid.service

import org.example.dnf_raid.config.DnfApiProperties
import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Component
import org.springframework.web.client.RestClient
import org.springframework.web.server.ResponseStatusException

@Component
class DnfApiClient(
    private val restClient: RestClient,
    private val properties: DnfApiProperties
    ) {

    private val logger = LoggerFactory.getLogger(DnfApiClient::class.java)

    fun searchCharacters(
        serverId: String,
        characterName: String,
        limit: Int = 20,
        wordType: String = "full"
    ): List<DnfCharacterApiResponse> {
        val apiKey = properties.apiKey ?: throw IllegalStateException("DNF API 키(DNF_API_KEY)가 설정되지 않았습니다.")
        return try {
            val response = restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters")
                        .queryParam("characterName", characterName)
                        .queryParam("limit", limit)
                        .queryParam("wordType", wordType)
                        .queryParam("apikey", apiKey)
                        .build(serverId)
                }
                .retrieve()
                .body(DnfCharacterSearchResponse::class.java)

            response?.rows ?: emptyList()
        } catch (ex: Exception) {
            logger.error("DNF 캐릭터 검색 실패: {}", ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "DNF 캐릭터 검색에 실패했습니다.")
        }
    }

    fun fetchCharacter(serverId: String, characterId: String): DnfCharacterApiResponse? {
        val apiKey = properties.apiKey ?: throw IllegalStateException("DNF API 키(DNF_API_KEY)가 설정되지 않았습니다.")
        return try {
            restClient.get()
                .uri { builder ->
                    builder
                        .path("/servers/{serverId}/characters/{characterId}")
                        .queryParam("apikey", apiKey)
                        .build(serverId, characterId)
                }
                .retrieve()
                .body(DnfCharacterApiResponse::class.java)
        } catch (ex: Exception) {
            logger.error("DNF 캐릭터 조회 실패 (serverId={}, characterId={}): {}", serverId, characterId, ex.message, ex)
            throw ResponseStatusException(HttpStatus.BAD_GATEWAY, "캐릭터 정보를 불러오지 못했습니다.")
        }
    }

    fun buildCharacterImageUrl(serverId: String, characterId: String, zoom: Int = 2): String =
        "${properties.imageBaseUrl}/servers/$serverId/characters/$characterId?zoom=$zoom"
}

data class DnfCharacterSearchResponse(
    val rows: List<DnfCharacterApiResponse> = emptyList()
)

data class DnfCharacterApiResponse(
    val serverId: String,
    val characterId: String,
    val characterName: String,
    val jobName: String,
    val jobGrowName: String,
    val fame: Int = 0,
    val adventureName: String? = null
)
