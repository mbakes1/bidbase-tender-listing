# get-tenders Edge Function

This Supabase Edge Function provides a comprehensive API endpoint for searching and filtering tender opportunities with advanced features including full-text search, pagination, sorting, and filtering capabilities.

## Endpoint

**POST** `/functions/v1/get-tenders`

## Request Format

```json
{
  "filters": {
    "search": "string (optional) - Full-text search across title, description, and buyer name",
    "province": "string (optional) - Filter by South African province",
    "industry": "string (optional) - Filter by industry category",
    "status": "string (optional) - Filter by tender status: 'open', 'closed', 'cancelled', 'awarded'",
    "date_from": "string (optional) - Filter tenders published from this date (YYYY-MM-DD)",
    "date_to": "string (optional) - Filter tenders published until this date (YYYY-MM-DD)",
    "min_value": "number (optional) - Minimum tender value",
    "max_value": "number (optional) - Maximum tender value"
  },
  "page": "number (optional, default: 1) - Page number for pagination",
  "page_size": "number (optional, default: 12) - Number of results per page (12, 24, or 48)",
  "sort_by": "string (optional, default: 'date_published') - Sort field: 'date_published', 'date_closing', 'value_amount', 'title'",
  "sort_order": "string (optional, default: 'desc') - Sort order: 'asc' or 'desc'"
}
```

## Response Format

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "tenders": [
      {
        "id": "uuid",
        "ocid": "string",
        "title": "string",
        "description": "string",
        "buyer_name": "string",
        "buyer_contact_email": "string",
        "buyer_contact_phone": "string",
        "province": "string",
        "industry": "string",
        "value_amount": "number",
        "value_currency": "string",
        "submission_method": "string",
        "language": "string",
        "date_published": "ISO 8601 datetime",
        "date_closing": "ISO 8601 datetime",
        "status": "string",
        "documents": [
          {
            "id": "uuid",
            "title": "string",
            "description": "string",
            "url": "string",
            "format": "string",
            "document_type": "string",
            "language": "string",
            "date_published": "ISO 8601 datetime",
            "date_modified": "ISO 8601 datetime"
          }
        ],
        "created_at": "ISO 8601 datetime",
        "updated_at": "ISO 8601 datetime"
      }
    ],
    "pagination": {
      "current_page": "number",
      "total_pages": "number",
      "page_size": "number",
      "total_count": "number",
      "has_next": "boolean",
      "has_previous": "boolean"
    },
    "stats": {
      "total_tenders": "number",
      "open_tenders": "number",
      "closing_soon_tenders": "number",
      "total_value": "number",
      "last_updated": "ISO 8601 datetime"
    },
    "filters": {
      "provinces": [
        {
          "value": "string",
          "label": "string",
          "count": "number"
        }
      ],
      "industries": [
        {
          "value": "string",
          "label": "string",
          "count": "number"
        }
      ],
      "statuses": [
        {
          "value": "string",
          "label": "string",
          "count": "number"
        }
      ]
    }
  },
  "timestamp": "ISO 8601 datetime"
}
```

### Error Response (400/500)

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  },
  "timestamp": "ISO 8601 datetime"
}
```

## Features

### Full-Text Search

- Searches across tender titles, descriptions, and buyer names
- Uses PostgreSQL's full-text search with GIN indexes for performance
- Supports complex search queries

### Advanced Filtering

- **Province filtering**: Filter by South African provinces
- **Industry filtering**: Filter by categorized industries
- **Status filtering**: Filter by tender status (open, closed, cancelled, awarded)
- **Date range filtering**: Filter by publication date range
- **Value range filtering**: Filter by tender value range

### Pagination

- Configurable page sizes: 12, 24, or 48 results per page
- Complete pagination metadata including total counts and navigation flags
- Efficient LIMIT/OFFSET implementation

### Sorting

- Sort by publication date, closing date, value amount, or title
- Ascending or descending order
- Database-level sorting for performance

### Performance Optimizations

- Database indexes on all filterable fields
- GIN indexes for full-text search
- Composite indexes for common query patterns
- Efficient query construction with dynamic WHERE clauses

## Validation

The function performs comprehensive request validation:

- **Search term**: Maximum 500 characters
- **Page**: Must be positive integer
- **Page size**: Must be 12, 24, or 48
- **Sort fields**: Must be valid field names
- **Sort order**: Must be 'asc' or 'desc'
- **Dates**: Must be in YYYY-MM-DD format
- **Date ranges**: From date cannot be after to date
- **Value ranges**: Must be non-negative numbers, min cannot exceed max
- **Status**: Must be valid tender status

## Error Codes

- `METHOD_NOT_ALLOWED`: Only POST requests are accepted
- `INVALID_JSON`: Request body is not valid JSON
- `VALIDATION_ERROR`: Request validation failed (includes detailed field errors)
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

## Example Usage

### Basic Search

```bash
curl -X POST https://your-project.supabase.co/functions/v1/get-tenders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "filters": {
      "search": "construction",
      "province": "Western Cape",
      "status": "open"
    },
    "page": 1,
    "page_size": 24
  }'
```

### Advanced Filtering

```bash
curl -X POST https://your-project.supabase.co/functions/v1/get-tenders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "filters": {
      "search": "IT services",
      "province": "Gauteng",
      "industry": "Technology",
      "date_from": "2024-01-01",
      "date_to": "2024-12-31",
      "min_value": 100000,
      "max_value": 1000000
    },
    "page": 1,
    "page_size": 12,
    "sort_by": "value_amount",
    "sort_order": "desc"
  }'
```

## Database Dependencies

This function relies on the following database functions:

- `search_tenders()`: Main search and filtering logic
- `get_platform_stats()`: Platform statistics calculation
- `get_filter_options()`: Available filter options with counts

Ensure all database migrations are applied before using this function.

## Testing

Run the included tests with:

```bash
deno test --allow-net test.ts
```

## CORS Support

The function includes CORS headers to support browser-based requests from any origin. In production, consider restricting the `Access-Control-Allow-Origin` header to your specific domain.
