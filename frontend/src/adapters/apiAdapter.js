/**
 * API Adapter
 * Abstracts external API dependencies and provides a clean interface for API operations
 * with error handling, retry logic, and request/response transformation
 */

import * as gameApi from '../api/gameApi';

/**
 * API operation types
 */
export const ApiOperationType = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  GET_ROOMS: 'GET_ROOMS',
  CREATE_ROOM: 'CREATE_ROOM',
  JOIN_ROOM: 'JOIN_ROOM',
  LEAVE_ROOM: 'LEAVE_ROOM',
  GET_ROOM_DETAILS: 'GET_ROOM_DETAILS',
  GET_SUBJECTS: 'GET_SUBJECTS',
  ADD_SUBJECT: 'ADD_SUBJECT',
  ADD_WORD: 'ADD_WORD',
  START_GAME: 'START_GAME',
  CAST_VOTE: 'CAST_VOTE',
  SUBMIT_HINT: 'SUBMIT_HINT',
  SUBMIT_DEFENSE: 'SUBMIT_DEFENSE',
  CAST_SURVIVAL_VOTE: 'CAST_SURVIVAL_VOTE',
  GUESS_WORD: 'GUESS_WORD',
  COMPLETE_SPEECH: 'COMPLETE_SPEECH'
};

/**
 * API response status
 */
export const ApiStatus = {
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  TIMEOUT: 'TIMEOUT',
  RETRY: 'RETRY',
  CANCELLED: 'CANCELLED'
};

/**
 * API Adapter class
 */
export class ApiAdapter {
  constructor(options = {}) {
    this.debugLogger = options.debugLogger || null;
    this.retryCount = options.retryCount || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.timeout = options.timeout || 30000;
    this.enableTransformation = options.enableTransformation !== false;
    
    // Request/Response interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    
    // Statistics
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      operationStats: {}
    };
    
