import { render, screen, waitFor } from '@testing-library/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { TenderListingPage } from './tender-listing-page'
import { useTenders } from '@/hooks/use-tenders'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock Next.js navigation hooks
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  useSearchParams: vi.fn(),
}))

// Mock the useTenders hook
vi.mock('@/hooks/use-tenders', () => ({
  useTenders: vi.fn(),
}))

// Mock all the sub-components
vi.mock('@/components/search', () => ({
  SearchInput: ({ value, onChange, onClear, placeholder, isLoading }: any) => (
    <div data-testid="search-input">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-loading={isLoading}
      />
      <button onClick={onClear} data-testid="clear-search">Clear</button>
    </div>
  ),
}))

vi.mock('@/components/filters', () => ({
  FilterPanel: ({ filters, filterOptions, onChange, onReset }: any) => (
    <div data-testid="filter-panel">
      <button onClick={() => onChange({ province: 'Western Cape' })}>
        Filter by Province
      </button>
      <button onClick={onReset}>Reset Filters</button>
    </div>
  ),
}))

vi.mock('@/components/tender', () => ({
  TenderCard: ({ tender, highlightTerms, onDocumentClick }: any) => (
    <div data-testid="tender-card" data-tender-id={tender.id}>
      <h3>{tender.title}</h3>
      <p>{tender.description}</p>
    </div>
  ),
}))

vi.mock('@/components/pagination', () => ({
  PaginationWithUrlSync: ({ pagination, onPageChange, onPageSizeChange }: any) => (
    <div data-testid="pagination">
      <button onClick={() => onPageChange(2)}>Next Page</button>
      <button onClick={() => onPageSizeChange(24)}>Change Page Size</button>
    </div>
  ),
}))

vi.mock('@/components/stats', () => ({
  StatsDashboard: ({ stats, isLoading }: any) => (
    <div data-testid="stats-dashboard" data-loading={isLoading}>
      {stats && (
        <div>
          <span>Total: {stats.total_tenders}</span>
          <span>Open: {stats.open_tenders}</span>
        </div>
      )}
    </div>
  ),
}))

const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
}

const mockSearchParams = {
  get: vi.fn(),
  toString: vi.fn(() => ''),
}

