/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// --- OCDS Type Definitions ---
interface OCDSRelease {
  ocid: string;
  id: string;
  date: string;
  tag: string[];
  initiationType: string;
  parties: OCDSParty[];
  buyer: OCDSBuyer;
  tender: OCDSTender;
  awards?: OCDSAward[];
}

interface OCDSParty {
  id: string;
  name: string;
  address?: { region?: string; locality?: string };
  contactPoint?: { email?: string; telephone?: string };
  roles: string[];
}

interface OCDSBuyer {
  id: string;
  name: string;
}

interface OCDSTender {
  id: string;
  title: string;
  description?: string;
  status: string;
  items?: { classification?: { description: string } }[];
  value?: { amount: number; currency: string };
  submissionMethod?: string[];
  tenderPeriod?: { endDate?: string };
  documents?: OCDSDocument[];
}

interface OCDSDocument {
  id: string;
  documentType: string;
  title: string;
  description?: string;
  url: string;
  datePublished?: string;
  dateModified?: string;
  format: string;
  language?: string;
}

interface OCDSAward {
  id: string;
  status: string;
}

// --- Province & Industry Mapping ---
const PROVINCE_MAPPING: Record<string, string> = {
  'western cape': 'Western Cape', 'eastern cape': 'Eastern Cape', 'northern cape': 'Northern Cape',
  'free state': 'Free State', 'kwazulu-natal': 'KwaZulu-Natal', 'kwazulu natal': 'KwaZulu-Natal',
  'gauteng': 'Gauteng', 'mpumalanga': 'Mpumalanga', 'limpopo': 'Limpopo', 'north west': 'North West',
  'cape town': 'Western Cape', 'durban': 'KwaZulu-Natal', 'johannesburg': 'Gauteng', 'pretoria': 'Gauteng',
  'port elizabeth': 'Eastern Cape', 'gqeberha': 'Eastern Cape', 'bloemfontein': 'Free State'
};

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  'Construction & Infrastructure': ['construction', 'building', 'infrastructure', 'road', 'civil'],
  'Information Technology': ['software', 'hardware', 'it', 'technology', 'network', 'cyber'],
  'Healthcare & Medical': ['medical', 'health', 'hospital', 'pharmaceutical', 'clinic'],
  'Professional Services': ['consulting', 'legal', 'accounting', 'advisory', 'audit'],
  'Transportation & Logistics': ['transport', 'logistics', 'fleet', 'vehicle'],
  'Security & Safety': ['security', 'safety', 'guard', 'surveillance'],
  'Education & Training': ['education', 'school', 'university', 'training'],
};

// --- API Client ---
class OCDSClient {
  constructor(private baseUrl: string, private apiKey?: string) {}

  async fetchReleases(pageNumber = 1, pageSize = 100): Promise<OCDSRelease[]> {
    const url = new URL(`${this.baseUrl}/api/OCDSReleases`);
    url.searchParams.set('PageNumber', pageNumber.toString());
    url.searchParams.set('PageSize', pageSize.toString());

    const headers: Record<string, string> = { 'Accept': 'application/json', 'User-Agent': 'BidBase-Sync/1.0' };
    if (this.apiKey) headers['Authorization'] = `Bearer ${this.apiKey}`;

    const response = await fetch(url.toString(), { headers });
    if (!response.ok) throw new Error(`OCDS API error: ${response.status} ${response.statusText}`);
    
    const releasePackage = await response.json();
    return releasePackage.releases || [];
  }
}

// --- Data Transformation ---
const mapToProvince = (text: string): string | null => {
  const lowerText = text.toLowerCase();
  for (const [key, province] of Object.entries(PROVINCE_MAPPING)) {
    if (lowerText.includes(key)) return province;
  }
  return null;
};

const mapProvince = (release: OCDSRelease): string => {
  const buyer = release.parties?.find(p => p.roles.includes('buyer'));
  if (buyer?.address?.region) return mapToProvince(buyer.address.region) || 'National';
  if (buyer?.address?.locality) return mapToProvince(buyer.address.locality) || 'National';
  const searchText = `${release.tender.title} ${release.tender.description || ''}`;
  return mapToProvince(searchText) || 'National';
};

const categorizeIndustry = (release: OCDSRelease): string => {
  const searchText = `${release.tender.title} ${release.tender.description || ''} ${release.tender.items?.[0]?.classification?.description || ''}`.toLowerCase();
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (keywords.some(k => searchText.includes(k))) return industry;
  }
  return 'Other';
};

function transformRelease(release: OCDSRelease) {
  const buyer = release.parties?.find(p => p.roles.includes('buyer'));
  let status: 'open' | 'closed' | 'cancelled' | 'awarded' = 'open';
  if (release.tender.status === 'cancelled') status = 'cancelled';
  else if (release.tender.status === 'complete' || (release.awards && release.awards.length > 0)) status = 'awarded';
  else if (release.tender.tenderPeriod?.endDate && new Date(release.tender.tenderPeriod.endDate) < new Date()) status = 'closed';

  return {
    ocid: release.ocid,
    title: release.tender.title,
    description: release.tender.description || null,
    buyer_name: buyer?.name || release.buyer.name,
    province: mapProvince(release),
    industry: categorizeIndustry(release),
    value_amount: release.tender.value?.amount || null,
    value_currency: release.tender.value?.currency || 'ZAR',
    submission_method: release.tender.submissionMethod?.join(', ') || 'Not specified',
    date_published: release.date,
    date_closing: release.tender.tenderPeriod?.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status,
    full_data: release,
    documents: (release.tender.documents || []).map(doc => ({ ...doc, document_type: doc.documentType }))
  };
}

// --- Database Operations ---
async function upsertTender(supabase: any, tenderData: any) {
  const { documents, ...tender } = tenderData;
  const { data, error } = await supabase.rpc('upsert_tender', { ...tender, p_documents: documents });
  if (error) throw error;
  return data;
}

// --- Main Server Logic ---
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });

  try {
    const { pageSize = 100, pageNumber = 1 } = (await req.json()) || {};
    
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const ocdsClient = new OCDSClient(Deno.env.get('OCDS_API_URL') || 'https://api.etenders.gov.za/v1', Deno.env.get('OCDS_API_KEY'));

    const releases = await ocdsClient.fetchReleases(pageNumber, pageSize);
    const results = await Promise.allSettled(releases.map(r => upsertTender(supabase, transformRelease(r))));
    
    const processed_count = results.filter(r => r.status === 'fulfilled').length;
    const error_count = results.length - processed_count;
    const errors = results.filter(r => r.status === 'rejected').map((r: any) => r.reason?.message || 'Unknown error');

    return new Response(JSON.stringify({ success: true, data: { processed_count, error_count, total_fetched: releases.length, errors: errors.slice(0, 10) }, timestamp: new Date().toISOString() }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: { code: 'SYNC_ERROR', message: error.message }, timestamp: new Date().toISOString() }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
})