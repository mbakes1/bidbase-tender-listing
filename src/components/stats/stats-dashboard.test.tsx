import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StatsDashboard } from './stats-dashboard'
import type { PlatformStats } from '@/types'

// Mock the UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div data-testid="card" className={className} {...props}>
      {children}
    </div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div data-testid="card-content" className={className} {...props}>
      {children}
    </div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div data-testid="card-header" className={className} {...props}>
      {children}
    </div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <div data-testid="card-title" className={className} {...props}>
      {children}
    </div>
  )
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className, ...props }: any) => (
    <span 
      data-testid="badge" 
      data-variant={variant} 
      className={className} 
      {...props}
    >
      {children}
    </span>
  )
}))

vi.mock('@/components/ui/skeleton', () => ({
  Skeleton: ({ className, ...props }: any) => (
    <div data-testid="skeleton" className={className} {...props} />
  )
}))

vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' ')
}))

describe('StatsDashboard', () => {
  const mockStats: PlatformStats = {
    total_tenders: 1250,
    open_tenders: 850,
    closing_soon_tenders: 45,
    total_value: 5000000,
    last_updated: '2024-01-15T10:30:00Z'
  }

  beforeEach(() => {
    // Mock current date for consistent testing
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T11:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<StatsDashboard />)
      expect(screen.getByText('Total Tenders')).toBeInTheDocument()
      expect(screen.getByText('Open Tenders')).toBeInTheDocument()
      expect(screen.getByText('Closing Soon')).toBeInTheDocument()
    })

    it('renders with custom className', () => {
      const { container } = render(
        <StatsDashboard className="custom-class" />
      )
      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('displays statistics when provided', () => {
      render(<StatsDashboard stats={mockStats} />)
      
      expect(screen.getByText('1,250')).toBeInTheDocument()
      expect(screen.getByText('850')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
    })

    it('displays zero values when stats are undefined', () => {
      render(<StatsDashboard />)
      
      const badges = screen.getAllByTestId('badge')
      badges.forEach(badge => {
        expect(badge).toHaveTextContent('0')
      })
    })
  })

  describe('Loading States', () => {
    it('shows skeleton loaders when loading', () => {
      render(<StatsDashboard isLoading={true} />)
      
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons).toHaveLength(4) // 3 stat cards + 1 last updated
    })

    it('hides actual values when loading', () => {
      render(<StatsDashboard stats={mockStats} isLoading={true} />)
      
      expect(screen.queryByText('1,250')).not.toBeInTheDocument()
      expect(screen.queryByText('850')).not.toBeInTheDocument()
      expect(screen.queryByText('45')).not.toBeInTheDocument()
    })

    it('shows skeleton for last updated when loading', () => {
      render(<StatsDashboard stats={mockStats} isLoading={true} />)
      
      expect(screen.getByText('Last Updated:')).toBeInTheDocument()
      const skeletons = screen.getAllByTestId('skeleton')
      expect(skeletons).toHaveLength(4) // 3 stat cards + 1 last updated
      // Check that the last skeleton has the correct class for last updated
      expect(skeletons[3]).toHaveClass('h-4', 'w-32')
    })
  })

  describe('Badge Variants', () => {
    it('uses correct badge variants for different stats', () => {
      render(<StatsDashboard stats={mockStats} />)
      
      const badges = screen.getAllByTestId('badge')
      expect(badges[0]).toHaveAttribute('data-variant', 'default') // Total tenders
      expect(badges[1]).toHaveAttribute('data-variant', 'secondary') // Open tenders
      expect(badges[2]).toHaveAttribute('data-variant', 'destructive') // Closing soon
    })
  })

  describe('Number Formatting', () => {
    it('formats large numbers with commas', () => {
      const largeStats: PlatformStats = {
        total_tenders: 12500,
        open_tenders: 8500,
        closing_soon_tenders: 450,
        total_value: 50000000,
        last_updated: '2024-01-15T10:30:00Z'
      }

      render(<StatsDashboard stats={largeStats} />)
      
      expect(screen.getByText('12,500')).toBeInTheDocument()
      expect(screen.getByText('8,500')).toBeInTheDocument()
      expect(screen.getByText('450')).toBeInTheDocument()
    })

    it('handles zero values correctly', () => {
      const zeroStats: PlatformStats = {
        total_tenders: 0,
        open_tenders: 0,
        closing_soon_tenders: 0,
        total_value: 0,
        last_updated: '2024-01-15T10:30:00Z'
      }

      render(<StatsDashboard stats={zeroStats} />)
      
      const badges = screen.getAllByTestId('badge')
      badges.forEach(badge => {
        expect(badge).toHaveTextContent('0')
      })
    })
  })

  describe('Last Updated Formatting', () => {
    it('shows "Just now" for very recent updates', () => {
      const recentStats: PlatformStats = {
        ...mockStats,
        last_updated: '2024-01-15T10:59:30Z' // 30 seconds ago
      }

      render(<StatsDashboard stats={recentStats} />)
      expect(screen.getByText('Just now')).toBeInTheDocument()
    })

    it('shows minutes ago for recent updates', () => {
      const recentStats: PlatformStats = {
        ...mockStats,
        last_updated: '2024-01-15T10:45:00Z' // 15 minutes ago
      }

      render(<StatsDashboard stats={recentStats} />)
      expect(screen.getByText('15 minutes ago')).toBeInTheDocument()
    })

    it('shows singular minute for 1 minute ago', () => {
      const recentStats: PlatformStats = {
        ...mockStats,
        last_updated: '2024-01-15T10:59:00Z' // 1 minute ago
      }

      render(<StatsDashboard stats={recentStats} />)
      expect(screen.getByText('1 minute ago')).toBeInTheDocument()
    })

    it('shows hours ago for updates within 24 hours', () => {
      const recentStats: PlatformStats = {
        ...mockStats,
        last_updated: '2024-01-15T08:00:00Z' // 3 hours ago
      }

      render(<StatsDashboard stats={recentStats} />)
      expect(screen.getByText('3 hours ago')).toBeInTheDocument()
    })

    it('shows singular hour for 1 hour ago', () => {
      const recentStats: PlatformStats = {
        ...mockStats,
        last_updated: '2024-01-15T10:00:00Z' // 1 hour ago
      }

      render(<StatsDashboard stats={recentStats} />)
      expect(screen.getByText('1 hour ago')).toBeInTheDocument()
    })

    it('shows formatted date for older updates', () => {
      const oldStats: PlatformStats = {
        ...mockStats,
        last_updated: '2024-01-14T10:30:00Z' // 1 day ago
      }

      render(<StatsDashboard stats={oldStats} />)
      expect(screen.getByText('Jan 14, 2024, 12:30 PM')).toBeInTheDocument()
    })

    it('shows "Unknown" for invalid timestamps', () => {
      const invalidStats: PlatformStats = {
        ...mockStats,
        last_updated: 'invalid-date'
      }

      render(<StatsDashboard stats={invalidStats} />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('shows "Unknown" when last_updated is missing', () => {
      const statsWithoutUpdate = {
        total_tenders: 100,
        open_tenders: 50,
        closing_soon_tenders: 5,
        total_value: 1000000
      } as PlatformStats

      render(<StatsDashboard stats={statsWithoutUpdate} />)
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('applies responsive grid classes', () => {
      const { container } = render(<StatsDashboard stats={mockStats} />)
      
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass('grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3')
    })

    it('applies proper spacing classes', () => {
      const { container } = render(<StatsDashboard stats={mockStats} />)
      
      expect(container.firstChild).toHaveClass('space-y-4')
      
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass('gap-4')
    })
  })

  describe('Accessibility', () => {
    it('has proper semantic structure', () => {
      render(<StatsDashboard stats={mockStats} />)
      
      expect(screen.getByText('Total Tenders')).toBeInTheDocument()
      expect(screen.getByText('Open Tenders')).toBeInTheDocument()
      expect(screen.getByText('Closing Soon')).toBeInTheDocument()
      expect(screen.getByText('Last Updated:')).toBeInTheDocument()
    })

    it('provides meaningful text content', () => {
      render(<StatsDashboard stats={mockStats} />)
      
      // Check that all important information is accessible as text
      expect(screen.getByText('1,250')).toBeInTheDocument()
      expect(screen.getByText('850')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('30 minutes ago')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles missing stats gracefully', () => {
      render(<StatsDashboard />)
      
      expect(screen.getByText('Total Tenders')).toBeInTheDocument()
      expect(screen.getByText('Open Tenders')).toBeInTheDocument()
      expect(screen.getByText('Closing Soon')).toBeInTheDocument()
      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('handles partial stats data', () => {
      const partialStats = {
        total_tenders: 100,
        open_tenders: 50
      } as PlatformStats

      render(<StatsDashboard stats={partialStats} />)
      
      expect(screen.getByText('100')).toBeInTheDocument()
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // closing_soon_tenders defaults to 0
    })
  })
})