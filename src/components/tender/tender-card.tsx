'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HighlightedText } from '@/components/search/highlighted-text'
import { formatDate, formatCurrency, isClosingSoon } from '@/lib/utils'
import type { Tender, TenderDocument } from '@/types'
import { ExternalLink, FileText, Calendar, MapPin, Building2, DollarSign } from 'lucide-react'

interface TenderCardProps {
  tender: Tender
  highlightTerms?: string[]
  onDocumentClick?: (document: TenderDocument) => void
}

/**
 * TenderCard component displays individual tender information in a card format
 * Includes highlighting for search terms and special styling for urgent tenders
 */
export const TenderCard: React.FC<TenderCardProps> = ({
  tender,
  highlightTerms = [],
  onDocumentClick
}) => {
  const searchQuery = highlightTerms.join(' ')
  const closingSoon = isClosingSoon(tender.date_closing)
  const isOpen = tender.status === 'open'

  const handleDocumentClick = (document: TenderDocument) => {
    if (onDocumentClick) {
      onDocumentClick(document)
    } else {
      // Default behavior: open document in new tab
      window.open(document.url, '_blank', 'noopener,noreferrer')
    }
  }

  const getStatusBadgeVariant = (status: Tender['status']) => {
    switch (status) {
      case 'open':
        return 'default'
      case 'closed':
        return 'secondary'
      case 'cancelled':
        return 'destructive'
      case 'awarded':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: Tender['status']) => {
    switch (status) {
      case 'open':
        return 'Open'
      case 'closed':
        return 'Closed'
      case 'cancelled':
        return 'Cancelled'
      case 'awarded':
        return 'Awarded'
      default:
        return status
    }
  }

  return (
    <Card className="h-full transition-all duration-200 hover:shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="text-lg leading-tight">
            <HighlightedText
              text={tender.title}
              searchQuery={searchQuery}
              className="font-semibold"
            />
          </CardTitle>
          <div className="flex flex-col gap-2 shrink-0">
            <Badge variant={getStatusBadgeVariant(tender.status)}>
              {getStatusLabel(tender.status)}
            </Badge>
            {closingSoon && isOpen && (
              <Badge variant="destructive" className="text-xs">
                Closing Soon
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {tender.description && (
          <div>
            <p className="text-sm text-muted-foreground line-clamp-3">
              <HighlightedText
                text={tender.description}
                searchQuery={searchQuery}
              />
            </p>
          </div>
        )}

        {/* Key Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {/* Buyer */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Buyer</p>
              <p className="font-medium truncate">
                <HighlightedText
                  text={tender.buyer_name}
                  searchQuery={searchQuery}
                />
              </p>
            </div>
          </div>

          {/* Province */}
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Province</p>
              <p className="font-medium truncate">{tender.province}</p>
            </div>
          </div>

          {/* Industry */}
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Industry</p>
              <p className="font-medium truncate">{tender.industry}</p>
            </div>
          </div>

          {/* Value */}
          {tender.value_amount && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Value</p>
                <p className="font-medium truncate">
                  {formatCurrency(tender.value_amount, tender.value_currency)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="flex flex-col sm:flex-row gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Published</p>
              <p className="font-medium">{formatDate(tender.date_published)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className={`h-4 w-4 shrink-0 ${closingSoon && isOpen ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div>
              <p className="text-xs text-muted-foreground">Closing Date</p>
              <p className={`font-medium ${closingSoon && isOpen ? 'text-destructive font-semibold' : ''}`}>
                {formatDate(tender.date_closing)}
              </p>
            </div>
          </div>
        </div>

        {/* Documents */}
        {tender.documents && tender.documents.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <FileText className="h-3 w-3" />
              Documents ({tender.documents.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {tender.documents.map((document) => (
                <Button
                  key={document.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDocumentClick(document)}
                  className="h-auto py-1.5 px-2 text-xs"
                >
                  <FileText className="h-3 w-3 mr-1" />
                  <span className="truncate max-w-[120px]">
                    {document.title}
                  </span>
                  <span className="text-muted-foreground ml-1">
                    ({document.format.toUpperCase()})
                  </span>
                  <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Submission Method */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Submission Method: <span className="font-medium">{tender.submission_method}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default TenderCard