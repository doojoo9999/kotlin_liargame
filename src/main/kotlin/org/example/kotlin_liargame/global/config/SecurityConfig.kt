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
            "staging" -> listOf("https://staging.liargame.com") + localDevelopmentOrigins()
            else -> localDevelopmentOrigins()
        }
    }

    private fun localDevelopmentOrigins(): List<String> {
        val hosts = listOf("127.0.0.1", "218.150.3.77")
        val ports = buildList {
            add(3000)
            add(4173)
            addAll(5173..5200)
        }

        return hosts.flatMap { host ->
            ports.map { port -> "http://$host:$port" }
        }
    }
}
