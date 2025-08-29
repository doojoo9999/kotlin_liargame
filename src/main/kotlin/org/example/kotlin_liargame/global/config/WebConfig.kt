package org.example.kotlin_liargame.global.config

import org.example.kotlin_liargame.global.security.RateLimitingInterceptor
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.servlet.config.annotation.CorsRegistry
import org.springframework.web.servlet.config.annotation.InterceptorRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

@Configuration
class WebConfig(
    private val rateLimitingInterceptor: RateLimitingInterceptor
) : WebMvcConfigurer {

    @Bean
    fun passwordEncoder(): PasswordEncoder {
        return BCryptPasswordEncoder()
    }
    
    override fun addInterceptors(registry: InterceptorRegistry) {
        registry.addInterceptor(rateLimitingInterceptor)
            .addPathPatterns("/api/**") // API 경로에만 적용
            .excludePathPatterns(
                "/api/v1/admin/health",
                "/actuator/**",
                "/h2-console/**"
            )
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
            "staging" -> arrayOf(
                "https://staging.liargame.com",
                "http://119.201.53.4:3000",
                "http://119.201.53.4:5173"
            )
            else -> arrayOf(
                "http://119.201.53.4:3000",
                "http://119.201.53.4:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173"
            )
        }
    }
}