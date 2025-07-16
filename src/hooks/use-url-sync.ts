'use client'

import { useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export interface UrlSyncOptions {
  page?: number
  pageSize?: number
  search?: string
  province?: string
  industry?: string
}

export function useUrlSync() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateUrl = useCallback((options: UrlSyncOptions) => {
    const params = new URLSearchParams(searchParams.toString())
    let hasChanges = false
    
    // Update or remove parameters based on provided options
    if (options.page !== undefined) {
      if (options.page > 1) {
        params.set('page', options.page.toString())
      } else {
        params.delete('page')
      }
      hasChanges = true
    }
    
    if (options.pageSize !== undefined) {
      if (options.pageSize !== 12) { // 12 is the default page size
        params.set('pageSize', options.pageSize.toString())
      } else {
        params.delete('pageSize')
      }
      hasChanges = true
    }
    
    if (options.search !== undefined) {
      if (options.search.trim()) {
        params.set('search', options.search.trim())
      } else {
        params.delete('search')
      }
      hasChanges = true
    }
    
    if (options.province !== undefined) {
      if (options.province && options.province !== 'all') {
        params.set('province', options.province)
      } else {
        params.delete('province')
      }
      hasChanges = true
    }
    
    if (options.industry !== undefined) {
      if (options.industry && options.industry !== 'all') {
        params.set('industry', options.industry)
      } else {
        params.delete('industry')
      }
      hasChanges = true
    }
    
    // Only update URL if there were actual changes
    if (hasChanges) {
      const newUrl = params.toString() ? `?${params.toString()}` : ''
      router.push(newUrl, { scroll: false })
    }
  }, [router, searchParams])

  const getUrlParams = useCallback((): UrlSyncOptions => {
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '12', 10)
    
    return {
      page: isNaN(page) ? 1 : page,
      pageSize: isNaN(pageSize) ? 12 : pageSize,
      search: searchParams.get('search') || '',
      province: searchParams.get('province') || '',
      industry: searchParams.get('industry') || '',
    }
  }, [searchParams])

  return {
    updateUrl,
    getUrlParams,
  }
}