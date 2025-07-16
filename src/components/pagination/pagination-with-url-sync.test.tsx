import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaginationWithUrlSync } from './pagination-with-url-sync'
import { PaginationInfo } from '@/types'

// Mock the URL sync hook
const mockUpdateUrl = vi.fn()
vi.mock('@/hooks/use-url-sync', () => ({
  useUrlSync: () => ({
    updateUrl: mockUpdateUrl,
    getUrlParams: () => ({
      page: 1,
      pageSize: 12,
      search: '',
      province: '',
      industry: '',
    }),
  }),
}))

// Mock the base pagination component
vi.mock('./pagination-component', () => ({
  PaginationComponent: ({ pagination, onPageChange, onPageSizeChange }: any) => (
    <div data-testid="pagination-component">
      <button
        data-testid="page-change-btn"
        onClick={() => onPageChange(2)}
      >
        Change Page
      </button>
      <button
        data-testid="page-size-change-btn"
        onClick={() => onPageSizeChange(24)}
      >
        Change Page Size
      </button>
      <span data-testid="current-page">{pagination.current_page}</span>
      <span data-testid="page-size">{pagination.page_size}</span>
    </div>
  ),
}))

describe('PaginationWithUrlSync', () => {
  const mockOnPageChange = vi.fn()
  const mockOnPageSizeChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  const createPagination = (overrides: Partial<PaginationInfo> = {}): PaginationInfo => ({
    current_page: 1,
    total_pages: 5,
    page_size: 12,
    total_count: 60,
    has_next: true,
    has_previous: false,
    ...overrides,
  })

  describe('Component Rendering', () => {
    it('renders the base pagination component', () => {
      const pagination = createPagination()
      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      expect(screen.getByTestId('pagination-component')).toBeInTheDocument()
      expect(screen.getByTestId('current-page')).toHaveTextContent('1')
      expect(screen.getByTestId('page-size')).toHaveTextContent('12')
    })

    it('passes pagination props correctly to base component', () => {
      const pagination = createPagination({
        current_page: 3,
        page_size: 24,
        total_pages: 10,
      })
      render(
        <PaginationWithUrlSync
          pagination={pagination}
        />
      )

      expect(screen.getByTestId('current-page')).toHaveTextContent('3')
      expect(screen.getByTestId('page-size')).toHaveTextContent('24')
    })
  })

  describe('URL Synchronization', () => {
    it('updates URL when page changes', () => {
      const pagination = createPagination()
      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      fireEvent.click(screen.getByTestId('page-change-btn'))

      expect(mockUpdateUrl).toHaveBeenCalledWith({ page: 2 })
    })

    it('updates URL when page size changes', () => {
      const pagination = createPagination()
      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      fireEvent.click(screen.getByTestId('page-size-change-btn'))

      expect(mockUpdateUrl).toHaveBeenCalledWith({ page: 1, pageSize: 24 })
    })

    it('resets to page 1 when page size changes', () => {
      const pagination = createPagination({ current_page: 5 })
      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      fireEvent.click(screen.getByTestId('page-size-change-btn'))

      // Should reset to page 1 when page size changes
      expect(mockUpdateUrl).toHaveBeenCalledWith({ page: 1, pageSize: 24 })
    })
  })

  describe('Callback Handling', () => {
    it('calls onPageChange callback when page changes', () => {
      const pagination = createPagination()
      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      fireEvent.click(screen.getByTestId('page-change-btn'))

      expect(mockOnPageChange).toHaveBeenCalledWith(2)
    })

    it('calls onPageSizeChange callback when page size changes', () => {
      const pagination = createPagination()
      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      fireEvent.click(screen.getByTestId('page-size-change-btn'))

      expect(mockOnPageSizeChange).toHaveBeenCalledWith(24)
    })

    it('works without optional callbacks', () => {
      const pagination = createPagination()
      
      // Should not throw when callbacks are not provided
      expect(() => {
        render(<PaginationWithUrlSync pagination={pagination} />)
      }).not.toThrow()

      // Should still update URL
      fireEvent.click(screen.getByTestId('page-change-btn'))
      expect(mockUpdateUrl).toHaveBeenCalledWith({ page: 2 })
    })
  })

  describe('Integration Behavior', () => {
    it('handles multiple rapid page changes correctly', () => {
      const pagination = createPagination()
      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      // Simulate rapid page changes
      fireEvent.click(screen.getByTestId('page-change-btn'))
      fireEvent.click(screen.getByTestId('page-change-btn'))
      fireEvent.click(screen.getByTestId('page-change-btn'))

      expect(mockUpdateUrl).toHaveBeenCalledTimes(3)
      expect(mockOnPageChange).toHaveBeenCalledTimes(3)
    })

    it('handles page size change followed by page change', () => {
      const pagination = createPagination()
      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
          onPageSizeChange={mockOnPageSizeChange}
        />
      )

      // Change page size first
      fireEvent.click(screen.getByTestId('page-size-change-btn'))
      expect(mockUpdateUrl).toHaveBeenCalledWith({ page: 1, pageSize: 24 })

      // Then change page
      fireEvent.click(screen.getByTestId('page-change-btn'))
      expect(mockUpdateUrl).toHaveBeenCalledWith({ page: 2 })

      expect(mockUpdateUrl).toHaveBeenCalledTimes(2)
    })
  })

  describe('Edge Cases', () => {
    it('handles zero total pages', () => {
      const pagination = createPagination({
        current_page: 1,
        total_pages: 0,
        total_count: 0,
        has_next: false,
        has_previous: false,
      })

      expect(() => {
        render(<PaginationWithUrlSync pagination={pagination} />)
      }).not.toThrow()
    })

    it('handles single page scenario', () => {
      const pagination = createPagination({
        total_pages: 1,
        has_next: false,
      })

      render(<PaginationWithUrlSync pagination={pagination} />)
      
      // Should still be able to change page size
      fireEvent.click(screen.getByTestId('page-size-change-btn'))
      expect(mockUpdateUrl).toHaveBeenCalledWith({ page: 1, pageSize: 24 })
    })

    it('handles large page numbers', () => {
      const pagination = createPagination({
        current_page: 999,
        total_pages: 1000,
        has_previous: true,
      })

      render(
        <PaginationWithUrlSync
          pagination={pagination}
          onPageChange={mockOnPageChange}
        />
      )

      fireEvent.click(screen.getByTestId('page-change-btn'))
      expect(mockUpdateUrl).toHaveBeenCalledWith({ page: 2 })
    })
  })
})