-- Enhanced platform statistics function
-- This migration improves the get_platform_stats function to include more detailed statistics

-- Drop and recreate the function with enhanced statistics
DROP FUNCTION IF EXISTS get_platform_stats();

CREATE OR REPLACE FUNCTION get_platform_stats()
RETURNS JSON AS $$
DECLARE
    total_count INTEGER;
    open_count INTEGER;
    closed_count INTEGER;
    cancelled_count INTEGER;
    awarded_count INTEGER;
    closing_soon_count INTEGER;
    total_value DECIMAL;
    last_updated TIMESTAMPTZ;
BEGIN
    -- Get total tender count
    SELECT COUNT(*) INTO total_count FROM tenders;
    
    -- Get counts by status
    SELECT COUNT(*) INTO open_count 
    FROM tenders 
    WHERE status = 'open';
    
    SELECT COUNT(*) INTO closed_count 
    FROM tenders 
    WHERE status = 'closed';
    
    SELECT COUNT(*) INTO cancelled_count 
    FROM tenders 
    WHERE status = 'cancelled';
    
    SELECT COUNT(*) INTO awarded_count 
    FROM tenders 
    WHERE status = 'awarded';
    
    -- Get closing soon count (within next 7 days)
    SELECT COUNT(*) INTO closing_soon_count 
    FROM tenders 
    WHERE status = 'open' 
    AND date_closing <= NOW() + INTERVAL '7 days'
    AND date_closing > NOW();
    
    -- Get total value of all open tenders
    SELECT COALESCE(SUM(value_amount), 0) INTO total_value
    FROM tenders 
    WHERE status = 'open' 
    AND value_amount IS NOT NULL;
    
    -- Get last updated timestamp
    SELECT MAX(updated_at) INTO last_updated FROM tenders;
    
    -- Return as JSON object with enhanced statistics
    RETURN json_build_object(
        'total_tenders', total_count,
        'open_tenders', open_count,
        'closed_tenders', closed_count,
        'cancelled_tenders', cancelled_count,
        'awarded_tenders', awarded_count,
        'closing_soon', closing_soon_count,
        'total_value', total_value,
        'last_updated', last_updated
    );
END;
$$ LANGUAGE plpgsql;

-- Add performance index for value calculations
CREATE INDEX IF NOT EXISTS idx_tenders_status_value ON tenders (status, value_amount) 
WHERE value_amount IS NOT NULL;

-- Add comment for documentation
COMMENT ON FUNCTION get_platform_stats() IS 'Returns enhanced platform statistics including total, status counts, closing soon tenders, total value, and last updated timestamp';
-- Add 
additional performance indexes for statistics calculations
CREATE INDEX IF NOT EXISTS idx_tenders_status_closing_date ON tenders (status, date_closing) 
WHERE status = 'open';

-- Optimize filter options query with partial index
CREATE INDEX IF NOT EXISTS idx_tenders_open_province ON tenders (province) 
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_tenders_open_industry ON tenders (industry) 
WHERE status = 'open';

-- Add materialized view for faster statistics (optional optimization)
-- This can be refreshed periodically for better performance
CREATE MATERIALIZED VIEW IF NOT EXISTS tender_stats_cache AS
SELECT 
    COUNT(*) as total_tenders,
    COUNT(*) FILTER (WHERE status = 'open') as open_tenders,
    COUNT(*) FILTER (WHERE status = 'closed') as closed_tenders,
    COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_tenders,
    COUNT(*) FILTER (WHERE status = 'awarded') as awarded_tenders,
    COUNT(*) FILTER (WHERE status = 'open' AND date_closing <= NOW() + INTERVAL '7 days' AND date_closing > NOW()) as closing_soon,
    COALESCE(SUM(value_amount) FILTER (WHERE status = 'open' AND value_amount IS NOT NULL), 0) as total_value,
    MAX(updated_at) as last_updated
FROM tenders;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_tender_stats_cache_unique ON tender_stats_cache ((1));

-- Function to refresh statistics cache
CREATE OR REPLACE FUNCTION refresh_tender_stats_cache()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY tender_stats_cache;
END;
$$ LANGUAGE plpgsql;

-- Add comment for the materialized view
COMMENT ON MATERIALIZED VIEW tender_stats_cache IS 'Cached statistics for improved performance - refresh periodically';
COMMENT ON FUNCTION refresh_tender_stats_cache() IS 'Refreshes the tender statistics cache for improved performance';