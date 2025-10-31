package org.example.kotlin_liargame.domain.nemonemo.config

import org.springdoc.core.models.GroupedOpenApi
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class NemonemoApiDocConfig {

    @Bean
    fun nemonemoApi(): GroupedOpenApi {
        return GroupedOpenApi.builder()
            .group("nemonemo")
            .pathsToMatch("/api/nemonemo/v1/**")
            .build()
    }
}
