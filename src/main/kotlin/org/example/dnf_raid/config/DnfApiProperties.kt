package org.example.dnf_raid.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "dnf.api")
data class DnfApiProperties(
    var apiKey: String? = null,
    var baseUrl: String = "https://api.neople.co.kr/df",
    var imageBaseUrl: String = "https://img-api.neople.co.kr/df",
    /** 캐시 만료 시간(시간 단위). 기본 24시간 */
    var cacheTtlHours: Long = 24
)
