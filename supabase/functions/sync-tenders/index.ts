/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Types for OCDS API data
interface OCDSRelease {
  ocid: string
  id: string
  date: string
  tag: string[]
  initiationType: string
  parties: OCDSParty[]
  buyer: OCDSBuyer
  planning?: OCDSPlanning
  tender: OCDSTender
  awards?: OCDSAward[]
  contracts?: OCDSContract[]
}

interface OCDSParty {
  id: string
  name: string
  identifier?: {
    scheme: string
    id: string
    legalName?: string
  }
  address?: {
    streetAddress?: string
    locality?: string
    region?: string
    postalCode?: string
    countryName?: string
  }
  contactPoint?: {
    name?: string
    email?: string
    telephone?: string
  }
  roles: string[]
}

interface OCDSBuyer {
  id: string
  name: string
}

interface OCDSPlanning {
  rationale?: string
  documents?: OCDSDocument[]
}

interface OCDSTender {
  id: string
  title: string
  description?: string
  status: string
  items?: OCDSItem[]
  value?: {
    amount: number
    currency: string
  }
  procurementMethod?: string
  procurementMethodDetails?: string
  submissionMethod?: string[]
  submissionMethodDetails?: string
  tenderPeriod?: {
    startDate?: string
    endDate?: string
  }
  enquiryPeriod?: {
    startDate?: string
    endDate?: string
  }
  hasEnquiries?: boolean
  eligibilityCriteria?: string
  awardCriteria?: string
  awardCriteriaDetails?: string
  documents?: OCDSDocument[]
}

interface OCDSItem {
  id: string
  description?: string
  classification?: {
    scheme: string
    id: string
    description: string
  }
  additionalClassifications?: Array<{
    scheme: string
    id: string
    description: string
  }>
  quantity?: number
  unit?: {
    name: string
    value?: {
      amount: number
      currency: string
    }
  }
}

interface OCDSDocument {
  id: string
  documentType: string
  title: string
  description?: string
  url: string
  datePublished?: string
  dateModified?: string
  format: string
  language?: string
}

interface OCDSAward {
  id: string
  title?: string
  description?: string
  status: string
  date?: string
  value?: {
    amount: number
    currency: string
  }
  suppliers?: OCDSParty[]
  items?: OCDSItem[]
  contractPeriod?: {
    startDate?: string
    endDate?: string
  }
  documents?: OCDSDocument[]
}

interface OCDSContract {
  id: string
  awardID: string
  title?: string
  description?: string
  status: string
  period?: {
    startDate?: string
    endDate?: string
  }
  value?: {
    amount: number
    currency: string
  }
  dateSigned?: string
  documents?: OCDSDocument[]
}

// Province mapping based on South African provinces
const PROVINCE_MAPPING: Record<string, string> = {
  // Full province names
  'western cape': 'Western Cape',
  'eastern cape': 'Eastern Cape',
  'northern cape': 'Northern Cape',
  'free state': 'Free State',
  'kwazulu-natal': 'KwaZulu-Natal',
  'kwazulu natal': 'KwaZulu-Natal',
  'gauteng': 'Gauteng',
  'mpumalanga': 'Mpumalanga',
  'limpopo': 'Limpopo',
  'north west': 'North West',
  'northwest': 'North West',
  
  // Major cities to province mapping
  'cape town': 'Western Cape',
  'durban': 'KwaZulu-Natal',
  'johannesburg': 'Gauteng',
  'pretoria': 'Gauteng',
  'tshwane': 'Gauteng',
  'port elizabeth': 'Eastern Cape',
  'gqeberha': 'Eastern Cape',
  'bloemfontein': 'Free State',
  'kimberley': 'Northern Cape',
  'polokwane': 'Limpopo',
  'nelspruit': 'Mpumalanga',
  'mbombela': 'Mpumalanga',
  'mafikeng': 'North West',
  'pietermaritzburg': 'KwaZulu-Natal',
  
  // Common abbreviations
  'wc': 'Western Cape',
  'ec': 'Eastern Cape',
  'nc': 'Northern Cape',
  'fs': 'Free State',
  'kzn': 'KwaZulu-Natal',
  'gp': 'Gauteng',
  'mp': 'Mpumalanga',
  'lp': 'Limpopo',
  'nw': 'North West'
}

