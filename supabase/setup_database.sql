-- Complete database setup script for BidBase Tender Listing
-- This script can be run to set up the entire database schema from scratch
-- Run this script in your Supabase SQL editor or via psql

-- ============================================================================
-- INITIAL SCHEMA SETUP
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tenders table with all required columns and data types
CREATE TABLE IF NOT EXISTS tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ocid TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    buyer_name TEXT NOT NULL,
    buyer_contact_email TEXT,
    buyer_contact_phone TEXT,
    province TEXT NOT NULL,
    industry TEXT NOT NULL,
    value_amount DECIMAL,
    value_currency TEXT DEFAULT 'ZAR',
    submission_method TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    date_published TIMESTAMPTZ NOT NULL,
    date_closing TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('open', 'closed', 'cancelled', 'awarded')) DEFAULT 'open',
    full_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tender_documents table for document attachments
CREATE TABLE IF NOT EXISTS tender_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID REFERENCES tenders(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    format TEXT NOT NULL,
    document_type TEXT NOT NULL,
    language TEXT DEFAULT 'en',
    date_published TIMESTAMPTZ,
    date_modified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for tenders table
DROP TRIGGER IF EXISTS update_tenders_updated_at ON tenders;
CREATE TRIGGER update_tenders_updated_at 
    BEFORE UPDATE ON tenders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Full-text search index using GIN and tsvector for search functionality
DROP INDEX IF EXISTS idx_tenders_search;
CREATE INDEX idx_tenders_search ON tenders USING GIN (
    to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(buyer_name, '')
    )
);

-- Performance indexes for filtering and sorting operations
CREATE INDEX IF NOT EXISTS idx_tenders_province ON tenders (province);
CREATE INDEX IF NOT EXISTS idx_tenders_industry ON tenders (industry);
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders (status);
CREATE INDEX IF NOT EXISTS idx_tenders_date_closing ON tenders (date_closing);
CREATE INDEX IF NOT EXISTS idx_tenders_date_published ON tenders (date_published);
CREATE INDEX IF NOT EXISTS idx_tenders_ocid ON tenders (ocid);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tenders_status_closing ON tenders (status, date_closing);
CREATE INDEX IF NOT EXISTS idx_tenders_province_industry ON tenders (province, industry);
CREATE INDEX IF NOT EXISTS idx_tenders_status_published ON tenders (status, date_published);

-- Indexes for tender_documents table
CREATE INDEX IF NOT EXISTS idx_tender_documents_tender_id ON tender_documents (tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_documents_format ON tender_documents (format);
CREATE INDEX IF NOT EXISTS idx_tender_documents_type ON tender_documents (document_type);

-- Partial indexes for performance optimization
DROP INDEX IF EXISTS idx_tenders_open_closing;
CREATE INDEX idx_tenders_open_closing ON tenders (date_closing) 
    WHERE status = 'open';

DROP INDEX IF EXISTS idx_tenders_open_recent;
CREATE INDEX idx_tenders_open_recent ON tenders (date_published DESC) 
    WHERE status = 'open';

-- ============================================================================
-- DATABASE FUNCTIONS
-- ============================================================================

-- Function to get platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
    total_count INTEGER;
    open_count INTEGER;
    closing_soon_count INTEGER;
    last_updated TIMESTAMPTZ;
BEGIN
    SELECT COUNT(*) INTO total_count FROM tenders;
    SELECT COUNT(*) INTO open_count FROM tenders WHERE status = 'open';
    SELECT COUNT(*) INTO closing_soon_count 
    FROM tenders 
    WHERE status = 'open' 
    AND date_closing <= NOW() + INTERVAL '7 days'
    AND date_closing > NOW();
    SELECT MAX(updated_at) INTO last_updated FROM tenders;
    
    RETURN json_build_object(
        'total_tenders', total_count,
        'open_tenders', open_count,
        'closing_soon', closing_soon_count,
        'last_updated', last_updated
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get filter options with counts
CREATE OR REPLACE FUNCTION get_filter_options()
RETURNS JSON AS $$
DECLARE
    provinces JSON;
    industries JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'value', province,
            'label', province,
            'count', count
        ) ORDER BY province
    ) INTO provinces
    FROM (
        SELECT province, COUNT(*) as count
        FROM tenders
        WHERE status = 'open'
        GROUP BY province
    ) p;
    
    SELECT json_agg(
        json_build_object(
            'value', industry,
            'label', industry,
            'count', count
        ) ORDER BY industry
    ) INTO industries
    FROM (
        SELECT industry, COUNT(*) as count
        FROM tenders
        WHERE status = 'open'
        GROUP BY industry
    ) i;
    
    RETURN json_build_object(
        'provinces', provinces,
        'industries', industries
    );
