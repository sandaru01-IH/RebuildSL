'use client'

import type { FeatureCollection } from 'geojson'

let cachedGeoJSON: FeatureCollection | null = null

/**
 * Loads GND GeoJSON from public folder (client-side)
 */
export async function loadGNDGeoJSONClient(): Promise<FeatureCollection | null> {
  if (cachedGeoJSON) {
    return cachedGeoJSON
  }

  try {
    const response = await fetch('/gnd.geojson')
    if (!response.ok) {
      throw new Error('Failed to fetch GeoJSON')
    }
    const data = await response.json()
    cachedGeoJSON = data as FeatureCollection
    return cachedGeoJSON
  } catch (error) {
    console.error('Error loading GND GeoJSON:', error)
    return null
  }
}

/**
 * Extracts unique GND list from GeoJSON
 */
export function extractGNDList(geoJSON: FeatureCollection): Array<{ code: string; name: string }> {
  const gndMap = new Map<string, { code: string; name: string }>()

  geoJSON.features.forEach(feature => {
    const code = feature.properties?.gnd_code || 
                 feature.properties?.code || 
                 feature.properties?.GND_CODE ||
                 feature.properties?.shapeID
    const name = feature.properties?.gnd_name || 
                 feature.properties?.name || 
                 feature.properties?.GND_NAME ||
                 feature.properties?.shapeName

    if (code && name) {
      // Use name as key to avoid duplicates, but store both code and name
      const nameKey = String(name).toLowerCase().trim()
      if (!gndMap.has(nameKey)) {
        gndMap.set(nameKey, { code: String(code), name: String(name) })
      }
    }
  })

  // Convert to array and sort by name
  return Array.from(gndMap.values())
    .sort((a, b) => a.name.localeCompare(b.name))
}