    // Active requests tracking
    this.activeRequests = new Map();
    this.requestTimeouts = new Map();
  }

  /**
   * Adds request interceptor
   * @param {Function} interceptor - Request interceptor function
   */
  addRequestInterceptor = (interceptor) => {
    this.requestInterceptors.push(interceptor);
    this.log('[API] Added request interceptor');
  };

  /**
   * Adds response interceptor
   * @param {Function} interceptor - Response interceptor function
   */
  addResponseInterceptor = (interceptor) => {
    this.responseInterceptors.push(interceptor);
    this.log('[API] Added response interceptor');
  };

  /**
   * Adds error interceptor
   * @param {Function} interceptor - Error interceptor function
   */
  addErrorInterceptor = (interceptor) => {
    this.errorInterceptors.push(interceptor);
    this.log('[API] Added error interceptor');
  };

  /**
   * Executes API operation with retries and error handling
   * @param {string} operation - Operation type
   * @param {Function} apiFunction - API function to execute
   * @param {Array} args - Arguments for API function
   * @param {Object} options - Operation options
   * @returns {Promise} - API result
   */
  executeOperation = async (operation, apiFunction, args = [], options = {}) => {
    const requestId = this.generateRequestId();
    const startTime = performance.now();
    
    try {
      this.log('[API] Starting operation:', operation, 'RequestID:', requestId);
      
      // Update statistics
      this.updateOperationStats(operation, 'start');
      this.stats.totalRequests++;
      
      // Apply request interceptors
      const transformedArgs = await this.applyRequestInterceptors(operation, args);
      
      // Create request promise with timeout
      const requestPromise = this.createRequestWithTimeout(
        apiFunction, 
        transformedArgs, 
        options.timeout || this.timeout,
        requestId
      );
      
      // Track active request
      this.activeRequests.set(requestId, {
        operation: operation,
        startTime: startTime,
        promise: requestPromise
      });
      
      // Execute with retries
      const result = await this.executeWithRetry(
        requestPromise,
        operation,
        options.retryCount || this.retryCount,
        options.retryDelay || this.retryDelay,
        requestId
      );
      
      // Apply response interceptors
      const transformedResult = await this.applyResponseInterceptors(operation, result);
      
      // Calculate response time
      const responseTime = performance.now() - startTime;
      this.updateResponseTimeStats(responseTime);
      this.updateOperationStats(operation, 'success', responseTime);
      
      this.log('[API] Operation completed successfully:', operation, 'Time:', responseTime.toFixed(2) + 'ms');
      
      return {
        status: ApiStatus.SUCCESS,
        data: transformedResult,
        operation: operation,
        requestId: requestId,
        responseTime: responseTime
      };
      
    } catch (error) {
      const responseTime = performance.now() - startTime;
      this.updateOperationStats(operation, 'error', responseTime);
      
      this.logError('[API] Operation failed:', operation, 'Error:', error);
      
      // Apply error interceptors
      const processedError = await this.applyErrorInterceptors(operation, error, requestId);
      
      return {
        status: ApiStatus.ERROR,
        error: processedError,
        operation: operation,
        requestId: requestId,
        responseTime: responseTime
      };
      
    } finally {
      // Clean up tracking
      this.activeRequests.delete(requestId);
      this.requestTimeouts.delete(requestId);
    }
  };

  /**
   * User authentication operations
   */
  login = async (nickname, options = {}) => {
    return this.executeOperation(
      ApiOperationType.LOGIN,
      gameApi.login,
      [nickname],
      options
    );
  };

  logout = async (options = {}) => {
    return this.executeOperation(
      ApiOperationType.LOGOUT,
      gameApi.logout || (() => Promise.resolve()),
      [],
      options
    );
  };

  /**
   * Room management operations
   */
  getAllRooms = async (options = {}) => {
    return this.executeOperation(
      ApiOperationType.GET_ROOMS,
      gameApi.getAllRooms,
      [],
      options
    );
  };

  createRoom = async (roomData, options = {}) => {
    return this.executeOperation(
      ApiOperationType.CREATE_ROOM,
      gameApi.createRoom,
      [roomData],
      options
    );
  };

  joinRoom = async (gameNumber, password = null, options = {}) => {
    return this.executeOperation(
      ApiOperationType.JOIN_ROOM,
      gameApi.joinRoom,
      [gameNumber, password],
      options
    );
  };

  leaveRoom = async (gameNumber, options = {}) => {
    return this.executeOperation(
      ApiOperationType.LEAVE_ROOM,
      gameApi.leaveRoom,
      [gameNumber],
      options
    );
  };

  getRoomDetails = async (gameNumber, options = {}) => {
    return this.executeOperation(
      ApiOperationType.GET_ROOM_DETAILS,
      gameApi.getRoomDetails || gameApi.getRoom,
      [gameNumber],
      options
    );
  };

  /**
   * Subject management operations
   */
  getAllSubjects = async (options = {}) => {
    return this.executeOperation(
      ApiOperationType.GET_SUBJECTS,
      gameApi.getAllSubjects,
      [],
      options
    );
  };

  addSubject = async (subjectData, options = {}) => {
    return this.executeOperation(
      ApiOperationType.ADD_SUBJECT,
      gameApi.addSubject,
      [subjectData],
      options
    );
  };

  addWord = async (subjectId, word, options = {}) => {
    return this.executeOperation(
      ApiOperationType.ADD_WORD,
      gameApi.addWord,
      [subjectId, word],
      options
    );
  };

  /**
   * Game operations
   */
  startGame = async (gameNumber, options = {}) => {
    return this.executeOperation(
      ApiOperationType.START_GAME,
      gameApi.startGame,
      [gameNumber],
      options
    );
  };

  castVote = async (gameNumber, targetPlayerId, options = {}) => {
    return this.executeOperation(
      ApiOperationType.CAST_VOTE,
      gameApi.castVote,
      [gameNumber, targetPlayerId],
      options
    );
  };

  submitHint = async (gameNumber, hint, options = {}) => {
    return this.executeOperation(
      ApiOperationType.SUBMIT_HINT,
      gameApi.submitHint,
      [gameNumber, hint],
      options
    );
  };

  submitDefense = async (gameNumber, defense, options = {}) => {
    return this.executeOperation(
      ApiOperationType.SUBMIT_DEFENSE,
      gameApi.submitDefense,
      [gameNumber, defense],
      options
    );
  };

  castSurvivalVote = async (gameNumber, spare, options = {}) => {
    return this.executeOperation(
      ApiOperationType.CAST_SURVIVAL_VOTE,
      gameApi.castSurvivalVote,
      [gameNumber, spare],
      options
    );
  };

  guessWord = async (gameNumber, guess, options = {}) => {
    return this.executeOperation(
      ApiOperationType.GUESS_WORD,
      gameApi.guessWord,
      [gameNumber, guess],
      options
    );
  };

  completeSpeech = async (gameNumber, options = {}) => {
    return this.executeOperation(
      ApiOperationType.COMPLETE_SPEECH,
      gameApi.completeSpeech,
      [gameNumber],
      options
    );
  };

  /**
   * Creates request with timeout
   * @param {Function} apiFunction - API function to execute
   * @param {Array} args - Function arguments
   * @param {number} timeout - Timeout in milliseconds
   * @param {string} requestId - Request ID
   * @returns {Promise} - Request promise with timeout
   */
  createRequestWithTimeout = (apiFunction, args, timeout, requestId) => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.requestTimeouts.delete(requestId);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);
      
      this.requestTimeouts.set(requestId, timeoutId);
      
      Promise.resolve(apiFunction(...args))
        .then(result => {
          clearTimeout(timeoutId);
          this.requestTimeouts.delete(requestId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          this.requestTimeouts.delete(requestId);
          reject(error);
        });
    });
  };

  /**
   * Executes request with retry logic
   * @param {Promise} requestPromise - Request promise
   * @param {string} operation - Operation type
   * @param {number} retryCount - Number of retries
   * @param {number} retryDelay - Delay between retries
   * @param {string} requestId - Request ID
   * @returns {Promise} - Request result
   */
  executeWithRetry = async (requestPromise, operation, retryCount, retryDelay, requestId) => {
    let lastError = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        if (attempt > 0) {
          this.log('[API] Retrying operation:', operation, 'Attempt:', attempt + 1);
          this.stats.retriedRequests++;
          await this.delay(retryDelay * attempt); // Exponential backoff
        }
        
        const result = await requestPromise;
        
        if (attempt > 0) {
          this.log('[API] Retry succeeded for operation:', operation);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        
        // Don't retry certain types of errors
        if (this.isNonRetryableError(error)) {
          break;
        }
        
        if (attempt < retryCount) {
          this.log('[API] Operation failed, will retry:', operation, 'Error:', error.message);
        }
      }
    }
    
    throw lastError;
  };

  /**
   * Checks if error should not be retried
   * @param {Error} error - Error to check
   * @returns {boolean} - Whether error is non-retryable
   */
  isNonRetryableError = (error) => {
    // Don't retry authentication errors, validation errors, etc.
    const nonRetryableMessages = [
      'unauthorized',
      'forbidden',
      'bad request',
      'validation',
      'invalid',
      'not found'
    ];
    
    const errorMessage = error.message?.toLowerCase() || '';
    return nonRetryableMessages.some(msg => errorMessage.includes(msg));
  };

  /**
   * Applies request interceptors
   * @param {string} operation - Operation type
   * @param {Array} args - Original arguments
   * @returns {Array} - Transformed arguments
   */
  applyRequestInterceptors = async (operation, args) => {
    let transformedArgs = [...args];
    
    for (const interceptor of this.requestInterceptors) {
      try {
        transformedArgs = await interceptor(operation, transformedArgs);
      } catch (error) {
        this.logError('[API] Request interceptor error:', error);
      }
    }
    
    return transformedArgs;
  };

  /**
   * Applies response interceptors
   * @param {string} operation - Operation type
   * @param {*} response - Original response
   * @returns {*} - Transformed response
   */
  applyResponseInterceptors = async (operation, response) => {
    let transformedResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      try {
        transformedResponse = await interceptor(operation, transformedResponse);
      } catch (error) {
        this.logError('[API] Response interceptor error:', error);
      }
    }
    
    return transformedResponse;
  };

  /**
   * Applies error interceptors
   * @param {string} operation - Operation type
   * @param {Error} error - Original error
   * @param {string} requestId - Request ID
   * @returns {Error} - Processed error
   */
  applyErrorInterceptors = async (operation, error, requestId) => {
    let processedError = error;
    
    for (const interceptor of this.errorInterceptors) {
      try {
        processedError = await interceptor(operation, processedError, requestId);
      } catch (interceptorError) {
        this.logError('[API] Error interceptor error:', interceptorError);
      }
    }
    
    return processedError;
  };

  /**
   * Updates operation statistics
   * @param {string} operation - Operation type
   * @param {string} type - Stat type (start, success, error)
   * @param {number} responseTime - Response time
   */
  updateOperationStats = (operation, type, responseTime = 0) => {
    if (!this.stats.operationStats[operation]) {
      this.stats.operationStats[operation] = {
        total: 0,
        successful: 0,
        failed: 0,
        averageTime: 0,
        totalTime: 0
      };
    }
    
    const opStats = this.stats.operationStats[operation];
    
    switch (type) {
      case 'start':
        opStats.total++;
        break;
      case 'success':
        opStats.successful++;
        opStats.totalTime += responseTime;
        opStats.averageTime = opStats.totalTime / opStats.successful;
        this.stats.successfulRequests++;
        break;
      case 'error':
        opStats.failed++;
        this.stats.failedRequests++;
        break;
    }
  };

  /**
   * Updates response time statistics
   * @param {number} responseTime - Response time in milliseconds
   */
  updateResponseTimeStats = (responseTime) => {
    this.stats.totalResponseTime += responseTime;
    this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.successfulRequests;
  };

  /**
   * Cancels active request
   * @param {string} requestId - Request ID to cancel
   * @returns {boolean} - Whether request was cancelled
   */
  cancelRequest = (requestId) => {
    const timeoutId = this.requestTimeouts.get(requestId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.requestTimeouts.delete(requestId);
    }
    
    const activeRequest = this.activeRequests.get(requestId);
    if (activeRequest) {
      this.activeRequests.delete(requestId);
      this.log('[API] Cancelled request:', requestId);
      return true;
    }
    
    return false;
  };

  /**
   * Cancels all active requests
   * @returns {number} - Number of cancelled requests
   */
  cancelAllRequests = () => {
    let cancelled = 0;
    
    for (const requestId of this.activeRequests.keys()) {
      if (this.cancelRequest(requestId)) {
        cancelled++;
      }
    }
    
    this.log('[API] Cancelled all active requests:', cancelled);
    return cancelled;
  };

  /**
   * Gets active requests
   * @returns {Array} - Array of active request info
   */
  getActiveRequests = () => {
    const now = performance.now();
    return Array.from(this.activeRequests.entries()).map(([requestId, request]) => ({
      requestId: requestId,
      operation: request.operation,
      duration: now - request.startTime,
      startTime: request.startTime
    }));
  };

  /**
   * Gets API statistics
   * @returns {Object} - API statistics
   */
  getStats = () => {
    const successRate = this.stats.totalRequests > 0 
      ? (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2)
      : 0;
      
    const retryRate = this.stats.totalRequests > 0
      ? (this.stats.retriedRequests / this.stats.totalRequests * 100).toFixed(2)
      : 0;
    
    return {
      ...this.stats,
      activeRequests: this.activeRequests.size,
      successRate: `${successRate}%`,
      retryRate: `${retryRate}%`,
      averageResponseTimeFormatted: `${this.stats.averageResponseTime.toFixed(2)}ms`,
      requestInterceptors: this.requestInterceptors.length,
      responseInterceptors: this.responseInterceptors.length,
      errorInterceptors: this.errorInterceptors.length
    };
  };

  /**
   * Clears statistics
   */
  clearStats = () => {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      retriedRequests: 0,
      averageResponseTime: 0,
      totalResponseTime: 0,
      operationStats: {}
    };
    this.log('[API] Statistics cleared');
  };

  /**
   * Creates delay promise
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise} - Delay promise
   */
  delay = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  /**
   * Generates unique request ID
   * @returns {string} - Request ID
   */
  generateRequestId = () => {
    return `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  /**
   * Logs debug information
   * @param {...any} args - Arguments to log
   */
  log = (...args) => {
    if (this.debugLogger) {
      this.debugLogger.log('[DEBUG_LOG]', ...args);
    } else {
      console.log('[DEBUG_LOG]', ...args);
    }
  };

  /**
   * Logs error information
   * @param {...any} args - Arguments to log
   */
  logError = (...args) => {
    if (this.debugLogger) {
      this.debugLogger.error('[DEBUG_LOG]', ...args);
    } else {
      console.error('[DEBUG_LOG]', ...args);
    }
  };

  /**
   * Destroys API adapter and cleans up resources
   */
  destroy = () => {
    // Cancel all active requests
    this.cancelAllRequests();
    
    // Clear interceptors
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.errorInterceptors = [];
    
    // Clear maps
    this.activeRequests.clear();
    this.requestTimeouts.clear();
    
    this.log('[API] API adapter destroyed');
  };
}

/**
 * Factory function to create API adapter
 * @param {Object} options - API adapter options
 * @returns {ApiAdapter} - API adapter instance
 */
export const createApiAdapter = (options = {}) => {
  return new ApiAdapter(options);
};

/**
 * Global API adapter instance
 */
let globalApiAdapter = null;

/**
 * Gets or creates global API adapter
 * @param {Object} options - API adapter options
 * @returns {ApiAdapter} - Global API adapter instance
 */
export const getGlobalApiAdapter = (options = {}) => {
  if (!globalApiAdapter) {
    globalApiAdapter = new ApiAdapter(options);
  }
  return globalApiAdapter;
};