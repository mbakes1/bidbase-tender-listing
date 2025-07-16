import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPanel } from './filter-panel'
import type { SearchFilters, FilterOptions } from '@/types'

// Mock data
const mockFilterOptions: FilterOptions = {
  provinces: [
    { value: 'gauteng', label: 'Gauteng', count: 25 },
    { value: 'western-cape', label: 'Western Cape', count: 18 },
    { value: 'kwazulu-natal', label: 'KwaZulu-Natal', count: 12 },
    { value: 'eastern-cape', label: 'Eastern Cape', count: 8 }
  ],
  industries: [
    { value: 'construction', label: 'Construction', count: 15 },
    { value: 'it-services', label: 'IT Services', count: 20 },
    { value: 'healthcare', label: 'Healthcare', count: 10 },
    { value: 'education', label: 'Education', count: 18 }
  ],
  statuses: [
    { value: 'open', label: 'Open', count: 45 },
    { value: 'closed', label: 'Closed', count: 18 }
  ]
}

const defaultFilters: SearchFilters = {}

describe('FilterPanel', () => {
  const mockOnChange = vi.fn()
  const mockOnReset = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders province and industry selects', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByLabelText('Select province filter')).toBeInTheDocument()
    expect(screen.getByLabelText('Select industry filter')).toBeInTheDocument()
    expect(screen.getByText('Province')).toBeInTheDocument()
    expect(screen.getByText('Industry')).toBeInTheDocument()
  })

  it('displays "All Provinces" and "All Industries" as default values', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('All Provinces')).toBeInTheDocument()
    expect(screen.getByText('All Industries')).toBeInTheDocument()
  })

  it('shows selected province when filter is applied', () => {
    const filtersWithProvince: SearchFilters = { province: 'gauteng' }
    
    render(
      <FilterPanel
        filters={filtersWithProvince}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('Gauteng')).toBeInTheDocument()
  })

  it('shows selected industry when filter is applied', () => {
    const filtersWithIndustry: SearchFilters = { industry: 'it-services' }
    
    render(
      <FilterPanel
        filters={filtersWithIndustry}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('IT Services')).toBeInTheDocument()
  })

  it('shows clear filters button when filters are active', () => {
    const filtersWithBoth: SearchFilters = { 
      province: 'gauteng', 
      industry: 'it-services' 
    }
    
    render(
      <FilterPanel
        filters={filtersWithBoth}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument()
    expect(screen.getByText('Clear Filters')).toBeInTheDocument()
  })

  it('hides clear filters button when no filters are active', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.queryByLabelText('Clear all filters')).not.toBeInTheDocument()
    expect(screen.queryByText('Clear Filters')).not.toBeInTheDocument()
  })

  it('calls onReset when clear filters button is clicked', async () => {
    const user = userEvent.setup()
    const filtersWithBoth: SearchFilters = { 
      province: 'gauteng', 
      industry: 'it-services' 
    }
    
    render(
      <FilterPanel
        filters={filtersWithBoth}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    await user.click(screen.getByLabelText('Clear all filters'))

    expect(mockOnReset).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    const { container } = render(
      <FilterPanel
        filters={defaultFilters}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles empty filter options gracefully', () => {
    const emptyFilterOptions: FilterOptions = {
      provinces: [],
      industries: [],
      statuses: []
    }
    
    render(
      <FilterPanel
        filters={defaultFilters}
        filterOptions={emptyFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('All Provinces')).toBeInTheDocument()
    expect(screen.getByText('All Industries')).toBeInTheDocument()
  })

  it('has proper responsive layout classes', () => {
    const { container } = render(
      <FilterPanel
        filters={defaultFilters}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('flex', 'flex-col', 'sm:flex-row', 'sm:items-center')
  })

  it('shows province filter count in display value', () => {
    const filtersWithProvince: SearchFilters = { province: 'gauteng' }
    
    render(
      <FilterPanel
        filters={filtersWithProvince}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    // Check that the count is displayed next to the selected province
    expect(screen.getByText('(25)')).toBeInTheDocument()
  })

  it('shows industry filter count in display value', () => {
    const filtersWithIndustry: SearchFilters = { industry: 'it-services' }
    
    render(
      <FilterPanel
        filters={filtersWithIndustry}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    // Check that the count is displayed next to the selected industry
    expect(screen.getByText('(20)')).toBeInTheDocument()
  })

  it('shows total count for "All" options when no specific filter is selected', () => {
    render(
      <FilterPanel
        filters={defaultFilters}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    // Total count should be 25 + 18 + 12 + 8 = 63 for provinces
    // Total count should be 15 + 20 + 10 + 18 = 63 for industries
    const countElements = screen.getAllByText('(63)')
    expect(countElements.length).toBe(2) // One for provinces, one for industries
  })

  it('shows clear button only when province filter is active', () => {
    const filtersWithProvince: SearchFilters = { province: 'gauteng' }
    
    render(
      <FilterPanel
        filters={filtersWithProvince}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument()
  })

  it('shows clear button only when industry filter is active', () => {
    const filtersWithIndustry: SearchFilters = { industry: 'it-services' }
    
    render(
      <FilterPanel
        filters={filtersWithIndustry}
        filterOptions={mockFilterOptions}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByLabelText('Clear all filters')).toBeInTheDocument()
  })

  it('handles filter options without counts', () => {
    const filterOptionsWithoutCounts: FilterOptions = {
      provinces: [
        { value: 'gauteng', label: 'Gauteng' },
        { value: 'western-cape', label: 'Western Cape' }
      ],
      industries: [
        { value: 'construction', label: 'Construction' },
        { value: 'it-services', label: 'IT Services' }
      ],
      statuses: []
    }
    
    render(
      <FilterPanel
        filters={defaultFilters}
        filterOptions={filterOptionsWithoutCounts}
        onChange={mockOnChange}
        onReset={mockOnReset}
      />
    )

    expect(screen.getByText('All Provinces')).toBeInTheDocument()
    expect(screen.getByText('All Industries')).toBeInTheDocument()
    // Should not show any count displays when counts are undefined
    expect(screen.queryByText('(0)')).not.toBeInTheDocument()
  })
})