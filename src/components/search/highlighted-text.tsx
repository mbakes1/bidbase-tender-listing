'use client'

import * as React from 'react'
import { highlightSearchTerms, parseSearchTerms } from '@/lib/utils'

interface HighlightedTextProps {
  text: string
  searchQuery?: string
  className?: string
}

/**
 * Component that highlights search terms within text
 * Uses dangerouslySetInnerHTML to render highlighted HTML
 */
export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  searchQuery,
  className
}) => {
  const highlightedText = React.useMemo(() => {
    if (!searchQuery || !text) {
      return text
    }

    const searchTerms = parseSearchTerms(searchQuery)
    return highlightSearchTerms(text, searchTerms)
  }, [text, searchQuery])

  // If no search query, render plain text
  if (!searchQuery) {
    return <span className={className}>{text}</span>
  }

  // Render highlighted text with HTML
  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: highlightedText }}
    />
  )
}

export default HighlightedText