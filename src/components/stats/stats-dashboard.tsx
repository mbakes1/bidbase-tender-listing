import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { PlatformStats } from '@/types'

interface StatsDashboardProps {
  stats?: PlatformStats
  isLoading?: boolean
  className?: string
}

interface StatCardProps {
  title: string
  value: number
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  isLoading?: boolean
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  variant = 'default', 
  isLoading = false 
}) => {
  return (
    <Card className="text-center">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {isLoading ? (
          <Skeleton className="h-8 w-16 mx-auto" />
        ) : (
          <Badge variant={variant} className="text-lg px-3 py-1">
            {value.toLocaleString()}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}

const formatLastUpdated = (timestamp: string): string => {
  try {
    const date = new Date(timestamp)
    
    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return 'Unknown'
    }
    
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) {
      return 'Just now'
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes === 1 ? '' : 's'} ago`
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60)
      return `${hours} hour${hours === 1 ? '' : 's'} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  } catch (error) {
    return 'Unknown'
  }
}

export const StatsDashboard: React.FC<StatsDashboardProps> = ({
  stats,
  isLoading = false,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Tenders"
          value={stats?.total_tenders ?? 0}
          variant="default"
          isLoading={isLoading}
        />
        <StatCard
          title="Open Tenders"
          value={stats?.open_tenders ?? 0}
          variant="secondary"
          isLoading={isLoading}
        />
        <StatCard
          title="Closing Soon"
          value={stats?.closing_soon_tenders ?? 0}
          variant="destructive"
          isLoading={isLoading}
        />
      </div>

      {/* Last Updated Information */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Last Updated:</span>
            {isLoading ? (
              <Skeleton className="h-4 w-32" />
            ) : (
              <span className="font-medium">
                {stats?.last_updated ? formatLastUpdated(stats.last_updated) : 'Unknown'}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StatsDashboard