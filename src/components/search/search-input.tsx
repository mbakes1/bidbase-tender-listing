'use client'

import * as React from 'react'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SearchInputProps } from '@/types'

/**
 * SearchInput component with debounced search functionality
 * Provides controlled input handling, clear functionality, and loading states
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onChange, onClear, placeholder = 'Search tenders...', isLoading = false, className, ...props }, ref) => {
    const [isFocused, setIsFocused] = React.useState(false)

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value)
    }

    const handleClear = () => {
      onClear()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        handleClear()
      }
    }

    const showClearButton = value.length > 0
    const showLoadingSpinner = isLoading && value.length > 0

    return (
      <div className={cn('relative flex items-center', className)}>
        {/* Search icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <Search className="h-4 w-4" />
        </div>

        {/* Input field */}
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'pl-10 pr-20',
            isFocused && 'ring-2 ring-ring ring-offset-2',
            className
          )}
          {...props}
        />

        {/* Right side controls */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {/* Loading spinner */}
          {showLoadingSpinner && (
            <div className="text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {/* Clear button */}
          {showClearButton && !showLoadingSpinner && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    )
  }
)

SearchInput.displayName = 'SearchInput'

export default SearchInput