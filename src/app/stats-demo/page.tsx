'use client'

import React, { useState } from 'react'
import { StatsDashboard } from '@/components/stats'
import type { PlatformStats } from '@/types'

const mockStats: PlatformStats = {
  total_tenders: 1250,
  open_tenders: 850,
  closing_soon_tenders: 45,
  total_value: 5000000,
  last_updated: new Date(Date.now() - 30 * 60 * 1000).toISOString() // 30 minutes ago
}

const largeStats: PlatformStats = {
  total_tenders: 12500,
  open_tenders: 8500,
  closing_soon_tenders: 450,
  total_value: 50000000,
  last_updated: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
}

const oldStats: PlatformStats = {
  total_tenders: 500,
  open_tenders: 300,
  closing_soon_tenders: 15,
  total_value: 2000000,
  last_updated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
}

export default function StatsDemoPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [currentStats, setCurrentStats] = useState<PlatformStats>(mockStats)

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Statistics Dashboard Demo</h1>
      
      {/* Controls */}
      <div className="flex gap-4 flex-wrap">
        <button
          onClick={() => setCurrentStats(mockStats)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Normal Stats
        </button>
        <button
          onClick={() => setCurrentStats(largeStats)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Large Numbers
        </button>
        <button
          onClick={() => setCurrentStats(oldStats)}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Old Data
        </button>
        <button
          onClick={() => setIsLoading(!isLoading)}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Toggle Loading
        </button>
      </div>

      {/* Demo Sections */}
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Current Demo</h2>
          <StatsDashboard stats={currentStats} isLoading={isLoading} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Loading State</h2>
          <StatsDashboard isLoading={true} />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">No Data</h2>
          <StatsDashboard />
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">With Custom Class</h2>
          <StatsDashboard 
            stats={mockStats} 
            className="bg-gray-50 p-6 rounded-lg border"
          />
        </section>
      </div>
    </div>
  )
}