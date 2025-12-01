'use client'

import { useState, useEffect } from 'react'
import { Phone, Mail, MapPin, Calendar } from 'lucide-react'
import type { SupportPost } from '@/lib/supabase/types'

export default function SupportPostList() {
  const [posts, setPosts] = useState<SupportPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/support/list')
      .then(res => res.json())
      .then(data => {
        setPosts(data.data || [])
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading support posts:', err)
        setLoading(false)
      })
  }, [])

  const getSupportTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      food_packs: 'Food Packs',
      medicine: 'Medicine & Medical Supplies',
      cleaning_equipment: 'Cleaning Equipment',
      housing_materials: 'Housing Materials',
      volunteer_labor: 'Volunteer Labor',
      financial_assistance: 'Financial Assistance',
      transportation: 'Transportation',
      other: 'Other'
    }
    return labels[type] || type
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <p className="text-gray-600 text-lg">
          No support posts available at the moment.
        </p>
        <p className="text-gray-500 mt-2">
          Be the first to offer support!
        </p>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {post.organization_name}
            </h3>
            <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 text-sm font-medium rounded-full">
              {getSupportTypeLabel(post.support_type)}
            </span>
          </div>

          <p className="text-gray-700 mb-4 line-clamp-3">
            {post.description}
          </p>

          <div className="space-y-2 text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>{post.contact_phone}</span>
            </div>
            {post.contact_email && (
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>{post.contact_email}</span>
              </div>
            )}
            {post.location_preference && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{post.location_preference}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Posted {new Date(post.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Contact: <span className="font-medium text-gray-700">{post.contact_name}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

