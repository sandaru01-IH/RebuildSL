'use client'

import { useState, useEffect } from 'react'
import { Download, LogOut, Search, Filter, Eye, EyeOff, RefreshCw } from 'lucide-react'
import type { DamageReport } from '@/lib/supabase/types'

interface AdminDashboardProps {
  onLogout: () => void
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [reports, setReports] = useState<DamageReport[]>([])
  const [filteredReports, setFilteredReports] = useState<DamageReport[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [gndFilter, setGndFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const itemsPerPage = 50

  const loadReports = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: ((page - 1) * itemsPerPage).toString(),
        sort_by: sortBy,
        sort_order: sortOrder
      })
      
      if (gndFilter) params.append('gnd_code', gndFilter)
      if (statusFilter) params.append('status', statusFilter)

      const response = await fetch(`/api/reports/list?${params}`, {
        credentials: 'include', // Include cookies in request
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const data = await response.json()

      if (response.ok) {
        setReports(data.data || [])
        setFilteredReports(data.data || [])
        setTotalCount(data.count || 0)
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, gndFilter, statusFilter])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadReports(true)
    }, 10000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder, gndFilter, statusFilter])

  // Listen for form submission events
  useEffect(() => {
    const handleReportSubmitted = () => {
      loadReports(true)
    }
    window.addEventListener('damageReportSubmitted', handleReportSubmitted)
    return () => {
      window.removeEventListener('damageReportSubmitted', handleReportSubmitted)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // Client-side search filtering
    let filtered = reports

    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.gnd_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.gnd_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredReports(filtered)
  }, [searchTerm, reports])

  const handleExport = async (format: 'csv' | 'xlsx' | 'geojson') => {
    try {
      const response = await fetch(`/api/reports/export?format=${format}`, {
        credentials: 'include', // Include cookies in request
        headers: {
          'Content-Type': 'application/json',
        }
      })
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `damage_reports.${format === 'geojson' ? 'geojson' : format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting:', error)
      alert('Failed to export data')
    }
  }

  const handleStatusChange = async (reportId: string, newStatus: 'pending' | 'verified' | 'rejected') => {
    try {
      // This would require an API endpoint to update status
      // For now, we'll just reload
      await loadReports()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-gray-300 mt-2 flex items-center space-x-2">
                <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span>Total Reports: <span className="font-semibold text-white">{totalCount}</span></span>
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => loadReports(true)}
                disabled={refreshing || loading}
                className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={() => handleExport('xlsx')}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Excel</span>
                </button>
                <button
                  onClick={() => handleExport('geojson')}
                  className="flex items-center space-x-2 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>GeoJSON</span>
                </button>
              </div>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reports..."
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GND Code
              </label>
              <input
                type="text"
                value={gndFilter}
                onChange={(e) => setGndFilter(e.target.value)}
                placeholder="Filter by GND..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <div className="flex space-x-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="created_at">Date</option>
                  <option value="damage_level">Damage Level</option>
                  <option value="estimated_damage_lkr">Damage Amount</option>
                  <option value="gnd_code">GND Code</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No reports found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GND
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Damage Level
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Damage (LKR)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Affected
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(report.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.gnd_code || 'N/A'}
                          {report.gnd_name && (
                            <div className="text-xs text-gray-500">{report.gnd_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.property_type.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            {report.damage_level}/10
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Number(report.estimated_damage_lkr).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {report.affected_residents}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            report.status === 'verified' ? 'bg-green-100 text-green-800' :
                            report.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t">
                  <div className="text-sm text-gray-700">
                    Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, totalCount)} of {totalCount} results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <EyeOff className="w-6 h-6" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Basic Information</h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Date Submitted</dt>
                      <dd className="text-gray-900">{new Date(selectedReport.created_at).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">GND Code</dt>
                      <dd className="text-gray-900">{selectedReport.gnd_code || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">GND Name</dt>
                      <dd className="text-gray-900">{selectedReport.gnd_name || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Property Type</dt>
                      <dd className="text-gray-900">{selectedReport.property_type.replace('_', ' ')}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Property Condition</dt>
                      <dd className="text-gray-900">{selectedReport.property_condition.replace('_', ' ')}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Damage Assessment</h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Damage Level</dt>
                      <dd className="text-gray-900">{selectedReport.damage_level}/10</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Estimated Damage</dt>
                      <dd className="text-gray-900">LKR {Number(selectedReport.estimated_damage_lkr).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Affected Residents</dt>
                      <dd className="text-gray-900">{selectedReport.affected_residents}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Status</dt>
                      <dd className="text-gray-900">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedReport.status === 'verified' ? 'bg-green-100 text-green-800' :
                          selectedReport.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedReport.status}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700">{selectedReport.description}</p>
                </div>
                {selectedReport.contact_name && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Contact Information</h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-gray-500">Name</dt>
                        <dd className="text-gray-900">{selectedReport.contact_name}</dd>
                      </div>
                      {selectedReport.contact_phone && (
                        <div>
                          <dt className="text-gray-500">Phone</dt>
                          <dd className="text-gray-900">{selectedReport.contact_phone}</dd>
                        </div>
                      )}
                      {selectedReport.contact_email && (
                        <div>
                          <dt className="text-gray-500">Email</dt>
                          <dd className="text-gray-900">{selectedReport.contact_email}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                )}
                {selectedReport.photos && selectedReport.photos.length > 0 && (
                  <div className="md:col-span-2">
                    <h3 className="font-semibold text-gray-900 mb-2">Photos</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedReport.photos.map((photo, index) => (
                        <img
                          key={index}
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

