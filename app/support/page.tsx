'use client'

import { useState, useEffect } from 'react'
import SupportPostForm from '@/components/SupportPostForm'
import SupportPostList from '@/components/SupportPostList'
import { Heart, Plus } from 'lucide-react'

export default function SupportPage() {
  const [showForm, setShowForm] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleSubmitSuccess = () => {
    setShowForm(false)
    setRefreshKey(prev => prev + 1)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Support & Rebuild
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            NGOs, organizations, and volunteers can post available resources and support.
            Help coordinate relief efforts and connect communities with the assistance they need.
          </p>
        </div>

        <div className="mb-6 flex justify-center">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Post Support Offer</span>
            </button>
          ) : (
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Post Support Offer
              </h2>
              <SupportPostForm onSuccess={handleSubmitSuccess} />
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Available Support
          </h2>
          <SupportPostList key={refreshKey} />
        </div>
      </div>
    </div>
  )
}

