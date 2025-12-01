import * as turf from '@turf/turf'
import type { FeatureCollection, Point, Polygon } from 'geojson'

export interface GNDFeature {
  code: string
  name: string
  geometry: Polygon
}

/**
 * Matches a point (latitude, longitude) to a GND polygon from GeoJSON
 * Returns the GND code and name if found, null otherwise
 */
export function matchPointToGND(
  lat: number,
  lng: number,
  gndGeoJSON: FeatureCollection
): { code: string; name: string } | null {
  const point: Point = {
    type: 'Point',
    coordinates: [lng, lat] // GeoJSON uses [lng, lat]
  }

  for (const feature of gndGeoJSON.features) {
    if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
      const polygon = feature.geometry
      const isInside = turf.booleanPointInPolygon(point, polygon)
      
      if (isInside) {
        // Extract GND code and name from feature properties
        // Support multiple property name formats
        const code = feature.properties?.gnd_code || 
                     feature.properties?.code || 
                     feature.properties?.GND_CODE ||
                     feature.properties?.shapeID
        const name = feature.properties?.gnd_name || 
                     feature.properties?.name || 
                     feature.properties?.GND_NAME ||
                     feature.properties?.shapeName || 
                     'Unknown'
        
        if (code) {
          return { code: String(code), name: String(name) }
        }
      }
    }
  }

  return null
}

/**
 * Aggregates damage reports by GND code
 */
export function aggregateDamageByGND(reports: Array<{
  gnd_code: string | null
  gnd_name?: string | null
  damage_level: number
  estimated_damage_lkr: number
  affected_residents: number
  property_type: string
}>) {
  // Use GND name as primary key for aggregation (normalized to lowercase)
  const aggregated: Record<string, {
    code: string
    name: string
    count: number
    totalDamage: number
    avgDamageLevel: number
    totalAffected: number
    propertyTypes: Record<string, number>
    severity: 'low' | 'medium' | 'high'
  }> = {}

  reports.forEach(report => {
    // Require at least GND name for aggregation
    if (!report.gnd_name) {
      return // Skip silently - no need to log every missing name
    }

    // Normalize name: lowercase, trim, and remove extra whitespace
    // This normalization MUST match exactly what the map does
    const nameKey = report.gnd_name.toLowerCase().trim().replace(/\s+/g, ' ')

    if (!aggregated[nameKey]) {
      aggregated[nameKey] = {
        code: report.gnd_code ? String(report.gnd_code) : nameKey, // Use code if available, ensure it's a string
        name: report.gnd_name, // Store original name
        count: 0,
        totalDamage: 0,
        avgDamageLevel: 0,
        totalAffected: 0,
        propertyTypes: {},
        severity: 'low'
      }
    } else {
      // If we already have this GND but with a different code, update the code if current is null/empty
      if (!aggregated[nameKey].code || aggregated[nameKey].code === nameKey) {
        if (report.gnd_code) {
          aggregated[nameKey].code = String(report.gnd_code)
        }
      }
    }

    const agg = aggregated[nameKey]
    agg.count++
    agg.totalDamage += Number(report.estimated_damage_lkr)
    agg.avgDamageLevel += report.damage_level
    agg.totalAffected += report.affected_residents
    agg.propertyTypes[report.property_type] = (agg.propertyTypes[report.property_type] || 0) + 1
  })

  // Calculate averages and determine severity
  Object.values(aggregated).forEach(agg => {
    agg.avgDamageLevel = agg.avgDamageLevel / agg.count
    
    // Determine severity based on average damage level and total damage
    if (agg.avgDamageLevel >= 7 || agg.totalDamage >= 5000000) {
      agg.severity = 'high'
    } else if (agg.avgDamageLevel >= 4 || agg.totalDamage >= 2000000) {
      agg.severity = 'medium'
    } else {
      agg.severity = 'low'
    }
  })

  return aggregated
}

