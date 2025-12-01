'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import DamageMap from '@/components/DamageMap'

// Dynamically import the map component to avoid SSR issues with Leaflet
const DynamicDamageMap = dynamic(() => import('@/components/DamageMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading map...</p>
      </div>
    </div>
  )
})

export default function MapPage() {
  return (
    <div className="min-h-screen">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">
            Damage Assessment Map
          </h1>
          <p className="text-sm md:text-base text-gray-600 hidden sm:block">
            View aggregated damage data by GND (Grama Niladhari Division). 
            Hover over areas to see statistics, click for detailed information.
          </p>
          <p className="text-xs text-gray-600 sm:hidden">
            Tap areas for details. Use buttons to toggle panels.
          </p>
        </div>
      </div>
      <DynamicDamageMap />
    </div>
  )
}

