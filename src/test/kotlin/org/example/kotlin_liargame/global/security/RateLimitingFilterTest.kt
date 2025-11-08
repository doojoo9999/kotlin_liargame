package org.example.kotlin_liargame.global.security

import jakarta.servlet.FilterChain
import jakarta.servlet.ServletRequest
import jakarta.servlet.ServletResponse
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.test.context.ActiveProfiles

@SpringBootTest
@ActiveProfiles("test")
class RateLimitingFilterTest @Autowired constructor(
    private val rateLimitingFilter: RateLimitingFilter,
    private val rateLimitingService: RateLimitingService
) {

    private val clientIp = "203.0.113.10"

    @AfterEach
    fun tearDown() {
        rateLimitingService.resetClientRequests("ip:$clientIp")
    }

    @Test
    fun `filter blocks requests after configured threshold`() {
        repeat(120) {
            val request = buildRequest()
            val response = MockHttpServletResponse()
            val chain = AllowingChain()

            rateLimitingFilter.doFilter(request, response, chain)

            assertThat(chain.invoked).isTrue()
            assertThat(response.status).isIn(0, 200)
        }

        val blockedRequest = buildRequest()
        val blockedResponse = MockHttpServletResponse()
        val blockedChain = AllowingChain()

        rateLimitingFilter.doFilter(blockedRequest, blockedResponse, blockedChain)

        assertThat(blockedChain.invoked).isFalse()
        assertThat(blockedResponse.status).isEqualTo(429)
        assertThat(blockedResponse.contentAsString).contains("RATE_LIMIT_EXCEEDED")
    }

    private fun buildRequest(): MockHttpServletRequest = MockHttpServletRequest().apply {
        method = "GET"
        requestURI = "/api/v2/nemonemo/puzzles"
        remoteAddr = clientIp
    }

    private class AllowingChain : FilterChain {
        var invoked: Boolean = false

        override fun doFilter(request: ServletRequest?, response: ServletResponse?) {
            invoked = true
            if (response is MockHttpServletResponse) {
                response.status = 200
                response.contentType = "application/json"
            }
        }
    }
}

