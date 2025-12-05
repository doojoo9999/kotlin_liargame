package org.example.dnf_raid.config

import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpHeaders
import org.springframework.http.MediaType
import org.springframework.web.client.RestClient

@Configuration
class DnfApiConfig {

    @Bean
    fun dnfRestClient(builder: RestClient.Builder, properties: DnfApiProperties): RestClient =
        builder
            .baseUrl(properties.baseUrl)
            .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
            .build()
}
