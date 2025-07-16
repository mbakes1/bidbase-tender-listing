'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUrlSync } from '@/hooks/use-url-sync'
import { useDebouncedSearch } from '@/hooks/use-debounced-search'
import { useTenders } from '@/hooks/use-tenders'
import { SearchInput } from '@/components/search'
import { FilterPanel } from '@/components/filters'
import { TenderCard } from '@/components/tender'
import { PaginationWithUrlSync } from '@/components/pagination'
import { StatsDashboard } from '@/components/stats'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, RefreshCw, Search } from 'lucide-react'
import type { SearchFilters, GetTendersRequest, TenderDocument } from '@/types'

// Error boundary component for handling component-level errors
function TenderListingErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback: React.ReactNode 
}) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    const handleError = () => setHasError(true)
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleError)
    
    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleError)
    }
  }, [])

  if (hasError) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// Error display component
function ErrorDisplay({ 
  error, 
  onRetry 
}: { 
  error: Error
  onRetry: () => void 
}) {
  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <div>
            <h3 className="font-semibold text-destructive">Error Loading Tenders</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {error.message || 'An unexpected error occurred while loading tender data.'}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Retry</span>
        </Button>
      </CardContent>
    </Card>
  )
}

// Empty state component
function EmptyState({ 
  hasFilters, 
  onClearFilters 
}: { 
  hasFilters: boolean
  onClearFilters: () => void 
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          {hasFilters ? 'No tenders match your criteria' : 'No tenders available'}
        </h3>
        <p className="text-muted-foreground mb-4 max-w-md">
          {hasFilters 
            ? 'Try adjusting your search terms or filters to find more results.'
            : 'There are currently no tender opportunities available in the system.'
          }
        </p>
        {hasFilters && (
          <Button variant="outline" onClick={onClearFilters}>
            Clear all filters
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Loading skeleton for tender results
function TenderResultsSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full" />
      ))}
    </div>
  )
}

export function TenderListingPage() {
  const { getUrlParams, updateUrl } = useUrlSync()
  
  // Initialize state from URL parameters
  const urlParams = getUrlParams()
  const initialFilters: SearchFilters = {
    search: urlParams.search,
    province: urlParams.province || undefined,
    industry: urlParams.industry || undefined,
  }

  // Search and filter state management
  const {
    filters,
    updateFilters,
    resetFilters,
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm
  } = useDebouncedSearch(initialFilters)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(urlParams.page)
  const [pageSize, setPageSize] = useState(urlParams.pageSize)

  // Build API request
  const tendersRequest: GetTendersRequest = useMemo(() => ({
    filters,
    page: currentPage,
    page_size: pageSize,
    sort_by: 'date_published',
    sort_order: 'desc'
  }), [filters, currentPage, pageSize])

  // Fetch tenders data
  const { data, error, isLoading, isValidating, mutate } = useTenders(tendersRequest)

  // Handle document clicks
  const handleDocumentClick = (document: TenderDocument) => {
    // Open document in new tab
    window.open(document.url, '_blank', 'noopener,noreferrer')
  }

  // Handle search input changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    // Reset to first page when search changes
    if (currentPage !== 1) {
      setCurrentPage(1)
      updateUrl({ page: 1, search: value })
    } else {
      updateUrl({ search: value })
    }
  }

  // Handle search clear
  const handleSearchClear = () => {
    setSearchTerm('')
    setCurrentPage(1)
    updateUrl({ page: 1, search: '' })
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: SearchFilters) => {
    updateFilters(newFilters)
    // Reset to first page when filters change
    setCurrentPage(1)
    updateUrl({ 
      page: 1, 
      province: newFilters.province || '',
      industry: newFilters.industry || ''
    })
  }

  // Handle filter reset
  const handleFilterReset = () => {
    resetFilters()
    setCurrentPage(1)
    updateUrl({ 
      page: 1, 
      search: '', 
      province: '', 
      industry: '' 
    })
  }

  // Handle page changes
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    updateUrl({ page })
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page
    updateUrl({ page: 1, pageSize: newPageSize })
  }

  // Handle retry
  const handleRetry = () => {
    mutate()
  }

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(filters.search || filters.province || filters.industry)
  }, [filters])

  // Extract search terms for highlighting
  const highlightTerms = useMemo(() => {
    if (!debouncedSearchTerm) return []
    return debouncedSearchTerm.split(' ').filter(term => term.length > 2)
  }, [debouncedSearchTerm])

  return (
    <TenderListingErrorBoundary
      fallback={
        <div className="container mx-auto px-4 py-8">
          <ErrorDisplay 
            error={new Error('Application error occurred')} 
            onRetry={() => window.location.reload()} 
          />
        </div>
      }
    >
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              BidBase Tender Listings
            </h1>
            <p className="text-muted-foreground">
              Discover government tender opportunities across South Africa
            </p>
          </div>

          {/* Statistics Dashboard */}
          <StatsDashboard 
            stats={data?.stats} 
            isLoading={isLoading && !data} 
          />

          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex-1 max-w-md">
                <SearchInput
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onClear={handleSearchClear}
                  placeholder="Search tenders by title, description, or buyer..."
                  isLoading={isValidating}
                />
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {isValidating && (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Updating...</span>
                  </>
                )}
              </div>
            </div>

            {data?.filters && (
              <FilterPanel
                filters={filters}
                filterOptions={data.filters}
                onChange={handleFilterChange}
                onReset={handleFilterReset}
              />
            )}
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {/* Results Header */}
            {data?.pagination && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((data.pagination.current_page - 1) * data.pagination.page_size) + 1} to{' '}
                  {Math.min(
                    data.pagination.current_page * data.pagination.page_size,
                    data.pagination.total_count
                  )}{' '}
                  of {data.pagination.total_count.toLocaleString()} results
                </div>
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleFilterReset}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}

            {/* Error State */}
            {error && (
              <ErrorDisplay error={error} onRetry={handleRetry} />
            )}

            {/* Loading State */}
            {isLoading && !data && (
              <TenderResultsSkeleton />
            )}

            {/* Empty State */}
            {data && data.tenders.length === 0 && (
              <EmptyState 
                hasFilters={hasActiveFilters}
                onClearFilters={handleFilterReset}
              />
            )}

            {/* Tender Results */}
            {data && data.tenders.length > 0 && (
              <div className="space-y-4">
                {data.tenders.map((tender) => (
                  <TenderCard
                    key={tender.id}
                    tender={tender}
                    highlightTerms={highlightTerms}
                    onDocumentClick={handleDocumentClick}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {data?.pagination && data.pagination.total_pages > 1 && (
              <div className="flex justify-center pt-8">
                <PaginationWithUrlSync
                  pagination={data.pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TenderListingErrorBoundary>
  )
}