const mockTenderData = {
  tenders: [
    {
      id: '1',
      ocid: 'ocid-1',
      title: 'Test Tender 1',
      description: 'Test Description 1',
      buyer_name: 'Test Buyer',
      province: 'Western Cape',
      industry: 'IT',
      submission_method: 'online',
      language: 'en',
      date_published: '2024-01-01T00:00:00Z',
      date_closing: '2024-02-01T00:00:00Z',
      status: 'open' as const,
      documents: [],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ],
  pagination: {
    current_page: 1,
    total_pages: 5,
    page_size: 12,
    total_count: 50,
    has_next: true,
    has_previous: false,
  },
  stats: {
    total_tenders: 50,
    open_tenders: 30,
    closing_soon_tenders: 5,
    total_value: 1000000,
    last_updated: '2024-01-01T00:00:00Z',
  },
  filters: {
    provinces: [
      { value: 'western-cape', label: 'Western Cape', count: 10 },
      { value: 'gauteng', label: 'Gauteng', count: 15 },
    ],
    industries: [
      { value: 'it', label: 'IT', count: 20 },
      { value: 'construction', label: 'Construction', count: 10 },
    ],
    statuses: [
      { value: 'open' as const, label: 'Open', count: 30 },
      { value: 'closed' as const, label: 'Closed', count: 20 },
    ],
  },
}

describe('TenderListingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    ;(useRouter as any).mockReturnValue(mockRouter)
    ;(useSearchParams as any).mockReturnValue(mockSearchParams)
    ;(useTenders as any).mockReturnValue({
      data: mockTenderData,
      error: null,
      isLoading: false,
      isValidating: false,
      mutate: vi.fn(),
    })
    
    mockSearchParams.get.mockImplementation((key: string) => {
      const params: Record<string, string> = {
        page: '1',
        pageSize: '12',
        search: '',
        province: '',
        industry: '',
      }
      return params[key] || null
    })
  })

  describe('Rendering', () => {
    it('renders the main page structure', async () => {
      render(<TenderListingPage />)
      
      // Check for main heading
      expect(screen.getByText('BidBase Tender Listings')).toBeInTheDocument()
      expect(screen.getByText('Discover government tender opportunities across South Africa')).toBeInTheDocument()
      
      // Check for main components
      expect(screen.getByTestId('stats-dashboard')).toBeInTheDocument()
      expect(screen.getByTestId('search-input')).toBeInTheDocument()
      expect(screen.getByTestId('filter-panel')).toBeInTheDocument()
    })

    it('renders tender results when data is available', async () => {
      render(<TenderListingPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('tender-card')).toBeInTheDocument()
        expect(screen.getByText('Test Tender 1')).toBeInTheDocument()
      })
    })

    it('renders pagination when multiple pages exist', async () => {
      render(<TenderListingPage />)
      
      await waitFor(() => {
        expect(screen.getByTestId('pagination')).toBeInTheDocument()
      })
    })

    it('shows results count information', async () => {
      render(<TenderListingPage />)
      
      await waitFor(() => {
        expect(screen.getByText(/Showing 1 to 12 of 50 results/)).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('shows loading state when data is loading', async () => {
      ;(useTenders as any).mockReturnValue({
        data: null,
        error: null,
        isLoading: true,
        isValidating: false,
        mutate: vi.fn(),
      })

      render(<TenderListingPage />)
      
      // Should show loading skeletons
      expect(screen.getByTestId('stats-dashboard')).toHaveAttribute('data-loading', 'true')
    })

    it('shows validating state when data is updating', async () => {
      ;(useTenders as any).mockReturnValue({
        data: mockTenderData,
        error: null,
        isLoading: false,
        isValidating: true,
        mutate: vi.fn(),
      })

      render(<TenderListingPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Updating...')).toBeInTheDocument()
      })
    })
  })

  describe('Error States', () => {
    it('shows error message when there is an error', async () => {
      const mockError = new Error('Failed to fetch tenders')
      ;(useTenders as any).mockReturnValue({
        data: null,
        error: mockError,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      })

      render(<TenderListingPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Tenders')).toBeInTheDocument()
        expect(screen.getByText('Failed to fetch tenders')).toBeInTheDocument()
      })
    })

    it('shows retry button on error', async () => {
      const mockMutate = vi.fn()
      ;(useTenders as any).mockReturnValue({
        data: null,
        error: new Error('Network error'),
        isLoading: false,
        isValidating: false,
        mutate: mockMutate,
      })

      render(<TenderListingPage />)
      
      await waitFor(() => {
        const retryButton = screen.getByText('Retry')
        expect(retryButton).toBeInTheDocument()
      })
    })
  })

  describe('Empty States', () => {
    it('shows empty state when no tenders are found', async () => {
      ;(useTenders as any).mockReturnValue({
        data: {
          ...mockTenderData,
          tenders: [],
          pagination: {
            ...mockTenderData.pagination,
            total_count: 0,
            total_pages: 0,
          },
        },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      })

      render(<TenderListingPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No tenders available')).toBeInTheDocument()
      })
    })

    it('shows filtered empty state when filters are active', async () => {
      // Mock URL params to have active filters
      mockSearchParams.get.mockImplementation((key: string) => {
        if (key === 'search') return 'nonexistent'
        if (key === 'province') return 'western-cape'
        return null
      })

      ;(useTenders as any).mockReturnValue({
        data: {
          ...mockTenderData,
          tenders: [],
          pagination: {
            ...mockTenderData.pagination,
            total_count: 0,
            total_pages: 0,
          },
        },
        error: null,
        isLoading: false,
        isValidating: false,
        mutate: vi.fn(),
      })

      render(<TenderListingPage />)
      
      await waitFor(() => {
        expect(screen.getByText('No tenders match your criteria')).toBeInTheDocument()
        expect(screen.getByText('Clear all filters')).toBeInTheDocument()
      })
    })
  })

  describe('URL Synchronization', () => {
    it('initializes state from URL parameters', () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        const params: Record<string, string> = {
          page: '2',
          pageSize: '24',
          search: 'test search',
          province: 'western-cape',
          industry: 'it',
        }
        return params[key] || null
      })

      render(<TenderListingPage />)
      
      // Verify that useTenders was called with the correct parameters
      expect(useTenders).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 2,
          page_size: 24,
          filters: expect.objectContaining({
            search: 'test search',
            province: 'western-cape',
            industry: 'it',
          }),
        })
      )
    })
  })

  describe('Responsive Design', () => {
    it('renders with responsive layout classes', () => {
      render(<TenderListingPage />)
      
      // Check for the main container with responsive classes
      const mainContainer = screen.getByText('BidBase Tender Listings').closest('.container')
      expect(mainContainer).toBeInTheDocument()
      expect(mainContainer).toHaveClass('container', 'mx-auto', 'px-4', 'py-8')
    })
  })
})