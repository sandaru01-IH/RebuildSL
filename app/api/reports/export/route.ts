import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/utils/auth'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import * as geojson from 'geojson'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseAdminClient()

    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'csv'

    // Fetch all reports
    const { data: reports, error } = await supabase
      .from('damage_reports')
      .select('*')

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    if (format === 'csv') {
      const csv = Papa.unparse(reports || [])
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="damage_reports.csv"'
        }
      })
    } else if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(reports || [])
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Damage Reports')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="damage_reports.xlsx"'
        }
      })
    } else if (format === 'geojson') {
      const features = (reports || []).map(report => {
        if (report.location) {
          // Parse PostGIS POINT format
          const match = report.location.match(/POINT\(([^ ]+) ([^ ]+)\)/)
          if (match) {
            const lng = parseFloat(match[1])
            const lat = parseFloat(match[2])
            return geojson.parse(
              { lat, lng },
              { Point: ['lat', 'lng'] }
            )
          }
        }
        return null
      }).filter(Boolean)

      const geoJSON = {
        type: 'FeatureCollection',
        features: features
      }

      return NextResponse.json(geoJSON, {
        headers: {
          'Content-Type': 'application/geo+json',
          'Content-Disposition': 'attachment; filename="damage_reports.geojson"'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Error in export reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

