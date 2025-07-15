-- Performance and search indexes for BidBase Tender Listing
-- This migration creates all necessary indexes for optimal query performance

-- Full-text search index using GIN and tsvector for search functionality
-- This supports searching across title, description, and buyer_name fields
CREATE INDEX idx_tenders_search ON tenders USING GIN (
    to_tsvector('english', 
        COALESCE(title, '') || ' ' || 
        COALESCE(description, '') || ' ' || 
        COALESCE(buyer_name, '')
    )
);

-- Performance indexes for filtering and sorting operations
CREATE INDEX idx_tenders_province ON tenders (province);
CREATE INDEX idx_tenders_industry ON tenders (industry);
CREATE INDEX idx_tenders_status ON tenders (status);
CREATE INDEX idx_tenders_date_closing ON tenders (date_closing);
CREATE INDEX idx_tenders_date_published ON tenders (date_published);
CREATE INDEX idx_tenders_ocid ON tenders (ocid);

-- Composite indexes for common query patterns
-- Status and closing date for finding open/closing soon tenders
CREATE INDEX idx_tenders_status_closing ON tenders (status, date_closing);

-- Province and industry for combined filtering
CREATE INDEX idx_tenders_province_industry ON tenders (province, industry);

-- Status and date published for recent open tenders
CREATE INDEX idx_tenders_status_published ON tenders (status, date_published);

-- Indexes for tender_documents table
CREATE INDEX idx_tender_documents_tender_id ON tender_documents (tender_id);
CREATE INDEX idx_tender_documents_format ON tender_documents (format);
CREATE INDEX idx_tender_documents_type ON tender_documents (document_type);

-- Partial indexes for performance optimization
-- Index only open tenders for faster filtering
CREATE INDEX idx_tenders_open_closing ON tenders (date_closing) 
    WHERE status = 'open';

-- Index for recently published open tenders
CREATE INDEX idx_tenders_open_recent ON tenders (date_published DESC) 
    WHERE status = 'open';

-- Add index comments for documentation
COMMENT ON INDEX idx_tenders_search IS 'Full-text search index for title, description, and buyer name';
COMMENT ON INDEX idx_tenders_status_closing IS 'Composite index for status-based date filtering';
COMMENT ON INDEX idx_tenders_province_industry IS 'Composite index for geographic and industry filtering';
COMMENT ON INDEX idx_tenders_open_closing IS 'Partial index for open tenders by closing date';
COMMENT ON INDEX idx_tenders_open_recent IS 'Partial index for recently published open tenders';