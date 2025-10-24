package org.example.kotlin_liargame.global.config

import org.example.kotlin_liargame.global.security.RateLimitingInterceptor
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebConfig(
    private val rateLimitingInterceptor: RateLimitingInterceptor,
    @Value("\${ratelimit.enabled:true}") private val rateLimitEnabled: Boolean
) : WebMvcConfigurer {

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }
    
    override fun addInterceptors(registry: InterceptorRegistry) {
        if (rateLimitEnabled) {
            registry.addInterceptor(rateLimitingInterceptor)
                .addPathPatterns("/api/**") // API 경로에만 적용
                .excludePathPatterns(
                    "/api/v1/admin/health",
                    "/actuator/**",
                    "/h2-console/**"
                )
        }
    }
    
    override fun addCorsMappings(registry: CorsRegistry) {
        registry.addMapping("/api/**")
            .allowedOriginPatterns(*getAllowedOrigins())
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600)
        
        registry.addMapping("/ws/**")
            .allowedOriginPatterns(*getAllowedOrigins())
            .allowedMethods("GET", "POST")
            .allowedHeaders("*")
            .allowCredentials(true)
    }

    private fun getAllowedOrigins(): Array<String> {
        val profile = System.getProperty("spring.profiles.active") ?: "dev"

        return when (profile) {
            "prod" -> arrayOf(
                "https://liargame.com",
                "https://www.liargame.com",
                "https://api.liargame.com"
            )
            "staging" -> (
                listOf("https://staging.liargame.com") + localDevelopmentOrigins()
                ).toTypedArray()
            else -> localDevelopmentOrigins().toTypedArray()
        }
    }

    private fun localDevelopmentOrigins(): List<String> {
        val hosts = listOf("127.0.0.1", "218.150.3.77")
        val ports = buildList {
            add(3000)
            add(4173)
            addAll(5173..5200)
        }

        val baseOrigins = hosts.flatMap { host ->
            ports.map { port -> "http://$host:$port" }
        }

        return baseOrigins + listOf(
            "https://zzirit.kr",
            "https://www.zzirit.kr"
        )
    }
}
