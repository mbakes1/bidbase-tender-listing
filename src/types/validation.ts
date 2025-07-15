import { 
  SearchFilters, 
  GetTendersRequest, 
  ValidationResult, 
  ValidationError,
  TENDER_STATUSES,
  SORT_FIELDS,
  SORT_ORDERS,
  PAGE_SIZES
} from './index'

// Validation helper functions
const createValidationError = (field: string, message: string, code: string): ValidationError => ({
  field,
  message,
  code
})

const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString)
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/) !== null
}

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Search filters validation
export const validateSearchFilters = (filters: SearchFilters): ValidationResult => {
  const errors: ValidationError[] = []

  // Validate search term length
  if (filters.search && filters.search.length > 500) {
    errors.push(createValidationError(
      'search',
      'Search term cannot exceed 500 characters',
      'SEARCH_TOO_LONG'
    ))
  }

  // Validate province
  if (filters.province && filters.province.trim().length === 0) {
    errors.push(createValidationError(
      'province',
      'Province cannot be empty if provided',
      'PROVINCE_EMPTY'
    ))
  }

  // Validate industry
  if (filters.industry && filters.industry.trim().length === 0) {
    errors.push(createValidationError(
      'industry',
      'Industry cannot be empty if provided',
      'INDUSTRY_EMPTY'
    ))
  }

  // Validate status
  if (filters.status && !Object.values(TENDER_STATUSES).includes(filters.status)) {
    errors.push(createValidationError(
      'status',
      `Status must be one of: ${Object.values(TENDER_STATUSES).join(', ')}`,
      'INVALID_STATUS'
    ))
  }

  // Validate date_from
  if (filters.date_from && !isValidDate(filters.date_from)) {
    errors.push(createValidationError(
      'date_from',
      'Date from must be in YYYY-MM-DD format',
      'INVALID_DATE_FROM'
    ))
  }

  // Validate date_to
  if (filters.date_to && !isValidDate(filters.date_to)) {
    errors.push(createValidationError(
      'date_to',
      'Date to must be in YYYY-MM-DD format',
      'INVALID_DATE_TO'
    ))
  }

  // Validate date range
  if (filters.date_from && filters.date_to) {
    const fromDate = new Date(filters.date_from)
    const toDate = new Date(filters.date_to)
    if (fromDate > toDate) {
      errors.push(createValidationError(
        'date_range',
        'Date from cannot be after date to',
        'INVALID_DATE_RANGE'
      ))
    }
  }

  // Validate min_value
  if (filters.min_value !== undefined && (filters.min_value < 0 || !Number.isFinite(filters.min_value))) {
    errors.push(createValidationError(
      'min_value',
      'Minimum value must be a non-negative number',
      'INVALID_MIN_VALUE'
    ))
  }

  // Validate max_value
  if (filters.max_value !== undefined && (filters.max_value < 0 || !Number.isFinite(filters.max_value))) {
    errors.push(createValidationError(
      'max_value',
      'Maximum value must be a non-negative number',
      'INVALID_MAX_VALUE'
    ))
  }

  // Validate value range
  if (filters.min_value !== undefined && filters.max_value !== undefined && filters.min_value > filters.max_value) {
    errors.push(createValidationError(
      'value_range',
      'Minimum value cannot be greater than maximum value',
      'INVALID_VALUE_RANGE'
    ))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Get tenders request validation
export const validateGetTendersRequest = (request: GetTendersRequest): ValidationResult => {
  const errors: ValidationError[] = []

  // Validate filters if provided
  if (request.filters) {
    const filterValidation = validateSearchFilters(request.filters)
    errors.push(...filterValidation.errors)
  }

  // Validate page
  if (request.page !== undefined) {
    if (!Number.isInteger(request.page) || request.page < 1) {
      errors.push(createValidationError(
        'page',
        'Page must be a positive integer',
        'INVALID_PAGE'
      ))
    }
  }

  // Validate page_size
  if (request.page_size !== undefined) {
    if (!PAGE_SIZES.includes(request.page_size as typeof PAGE_SIZES[number])) {
      errors.push(createValidationError(
        'page_size',
        `Page size must be one of: ${PAGE_SIZES.join(', ')}`,
        'INVALID_PAGE_SIZE'
      ))
    }
  }

  // Validate sort_by
  if (request.sort_by && !Object.values(SORT_FIELDS).includes(request.sort_by)) {
    errors.push(createValidationError(
      'sort_by',
      `Sort field must be one of: ${Object.values(SORT_FIELDS).join(', ')}`,
      'INVALID_SORT_FIELD'
    ))
  }

  // Validate sort_order
  if (request.sort_order && !Object.values(SORT_ORDERS).includes(request.sort_order)) {
    errors.push(createValidationError(
      'sort_order',
      `Sort order must be one of: ${Object.values(SORT_ORDERS).join(', ')}`,
      'INVALID_SORT_ORDER'
    ))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Tender document validation
export const validateTenderDocument = (doc: unknown): ValidationResult => {
  const errors: ValidationError[] = []

  if (!doc || typeof doc !== 'object') {
    errors.push(createValidationError(
      'document',
      'Document must be an object',
      'INVALID_DOCUMENT'
    ))
    return { isValid: false, errors }
  }

  const document = doc as Record<string, unknown>

  // Required fields
  if (!document.id || typeof document.id !== 'string') {
    errors.push(createValidationError(
      'id',
      'Document ID is required and must be a string',
      'MISSING_DOCUMENT_ID'
    ))
  }

  if (!document.title || typeof document.title !== 'string') {
    errors.push(createValidationError(
      'title',
      'Document title is required and must be a string',
      'MISSING_DOCUMENT_TITLE'
    ))
  }

  if (!document.url || typeof document.url !== 'string') {
    errors.push(createValidationError(
      'url',
      'Document URL is required and must be a string',
      'MISSING_DOCUMENT_URL'
    ))
  } else if (!isValidUrl(document.url as string)) {
    errors.push(createValidationError(
      'url',
      'Document URL must be a valid URL',
      'INVALID_DOCUMENT_URL'
    ))
  }

  if (!document.format || typeof document.format !== 'string') {
    errors.push(createValidationError(
      'format',
      'Document format is required and must be a string',
      'MISSING_DOCUMENT_FORMAT'
    ))
  }

  if (!document.document_type || typeof document.document_type !== 'string') {
    errors.push(createValidationError(
      'document_type',
      'Document type is required and must be a string',
      'MISSING_DOCUMENT_TYPE'
    ))
  }

  if (!document.language || typeof document.language !== 'string') {
    errors.push(createValidationError(
      'language',
      'Document language is required and must be a string',
      'MISSING_DOCUMENT_LANGUAGE'
    ))
  }

  // Optional date fields validation
  if (document.date_published && !isValidDate(document.date_published as string)) {
    errors.push(createValidationError(
      'date_published',
      'Document published date must be in YYYY-MM-DD format',
      'INVALID_DOCUMENT_DATE_PUBLISHED'
    ))
  }

  if (document.date_modified && !isValidDate(document.date_modified as string)) {
    errors.push(createValidationError(
      'date_modified',
      'Document modified date must be in YYYY-MM-DD format',
      'INVALID_DOCUMENT_DATE_MODIFIED'
    ))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Email validation utility
export const validateEmail = (email: string): ValidationResult => {
  const errors: ValidationError[] = []

  if (!email || typeof email !== 'string') {
    errors.push(createValidationError(
      'email',
      'Email is required and must be a string',
      'MISSING_EMAIL'
    ))
  } else if (!isValidEmail(email)) {
    errors.push(createValidationError(
      'email',
      'Email must be a valid email address',
      'INVALID_EMAIL'
    ))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Export validation utilities
export const ValidationUtils = {
  validateSearchFilters,
  validateGetTendersRequest,
  validateTenderDocument,
  validateEmail,
  isValidDate,
  isValidEmail,
  isValidUrl
}