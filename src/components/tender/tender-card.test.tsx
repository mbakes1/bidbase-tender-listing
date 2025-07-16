import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TenderCard } from './tender-card'
import type { Tender } from '@/types'

// Mock the utils functions
vi.mock('@/lib/utils', () => ({
  formatDate: vi.fn((date: string) => `Formatted: ${date}`),
  formatCurrency: vi.fn((amount: number, currency = 'ZAR') => `${currency} ${amount.toLocaleString()}`),
  isClosingSoon: vi.fn(() => false),
  cn: vi.fn((...classes) => classes.filter(Boolean).join(' '))
}))

// Mock the HighlightedText component
vi.mock('@/components/search/highlighted-text', () => ({
  HighlightedText: ({ text, searchQuery, className }: { text: string; searchQuery?: string; className?: string }) => (
    <span className={className} data-testid="highlighted-text" data-search-query={searchQuery}>
      {text}
    </span>
  )
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  ExternalLink: () => <span data-testid="external-link-icon">ExternalLink</span>,
  FileText: () => <span data-testid="file-text-icon">FileText</span>,
  Calendar: () => <span data-testid="calendar-icon">Calendar</span>,
  MapPin: () => <span data-testid="map-pin-icon">MapPin</span>,
  Building2: () => <span data-testid="building-icon">Building2</span>,
  DollarSign: () => <span data-testid="dollar-sign-icon">DollarSign</span>
}))