END;
$$ LANGUAGE plpgsql;

-- Function for advanced tender search with filters
CREATE OR REPLACE FUNCTION search_tenders(
    search_query TEXT DEFAULT NULL,
    filter_province TEXT DEFAULT NULL,
    filter_industry TEXT DEFAULT NULL,
    filter_status TEXT DEFAULT 'open',
    page_offset INTEGER DEFAULT 0,
    page_limit INTEGER DEFAULT 12
)
RETURNS TABLE(
    tender_data JSON,
    total_count BIGINT
) AS $$
DECLARE
    base_query TEXT;
    count_query TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    total_records BIGINT;
BEGIN
    IF filter_status IS NOT NULL THEN
        where_conditions := array_append(where_conditions, format('status = %L', filter_status));
    END IF;
    
    IF filter_province IS NOT NULL AND filter_province != 'all' THEN
        where_conditions := array_append(where_conditions, format('province = %L', filter_province));
    END IF;
    
    IF filter_industry IS NOT NULL AND filter_industry != 'all' THEN
        where_conditions := array_append(where_conditions, format('industry = %L', filter_industry));
    END IF;
    
    IF search_query IS NOT NULL AND search_query != '' THEN
        where_conditions := array_append(where_conditions, 
            format('to_tsvector(''english'', COALESCE(title, '''') || '' '' || COALESCE(description, '''') || '' '' || COALESCE(buyer_name, '''')) @@ plainto_tsquery(''english'', %L)', search_query));
    END IF;
    
    IF array_length(where_conditions, 1) > 0 THEN
        base_query := 'WHERE ' || array_to_string(where_conditions, ' AND ');
    ELSE
        base_query := '';
    END IF;
    
    count_query := format('SELECT COUNT(*) FROM tenders %s', base_query);
    EXECUTE count_query INTO total_records;
    
    RETURN QUERY EXECUTE format('
        SELECT 
            json_build_object(
                ''id'', t.id,
                ''ocid'', t.ocid,
                ''title'', t.title,
                ''description'', t.description,
                ''buyer_name'', t.buyer_name,
                ''buyer_contact_email'', t.buyer_contact_email,
                ''buyer_contact_phone'', t.buyer_contact_phone,
                ''province'', t.province,
                ''industry'', t.industry,
                ''value_amount'', t.value_amount,
                ''value_currency'', t.value_currency,
                ''submission_method'', t.submission_method,
                ''language'', t.language,
                ''date_published'', t.date_published,
                ''date_closing'', t.date_closing,
                ''status'', t.status,
                ''documents'', COALESCE(docs.documents, ''[]''::json),
                ''created_at'', t.created_at,
                ''updated_at'', t.updated_at
            ) as tender_data,
            %L::BIGINT as total_count
        FROM tenders t
        LEFT JOIN (
            SELECT 
                tender_id,
                json_agg(
                    json_build_object(
                        ''id'', id,
                        ''title'', title,
                        ''description'', description,
                        ''url'', url,
                        ''format'', format,
                        ''document_type'', document_type,
                        ''language'', language,
                        ''date_published'', date_published,
                        ''date_modified'', date_modified
                    )
                ) as documents
            FROM tender_documents
            GROUP BY tender_id
        ) docs ON t.id = docs.tender_id
        %s
        ORDER BY t.date_published DESC
        LIMIT %s OFFSET %s',
        total_records,
        base_query,
        page_limit,
        page_offset
    );
END;
$$ LANGUAGE plpgsql;

-- Function to upsert tender data (for sync operations)
CREATE OR REPLACE FUNCTION upsert_tender(
    p_ocid TEXT,
    p_title TEXT,
    p_description TEXT,
    p_buyer_name TEXT,
    p_buyer_contact_email TEXT,
    p_buyer_contact_phone TEXT,
    p_province TEXT,
    p_industry TEXT,
    p_value_amount DECIMAL,
    p_value_currency TEXT,
    p_submission_method TEXT,
    p_language TEXT,
    p_date_published TIMESTAMPTZ,
    p_date_closing TIMESTAMPTZ,
    p_status TEXT,
    p_full_data JSONB
)
RETURNS UUID AS $$
DECLARE
    tender_id UUID;
BEGIN
    INSERT INTO tenders (
        ocid, title, description, buyer_name, buyer_contact_email, buyer_contact_phone,
        province, industry, value_amount, value_currency, submission_method, language,
        date_published, date_closing, status, full_data
    ) VALUES (
        p_ocid, p_title, p_description, p_buyer_name, p_buyer_contact_email, p_buyer_contact_phone,
        p_province, p_industry, p_value_amount, p_value_currency, p_submission_method, p_language,
        p_date_published, p_date_closing, p_status, p_full_data
    )
    ON CONFLICT (ocid) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        buyer_name = EXCLUDED.buyer_name,
        buyer_contact_email = EXCLUDED.buyer_contact_email,
        buyer_contact_phone = EXCLUDED.buyer_contact_phone,
        province = EXCLUDED.province,
        industry = EXCLUDED.industry,
        value_amount = EXCLUDED.value_amount,
        value_currency = EXCLUDED.value_currency,
        submission_method = EXCLUDED.submission_method,
        language = EXCLUDED.language,
        date_published = EXCLUDED.date_published,
        date_closing = EXCLUDED.date_closing,
        status = EXCLUDED.status,
        full_data = EXCLUDED.full_data,
        updated_at = NOW()
    RETURNING id INTO tender_id;
    
    RETURN tender_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE tenders IS 'Main table storing tender information from OCDS API';
COMMENT ON TABLE tender_documents IS 'Documents associated with tenders';
COMMENT ON COLUMN tenders.ocid IS 'Open Contracting Data Standard identifier - unique across all tenders';
COMMENT ON COLUMN tenders.full_data IS 'Complete JSONB data from OCDS API for extensibility';
COMMENT ON COLUMN tenders.province IS 'South African province derived from tender location data';
COMMENT ON COLUMN tenders.industry IS 'Industry category derived from tender classification';

COMMENT ON INDEX idx_tenders_search IS 'Full-text search index for title, description, and buyer name';
COMMENT ON INDEX idx_tenders_status_closing IS 'Composite index for status-based date filtering';
COMMENT ON INDEX idx_tenders_province_industry IS 'Composite index for geographic and industry filtering';
COMMENT ON INDEX idx_tenders_open_closing IS 'Partial index for open tenders by closing date';
COMMENT ON INDEX idx_tenders_open_recent IS 'Partial index for recently published open tenders';

COMMENT ON FUNCTION get_platform_stats() IS 'Returns platform statistics including total, open, and closing soon tender counts';
COMMENT ON FUNCTION get_filter_options() IS 'Returns available filter options with counts for provinces and industries';
COMMENT ON FUNCTION search_tenders(TEXT, TEXT, TEXT, TEXT, INTEGER, INTEGER) IS 'Advanced search function with filtering, pagination, and full-text search';
COMMENT ON FUNCTION upsert_tender(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, JSONB) IS 'Upserts tender data using OCID as unique identifier';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE 'BidBase Tender Listing database schema setup completed successfully!';
    RAISE NOTICE 'Tables created: tenders, tender_documents';
    RAISE NOTICE 'Indexes created: Full-text search, performance, and composite indexes';
    RAISE NOTICE 'Functions created: get_platform_stats, get_filter_options, search_tenders, upsert_tender';
END $$;