import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for the API
interface SearchFilters {
  search?: string
  province?: string
  industry?: string
  status?: 'open' | 'closed' | 'cancelled' | 'awarded'
  date_from?: string
  date_to?: string
  min_value?: number
  max_value?: number
}

interface GetTendersRequest {
  filters?: SearchFilters
  page?: number
  page_size?: number
  sort_by?: 'date_published' | 'date_closing' | 'value_amount' | 'title'
  sort_order?: 'asc' | 'desc'
}

interface ValidationError {
  field: string
  message: string
  code: string
}

interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

// Validation constants
const TENDER_STATUSES = ['open', 'closed', 'cancelled', 'awarded'] as const
const SORT_FIELDS = ['date_published', 'date_closing', 'value_amount', 'title'] as const
const SORT_ORDERS = ['asc', 'desc'] as const
const PAGE_SIZES = [12, 24, 48] as const

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

// Request validation function
const validateGetTendersRequest = (request: GetTendersRequest): ValidationResult => {
  const errors: ValidationError[] = []

  // Validate filters if provided
  if (request.filters) {
    const filters = request.filters

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
    if (filters.status && !TENDER_STATUSES.includes(filters.status)) {
      errors.push(createValidationError(
        'status',
        `Status must be one of: ${TENDER_STATUSES.join(', ')}`,
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
    if (!PAGE_SIZES.includes(request.page_size as any)) {
      errors.push(createValidationError(
        'page_size',
        `Page size must be one of: ${PAGE_SIZES.join(', ')}`,
        'INVALID_PAGE_SIZE'
      ))
    }
  }

  // Validate sort_by
  if (request.sort_by && !SORT_FIELDS.includes(request.sort_by)) {
    errors.push(createValidationError(
      'sort_by',
      `Sort field must be one of: ${SORT_FIELDS.join(', ')}`,
      'INVALID_SORT_FIELD'
    ))
  }

  // Validate sort_order
  if (request.sort_order && !SORT_ORDERS.includes(request.sort_order)) {
    errors.push(createValidationError(
      'sort_order',
      `Sort order must be one of: ${SORT_ORDERS.join(', ')}`,
      'INVALID_SORT_ORDER'
    ))
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: 'Only POST requests are allowed'
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Parse request body
    let requestBody: GetTendersRequest
    try {
      requestBody = await req.json()
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'INVALID_JSON',
            message: 'Request body must be valid JSON'
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate request
    const validation = validateGetTendersRequest(requestBody)
    if (!validation.isValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details: validation.errors
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Set defaults
    const page = requestBody.page || 1
    const pageSize = requestBody.page_size || 12
    const sortBy = requestBody.sort_by || 'date_published'
    const sortOrder = requestBody.sort_order || 'desc'
    const filters = requestBody.filters || {}

    // Calculate offset for pagination
    const offset = (page - 1) * pageSize

    // Call the search_tenders database function
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_tenders', {
        search_query: filters.search || null,
        filter_province: filters.province || null,
        filter_industry: filters.industry || null,
        filter_status: filters.status || 'open',
        date_from: filters.date_from || null,
        date_to: filters.date_to || null,
        min_value: filters.min_value || null,
        max_value: filters.max_value || null,
        sort_by: sortBy,
        sort_order: sortOrder,
        page_offset: offset,
        page_limit: pageSize
      })

    if (searchError) {
      console.error('Database search error:', searchError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to search tenders'
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get platform statistics
    const { data: statsData, error: statsError } = await supabase
      .rpc('get_platform_stats')

    if (statsError) {
      console.error('Database stats error:', statsError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to get platform statistics'
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get filter options
    const { data: filterOptions, error: filterError } = await supabase
      .rpc('get_filter_options')

    if (filterError) {
      console.error('Database filter options error:', filterError)
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to get filter options'
          },
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Process search results
    const tenders = searchResults?.map((row: any) => row.tender_data) || []
    const totalCount = searchResults?.[0]?.total_count || 0

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / pageSize)
    const hasNext = page < totalPages
    const hasPrevious = page > 1

    // Format response according to API specification
    const response = {
      success: true,
      data: {
        tenders,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          page_size: pageSize,
          total_count: totalCount,
          has_next: hasNext,
          has_previous: hasPrevious
        },
        stats: {
          total_tenders: statsData?.total_tenders || 0,
          open_tenders: statsData?.open_tenders || 0,
          closing_soon_tenders: statsData?.closing_soon || 0,
          total_value: 0, // This would need to be calculated separately if needed
          last_updated: statsData?.last_updated || new Date().toISOString()
        },
        filters: {
          provinces: filterOptions?.provinces || [],
          industries: filterOptions?.industries || [],
          statuses: [
            { value: 'open', label: 'Open', count: statsData?.open_tenders || 0 },
            { value: 'closed', label: 'Closed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'awarded', label: 'Awarded' }
          ]
        }
      },
      timestamp: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(response),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred'
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})