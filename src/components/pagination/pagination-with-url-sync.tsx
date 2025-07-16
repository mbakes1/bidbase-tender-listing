'use client'

import React, { useCallback } from 'react'
import { PaginationComponent } from './pagination-component'
import { useUrlSync } from '@/hooks/use-url-sync'
import type { PaginationProps } from '@/types'

export interface PaginationWithUrlSyncProps extends Omit<PaginationProps, 'onPageChange' | 'onPageSizeChange'> {
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

/**
 * Enhanced pagination component that synchronizes state with URL parameters
 * This component wraps the base PaginationComponent and adds URL synchronization
 */
export function PaginationWithUrlSync({
  pagination,
  onPageChange,
  onPageSizeChange,
}: PaginationWithUrlSyncProps) {
  const { updateUrl } = useUrlSync()

  const handlePageChange = useCallback((page: number) => {
    // Update URL with new page
    updateUrl({ page })
    
    // Call optional callback
    onPageChange?.(page)
  }, [updateUrl, onPageChange])

  const handlePageSizeChange = useCallback((pageSize: number) => {
    // When page size changes, reset to page 1 and update URL
    updateUrl({ page: 1, pageSize })
    
    // Call optional callback
    onPageSizeChange?.(pageSize)
  }, [updateUrl, onPageSizeChange])

  return (
    <PaginationComponent
      pagination={pagination}
      onPageChange={handlePageChange}
      onPageSizeChange={handlePageSizeChange}
    />
  )
}