import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { matchPointToGND } from '@/lib/utils/gnd-matcher'
import { loadGNDGeoJSON } from '@/lib/utils/gnd-loader'

/**
 * This endpoint can be called to retroactively match GND codes for reports
 * that were submitted without GND matching (e.g., if GeoJSON wasn't available)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseAdminClient()

    // Load GND GeoJSON
    let gndGeoJSON = await loadGNDGeoJSON()
    
    if (!gndGeoJSON) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                     (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
      const gndUrl = `${baseUrl}/gnd.geojson`
      
      try {
        const response = await fetch(gndUrl)
        if (response.ok) {
          gndGeoJSON = await response.json()
        }
      } catch (fetchError) {
        return NextResponse.json(
          { error: 'GND GeoJSON not available' },
          { status: 500 }
        )
      }
    }

    if (!gndGeoJSON) {
      return NextResponse.json(
        { error: 'Could not load GND GeoJSON' },
        { status: 500 }
      )
    }

    // Fetch all reports without GND codes
    const { data: reports, error } = await supabase
      .from('damage_reports')
      .select('id, location')
      .is('gnd_code', null)
      .not('location', 'is', null)

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    let updated = 0
    let failed = 0

    // Update each report with GND code
    for (const report of reports || []) {
      try {
        // Parse location from PostGIS format: POINT(lng lat)
        const locationMatch = report.location?.match(/POINT\(([^ ]+) ([^ ]+)\)/)
        if (!locationMatch) continue

        const lng = parseFloat(locationMatch[1])
        const lat = parseFloat(locationMatch[2])

        const match = matchPointToGND(lat, lng, gndGeoJSON!)
        if (match) {
          const { error: updateError } = await supabase
            .from('damage_reports')
            .update({
              gnd_code: match.code,
              gnd_name: match.name
            })
            .eq('id', report.id)

          if (updateError) {
            console.error('Error updating report:', updateError)
            failed++
          } else {
            updated++
          }
        } else {
          failed++
        }
      } catch (err) {
        console.error('Error processing report:', err)
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      updated,
      failed,
      total: reports?.length || 0
    }, { status: 200 })
  } catch (error) {
    console.error('Error in refresh GND codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

