'use client'

import { useState } from 'react'
import DamageReportForm from '@/components/DamageReportForm'

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Report Property Damage
          </h1>
          <p className="text-gray-600 mb-8">
            Help us assess the damage by providing accurate information about your property.
            All information will be used to allocate resources and support rebuilding efforts.
          </p>
          <DamageReportForm />
        </div>
      </div>
    </div>
  )
}

