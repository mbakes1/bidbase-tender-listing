import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Highlights search terms in text by wrapping them with HTML mark tags
 * @param text - The text to highlight terms in
 * @param searchTerms - Array of terms to highlight (case-insensitive)
 * @returns HTML string with highlighted terms
 */
export function highlightSearchTerms(text: string, searchTerms: string[]): string {
  if (!text || !searchTerms || searchTerms.length === 0) {
    return text
  }

  // Filter out empty terms and escape special regex characters
  const validTerms = searchTerms
    .filter(term => term && term.trim().length > 0)
    .map(term => {
      // Escape special regex characters
      return term.trim().replace(/[.*+?^${}()|[\]\\]/g, (match) => '\\' + match)
    })

  if (validTerms.length === 0) {
    return text
  }

  // Create regex pattern that matches any of the search terms (case-insensitive)
  const pattern = new RegExp(`(${validTerms.join('|')})`, 'gi')
  
  // Replace matches with highlighted version
  return text.replace(pattern, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">$1</mark>')
}

/**
 * Splits search query into individual terms
 * @param query - The search query string
 * @returns Array of search terms
 */
export function parseSearchTerms(query: string): string[] {
  if (!query || typeof query !== 'string') {
    return []
  }

  return query
    .trim()
    .split(/\s+/)
    .filter(term => term.length > 0)
    .map(term => term.toLowerCase())
}

/**
 * Formats a date string to a human-readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}

/**
 * Formats a date string to a human-readable format with time
 * @param dateString - ISO date string
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) {
      return dateString
    }
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return dateString
  }
}

/**
 * Checks if a tender is closing soon (within 7 days)
 * @param closingDate - ISO date string of tender closing date
 * @returns Boolean indicating if tender is closing soon
 */
export function isClosingSoon(closingDate: string): boolean {
  try {
    const closing = new Date(closingDate)
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return closing <= sevenDaysFromNow && closing > now
  } catch {
    return false
  }
}

/**
 * Formats currency amount
 * @param amount - The amount to format
 * @param currency - Currency code (default: ZAR)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'ZAR'): string {
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  } catch {
    return `${currency} ${amount.toLocaleString()}`
  }
}