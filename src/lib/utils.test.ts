import { describe, it, expect } from 'vitest'
import { 
  cn, 
  highlightSearchTerms, 
  parseSearchTerms, 
  formatDate, 
  formatDateTime, 
  isClosingSoon, 
  formatCurrency 
} from './utils'

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2')
    })
  })

  describe('highlightSearchTerms', () => {
    it('returns original text when no search terms provided', () => {
      expect(highlightSearchTerms('Hello world', [])).toBe('Hello world')
    })

    it('returns original text when search terms are empty', () => {
      expect(highlightSearchTerms('Hello world', ['', '  '])).toBe('Hello world')
    })

    it('highlights single search term', () => {
      const result = highlightSearchTerms('Hello world', ['world'])
      expect(result).toBe('Hello <mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">world</mark>')
    })

    it('highlights multiple search terms', () => {
      const result = highlightSearchTerms('Hello beautiful world', ['hello', 'world'])
      expect(result).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Hello</mark>')
      expect(result).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">world</mark>')
    })

    it('handles case-insensitive highlighting', () => {
      const result = highlightSearchTerms('Hello World', ['hello', 'WORLD'])
      expect(result).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">Hello</mark>')
      expect(result).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">World</mark>')
    })

    it('escapes special regex characters', () => {
      const result = highlightSearchTerms('Price: $100.50 (special)', ['$100.50', '(special)'])
      expect(result).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$100.50</mark>')
      expect(result).toContain('<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">(special)</mark>')
    })
  })

  describe('parseSearchTerms', () => {
    it('returns empty array for empty query', () => {
      expect(parseSearchTerms('')).toEqual([])
      expect(parseSearchTerms('   ')).toEqual([])
    })

    it('splits query into individual terms', () => {
      expect(parseSearchTerms('hello world')).toEqual(['hello', 'world'])
    })

    it('handles multiple spaces', () => {
      expect(parseSearchTerms('  hello   world  ')).toEqual(['hello', 'world'])
    })

    it('converts terms to lowercase', () => {
      expect(parseSearchTerms('Hello WORLD')).toEqual(['hello', 'world'])
    })

    it('handles non-string input', () => {
      expect(parseSearchTerms(null as unknown as string)).toEqual([])
      expect(parseSearchTerms(undefined as unknown as string)).toEqual([])
    })
  })

  describe('formatDate', () => {
    it('formats valid date string', () => {
      const result = formatDate('2024-01-15T10:30:00Z')
      expect(result).toMatch(/15.*Jan.*2024/)
    })

    it('returns original string for invalid date', () => {
      expect(formatDate('invalid-date')).toBe('invalid-date')
    })
  })

  describe('formatDateTime', () => {
    it('formats valid date string with time', () => {
      const result = formatDateTime('2024-01-15T10:30:00Z')
      expect(result).toMatch(/15.*Jan.*2024.*\d{2}:\d{2}/)
    })

    it('returns original string for invalid date', () => {
      expect(formatDateTime('invalid-date')).toBe('invalid-date')
    })
  })

  describe('isClosingSoon', () => {
    it('returns true for dates within 7 days', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      expect(isClosingSoon(tomorrow)).toBe(true)
    })

    it('returns false for dates more than 7 days away', () => {
      const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      expect(isClosingSoon(nextMonth)).toBe(false)
    })

    it('returns false for past dates', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      expect(isClosingSoon(yesterday)).toBe(false)
    })

    it('returns false for invalid dates', () => {
      expect(isClosingSoon('invalid-date')).toBe(false)
    })
  })

  describe('formatCurrency', () => {
    it('formats currency with default ZAR', () => {
      const result = formatCurrency(1000)
      expect(result).toContain('1')
      expect(result).toContain('000')
    })

    it('formats currency with custom currency code', () => {
      const result = formatCurrency(1000, 'USD')
      expect(result).toContain('1')
      expect(result).toContain('000')
    })

    it('handles large numbers', () => {
      const result = formatCurrency(1000000)
      expect(result).toContain('1')
      expect(result).toContain('000')
      expect(result).toContain('000')
    })
  })
})