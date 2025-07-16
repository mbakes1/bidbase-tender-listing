# Get Tenders Edge Function

This Edge Function provides a comprehensive API for searching, filtering, and retrieving tender data with enhanced statistics and filter options.

## Features

### Enhanced Statistics (Requirements 6.1-6.4)

- **Total tenders**: Complete count of all tenders in the database
- **Status breakdown**: Counts for open, closed, cancelled, and awarded tenders
- **Closing soon**: Count of tenders closing within the next 7 days
- **Total value**: Sum of all open tender values
- **Last updated**: Timestamp of the most recent data update

### Dynamic Filter Options (Requirements 2.3, 3.3)

- **Provinces**: Available South African provinces with tender counts
- **Industries**: Available industry categories with tender counts
- **Statuses**: All tender statuses with their respective counts

### Advanced Search and Filtering

- **Full-text search**: Across titles, descriptions, and buyer names
- **Geographic filtering**: By South African provinces
- **Industry filtering**: By business sector categories
- **Status filtering**: By tender status (open, closed, cancelled, awarded)
- **Date range filtering**: By publication and closing dates
- **Value range filtering**: By tender monetary value

### Performance Optimizations

- **Database indexes**: Optimized for common query patterns
- **Materialized views**: Cached statistics for improved performance
- **Partial indexes**: Specialized indexes for frequently filtered data
- **Composite indexes**: Multi-column indexes for complex queries

## API Request Format

```json
{
  "filters": {
    "search": "technology",
    "province": "Western Cape",
    "industry": "Technology",
    "status": "open",
    "date_from": "2024-01-01",
    "date_to": "2024-12-31",
    "min_value": 10000,
    "max_value": 1000000
  },
  "page": 1,
  "page_size": 12,
  "sort_by": "date_published",
  "sort_order": "desc"
}
```

## API Response Format

```json
{
  "success": true,
  "data": {
    "tenders": [...],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "page_size": 12,
      "total_count": 60,
      "has_next": true,
      "has_previous": false
    },
    "stats": {
      "total_tenders": 100,
      "open_tenders": 75,
      "closed_tenders": 15,
      "cancelled_tenders": 5,
      "awarded_tenders": 5,
      "closing_soon_tenders": 10,
      "total_value": 50000000,
      "last_updated": "2024-01-15T10:30:00Z"
    },
    "filters": {
      "provinces": [
        { "value": "Western Cape", "label": "Western Cape", "count": 25 }
      ],
      "industries": [
        { "value": "Technology", "label": "Technology", "count": 15 }
      ],
      "statuses": [
        { "value": "open", "label": "Open", "count": 75 },
        { "value": "closed", "label": "Closed", "count": 15 },
        { "value": "cancelled", "label": "Cancelled", "count": 5 },
        { "value": "awarded", "label": "Awarded", "count": 5 }
      ]
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Database Functions

### get_platform_stats()

Returns comprehensive platform statistics including:

- Total tender counts by status
- Closing soon calculations
- Total value of open tenders
- Last updated timestamp

### get_filter_options()

Returns dynamic filter options with counts:

- Available provinces with tender counts
- Available industries with tender counts
- Optimized for open tenders only

### search_tenders()

Advanced search function with:

- Full-text search capabilities
- Dynamic filtering by multiple criteria
- Pagination support
- Flexible sorting options

## Performance Features

### Database Indexes

- Full-text search index using GIN
- Status-based partial indexes
- Composite indexes for common query patterns
- Value-based indexes for calculations

### Materialized Views

- `tender_stats_cache`: Cached statistics for improved performance
- Refresh function: `refresh_tender_stats_cache()`

## Testing

Run the test suite:

```bash
deno test --allow-net test.ts
deno test --allow-net integration-test.ts
```

## Requirements Compliance

This implementation satisfies the following requirements:

- **6.1**: Display total number of tenders
- **6.2**: Display count of currently open tenders
- **6.3**: Show tenders closing within next 7 days
- **6.4**: Show last updated timestamp
- **2.3**: Display tender count for each province
- **3.3**: Display tender count for each industry category
- **8.1**: Use appropriate database indexes
- **8.2**: Use GIN indexes for full-text search
