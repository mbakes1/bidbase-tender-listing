import { describe, it, expect } from 'vitest'
import {
  validateSearchFilters,
  validateGetTendersRequest,
  validateTenderDocument,
  validateEmail,
  ValidationUtils
} from './validation'
import { SearchFilters, GetTendersRequest } from './index'

describe('Validation utilities', () => {
  describe('validateSearchFilters', () => {
    it('should validate empty filters', () => {
      const filters: SearchFilters = {}
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate valid filters', () => {
      const filters: SearchFilters = {
        search: 'test search',
        province: 'Ontario',
        industry: 'Technology',
        status: 'open',
        date_from: '2024-01-01',
        date_to: '2024-12-31',
        min_value: 1000,
        max_value: 50000
      }
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject search term that is too long', () => {
      const filters: SearchFilters = {
        search: 'a'.repeat(501)
      }
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('SEARCH_TOO_LONG')
    })

    it('should reject empty province', () => {
      const filters: SearchFilters = {
        province: '   '
      }
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('PROVINCE_EMPTY')
    })

    it('should reject invalid status', () => {
      const filters: SearchFilters = {
        status: 'invalid_status' as never
      }
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_STATUS')
    })

    it('should reject invalid date format', () => {
      const filters: SearchFilters = {
        date_from: 'invalid-date',
        date_to: '2024/01/01'
      }
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].code).toBe('INVALID_DATE_FROM')
      expect(result.errors[1].code).toBe('INVALID_DATE_TO')
    })

    it('should reject invalid date range', () => {
      const filters: SearchFilters = {
        date_from: '2024-12-31',
        date_to: '2024-01-01'
      }
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_DATE_RANGE')
    })

    it('should reject negative values', () => {
      const filters: SearchFilters = {
        min_value: -100,
        max_value: -50
      }
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].code).toBe('INVALID_MIN_VALUE')
      expect(result.errors[1].code).toBe('INVALID_MAX_VALUE')
    })

    it('should reject invalid value range', () => {
      const filters: SearchFilters = {
        min_value: 50000,
        max_value: 1000
      }
      const result = validateSearchFilters(filters)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_VALUE_RANGE')
    })
  })

  describe('validateGetTendersRequest', () => {
    it('should validate empty request', () => {
      const request: GetTendersRequest = {}
      const result = validateGetTendersRequest(request)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should validate valid request', () => {
      const request: GetTendersRequest = {
        filters: {
          search: 'test',
          province: 'Ontario'
        },
        page: 1,
        page_size: 12,
        sort_by: 'date_published',
        sort_order: 'desc'
      }
      const result = validateGetTendersRequest(request)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid page', () => {
      const request: GetTendersRequest = {
        page: 0
      }
      const result = validateGetTendersRequest(request)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_PAGE')
    })

    it('should reject invalid page size', () => {
      const request: GetTendersRequest = {
        page_size: 100
      }
      const result = validateGetTendersRequest(request)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_PAGE_SIZE')
    })

    it('should reject invalid sort field', () => {
      const request: GetTendersRequest = {
        sort_by: 'invalid_field' as never
      }
      const result = validateGetTendersRequest(request)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_SORT_FIELD')
    })

    it('should reject invalid sort order', () => {
      const request: GetTendersRequest = {
        sort_order: 'invalid_order' as never
      }
      const result = validateGetTendersRequest(request)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_SORT_ORDER')
    })
  })

  describe('validateTenderDocument', () => {
    it('should validate valid document', () => {
      const document = {
        id: 'doc-1',
        title: 'Test Document',
        description: 'Test description',
        url: 'https://example.com/doc.pdf',
        format: 'PDF',
        document_type: 'tender',
        language: 'English',
        date_published: '2024-01-01',
        date_modified: '2024-01-02'
      }
      const result = validateTenderDocument(document)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject null or undefined document', () => {
      const result1 = validateTenderDocument(null)
      const result2 = validateTenderDocument(undefined)
      
      expect(result1.isValid).toBe(false)
      expect(result2.isValid).toBe(false)
      expect(result1.errors[0].code).toBe('INVALID_DOCUMENT')
      expect(result2.errors[0].code).toBe('INVALID_DOCUMENT')
    })

    it('should reject document missing required fields', () => {
      const document = {
        id: 'doc-1'
        // Missing other required fields
      }
      const result = validateTenderDocument(document)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors.some(e => e.code === 'MISSING_DOCUMENT_TITLE')).toBe(true)
      expect(result.errors.some(e => e.code === 'MISSING_DOCUMENT_URL')).toBe(true)
    })

    it('should reject invalid URL', () => {
      const document = {
        id: 'doc-1',
        title: 'Test Document',
        url: 'not-a-valid-url',
        format: 'PDF',
        document_type: 'tender',
        language: 'English'
      }
      const result = validateTenderDocument(document)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_DOCUMENT_URL')).toBe(true)
    })

    it('should reject invalid date formats', () => {
      const document = {
        id: 'doc-1',
        title: 'Test Document',
        url: 'https://example.com/doc.pdf',
        format: 'PDF',
        document_type: 'tender',
        language: 'English',
        date_published: 'invalid-date',
        date_modified: '2024/01/01'
      }
      const result = validateTenderDocument(document)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_DOCUMENT_DATE_PUBLISHED')).toBe(true)
      expect(result.errors.some(e => e.code === 'INVALID_DOCUMENT_DATE_MODIFIED')).toBe(true)
    })
  })

  describe('validateEmail', () => {
    it('should validate valid email', () => {
      const result = validateEmail('test@example.com')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject invalid email', () => {
      const result = validateEmail('invalid-email')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('INVALID_EMAIL')
    })

    it('should reject empty email', () => {
      const result = validateEmail('')
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('MISSING_EMAIL')
    })
  })

  describe('ValidationUtils', () => {
    it('should export all validation functions', () => {
      expect(ValidationUtils.validateSearchFilters).toBeDefined()
      expect(ValidationUtils.validateGetTendersRequest).toBeDefined()
      expect(ValidationUtils.validateTenderDocument).toBeDefined()
      expect(ValidationUtils.validateEmail).toBeDefined()
      expect(ValidationUtils.isValidDate).toBeDefined()
      expect(ValidationUtils.isValidEmail).toBeDefined()
      expect(ValidationUtils.isValidUrl).toBeDefined()
    })

    it('should validate dates correctly', () => {
      expect(ValidationUtils.isValidDate('2024-01-01')).toBe(true)
      expect(ValidationUtils.isValidDate('invalid-date')).toBe(false)
      expect(ValidationUtils.isValidDate('2024/01/01')).toBe(false)
    })

    it('should validate emails correctly', () => {
      expect(ValidationUtils.isValidEmail('test@example.com')).toBe(true)
      expect(ValidationUtils.isValidEmail('invalid-email')).toBe(false)
    })

    it('should validate URLs correctly', () => {
      expect(ValidationUtils.isValidUrl('https://example.com')).toBe(true)
      expect(ValidationUtils.isValidUrl('http://example.com')).toBe(true)
      expect(ValidationUtils.isValidUrl('not-a-url')).toBe(false)
    })
  })
})