'use client'

import { useState, useRef, useEffect } from 'react'
import { Upload, MapPin, X, CheckCircle, AlertCircle, Search } from 'lucide-react'
import { validateDamageReport } from '@/lib/utils/validation'
import { loadGNDGeoJSONClient, extractGNDList } from '@/lib/utils/gnd-loader-client'

interface FormData {
  property_type: string
  property_condition: string
  damage_level: number
  estimated_damage_lkr: number
  affected_residents: number
  description: string
  contact_name: string
  contact_phone: string
  contact_email: string
  photos: string[]
  location: { lat: number; lng: number } | null
  gnd_code: string
  gnd_name: string
}

interface GNDOption {
  code: string
  name: string
}

export default function DamageReportForm() {
  const [formData, setFormData] = useState<FormData>({
    property_type: '',
    property_condition: '',
    damage_level: 5,
    estimated_damage_lkr: 0,
    affected_residents: 0,
    description: '',
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    photos: [],
    location: null,
    gnd_code: '',
    gnd_name: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [locationError, setLocationError] = useState<string>('')
  const [gndList, setGndList] = useState<GNDOption[]>([])
  const [gndSearchTerm, setGndSearchTerm] = useState('')
  const [showGndDropdown, setShowGndDropdown] = useState(false)
  const [loadingGND, setLoadingGND] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const gndDropdownRef = useRef<HTMLDivElement>(null)

  // Load GND list on mount
  useEffect(() => {
    loadGNDGeoJSONClient()
      .then(geoJSON => {
        if (geoJSON) {
          const gnds = extractGNDList(geoJSON)
          setGndList(gnds)
          setLoadingGND(false)
        } else {
          setLoadingGND(false)
        }
      })
      .catch(err => {
        console.error('Error loading GND list:', err)
        setLoadingGND(false)
      })
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gndDropdownRef.current && !gndDropdownRef.current.contains(event.target as Node)) {
        setShowGndDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser')
      return
    }

    setLocationError('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        }))
      },
      (error) => {
        setLocationError('Unable to retrieve your location. Please enable location services.')
        console.error('Geolocation error:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const uploadPromises = Array.from(files).map(async (file) => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return null
      }

      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large. Maximum size is 5MB`)
        return null
      }

      const formData = new FormData()
      formData.append('file', file)

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          throw new Error('Upload failed')
        }

        const data = await response.json()
        return data.url
      } catch (error) {
        console.error('Error uploading file:', error)
        alert(`Failed to upload ${file.name}`)
        return null
      }
    })

    const urls = await Promise.all(uploadPromises)
    const validUrls = urls.filter((url): url is string => url !== null)

    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...validUrls]
    }))
  }

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }))
  }

  const filteredGNDs = gndList.filter(gnd =>
    gnd.name.toLowerCase().includes(gndSearchTerm.toLowerCase()) ||
    gnd.code.toLowerCase().includes(gndSearchTerm.toLowerCase())
  )

  const handleGNDSelect = (gnd: GNDOption) => {
    setFormData(prev => ({
      ...prev,
      gnd_code: gnd.code,
      gnd_name: gnd.name
    }))
    setGndSearchTerm(gnd.name)
    setShowGndDropdown(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setSubmitStatus('idle')

    const validationErrors = validateDamageReport(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/reports/submit', {
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
      
      // Trigger map refresh event for real-time update
      window.dispatchEvent(new CustomEvent('damageReportSubmitted', { 
        detail: { gndCode: formData.gnd_code, gndName: formData.gnd_name } 
      }))
      
      // Reset form
      setFormData({
        property_type: '',
        property_condition: '',
        damage_level: 5,
        estimated_damage_lkr: 0,
        affected_residents: 0,
        description: '',
        contact_name: '',
        contact_phone: '',
        contact_email: '',
        photos: [],
        location: null,
        gnd_code: '',
        gnd_name: ''
      })
      setGndSearchTerm('')
    } catch (error) {
      console.error('Error submitting form:', error)
      setSubmitStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* GND Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          GND (Grama Niladhari Division) <span className="text-red-500">*</span>
        </label>
        <div className="relative" ref={gndDropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={gndSearchTerm}
              onChange={(e) => {
                setGndSearchTerm(e.target.value)
                setShowGndDropdown(true)
                if (!e.target.value) {
                  setFormData(prev => ({ ...prev, gnd_code: '', gnd_name: '' }))
                }
              }}
              onFocus={() => setShowGndDropdown(true)}
              placeholder={loadingGND ? "Loading GND list..." : "Search for GND by name or code..."}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
            {formData.gnd_name && (
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, gnd_code: '', gnd_name: '' }))
                  setGndSearchTerm('')
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {showGndDropdown && filteredGNDs.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {filteredGNDs.slice(0, 100).map((gnd) => (
                <button
                  key={gnd.code}
                  type="button"
                  onClick={() => handleGNDSelect(gnd)}
                  className="w-full text-left px-4 py-2 hover:bg-primary-50 focus:bg-primary-50 focus:outline-none"
                >
                  <div className="font-medium text-gray-900">{gnd.name}</div>
                  <div className="text-sm text-gray-500">Code: {gnd.code}</div>
                </button>
              ))}
              {filteredGNDs.length > 100 && (
                <div className="px-4 py-2 text-sm text-gray-500 border-t">
                  Showing first 100 results. Type to narrow down.
                </div>
              )}
            </div>
          )}
          
          {formData.gnd_name && (
            <div className="mt-2 flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-green-800">{formData.gnd_name}</div>
                <div className="text-xs text-green-600">Code: {formData.gnd_code}</div>
              </div>
            </div>
          )}
        </div>
        {errors.gnd && (
          <p className="mt-1 text-sm text-red-600">{errors.gnd}</p>
        )}
        {loadingGND && (
          <p className="mt-1 text-sm text-gray-500">Loading GND list from GeoJSON...</p>
        )}
      </div>

      {/* Location (Optional - for post-processing) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location (Optional - for post-processing)
        </label>
        {!formData.location ? (
          <div>
            <button
              type="button"
              onClick={getLocation}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              <MapPin className="w-5 h-5" />
              <span>Get My Location</span>
            </button>
            {locationError && (
              <p className="mt-2 text-sm text-red-600">{locationError}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Optional: Capture your location for post-processing and verification.
            </p>
          </div>
        ) : (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-sm text-green-800">
              Location captured: {formData.location.lat.toFixed(6)}, {formData.location.lng.toFixed(6)}
            </span>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, location: null }))}
              className="ml-auto text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Property Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.property_type}
          onChange={(e) => setFormData(prev => ({ ...prev, property_type: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
        >
          <option value="">Select property type</option>
          <option value="residential_house">Residential House</option>
          <option value="apartment">Apartment</option>
          <option value="commercial">Commercial Building</option>
          <option value="school">School</option>
          <option value="hospital">Hospital/Clinic</option>
          <option value="road">Road/Infrastructure</option>
          <option value="other">Other</option>
        </select>
        {errors.property_type && (
          <p className="mt-1 text-sm text-red-600">{errors.property_type}</p>
        )}
      </div>

      {/* Property Condition */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Condition <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.property_condition}
          onChange={(e) => setFormData(prev => ({ ...prev, property_condition: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
        >
          <option value="">Select condition</option>
          <option value="completely_destroyed">Completely Destroyed</option>
          <option value="severely_damaged">Severely Damaged</option>
          <option value="moderately_damaged">Moderately Damaged</option>
          <option value="minor_damage">Minor Damage</option>
        </select>
        {errors.property_condition && (
          <p className="mt-1 text-sm text-red-600">{errors.property_condition}</p>
        )}
      </div>

      {/* Damage Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Damage Level (1-10) <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="1"
            max="10"
            value={formData.damage_level}
            onChange={(e) => setFormData(prev => ({ ...prev, damage_level: parseInt(e.target.value) }))}
            className="flex-1"
          />
          <span className="text-lg font-semibold text-gray-700 w-8 text-center">
            {formData.damage_level}
          </span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          1 = Minimal damage, 10 = Complete destruction
        </p>
        {errors.damage_level && (
          <p className="mt-1 text-sm text-red-600">{errors.damage_level}</p>
        )}
      </div>

      {/* Estimated Damage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Estimated Damage (LKR) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="0"
          step="1000"
          value={formData.estimated_damage_lkr || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, estimated_damage_lkr: parseFloat(e.target.value) || 0 }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          placeholder="0"
        />
        {errors.estimated_damage_lkr && (
          <p className="mt-1 text-sm text-red-600">{errors.estimated_damage_lkr}</p>
        )}
      </div>

      {/* Affected Residents */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Affected Residents <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min="0"
          value={formData.affected_residents || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, affected_residents: parseInt(e.target.value) || 0 }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          placeholder="0"
        />
        {errors.affected_residents && (
          <p className="mt-1 text-sm text-red-600">{errors.affected_residents}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
          placeholder="Please provide a detailed description of the damage..."
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Photos (Optional)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Upload className="w-5 h-5" />
          <span>Upload Photos</span>
        </button>
        {formData.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {formData.photos.map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contact Information (Optional) */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information (Optional)</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.contact_name}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.contact_phone}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            />
          </div>
        </div>
      </div>

      {/* Submit Status */}
      {submitStatus === 'success' && (
        <div className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-green-800">
            Report submitted successfully! Thank you for helping us assess the damage.
          </p>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-red-800">
            Failed to submit report. Please try again.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Damage Report'}
        </button>
      </div>
    </form>
  )
}

