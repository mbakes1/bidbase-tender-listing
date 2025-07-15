// Core tender-related interfaces
export interface Tender {
  id: string
  ocid: string
  title: string
  description: string
  buyer_name: string
  buyer_contact_email?: string
  buyer_contact_phone?: string
  province: string
  industry: string
  value_amount?: number
  value_currency?: string
  submission_method: string
  language: string
  date_published: string
  date_closing: string
  status: 'open' | 'closed' | 'cancelled' | 'awarded'
  documents: TenderDocument[]
  created_at: string
  updated_at: string
}

export interface TenderDocument {
  id: string
  title: string
  description?: string
  url: string
  format: string
  document_type: string
  language: string
  date_published?: string
  date_modified?: string
}

// Search and filtering interfaces
export interface SearchFilters {
  search?: string
  province?: string
  industry?: string
  status?: Tender['status']
  date_from?: string
  date_to?: string
  min_value?: number
  max_value?: number
}

export interface FilterOptions {
  provinces: Array<{
    value: string
    label: string
    count?: number
  }>
  industries: Array<{
    value: string
    label: string
    count?: number
  }>
  statuses: Array<{
    value: Tender['status']
    label: string
    count?: number
  }>
}

// Pagination interfaces
export interface PaginationInfo {
  current_page: number
  total_pages: number
  page_size: number
  total_count: number
  has_next: boolean
  has_previous: boolean
}

// Statistics interfaces
export interface PlatformStats {
  total_tenders: number
  open_tenders: number
  closing_soon_tenders: number
  total_value: number
  last_updated: string
}

// API response interfaces
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

export interface TenderListResponse {
  tenders: Tender[]
  pagination: PaginationInfo
  stats: PlatformStats
  filters: FilterOptions
}

export interface ErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, any>
  }
  timestamp: string
}

// Request interfaces
export interface GetTendersRequest {
  filters?: SearchFilters
  page?: number
  page_size?: number
  sort_by?: 'date_published' | 'date_closing' | 'value_amount' | 'title'
  sort_order?: 'asc' | 'desc'
}

// Validation schema types
export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Utility types
export type TenderStatus = Tender['status']
export type SortField = GetTendersRequest['sort_by']
export type SortOrder = GetTendersRequest['sort_order']

// Component prop types
export interface TenderCardProps {
  tender: Tender
  highlightTerms?: string[]
  onDocumentClick?: (document: TenderDocument) => void
}

export interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  isLoading?: boolean
}

export interface FilterPanelProps {
  filters: SearchFilters
  filterOptions: FilterOptions
  onChange: (filters: SearchFilters) => void
  onReset: () => void
}

export interface PaginationProps {
  pagination: PaginationInfo
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
}

export interface StatsDashboardProps {
  stats: PlatformStats
  isLoading?: boolean
}

// Hook return types
export interface UseTendersResult {
  data: TenderListResponse | undefined
  error: Error | undefined
  isLoading: boolean
  isValidating: boolean
  mutate: () => Promise<TenderListResponse | undefined>
}

export interface UseSearchResult {
  filters: SearchFilters
  updateFilters: (newFilters: Partial<SearchFilters>) => void
  resetFilters: () => void
  searchTerm: string
  setSearchTerm: (term: string) => void
  debouncedSearchTerm: string
}

// Constants and enums
export const TENDER_STATUSES = {
  OPEN: 'open',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  AWARDED: 'awarded'
} as const

export const SORT_FIELDS = {
  DATE_PUBLISHED: 'date_published',
  DATE_CLOSING: 'date_closing',
  VALUE_AMOUNT: 'value_amount',
  TITLE: 'title'
} as const

export const SORT_ORDERS = {
  ASC: 'asc',
  DESC: 'desc'
} as const

export const PAGE_SIZES = [12, 24, 48] as const

// Type guards
export const isTender = (obj: any): obj is Tender => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.ocid === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.buyer_name === 'string' &&
    typeof obj.province === 'string' &&
    typeof obj.industry === 'string' &&
    typeof obj.submission_method === 'string' &&
    typeof obj.language === 'string' &&
    typeof obj.date_published === 'string' &&
    typeof obj.date_closing === 'string' &&
    ['open', 'closed', 'cancelled', 'awarded'].includes(obj.status) &&
    Array.isArray(obj.documents) &&
    typeof obj.created_at === 'string' &&
    typeof obj.updated_at === 'string'
  )
}

export const isApiResponse = <T>(obj: any): obj is ApiResponse<T> => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.success === 'boolean' &&
    obj.data !== undefined &&
    typeof obj.timestamp === 'string'
  )
}

export const isErrorResponse = (obj: any): obj is ErrorResponse => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    obj.success === false &&
    typeof obj.error === 'object' &&
    obj.error !== null &&
    typeof obj.error.code === 'string' &&
    typeof obj.error.message === 'string' &&
    typeof obj.timestamp === 'string'
  )
}