import { describe, it, expect } from 'vitest'
import {
  Tender,
  TenderDocument,
  SearchFilters,
  ApiResponse,
  PaginationInfo,
  PlatformStats,
  FilterOptions,
  isTender,
  isApiResponse,
  isErrorResponse,
  TENDER_STATUSES,
  SORT_FIELDS,
  SORT_ORDERS,
  PAGE_SIZES
} from './index'

describe('Type definitions', () => {
  describe('Constants', () => {
    it('should have correct tender statuses', () => {
      expect(TENDER_STATUSES.OPEN).toBe('open')
      expect(TENDER_STATUSES.CLOSED).toBe('closed')
      expect(TENDER_STATUSES.CANCELLED).toBe('cancelled')
      expect(TENDER_STATUSES.AWARDED).toBe('awarded')
    })

    it('should have correct sort fields', () => {
      expect(SORT_FIELDS.DATE_PUBLISHED).toBe('date_published')
      expect(SORT_FIELDS.DATE_CLOSING).toBe('date_closing')
      expect(SORT_FIELDS.VALUE_AMOUNT).toBe('value_amount')
      expect(SORT_FIELDS.TITLE).toBe('title')
    })

    it('should have correct sort orders', () => {
      expect(SORT_ORDERS.ASC).toBe('asc')
      expect(SORT_ORDERS.DESC).toBe('desc')
    })

    it('should have correct page sizes', () => {
      expect(PAGE_SIZES).toEqual([12, 24, 48])
    })
  })

  describe('Type guards', () => {
    describe('isTender', () => {
      it('should return true for valid tender object', () => {
        const validTender: Tender = {
          id: '1',
          ocid: 'ocid-123',
          title: 'Test Tender',
          description: 'Test Description',
          buyer_name: 'Test Buyer',
          province: 'Ontario',
          industry: 'Technology',
          submission_method: 'Electronic',
          language: 'English',
          date_published: '2024-01-01',
          date_closing: '2024-02-01',
          status: 'open',
          documents: [],
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }

        expect(isTender(validTender)).toBe(true)
      })

      it('should return false for invalid tender object', () => {
        const invalidTender = {
          id: '1',
          title: 'Test Tender'
          // Missing required fields
        }

        expect(isTender(invalidTender)).toBe(false)
      })

      it('should return false for null or undefined', () => {
        expect(isTender(null)).toBe(false)
        expect(isTender(undefined)).toBe(false)
      })
    })

    describe('isApiResponse', () => {
      it('should return true for valid API response', () => {
        const validResponse: ApiResponse<string> = {
          success: true,
          data: 'test data',
          timestamp: '2024-01-01T00:00:00Z'
        }

        expect(isApiResponse(validResponse)).toBe(true)
      })

      it('should return false for invalid API response', () => {
        const invalidResponse = {
          success: true
          // Missing required fields
        }

        expect(isApiResponse(invalidResponse)).toBe(false)
      })
    })

    describe('isErrorResponse', () => {
      it('should return true for valid error response', () => {
        const validErrorResponse = {
          success: false,
          error: {
            code: 'TEST_ERROR',
            message: 'Test error message'
          },
          timestamp: '2024-01-01T00:00:00Z'
        }

        expect(isErrorResponse(validErrorResponse)).toBe(true)
      })

      it('should return false for invalid error response', () => {
        const invalidErrorResponse = {
          success: false
          // Missing error object
        }

        expect(isErrorResponse(invalidErrorResponse)).toBe(false)
      })
    })
  })

  describe('Interface compatibility', () => {
    it('should allow creating SearchFilters with optional properties', () => {
      const filters: SearchFilters = {
        search: 'test',
        province: 'Ontario'
      }

      expect(filters.search).toBe('test')
      expect(filters.province).toBe('Ontario')
      expect(filters.industry).toBeUndefined()
    })

    it('should allow creating PaginationInfo with all properties', () => {
      const pagination: PaginationInfo = {
        current_page: 1,
        total_pages: 10,
        page_size: 12,
        total_count: 120,
        has_next: true,
        has_previous: false
      }

      expect(pagination.current_page).toBe(1)
      expect(pagination.total_pages).toBe(10)
      expect(pagination.has_next).toBe(true)
    })

    it('should allow creating PlatformStats with all properties', () => {
      const stats: PlatformStats = {
        total_tenders: 100,
        open_tenders: 50,
        closing_soon_tenders: 10,
        total_value: 1000000,
        last_updated: '2024-01-01T00:00:00Z'
      }

      expect(stats.total_tenders).toBe(100)
      expect(stats.open_tenders).toBe(50)
      expect(stats.total_value).toBe(1000000)
    })

    it('should allow creating FilterOptions with arrays', () => {
      const filterOptions: FilterOptions = {
        provinces: [
          { value: 'ON', label: 'Ontario', count: 50 },
          { value: 'BC', label: 'British Columbia', count: 30 }
        ],
        industries: [
          { value: 'tech', label: 'Technology', count: 25 }
        ],
        statuses: [
          { value: 'open', label: 'Open', count: 75 }
        ]
      }

      expect(filterOptions.provinces).toHaveLength(2)
      expect(filterOptions.provinces[0].value).toBe('ON')
      expect(filterOptions.industries[0].count).toBe(25)
    })

    it('should allow creating TenderDocument with all properties', () => {
      const document: TenderDocument = {
        id: 'doc-1',
        title: 'Test Document',
        description: 'Test document description',
        url: 'https://example.com/doc.pdf',
        format: 'PDF',
        document_type: 'tender',
        language: 'English',
        date_published: '2024-01-01',
        date_modified: '2024-01-02'
      }

      expect(document.id).toBe('doc-1')
      expect(document.title).toBe('Test Document')
      expect(document.url).toBe('https://example.com/doc.pdf')
    })
  })
})