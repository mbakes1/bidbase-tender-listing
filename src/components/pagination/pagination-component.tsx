'use client'

import React from 'react'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PaginationProps } from '@/types'
import { PAGE_SIZES } from '@/types'

export function PaginationComponent({
  pagination,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const {
    current_page,
    total_pages,
    page_size,
    total_count,
    has_next,
    has_previous,
  } = pagination

  // Generate page numbers to display
  const getVisiblePages = () => {
    const pages: number[] = []
    const maxVisiblePages = 5
    
    if (total_pages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages around current page
      const start = Math.max(1, current_page - 2)
      const end = Math.min(total_pages, current_page + 2)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      // Add first page if not included
      if (start > 1) {
        pages.unshift(1)
        if (start > 2) {
          pages.splice(1, 0, -1) // -1 represents ellipsis
        }
      }
      
      // Add last page if not included
      if (end < total_pages) {
        if (end < total_pages - 1) {
          pages.push(-1) // -1 represents ellipsis
        }
        pages.push(total_pages)
      }
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()

  const handlePageClick = (page: number) => {
    if (page !== current_page && page >= 1 && page <= total_pages) {
      onPageChange?.(page)
    }
  }

  const handlePageSizeChange = (newPageSize: string) => {
    const size = parseInt(newPageSize, 10)
    if (PAGE_SIZES.includes(size as (typeof PAGE_SIZES)[number])) {
      onPageSizeChange?.(size)
    }
  }

  // Calculate result range
  const startResult = (current_page - 1) * page_size + 1
  const endResult = Math.min(current_page * page_size, total_count)

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Results info and page size selector */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
        <div className="text-sm text-muted-foreground">
          Showing {startResult.toLocaleString()} to {endResult.toLocaleString()} of{' '}
          {total_count.toLocaleString()} results
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Show:</span>
          <Select value={page_size.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={size.toString()}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">per page</span>
        </div>
      </div>

      {/* Pagination controls */}
      {total_pages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (has_previous) {
                    handlePageClick(current_page - 1)
                  }
                }}
                className={
                  !has_previous
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
                aria-disabled={!has_previous}
              />
            </PaginationItem>

            {visiblePages.map((page, index) => (
              <PaginationItem key={index}>
                {page === -1 ? (
                  <span className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      handlePageClick(page)
                    }}
                    isActive={page === current_page}
                    className="cursor-pointer"
                    aria-label={`Go to page ${page}`}
                  >
                    {page}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (has_next) {
                    handlePageClick(current_page + 1)
                  }
                }}
                className={
                  !has_next
                    ? 'pointer-events-none opacity-50'
                    : 'cursor-pointer'
                }
                aria-disabled={!has_next}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Page info for small screens */}
      {total_pages > 1 && (
        <div className="text-center text-sm text-muted-foreground sm:hidden">
          Page {current_page} of {total_pages}
        </div>
      )}
    </div>
  )
}