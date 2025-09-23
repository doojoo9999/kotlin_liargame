package org.example.kotlin_liargame.tools.swagger

import org.springdoc.core.models.GroupedOpenApi
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class LiargameApiDocConfig {

    @Bean
    fun liargameCoreApi(): GroupedOpenApi {
        return GroupedOpenApi.builder()
            .group("liargame-core")
            .pathsToMatch("/api/v1/**")
            .build()
    }
}

