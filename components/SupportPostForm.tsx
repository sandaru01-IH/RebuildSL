'use client'

import { useState } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { validateSupportPost } from '@/lib/utils/validation'

interface SupportPostFormProps {
  onSuccess: () => void
}

export default function SupportPostForm({ onSuccess }: SupportPostFormProps) {
  const [formData, setFormData] = useState({
    organization_name: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    support_type: '',
    description: '',
    location_preference: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitStatus('idle')

    const validationErrors = validateSupportPost(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/support/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          setSubmitStatus('error')
        }
        return
      }

      setSubmitStatus('success')
      // Reset form
      setFormData({
        organization_name: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        support_type: '',
        description: '',
        location_preference: ''
      })
      
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.organization_name}
            onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="NGO, Company, or Individual"
          />
          {errors.organization_name && (
            <p className="mt-1 text-sm text-red-600">{errors.organization_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.contact_name}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          {errors.contact_name && (
            <p className="mt-1 text-sm text-red-600">{errors.contact_name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            value={formData.contact_phone}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="+94 XX XXX XXXX"
          />
          {errors.contact_phone && (
            <p className="mt-1 text-sm text-red-600">{errors.contact_phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            value={formData.contact_email}
            onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Support Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.support_type}
            onChange={(e) => setFormData(prev => ({ ...prev, support_type: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select support type</option>
            <option value="food_packs">Food Packs</option>
            <option value="medicine">Medicine & Medical Supplies</option>
            <option value="cleaning_equipment">Cleaning Equipment</option>
            <option value="housing_materials">Housing Materials</option>
            <option value="volunteer_labor">Volunteer Labor</option>
            <option value="financial_assistance">Financial Assistance</option>
            <option value="transportation">Transportation</option>
            <option value="other">Other</option>
          </select>
          {errors.support_type && (
            <p className="mt-1 text-sm text-red-600">{errors.support_type}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Please provide details about the support you can offer..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location Preference (Optional)
          </label>
          <input
            type="text"
            value={formData.location_preference}
            onChange={(e) => setFormData(prev => ({ ...prev, location_preference: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Specific district, GND, or area if applicable"
          />
        </div>
      </div>

      {submitStatus === 'success' && (
        <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">
            Support post submitted successfully!
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">
            Failed to submit support post. Please try again.
          </p>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Post Support Offer'}
        </button>
      </div>
    </form>
  )
}

