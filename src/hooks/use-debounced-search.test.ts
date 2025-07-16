import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { 
  useDebouncedSearch, 
  useDebounce, 
  useDebouncedCallback,
  DEFAULT_DEBOUNCE_DELAY 
} from './use-debounced-search'
import type { SearchFilters } from '../types'

describe('useDebouncedSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    expect(result.current.searchTerm).toBe('')
    expect(result.current.debouncedSearchTerm).toBe('')
    expect(result.current.filters).toEqual({})
  })

  it('should initialize with provided initial filters', () => {
    const initialFilters: SearchFilters = {
      search: 'initial search',
      province: 'gauteng',
      industry: 'it'
    }

    const { result } = renderHook(() => useDebouncedSearch(initialFilters))

    expect(result.current.searchTerm).toBe('initial search')
    expect(result.current.debouncedSearchTerm).toBe('initial search')
    expect(result.current.filters).toEqual(initialFilters)
  })

  it('should update search term immediately', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    act(() => {
      result.current.setSearchTerm('new search')
    })

    expect(result.current.searchTerm).toBe('new search')
    expect(result.current.debouncedSearchTerm).toBe('') // Should still be empty before debounce
  })

  it('should debounce search term updates', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    act(() => {
      result.current.setSearchTerm('debounced search')
    })

    expect(result.current.debouncedSearchTerm).toBe('')

    act(() => {
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_DELAY)
    })

    expect(result.current.debouncedSearchTerm).toBe('debounced search')
  })

  it('should update filters when debounced search term changes', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    act(() => {
      result.current.setSearchTerm('test search')
    })

    act(() => {
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_DELAY)
    })

    expect(result.current.filters.search).toBe('test search')
  })

  it('should cancel previous debounce when search term changes quickly', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    act(() => {
      result.current.setSearchTerm('first')
    })

    act(() => {
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_DELAY / 2)
    })

    act(() => {
      result.current.setSearchTerm('second')
    })

    act(() => {
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_DELAY)
    })

    expect(result.current.debouncedSearchTerm).toBe('second')
    expect(result.current.filters.search).toBe('second')
  })

  it('should update other filters correctly', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    act(() => {
      result.current.updateFilters({
        province: 'western-cape',
        industry: 'construction'
      })
    })

    expect(result.current.filters).toEqual({
      province: 'western-cape',
      industry: 'construction'
    })
  })

  it('should merge filters correctly', () => {
    const initialFilters: SearchFilters = {
      search: 'initial',
      province: 'gauteng'
    }

    const { result } = renderHook(() => useDebouncedSearch(initialFilters))

    act(() => {
      result.current.updateFilters({
        industry: 'it',
        province: 'western-cape' // Should override existing province
      })
    })

    expect(result.current.filters).toEqual({
      search: 'initial',
      province: 'western-cape',
      industry: 'it'
    })
  })

  it('should remove undefined and empty values from filters', () => {
    const { result } = renderHook(() => useDebouncedSearch())

    act(() => {
      result.current.updateFilters({
        province: 'gauteng',
        industry: '',
        status: undefined,
        min_value: 0
      })
    })

    expect(result.current.filters).toEqual({
      province: 'gauteng',
      min_value: 0
    })
  })

  it('should reset all filters and search terms', () => {
    const initialFilters: SearchFilters = {
      search: 'initial search',
      province: 'gauteng',
      industry: 'it'
    }

    const { result } = renderHook(() => useDebouncedSearch(initialFilters))

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.searchTerm).toBe('')
    expect(result.current.debouncedSearchTerm).toBe('')
    expect(result.current.filters).toEqual({})
  })

  it('should use custom debounce delay', () => {
    const customDelay = 500
    const { result } = renderHook(() => useDebouncedSearch({}, customDelay))

    act(() => {
      result.current.setSearchTerm('custom delay test')
    })

    act(() => {
      vi.advanceTimersByTime(DEFAULT_DEBOUNCE_DELAY)
    })

    expect(result.current.debouncedSearchTerm).toBe('')

    act(() => {
      vi.advanceTimersByTime(customDelay - DEFAULT_DEBOUNCE_DELAY)
    })

    expect(result.current.debouncedSearchTerm).toBe('custom delay test')
  })
})

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated', delay: 300 })

    expect(result.current).toBe('initial') // Should still be initial

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('updated')
  })

  it('should cancel previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'first', delay: 300 } }
    )

    rerender({ value: 'second', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(150)
    })

    rerender({ value: 'third', delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe('third')
  })

  it('should work with different value types', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 42, delay: 300 } }
    )

    expect(result.current).toBe(42)

    rerender({ value: 100, delay: 300 })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe(100)
  })
})

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should debounce callback execution', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    act(() => {
      result.current('arg1', 'arg2')
    })

    expect(callback).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledWith('arg1', 'arg2')
  })

  it('should cancel previous callback on rapid calls', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useDebouncedCallback(callback, 300))

    act(() => {
      result.current('first')
    })

    act(() => {
      vi.advanceTimersByTime(150)
    })

    act(() => {
      result.current('second')
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('second')
  })

  it('should update callback reference', () => {
    const callback1 = vi.fn()
    const callback2 = vi.fn()

    const { result, rerender } = renderHook(
      ({ cb }) => useDebouncedCallback(cb, 300),
      { initialProps: { cb: callback1 } }
    )

    rerender({ cb: callback2 })

    act(() => {
      result.current('test')
    })

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback1).not.toHaveBeenCalled()
    expect(callback2).toHaveBeenCalledWith('test')
  })

  it('should cleanup timeout on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300))

    act(() => {
      result.current('test')
    })

    unmount()

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(callback).not.toHaveBeenCalled()
  })
})

describe('DEFAULT_DEBOUNCE_DELAY', () => {
  it('should have correct default value', () => {
    expect(DEFAULT_DEBOUNCE_DELAY).toBe(300)
  })
})