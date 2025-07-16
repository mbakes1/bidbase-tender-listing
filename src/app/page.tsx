import { Suspense } from 'react'
import { TenderListingPage } from '@/components/tender-listing-page'
import { Skeleton } from '@/components/ui/skeleton'

// Loading component for the main page
function TenderListingPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      
      {/* Stats dashboard skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      
      {/* Search and filters skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-48" />
        </div>
      </div>
      
      {/* Results skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
      
      {/* Pagination skeleton */}
      <div className="flex justify-center">
        <Skeleton className="h-10 w-80" />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<TenderListingPageSkeleton />}>
      <TenderListingPage />
    </Suspense>
  )
}