const mockTender: Tender = {
  id: '1',
  ocid: 'ocds-123456',
  title: 'Test Tender Title',
  description: 'This is a test tender description with some details about the procurement.',
  buyer_name: 'Test Government Department',
  buyer_contact_email: 'contact@gov.za',
  buyer_contact_phone: '+27123456789',
  province: 'Western Cape',
  industry: 'Information Technology',
  value_amount: 1000000,
  value_currency: 'ZAR',
  submission_method: 'Electronic',
  language: 'en',
  date_published: '2024-01-01T00:00:00Z',
  date_closing: '2024-02-01T00:00:00Z',
  status: 'open',
  documents: [
    {
      id: 'doc1',
      title: 'Tender Document 1',
      description: 'Main tender document',
      url: 'https://example.com/doc1.pdf',
      format: 'pdf',
      document_type: 'tender',
      language: 'en',
      date_published: '2024-01-01T00:00:00Z'
    },
    {
      id: 'doc2',
      title: 'Technical Specifications',
      description: 'Technical requirements',
      url: 'https://example.com/doc2.docx',
      format: 'docx',
      document_type: 'specifications',
      language: 'en',
      date_published: '2024-01-01T00:00:00Z'
    }
  ],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

const mockTenderWithoutOptionalFields: Tender = {
  id: '2',
  ocid: 'ocds-789012',
  title: 'Simple Tender',
  description: 'Simple description',
  buyer_name: 'Simple Buyer',
  province: 'Gauteng',
  industry: 'Construction',
  submission_method: 'Manual',
  language: 'en',
  date_published: '2024-01-01T00:00:00Z',
  date_closing: '2024-02-01T00:00:00Z',
  status: 'closed',
  documents: [],
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
}

describe('TenderCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders tender information correctly', () => {
    render(<TenderCard tender={mockTender} />)

    // Check title
    expect(screen.getByText('Test Tender Title')).toBeInTheDocument()
    
    // Check description
    expect(screen.getByText(/This is a test tender description/)).toBeInTheDocument()
    
    // Check buyer name
    expect(screen.getByText('Test Government Department')).toBeInTheDocument()
    
    // Check province and industry
    expect(screen.getByText('Western Cape')).toBeInTheDocument()
    expect(screen.getByText('Information Technology')).toBeInTheDocument()
    
    // Check status badge
    expect(screen.getByText('Open')).toBeInTheDocument()
    
    // Check submission method
    expect(screen.getByText(/Submission Method:/)).toBeInTheDocument()
    expect(screen.getByText('Electronic')).toBeInTheDocument()
  })

  it('displays formatted currency when value is provided', () => {
    render(<TenderCard tender={mockTender} />)
    
    expect(screen.getByText('ZAR 1,000,000')).toBeInTheDocument()
  })

  it('does not display value section when amount is not provided', () => {
    render(<TenderCard tender={mockTenderWithoutOptionalFields} />)
    
    expect(screen.queryByTestId('dollar-sign-icon')).not.toBeInTheDocument()
  })

  it('displays correct status badges for different statuses', () => {
    const { rerender } = render(<TenderCard tender={mockTender} />)
    expect(screen.getByText('Open')).toBeInTheDocument()

    rerender(<TenderCard tender={{ ...mockTender, status: 'closed' }} />)
    expect(screen.getByText('Closed')).toBeInTheDocument()

    rerender(<TenderCard tender={{ ...mockTender, status: 'cancelled' }} />)
    expect(screen.getByText('Cancelled')).toBeInTheDocument()

    rerender(<TenderCard tender={{ ...mockTender, status: 'awarded' }} />)
    expect(screen.getByText('Awarded')).toBeInTheDocument()
  })

  it('shows closing soon badge when tender is closing soon', async () => {
    const utils = await import('@/lib/utils')
    vi.mocked(utils.isClosingSoon).mockReturnValue(true)

    render(<TenderCard tender={mockTender} />)
    
    expect(screen.getByText('Closing Soon')).toBeInTheDocument()
  })

  it('does not show closing soon badge for non-open tenders', async () => {
    const utils = await import('@/lib/utils')
    vi.mocked(utils.isClosingSoon).mockReturnValue(true)

    render(<TenderCard tender={{ ...mockTender, status: 'closed' }} />)
    
    expect(screen.queryByText('Closing Soon')).not.toBeInTheDocument()
  })

  it('displays document links correctly', () => {
    render(<TenderCard tender={mockTender} />)
    
    // Check documents section header
    expect(screen.getByText('Documents (2)')).toBeInTheDocument()
    
    // Check individual document buttons
    expect(screen.getByText('Tender Document 1')).toBeInTheDocument()
    expect(screen.getByText('Technical Specifications')).toBeInTheDocument()
    
    // Check document formats
    expect(screen.getByText('(PDF)')).toBeInTheDocument()
    expect(screen.getByText('(DOCX)')).toBeInTheDocument()
  })

  it('does not display documents section when no documents are available', () => {
    render(<TenderCard tender={mockTenderWithoutOptionalFields} />)
    
    expect(screen.queryByText(/Documents/)).not.toBeInTheDocument()
  })

  it('handles document click with custom handler', () => {
    const mockDocumentClick = vi.fn()
    render(<TenderCard tender={mockTender} onDocumentClick={mockDocumentClick} />)
    
    const documentButton = screen.getByText('Tender Document 1')
    fireEvent.click(documentButton)
    
    expect(mockDocumentClick).toHaveBeenCalledWith(mockTender.documents[0])
  })

  it('opens document in new tab when no custom handler is provided', () => {
    const mockWindowOpen = vi.fn()
    vi.stubGlobal('window', { open: mockWindowOpen })
    
    render(<TenderCard tender={mockTender} />)
    
    const documentButton = screen.getByText('Tender Document 1')
    fireEvent.click(documentButton)
    
    expect(mockWindowOpen).toHaveBeenCalledWith(
      'https://example.com/doc1.pdf',
      '_blank',
      'noopener,noreferrer'
    )
  })

  it('passes search terms to HighlightedText components', () => {
    const highlightTerms = ['test', 'tender']
    render(<TenderCard tender={mockTender} highlightTerms={highlightTerms} />)
    
    const highlightedElements = screen.getAllByTestId('highlighted-text')
    
    // Should have highlighted text for title, description, and buyer name
    expect(highlightedElements.length).toBeGreaterThan(0)
    
    // Check that search query is passed correctly
    const titleElement = highlightedElements.find(el => 
      el.textContent === 'Test Tender Title'
    )
    expect(titleElement).toHaveAttribute('data-search-query', 'test tender')
  })

  it('handles empty highlight terms gracefully', () => {
    render(<TenderCard tender={mockTender} highlightTerms={[]} />)
    
    const highlightedElements = screen.getAllByTestId('highlighted-text')
    highlightedElements.forEach(element => {
      expect(element).toHaveAttribute('data-search-query', '')
    })
  })

  it('displays all required icons', () => {
    render(<TenderCard tender={mockTender} />)
    
    expect(screen.getAllByTestId('building-icon')).toHaveLength(2) // Buyer and Industry
    expect(screen.getByTestId('map-pin-icon')).toBeInTheDocument()
    expect(screen.getByTestId('dollar-sign-icon')).toBeInTheDocument()
    expect(screen.getAllByTestId('calendar-icon')).toHaveLength(2) // Published and Closing dates
    expect(screen.getAllByTestId('file-text-icon')).toHaveLength(3) // Documents section + 2 document buttons
    expect(screen.getAllByTestId('external-link-icon')).toHaveLength(2) // Document buttons
  })

  it('applies responsive classes correctly', () => {
    const { container } = render(<TenderCard tender={mockTender} />)
    
    // Check for responsive grid classes
    expect(container.querySelector('.grid-cols-1')).toBeInTheDocument()
    expect(container.querySelector('.sm\\:grid-cols-2')).toBeInTheDocument()
    
    // Check for responsive flex classes
    expect(container.querySelector('.flex-col')).toBeInTheDocument()
    expect(container.querySelector('.sm\\:flex-row')).toBeInTheDocument()
  })

  it('truncates long text appropriately', () => {
    const longTitleTender = {
      ...mockTender,
      title: 'This is a very long tender title that should be truncated when displayed in the card component to prevent layout issues',
      buyer_name: 'This is a very long buyer name that should also be truncated to prevent overflow issues in the card layout'
    }
    
    render(<TenderCard tender={longTitleTender} />)
    
    // Check that truncate classes are applied
    const { container } = render(<TenderCard tender={longTitleTender} />)
    expect(container.querySelector('.truncate')).toBeInTheDocument()
    expect(container.querySelector('.line-clamp-3')).toBeInTheDocument()
  })

  it('handles missing description gracefully', () => {
    const tenderWithoutDescription = {
      ...mockTender,
      description: ''
    }
    
    render(<TenderCard tender={tenderWithoutDescription} />)
    
    // Should not render description section
    expect(screen.queryByText(/This is a test tender description/)).not.toBeInTheDocument()
  })
})