// Industry categorization keywords
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Construction & Infrastructure': [
    'construction', 'building', 'infrastructure', 'road', 'bridge', 'housing',
    'civil engineering', 'structural', 'concrete', 'steel', 'architecture',
    'renovation', 'maintenance', 'repair', 'plumbing', 'electrical', 'roofing'
  ],
  'Information Technology': [
    'software', 'hardware', 'computer', 'IT', 'technology', 'system',
    'network', 'database', 'programming', 'development', 'website',
    'application', 'digital', 'cyber', 'cloud', 'server', 'telecommunications'
  ],
  'Healthcare & Medical': [
    'medical', 'health', 'hospital', 'clinic', 'pharmaceutical', 'medicine',
    'equipment', 'surgical', 'diagnostic', 'therapy', 'nursing', 'dental',
    'laboratory', 'radiology', 'ambulance', 'emergency'
  ],
  'Education & Training': [
    'education', 'school', 'university', 'training', 'learning', 'teaching',
    'curriculum', 'textbook', 'classroom', 'student', 'academic', 'research',
    'library', 'educational', 'course', 'workshop'
  ],
  'Transportation & Logistics': [
    'transport', 'vehicle', 'fleet', 'logistics', 'delivery', 'shipping',
    'freight', 'cargo', 'bus', 'truck', 'aviation', 'railway', 'maritime',
    'fuel', 'maintenance', 'parts'
  ],
  'Security & Safety': [
    'security', 'safety', 'guard', 'surveillance', 'alarm', 'protection',
    'fire', 'emergency', 'rescue', 'police', 'enforcement', 'monitoring',
    'access control', 'CCTV', 'patrol'
  ],
  'Professional Services': [
    'consulting', 'advisory', 'legal', 'accounting', 'audit', 'financial',
    'management', 'strategy', 'planning', 'analysis', 'research',
    'professional', 'expertise', 'specialist'
  ],
  'Utilities & Energy': [
    'electricity', 'water', 'gas', 'energy', 'power', 'utility', 'renewable',
    'solar', 'wind', 'generator', 'transmission', 'distribution', 'meter',
    'infrastructure', 'grid'
  ],
  'Food & Catering': [
    'food', 'catering', 'meal', 'kitchen', 'restaurant', 'nutrition',
    'beverage', 'cooking', 'dining', 'cafeteria', 'supply', 'grocery'
  ],
  'Office Supplies & Equipment': [
    'office', 'furniture', 'stationery', 'equipment', 'supplies', 'paper',
    'printing', 'copier', 'desk', 'chair', 'filing', 'storage'
  ],
  'Cleaning & Maintenance': [
    'cleaning', 'maintenance', 'janitorial', 'housekeeping', 'sanitation',
    'waste', 'hygiene', 'pest control', 'landscaping', 'gardening'
  ],
  'Other': []
}

// OCDS API client
class OCDSClient {
  private baseUrl: string
  private apiKey?: string

  constructor(baseUrl: string, apiKey?: string) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
  }

  async fetchReleases(pageNumber = 1, pageSize = 100): Promise<OCDSRelease[]> {
    const url = new URL(`${this.baseUrl}/api/OCDSReleases`);
    url.searchParams.set('PageNumber', pageNumber.toString());
    url.searchParams.set('PageSize', pageSize.toString());

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'User-Agent': 'BidBase-Sync/1.0'
    }

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    }

    try {
      const response = await fetch(url.toString(), { headers })
      
      if (!response.ok) {
        throw new Error(`OCDS API error: ${response.status} ${response.statusText}`)
      }

      const releasePackage = await response.json()
      return releasePackage.releases || []
    } catch (error) {
      console.error('Failed to fetch OCDS releases:', error)
      throw error
    }
  }
}

// Province mapping function
function mapProvince(release: OCDSRelease): string {
  // Check buyer address
  const buyer = release.parties?.find(party => party.roles.includes('buyer'))
  if (buyer?.address?.region) {
    const region = buyer.address.region.toLowerCase().trim()
    if (PROVINCE_MAPPING[region]) {
      return PROVINCE_MAPPING[region]
    }
  }

  // Check buyer address locality
  if (buyer?.address?.locality) {
    const locality = buyer.address.locality.toLowerCase().trim()
    if (PROVINCE_MAPPING[locality]) {
      return PROVINCE_MAPPING[locality]
    }
  }

  // Check tender title and description for location keywords
  const searchText = `${release.tender.title} ${release.tender.description || ''}`.toLowerCase()
  
  for (const [key, province] of Object.entries(PROVINCE_MAPPING)) {
    if (searchText.includes(key)) {
      return province
    }
  }

  // Default to National if no province can be determined
  return 'National'
}

// Industry categorization function
function categorizeIndustry(release: OCDSRelease): string {
  const searchText = `${release.tender.title} ${release.tender.description || ''}`.toLowerCase()
  
  // Check tender items classifications first
  if (release.tender.items) {
    for (const item of release.tender.items) {
      if (item.classification?.description) {
        const classificationText = item.classification.description.toLowerCase()
        
        for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
          if (industry === 'Other') continue
          
          for (const keyword of keywords) {
            if (classificationText.includes(keyword)) {
              return industry
            }
          }
        }
      }
    }
  }

  // Check title and description
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (industry === 'Other') continue
    
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        return industry
      }
    }
  }

  return 'Other'
}

