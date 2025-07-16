import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  apiClient, 
  getTenders, 
  ApiError, 
  NetworkError, 
  ValidationError,
  API_CONFIG 
} from './api-client'
import type { GetTendersRequest, TenderListResponse } from '../types'

// Mock Supabase
vi.mock('./supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn()
    }
  }
}))

// Import the mocked supabase to access the mock function
import { supabase } from './supabase'
const mockInvoke = vi.mocked(supabase.functions.invoke)

// Mock data
const mockTenderListResponse: TenderListResponse = {
  tenders: [
    {
      id: '1',
      ocid: 'ocds-123',
      title: 'Test Tender',
      description: 'Test Description',
      buyer_name: 'Test Buyer',
      province: 'Gauteng',
      industry: 'IT',
      submission_method: 'online',
      language: 'en',
      date_published: '2024-01-01T00:00:00Z',
      date_closing: '2024-02-01T00:00:00Z',
      status: 'open',
      documents: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }
  ],
  pagination: {
    current_page: 1,
    total_pages: 1,
    page_size: 12,
    total_count: 1,
    has_next: false,
    has_previous: false
  },
  stats: {
    total_tenders: 1,
    open_tenders: 1,
    closing_soon_tenders: 0,
    total_value: 0,
    last_updated: '2024-01-01T00:00:00Z'
  },
  filters: {
    provinces: [{ value: 'gauteng', label: 'Gauteng', count: 1 }],
    industries: [{ value: 'it', label: 'IT', count: 1 }],
    statuses: [{ value: 'open', label: 'Open', count: 1 }]
  }
}

const mockApiResponse = {
  success: true,
  data: mockTenderListResponse,
  timestamp: '2024-01-01T00:00:00Z'
}

const mockErrorResponse = {
  success: false,
  error: {
    code: 'TEST_ERROR',
    message: 'Test error message'
  },
  timestamp: '2024-01-01T00:00:00Z'
}

const mockValidationErrorResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Validation failed',
    details: [
      { field: 'search', message: 'Search term too long', code: 'SEARCH_TOO_LONG' }
    ]
  },
  timestamp: '2024-01-01T00:00:00Z'
}

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('getTenders', () => {
    it('should successfully fetch tenders with default parameters', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: mockApiResponse,
        error: null
      })

      const result = await getTenders()

      expect(mockInvoke).toHaveBeenCalledWith('get-tenders', {
        body: {}
      })
      expect(result).toEqual(mockTenderListResponse)
    })

    it('should successfully fetch tenders with custom parameters', async () => {
      const request: GetTendersRequest = {
        filters: {
          search: 'test',
          province: 'gauteng',
          industry: 'it'
        },
        page: 2,
        page_size: 24,
        sort_by: 'title',
        sort_order: 'asc'
      }

      mockInvoke.mockResolvedValueOnce({
        data: mockApiResponse,
        error: null
      })

      const result = await getTenders(request)

      expect(mockInvoke).toHaveBeenCalledWith('get-tenders', {
        body: request
      })
      expect(result).toEqual(mockTenderListResponse)
    })

    it('should handle Supabase client errors', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: { message: 'fetch error' }
      })

      await expect(getTenders()).rejects.toThrow('Network error calling get-tenders')
    })

    it('should handle API error responses', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: mockErrorResponse,
        error: null
      })

      await expect(getTenders()).rejects.toThrow('Test error message')
    })

    it('should handle validation error responses', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: mockValidationErrorResponse,
        error: null
      })

      await expect(getTenders()).rejects.toThrow('Validation failed')
    })

    it('should handle no data response', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: null,
        error: null
      })

      await expect(getTenders()).rejects.toThrow('No data received from API')
    })

    it('should handle invalid response format', async () => {
      mockInvoke.mockResolvedValueOnce({
        data: { invalid: 'response' },
        error: null
      })

      await expect(getTenders()).rejects.toThrow('Invalid response format from API')
    })
  })

  describe('Basic Error Handling', () => {
    it('should handle network errors', async () => {
      const networkError = new Error('fetch failed')
      mockInvoke.mockRejectedValueOnce(networkError)

      await expect(getTenders()).rejects.toThrow()
    })
  })

  describe('Internal Utilities', () => {
    describe('sleep', () => {
      it('should delay execution', async () => {
        const start = Date.now()
        const sleepPromise = apiClient._internal.sleep(1000)
        
        vi.advanceTimersByTime(1000)
        await sleepPromise
        
        expect(vi.getTimerCount()).toBe(0)
      })
    })

    describe('isNetworkError', () => {
      it('should identify network errors', () => {
        const networkError = new TypeError('fetch failed')
        expect(apiClient._internal.isNetworkError(networkError)).toBe(true)

        const regularError = new Error('regular error')
        expect(apiClient._internal.isNetworkError(regularError)).toBe(false)

        const networkError2 = new Error('network timeout')
        expect(apiClient._internal.isNetworkError(networkError2)).toBe(true)
      })
    })

    describe('withRetry', () => {
      it('should not retry non-network errors', async () => {
        const operation = vi.fn().mockRejectedValue(new ValidationError('validation failed', []))

        await expect(
          apiClient._internal.withRetry(operation, 1, 10)
        ).rejects.toThrow(ValidationError)
        
        expect(operation).toHaveBeenCalledTimes(1)
      })
    })

    describe('withTimeout', () => {
      it('should resolve if operation completes in time', async () => {
        const operation = Promise.resolve('success')
        const result = await apiClient._internal.withTimeout(operation, 1000)
        
        expect(result).toBe('success')
      })

      it('should reject if operation times out', async () => {
        const operation = new Promise(resolve => setTimeout(resolve, 2000))
        const timeoutPromise = apiClient._internal.withTimeout(operation, 1000)
        
        vi.advanceTimersByTime(1100)
        
        await expect(timeoutPromise).rejects.toThrow(NetworkError)
        await expect(timeoutPromise).rejects.toThrow('Request timeout')
      })
    })
  })

  describe('Error Classes', () => {
    it('should create ApiError with correct properties', () => {
      const error = new ApiError('Test message', 'TEST_CODE', 400, { detail: 'test' })
      
      expect(error.name).toBe('ApiError')
      expect(error.message).toBe('Test message')
      expect(error.code).toBe('TEST_CODE')
      expect(error.status).toBe(400)
      expect(error.details).toEqual({ detail: 'test' })
    })

    it('should create NetworkError with correct properties', () => {
      const originalError = new Error('Original error')
      const error = new NetworkError('Network failed', originalError)
      
      expect(error.name).toBe('NetworkError')
      expect(error.message).toBe('Network failed')
      expect(error.originalError).toBe(originalError)
    })

    it('should create ValidationError with correct properties', () => {
      const errors = [{ field: 'test', message: 'Test error', code: 'TEST' }]
      const error = new ValidationError('Validation failed', errors)
      
      expect(error.name).toBe('ValidationError')
      expect(error.message).toBe('Validation failed')
      expect(error.errors).toEqual(errors)
    })
  })
})