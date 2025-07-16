import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUrlSync } from './use-url-sync'

// Mock Next.js navigation hooks
const mockPush = vi.fn()
const mockSearchParams = new Map<string, string>()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key) || null,
    toString: () => {
      const params = new URLSearchParams()
      mockSearchParams.forEach((value, key) => {
        params.set(key, value)
      })
      return params.toString()
    },
  }),
}))

describe('useUrlSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.clear()
  })

  describe('updateUrl', () => {
    it('updates page parameter in URL', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ page: 3 })
      })

      expect(mockPush).toHaveBeenCalledWith('?page=3', { scroll: false })
    })

    it('removes page parameter when page is 1', () => {
      mockSearchParams.set('page', '3')
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ page: 1 })
      })

      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })
    })

    it('updates pageSize parameter in URL', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ pageSize: 24 })
      })

      expect(mockPush).toHaveBeenCalledWith('?pageSize=24', { scroll: false })
    })

    it('removes pageSize parameter when pageSize is 12 (default)', () => {
      mockSearchParams.set('pageSize', '24')
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ pageSize: 12 })
      })

      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })
    })

    it('updates search parameter in URL', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ search: 'construction' })
      })

      expect(mockPush).toHaveBeenCalledWith('?search=construction', { scroll: false })
    })

    it('removes search parameter when search is empty', () => {
      mockSearchParams.set('search', 'construction')
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ search: '' })
      })

      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })
    })

    it('trims whitespace from search parameter', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ search: '  construction  ' })
      })

      expect(mockPush).toHaveBeenCalledWith('?search=construction', { scroll: false })
    })

    it('updates province parameter in URL', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ province: 'gauteng' })
      })

      expect(mockPush).toHaveBeenCalledWith('?province=gauteng', { scroll: false })
    })

    it('removes province parameter when province is "all"', () => {
      mockSearchParams.set('province', 'gauteng')
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ province: 'all' })
      })

      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })
    })

    it('updates industry parameter in URL', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ industry: 'construction' })
      })

      expect(mockPush).toHaveBeenCalledWith('?industry=construction', { scroll: false })
    })

    it('removes industry parameter when industry is "all"', () => {
      mockSearchParams.set('industry', 'construction')
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ industry: 'all' })
      })

      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })
    })

    it('handles multiple parameters simultaneously', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({
          page: 2,
          pageSize: 24,
          search: 'construction',
          province: 'gauteng',
          industry: 'building'
        })
      })

      expect(mockPush).toHaveBeenCalledWith(
        '?page=2&pageSize=24&search=construction&province=gauteng&industry=building',
        { scroll: false }
      )
    })

    it('preserves existing parameters when updating specific ones', () => {
      mockSearchParams.set('search', 'construction')
      mockSearchParams.set('province', 'gauteng')
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ page: 2 })
      })

      expect(mockPush).toHaveBeenCalledWith(
        '?search=construction&province=gauteng&page=2',
        { scroll: false }
      )
    })

    it('removes parameters when set to default values', () => {
      mockSearchParams.set('page', '3')
      mockSearchParams.set('pageSize', '24')
      mockSearchParams.set('search', 'construction')
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({
          page: 1,
          pageSize: 12,
          search: ''
        })
      })

      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })
    })
  })

  describe('getUrlParams', () => {
    it('returns default values when no parameters are set', () => {
      const { result } = renderHook(() => useUrlSync())

      const params = result.current.getUrlParams()

      expect(params).toEqual({
        page: 1,
        pageSize: 12,
        search: '',
        province: '',
        industry: '',
      })
    })

    it('returns current URL parameters', () => {
      mockSearchParams.set('page', '3')
      mockSearchParams.set('pageSize', '24')
      mockSearchParams.set('search', 'construction')
      mockSearchParams.set('province', 'gauteng')
      mockSearchParams.set('industry', 'building')

      const { result } = renderHook(() => useUrlSync())

      const params = result.current.getUrlParams()

      expect(params).toEqual({
        page: 3,
        pageSize: 24,
        search: 'construction',
        province: 'gauteng',
        industry: 'building',
      })
    })

    it('handles invalid page numbers gracefully', () => {
      mockSearchParams.set('page', 'invalid')
      mockSearchParams.set('pageSize', 'also-invalid')

      const { result } = renderHook(() => useUrlSync())

      const params = result.current.getUrlParams()

      expect(params.page).toBe(1) // NaN becomes 1
      expect(params.pageSize).toBe(12) // NaN becomes 12
    })

    it('handles missing parameters gracefully', () => {
      mockSearchParams.set('page', '2')
      // Other parameters are missing

      const { result } = renderHook(() => useUrlSync())

      const params = result.current.getUrlParams()

      expect(params).toEqual({
        page: 2,
        pageSize: 12,
        search: '',
        province: '',
        industry: '',
      })
    })
  })

  describe('URL format', () => {
    it('creates clean URLs without unnecessary parameters', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({
          page: 1, // Should be omitted
          pageSize: 12, // Should be omitted
          search: '', // Should be omitted
          province: 'gauteng' // Should be included
        })
      })

      expect(mockPush).toHaveBeenCalledWith('?province=gauteng', { scroll: false })
    })

    it('creates empty URL when all parameters are defaults', () => {
      mockSearchParams.set('page', '2')
      mockSearchParams.set('search', 'test')
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({
          page: 1,
          search: ''
        })
      })

      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })
    })

    it('maintains parameter order consistency', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({
          industry: 'construction',
          page: 2,
          search: 'tender',
          province: 'gauteng',
          pageSize: 24
        })
      })

      // The order should be consistent based on URLSearchParams behavior
      const call = mockPush.mock.calls[0][0]
      expect(call).toContain('page=2')
      expect(call).toContain('pageSize=24')
      expect(call).toContain('search=tender')
      expect(call).toContain('province=gauteng')
      expect(call).toContain('industry=construction')
    })
  })

  describe('Edge cases', () => {
    it('handles undefined values gracefully', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({})
      })

      // Should not crash and should not update URL when no options provided
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('handles zero and negative page numbers', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ page: 0 })
      })

      // Page 0 should be treated as page 1 (removed from URL)
      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })

      act(() => {
        result.current.updateUrl({ page: -1 })
      })

      // Negative page should be treated as page 1 (removed from URL)
      expect(mockPush).toHaveBeenCalledWith('', { scroll: false })
    })

    it('handles very large page numbers', () => {
      const { result } = renderHook(() => useUrlSync())

      act(() => {
        result.current.updateUrl({ page: 999999 })
      })

      expect(mockPush).toHaveBeenCalledWith('?page=999999', { scroll: false })
    })
  })
})