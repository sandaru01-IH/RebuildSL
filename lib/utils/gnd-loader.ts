import type { FeatureCollection } from 'geojson'
import { readFile } from 'fs/promises'
import { join } from 'path'

let cachedGeoJSON: FeatureCollection | null = null

/**
 * Loads GND GeoJSON from file system or returns cached version
 * In production, you might want to load this from Supabase Storage or a CDN
 */
export async function loadGNDGeoJSON(): Promise<FeatureCollection | null> {
  if (cachedGeoJSON) {
    return cachedGeoJSON
  }

  try {
    // Try to load from public directory
    const filePath = join(process.cwd(), 'public', 'gnd.geojson')
    const fileContents = await readFile(filePath, 'utf-8')
    cachedGeoJSON = JSON.parse(fileContents) as FeatureCollection
    return cachedGeoJSON
  } catch (error) {
    console.error('Error loading GND GeoJSON:', error)
    return null
  }
}

/**
 * Loads GND GeoJSON from a URL (for client-side or API routes)
 */
export async function loadGNDGeoJSONFromURL(url: string): Promise<FeatureCollection | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error('Failed to fetch GeoJSON')
    }
    const data = await response.json()
    return data as FeatureCollection
  } catch (error) {
    console.error('Error loading GND GeoJSON from URL:', error)
    return null
  }
}

