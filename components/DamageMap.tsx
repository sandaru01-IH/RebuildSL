'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, Popup, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BarChart3, Users, Home, DollarSign, RefreshCw, Menu, X, Info, Moon, Sun } from 'lucide-react'

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

type AggregatedDataItem = {
  code: string
  name: string
  count: number
  totalDamage: number
  avgDamageLevel: number
  totalAffected: number
  propertyTypes: Record<string, number>
  severity: 'low' | 'medium' | 'high'
}

interface AggregatedData {
  [gndCode: string]: AggregatedDataItem
}

interface GNDFeature {
  type: 'Feature'
  properties: {
    gnd_code?: string
    code?: string
    GND_CODE?: string
    gnd_name?: string
    name?: string
    GND_NAME?: string
    shapeName?: string
    shapeID?: string
    [key: string]: any
  }
  geometry: {
    type: 'Polygon' | 'MultiPolygon'
    coordinates: number[][][] | number[][][][]
  }
}

export default function DamageMap() {
  const [aggregatedData, setAggregatedData] = useState<AggregatedData>({})
  const [gndGeoJSON, setGndGeoJSON] = useState<GeoJSON.FeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedGND, setSelectedGND] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalReports: 0,
    totalDamage: 0,
    totalAffected: 0,
    mostDamagedGND: { name: 'N/A', count: 0 }
  })
  const [refreshing, setRefreshing] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showStatsPanel, setShowStatsPanel] = useState(true)
  const [showLegendPanel, setShowLegendPanel] = useState(true)
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>(() => {
    // Default to dark, check localStorage for saved preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mapTheme')
      return (saved === 'dark' || saved === 'light') ? saved : 'dark'
    }
    return 'dark'
  })

  const loadAggregatedData = async () => {
    setRefreshing(true)
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = Date.now()
      const res = await fetch(`/api/reports/aggregate?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      const data = await res.json()
      
      // Handle warnings (200 status but with warning message)
      if (data.warning) {
        console.warn('⚠️', data.warning)
      }
      
      // Even if there's an error in the response, use empty aggregated data
      if (data.error && !data.aggregated) {
        console.error('❌ API returned error:', data.error, data.details)
        // Set empty aggregated data instead of throwing
        setAggregatedData({})
        setStats({
          totalReports: 0,
          totalDamage: 0,
          totalAffected: 0,
          mostDamagedGND: { name: 'N/A', count: 0 }
        })
        return
      }
      
      if (!res.ok && res.status !== 200) {
        throw new Error(`HTTP error! status: ${res.status}`)
      }
      const aggregated = data.aggregated || {}
      if (Object.keys(aggregated).length > 0) {
        console.log('📊 Aggregated data loaded:', Object.keys(aggregated).length, 'GNDs')
      }
      // Always set the aggregated data (even if empty) to clear stale data
      setAggregatedData(aggregated)
      
      // Calculate overall stats from aggregated data
      const aggregatedValues = Object.values(aggregated) as any[]
      const totalReports = aggregatedValues.reduce((sum: number, item: any) => sum + (item.count || 0), 0)
      const totalDamage = aggregatedValues.reduce((sum: number, item: any) => sum + (item.totalDamage || 0), 0)
      const totalAffected = aggregatedValues.reduce((sum: number, item: any) => sum + (item.totalAffected || 0), 0)
      const mostDamaged = aggregatedValues.length > 0 
        ? aggregatedValues.reduce((max: any, item: any) => 
            (item.count || 0) > (max.count || 0) ? item : max, 
            aggregatedValues[0]
          )
        : { name: 'N/A', count: 0 }
      
      setStats({
        totalReports,
        totalDamage,
        totalAffected,
        mostDamagedGND: { name: mostDamaged.name || 'N/A', count: mostDamaged.count || 0 }
      })
      // Force map re-render by updating refresh key
      setRefreshKey(prev => prev + 1)
    } catch (err: any) {
      console.error('❌ Error loading aggregated data:', err.message || err)
      // Don't clear existing data on error, just log it
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Load data on mount
    loadAggregatedData()
    
    // Listen for form submission events to refresh when data is imported/submitted
    const handleReportSubmitted = (event: any) => {
      console.log('📝 Report submitted, refreshing map data...', event.detail)
      // Small delay to ensure database has updated
      setTimeout(() => {
        loadAggregatedData()
      }, 1000)
    }
    window.addEventListener('damageReportSubmitted', handleReportSubmitted)
    
    return () => {
      window.removeEventListener('damageReportSubmitted', handleReportSubmitted)
    }
  }, [])

  useEffect(() => {
    // Load GND GeoJSON
    // You'll need to provide your GND GeoJSON file
    // For now, we'll try to load it from /public/gnd.geojson
    fetch('/gnd.geojson')
      .then(res => {
        if (res.ok) {
          return res.json()
        }
        throw new Error('GND GeoJSON not found')
      })
      .then(data => {
        setGndGeoJSON(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error loading GND GeoJSON:', err)
        setLoading(false)
        // Create a placeholder message
        setGndGeoJSON({
          type: 'FeatureCollection',
          features: []
        })
      })
  }, [])

  // Save map theme preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('mapTheme', mapTheme)
    }
  }, [mapTheme])

  const toggleMapTheme = () => {
    setMapTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      // Force map re-render when theme changes
      setRefreshKey(prevKey => prevKey + 1)
      return newTheme
    })
  }

  const getColor = (severity: 'low' | 'medium' | 'high' | undefined) => {
    switch (severity) {
      case 'high':
        return '#dc2626' // red
      case 'medium':
        return '#f59e0b' // amber
      case 'low':
        return '#10b981' // green
      default:
        return '#9ca3af' // gray
    }
  }

  // Helper function to normalize GND name (EXACTLY same as aggregation)
  const normalizeGNDName = useCallback((name: string): string => {
    if (!name) return ''
    return name.toLowerCase().trim().replace(/\s+/g, ' ')
  }, [])

  // Helper function to find data for a feature
  const findDataForFeature = useCallback((feature: GNDFeature) => {
    // Extract name - prioritize shapeName (GeoJSON format) then others
    const name = feature.properties.shapeName || 
                 feature.properties.gnd_name || 
                 feature.properties.name || 
                 feature.properties.GND_NAME || 
                 ''
    
    // Extract code - prioritize shapeID (GeoJSON format) then others
    const code = feature.properties.shapeID || 
                 feature.properties.gnd_code || 
                 feature.properties.code || 
                 feature.properties.GND_CODE || 
                 null
    
    if (!name) {
      return { data: null, name: 'Unknown', code, nameKey: '' }
    }
    
    // Normalize name: lowercase, trim, and remove extra whitespace (EXACTLY same as aggregation)
    const nameKey = normalizeGNDName(name)
    
    // PRIMARY MATCH: Find by normalized name key (this is how aggregation works)
    let data: AggregatedDataItem | null = aggregatedData[nameKey] || null
    
    // FALLBACK MATCH: If not found by name, try to find by code
    if (!data && code) {
      const codeStr = String(code).trim()
      const found = Object.values(aggregatedData).find((item: any) => {
        const itemCode = String(item.code || '').trim()
        return itemCode === codeStr || itemCode.toLowerCase() === codeStr.toLowerCase()
      })
      data = found || null
    }
    
    return { data, name, code, nameKey }
  }, [aggregatedData, normalizeGNDName])

  // Memoize style function to ensure it updates when aggregatedData changes
  const getStyle = useCallback((feature: GNDFeature | undefined) => {
    if (!feature) {
      return {
        fillColor: '#666',
        fillOpacity: 0.15,
        color: '#666',
        weight: 1,
        opacity: 0.9
      }
    }
    
    const { data } = findDataForFeature(feature)
    const severity = data?.severity

    return {
      fillColor: getColor(severity),
      fillOpacity: severity ? 0.7 : 0.15,
      color: severity ? getColor(severity) : '#666',
      weight: severity ? 2 : 1,
      opacity: 0.9
    }
  }, [findDataForFeature])

  // Memoize onEachFeature to ensure it updates when aggregatedData changes
  const onEachFeature = useCallback((feature: GNDFeature, layer: L.Layer) => {
    const { data, name, code, nameKey } = findDataForFeature(feature)
    
    // Debug logging for matched and unmatched features
    if (Object.keys(aggregatedData).length > 0) {
      const debugKey = `${name}-${code}`
      if (!(window as any).__gndDebugLog) {
        (window as any).__gndDebugLog = new Set()
      }
      
      if (!(window as any).__gndDebugLog.has(debugKey)) {
        (window as any).__gndDebugLog.add(debugKey)
        
        if (data) {
          console.log('✅ GND MATCHED:', {
            featureName: name,
            featureCode: code,
            normalizedKey: nameKey,
            matchedData: { name: data.name, code: data.code, count: data.count }
          })
        } else {
          console.log('❌ GND NOT MATCHED:', {
            featureName: name,
            featureCode: code,
            normalizedKey: nameKey,
            availableKeys: Object.keys(aggregatedData).slice(0, 10),
            availableData: Object.entries(aggregatedData).slice(0, 10).map(([key, val]: [string, any]) => ({ 
              normalizedKey: key, 
              name: val.name, 
              code: val.code 
            }))
          })
        }
      }
    }

    if (data) {
      const severityColor = data.severity === 'high' ? '#dc2626' : data.severity === 'medium' ? '#f59e0b' : '#10b981'
      const isDark = mapTheme === 'dark'
      const textColor = isDark ? '#ffffff' : '#111827'
      const bgColor = isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)'
      const labelColor = isDark ? '#9ca3af' : '#6b7280'
      
      const popupContent = `
        <div style="min-width: 250px; color: ${textColor};">
          <h3 style="font-weight: bold; margin-bottom: 12px; font-size: 16px; color: ${textColor}; border-bottom: 2px solid ${severityColor}; padding-bottom: 8px;">${name}</h3>
          <div style="display: grid; gap: 8px;">
            <div style="display: flex; justify-content: space-between; padding: 6px; background: ${bgColor}; border-radius: 4px;">
              <span style="color: ${labelColor};">GND Code:</span>
              <span style="color: ${textColor}; font-weight: 600;">${code}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px; background: ${bgColor}; border-radius: 4px;">
              <span style="color: ${labelColor};">Reports:</span>
              <span style="color: #60a5fa; font-weight: 600;">${data.count}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px; background: ${bgColor}; border-radius: 4px;">
              <span style="color: ${labelColor};">Total Damage:</span>
              <span style="color: #f59e0b; font-weight: 600;">LKR ${data.totalDamage.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px; background: ${bgColor}; border-radius: 4px;">
              <span style="color: ${labelColor};">Avg Damage Level:</span>
              <span style="color: ${textColor}; font-weight: 600;">${data.avgDamageLevel.toFixed(1)}/10</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px; background: ${bgColor}; border-radius: 4px;">
              <span style="color: ${labelColor};">Affected Residents:</span>
              <span style="color: #f87171; font-weight: 600;">${data.totalAffected}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 6px; background: ${bgColor}; border-radius: 4px; align-items: center;">
              <span style="color: ${labelColor};">Severity:</span>
              <span style="background: ${severityColor}; color: #ffffff; padding: 4px 12px; border-radius: 12px; font-weight: 600; text-transform: capitalize; font-size: 12px;">${data.severity}</span>
            </div>
          </div>
        </div>
      `

      layer.bindPopup(popupContent)
      layer.bindTooltip(`${name}: ${data.count} reports`, {
        permanent: false,
        direction: 'center',
        className: mapTheme === 'dark' ? 'dark-tooltip' : 'light-tooltip'
      })
    } else {
      // Show GND name even if no damage data
      layer.bindTooltip(name !== 'Unknown' ? name : 'No data available', {
        permanent: false,
        direction: 'center',
        className: mapTheme === 'dark' ? 'dark-tooltip' : 'light-tooltip'
      })
    }

    layer.on({
      click: () => {
        setSelectedGND(code || null)
      }
    })
  }, [aggregatedData, mapTheme, findDataForFeature])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map data...</p>
        </div>
      </div>
    )
  }

  if (!gndGeoJSON) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            GND GeoJSON Required
          </h2>
          <p className="text-gray-600 mb-4">
            Please place your GND GeoJSON file at <code className="bg-gray-100 px-2 py-1 rounded">/public/gnd.geojson</code>
          </p>
          <p className="text-sm text-gray-500">
            The file should be a valid GeoJSON FeatureCollection with GND polygons.
            Each feature should have properties containing <code>gnd_code</code> and <code>gnd_name</code>.
          </p>
        </div>
      </div>
    )
  }

  // Calculate center of Sri Lanka
  const center: [number, number] = [7.8731, 80.7718] // Approximate center
  const zoom = 8

  return (
    <div className="relative">
      {/* Mobile Backdrop Overlay */}
      {(showStatsPanel || showLegendPanel) && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-[999]"
          onClick={() => {
            setShowStatsPanel(false)
            setShowLegendPanel(false)
          }}
        />
      )}

      {/* Map Theme Toggle Button */}
      <div className="absolute bottom-4 left-4 z-[1001]">
        <button
          onClick={toggleMapTheme}
          className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-3 rounded-lg shadow-2xl border border-gray-700 hover:bg-gray-700 transition-all active:scale-95 flex items-center space-x-2"
          aria-label={`Switch to ${mapTheme === 'dark' ? 'light' : 'dark'} map`}
          title={`Switch to ${mapTheme === 'dark' ? 'light' : 'dark'} map`}
        >
          {mapTheme === 'dark' ? (
            <>
              <Sun className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Light Map</span>
            </>
          ) : (
            <>
              <Moon className="w-5 h-5" />
              <span className="hidden sm:inline text-sm font-medium">Dark Map</span>
            </>
          )}
        </button>
      </div>

      {/* Mobile Toggle Buttons */}
      <div className="md:hidden fixed bottom-4 right-4 z-[1001] flex flex-col space-y-2">
        <button
          onClick={() => setShowStatsPanel(!showStatsPanel)}
          className="bg-gray-900 text-white p-3 rounded-full shadow-2xl border border-gray-700 hover:bg-gray-800 transition-colors active:scale-95"
          aria-label="Toggle Statistics"
        >
          {showStatsPanel ? <X className="w-5 h-5" /> : <BarChart3 className="w-5 h-5" />}
        </button>
        <button
          onClick={() => setShowLegendPanel(!showLegendPanel)}
          className="bg-gray-900 text-white p-3 rounded-full shadow-2xl border border-gray-700 hover:bg-gray-800 transition-colors active:scale-95"
          aria-label="Toggle Legend"
        >
          {showLegendPanel ? <X className="w-5 h-5" /> : <Info className="w-5 h-5" />}
        </button>
      </div>

      {/* Stats Cards */}
      <div className={`fixed md:absolute top-16 md:top-4 left-0 md:left-4 right-0 md:right-auto z-[1000] space-y-3 max-w-full md:max-w-sm transition-all duration-300 ${
        showStatsPanel ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full pointer-events-none md:opacity-100 md:translate-x-0'
      }`}>
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-none md:rounded-xl shadow-2xl p-4 md:p-5 border-0 md:border border-gray-700 backdrop-blur-sm mx-4 md:mx-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-white text-sm md:text-base flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden sm:inline">Damage Statistics</span>
              <span className="sm:hidden">Stats</span>
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={loadAggregatedData}
                disabled={refreshing}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 text-white ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowStatsPanel(false)}
                className="md:hidden p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
                aria-label="Close Statistics"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
          <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-gray-300 text-xs md:text-sm">Total Reports:</span>
              <span className="font-bold text-white text-base md:text-lg">{stats.totalReports}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-gray-300 text-xs md:text-sm">Total Damage:</span>
              <span className="font-bold text-yellow-400 text-base md:text-lg">LKR {stats.totalDamage.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-800 rounded-lg">
              <span className="text-gray-300 text-xs md:text-sm">Affected Residents:</span>
              <span className="font-bold text-red-400 text-base md:text-lg">{stats.totalAffected}</span>
            </div>
            <div className="pt-2 md:pt-3 border-t border-gray-700">
              <div className="text-gray-400 mb-1 md:mb-2 text-xs uppercase tracking-wide">Most Damaged Area</div>
              <div className="font-bold text-white text-sm md:text-base truncate">{stats.mostDamagedGND.name}</div>
              <div className="text-gray-400 text-xs mt-1">{stats.mostDamagedGND.count} reports</div>
            </div>
          </div>
        </div>
      </div>

      <div className={`fixed md:absolute top-16 md:top-4 right-0 md:right-4 left-0 md:left-auto z-[1000] bg-gradient-to-br from-gray-900 to-gray-800 rounded-none md:rounded-xl shadow-2xl p-4 md:p-5 max-w-full md:max-w-xs border-0 md:border border-gray-700 backdrop-blur-sm mx-4 md:mx-0 transition-all duration-300 ${
        showLegendPanel ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full pointer-events-none md:opacity-100 md:translate-x-0'
      }`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-white mb-0 text-sm md:text-base">Legend</h3>
          <button
            onClick={() => setShowLegendPanel(false)}
            className="md:hidden p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
            aria-label="Close Legend"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
          <div className="flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 bg-gray-800 rounded-lg">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded shadow-lg flex-shrink-0" style={{ backgroundColor: '#dc2626', opacity: 0.8 }}></div>
            <span className="text-white font-medium text-xs md:text-sm">High Damage</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 bg-gray-800 rounded-lg">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded shadow-lg flex-shrink-0" style={{ backgroundColor: '#f59e0b', opacity: 0.8 }}></div>
            <span className="text-white font-medium text-xs md:text-sm">Medium Damage</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 bg-gray-800 rounded-lg">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded shadow-lg flex-shrink-0" style={{ backgroundColor: '#10b981', opacity: 0.8 }}></div>
            <span className="text-white font-medium text-xs md:text-sm">Low Damage</span>
          </div>
          <div className="flex items-center space-x-2 md:space-x-3 p-1.5 md:p-2 bg-gray-800 rounded-lg">
            <div className="w-4 h-4 md:w-5 md:h-5 rounded shadow-lg border-2 border-gray-600 flex-shrink-0" style={{ backgroundColor: '#1f2937', opacity: 0.5 }}></div>
            <span className="text-gray-400 font-medium text-xs md:text-sm">No Data</span>
          </div>
        </div>
        {selectedGND && (() => {
          // Find data by code
          const selectedData = Object.values(aggregatedData).find((item: any) => item.code === selectedGND)
          return selectedData ? (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="font-bold text-white mb-3 text-sm">Selected Area</h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center space-x-2 p-2 bg-gray-800 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  <span className="text-white">{selectedData.count} reports</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-gray-800 rounded-lg">
                  <DollarSign className="w-4 h-4 text-yellow-400" />
                  <span className="text-white">LKR {selectedData.totalDamage.toLocaleString()}</span>
                </div>
                <div className="flex items-center space-x-2 p-2 bg-gray-800 rounded-lg">
                  <Users className="w-4 h-4 text-red-400" />
                  <span className="text-white">{selectedData.totalAffected} affected</span>
                </div>
              </div>
            </div>
          ) : null
        })()}
      </div>

      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: 'calc(100vh - 200px)', width: '100%' }}
        zoomControl={true}
        className={mapTheme === 'dark' ? 'dark-map z-0' : 'light-map z-0'}
        key={mapTheme}
      >
        {mapTheme === 'dark' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains={['a', 'b', 'c', 'd']}
            errorTileUrl="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            subdomains={['a', 'b', 'c']}
          />
        )}
        {gndGeoJSON && (
          <GeoJSON
            key={`gnd-${refreshKey}`}
            data={gndGeoJSON as any}
            style={getStyle}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>
    </div>
  )
}

