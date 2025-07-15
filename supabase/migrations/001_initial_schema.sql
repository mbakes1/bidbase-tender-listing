-- Initial database schema for BidBase Tender Listing
-- This migration creates the core tables and indexes for the tender listing platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create tenders table with all required columns and data types
CREATE TABLE tenders (
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
CREATE TABLE tender_documents (
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
CREATE TRIGGER update_tenders_updated_at 
    BEFORE UPDATE ON tenders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE tenders IS 'Main table storing tender information from OCDS API';
COMMENT ON TABLE tender_documents IS 'Documents associated with tenders';
COMMENT ON COLUMN tenders.ocid IS 'Open Contracting Data Standard identifier - unique across all tenders';
COMMENT ON COLUMN tenders.full_data IS 'Complete JSONB data from OCDS API for extensibility';
COMMENT ON COLUMN tenders.province IS 'South African province derived from tender location data';
COMMENT ON COLUMN tenders.industry IS 'Industry category derived from tender classification';