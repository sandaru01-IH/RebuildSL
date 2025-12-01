import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { aggregateDamageByGND } from '@/lib/utils/gnd-matcher'

// Disable caching for this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables:', {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      })
      // Return 200 with empty data so app doesn't break
      return NextResponse.json(
        { 
          aggregated: {},
          warning: 'Server configuration error - check environment variables'
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    let supabase
    try {
      supabase = createSupabaseAdminClient()
    } catch (supabaseError: any) {
      console.error('❌ Error creating Supabase client:', {
        message: supabaseError?.message,
        stack: supabaseError?.stack
      })
      // Return 200 with empty data so app doesn't break
      return NextResponse.json(
        { 
          aggregated: {},
          warning: 'Database connection error'
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    // Test connection first
    const { error: testError } = await supabase.from('damage_reports').select('id').limit(1)
    if (testError) {
      console.error('❌ Cannot access damage_reports table:', {
        message: testError.message,
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      })
      return NextResponse.json(
        { 
          aggregated: {},
          warning: 'Cannot access database table. Check Supabase connection and table permissions.'
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    // Fetch all reports - no approval needed, all submissions appear immediately
    // Use .order() to ensure we get fresh data and avoid any caching
    const { data: reports, error } = await supabase
      .from('damage_reports')
      .select('gnd_code, gnd_name, damage_level, estimated_damage_lkr, affected_residents, property_type')
      .order('created_at', { ascending: false })
      // No status filter - show all reports immediately
    
    if (error) {
      console.error('❌ Supabase query error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
      // Return 200 with empty data so app doesn't break
      return NextResponse.json(
        { 
          aggregated: {},
          warning: 'Failed to fetch reports from database'
        },
        { 
          status: 200,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      )
    }

    // Filter out reports without GND name for aggregation
    // (Reports without GND name won't show on map but will be counted in stats)
    const reportsWithGND = (reports || []).filter(r => r && r.gnd_name && r.gnd_name.trim())

    // Aggregate by GND
    let aggregated = {}
    try {
      aggregated = aggregateDamageByGND(reportsWithGND)
    } catch (aggError: any) {
      console.error('Error in aggregation:', aggError)
      // Return empty aggregated data rather than failing
      aggregated = {}
    }
    
    // Minimal logging - only log if there are issues
    if (reports && reports.length > 0 && Object.keys(aggregated).length === 0) {
      const reportsWithoutGND = (reports || []).filter(r => !r?.gnd_name || !r.gnd_name.trim())
      if (reportsWithoutGND.length > 0) {
        console.warn(`⚠️ ${reportsWithoutGND.length} reports without GND name - they won't appear on map`)
      }
    }

    // Add cache-control headers to prevent caching
    return NextResponse.json({ aggregated }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error: any) {
    console.error('❌ Unexpected error in aggregate reports:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    // Return 200 with empty data so app doesn't break
    return NextResponse.json(
      { 
        aggregated: {},
        warning: 'An error occurred while processing data'
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )
  }
}

