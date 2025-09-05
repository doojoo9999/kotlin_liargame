package org.example.kotlin_liargame.global.config

import org.example.kotlin_liargame.global.security.SessionDataManager
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.session.SessionRegistry
import org.springframework.security.core.session.SessionRegistryImpl
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.session.HttpSessionEventPublisher
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .headers { it.frameOptions { it.sameOrigin() } }
            .sessionManagement { sessionManagement ->
                sessionManagement
                    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                    .maximumSessions(1) // 사용자당 최대 1개 세션 허용
                    .maxSessionsPreventsLogin(false) // false: 새 로그인 시 기존 세션 무효화
                    .expiredUrl("/login?expired") // 세션 만료 시 리다이렉트 URL
                    .sessionRegistry(sessionRegistry())
            }
            .authorizeHttpRequests {
                it.anyRequest().permitAll()
            }

        return http.build()
    }

    @Bean
    fun sessionRegistry(): SessionRegistry {
        return SessionRegistryImpl()
    }

    @Bean
    fun httpSessionEventPublisher(): HttpSessionEventPublisher {
        return HttpSessionEventPublisher()
    }

    @Bean
    fun sessionManagementService(sessionDataManager: SessionDataManager, sessionRegistry: SessionRegistry): SessionManagementService {
        return SessionManagementService(sessionDataManager, sessionRegistry)
    }

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        // allowedOrigins 대신 allowedOriginPatterns 사용
        configuration.allowedOriginPatterns = getAllowedOriginPatterns()
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    private fun getAllowedOriginPatterns(): List<String> {
        val profile = System.getProperty("spring.profiles.active") ?: "dev"

        return when (profile) {
            "prod" -> listOf(
                "https://liargame.com",
                "https://www.liargame.com",
                "https://api.liargame.com"
            )
            "staging" -> listOf(
                "https://staging.liargame.com",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174"
            )
            else -> listOf(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174",
            )
        }
    }
}
