import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HighlightedText } from './highlighted-text'

describe('HighlightedText', () => {
  it('renders plain text when no search query is provided', () => {
    render(<HighlightedText text="Hello world" />)
    
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('renders plain text when search query is empty', () => {
    render(<HighlightedText text="Hello world" searchQuery="" />)
    
    expect(screen.getByText('Hello world')).toBeInTheDocument()
  })

  it('highlights single search term', () => {
    const { container } = render(<HighlightedText text="Hello world" searchQuery="world" />)
    
    const span = container.querySelector('span')
    expect(span?.innerHTML).toBe('Hello <mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">world</mark>')
  })

  it('highlights multiple search terms', () => {
    const { container } = render(<HighlightedText text="Hello beautiful world" searchQuery="hello world" />)
    
    const span = container.querySelector('span')
    const innerHTML = span?.innerHTML || ''
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Hello</mark>')
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">world</mark>')
  })

  it('handles case-insensitive highlighting', () => {
    const { container } = render(<HighlightedText text="Hello World" searchQuery="hello world" />)
    
    const span = container.querySelector('span')
    const innerHTML = span?.innerHTML || ''
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Hello</mark>')
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">World</mark>')
  })

  it('handles partial word matches', () => {
    const { container } = render(<HighlightedText text="Testing partial matches" searchQuery="test" />)
    
    const span = container.querySelector('span')
    expect(span?.innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Test</mark>ing')
  })

  it('handles special regex characters in search terms', () => {
    const { container } = render(<HighlightedText text="Price: $100.50 (special)" searchQuery="$100.50 (special)" />)
    
    const span = container.querySelector('span')
    const innerHTML = span?.innerHTML || ''
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$100.50</mark>')
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">(special)</mark>')
  })

  it('applies custom className', () => {
    render(<HighlightedText text="Hello world" className="custom-class" />)
    
    const element = screen.getByText('Hello world')
    expect(element).toHaveClass('custom-class')
  })

  it('applies custom className with highlighted text', () => {
    const { container } = render(<HighlightedText text="Hello world" searchQuery="world" className="custom-class" />)
    
    const span = container.querySelector('span')
    expect(span).toHaveClass('custom-class')
    expect(span?.innerHTML).toBe('Hello <mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">world</mark>')
  })

  it('handles empty text', () => {
    const { container } = render(<HighlightedText text="" searchQuery="test" />)
    
    const span = container.querySelector('span')
    expect(span).toBeInTheDocument()
    expect(span).toBeEmptyDOMElement()
  })

  it('handles text with no matches', () => {
    const { container } = render(<HighlightedText text="Hello world" searchQuery="xyz" />)
    
    const span = container.querySelector('span')
    expect(span?.innerHTML).toBe('Hello world')
  })

  it('handles multiple spaces in search query', () => {
    const { container } = render(<HighlightedText text="Hello beautiful world" searchQuery="  hello   world  " />)
    
    const span = container.querySelector('span')
    const innerHTML = span?.innerHTML || ''
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Hello</mark>')
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">world</mark>')
  })

  it('handles overlapping matches correctly', () => {
    const { container } = render(<HighlightedText text="test testing tester" searchQuery="test testing" />)
    
    const span = container.querySelector('span')
    const innerHTML = span?.innerHTML || ''
    // Should highlight "test" multiple times
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">test</mark>')
  })

  it('preserves text structure with highlighting', () => {
    const longText = "This is a long text with multiple words that should be highlighted when searching for specific terms."
    const { container } = render(<HighlightedText text={longText} searchQuery="long text multiple" />)
    
    const span = container.querySelector('span')
    const innerHTML = span?.innerHTML || ''
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">long</mark>')
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">text</mark>')
    expect(innerHTML).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">multiple</mark>')
  })
})