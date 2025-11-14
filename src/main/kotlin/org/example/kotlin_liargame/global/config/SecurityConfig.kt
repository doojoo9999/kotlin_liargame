package org.example.kotlin_liargame.global.config

import org.example.kotlin_liargame.global.security.RateLimitingFilter
import org.example.kotlin_liargame.global.security.SessionDataManager
import org.example.kotlin_liargame.global.security.SessionManagementService
import org.example.kotlin_liargame.global.security.SubjectPrincipalFilter
import org.example.kotlin_liargame.global.security.SubjectPrincipalResolver
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.annotation.Lazy
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity
import org.springframework.security.config.http.SessionCreationPolicy
import org.springframework.security.core.session.SessionRegistry
import org.springframework.security.core.session.SessionRegistryImpl
import org.springframework.security.web.SecurityFilterChain
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter
import org.springframework.security.web.session.HttpSessionEventPublisher
import org.springframework.security.web.util.matcher.AntPathRequestMatcher
import org.springframework.web.cors.CorsConfiguration
import org.springframework.web.cors.CorsConfigurationSource
import org.springframework.web.cors.UrlBasedCorsConfigurationSource

@Configuration
@EnableWebSecurity
class SecurityConfig(
    @Lazy private val subjectPrincipalResolver: SubjectPrincipalResolver,
    private val rateLimitingFilter: RateLimitingFilter
) {

    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .cors { it.configurationSource(corsConfigurationSource()) }
            .csrf { it.disable() }
            .headers { it.frameOptions { frame -> frame.sameOrigin() } }
            .sessionManagement { sessionManagement ->
                sessionManagement
                    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                    .maximumSessions(5)
                    .maxSessionsPreventsLogin(false)
                    .sessionRegistry(sessionRegistry())
            }
            .authorizeHttpRequests { authz ->
                authz
                    .requestMatchers(AntPathRequestMatcher("/actuator/**")).permitAll()
                    .requestMatchers(AntPathRequestMatcher("/api/auth/**")).permitAll()
                    .requestMatchers(AntPathRequestMatcher("/api/nemonemo/v1/admin/**")).hasRole("ADMIN")
                    .requestMatchers(AntPathRequestMatcher("/api/v2/nemonemo/**")).authenticated()
                    .anyRequest().permitAll()
            }
            .addFilterBefore(subjectPrincipalFilter(), UsernamePasswordAuthenticationFilter::class.java)
            .addFilterAfter(rateLimitingFilter, SubjectPrincipalFilter::class.java)
            .logout { logout ->
                logout.logoutUrl("/api/auth/logout")
                    .logoutSuccessHandler(LogoutSuccessHandler { _, response, _ -> response.status = 204 })
                    .deleteCookies("JSESSIONID", SubjectPrincipalResolver.SUBJECT_COOKIE_NAME)
            }

        return http.build()
    }

    @Bean
    fun subjectPrincipalFilter(): SubjectPrincipalFilter =
        SubjectPrincipalFilter(subjectPrincipalResolver)

    @Bean
    fun sessionRegistry(): SessionRegistry = SessionRegistryImpl()

    @Bean
    fun httpSessionEventPublisher(): HttpSessionEventPublisher = HttpSessionEventPublisher()

    @Bean
    fun sessionManagementService(
        sessionDataManager: SessionDataManager,
        sessionRegistry: SessionRegistry
    ): SessionManagementService = SessionManagementService(sessionDataManager, sessionRegistry)

    @Bean
    fun corsConfigurationSource(): CorsConfigurationSource {
        val configuration = CorsConfiguration()
        val corsOrigins = getCorsOrigins()
        configuration.allowedOrigins = corsOrigins.exact.toMutableList()
        configuration.allowedOriginPatterns = corsOrigins.patterns.toMutableList()
        configuration.allowedMethods = listOf("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
        configuration.allowedHeaders = listOf("*")
        configuration.allowCredentials = true

        val source = UrlBasedCorsConfigurationSource()
        source.registerCorsConfiguration("/**", configuration)
        return source
    }

    private fun getCorsOrigins(): OriginConfig {
        val profile = System.getProperty("spring.profiles.active") ?: "dev"
        val normalizedProfile = profile.lowercase()
        val exact = mutableSetOf(
            "https://liargame.com",
            "https://www.liargame.com",
            "https://api.liargame.com",
            "https://zzirit.kr",
            "https://www.zzirit.kr"
        )
        val patterns = mutableSetOf("https://*.zzirit.kr")

        val devOrigins = localDevelopmentOrigins()

        when (normalizedProfile) {
            "prod" -> {
                // production relies on base origins only
            }
            "staging" -> {
                exact += "https://staging.liargame.com"
                exact += devOrigins
            }
            else -> {
                exact += devOrigins
            }
        }

        return OriginConfig(
            exact = exact.toList(),
            patterns = patterns.toList()
        )
    }

    private fun localDevelopmentOrigins(): List<String> {
        val hosts = listOf("localhost", "127.0.0.1", "218.150.3.77")
        val ports = buildList {
            add(3000)
            add(4173)
            addAll(5173..5200)
        }
        val baseOrigins = hosts.flatMap { host -> ports.map { port -> "http://$host:$port" } }
        return baseOrigins
    }

    private data class OriginConfig(
        val exact: List<String>,
        val patterns: List<String>
    )
}
