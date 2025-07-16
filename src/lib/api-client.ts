import { supabase } from './supabase'
import type {
  GetTendersRequest,
  TenderListResponse,
  ApiResponse,
  ErrorResponse
} from '../types'
import { isApiResponse, isErrorResponse } from '../types'

// API configuration
const API_CONFIG = {
  TIMEOUT: 30000, // 30 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
  DEBOUNCE_DELAY: 300 // 300ms for search debouncing
} as const

// Custom error classes
export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number,
    public details?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class NetworkError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message)
    this.name = 'NetworkError'
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ field: string; message: string; code: string }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Utility functions
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms))

const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }
  if (error instanceof Error) {
    return error.message.includes('network') || 
           error.message.includes('timeout') ||
           error.message.includes('connection')
  }
  return false
}

// Retry logic with exponential backoff
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = API_CONFIG.MAX_RETRIES,
  baseDelay: number = API_CONFIG.RETRY_DELAY
): Promise<T> => {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      // Don't retry on validation errors or client errors (4xx)
      if (error instanceof ValidationError || 
          (error instanceof ApiError && error.status && error.status >= 400 && error.status < 500)) {
        throw error
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break
      }

      // Only retry on network errors or server errors (5xx)
      if (!isNetworkError(error) && 
          !(error instanceof ApiError && error.status && error.status >= 500)) {
        throw error
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      await sleep(delay)
    }
  }

  throw new NetworkError(
    `Operation failed after ${maxRetries + 1} attempts: ${lastError.message}`,
    lastError
  )
}

// Request timeout wrapper
const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = API_CONFIG.TIMEOUT
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new NetworkError(`Request timeout after ${timeoutMs}ms`))
      }, timeoutMs)
    })
  ])
}

// Main API client function
const callEdgeFunction = async <T>(
  functionName: string,
  payload: Record<string, unknown>
): Promise<T> => {
  const operation = async (): Promise<T> => {
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke(functionName, {
          body: payload
        })
      )

      // Handle Supabase client errors
      if (error) {
        if (error.message.includes('fetch')) {
          throw new NetworkError(`Network error calling ${functionName}: ${error.message}`)
        }
        throw new ApiError(
          `Supabase client error: ${error.message}`,
          'SUPABASE_ERROR'
        )
      }

      // Handle HTTP errors
      if (!data) {
        throw new ApiError(
          'No data received from API',
          'NO_DATA'
        )
      }

      // Check if response is an error response
      if (isErrorResponse(data)) {
        if (data.error.code === 'VALIDATION_ERROR') {
          throw new ValidationError(
            data.error.message,
            Array.isArray(data.error.details) ? data.error.details as any[] : []
          )
        }
        
        throw new ApiError(
          data.error.message,
          data.error.code,
          undefined,
          data.error.details
        )
      }

      // Validate successful response structure
      if (!isApiResponse<T>(data)) {
        throw new ApiError(
          'Invalid response format from API',
          'INVALID_RESPONSE'
        )
      }

      return data.data
    } catch (error) {
      // Re-throw our custom errors
      if (error instanceof ApiError || 
          error instanceof NetworkError || 
          error instanceof ValidationError) {
        throw error
      }

      // Handle unexpected errors
      if (error instanceof Error) {
        if (isNetworkError(error)) {
          throw new NetworkError(`Network error: ${error.message}`, error)
        }
        throw new ApiError(
          `Unexpected error: ${error.message}`,
          'UNEXPECTED_ERROR'
        )
      }

      throw new ApiError(
        'Unknown error occurred',
        'UNKNOWN_ERROR'
      )
    }
  }

  return withRetry(operation)
}

// Specific API functions
export const getTenders = async (request: GetTendersRequest = {}): Promise<TenderListResponse> => {
  return callEdgeFunction<TenderListResponse>('get-tenders', request)
}

// Export API client object for easier testing and mocking
export const apiClient = {
  getTenders,
  // Internal functions exposed for testing
  _internal: {
    withRetry,
    withTimeout,
    callEdgeFunction,
    sleep,
    isNetworkError
  }
}

// Export configuration for customization if needed
export { API_CONFIG }