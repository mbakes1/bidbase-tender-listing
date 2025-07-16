import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTenders, usePrefetchTenders, useInvalidateTenders, SWR_CONFIG } from './use-tenders'
import type { GetTendersRequest, TenderListResponse } from '../types'

// Mock the API client
vi.mock('../lib/api-client', () => ({
  getTenders: vi.fn()
}))

// Mock SWR
vi.mock('swr', () => ({
  default: vi.fn()
}))

// Import the mocked functions to access them
import useSWR from 'swr'
import { getTenders } from '../lib/api-client'
const mockUseSWR = vi.mocked(useSWR)
const mockGetTenders = vi.mocked(getTenders)
const mockMutate = vi.fn()

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

describe('useTenders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSWR.mockReturnValue({
      data: mockTenderListResponse,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as ReturnType<typeof useSWR>)
  })

  it('should call useSWR with correct parameters for default request', () => {
    renderHook(() => useTenders())

    expect(mockUseSWR).toHaveBeenCalledWith(
      expect.stringContaining('tenders:'),
      expect.any(Function),
      SWR_CONFIG
    )

    // Check the key contains default values
    const [key] = mockUseSWR.mock.calls[0]
    expect(key).toContain('"page":1')
    expect(key).toContain('"page_size":12')
    expect(key).toContain('"sort_by":"date_published"')
    expect(key).toContain('"sort_order":"desc"')
  })

  it('should call useSWR with correct parameters for custom request', () => {
    const request: GetTendersRequest = {
      filters: {
        search: 'test',
        province: 'gauteng'
      },
      page: 2,
      page_size: 24,
      sort_by: 'title',
      sort_order: 'asc'
    }

    renderHook(() => useTenders(request))

    const [key] = mockUseSWR.mock.calls[0]
    expect(key).toContain('"search":"test"')
    expect(key).toContain('"province":"gauteng"')
    expect(key).toContain('"page":2')
    expect(key).toContain('"page_size":24')
    expect(key).toContain('"sort_by":"title"')
    expect(key).toContain('"sort_order":"asc"')
  })

  it('should return correct data structure', () => {
    const { result } = renderHook(() => useTenders())

    expect(result.current).toEqual({
      data: mockTenderListResponse,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: expect.any(Function)
    })
  })

  it('should handle loading state', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: true,
      isValidating: false,
      mutate: mockMutate
    } as ReturnType<typeof useSWR>)

    const { result } = renderHook(() => useTenders())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('should handle error state', () => {
    const error = new Error('API Error')
    mockUseSWR.mockReturnValue({
      data: undefined,
      error,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    })

    const { result } = renderHook(() => useTenders())

    expect(result.current.error).toBe(error)
    expect(result.current.data).toBeUndefined()
  })

  it('should call mutate function correctly', async () => {
    const { result } = renderHook(() => useTenders())

    await result.current.mutate()

    expect(mockMutate).toHaveBeenCalled()
  })

  it('should generate stable keys for identical requests', () => {
    const request: GetTendersRequest = {
      filters: { search: 'test' },
      page: 1
    }

    const { rerender } = renderHook(({ req }) => useTenders(req), {
      initialProps: { req: request }
    })

    const firstKey = mockUseSWR.mock.calls[0][0]

    // Clear mocks and rerender with same request
    mockUseSWR.mockClear()
    rerender({ req: request })

    const secondKey = mockUseSWR.mock.calls[0][0]

    expect(firstKey).toBe(secondKey)
  })

  it('should generate different keys for different requests', () => {
    const request1: GetTendersRequest = { filters: { search: 'test1' } }
    const request2: GetTendersRequest = { filters: { search: 'test2' } }

    const { rerender } = renderHook(({ req }) => useTenders(req), {
      initialProps: { req: request1 }
    })

    const firstKey = mockUseSWR.mock.calls[0][0]

    // Clear mocks and rerender with different request
    mockUseSWR.mockClear()
    rerender({ req: request2 })

    const secondKey = mockUseSWR.mock.calls[0][0]

    expect(firstKey).not.toBe(secondKey)
  })
})

describe('usePrefetchTenders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as ReturnType<typeof useSWR>)
    mockGetTenders.mockResolvedValue(mockTenderListResponse)
  })

  it('should prefetch tenders data', async () => {
    const { result } = renderHook(() => usePrefetchTenders())

    const request: GetTendersRequest = {
      filters: { search: 'test' }
    }

    await result.current(request)

    expect(mockMutate).toHaveBeenCalledWith(
      expect.stringContaining('tenders:'),
      expect.any(Promise),
      { revalidate: false }
    )
  })

  it('should handle prefetch with default request', async () => {
    const { result } = renderHook(() => usePrefetchTenders())

    await result.current()

    expect(mockMutate).toHaveBeenCalledWith(
      expect.stringContaining('tenders:'),
      expect.any(Promise),
      { revalidate: false }
    )
  })
})

describe('useInvalidateTenders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate
    } as ReturnType<typeof useSWR>)
  })

  it('should invalidate specific request', async () => {
    const { result } = renderHook(() => useInvalidateTenders())

    const request: GetTendersRequest = {
      filters: { search: 'test' }
    }

    await result.current.invalidate(request)

    expect(mockMutate).toHaveBeenCalledWith(
      expect.stringContaining('tenders:')
    )
  })

  it('should invalidate all tenders cache', async () => {
    const { result } = renderHook(() => useInvalidateTenders())

    await result.current.invalidateAll()

    expect(mockMutate).toHaveBeenCalledWith(
      expect.any(Function),
      undefined,
      { revalidate: true }
    )
  })

  it('should invalidate with default request', async () => {
    const { result } = renderHook(() => useInvalidateTenders())

    await result.current.invalidate()

    expect(mockMutate).toHaveBeenCalledWith(
      expect.stringContaining('tenders:')
    )
  })
})

describe('SWR Configuration', () => {
  it('should have correct default configuration', () => {
    expect(SWR_CONFIG).toEqual({
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
      dedupingInterval: 2000
    })
  })
})