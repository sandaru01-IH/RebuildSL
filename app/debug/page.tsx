'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react'
import { createSupabaseClient } from '@/lib/supabase/client'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  details?: any
}

export default function DebugPage() {
  const [tests, setTests] = useState<TestResult[]>([])
  const [running, setRunning] = useState(false)

  const runTests = async () => {
    setRunning(true)
    const results: TestResult[] = []

    // Test 1: Environment Variables
    results.push({
      name: 'Environment Variables',
      status: 'pending',
      message: 'Checking...'
    })
    setTests([...results])

    const hasEnvVars = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    results[0] = {
      name: 'Environment Variables',
      status: hasEnvVars ? 'success' : 'error',
      message: hasEnvVars ? 'All required environment variables are set' : 'Missing environment variables',
      details: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    }
    setTests([...results])

    // Test 2: Supabase Connection
    results.push({
      name: 'Supabase Connection',
      status: 'pending',
      message: 'Testing...'
    })
    setTests([...results])

    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.from('damage_reports').select('count').limit(1)
      
      results[1] = {
        name: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? `Connection failed: ${error.message}` : 'Successfully connected to Supabase',
        details: error ? error : { connected: true }
      }
    } catch (error: any) {
      results[1] = {
        name: 'Supabase Connection',
        status: 'error',
        message: `Error: ${error.message}`,
        details: error
      }
    }
    setTests([...results])

    // Test 3: Database Tables
    results.push({
      name: 'Database Tables',
      status: 'pending',
      message: 'Checking...'
    })
    setTests([...results])

    try {
      const supabase = createSupabaseClient()
      const tables = ['damage_reports', 'support_posts', 'admin_users']
      const tableResults: any = {}

      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('count').limit(1)
        tableResults[table] = error ? { error: error.message } : { exists: true }
      }

      results[2] = {
        name: 'Database Tables',
        status: Object.values(tableResults).every((r: any) => r.exists) ? 'success' : 'error',
        message: 'All required tables exist',
        details: tableResults
      }
    } catch (error: any) {
      results[2] = {
        name: 'Database Tables',
        status: 'error',
        message: `Error: ${error.message}`,
        details: error
      }
    }
    setTests([...results])

    // Test 4: API Endpoints
    results.push({
      name: 'API Endpoints',
      status: 'pending',
      message: 'Testing...'
    })
    setTests([...results])

    try {
      const endpoints = [
        { name: 'Aggregate Reports', url: '/api/reports/aggregate' },
        { name: 'Support List', url: '/api/support/list' }
      ]
      const endpointResults: any = {}

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url)
          endpointResults[endpoint.name] = {
            status: response.status,
            ok: response.ok
          }
        } catch (error: any) {
          endpointResults[endpoint.name] = { error: error.message }
        }
      }

      results[3] = {
        name: 'API Endpoints',
        status: Object.values(endpointResults).every((r: any) => r.ok) ? 'success' : 'error',
        message: 'API endpoints are accessible',
        details: endpointResults
      }
    } catch (error: any) {
      results[3] = {
        name: 'API Endpoints',
        status: 'error',
        message: `Error: ${error.message}`,
        details: error
      }
    }
    setTests([...results])

    // Test 5: GND GeoJSON
    results.push({
      name: 'GND GeoJSON',
      status: 'pending',
      message: 'Checking...'
    })
    setTests([...results])

    try {
      const response = await fetch('/gnd.geojson')
      if (response.ok) {
        const data = await response.json()
        results[4] = {
          name: 'GND GeoJSON',
          status: 'success',
          message: `GeoJSON loaded successfully with ${data.features?.length || 0} features`,
          details: {
            featureCount: data.features?.length || 0,
            type: data.type
          }
        }
      } else {
        results[4] = {
          name: 'GND GeoJSON',
          status: 'error',
          message: 'GND GeoJSON file not found',
          details: { status: response.status }
        }
      }
    } catch (error: any) {
      results[4] = {
        name: 'GND GeoJSON',
        status: 'error',
        message: `Error: ${error.message}`,
        details: error
      }
    }
    setTests([...results])

    // Test 6: Storage Bucket
    results.push({
      name: 'Storage Bucket',
      status: 'pending',
      message: 'Checking...'
    })
    setTests([...results])

    try {
      const supabase = createSupabaseClient()
      const { data, error } = await supabase.storage.from('damage-photos').list('', { limit: 1 })
      
      results[5] = {
        name: 'Storage Bucket',
        status: error ? 'error' : 'success',
        message: error ? `Bucket not accessible: ${error.message}` : 'Storage bucket is accessible',
        details: error ? error : { accessible: true }
      }
    } catch (error: any) {
      results[5] = {
        name: 'Storage Bucket',
        status: 'error',
        message: `Error: ${error.message}`,
        details: error
      }
    }
    setTests([...results])

    setRunning(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      case 'pending':
        return <Loader className="w-5 h-5 text-gray-400 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">System Debug & Testing</h1>
          <p className="text-gray-600 mb-6">
            Run diagnostic tests to verify system functionality and identify issues.
          </p>

          <button
            onClick={runTests}
            disabled={running}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
          >
            {running ? 'Running Tests...' : 'Run All Tests'}
          </button>

          {tests.length > 0 && (
            <div className="space-y-4">
              {tests.map((test, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(test.status)}
                      <h3 className="font-semibold text-gray-900">{test.name}</h3>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      test.status === 'success' ? 'bg-green-100 text-green-800' :
                      test.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{test.message}</p>
                  {test.details && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                        View Details
                      </summary>
                      <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-auto">
                        {JSON.stringify(test.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          {tests.length === 0 && !running && (
            <div className="text-center py-12 text-gray-500">
              Click "Run All Tests" to start diagnostics
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

