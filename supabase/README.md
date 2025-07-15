# Supabase Database Setup

This directory contains the database schema and migration scripts for the BidBase Tender Listing platform.

## Files Overview

- `setup_database.sql` - Complete database setup script that can be run all at once
- `migrations/001_initial_schema.sql` - Initial table creation and basic setup
- `migrations/002_indexes.sql` - Performance and search indexes
- `migrations/003_functions.sql` - Database functions for filtering and statistics

## Quick Setup

### Option 1: Complete Setup (Recommended)

Run the complete setup script in your Supabase SQL editor:

```sql
-- Copy and paste the contents of setup_database.sql into Supabase SQL editor
```

### Option 2: Step-by-Step Migration

Run the migration files in order:

1. First, run `migrations/001_initial_schema.sql`
2. Then, run `migrations/002_indexes.sql`
3. Finally, run `migrations/003_functions.sql`

## Database Schema

### Tables

#### `tenders`

Main table storing tender information with the following key columns:

- `id` - UUID primary key
- `ocid` - Unique OCDS identifier
- `title`, `description` - Tender details
- `buyer_name`, `buyer_contact_email`, `buyer_contact_phone` - Buyer information
- `province`, `industry` - Categorization fields
- `date_published`, `date_closing` - Important dates
- `status` - Tender status (open, closed, cancelled, awarded)
- `full_data` - Complete JSONB data from OCDS API

#### `tender_documents`

Documents associated with tenders:

- `tender_id` - Foreign key to tenders table
- `title`, `description` - Document details
- `url` - Document download link
- `format`, `document_type` - Document metadata

### Indexes

#### Full-Text Search

- `idx_tenders_search` - GIN index for searching across title, description, and buyer name

#### Performance Indexes

- `idx_tenders_province` - Province filtering
- `idx_tenders_industry` - Industry filtering
- `idx_tenders_status` - Status filtering
- `idx_tenders_date_closing` - Closing date sorting
- `idx_tenders_ocid` - OCID lookups

#### Composite Indexes

- `idx_tenders_status_closing` - Status + closing date queries
- `idx_tenders_province_industry` - Combined geographic and industry filtering

#### Partial Indexes

- `idx_tenders_open_closing` - Open tenders by closing date
- `idx_tenders_open_recent` - Recently published open tenders

### Functions

#### `get_platform_stats()`

Returns platform statistics as JSON:

```json
{
  "total_tenders": 1500,
  "open_tenders": 450,
  "closing_soon": 23,
  "last_updated": "2025-01-15T10:30:00Z"
}
```

#### `get_filter_options()`

Returns available filter options with counts:

```json
{
  "provinces": [
    { "value": "Western Cape", "label": "Western Cape", "count": 45 },
    { "value": "Gauteng", "label": "Gauteng", "count": 78 }
  ],
  "industries": [
    { "value": "Construction", "label": "Construction", "count": 23 },
    { "value": "IT Services", "label": "IT Services", "count": 34 }
  ]
}
```

#### `search_tenders(search_query, filter_province, filter_industry, filter_status, page_offset, page_limit)`

Advanced search function with:

- Full-text search across title, description, buyer name
- Province and industry filtering
- Status filtering
- Pagination support
- Returns tender data with associated documents

#### `upsert_tender(...)`

Inserts or updates tender data using OCID as unique identifier. Used by the sync process to maintain data consistency.

## Usage Examples

### Get Platform Statistics

```sql
SELECT get_platform_stats();
```

### Get Filter Options

```sql
SELECT get_filter_options();
```

### Search Tenders

```sql
-- Search for "construction" tenders in Western Cape
SELECT * FROM search_tenders(
  'construction',           -- search query
  'Western Cape',          -- province filter
  NULL,                    -- industry filter (all)
  'open',                  -- status filter
  0,                       -- offset (page 1)
  12                       -- limit (12 per page)
);
```

### Insert Sample Data

```sql
-- Insert a sample tender
SELECT upsert_tender(
  'ZA-SAMPLE-001',                    -- ocid
  'Road Construction Project',         -- title
  'Construction of new highway',       -- description
  'Department of Transport',           -- buyer_name
  'contact@transport.gov.za',         -- buyer_email
  '+27123456789',                     -- buyer_phone
  'Western Cape',                     -- province
  'Construction',                     -- industry
  5000000.00,                         -- value_amount
  'ZAR',                             -- value_currency
  'Electronic',                       -- submission_method
  'en',                              -- language
  NOW(),                             -- date_published
  NOW() + INTERVAL '30 days',        -- date_closing
  'open',                            -- status
  '{}'::jsonb                        -- full_data
);
```

## Performance Considerations

1. **Full-Text Search**: Uses PostgreSQL's built-in full-text search with GIN indexes for optimal performance
2. **Composite Indexes**: Optimized for common query patterns combining status, province, and industry filters
3. **Partial Indexes**: Specialized indexes for frequently accessed subsets (open tenders)
4. **JSONB Storage**: Full OCDS data stored as JSONB for flexibility while maintaining query performance

## Maintenance

### Reindexing

If search performance degrades, reindex the full-text search:

```sql
REINDEX INDEX idx_tenders_search;
```

### Statistics Update

Update table statistics for query optimization:

```sql
ANALYZE tenders;
ANALYZE tender_documents;
```

### Monitoring

Monitor index usage:

```sql
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```
