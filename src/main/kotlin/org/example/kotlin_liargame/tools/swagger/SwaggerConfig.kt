package org.example.kotlin_liargame.tools.swagger

import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration

@Configuration
class SwaggerConfig {

    @Bean
    fun openAPI(): OpenAPI {
        return OpenAPI()
            .info(
                Info()
                    .title("liar-game API")
                    .description("liar-game schema - Session-based Authentication")
                    .version("1.0.0")
            )
    }
}
