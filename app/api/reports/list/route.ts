import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase/server'
import { getAdminUser } from '@/lib/utils/auth'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser(request)

    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createSupabaseAdminClient()

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const gndCode = searchParams.get('gnd_code')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort_by') || 'created_at'
    const sortOrder = searchParams.get('sort_order') || 'desc'

    // Build query
    let query = supabase
      .from('damage_reports')
      .select('*', { count: 'exact' })

    if (gndCode) {
      query = query.eq('gnd_code', gndCode)
    }

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching reports:', error)
      return NextResponse.json(
        { error: 'Failed to fetch reports' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { data: data || [], count: count || 0 },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in list reports:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

