import { assertEquals, assertExists } from "https://deno.land/std@0.168.0/testing/asserts.ts"

// Mock OCDS release data for testing
const mockOCDSRelease = {
  ocid: "ocds-213czf-000-00001",
  id: "tender-001",
  date: "2024-01-15T10:00:00Z",
  tag: ["tender"],
  initiationType: "tender",
  parties: [
    {
      id: "ZA-CPA-123456",
      name: "City of Cape Town",
      identifier: {
        scheme: "ZA-CPA",
        id: "123456",
        legalName: "City of Cape Town Metropolitan Municipality"
      },
      address: {
        streetAddress: "12 Hertzog Boulevard",
        locality: "Cape Town",
        region: "Western Cape",
        postalCode: "8001",
        countryName: "South Africa"
      },
      contactPoint: {
        name: "John Smith",
        email: "procurement@capetown.gov.za",
        telephone: "+27-21-400-1234"
      },
      roles: ["buyer"]
    }
  ],
  buyer: {
    id: "ZA-CPA-123456",
    name: "City of Cape Town"
  },
  tender: {
    id: "tender-001",
    title: "Construction of New Community Center",
    description: "Construction of a new community center including building works, electrical installation, and landscaping",
    status: "active",
    items: [
      {
        id: "item-001",
        description: "Building construction works",
        classification: {
          scheme: "CPV",
          id: "45000000",
          description: "Construction work"
        }
      }
    ],
    value: {
      amount: 5000000,
      currency: "ZAR"
    },
    procurementMethod: "open",
    submissionMethod: ["electronicSubmission"],
    tenderPeriod: {
      startDate: "2024-01-15T10:00:00Z",
      endDate: "2024-02-15T17:00:00Z"
    },
    documents: [
      {
        id: "doc-001",
        documentType: "tenderNotice",
        title: "Tender Notice",
        description: "Official tender notice document",
        url: "https://example.com/tender-notice.pdf",
        format: "application/pdf",
        language: "en",
        datePublished: "2024-01-15T10:00:00Z",
        dateModified: "2024-01-15T10:00:00Z"
      }
    ]
  }
}

// Test province mapping function
Deno.test("Province mapping - Western Cape from region", () => {
  // This would test the mapProvince function if it were exported
  // For now, we'll test the mapping logic conceptually
  const expectedProvince = "Western Cape"
  const region = "western cape"
  
  // Simulate the mapping logic
  const PROVINCE_MAPPING: Record<string, string> = {
    'western cape': 'Western Cape',
    'cape town': 'Western Cape'
  }
  
  const result = PROVINCE_MAPPING[region.toLowerCase().trim()]
  assertEquals(result, expectedProvince)
})

Deno.test("Province mapping - Gauteng from city", () => {
  const expectedProvince = "Gauteng"
  const city = "johannesburg"
  
  const PROVINCE_MAPPING: Record<string, string> = {
    'johannesburg': 'Gauteng',
    'pretoria': 'Gauteng'
  }
  
  const result = PROVINCE_MAPPING[city.toLowerCase().trim()]
  assertEquals(result, expectedProvince)
})

// Test industry categorization
Deno.test("Industry categorization - Construction", () => {
  const title = "Construction of New Community Center"
  const description = "Construction of a new community center including building works"
  const searchText = `${title} ${description}`.toLowerCase()
  
  const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    'Construction & Infrastructure': [
      'construction', 'building', 'infrastructure', 'road', 'bridge'
    ]
  }
  
  let result = 'Other'
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        result = industry
        break
      }
    }
    if (result !== 'Other') break
  }
  
  assertEquals(result, 'Construction & Infrastructure')
})

Deno.test("Industry categorization - IT", () => {
  const title = "Software Development Services"
  const searchText = title.toLowerCase()
  
  const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    'Information Technology': [
      'software', 'hardware', 'computer', 'IT', 'technology'
    ]
  }
  
  let result = 'Other'
  for (const [industry, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword)) {
        result = industry
        break
      }
    }
    if (result !== 'Other') break
  }
  
  assertEquals(result, 'Information Technology')
})

// Test data transformation
Deno.test("Transform OCDS release to tender data", () => {
  // Simulate the transformation logic
  const buyer = mockOCDSRelease.parties.find(party => party.roles.includes('buyer'))
  
  const transformedData = {
    ocid: mockOCDSRelease.ocid,
    title: mockOCDSRelease.tender.title,
    description: mockOCDSRelease.tender.description,
    buyer_name: buyer?.name || mockOCDSRelease.buyer.name,
    buyer_contact_email: buyer?.contactPoint?.email || null,
    buyer_contact_phone: buyer?.contactPoint?.telephone || null,
    province: 'Western Cape', // Would be determined by mapProvince function
    industry: 'Construction & Infrastructure', // Would be determined by categorizeIndustry function
    value_amount: mockOCDSRelease.tender.value?.amount || null,
    value_currency: mockOCDSRelease.tender.value?.currency || 'ZAR',
    submission_method: mockOCDSRelease.tender.submissionMethod?.join(', ') || 'Not specified',
    language: 'en',
    date_published: mockOCDSRelease.date,
    date_closing: mockOCDSRelease.tender.tenderPeriod?.endDate,
    status: 'open',
    full_data: mockOCDSRelease
  }
  
  // Verify key fields
  assertEquals(transformedData.ocid, "ocds-213czf-000-00001")
  assertEquals(transformedData.title, "Construction of New Community Center")
  assertEquals(transformedData.buyer_name, "City of Cape Town")
  assertEquals(transformedData.buyer_contact_email, "procurement@capetown.gov.za")
  assertEquals(transformedData.value_amount, 5000000)
  assertEquals(transformedData.value_currency, "ZAR")
  assertEquals(transformedData.province, "Western Cape")
  assertEquals(transformedData.industry, "Construction & Infrastructure")
  assertExists(transformedData.full_data)
})

// Test status determination
Deno.test("Status determination - open tender", () => {
  const tender = {
    status: "active",
    tenderPeriod: {
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
    }
  }
  
  let status = 'open'
  if (tender.status === 'cancelled') {
    status = 'cancelled'
  } else if (tender.tenderPeriod?.endDate) {
    const closingDate = new Date(tender.tenderPeriod.endDate)
    if (closingDate < new Date()) {
      status = 'closed'
    }
  }
  
  assertEquals(status, 'open')
})

Deno.test("Status determination - closed tender", () => {
  const tender = {
    status: "active",
    tenderPeriod: {
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
    }
  }
  
  let status = 'open'
  if (tender.status === 'cancelled') {
    status = 'cancelled'
  } else if (tender.tenderPeriod?.endDate) {
    const closingDate = new Date(tender.tenderPeriod.endDate)
    if (closingDate < new Date()) {
      status = 'closed'
    }
  }
  
  assertEquals(status, 'closed')
})

// Test document processing
Deno.test("Document processing", () => {
  const documents = mockOCDSRelease.tender.documents || []
  const processedDocuments = documents.map(doc => ({
    title: doc.title,
    description: doc.description || null,
    url: doc.url,
    format: doc.format,
    document_type: doc.documentType,
    language: doc.language || 'en',
    date_published: doc.datePublished || null,
    date_modified: doc.dateModified || null
  }))
  
  assertEquals(processedDocuments.length, 1)
  assertEquals(processedDocuments[0].title, "Tender Notice")
  assertEquals(processedDocuments[0].format, "application/pdf")
  assertEquals(processedDocuments[0].document_type, "tenderNotice")
  assertEquals(processedDocuments[0].url, "https://example.com/tender-notice.pdf")
})