// Transform OCDS release to tender record
function transformRelease(release: OCDSRelease): any {
  const buyer = release.parties?.find(party => party.roles.includes('buyer'))
  const province = mapProvince(release)
  const industry = categorizeIndustry(release)

  // Determine status
  let status = 'open'
  if (release.tender.status === 'cancelled') {
    status = 'cancelled'
  } else if (release.tender.status === 'complete' || (release.awards && release.awards.length > 0)) {
    status = 'awarded'
  } else if (release.tender.tenderPeriod?.endDate) {
    const closingDate = new Date(release.tender.tenderPeriod.endDate)
    if (closingDate < new Date()) {
      status = 'closed'
    }
  }

  // Extract documents
  const documents = release.tender.documents || []

  return {
    ocid: release.ocid,
    title: release.tender.title,
    description: release.tender.description || null,
    buyer_name: buyer?.name || release.buyer.name,
    buyer_contact_email: buyer?.contactPoint?.email || null,
    buyer_contact_phone: buyer?.contactPoint?.telephone || null,
    province,
    industry,
    value_amount: release.tender.value?.amount || null,
    value_currency: release.tender.value?.currency || 'ZAR',
    submission_method: release.tender.submissionMethod?.join(', ') || 'Not specified',
    language: 'en',
    date_published: release.date,
    date_closing: release.tender.tenderPeriod?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status,
    full_data: release,
    documents: documents.map(doc => ({
      title: doc.title,
      description: doc.description || null,
      url: doc.url,
      format: doc.format,
      document_type: doc.documentType,
      language: doc.language || 'en',
      date_published: doc.datePublished || null,
      date_modified: doc.dateModified || null
    }))
  }
}

// Upsert tender function
async function upsertTender(supabase: any, tenderData: any): Promise<void> {
  const { documents, ...tender } = tenderData

  // Upsert tender record
  const { data: upsertedTender, error: tenderError } = await supabase
    .from('tenders')
    .upsert(tender, { 
      onConflict: 'ocid',
      ignoreDuplicates: false 
    })
    .select('id')
    .single()

  if (tenderError) {
    console.error(`Failed to upsert tender ${tender.ocid}:`, tenderError)
    throw tenderError
  }

  const tenderId = upsertedTender.id

  // Delete existing documents for this tender
  const { error: deleteError } = await supabase
    .from('tender_documents')
    .delete()
    .eq('tender_id', tenderId)

  if (deleteError) {
    console.error(`Failed to delete existing documents for tender ${tender.ocid}:`, deleteError)
  }

  // Insert new documents
  if (documents && documents.length > 0) {
    const documentsWithTenderId = documents.map((doc: any) => ({
      ...doc,
      tender_id: tenderId
    }))

    const { error: documentsError } = await supabase
      .from('tender_documents')
      .insert(documentsWithTenderId)

    if (documentsError) {
      console.error(`Failed to insert documents for tender ${tender.ocid}:`, documentsError)
    }
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
    // Parse request body for configuration
    let config: { pageSize?: number; pageNumber?: number } = {}
    try {
      config = await req.json()
    } catch {
      // Use defaults if no body provided
    }

    const pageSize = config.pageSize || 100
    const pageNumber = config.pageNumber || 1

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Initialize OCDS client
    const ocdsUrl = Deno.env.get('OCDS_API_URL') || 'https://api.etenders.gov.za/v1'
    const ocdsApiKey = Deno.env.get('OCDS_API_KEY')
    const ocdsClient = new OCDSClient(ocdsUrl, ocdsApiKey)

    console.log(`Starting sync: fetching page ${pageNumber} with size ${pageSize}`)

    // Fetch releases from OCDS API
    const releases = await ocdsClient.fetchReleases(pageNumber, pageSize)
    console.log(`Fetched ${releases.length} releases from OCDS API`)

    let processedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each release
    for (const release of releases) {
      try {
        const tenderData = transformRelease(release)
        await upsertTender(supabase, tenderData)
        processedCount++
        
        if (processedCount % 10 === 0) {
          console.log(`Processed ${processedCount}/${releases.length} tenders`)
        }
      } catch (error) {
        errorCount++
        const errorMessage = `Failed to process tender ${release.ocid}: ${error instanceof Error ? error.message : String(error)}`
        console.error(errorMessage)
        errors.push(errorMessage)
        
        // Continue processing other tenders even if one fails
        continue
      }
    }

    console.log(`Sync completed: ${processedCount} processed, ${errorCount} errors`)

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          processed_count: processedCount,
          error_count: errorCount,
          total_fetched: releases.length,
          errors: errors.slice(0, 10) // Limit error details in response
        },
        timestamp: new Date().toISOString()
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Sync function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          code: 'SYNC_ERROR',
          message: error instanceof Error ? error.message : 'An unexpected error occurred during sync'
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