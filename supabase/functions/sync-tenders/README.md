# Sync Tenders Edge Function

This Edge Function synchronizes tender data from external OCDS (Open Contracting Data Standard) APIs into the BidBase database. It fetches tender releases, enriches them with province and industry categorization, and stores them in the PostgreSQL database.

## Features

- **OCDS API Integration**: Fetches tender data from external OCDS-compliant APIs
- **Province Mapping**: Automatically maps tender locations to South African provinces
- **Industry Categorization**: Categorizes tenders by industry using keyword matching
- **Data Enrichment**: Processes raw OCDS data into structured tender records
- **Upsert Logic**: Uses OCID as unique identifier to update existing records
- **Document Processing**: Handles tender document attachments
- **Error Handling**: Continues processing even if individual tenders fail

## API Endpoint

**POST** `/functions/v1/sync-tenders`

### Request Body

```json
{
  "limit": 100, // Optional: Number of releases to fetch (default: 100)
  "offset": 0 // Optional: Offset for pagination (default: 0)
}
```

### Response

```json
{
  "success": true,
  "data": {
    "processed_count": 95,
    "error_count": 5,
    "total_fetched": 100,
    "errors": ["Failed to process tender ocds-123: Invalid date format"]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Environment Variables

The function requires the following environment variables:

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for database access
- `OCDS_API_URL`: Base URL of the OCDS API (default: https://api.etenders.gov.za/v1)
- `OCDS_API_KEY`: Optional API key for OCDS API authentication

## Province Mapping

The function maps tender locations to South African provinces using:

1. **Buyer Address Region**: Direct province name from buyer address
2. **Buyer Address Locality**: City/town to province mapping
3. **Content Analysis**: Keywords in tender title/description
4. **Default**: "National" if no province can be determined

### Supported Provinces

- Western Cape
- Eastern Cape
- Northern Cape
- Free State
- KwaZulu-Natal
- Gauteng
- Mpumalanga
- Limpopo
- North West

## Industry Categorization

Tenders are categorized into industries using keyword matching:

### Categories

- **Construction & Infrastructure**: construction, building, infrastructure, road, bridge, etc.
- **Information Technology**: software, hardware, IT, technology, system, etc.
- **Healthcare & Medical**: medical, health, hospital, pharmaceutical, etc.
- **Education & Training**: education, school, university, training, etc.
- **Transportation & Logistics**: transport, vehicle, logistics, delivery, etc.
- **Security & Safety**: security, safety, surveillance, protection, etc.
- **Professional Services**: consulting, legal, accounting, advisory, etc.
- **Utilities & Energy**: electricity, water, energy, power, renewable, etc.
- **Food & Catering**: food, catering, meal, kitchen, nutrition, etc.
- **Office Supplies & Equipment**: office, furniture, stationery, supplies, etc.
- **Cleaning & Maintenance**: cleaning, maintenance, janitorial, etc.
- **Other**: Default category for unmatched tenders

## Data Processing

### OCDS Release Transformation

The function transforms OCDS releases into tender records with:

- **Basic Information**: Title, description, OCID
- **Buyer Details**: Name, contact information
- **Financial Data**: Value amount and currency
- **Dates**: Publication and closing dates
- **Status**: Derived from tender status and dates
- **Location**: Mapped province
- **Category**: Determined industry
- **Documents**: Associated tender documents

### Status Determination

Tender status is determined by:

1. **Cancelled**: If OCDS status is "cancelled"
2. **Awarded**: If OCDS status is "complete" or awards exist
3. **Closed**: If closing date has passed
4. **Open**: Default for active tenders

### Document Processing

Tender documents are processed and stored separately with:

- Title and description
- URL and format
- Document type
- Publication and modification dates
- Language information

## Database Operations

### Upsert Logic

The function uses PostgreSQL's UPSERT functionality:

1. **Conflict Resolution**: Uses OCID as unique identifier
2. **Update Strategy**: Replaces existing records with new data
3. **Document Handling**: Deletes old documents and inserts new ones
4. **Transaction Safety**: Each tender is processed independently

### Performance Considerations

- **Batch Processing**: Processes multiple tenders in a single request
- **Error Isolation**: Individual tender failures don't stop the entire sync
- **Logging**: Comprehensive logging for monitoring and debugging
- **Memory Management**: Processes tenders sequentially to manage memory

## Usage Examples

### Basic Sync

```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-tenders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Sync with Custom Parameters

```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-tenders \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"limit": 50, "offset": 100}'
```

## Error Handling

The function handles various error scenarios:

- **Network Errors**: OCDS API connection failures
- **Data Errors**: Invalid or malformed OCDS data
- **Database Errors**: PostgreSQL connection or query failures
- **Validation Errors**: Missing required fields

Errors are logged and included in the response for monitoring purposes.

## Testing

Run the test suite:

```bash
cd supabase/functions/sync-tenders
deno test --allow-net --allow-env
```

The tests cover:

- Province mapping logic
- Industry categorization
- Data transformation
- Status determination
- Document processing

## Monitoring

Monitor the function using:

- **Supabase Logs**: View function execution logs
- **Response Data**: Check processed/error counts
- **Database Metrics**: Monitor tender table growth
- **API Metrics**: Track OCDS API response times

## Deployment

The function is automatically deployed with Supabase CLI:

```bash
supabase functions deploy sync-tenders
```

## Scheduling

For automated synchronization, consider:

- **Cron Jobs**: Schedule regular sync operations
- **Webhooks**: Trigger sync on external events
- **Manual Execution**: Run sync as needed through API calls
