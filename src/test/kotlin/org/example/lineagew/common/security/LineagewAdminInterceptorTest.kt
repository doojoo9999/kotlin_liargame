package org.example.lineagew.common.security

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.mock.web.MockHttpServletRequest
import org.springframework.mock.web.MockHttpServletResponse
import org.springframework.web.method.HandlerMethod
import org.springframework.web.server.ResponseStatusException

private class DummyHandler {
    @LineagewAdminOnly
    fun adminEndpoint() {}

    fun openEndpoint() {}
}

class LineagewAdminInterceptorTest {

    private val properties = LineagewAdminProperties(key = "secret-key")
    private val interceptor = LineagewAdminInterceptor(properties)

    private fun handler(methodName: String): HandlerMethod =
        HandlerMethod(DummyHandler(), DummyHandler::class.java.getMethod(methodName))

    @Test
    fun `allow open endpoint without header`() {
        val request = MockHttpServletRequest()
        val response = MockHttpServletResponse()

        assertTrue(interceptor.preHandle(request, response, handler("openEndpoint")))
    }

    @Test
    fun `reject admin endpoint without key`() {
        val request = MockHttpServletRequest()
        val response = MockHttpServletResponse()

        val exception = assertThrows<ResponseStatusException> {
            interceptor.preHandle(request, response, handler("adminEndpoint"))
        }

        assertEquals(403, exception.statusCode.value())
    }

    @Test
    fun `allow admin endpoint with valid key`() {
        val request = MockHttpServletRequest()
        val response = MockHttpServletResponse()
        request.addHeader(properties.resolvedHeaderName(), "secret-key")

        assertTrue(interceptor.preHandle(request, response, handler("adminEndpoint")))
    }
}
