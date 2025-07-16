"use client"

import * as React from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import type { SearchFilters, FilterOptions } from "@/types"

export interface FilterPanelProps {
  filters: SearchFilters
  filterOptions: FilterOptions
  onChange: (filters: SearchFilters) => void
  onReset: () => void
  className?: string
}

export function FilterPanel({
  filters,
  filterOptions,
  onChange,
  onReset,
  className
}: FilterPanelProps) {
  const handleProvinceChange = (value: string) => {
    const newFilters = { ...filters }
    if (value === "all") {
      delete newFilters.province
    } else {
      newFilters.province = value
    }
    onChange(newFilters)
  }

  const handleIndustryChange = (value: string) => {
    const newFilters = { ...filters }
    if (value === "all") {
      delete newFilters.industry
    } else {
      newFilters.industry = value
    }
    onChange(newFilters)
  }

  const hasActiveFilters = filters.province || filters.industry

  return (
    <div className={cn(
      "flex flex-col gap-4 p-4 bg-card rounded-lg border",
      "sm:flex-row sm:items-center sm:gap-6",
      className
    )}>
      {/* Province Filter */}
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <label 
          htmlFor="province-select" 
          className="text-sm font-medium text-foreground"
        >
          Province
        </label>
        <Select
          value={filters.province || "all"}
          onValueChange={handleProvinceChange}
        >
          <SelectTrigger 
            id="province-select"
            className="w-full"
            aria-label="Select province filter"
          >
            <SelectValue placeholder="All Provinces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Provinces
              {filterOptions.provinces.length > 0 && filterOptions.provinces.some(p => p.count !== undefined) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({filterOptions.provinces.reduce((sum, p) => sum + (p.count || 0), 0)})
                </span>
              )}
            </SelectItem>
            {filterOptions.provinces.map((province) => (
              <SelectItem key={province.value} value={province.value}>
                {province.label}
                {province.count !== undefined && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({province.count})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Industry Filter */}
      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <label 
          htmlFor="industry-select" 
          className="text-sm font-medium text-foreground"
        >
          Industry
        </label>
        <Select
          value={filters.industry || "all"}
          onValueChange={handleIndustryChange}
        >
          <SelectTrigger 
            id="industry-select"
            className="w-full"
            aria-label="Select industry filter"
          >
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              All Industries
              {filterOptions.industries.length > 0 && filterOptions.industries.some(i => i.count !== undefined) && (
                <span className="ml-2 text-xs text-muted-foreground">
                  ({filterOptions.industries.reduce((sum, i) => sum + (i.count || 0), 0)})
                </span>
              )}
            </SelectItem>
            {filterOptions.industries.map((industry) => (
              <SelectItem key={industry.value} value={industry.value}>
                {industry.label}
                {industry.count !== undefined && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({industry.count})
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <div className="flex flex-col gap-2 sm:self-end">
          <div className="hidden sm:block text-sm font-medium text-transparent">
            {/* Spacer for alignment */}
            &nbsp;
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="flex items-center gap-2 whitespace-nowrap"
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
}