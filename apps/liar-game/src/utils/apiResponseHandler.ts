// Standardized API response handling utilities
import type {APIResponse, GameError} from '@/types'

/**
 * Standardized API response wrapper
 */
export class ApiResponseHandler {
  /**
   * Wraps API responses in a consistent format
   */
  static success<T>(data: T): APIResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now()
    }
  }

  /**
   * Creates error response from various error types
   */
  static error<T>(error: unknown, code = 'UNKNOWN_ERROR'): APIResponse<T> {
    let gameError: GameError

    if (error instanceof Error) {
      gameError = {
        code,
        message: error.message,
        details: error.stack
      }
    } else if (typeof error === 'string') {
      gameError = {
        code,
        message: error
      }
    } else if (error && typeof error === 'object' && 'message' in error) {
      gameError = {
        code,
        message: (error as { message?: string }).message ?? 'Unknown error occurred',
        details: error
      }
    } else {
      gameError = {
        code,
        message: 'An unexpected error occurred',
        details: error
      }
    }

    const response: APIResponse<T> = {
      success: false,
      error: gameError,
      timestamp: Date.now()
    }

    return response
  }

  /**
   * Handles HTTP response and standardizes the format
   */
  static async handleResponse<T>(
    responsePromise: Promise<T>,
    errorCode?: string
  ): Promise<APIResponse<T>> {
    try {
      const data = await responsePromise
      return this.success(data)
    } catch (error) {
      console.error('API Response Error:', error)
      return this.error<T>(error, errorCode)
    }
  }

  /**
   * Validates and processes API response data
   */
  static validateResponse<T>(
    response: any,
    validator?: (data: any) => data is T
  ): APIResponse<T> {
    try {
      // Check if response is already in our standard format
      if (response && typeof response === 'object' && 'success' in response) {
        return response as APIResponse<T>
      }

      // Handle raw backend responses
      if (validator && !validator(response)) {
        return this.error<T>('Invalid response format', 'VALIDATION_ERROR')
      }

      return this.success(response)
    } catch (error) {
      return this.error<T>(error, 'VALIDATION_ERROR')
    }
  }

  /**
   * Extracts data from API response, throwing error if failed
   */
  static unwrap<T>(response: APIResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error?.message || 'API request failed')
    }
    return response.data!
  }

  /**
   * Checks if API response is successful
   */
  static isSuccess<T>(response: APIResponse<T>): response is APIResponse<T> & { success: true } {
    return response.success
  }

  /**
   * Checks if API response is an error
   */
  static isError<T>(response: APIResponse<T>): response is APIResponse<T> & { success: false } {
    return !response.success
  }

  /**
   * Maps API response data using transformer function
   */
  static map<T, U>(
    response: APIResponse<T>,
    transformer: (data: T) => U
  ): APIResponse<U> {
    if (!response.success) {
      return {
        success: false,
        error: response.error,
        timestamp: response.timestamp,
      }
    }
    
    try {
      const transformedData = transformer(response.data!)
      return this.success(transformedData)
    } catch (error) {
      return this.error<U>(error, 'TRANSFORMATION_ERROR')
    }
  }

  /**
   * Chains API response handling
   */
  static chain<T, U>(
    response: APIResponse<T>,
    handler: (data: T) => APIResponse<U>
  ): APIResponse<U> {
    if (!response.success) {
      return {
        success: false,
        error: response.error,
        timestamp: response.timestamp,
      }
    }
    
    return handler(response.data!)
  }

  /**
   * Handles multiple API responses, returning success only if all succeed
   */
  static all<T extends readonly APIResponse<any>[]>(
    responses: T
  ): APIResponse<{ [K in keyof T]: T[K] extends APIResponse<infer U> ? U : never }> {
    type CombinedResponse = { [K in keyof T]: T[K] extends APIResponse<infer U> ? U : never }

    const errors: GameError[] = []
    const data: any[] = []

    for (const response of responses) {
      if (!response.success) {
        if (response.error) {
          errors.push(response.error)
        }
      } else {
        data.push(response.data)
      }
    }

    if (errors.length > 0) {
      return this.error<CombinedResponse>(
        {
          message: `${errors.length} API requests failed`,
          details: errors
        },
        'MULTIPLE_ERRORS'
      )
    }

    return this.success(data as CombinedResponse)
  }


  /**
   * Creates a timeout wrapper for API calls
   */
  static withTimeout<T>(
    apiCall: () => Promise<T>,
    timeoutMs: number = 10000
  ): Promise<APIResponse<T>> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    })

    return this.handleResponse(
      Promise.race([apiCall(), timeoutPromise]),
      'TIMEOUT_ERROR'
    )
  }

  /**
   * Retry logic for failed API calls
   */
  static async withRetry<T>(
    apiCall: () => Promise<APIResponse<T>>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<APIResponse<T>> {
    let lastError: APIResponse<T>

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall()
        
        if (result.success) {
          return result
        }
        
        lastError = result
        
        // Don't retry on validation errors or certain client errors
        if (result.error?.code === 'VALIDATION_ERROR' || 
            result.error?.code === 'AUTHENTICATION_ERROR') {
          return result
        }
        
      } catch (error) {
        lastError = this.error<T>(error, 'RETRY_ERROR')
      }

      // Wait before next retry (exponential backoff)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }

    return lastError!
  }
}

// Convenience functions for common patterns
export const apiResponse = {
  success: ApiResponseHandler.success,
  error: ApiResponseHandler.error,
  handle: ApiResponseHandler.handleResponse,
  validate: ApiResponseHandler.validateResponse,
  unwrap: ApiResponseHandler.unwrap,
  isSuccess: ApiResponseHandler.isSuccess,
  isError: ApiResponseHandler.isError,
  map: ApiResponseHandler.map,
  chain: ApiResponseHandler.chain,
  all: ApiResponseHandler.all,
  withTimeout: ApiResponseHandler.withTimeout,
  withRetry: ApiResponseHandler.withRetry
}

export default ApiResponseHandler

