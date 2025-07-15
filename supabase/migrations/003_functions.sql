-- Database functions for filtering and statistics calculations
-- This migration creates reusable functions for common operations

-- Function to get platform statistics
CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
    total_count INTEGER;
    open_count INTEGER;
    closing_soon_count INTEGER;
    last_updated TIMESTAMPTZ;
BEGIN
    -- Get total tender count
    SELECT COUNT(*) INTO total_count FROM tenders;
    
    -- Get open tender count
    SELECT COUNT(*) INTO open_count 
    FROM tenders 
    WHERE status = 'open';
    
    -- Get closing soon count (within next 7 days)
    SELECT COUNT(*) INTO closing_soon_count 
    FROM tenders 
    WHERE status = 'open' 
    AND date_closing <= NOW() + INTERVAL '7 days'
    AND date_closing > NOW();
    
    -- Get last updated timestamp
    SELECT MAX(updated_at) INTO last_updated FROM tenders;
    
    -- Return as JSON object
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
    -- Get province options with counts
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
    
    -- Get industry options with counts
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
    
    -- Return combined filter options
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
    date_from DATE DEFAULT NULL,
    date_to DATE DEFAULT NULL,
    min_value DECIMAL DEFAULT NULL,
    max_value DECIMAL DEFAULT NULL,
    sort_by TEXT DEFAULT 'date_published',
    sort_order TEXT DEFAULT 'desc',
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
    order_clause TEXT;
    where_conditions TEXT[] := ARRAY[]::TEXT[];
    total_records BIGINT;
BEGIN
    -- Build WHERE conditions dynamically
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
    
    -- Add date range filtering
    IF date_from IS NOT NULL THEN
        where_conditions := array_append(where_conditions, format('date_published >= %L', date_from));
    END IF;
    
    IF date_to IS NOT NULL THEN
        where_conditions := array_append(where_conditions, format('date_published <= %L', date_to));
    END IF;
    
    -- Add value range filtering
    IF min_value IS NOT NULL THEN
        where_conditions := array_append(where_conditions, format('value_amount >= %L', min_value));
    END IF;
    
    IF max_value IS NOT NULL THEN
        where_conditions := array_append(where_conditions, format('value_amount <= %L', max_value));
    END IF;
    
    -- Build the base WHERE clause
    IF array_length(where_conditions, 1) > 0 THEN
        base_query := 'WHERE ' || array_to_string(where_conditions, ' AND ');
    ELSE
        base_query := '';
    END IF;
    
    -- Build ORDER BY clause with validation
    CASE sort_by
        WHEN 'date_published' THEN order_clause := 'ORDER BY t.date_published';
        WHEN 'date_closing' THEN order_clause := 'ORDER BY t.date_closing';
        WHEN 'value_amount' THEN order_clause := 'ORDER BY t.value_amount';
        WHEN 'title' THEN order_clause := 'ORDER BY t.title';
        ELSE order_clause := 'ORDER BY t.date_published';
    END CASE;
    
    -- Add sort order
    IF sort_order = 'asc' THEN
        order_clause := order_clause || ' ASC';
    ELSE
        order_clause := order_clause || ' DESC';
    END IF;
    
    -- Get total count
    count_query := format('SELECT COUNT(*) FROM tenders %s', base_query);
    EXECUTE count_query INTO total_records;
    
    -- Return paginated results with tender data and documents
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
        %s
        LIMIT %s OFFSET %s',
        total_records,
        base_query,
        order_clause,
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

-- Add function comments for documentation
COMMENT ON FUNCTION get_platform_stats() IS 'Returns platform statistics including total, open, and closing soon tender counts';
COMMENT ON FUNCTION get_filter_options() IS 'Returns available filter options with counts for provinces and industries';
COMMENT ON FUNCTION search_tenders(TEXT, TEXT, TEXT, TEXT, DATE, DATE, DECIMAL, DECIMAL, TEXT, TEXT, INTEGER, INTEGER) IS 'Advanced search function with filtering, pagination, full-text search, date range, value range, and sorting';
COMMENT ON FUNCTION upsert_tender(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, TEXT, TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, JSONB) IS 'Upserts tender data using OCID as unique identifier';