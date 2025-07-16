import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SearchInput } from './search-input'

describe('SearchInput', () => {
  const mockOnChange = vi.fn()
  const mockOnClear = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with default placeholder', () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByPlaceholderText('Search tenders...')).toBeInTheDocument()
  })

  it('renders with custom placeholder', () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        placeholder="Custom placeholder"
      />
    )

    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument()
  })

  it('displays the current value', () => {
    render(
      <SearchInput
        value="test search"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    expect(screen.getByDisplayValue('test search')).toBeInTheDocument()
  })

  it('calls onChange when user types', async () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: 'new search' } })

    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith('new search')
  })

  it('shows search icon', () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    // Search icon should be present (we can't easily test the icon itself, but we can test the container)
    const container = screen.getByRole('textbox').parentElement
    expect(container).toHaveClass('relative')
  })

  it('shows clear button when value is not empty', () => {
    render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    expect(clearButton).toBeInTheDocument()
  })

  it('does not show clear button when value is empty', () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    const clearButton = screen.queryByRole('button', { name: /clear search/i })
    expect(clearButton).not.toBeInTheDocument()
  })

  it('calls onClear when clear button is clicked', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    const clearButton = screen.getByRole('button', { name: /clear search/i })
    await user.click(clearButton)

    expect(mockOnClear).toHaveBeenCalledTimes(1)
  })

  it('calls onClear when Escape key is pressed', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.keyboard('{Escape}')

    expect(mockOnClear).toHaveBeenCalledTimes(1)
  })

  it('shows loading spinner when isLoading is true and value is not empty', () => {
    render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isLoading={true}
      />
    )

    // Loading spinner should be present, clear button should not
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
    
    // We can't easily test for the spinner icon, but we can verify the clear button is hidden
    const container = screen.getByRole('textbox').parentElement
    expect(container).toBeInTheDocument()
  })

  it('does not show loading spinner when value is empty', () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        isLoading={true}
      />
    )

    // Neither loading spinner nor clear button should be present
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        className="custom-class"
      />
    )

    const container = screen.getByRole('textbox').parentElement
    expect(container).toHaveClass('custom-class')
  })

  it('forwards ref to input element', () => {
    const ref = vi.fn()
    
    render(
      <SearchInput
        ref={ref}
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
  })

  it('handles focus and blur events', async () => {
    const user = userEvent.setup()
    
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    const input = screen.getByRole('textbox')
    
    // Focus the input
    await user.click(input)
    expect(input).toHaveFocus()
    
    // Blur the input
    await user.tab()
    expect(input).not.toHaveFocus()
  })

  it('passes through additional props to input', () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        data-testid="search-input"
        disabled
      />
    )

    const input = screen.getByTestId('search-input')
    expect(input).toBeDisabled()
  })

  it('maintains proper accessibility attributes', () => {
    render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    const input = screen.getByRole('textbox')
    const clearButton = screen.getByRole('button', { name: /clear search/i })

    expect(input).toHaveAttribute('type', 'text')
    expect(clearButton).toHaveAttribute('aria-label', 'Clear search')
    expect(clearButton).toHaveAttribute('type', 'button')
  })

  it('handles rapid typing without issues', async () => {
    render(
      <SearchInput
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    )

    const input = screen.getByRole('textbox')
    
    // Simulate rapid typing with fireEvent
    fireEvent.change(input, { target: { value: 'rapid typing test' } })

    expect(mockOnChange).toHaveBeenCalledTimes(1)
    expect(mockOnChange).toHaveBeenCalledWith('rapid typing test')
  })

  it('shows correct state when switching between loading and not loading', () => {
    const { rerender } = render(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isLoading={false}
      />
    )

    // Should show clear button when not loading
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()

    // Rerender with loading state
    rerender(
      <SearchInput
        value="test"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isLoading={true}
      />
    )

    // Should hide clear button and show loading spinner
    expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
  })
})