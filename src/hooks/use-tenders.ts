import useSWR from 'swr'
import { useMemo } from 'react'
import { getTenders } from '../lib/api-client'
import type {
  GetTendersRequest,
  TenderListResponse,
  UseTendersResult
} from '../types'

// SWR configuration
const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5 minutes
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  dedupingInterval: 2000
}

// Key generator for SWR cache
const createTendersKey = (request: GetTendersRequest): string => {
  // Create a stable key from the request parameters
  const keyObject = {
    filters: request.filters || {},
    page: request.page || 1,
    page_size: request.page_size || 12,
    sort_by: request.sort_by || 'date_published',
    sort_order: request.sort_order || 'desc'
  }
  
  return `tenders:${JSON.stringify(keyObject)}`
}

// Fetcher function for SWR
const tendersFetcher = async (key: string): Promise<TenderListResponse> => {
  // Extract request from key
  const request = JSON.parse(key.replace('tenders:', '')) as GetTendersRequest
  return getTenders(request)
}

/**
 * Custom hook for fetching tenders with SWR
 * Provides automatic caching, revalidation, and error handling
 */
export const useTenders = (request: GetTendersRequest = {}): UseTendersResult => {
  const key = useMemo(() => createTendersKey(request), [request])
  
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate
  } = useSWR<TenderListResponse, Error>(
    key,
    tendersFetcher,
    SWR_CONFIG
  )

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate: () => mutate()
  }
}

/**
 * Hook for prefetching tenders data
 * Useful for preloading data on hover or route changes
 */
export const usePrefetchTenders = () => {
  const { mutate } = useSWR(null) // Get the global mutate function
  
  return (request: GetTendersRequest = {}) => {
    const key = createTendersKey(request)
    return mutate(key)
  }
}

/**
 * Hook for invalidating tenders cache
 * Useful after data mutations or when fresh data is needed
 */
export const useInvalidateTenders = () => {
  const { mutate } = useSWR(null) // Get the global mutate function
  
  return {
    // Invalidate specific request
    invalidate: (request: GetTendersRequest = {}) => {
      const key = createTendersKey(request)
      return mutate(key)
    },
    
    // Invalidate all tenders cache
    invalidateAll: () => {
      return mutate(
        (key: unknown) => typeof key === 'string' && key.startsWith('tenders:'),
        undefined
      )
    }
  }
}

// Export SWR configuration for customization
export { SWR_CONFIG }