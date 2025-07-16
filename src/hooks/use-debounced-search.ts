import { useState, useEffect, useCallback, useRef } from 'react'
import type { SearchFilters, UseSearchResult } from '../types'

// Default debounce delay
const DEFAULT_DEBOUNCE_DELAY = 300

/**
 * Custom hook for managing debounced search functionality
 * Provides search term management with debouncing and filter state management
 */
export const useDebouncedSearch = (
  initialFilters: SearchFilters = {},
  debounceDelay: number = DEFAULT_DEBOUNCE_DELAY
): UseSearchResult => {
  // State for current search term (immediate updates)
  const [searchTerm, setSearchTerm] = useState(initialFilters.search || '')
  
  // State for debounced search term (delayed updates)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialFilters.search || '')
  
  // State for other filters
  const [filters, setFilters] = useState<SearchFilters>(initialFilters)
  
  // Ref to store the timeout ID
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Effect to handle debouncing of search term
  useEffect(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    // Set new timeout
    debounceTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, debounceDelay)

    // Cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchTerm, debounceDelay])

  // Update filters when debounced search term changes
  useEffect(() => {
    setFilters(prevFilters => ({
      ...prevFilters,
      search: debouncedSearchTerm || undefined
    }))
  }, [debouncedSearchTerm])

  // Function to update filters (excluding search)
  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prevFilters => {
      const updatedFilters = { ...prevFilters, ...newFilters }
      
      // Remove undefined values to keep the object clean
      Object.keys(updatedFilters).forEach(key => {
        const value = updatedFilters[key as keyof SearchFilters]
        if (value === undefined || value === '' || value === null) {
          delete updatedFilters[key as keyof SearchFilters]
        }
      })
      
      return updatedFilters
    })
  }, [])

  // Function to reset all filters
  const resetFilters = useCallback(() => {
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setFilters({})
  }, [])

  // Function to set search term with immediate update
  const handleSetSearchTerm = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  return {
    filters,
    updateFilters,
    resetFilters,
    searchTerm,
    setSearchTerm: handleSetSearchTerm,
    debouncedSearchTerm
  }
}

/**
 * Hook for creating a debounced version of any value
 * Generic utility for debouncing any value changes
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook for creating a debounced callback function
 * Useful for debouncing function calls like API requests
 */
export const useDebouncedCallback = <T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const callbackRef = useRef(callback)

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delay)
    }) as T,
    [delay]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return debouncedCallback
}

// Export default debounce delay for consistency
export { DEFAULT_DEBOUNCE_DELAY }