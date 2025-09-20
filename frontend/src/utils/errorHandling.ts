import {toast} from 'sonner';

// Error types
export const ERROR_TYPE = {
  NETWORK: 'NETWORK',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  VALIDATION: 'VALIDATION',
  WEBSOCKET: 'WEBSOCKET',
  GAME_STATE: 'GAME_STATE',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN'
} as const

export type ErrorType = typeof ERROR_TYPE[keyof typeof ERROR_TYPE]

// Custom error classes
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly userMessage: string;
  public readonly context?: any;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: ErrorType = ERROR_TYPE.UNKNOWN,
    userMessage?: string,
    retryable: boolean = false,
    context?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.userMessage = userMessage || this.getDefaultUserMessage(type);
    this.retryable = retryable;
    this.context = context;
  }

  private getDefaultUserMessage(type: ErrorType): string {
    switch (type) {
      case ERROR_TYPE.NETWORK:
        return 'Network connection failed. Please check your internet connection.';
      case ERROR_TYPE.AUTHENTICATION:
        return 'Authentication failed. Please log in again.';
      case ERROR_TYPE.AUTHORIZATION:
        return 'You do not have permission to perform this action.';
      case ERROR_TYPE.VALIDATION:
        return 'Invalid input. Please check your data and try again.';
      case ERROR_TYPE.WEBSOCKET:
        return 'Real-time connection lost. Attempting to reconnect...';
      case ERROR_TYPE.GAME_STATE:
        return 'Game state error occurred. Please refresh the page.';
      case ERROR_TYPE.TIMEOUT:
        return 'Request timed out. Please try again.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }
}

export class NetworkError extends AppError {
  constructor(message: string, userMessage?: string, context?: any) {
    super(message, ERROR_TYPE.NETWORK, userMessage, true, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, userMessage?: string, context?: any) {
    super(message, ERROR_TYPE.AUTHENTICATION, userMessage, false, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, userMessage?: string, context?: any) {
    super(message, ERROR_TYPE.VALIDATION, userMessage, false, context);
  }
}

export class WebSocketError extends AppError {
  constructor(message: string, userMessage?: string, context?: any) {
    super(message, ERROR_TYPE.WEBSOCKET, userMessage, true, context);
  }
}

export class GameStateError extends AppError {
  constructor(message: string, userMessage?: string, context?: any) {
    super(message, ERROR_TYPE.GAME_STATE, userMessage, true, context);
  }
}

// Global error handler utility functions
export function handleError(error: unknown, context?: string): AppError {
  // Convert to AppError
  let appError: AppError;
  
  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    // Network/fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      appError = new NetworkError(error.message, undefined, { originalError: error, context });
    }
    // Timeout errors
    else if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      appError = new AppError(error.message, ERROR_TYPE.TIMEOUT, undefined, true, { originalError: error, context });
    }
    // Generic errors
    else {
      appError = new AppError(error.message, ERROR_TYPE.UNKNOWN, undefined, false, { originalError: error, context });
    }
  } else if (typeof error === 'object' && error !== null && 'status' in error) {
    // HTTP errors
    const httpError = error as { status: number; message?: string; data?: any };
    
    switch (httpError.status) {
      case 401:
        appError = new AuthenticationError('Authentication failed', 'Please log in again', { httpError, context });
        break;
      case 403:
        appError = new AppError('Access forbidden', ERROR_TYPE.AUTHORIZATION, 'You do not have permission to perform this action', false, { httpError, context });
        break;
      case 422:
        appError = new ValidationError('Validation failed', httpError.message || 'Please check your input', { httpError, context });
        break;
      case 408:
        appError = new AppError('Request timeout', ERROR_TYPE.TIMEOUT, undefined, true, { httpError, context });
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        appError = new NetworkError('Server error', 'Server is temporarily unavailable. Please try again later.', { httpError, context });
        break;
      default:
        appError = new NetworkError(`HTTP ${httpError.status}`, undefined, { httpError, context });
    }
  } else if (typeof error === 'string') {
    appError = new AppError(error, ERROR_TYPE.UNKNOWN, undefined, false, { context });
  } else {
    appError = new AppError('Unknown error occurred', ERROR_TYPE.UNKNOWN, undefined, false, { originalError: error, context });
  }
  
  // Log error
  if (process.env.NODE_ENV === 'development') {
    console.group(`=� ${appError.type} Error${context ? ` (${context})` : ''}`);
    console.error('Error:', appError.message);
    console.error('User Message:', appError.userMessage);
    console.error('Context:', appError.context);
    console.error('Stack:', appError.stack);
    console.groupEnd();
  } else {
    console.error('AppError:', {
      type: appError.type,
      message: appError.message,
      userMessage: appError.userMessage,
      retryable: appError.retryable,
      context: context || appError.context
    });
  }
  
  // Show user notification
  switch (appError.type) {
    case ERROR_TYPE.NETWORK:
      toast.error(appError.userMessage);
      break;
    case ERROR_TYPE.AUTHENTICATION:
      toast.error(appError.userMessage, {
        action: {
          label: 'Login',
          onClick: () => window.location.href = '/login'
        }
      });
      break;
    case ERROR_TYPE.VALIDATION:
      toast.error(appError.userMessage);
      break;
    case ERROR_TYPE.WEBSOCKET:
      toast.warning(appError.userMessage);
      break;
    case ERROR_TYPE.GAME_STATE:
      toast.error(appError.userMessage, {
        action: {
          label: 'Refresh',
          onClick: () => window.location.reload()
        }
      });
      break;
    default:
      toast.error(appError.userMessage);
  }
  
  return appError;
}

// Async wrapper with error handling
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  context?: string,
  onError?: (error: AppError) => void
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    const appError = handleError(error, context);
    onError?.(appError);
    return null;
  }
}

// Retry wrapper
export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: string
): Promise<T> {
  let lastError: AppError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = handleError(error, `${context} (attempt ${attempt}/${maxRetries})`);
      
      if (attempt === maxRetries || !lastError.retryable) {
        throw lastError;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError!;
}